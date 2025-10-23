import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WhatsappOtp } from './whatsapp-otp.entity';

type SendTemplateParams = {
    to: string; // E.164 without + for WhatsApp Cloud (e.g., 6017...)
    code: string;
    template: string; // e.g., 'ixora_mbmb'
    language?: string; // default 'en'
};

@Injectable()
export class WhatsappService {
    constructor(
        @InjectRepository(WhatsappOtp) private readonly otpRepo: Repository<WhatsappOtp>,
        private readonly config: ConfigService,
    ) { }

    private normalizePhone(phone: string): string {
        let p = (phone || '').trim();
        p = p.replace(/^\+/, '');
        // Ensure Malaysian country code if looks like local starting with 01/017 etc. Not forcing here; assume caller passes E.164 without plus
        return p;
    }

    private generateCode(): string {
        // 6-digit numeric code, no leading 0 issues
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async requestOtp(rawPhone: string, purpose: 'registration' | 'login' | 'reset_password' = 'registration') {
        const to = this.normalizePhone(rawPhone);
        if (!/^\d{7,15}$/.test(to)) {
            throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
        }

        // Throttle: prevent re-send within 45 seconds
        const recent = await this.otpRepo.findOne({ where: { phone: to, purpose, status: 'pending' }, order: { createdAt: 'DESC' } });
        if (recent?.lastSentAt) {
            const diff = Date.now() - new Date(recent.lastSentAt).getTime();
            if (diff < 45_000) {
                const wait = Math.ceil((45_000 - diff) / 1000);
                throw new HttpException(`Please wait ${wait}s before requesting another code`, HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        // Invalidate older pending codes for same phone/purpose
        await this.otpRepo.createQueryBuilder()
            .update(WhatsappOtp)
            .set({ status: 'expired' as any })
            .where('phone = :to AND purpose = :purpose AND status = :status', { to, purpose, status: 'pending' })
            .execute();

        const code = this.generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const record = this.otpRepo.create({ phone: to, purpose, code, status: 'pending' as any, attempts: 0, maxAttempts: 5, expiresAt, lastSentAt: new Date() });
        const saved = await this.otpRepo.save(record);

        // Send via WhatsApp Cloud API using template with a single variable (code)
        const messageId = await this.sendTemplate({ to, code, template: this.config.get('WA_TEMPLATE') || 'ixora_mbmb', language: 'en' });
        if (messageId) {
            saved.messageId = messageId;
            await this.otpRepo.save(saved);
        }

        return { status: 'ok', id: saved.id, expires_at: expiresAt.toISOString(), to };
    }

    async verifyOtp(rawPhone: string, code: string, purpose: 'registration' | 'login' | 'reset_password' = 'registration') {
        const to = this.normalizePhone(rawPhone);
        const rec = await this.otpRepo.findOne({ where: { phone: to, purpose, status: 'pending' }, order: { createdAt: 'DESC' } });
        if (!rec) throw new HttpException('No pending code. Please request again.', HttpStatus.NOT_FOUND);
        if (new Date(rec.expiresAt).getTime() < Date.now()) {
            rec.status = 'expired' as any;
            await this.otpRepo.save(rec);
            throw new HttpException('Code expired. Please request again.', HttpStatus.GONE);
        }
        if (rec.attempts >= (rec.maxAttempts ?? 5)) {
            rec.status = 'expired' as any;
            await this.otpRepo.save(rec);
            throw new HttpException('Too many attempts. Please request again later.', HttpStatus.TOO_MANY_REQUESTS);
        }
        rec.attempts += 1;

        if (rec.code !== String(code).trim()) {
            await this.otpRepo.save(rec);
            throw new HttpException('Invalid code', HttpStatus.BAD_REQUEST);
        }

        rec.status = 'verified' as any;
        await this.otpRepo.save(rec);
        return { status: 'verified', phone: to, purpose };
    }

    private async sendTemplate({ to, code, template, language = 'en' }: SendTemplateParams): Promise<string | null> {
        const WA_TOKEN = this.config.get<string>('WA_TOKEN'); // Permanent/Long-lived token
        const WA_PHONE_ID = this.config.get<string>('WA_PHONE_ID') || '744813312052339';
        const base = this.config.get<string>('WA_BASE') || 'https://graph.facebook.com/v20.0';
        if (!WA_TOKEN) {
            // In dev, we allow skipping actual send
            return null;
        }
        const url = `${base}/${WA_PHONE_ID}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
                name: template,
                language: { code: language },
                components: [
                    { type: 'body', parameters: [{ type: 'text', text: code }] }
                ],
                category: 'AUTHENTICATION',
            },
        } as any;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WA_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new HttpException(`WhatsApp send failed: ${res.status} ${err}`, HttpStatus.BAD_GATEWAY);
        }
        const data = await res.json().catch(() => ({}));
        const messageId = data?.messages?.[0]?.id || null;
        return messageId;
    }
}

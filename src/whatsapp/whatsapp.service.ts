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


type OtpPurpose = 'registration' | 'login' | 'reset_password';

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

    async requestOtp(
        rawPhone: string,
        purpose: OtpPurpose = 'registration'
    ) {
        // Normalize to digits-only E.164 (no plus) for storage and matching
        const to = this.normalizePhone(rawPhone);
        if (!/^\d{7,15}$/.test(to)) {
            throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);
        }

        // Throttle within 45s for same phone/purpose/pending
        const recent = await this.otpRepo.findOne({
            where: { phone: to, purpose, status: 'pending' },
            order: { createdAt: 'DESC' },
        });

        if (recent?.lastSentAt) {
            const diffMs = Date.now() - new Date(recent.lastSentAt).getTime();
            if (diffMs < 45_000) {
                const wait = Math.ceil((45_000 - diffMs) / 1000);
                throw new HttpException(
                    `Please wait ${wait}s before requesting another code`,
                    HttpStatus.TOO_MANY_REQUESTS
                );
            }
        }

        // Expire older pending codes for same phone/purpose
        await this.otpRepo
            .createQueryBuilder()
            .update(WhatsappOtp)
            .set({ status: 'expired' as any })
            .where('phone = :to AND purpose = :purpose AND status = :status', {
                to,
                purpose,
                status: 'pending',
            })
            .execute();

        const code = this.generateCode(); // implement: e.g., 6 digits
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Persist first, so we can track even if send fails
        const record = this.otpRepo.create({
            phone: to,
            purpose,
            code,
            status: 'pending' as any,
            attempts: 0,
            maxAttempts: 5,
            expiresAt,
            lastSentAt: new Date(),
        });
        const saved = await this.otpRepo.save(record);

        // Send via 360dialog template (body has single variable: the code)
        const templateName = this.config.get<string>('WHATSAPP_TEMPLATE_NAME') || 'ixora_mbmb';
        const language = this.config.get<string>('WHATSAPP_TEMPLATE_LANG') || 'en'; // must match the approved locale variant in 360dialog
        const messageId = await this.sendTemplateVia360Dialog({ to, code, template: templateName, language });

        if (messageId) {
            saved.messageId = messageId;
            saved.lastSentAt = new Date(); // ensure updated on successful send
            await this.otpRepo.save(saved);
        }

        return {
            status: 'ok',
            id: saved.id,
            expires_at: expiresAt.toISOString(),
            to,
        };
    }

    private async sendTemplateVia360Dialog(opts: {
        to: string;
        code: string;
        template: string;
        language: string; // e.g., 'en', 'en_US', 'ms', etc., must match template variant
    }): Promise<string | undefined> {
        const apiKey = this.config.get<string>('WHATSAPP_API_KEY');
        const url = this.config.get<string>('WHATSAPP_API_URL') || 'https://waba-v2.360dialog.io/messages';
        const namespace = this.config.get<string>('WHATSAPP_TEMPLATE_NAMESPACE'); // required only for v1

        if (!apiKey) {
            throw new Error('WHATSAPP_API_KEY missing');
        }

        // 360dialog generally expects digits-only E.164 in "to"
        const toParam = opts.to.replace(/^\+/, '');

        // Decide payload shape based on URL (v2 vs v1)
        const isV1 = /\/v1\//.test(url) || /waba\.360dialog\.io/.test(url);
        const urlButtonEnabled = (this.config.get<string>('WHATSAPP_TEMPLATE_URL_BUTTON') || '0').toString() === '1';
        const urlButtonIndex = parseInt(this.config.get<string>('WHATSAPP_TEMPLATE_URL_BUTTON_INDEX') || '0', 10) || 0;
        const urlButtonParam = this.config.get<string>('WHATSAPP_TEMPLATE_URL_PARAM') || opts.code;

        // Build components array with required body param and optional URL button param
        const baseComponents: any[] = [
            { type: 'body', parameters: [{ type: 'text', text: opts.code }] },
        ];
        if (urlButtonEnabled) {
            baseComponents.push({
                type: 'button',
                sub_type: 'url',
                index: String(urlButtonIndex),
                parameters: [{ type: 'text', text: urlButtonParam }],
            });
        }

        let body: any = isV1
            ? {
                to: toParam,
                type: 'template',
                template: {
                    namespace: namespace || '',
                    name: opts.template,
                    language: { policy: 'deterministic', code: opts.language },
                    components: baseComponents,
                },
            }
            : {
                messaging_product: 'whatsapp',
                to: toParam,
                type: 'template',
                template: {
                    name: opts.template,
                    language: { code: opts.language },
                    components: baseComponents,
                },
            };

        try {
            const doSend = async (b: any) => {
                return fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'D360-API-KEY': apiKey,
                    },
                    body: JSON.stringify(b),
                });
            };

            let res = await doSend(body);
            const text = await res.text();
            let data: any = {};
            try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
            if (!res.ok) {
                // Auto-retry: if API complains about missing URL button parameter, inject it and resend once
                const details: string | undefined = data?.error?.error_data?.details || data?.details;
                const needsUrlParam = res.status === 400 && details && /Button at index (\d+).*type\s*Url.*requires a parameter/i.test(details);
                if (needsUrlParam) {
                    const m = details.match(/Button at index (\d+)/i);
                    const idx = m ? parseInt(m[1], 10) : (isNaN(urlButtonIndex) ? 0 : urlButtonIndex);
                    const injectedComponents = [
                        ...baseComponents,
                        { type: 'button', sub_type: 'url', index: String(idx), parameters: [{ type: 'text', text: urlButtonParam }] },
                    ];
                    body = isV1
                        ? {
                            to: toParam,
                            type: 'template',
                            template: {
                                namespace: namespace || '',
                                name: opts.template,
                                language: { policy: 'deterministic', code: opts.language },
                                components: injectedComponents,
                            },
                        }
                        : {
                            messaging_product: 'whatsapp',
                            to: toParam,
                            type: 'template',
                            template: {
                                name: opts.template,
                                language: { code: opts.language },
                                components: injectedComponents,
                            },
                        };
                    res = await doSend(body);
                    const text2 = await res.text();
                    let data2: any = {};
                    try { data2 = text2 ? JSON.parse(text2) : {}; } catch { data2 = {}; }
                    if (!res.ok) {
                        const msg = `WhatsApp send failed (${res.status}): ${JSON.stringify(data2 || text2)}`;
                        throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
                    }
                    return data2?.messages?.[0]?.id;
                }
                const msg = `WhatsApp send failed (${res.status}): ${JSON.stringify(data || text)}`;
                throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
            }
            return data?.messages?.[0]?.id;
        } catch (err: any) {
            const msg = err?.message || 'WhatsApp send failed';
            throw new HttpException(msg, HttpStatus.BAD_GATEWAY);
        }
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

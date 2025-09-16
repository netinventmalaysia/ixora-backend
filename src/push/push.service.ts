import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';

@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);
    private readonly sendBuckets = new Map<number, number[]>(); // userId -> timestamps

    constructor(
        @InjectRepository(PushSubscription)
        private readonly repo: Repository<PushSubscription>,
    ) {
        // Configure VAPID details if available
        const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY;
        const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY;
        const contact = process.env.PUSH_CONTACT || 'mailto:admin@example.com';
        if (publicKey && privateKey) {
            webpush.setVapidDetails(contact, publicKey, privateKey);
        } else {
            this.logger.warn('PUSH_VAPID_PUBLIC_KEY / PRIVATE_KEY not set; /push/test will fail');
        }
    }

    getPublicKey() {
        const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY;
        if (!publicKey) throw new BadRequestException('Push not configured');
        return { publicKey };
    }

    generateVapidKeys() {
        // For ops use: generate once and store securely in vault/secrets.
        return webpush.generateVAPIDKeys(); // { publicKey, privateKey }
    }

    async upsertSubscription(userId: number, sub: any, userAgent?: string) {
        if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
            throw new BadRequestException('Invalid subscription');
        }
        let row = await this.repo.findOne({ where: { userId, endpoint: sub.endpoint } });
        if (!row) {
            row = this.repo.create({
                userId,
                endpoint: sub.endpoint,
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
                userAgent: userAgent ?? null,
                lastSeenAt: new Date(),
            });
        } else {
            row.p256dh = sub.keys.p256dh;
            row.auth = sub.keys.auth;
            row.userAgent = userAgent ?? row.userAgent ?? null;
            row.lastSeenAt = new Date();
        }
        const saved = await this.repo.save(row);
        return { id: saved.id, status: 'ok' };
    }

    async removeSubscription(userId: number, endpoint?: string, id?: number) {
        if (!endpoint && !id) throw new BadRequestException('endpoint or id required');
        let row: PushSubscription | null = null;
        if (id) row = await this.repo.findOne({ where: { id, userId } });
        if (!row && endpoint) row = await this.repo.findOne({ where: { endpoint, userId } });
        if (!row) return { status: 'ok' };
        await this.repo.remove(row);
        return { status: 'ok' };
    }

    private toWebPushSubscription(row: PushSubscription) {
        return {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
        };
    }

    async sendTest(options: { subscriptionId?: number; userId?: number; all?: boolean; title?: string; body?: string; url?: string; icon?: string; ttl?: number; }) {
        // Simple rate limit: assume admin will pass userId for own identity when calling; if not, limit globally (key 0)
        const limiterKey = options.userId ? options.userId : 0;
        const now = Date.now();
        const windowMs = 60_000;
        const max = 10; // 10 sends per minute
        const arr = this.sendBuckets.get(limiterKey) || [];
        const recent = arr.filter((t) => now - t < windowMs);
        if (recent.length >= max) {
            throw new HttpException('Rate limit exceeded for push test', 429);
        }
        recent.push(now);
        this.sendBuckets.set(limiterKey, recent);

        const title = options.title ?? 'Ixora Notification';
        const body = options.body ?? 'This is a test push notification.';
        const url = options.url ?? '/';
        const icon = options.icon ?? '/images/logo.png';
        const ttl = options.ttl ?? 60;
        const payload = JSON.stringify({ title, body, url, icon });

        let targets: PushSubscription[] = [];
        if (options.all) {
            targets = await this.repo.find();
        } else if (options.subscriptionId) {
            const one = await this.repo.findOne({ where: { id: options.subscriptionId } });
            if (one) targets = [one];
        } else if (options.userId) {
            targets = await this.repo.find({ where: { userId: options.userId } });
        }

        let sent = 0;
        const failedIds: number[] = [];

        for (const t of targets) {
            try {
                await webpush.sendNotification(this.toWebPushSubscription(t), payload, { TTL: ttl });
                sent++;
            } catch (err: any) {
                const status = err?.statusCode ?? err?.status;
                this.logger.warn(`Push send failed for ${t.id}: ${status}`);
                if (status === 404 || status === 410) {
                    // stale subscription; remove
                    await this.repo.remove(t);
                } else {
                    failedIds.push(t.id);
                }
            }
        }

        return { sent, failed: failedIds.length, failedIds: failedIds.length ? failedIds : undefined };
    }

    async list(opts: { userId?: number; limit?: number; offset?: number }) {
        const take = opts.limit && opts.limit > 0 ? opts.limit : 50;
        const skip = opts.offset && opts.offset >= 0 ? opts.offset : 0;
        const where = opts.userId ? { userId: opts.userId } : {};
        const [rows, total] = await this.repo.findAndCount({ where, take, skip, order: { updatedAt: 'DESC' } });
        const data = rows.map((r) => ({
            id: r.id,
            userId: r.userId,
            endpoint: r.endpoint,
            last_seen_at: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
            created_at: r.createdAt ? r.createdAt.toISOString() : null,
            updated_at: r.updatedAt ? r.updatedAt.toISOString() : null,
        }));
        return { data, total, limit: take, offset: skip };
    }
}

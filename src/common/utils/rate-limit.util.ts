/** Simple in-memory rate limiter keyed by a string (e.g. IP + route). */
export class SimpleRateLimiter {
    private buckets = new Map<string, { count: number; resetAt: number }>();

    constructor(private readonly windowMs: number, private readonly max: number) { }

    /** Returns true if allowed, false if rate-limited. */
    take(key: string): boolean {
        const now = Date.now();
        const bucket = this.buckets.get(key);
        if (!bucket || bucket.resetAt < now) {
            this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
            return true;
        }
        if (bucket.count < this.max) {
            bucket.count += 1;
            return true;
        }
        return false;
    }
}

export class TokenBucket {
    private capacity: number;
    private refillRate: number;
    private tokens: number;
    private lastRefill: number;
    private queue: (() => void)[] = [];
    public constructor(capacity: number, refillRate: number) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    public async acquire(): Promise<void> {
        this.refill();
        if (this.queue.length > 0 || this.tokens < 1) {
            return new Promise((resolve) => {
                this.queue.push(resolve);
                this.scheduleRefillDrain();
            });
        }
        this.tokens--;
        return Promise.resolve();
    }
    private refill(): void {
        const now = Date.now();
        const timeSinceLastRefill = now - this.lastRefill;
        const tokensToAdd = (timeSinceLastRefill / 1000) * this.refillRate;
        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    private scheduleRefillDrain(): void {
        setTimeout(() => {
            this.refill();
            this.drainQueue();
            if (this.queue.length > 0) {
                this.scheduleRefillDrain();
            }
        }, 1000 / this.refillRate);
    }
    private drainQueue(): void {
        while (this.tokens >= 1 && this.queue.length > 0) {
            const resolve = this.queue.shift();
            resolve!();
            this.tokens--;
        }
    }
    public getStatus(): { tokens: number; capacity: number; queuedRequests: number; refillRate: number } {
        return { tokens: this.tokens, capacity: this.capacity, queuedRequests: this.queue.length, refillRate: this.refillRate };
    }
}

export const publicApiBucket = new TokenBucket(
    parseInt(process.env.PUBLIC_API_CAPACITY || "3", 10),
    parseFloat(process.env.PUBLIC_API_REFILL_RATE || "0.2"),
);

export const restfulApiBucket = new TokenBucket(
    parseInt(process.env.RESTFUL_API_CAPACITY || "10", 10),
    parseFloat(process.env.RESTFUL_API_REFILL_RATE || "0.5"),
);

export const exportApiBucket = new TokenBucket(
    parseInt(process.env.EXPORT_API_CAPACITY || "2", 10),
    parseFloat(process.env.EXPORT_API_REFILL_RATE || "0.02"),
);
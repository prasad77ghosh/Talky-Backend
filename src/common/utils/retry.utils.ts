export interface RetryPolicy {
    maxRetries: number;
    initialDelay: number; // in ms
    maxDelay: number;     // in ms
    factor: number;
    useJitter: boolean;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    useJitter: true,
};

/**
 * Error class to signal that a retry should NOT be attempted.
 */
export class NonRetryableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NonRetryableError";
    }
}

/**
 * Executes a function with a retry policy.
 */
export async function withRetry<T>(
    operation: (attempt: number) => Promise<T>,
    policy: Partial<RetryPolicy> = {},
    onRetry?: (error: any, attempt: number, delay: number) => void
): Promise<T> {
    const fullPolicy = { ...DEFAULT_RETRY_POLICY, ...policy };
    let lastError: any;

    for (let attempt = 0; attempt <= fullPolicy.maxRetries; attempt++) {
        try {
            return await operation(attempt);
        } catch (error) {
            lastError = error;

            if (error instanceof NonRetryableError) {
                throw error;
            }

            if (attempt >= fullPolicy.maxRetries) {
                break;
            }

            const delay = calculateDelay(attempt + 1, fullPolicy);
            
            if (onRetry) {
                onRetry(error, attempt + 1, delay);
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

function calculateDelay(attempt: number, policy: RetryPolicy): number {
    let delay = policy.initialDelay * Math.pow(policy.factor, attempt - 1);
    delay = Math.min(delay, policy.maxDelay);

    if (policy.useJitter) {
        // Add jitter: +/- 20% of the delay
        const jitter = delay * 0.2;
        const randomJitter = (Math.random() * 2 - 1) * jitter;
        delay = delay + randomJitter;
    }

    return Math.max(0, delay);
}

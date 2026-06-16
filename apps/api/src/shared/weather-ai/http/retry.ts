export interface RetryOptions {
  retries: number;
  baseDelayMs?: number;
  /** Return true if the error is worth retrying (e.g. 5xx / network, not 4xx). */
  isRetryable?: (err: unknown) => boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries with exponential backoff + full jitter. Jitter avoids the thundering
 * herd where many clients retry in lockstep after a shared outage.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const { retries, baseDelayMs = 200, isRetryable = () => true } = opts;
  let attempt = 0;

  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryable(err)) throw err;
      const backoff = baseDelayMs * 2 ** attempt;
      const delay = Math.random() * backoff; // full jitter
      attempt += 1;
      await sleep(delay);
    }
  }
}

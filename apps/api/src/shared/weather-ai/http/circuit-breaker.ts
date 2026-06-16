/**
 * Minimal circuit breaker. After `failureThreshold` consecutive failures the
 * circuit opens and fast-fails for `openMs`, sparing the upstream (and the
 * caller's latency budget) during an outage. A single trial request in
 * half-open state decides whether to close again.
 *
 * Hand-rolled deliberately: it keeps the dependency surface small and makes the
 * resilience strategy explicit and testable rather than hidden in a library.
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private failures = 0;
  private state: CircuitState = 'closed';
  private openedAt = 0;

  constructor(
    private readonly failureThreshold = 5,
    private readonly openMs = 15_000,
  ) {}

  get current(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.openMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open — upstream temporarily unavailable.');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}

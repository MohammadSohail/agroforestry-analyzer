import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and fast-fails', async () => {
    const breaker = new CircuitBreaker(2, 10_000);
    const boom = () => Promise.reject(new Error('boom'));

    await expect(breaker.execute(boom)).rejects.toThrow('boom');
    await expect(breaker.execute(boom)).rejects.toThrow('boom');
    expect(breaker.current).toBe('open');

    // Now fast-fails without invoking fn.
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(breaker.execute(fn)).rejects.toThrow(/open/i);
    expect(fn).not.toHaveBeenCalled();
  });

  it('half-opens after the cooldown and closes on success', async () => {
    const breaker = new CircuitBreaker(1, 0); // opens immediately, cools instantly
    await expect(breaker.execute(() => Promise.reject(new Error('x')))).rejects.toThrow();
    expect(breaker.current).toBe('open');

    const ok = await breaker.execute(() => Promise.resolve('recovered'));
    expect(ok).toBe('recovered');
    expect(breaker.current).toBe('closed');
  });
});

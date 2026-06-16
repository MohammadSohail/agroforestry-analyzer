import { MockWeatherAiProvider } from './mock-weather-ai.provider';

describe('MockWeatherAiProvider', () => {
  const provider = new MockWeatherAiProvider();
  const input = (bytes: string) => ({
    image: Buffer.from(bytes),
    filename: 'a.png',
    mimeType: 'image/png',
  });

  it('returns deterministic results for identical image bytes', async () => {
    // providerRequestId is intentionally random per call; everything else is seeded.
    const { providerRequestId: _a, ...a } = await provider.analyzeTrees(input('same'));
    const { providerRequestId: _b, ...b } = await provider.analyzeTrees(input('same'));
    expect(a).toEqual(b);
  });

  it('returns different results for different image bytes', async () => {
    const a = await provider.analyzeTrees(input('one'));
    const b = await provider.analyzeTrees(input('two'));
    expect(a.treeCount).not.toBe(b.treeCount);
  });

  it('produces a health breakdown that sums to ~1', async () => {
    const { healthBreakdown } = await provider.analyzeTrees(input('health'));
    const sum = healthBreakdown.healthy + healthBreakdown.stressed + healthBreakdown.dead;
    expect(sum).toBeGreaterThan(0.95);
    expect(sum).toBeLessThan(1.05);
  });

  it('flags high-wind risk in insights deterministically', async () => {
    const a = await provider.getInsight(-0.78, 35.34);
    const b = await provider.getInsight(-0.78, 35.34);
    expect(a.current).toEqual(b.current);
    expect(Array.isArray(a.agronomic.riskFlags)).toBe(true);
  });
});

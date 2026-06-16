import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import {
  AnalysisQuota,
  HealthBreakdown,
  TreeAnalysisInput,
  TreeAnalysisResult,
  WeatherAiProvider,
  WeatherInsight,
} from '../weather-ai.types';

/**
 * Deterministic, offline implementation of the WeatherAI provider.
 *
 * Lets the entire app run, be demoed, and be tested with **no API key and no
 * network**. Results are derived from a hash of the uploaded image so the same
 * image always yields the same analysis (stable demos + reproducible tests),
 * while different images yield plausibly different numbers.
 */
@Injectable()
export class MockWeatherAiProvider implements WeatherAiProvider {
  async analyzeTrees(input: TreeAnalysisInput): Promise<TreeAnalysisResult> {
    const seed = hashToInt(input.image);
    const rng = mulberry32(seed);

    const treeCount = 80 + Math.floor(rng() * 520); // 80–600
    const densityPerAcre = round(40 + rng() * 120, 1);
    const canopyCoveragePct = round(25 + rng() * 60, 1);
    const confidenceScore = round(0.7 + rng() * 0.29, 2);

    const healthy = round(0.45 + rng() * 0.45, 2);
    const dead = round(rng() * (1 - healthy) * 0.5, 2);
    const stressed = round(1 - healthy - dead, 2);
    const healthBreakdown: HealthBreakdown = { healthy, stressed, dead };

    const species = pick(rng, [
      'Grevillea robusta',
      'Acacia xanthophloea',
      'Eucalyptus grandis',
      'Croton megalocarpus',
      'Markhamia lutea',
    ]);

    return {
      treeCount,
      densityPerAcre,
      canopyCoveragePct,
      confidenceScore,
      speciesGuess: species,
      healthBreakdown,
      observations: buildObservations(canopyCoveragePct, stressed, dead),
      recommendations: buildRecommendations(stressed, dead, densityPerAcre),
      overlayImageUrl:
        'https://placehold.co/800x600/1f3d2b/9ae6b4/png?text=Canopy+Overlay+(mock)',
      providerRequestId: `mock_${randomUUID()}`,
    };
  }

  async getInsight(latitude: number, longitude: number): Promise<WeatherInsight> {
    const rng = mulberry32(hashToInt(Buffer.from(`${latitude},${longitude}`)));
    const temperatureC = round(14 + rng() * 18, 1);
    const humidityPct = Math.floor(45 + rng() * 50);
    const windKph = round(3 + rng() * 22, 1);
    const conditions = pick(rng, ['Clear', 'Partly cloudy', 'Overcast', 'Light rain', 'Showers']);

    const riskFlags: string[] = [];
    if (windKph > 18) riskFlags.push('high_wind');
    if (humidityPct > 85) riskFlags.push('fungal_pressure');
    if (temperatureC > 28) riskFlags.push('heat_stress');

    return {
      location: { latitude, longitude },
      current: { temperatureC, humidityPct, windKph, conditions },
      agronomic: {
        summary: `Conditions are ${conditions.toLowerCase()} at ${temperatureC}°C with ${humidityPct}% humidity. ${
          riskFlags.length
            ? 'Monitor canopy stress given current risk flags.'
            : 'Favourable window for canopy inspection and light pruning.'
        }`,
        riskFlags,
        recommendations: riskFlags.includes('fungal_pressure')
          ? ['Inspect lower canopy for fungal infection', 'Improve airflow via selective thinning']
          : ['Routine monitoring sufficient', 'Schedule next drone pass within 30 days'],
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getAnalysisQuota(): Promise<AnalysisQuota> {
    return {
      plan: 'mock',
      limit: 1000,
      used: 137,
      remaining: 863,
      resetsAt: firstOfNextMonth(),
    };
  }
}

// --- deterministic helpers ---

function hashToInt(buf: Buffer): number {
  const hex = createHash('sha256').update(buf).digest('hex').slice(0, 8);
  return parseInt(hex, 16);
}

/** Tiny seeded PRNG — deterministic given the same seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function buildObservations(canopy: number, stressed: number, dead: number): string[] {
  const out = [`Estimated canopy coverage of ${canopy}% across the surveyed area.`];
  if (stressed > 0.2) out.push('Visible clusters of stressed foliage in the north-east quadrant.');
  if (dead > 0.1) out.push('Standing dead wood detected — possible pest or drought damage.');
  if (canopy < 35) out.push('Sparse canopy suggests recent thinning or under-planting.');
  return out;
}

function buildRecommendations(stressed: number, dead: number, density: number): string[] {
  const out: string[] = [];
  if (dead > 0.1) out.push('Remove dead wood to reduce pest harbourage.');
  if (stressed > 0.2) out.push('Soil-test stressed zones and consider supplemental irrigation.');
  if (density > 120) out.push('Density is high — selective thinning will improve growth rates.');
  if (out.length === 0) out.push('Stand is healthy; maintain current management regime.');
  return out;
}

function firstOfNextMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

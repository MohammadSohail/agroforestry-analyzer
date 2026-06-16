import { Injectable, Logger } from '@nestjs/common';
import { UpstreamProviderException } from '../../../common/exceptions/domain.exception';
import { CircuitBreaker } from '../http/circuit-breaker';
import { withRetry } from '../http/retry';
import {
  AnalysisQuota,
  HealthBreakdown,
  TreeAnalysisInput,
  TreeAnalysisResult,
  WeatherAiProvider,
  WeatherInsight,
} from '../weather-ai.types';

export interface HttpProviderOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
}

/**
 * Live adapter for https://api.weather-ai.co.
 *
 * Wraps every call in: per-request timeout (AbortController) -> retry with
 * backoff+jitter on 5xx/network errors only -> circuit breaker. Upstream JSON is
 * mapped defensively into our domain types (tolerant of key-name variants), so
 * the rest of the app is insulated from the exact payload shape and from
 * transient upstream failures.
 */
@Injectable()
export class HttpWeatherAiProvider implements WeatherAiProvider {
  private readonly logger = new Logger(HttpWeatherAiProvider.name);
  private readonly breaker = new CircuitBreaker();

  constructor(private readonly options: HttpProviderOptions) {}

  async analyzeTrees(input: TreeAnalysisInput): Promise<TreeAnalysisResult> {
    const form = new FormData();
    form.append('image', new Blob([input.image], { type: input.mimeType }), input.filename);
    if (input.latitude !== undefined) form.append('lat', String(input.latitude));
    if (input.longitude !== undefined) form.append('lon', String(input.longitude));

    const json = await this.request<Record<string, unknown>>('POST', '/v1/trees/analyze', {
      body: form,
    });
    return mapTreeAnalysis(json);
  }

  async getInsight(latitude: number, longitude: number): Promise<WeatherInsight> {
    const query = `?lat=${latitude}&lon=${longitude}&ai=true`;
    const [weather, insights] = await Promise.all([
      this.request<Record<string, unknown>>('GET', `/v1/weather${query}`),
      this.request<Record<string, unknown>>('GET', `/v1/insights${query}`).catch(() => ({})),
    ]);
    return mapInsight(latitude, longitude, weather, insights);
  }

  async getAnalysisQuota(): Promise<AnalysisQuota> {
    const json = await this.request<Record<string, unknown>>('GET', '/v1/trees/quota');
    return mapQuota(json);
  }

  private async request<T>(
    method: string,
    path: string,
    init: { body?: FormData } = {},
  ): Promise<T> {
    const url = `${this.options.baseUrl}${path}`;

    return this.breaker.execute(() =>
      withRetry(
        async () => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
          try {
            const res = await fetch(url, {
              method,
              headers: { Authorization: `Bearer ${this.options.apiKey}` },
              body: init.body,
              signal: controller.signal,
            });

            this.logRateLimit(res);

            if (!res.ok) {
              const detail = await safeText(res);
              throw new HttpError(res.status, `WeatherAI ${method} ${path} -> ${res.status}: ${detail}`);
            }
            return (await res.json()) as T;
          } finally {
            clearTimeout(timer);
          }
        },
        {
          retries: this.options.maxRetries,
          isRetryable: (err) =>
            err instanceof HttpError ? err.status >= 500 : true, // network/abort -> retry
        },
      ),
    ).catch((err) => {
      this.logger.error(`WeatherAI request failed: ${(err as Error).message}`);
      throw new UpstreamProviderException(
        `WeatherAI provider call failed (${method} ${path}).`,
      );
    });
  }

  private logRateLimit(res: Response): void {
    const remaining = res.headers.get('X-RateLimit-Remaining');
    if (remaining !== null && Number(remaining) < 10) {
      this.logger.warn(`WeatherAI rate limit low: ${remaining} requests remaining.`);
    }
  }
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return '<unreadable body>';
  }
}

// --- defensive mappers (tolerant of upstream key-name variants) ---

function num(obj: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return fallback;
}

function str(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length) return v;
  }
  return null;
}

function strArray(obj: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

function mapTreeAnalysis(json: Record<string, unknown>): TreeAnalysisResult {
  const data = (json.data as Record<string, unknown>) ?? json;
  const health = (data.healthBreakdown ?? data.health ?? {}) as Record<string, unknown>;
  const healthBreakdown: HealthBreakdown = {
    healthy: num(health, ['healthy'], 0),
    stressed: num(health, ['stressed', 'moderate'], 0),
    dead: num(health, ['dead', 'unhealthy'], 0),
  };

  return {
    treeCount: Math.round(num(data, ['treeCount', 'tree_count', 'count'])),
    densityPerAcre: num(data, ['densityPerAcre', 'density_per_acre', 'density']),
    canopyCoveragePct: num(data, ['canopyCoveragePct', 'canopy_coverage', 'canopyCoverage']),
    confidenceScore: num(data, ['confidenceScore', 'confidence', 'confidence_score']),
    speciesGuess: str(data, ['speciesGuess', 'species', 'species_guess']),
    healthBreakdown,
    observations: strArray(data, ['observations', 'notes']),
    recommendations: strArray(data, ['recommendations', 'actions']),
    overlayImageUrl: str(data, ['overlayImageUrl', 'overlay_image_url', 'overlayUrl', 'overlay']),
    providerRequestId: str(json, ['requestId', 'request_id', 'id']),
  };
}

function mapInsight(
  latitude: number,
  longitude: number,
  weather: Record<string, unknown>,
  insights: Record<string, unknown>,
): WeatherInsight {
  const cur = (weather.current as Record<string, unknown>) ?? weather;
  const ai = (insights.data as Record<string, unknown>) ?? insights;
  return {
    location: { latitude, longitude },
    current: {
      temperatureC: num(cur, ['temperatureC', 'temp_c', 'temperature', 'temp']),
      humidityPct: num(cur, ['humidityPct', 'humidity']),
      windKph: num(cur, ['windKph', 'wind_kph', 'wind']),
      conditions: str(cur, ['conditions', 'condition', 'summary']) ?? 'Unknown',
    },
    agronomic: {
      summary: str(ai, ['summary', 'analysis', 'text']) ?? 'No AI summary available.',
      riskFlags: strArray(ai, ['riskFlags', 'risk_flags', 'risks']),
      recommendations: strArray(ai, ['recommendations', 'actions']),
    },
    generatedAt: new Date().toISOString(),
  };
}

function mapQuota(json: Record<string, unknown>): AnalysisQuota {
  const data = (json.data as Record<string, unknown>) ?? json;
  const limit = num(data, ['limit', 'monthlyLimit']);
  const used = num(data, ['used', 'count']);
  return {
    plan: str(data, ['plan', 'tier']) ?? 'unknown',
    limit,
    used,
    remaining: num(data, ['remaining'], Math.max(limit - used, 0)),
    resetsAt: str(data, ['resetsAt', 'resets_at', 'reset']) ?? new Date().toISOString(),
  };
}

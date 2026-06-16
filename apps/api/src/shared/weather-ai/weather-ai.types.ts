/**
 * Domain-facing contract for the WeatherAI provider.
 *
 * These types describe what *our* domain needs — deliberately decoupled from the
 * raw WeatherAI HTTP payloads. Adapters are responsible for mapping the upstream
 * shape into these types, so a change in the upstream JSON never leaks past the
 * adapter boundary.
 */

export interface TreeAnalysisInput {
  image: Buffer;
  filename: string;
  mimeType: string;
  /** Optional plot coordinates — improves the upstream species/agronomic guess. */
  latitude?: number;
  longitude?: number;
}

export interface HealthBreakdown {
  healthy: number;
  stressed: number;
  dead: number;
}

export interface TreeAnalysisResult {
  treeCount: number;
  densityPerAcre: number;
  canopyCoveragePct: number;
  confidenceScore: number;
  speciesGuess: string | null;
  healthBreakdown: HealthBreakdown;
  observations: string[];
  recommendations: string[];
  overlayImageUrl: string | null;
  providerRequestId: string | null;
}

export interface WeatherInsight {
  location: { latitude: number; longitude: number };
  current: {
    temperatureC: number;
    humidityPct: number;
    windKph: number;
    conditions: string;
  };
  agronomic: {
    summary: string;
    riskFlags: string[];
    recommendations: string[];
  };
  generatedAt: string;
}

export interface AnalysisQuota {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

/** DI token for the provider port (Strategy: mock vs live HTTP adapter). */
export const WEATHER_AI_PROVIDER = Symbol('WEATHER_AI_PROVIDER');

export interface WeatherAiProvider {
  analyzeTrees(input: TreeAnalysisInput): Promise<TreeAnalysisResult>;
  getInsight(latitude: number, longitude: number): Promise<WeatherInsight>;
  getAnalysisQuota(): Promise<AnalysisQuota>;
}

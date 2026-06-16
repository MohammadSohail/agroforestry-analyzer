export interface Plot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  areaAcres: number | null;
  primarySpecies: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthBreakdown {
  healthy: number;
  stressed: number;
  dead: number;
}

export type AnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Analysis {
  id: string;
  plotId: string;
  status: AnalysisStatus;
  treeCount: number | null;
  densityPerAcre: number | null;
  canopyCoveragePct: number | null;
  confidenceScore: number | null;
  speciesGuess: string | null;
  healthBreakdown: HealthBreakdown | null;
  observations: string[];
  recommendations: string[];
  sourceImageUrl: string | null;
  overlayImageUrl: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface WeatherInsight {
  location: { latitude: number; longitude: number };
  current: { temperatureC: number; humidityPct: number; windKph: number; conditions: string };
  agronomic: { summary: string; riskFlags: string[]; recommendations: string[] };
  generatedAt: string;
}

export interface Quota {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreatePlotInput {
  name: string;
  latitude: number;
  longitude: number;
  areaAcres?: number;
  primarySpecies?: string;
  notes?: string;
}

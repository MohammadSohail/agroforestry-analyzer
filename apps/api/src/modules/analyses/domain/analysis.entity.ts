import { HealthBreakdown } from '../../../shared/weather-ai/weather-ai.types';

export type AnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * Analysis — one tree-canopy assessment of a plot, derived from an uploaded image
 * via the WeatherAI provider. Immutable once written (an append-only history).
 */
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

  sourceImageKey: string | null;
  sourceImageUrl: string | null;
  overlayImageUrl: string | null;

  providerRequestId: string | null;
  failureReason: string | null;

  createdAt: Date;
}

export interface NewAnalysis {
  plotId: string;
  status: AnalysisStatus;
  treeCount?: number | null;
  densityPerAcre?: number | null;
  canopyCoveragePct?: number | null;
  confidenceScore?: number | null;
  speciesGuess?: string | null;
  healthBreakdown?: HealthBreakdown | null;
  observations?: string[];
  recommendations?: string[];
  sourceImageKey?: string | null;
  sourceImageUrl?: string | null;
  overlayImageUrl?: string | null;
  providerRequestId?: string | null;
  failureReason?: string | null;
}

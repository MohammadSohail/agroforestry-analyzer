import { Analysis, NewAnalysis } from './analysis.entity';

/** DI token for the analysis repository port. */
export const ANALYSIS_REPOSITORY = Symbol('ANALYSIS_REPOSITORY');

export interface AnalysisRepository {
  create(data: NewAnalysis): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  findByPlot(
    plotId: string,
    skip: number,
    take: number,
  ): Promise<{ items: Analysis[]; total: number }>;
}

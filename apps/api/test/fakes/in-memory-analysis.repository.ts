import { randomUUID } from 'node:crypto';
import { Analysis, NewAnalysis } from '../../src/modules/analyses/domain/analysis.entity';
import { AnalysisRepository } from '../../src/modules/analyses/domain/analysis.repository';

/** In-memory {@link AnalysisRepository} for DB-free tests. */
export class InMemoryAnalysisRepository implements AnalysisRepository {
  readonly store = new Map<string, Analysis>();

  async create(data: NewAnalysis): Promise<Analysis> {
    const analysis: Analysis = {
      id: randomUUID(),
      plotId: data.plotId,
      status: data.status,
      treeCount: data.treeCount ?? null,
      densityPerAcre: data.densityPerAcre ?? null,
      canopyCoveragePct: data.canopyCoveragePct ?? null,
      confidenceScore: data.confidenceScore ?? null,
      speciesGuess: data.speciesGuess ?? null,
      healthBreakdown: data.healthBreakdown ?? null,
      observations: data.observations ?? [],
      recommendations: data.recommendations ?? [],
      sourceImageKey: data.sourceImageKey ?? null,
      sourceImageUrl: data.sourceImageUrl ?? null,
      overlayImageUrl: data.overlayImageUrl ?? null,
      providerRequestId: data.providerRequestId ?? null,
      failureReason: data.failureReason ?? null,
      createdAt: new Date(),
    };
    this.store.set(analysis.id, analysis);
    return analysis;
  }

  async findById(id: string): Promise<Analysis | null> {
    return this.store.get(id) ?? null;
  }

  async findByPlot(
    plotId: string,
    skip: number,
    take: number,
  ): Promise<{ items: Analysis[]; total: number }> {
    const all = [...this.store.values()]
      .filter((a) => a.plotId === plotId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: all.slice(skip, skip + take), total: all.length };
  }
}

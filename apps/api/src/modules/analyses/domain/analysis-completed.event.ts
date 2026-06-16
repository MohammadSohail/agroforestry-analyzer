/**
 * Domain event emitted after an analysis is persisted. Decouples the write path
 * from side-effects (audit, stats, future notifications/webhooks) — listeners
 * subscribe without the use case knowing they exist.
 */
export class AnalysisCompletedEvent {
  static readonly NAME = 'analysis.completed';

  constructor(
    readonly analysisId: string,
    readonly plotId: string,
    readonly treeCount: number | null,
    readonly canopyCoveragePct: number | null,
    readonly occurredAt: Date = new Date(),
  ) {}
}

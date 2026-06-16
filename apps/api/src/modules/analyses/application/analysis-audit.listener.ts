import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalysisCompletedEvent } from '../domain/analysis-completed.event';

/**
 * Example event consumer: structured audit logging on every completed analysis.
 * In production this is where webhook fan-out, metrics, or a notification job
 * would hook in — all without touching the write path. Demonstrates the
 * event-driven seam, not just declares it.
 */
@Injectable()
export class AnalysisAuditListener {
  private readonly logger = new Logger('AnalysisAudit');

  @OnEvent(AnalysisCompletedEvent.NAME)
  handle(event: AnalysisCompletedEvent): void {
    this.logger.log(
      `analysis.completed id=${event.analysisId} plot=${event.plotId} ` +
        `trees=${event.treeCount ?? 'n/a'} canopy=${event.canopyCoveragePct ?? 'n/a'}%`,
    );
  }
}

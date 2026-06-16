import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResourceNotFoundException } from '../../../common/exceptions/domain.exception';
import { STORAGE_PORT, StoragePort } from '../../../shared/storage/storage.types';
import {
  WEATHER_AI_PROVIDER,
  WeatherAiProvider,
} from '../../../shared/weather-ai/weather-ai.types';
import { PlotsService } from '../../plots/application/plots.service';
import { Analysis } from '../domain/analysis.entity';
import { AnalysisCompletedEvent } from '../domain/analysis-completed.event';
import { ANALYSIS_REPOSITORY, AnalysisRepository } from '../domain/analysis.repository';

export interface RunAnalysisCommand {
  plotId: string;
  image: Buffer;
  filename: string;
  mimeType: string;
}

/**
 * Orchestrates the core use case: store the uploaded image, run the WeatherAI
 * tree analysis, persist the result, and publish a domain event.
 *
 * The flow is the *only* place that knows the moving parts fit together; each
 * collaborator is an injected port, so the use case is fully unit-testable with
 * in-memory fakes and the mock provider — no DB or network required.
 */
@Injectable()
export class AnalysesService {
  private readonly logger = new Logger(AnalysesService.name);

  constructor(
    @Inject(ANALYSIS_REPOSITORY) private readonly analyses: AnalysisRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(WEATHER_AI_PROVIDER) private readonly provider: WeatherAiProvider,
    private readonly plots: PlotsService,
    private readonly events: EventEmitter2,
  ) {}

  async run(cmd: RunAnalysisCommand): Promise<Analysis> {
    const plot = await this.plots.getOrThrow(cmd.plotId); // 404 if missing

    const stored = await this.storage.put({
      body: cmd.image,
      contentType: cmd.mimeType,
      filename: cmd.filename,
    });

    try {
      const result = await this.provider.analyzeTrees({
        image: cmd.image,
        filename: cmd.filename,
        mimeType: cmd.mimeType,
        latitude: plot.latitude,
        longitude: plot.longitude,
      });

      const analysis = await this.analyses.create({
        plotId: plot.id,
        status: 'COMPLETED',
        ...result,
        sourceImageKey: stored.key,
        sourceImageUrl: stored.url,
      });

      this.events.emit(
        AnalysisCompletedEvent.NAME,
        new AnalysisCompletedEvent(
          analysis.id,
          analysis.plotId,
          analysis.treeCount,
          analysis.canopyCoveragePct,
        ),
      );

      return analysis;
    } catch (err) {
      // Persist a FAILED row so the upstream outage is auditable, then surface it.
      this.logger.warn(`Analysis failed for plot ${plot.id}: ${(err as Error).message}`);
      await this.analyses.create({
        plotId: plot.id,
        status: 'FAILED',
        sourceImageKey: stored.key,
        sourceImageUrl: stored.url,
        failureReason: (err as Error).message,
      });
      throw err;
    }
  }

  list(
    plotId: string,
    skip: number,
    take: number,
  ): Promise<{ items: Analysis[]; total: number }> {
    return this.analyses.findByPlot(plotId, skip, take);
  }

  async getOrThrow(id: string): Promise<Analysis> {
    const analysis = await this.analyses.findById(id);
    if (!analysis) throw new ResourceNotFoundException('Analysis', id);
    return analysis;
  }
}

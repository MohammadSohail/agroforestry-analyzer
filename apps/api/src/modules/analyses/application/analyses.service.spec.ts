import { EventEmitter2 } from '@nestjs/event-emitter';
import { InMemoryAnalysisRepository } from '../../../../test/fakes/in-memory-analysis.repository';
import { InMemoryPlotRepository } from '../../../../test/fakes/in-memory-plot.repository';
import { InMemoryStorage } from '../../../../test/fakes/in-memory.storage';
import { ResourceNotFoundException } from '../../../common/exceptions/domain.exception';
import { MockWeatherAiProvider } from '../../../shared/weather-ai/adapters/mock-weather-ai.provider';
import { WeatherAiProvider } from '../../../shared/weather-ai/weather-ai.types';
import { PlotsService } from '../../plots/application/plots.service';
import { AnalysisCompletedEvent } from '../domain/analysis-completed.event';
import { AnalysesService } from './analyses.service';

describe('AnalysesService', () => {
  let analysisRepo: InMemoryAnalysisRepository;
  let plotRepo: InMemoryPlotRepository;
  let storage: InMemoryStorage;
  let provider: WeatherAiProvider;
  let events: EventEmitter2;
  let plots: PlotsService;
  let service: AnalysesService;
  let plotId: string;

  const cmd = () => ({
    plotId,
    image: Buffer.from('fake-image-bytes'),
    filename: 'drone.png',
    mimeType: 'image/png',
  });

  beforeEach(async () => {
    analysisRepo = new InMemoryAnalysisRepository();
    plotRepo = new InMemoryPlotRepository();
    storage = new InMemoryStorage();
    provider = new MockWeatherAiProvider();
    events = new EventEmitter2();
    plots = new PlotsService(plotRepo);
    service = new AnalysesService(analysisRepo, storage, provider, plots, events);

    const plot = await plots.create({ name: 'Block A', latitude: -0.78, longitude: 35.34 });
    plotId = plot.id;
  });

  it('runs a successful analysis: stores image, persists COMPLETED, emits event', async () => {
    const emit = jest.spyOn(events, 'emit');

    const result = await service.run(cmd());

    expect(result.status).toBe('COMPLETED');
    expect(result.treeCount).toBeGreaterThan(0);
    expect(result.healthBreakdown).not.toBeNull();
    expect(result.sourceImageUrl).toContain('https://test.local/uploads/');
    expect(storage.puts).toHaveLength(1);

    expect(emit).toHaveBeenCalledWith(
      AnalysisCompletedEvent.NAME,
      expect.objectContaining({ analysisId: result.id, plotId }),
    );
  });

  it('produces deterministic results for the same image bytes', async () => {
    const a = await service.run(cmd());
    const b = await service.run(cmd());
    expect(b.treeCount).toBe(a.treeCount);
    expect(b.canopyCoveragePct).toBe(a.canopyCoveragePct);
  });

  it('404s when the plot does not exist', async () => {
    await expect(service.run({ ...cmd(), plotId: 'missing' })).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('persists a FAILED record and rethrows when the provider fails', async () => {
    jest
      .spyOn(provider, 'analyzeTrees')
      .mockRejectedValueOnce(new Error('upstream exploded'));

    await expect(service.run(cmd())).rejects.toThrow('upstream exploded');

    const { items } = await service.list(plotId, 0, 10);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('FAILED');
    expect(items[0].failureReason).toBe('upstream exploded');
  });
});

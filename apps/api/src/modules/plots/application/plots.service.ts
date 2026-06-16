import { Inject, Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common/exceptions/domain.exception';
import { NewPlot, Plot, PlotUpdate } from '../domain/plot.entity';
import { PLOT_REPOSITORY, PlotRepository } from '../domain/plot.repository';

/**
 * Application service for plots. Plain CRUD use cases — deliberately lightweight
 * (no CQRS/event machinery) because the operations carry no domain rules beyond
 * existence checks. Depends only on the repository *port*.
 */
@Injectable()
export class PlotsService {
  constructor(
    @Inject(PLOT_REPOSITORY) private readonly plots: PlotRepository,
  ) {}

  create(data: NewPlot): Promise<Plot> {
    return this.plots.create(data);
  }

  list(skip: number, take: number): Promise<{ items: Plot[]; total: number }> {
    return this.plots.findMany(skip, take);
  }

  async getOrThrow(id: string): Promise<Plot> {
    const plot = await this.plots.findById(id);
    if (!plot) throw new ResourceNotFoundException('Plot', id);
    return plot;
  }

  async update(id: string, data: PlotUpdate): Promise<Plot> {
    const updated = await this.plots.update(id, data);
    if (!updated) throw new ResourceNotFoundException('Plot', id);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const ok = await this.plots.delete(id);
    if (!ok) throw new ResourceNotFoundException('Plot', id);
  }
}

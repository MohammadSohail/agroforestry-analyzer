import { NewPlot, Plot, PlotUpdate } from './plot.entity';

/** DI token for the plot repository port. */
export const PLOT_REPOSITORY = Symbol('PLOT_REPOSITORY');

export interface PlotRepository {
  create(data: NewPlot): Promise<Plot>;
  findById(id: string): Promise<Plot | null>;
  findMany(skip: number, take: number): Promise<{ items: Plot[]; total: number }>;
  update(id: string, data: PlotUpdate): Promise<Plot | null>;
  delete(id: string): Promise<boolean>;
}

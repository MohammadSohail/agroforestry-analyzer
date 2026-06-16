import { randomUUID } from 'node:crypto';
import { NewPlot, Plot, PlotUpdate } from '../../src/modules/plots/domain/plot.entity';
import { PlotRepository } from '../../src/modules/plots/domain/plot.repository';

/** In-memory {@link PlotRepository} for fast, DB-free unit and e2e tests. */
export class InMemoryPlotRepository implements PlotRepository {
  readonly store = new Map<string, Plot>();

  async create(data: NewPlot): Promise<Plot> {
    const now = new Date();
    const plot: Plot = {
      id: randomUUID(),
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      areaAcres: data.areaAcres ?? null,
      primarySpecies: data.primarySpecies ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(plot.id, plot);
    return plot;
  }

  async findById(id: string): Promise<Plot | null> {
    return this.store.get(id) ?? null;
  }

  async findMany(skip: number, take: number): Promise<{ items: Plot[]; total: number }> {
    const all = [...this.store.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return { items: all.slice(skip, skip + take), total: all.length };
  }

  async update(id: string, data: PlotUpdate): Promise<Plot | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: Plot = { ...existing, ...data, updatedAt: new Date() };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

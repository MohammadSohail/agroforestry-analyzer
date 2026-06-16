import { Injectable } from '@nestjs/common';
import { Plot as PrismaPlot } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NewPlot, Plot, PlotUpdate } from '../domain/plot.entity';
import { PlotRepository } from '../domain/plot.repository';

/** Prisma-backed adapter for {@link PlotRepository}. Maps rows <-> domain entities. */
@Injectable()
export class PlotPrismaRepository implements PlotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NewPlot): Promise<Plot> {
    const row = await this.prisma.plot.create({ data });
    return toDomain(row);
  }

  async findById(id: string): Promise<Plot | null> {
    const row = await this.prisma.plot.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findMany(skip: number, take: number): Promise<{ items: Plot[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.plot.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.plot.count(),
    ]);
    return { items: rows.map(toDomain), total };
  }

  async update(id: string, data: PlotUpdate): Promise<Plot | null> {
    const exists = await this.prisma.plot.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;
    const row = await this.prisma.plot.update({ where: { id }, data });
    return toDomain(row);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.plot.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

function toDomain(row: PrismaPlot): Plot {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    areaAcres: row.areaAcres,
    primarySpecies: row.primarySpecies,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

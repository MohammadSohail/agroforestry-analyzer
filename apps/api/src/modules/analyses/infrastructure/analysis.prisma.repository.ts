import { Injectable } from '@nestjs/common';
import { Analysis as PrismaAnalysis, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { HealthBreakdown } from '../../../shared/weather-ai/weather-ai.types';
import { Analysis, NewAnalysis } from '../domain/analysis.entity';
import { AnalysisRepository } from '../domain/analysis.repository';

/** Prisma-backed adapter for {@link AnalysisRepository}. */
@Injectable()
export class AnalysisPrismaRepository implements AnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NewAnalysis): Promise<Analysis> {
    const row = await this.prisma.analysis.create({
      data: {
        plotId: data.plotId,
        status: data.status,
        treeCount: data.treeCount ?? null,
        densityPerAcre: data.densityPerAcre ?? null,
        canopyCoveragePct: data.canopyCoveragePct ?? null,
        confidenceScore: data.confidenceScore ?? null,
        speciesGuess: data.speciesGuess ?? null,
        healthBreakdown: (data.healthBreakdown ?? undefined) as Prisma.InputJsonValue | undefined,
        observations: data.observations ?? [],
        recommendations: data.recommendations ?? [],
        sourceImageKey: data.sourceImageKey ?? null,
        sourceImageUrl: data.sourceImageUrl ?? null,
        overlayImageUrl: data.overlayImageUrl ?? null,
        providerRequestId: data.providerRequestId ?? null,
        failureReason: data.failureReason ?? null,
      },
    });
    return toDomain(row);
  }

  async findById(id: string): Promise<Analysis | null> {
    const row = await this.prisma.analysis.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByPlot(
    plotId: string,
    skip: number,
    take: number,
  ): Promise<{ items: Analysis[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.analysis.findMany({
        where: { plotId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.analysis.count({ where: { plotId } }),
    ]);
    return { items: rows.map(toDomain), total };
  }
}

function toDomain(row: PrismaAnalysis): Analysis {
  return {
    id: row.id,
    plotId: row.plotId,
    status: row.status,
    treeCount: row.treeCount,
    densityPerAcre: row.densityPerAcre,
    canopyCoveragePct: row.canopyCoveragePct,
    confidenceScore: row.confidenceScore,
    speciesGuess: row.speciesGuess,
    healthBreakdown: (row.healthBreakdown as HealthBreakdown | null) ?? null,
    observations: row.observations,
    recommendations: row.recommendations,
    sourceImageKey: row.sourceImageKey,
    sourceImageUrl: row.sourceImageUrl,
    overlayImageUrl: row.overlayImageUrl,
    providerRequestId: row.providerRequestId,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
  };
}

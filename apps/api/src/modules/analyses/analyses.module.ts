import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';
import { AnalysesService } from './application/analyses.service';
import { AnalysisAuditListener } from './application/analysis-audit.listener';
import { ANALYSIS_REPOSITORY } from './domain/analysis.repository';
import { AnalysisPrismaRepository } from './infrastructure/analysis.prisma.repository';
import { AnalysesController } from './interface/analyses.controller';
import { PlotAnalysesController } from './interface/plot-analyses.controller';

@Module({
  imports: [PlotsModule],
  controllers: [PlotAnalysesController, AnalysesController],
  providers: [
    AnalysesService,
    AnalysisAuditListener,
    { provide: ANALYSIS_REPOSITORY, useClass: AnalysisPrismaRepository },
  ],
})
export class AnalysesModule {}

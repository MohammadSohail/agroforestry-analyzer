import { Module } from '@nestjs/common';
import { PlotsService } from './application/plots.service';
import { PLOT_REPOSITORY } from './domain/plot.repository';
import { PlotPrismaRepository } from './infrastructure/plot.prisma.repository';
import { PlotsController } from './interface/plots.controller';

@Module({
  controllers: [PlotsController],
  providers: [
    PlotsService,
    { provide: PLOT_REPOSITORY, useClass: PlotPrismaRepository },
  ],
  exports: [PlotsService],
})
export class PlotsModule {}

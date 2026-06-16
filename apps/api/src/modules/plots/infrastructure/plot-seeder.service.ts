import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TypedConfigService } from '../../../config/app-config.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DEMO_PLOTS } from '../demo-plots';

/**
 * Seeds the demo dataset on boot — but only when the `plots` table is empty and
 * `SEED_ON_BOOT` is enabled. Idempotent and non-destructive: a populated database
 * is never touched, so this is safe to run on every (free-tier) restart.
 */
@Injectable()
export class PlotSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlotSeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: TypedConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get('SEED_ON_BOOT')) return;

    const existing = await this.prisma.plot.count();
    if (existing > 0) {
      this.logger.log(`Skipping seed — ${existing} plot(s) already present.`);
      return;
    }

    await this.prisma.plot.createMany({ data: DEMO_PLOTS });
    this.logger.log(`Seeded ${DEMO_PLOTS.length} demo plots into an empty database.`);
  }
}

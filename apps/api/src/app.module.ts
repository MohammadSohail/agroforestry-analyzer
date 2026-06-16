import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AnalysesModule } from './modules/analyses/analyses.module';
import { HealthModule } from './modules/health/health.module';
import { PlotsModule } from './modules/plots/plots.module';
import { QuotaModule } from './modules/quota/quota.module';
import { WeatherModule } from './modules/weather/weather.module';
import { StorageModule } from './shared/storage/storage.module';
import { WeatherAiModule } from './shared/weather-ai/weather-ai.module';

@Module({
  imports: [
    AppConfigModule,
    // Structured JSON logging with auto request-id correlation; pretty in dev.
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        redact: ['req.headers.authorization'],
      },
    }),
    // Coarse abuse protection: 100 requests / minute / IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    EventEmitterModule.forRoot(),

    // Infrastructure (global)
    PrismaModule,
    WeatherAiModule,
    StorageModule,

    // Feature modules
    HealthModule,
    PlotsModule,
    AnalysesModule,
    WeatherModule,
    QuotaModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { join, resolve } from 'node:path';
import { AppModule } from './app.module';
import { TypedConfigService } from './config/app-config.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOADS_PUBLIC_PREFIX } from './shared/storage/storage.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(TypedConfigService);

  // Use pino as the app logger so framework + app logs share one structured stream.
  app.useLogger(app.get(PinoLogger));

  // Security headers; allow cross-origin resource loads so the SPA can render stored images.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: config.corsOrigins, credentials: true });

  // Friendly root: send visitors to the interactive docs, and quietly answer favicon probes.
  // Registered before the Nest router so it takes precedence over the 404 fallback.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && req.path === '/') return res.redirect('/docs');
    if (req.method === 'GET' && req.path === '/favicon.ico') return res.status(204).end();
    return next();
  });

  // /api/v1/... — URI versioning keeps breaking changes additive.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown props
      forbidNonWhitelisted: true, // 400 on unknown props
      transform: true, // DTO instances + primitive coercion
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve locally stored upload imagery (see StorageModule / LocalDiskStorage).
  app.useStaticAssets(resolve(config.get('STORAGE_DIR')), {
    prefix: `/${UPLOADS_PUBLIC_PREFIX}/`,
  });
  // Bundled static assets (e.g. mock overlay placeholder), served at /static.
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/static/' });

  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Agroforestry Analyzer API')
    .setDescription(
      'Register land plots, run tree-canopy analyses on uploaded imagery via the WeatherAI ' +
        'API, track canopy health over time, and pull agronomic weather insights.',
    )
    .setVersion('1.0')
    .addTag('plots')
    .addTag('analyses')
    .addTag('weather')
    .addTag('quota')
    .addTag('health')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger), {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('PORT');
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(
    `API ready on :${port} (docs at /docs, mode=${config.get('WEATHER_AI_MODE')})`,
  );
}

void bootstrap();

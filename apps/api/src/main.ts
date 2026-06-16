import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Security headers. crossOriginResourcePolicy is relaxed so the SPA can load stored images;
  // img-src is widened to allow the (https) mock overlay placeholder and inline data URIs.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.enableCors({ origin: config.corsOrigins, credentials: true });

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

  // Serve the built React dashboard at "/" (single-service deploy). express.static falls through
  // on a miss, so /api, /docs, /health, /uploads still reach their handlers. Harmless if the web
  // build is absent (e.g. running the API standalone in dev) — the directory simply 404s.
  app.useStaticAssets(join(__dirname, '..', '..', 'web', 'dist'));

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

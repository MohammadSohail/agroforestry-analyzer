import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ANALYSIS_REPOSITORY } from '../src/modules/analyses/domain/analysis.repository';
import { PLOT_REPOSITORY } from '../src/modules/plots/domain/plot.repository';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { STORAGE_PORT } from '../src/shared/storage/storage.types';
import { InMemoryAnalysisRepository } from './fakes/in-memory-analysis.repository';
import { InMemoryPlotRepository } from './fakes/in-memory-plot.repository';
import { InMemoryStorage } from './fakes/in-memory.storage';

// Valid 1x1 PNG — passes magic-number file validation.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64',
);

/**
 * Full-stack e2e against the real AppModule, but with persistence/storage swapped
 * for in-memory fakes and the mock provider — so it runs in CI with no DB, no
 * network, and no API key, while still exercising routing, validation, the global
 * problem+json filter, and the analysis use case end to end.
 */
describe('Agroforestry API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({}) // repositories are faked; Prisma is never touched
      .overrideProvider(PLOT_REPOSITORY)
      .useClass(InMemoryPlotRepository)
      .overrideProvider(ANALYSIS_REPOSITORY)
      .useClass(InMemoryAnalysisRepository)
      .overrideProvider(STORAGE_PORT)
      .useClass(InMemoryStorage)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates plot creation input (problem+json)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/plots')
      .send({ name: 'x' }) // missing lat/lon, name too short
      .expect(400);
    expect(res.body.code).toBe('bad_request');
    expect(res.body.status).toBe(400);
  });

  it('creates a plot, runs an analysis, and lists history', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/plots')
      .send({ name: 'E2E Block', latitude: -0.78, longitude: 35.34, areaAcres: 10 })
      .expect(201);
    const plotId = create.body.id;
    expect(plotId).toBeDefined();

    const analysis = await request(app.getHttpServer())
      .post(`/api/v1/plots/${plotId}/analyses`)
      .attach('image', PNG_1x1, { filename: 'drone.png', contentType: 'image/png' })
      .expect(201);
    expect(analysis.body.status).toBe('COMPLETED');
    expect(analysis.body.treeCount).toBeGreaterThan(0);

    const history = await request(app.getHttpServer())
      .get(`/api/v1/plots/${plotId}/analyses`)
      .expect(200);
    expect(history.body.meta.total).toBe(1);
    expect(history.body.data[0].id).toBe(analysis.body.id);
  });

  it('rejects a non-image upload via magic-number validation', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/plots')
      .send({ name: 'Reject Block', latitude: 0, longitude: 0 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/plots/${create.body.id}/analyses`)
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'evil.png',
        contentType: 'image/png',
      })
      .expect(400);
  });

  it('returns an agronomic insight and quota for a plot', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/v1/plots')
      .send({ name: 'Insight Block', latitude: -0.3, longitude: 36.08 })
      .expect(201);

    const insight = await request(app.getHttpServer())
      .get(`/api/v1/plots/${create.body.id}/insight`)
      .expect(200);
    expect(insight.body.current).toBeDefined();
    expect(insight.body.agronomic.summary).toBeDefined();

    const quota = await request(app.getHttpServer()).get('/api/v1/quota').expect(200);
    expect(quota.body.remaining).toBeGreaterThanOrEqual(0);
  });

  it('404s a missing plot with problem+json', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/plots/00000000-0000-0000-0000-000000000000')
      .expect(404);
    expect(res.body.code).toBe('resource_not_found');
  });
});

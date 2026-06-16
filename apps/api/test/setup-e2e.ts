// Provides safe defaults so the e2e suite boots AppModule (which validates env)
// without a real .env file — e.g. in CI. Persistence/storage are faked, so the
// DATABASE_URL is never actually dialed.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.WEATHER_AI_MODE ||= 'mock';
process.env.SEED_ON_BOOT = 'false'; // repositories are faked in e2e; don't touch Prisma on boot

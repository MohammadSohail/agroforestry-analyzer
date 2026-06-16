import { z } from 'zod';

/**
 * Single source of truth for environment configuration.
 * Validated once at boot — the app fails fast on misconfiguration rather than
 * discovering a missing variable deep in a request handler.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  WEATHER_AI_MODE: z.enum(['mock', 'live']).default('mock'),
  WEATHER_AI_BASE_URL: z.string().url().default('https://api.weather-ai.co'),
  WEATHER_AI_API_KEY: z.string().optional(),
  WEATHER_AI_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  WEATHER_AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),

  STORAGE_DIR: z.string().default('./data/uploads'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  // A live provider is useless without a key — guard the combination explicitly.
  if (parsed.data.WEATHER_AI_MODE === 'live' && !parsed.data.WEATHER_AI_API_KEY) {
    throw new Error('WEATHER_AI_MODE=live requires WEATHER_AI_API_KEY to be set.');
  }

  return parsed.data;
}

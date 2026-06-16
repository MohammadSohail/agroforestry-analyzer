import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Env, validateEnv } from './env.validation';

/**
 * Thin, typed wrapper around Nest's ConfigService.
 * Consumers inject `TypedConfigService` and get full autocompletion over `Env`.
 */
export class TypedConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),
  ],
  providers: [
    {
      provide: TypedConfigService,
      useFactory: (config: ConfigService<Env, true>) => new TypedConfigService(config),
      inject: [ConfigService],
    },
  ],
  exports: [TypedConfigService],
})
export class AppConfigModule {}

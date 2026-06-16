import { Global, Logger, Module } from '@nestjs/common';
import { TypedConfigService } from '../../config/app-config.module';
import { HttpWeatherAiProvider } from './adapters/http-weather-ai.provider';
import { MockWeatherAiProvider } from './adapters/mock-weather-ai.provider';
import { WEATHER_AI_PROVIDER, WeatherAiProvider } from './weather-ai.types';

/**
 * Binds the `WEATHER_AI_PROVIDER` port to a concrete adapter at boot, chosen by
 * `WEATHER_AI_MODE`. The rest of the app depends only on the token, so switching
 * mock <-> live is a config change with zero code edits (Strategy pattern).
 */
@Global()
@Module({
  providers: [
    MockWeatherAiProvider,
    {
      provide: WEATHER_AI_PROVIDER,
      inject: [TypedConfigService, MockWeatherAiProvider],
      useFactory: (
        config: TypedConfigService,
        mock: MockWeatherAiProvider,
      ): WeatherAiProvider => {
        const logger = new Logger('WeatherAiModule');
        if (config.get('WEATHER_AI_MODE') === 'live') {
          logger.log('Using live HTTP WeatherAI provider.');
          return new HttpWeatherAiProvider({
            baseUrl: config.get('WEATHER_AI_BASE_URL'),
            apiKey: config.get('WEATHER_AI_API_KEY') as string,
            timeoutMs: config.get('WEATHER_AI_TIMEOUT_MS'),
            maxRetries: config.get('WEATHER_AI_MAX_RETRIES'),
          });
        }
        logger.log('Using mock WeatherAI provider (no API key required).');
        return mock;
      },
    },
  ],
  exports: [WEATHER_AI_PROVIDER],
})
export class WeatherAiModule {}

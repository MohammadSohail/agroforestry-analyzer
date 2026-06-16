import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AnalysisQuota,
  WEATHER_AI_PROVIDER,
  WeatherAiProvider,
} from '../../shared/weather-ai/weather-ai.types';
import { QuotaResponseDto } from './quota-response.dto';

@ApiTags('quota')
@Controller({ path: 'quota', version: '1' })
export class QuotaController {
  constructor(@Inject(WEATHER_AI_PROVIDER) private readonly provider: WeatherAiProvider) {}

  @Get()
  @ApiOkResponse({ type: QuotaResponseDto })
  getQuota(): Promise<AnalysisQuota> {
    return this.provider.getAnalysisQuota();
  }
}

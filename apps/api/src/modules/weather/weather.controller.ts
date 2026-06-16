import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WeatherInsight } from '../../shared/weather-ai/weather-ai.types';
import { WeatherInsightResponseDto } from './weather-insight-response.dto';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@Controller({ path: 'plots/:plotId/insight', version: '1' })
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get()
  @ApiOkResponse({ type: WeatherInsightResponseDto })
  async insight(@Param('plotId', ParseUUIDPipe) plotId: string): Promise<WeatherInsight> {
    return this.weather.getPlotInsight(plotId);
  }
}

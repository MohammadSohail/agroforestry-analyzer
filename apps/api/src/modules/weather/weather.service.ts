import { Inject, Injectable } from '@nestjs/common';
import {
  WEATHER_AI_PROVIDER,
  WeatherAiProvider,
  WeatherInsight,
} from '../../shared/weather-ai/weather-ai.types';
import { PlotsService } from '../plots/application/plots.service';

/**
 * Ties the weather side of the API to the agroforestry domain: given a plot,
 * fetch current conditions + the AI agronomic insight for its coordinates.
 */
@Injectable()
export class WeatherService {
  constructor(
    @Inject(WEATHER_AI_PROVIDER) private readonly provider: WeatherAiProvider,
    private readonly plots: PlotsService,
  ) {}

  async getPlotInsight(plotId: string): Promise<WeatherInsight> {
    const plot = await this.plots.getOrThrow(plotId);
    return this.provider.getInsight(plot.latitude, plot.longitude);
  }
}

import { Module } from '@nestjs/common';
import { PlotsModule } from '../plots/plots.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
  imports: [PlotsModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}

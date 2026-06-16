import { ApiProperty } from '@nestjs/swagger';

class CurrentDto {
  @ApiProperty() temperatureC!: number;
  @ApiProperty() humidityPct!: number;
  @ApiProperty() windKph!: number;
  @ApiProperty() conditions!: string;
}

class AgronomicDto {
  @ApiProperty() summary!: string;
  @ApiProperty({ type: [String] }) riskFlags!: string[];
  @ApiProperty({ type: [String] }) recommendations!: string[];
}

class LocationDto {
  @ApiProperty() latitude!: number;
  @ApiProperty() longitude!: number;
}

/** Swagger-only documentation type — the controller returns the provider's WeatherInsight directly. */
export class WeatherInsightResponseDto {
  @ApiProperty({ type: LocationDto }) location!: LocationDto;
  @ApiProperty({ type: CurrentDto }) current!: CurrentDto;
  @ApiProperty({ type: AgronomicDto }) agronomic!: AgronomicDto;
  @ApiProperty() generatedAt!: string;
}

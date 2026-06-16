import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plot } from '../../domain/plot.entity';

export class PlotResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() latitude: number;
  @ApiProperty() longitude: number;
  @ApiPropertyOptional({ nullable: true }) areaAcres: number | null;
  @ApiPropertyOptional({ nullable: true }) primarySpecies: string | null;
  @ApiPropertyOptional({ nullable: true }) notes: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(plot: Plot) {
    this.id = plot.id;
    this.name = plot.name;
    this.latitude = plot.latitude;
    this.longitude = plot.longitude;
    this.areaAcres = plot.areaAcres;
    this.primarySpecies = plot.primarySpecies;
    this.notes = plot.notes;
    this.createdAt = plot.createdAt.toISOString();
    this.updatedAt = plot.updatedAt.toISOString();
  }
}

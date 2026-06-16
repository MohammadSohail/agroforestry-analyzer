import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlotDto {
  @ApiProperty({ example: 'Bomet Highland Block A' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: -0.7813, description: 'Latitude in decimal degrees' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 35.3416, description: 'Longitude in decimal degrees' })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaAcres?: number;

  @ApiPropertyOptional({ example: 'Grevillea robusta' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  primarySpecies?: string;

  @ApiPropertyOptional({ example: 'Intercropped with tea.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

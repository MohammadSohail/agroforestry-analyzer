import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthBreakdown } from '../../../../shared/weather-ai/weather-ai.types';
import { Analysis, AnalysisStatus } from '../../domain/analysis.entity';

export class AnalysisResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) plotId: string;
  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED'] }) status: AnalysisStatus;

  @ApiPropertyOptional({ nullable: true }) treeCount: number | null;
  @ApiPropertyOptional({ nullable: true }) densityPerAcre: number | null;
  @ApiPropertyOptional({ nullable: true }) canopyCoveragePct: number | null;
  @ApiPropertyOptional({ nullable: true }) confidenceScore: number | null;
  @ApiPropertyOptional({ nullable: true }) speciesGuess: string | null;
  @ApiPropertyOptional({ nullable: true, type: 'object', additionalProperties: { type: 'number' } })
  healthBreakdown: HealthBreakdown | null;
  @ApiProperty({ type: [String] }) observations: string[];
  @ApiProperty({ type: [String] }) recommendations: string[];

  @ApiPropertyOptional({ nullable: true }) sourceImageUrl: string | null;
  @ApiPropertyOptional({ nullable: true }) overlayImageUrl: string | null;
  @ApiPropertyOptional({ nullable: true }) failureReason: string | null;
  @ApiProperty() createdAt: string;

  constructor(a: Analysis) {
    this.id = a.id;
    this.plotId = a.plotId;
    this.status = a.status;
    this.treeCount = a.treeCount;
    this.densityPerAcre = a.densityPerAcre;
    this.canopyCoveragePct = a.canopyCoveragePct;
    this.confidenceScore = a.confidenceScore;
    this.speciesGuess = a.speciesGuess;
    this.healthBreakdown = a.healthBreakdown;
    this.observations = a.observations;
    this.recommendations = a.recommendations;
    this.sourceImageUrl = a.sourceImageUrl;
    this.overlayImageUrl = a.overlayImageUrl;
    this.failureReason = a.failureReason;
    this.createdAt = a.createdAt.toISOString();
  }
}

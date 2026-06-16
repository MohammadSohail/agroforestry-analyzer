import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AnalysesService } from '../application/analyses.service';
import { AnalysisResponseDto } from './dto/analysis-response.dto';

@ApiTags('analyses')
@Controller({ path: 'analyses', version: '1' })
export class AnalysesController {
  constructor(private readonly analyses: AnalysesService) {}

  @Get(':id')
  @ApiOkResponse({ type: AnalysisResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<AnalysisResponseDto> {
    return new AnalysisResponseDto(await this.analyses.getOrThrow(id));
  }
}

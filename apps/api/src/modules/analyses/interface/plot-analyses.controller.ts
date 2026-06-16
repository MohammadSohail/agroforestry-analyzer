import {
  Controller,
  Get,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PageMetaDto, PaginatedDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ImageFileValidator } from '../../../common/validators/image-file.validator';
import { AnalysesService } from '../application/analyses.service';
import { AnalysisResponseDto } from './dto/analysis-response.dto';
import { MAX_IMAGE_BYTES } from './upload.constants';

/** Analyses are nested under a plot — they only exist in the context of one. */
@ApiTags('analyses')
@Controller({ path: 'plots/:plotId/analyses', version: '1' })
export class PlotAnalysesController {
  constructor(private readonly analyses: AnalysesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { image: { type: 'string', format: 'binary' } },
      required: ['image'],
    },
  })
  @ApiCreatedResponse({ type: AnalysisResponseDto })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  async create(
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new ImageFileValidator({ maxBytes: MAX_IMAGE_BYTES })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<AnalysisResponseDto> {
    const analysis = await this.analyses.run({
      plotId,
      image: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
    });
    return new AnalysisResponseDto(analysis);
  }

  @Get()
  @ApiOkResponse({ type: AnalysisResponseDto, isArray: true })
  async history(
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedDto<AnalysisResponseDto>> {
    const { items, total } = await this.analyses.list(plotId, query.skip, query.limit);
    return new PaginatedDto(
      items.map((a) => new AnalysisResponseDto(a)),
      new PageMetaDto(query.page, query.limit, total),
    );
  }
}

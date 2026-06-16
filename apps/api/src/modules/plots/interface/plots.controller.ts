import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PageMetaDto, PaginatedDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { PlotsService } from '../application/plots.service';
import { CreatePlotDto } from './dto/create-plot.dto';
import { PlotResponseDto } from './dto/plot-response.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';

@ApiTags('plots')
@Controller({ path: 'plots', version: '1' })
export class PlotsController {
  constructor(private readonly plots: PlotsService) {}

  @Post()
  @ApiCreatedResponse({ type: PlotResponseDto })
  async create(@Body() dto: CreatePlotDto): Promise<PlotResponseDto> {
    const plot = await this.plots.create(dto);
    return new PlotResponseDto(plot);
  }

  @Get()
  @ApiOkResponse({ type: PlotResponseDto, isArray: true })
  async list(@Query() query: PaginationQueryDto): Promise<PaginatedDto<PlotResponseDto>> {
    const { items, total } = await this.plots.list(query.skip, query.limit);
    return new PaginatedDto(
      items.map((p) => new PlotResponseDto(p)),
      new PageMetaDto(query.page, query.limit, total),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: PlotResponseDto })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<PlotResponseDto> {
    return new PlotResponseDto(await this.plots.getOrThrow(id));
  }

  @Patch(':id')
  @ApiOkResponse({ type: PlotResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlotDto,
  ): Promise<PlotResponseDto> {
    return new PlotResponseDto(await this.plots.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.plots.remove(id);
  }
}

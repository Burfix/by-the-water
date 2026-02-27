import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrecinctsService } from './precincts.service';
import { CreatePrecinctDto } from './dto/create-precinct.dto';
import { UpdatePrecinctDto } from './dto/update-precinct.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Precincts')
@ApiBearerAuth('JWT-auth')
@Controller('precincts')
export class PrecinctsController {
  constructor(private readonly precinctsService: PrecinctsService) {}

  @Post()
  @Roles(Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Create a new precinct' })
  create(@Body() dto: CreatePrecinctDto) {
    return this.precinctsService.create(dto);
  }

  @Get()
  @Roles(Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'List all precincts' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() pagination: PaginationDto, @Query('search') search?: string) {
    return this.precinctsService.findAll(pagination, search);
  }

  @Get(':id')
  @Roles(Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'Get precinct by ID (includes stores)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.precinctsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Update precinct' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrecinctDto) {
    return this.precinctsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate precinct' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.precinctsService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FilterStoreDto } from './dto/filter-store.dto';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../entities/user.entity';

@ApiTags('Stores')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Create a new store' })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Get()
  @Roles(Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'List all stores (filtered by role access)' })
  findAll(@Query() filter: FilterStoreDto, @CurrentUser() actor: User) {
    return this.storesService.findAll(filter, actor.id, actor.role);
  }

  @Get('grouped-by-precinct')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get stores grouped by precinct' })
  groupedByPrecinct() {
    return this.storesService.getStoresByPrecinct();
  }

  @Get('my-store')
  @Roles(Role.STORE, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'Get store linked to the current user' })
  myStore(@CurrentUser() actor: User) {
    return this.storesService.findMyStore(actor.id);
  }

  @Get(':id')
  @Roles(Role.OPS_MANAGER, Role.EXEC, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'Get store by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Update store details' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a store' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.remove(id);
  }

  @Post(':id/assign-coordinator')
  @Roles(Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Assign a coordinator to a store' })
  assignCoordinator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCoordinatorDto,
    @CurrentUser() actor: User,
  ) {
    return this.storesService.assignCoordinator(id, dto, actor.id);
  }

  @Delete(':id/coordinators/:coordinatorId')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove coordinator assignment from store' })
  removeCoordinator(
    @Param('id', ParseUUIDPipe) storeId: string,
    @Param('coordinatorId', ParseUUIDPipe) coordinatorId: string,
  ) {
    return this.storesService.removeCoordinatorAssignment(storeId, coordinatorId);
  }
}

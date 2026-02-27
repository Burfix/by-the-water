import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Create a new user (OPS_MANAGER only)' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: User) {
    return this.usersService.create(dto, actor.role);
  }

  @Get()
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'List all users with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('role') role?: Role,
  ) {
    return this.usersService.findAll(pagination, search, role);
  }

  @Get('coordinators')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get all active coordinators' })
  findCoordinators() {
    return this.usersService.findCoordinators();
  }

  @Get(':id')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: User,
  ) {
    return this.usersService.update(id, dto, actor.id, actor.role);
  }

  @Patch(':id/deactivate')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user account (OPS_MANAGER only)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user account (OPS_MANAGER only)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }
}

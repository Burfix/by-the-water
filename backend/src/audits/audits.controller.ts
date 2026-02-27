import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuditsService } from './audits.service';
import { StorageService } from '../storage/storage.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { CreateAuditItemDto } from './dto/create-audit-item.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../entities/user.entity';

@ApiTags('Audits')
@ApiBearerAuth('JWT-auth')
@Controller('audits')
export class AuditsController {
  constructor(
    private readonly auditsService: AuditsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(Role.OPS_MANAGER, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'Create a new audit (DRAFT)' })
  create(@Body() dto: CreateAuditDto, @CurrentUser() actor: User) {
    return this.auditsService.create(dto, actor.id);
  }

  @Get()
  @ApiOperation({ summary: 'List audits (role-scoped)' })
  findAll(@Query() filter: FilterAuditDto, @CurrentUser() actor: User) {
    return this.auditsService.findAll(filter, actor.id, actor.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.OPS_MANAGER, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'Update audit' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAuditDto,
    @CurrentUser() actor: User,
  ) {
    return this.auditsService.update(id, dto, actor.id, actor.role);
  }

  @Patch(':id/start')
  @Roles(Role.PROPERTY_COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start an audit (move DRAFT → IN_PROGRESS)' })
  startAudit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: User) {
    return this.auditsService.startAudit(id, actor.id);
  }

  @Patch(':id/submit')
  @Roles(Role.PROPERTY_COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit audit for approval (IN_PROGRESS → SUBMITTED)' })
  submitAudit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: User) {
    return this.auditsService.submitAudit(id, actor.id);
  }

  @Patch(':id/approve')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve submitted audit (SUBMITTED → APPROVED)' })
  approveAudit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: User) {
    return this.auditsService.approveAudit(id, actor.id);
  }

  @Patch(':id/reject')
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject submitted audit (back to IN_PROGRESS)' })
  rejectAudit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() actor: User,
  ) {
    return this.auditsService.rejectAudit(id, reason, actor.id);
  }

  // ── Audit Items ────────────────────────────────────────────────────────────
  @Post(':id/items')
  @Roles(Role.OPS_MANAGER, Role.PROPERTY_COORDINATOR)
  @ApiOperation({ summary: 'Add audit checklist items' })
  addItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() items: CreateAuditItemDto[],
  ) {
    return this.auditsService.addItems(id, items);
  }

  @Patch(':id/items/:itemId')
  @Roles(Role.PROPERTY_COORDINATOR, Role.OPS_MANAGER)
  @ApiOperation({ summary: 'Update an audit item result/notes' })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: Partial<CreateAuditItemDto>,
  ) {
    return this.auditsService.updateItem(id, itemId, dto);
  }

  // ── Audit Photos ───────────────────────────────────────────────────────────
  @Get(':id/photos')
  @ApiOperation({ summary: 'Get all photos for an audit' })
  getPhotos(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditsService.getPhotos(id);
  }

  @Post(':id/photos/upload-url')
  @Roles(Role.PROPERTY_COORDINATOR, Role.OPS_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get signed S3 upload URL for audit photo' })
  getPhotoUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
  ) {
    const key = `audits/${id}/photos/${Date.now()}-${fileName}`;
    return this.storageService.getSignedUploadUrl(key, mimeType);
  }
}

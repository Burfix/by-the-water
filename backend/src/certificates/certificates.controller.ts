import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../entities/user.entity';

@ApiTags('Certificates')
@ApiBearerAuth('JWT-auth')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certService: CertificatesService) {}

  @Post()
  @Roles(Role.PROPERTY_COORDINATOR, Role.OPS_MANAGER, Role.STORE)
  @ApiOperation({ summary: 'Register a new certificate (metadata after S3 upload)' })
  create(@Body() dto: CreateCertificateDto, @CurrentUser() actor: User) {
    return this.certService.create(dto, actor.id);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all certificates for a store' })
  findByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: User,
  ) {
    return this.certService.findAll(storeId, pagination, actor.id, actor.role);
  }

  @Get('expiring')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get certificates expiring within N days' })
  @ApiQuery({ name: 'days', type: Number, required: false })
  findExpiring(@Query('days') days: number = 30) {
    return this.certService.findExpiring(days);
  }

  @Get('expired')
  @Roles(Role.OPS_MANAGER, Role.EXEC)
  @ApiOperation({ summary: 'Get all expired certificates' })
  findExpired() {
    return this.certService.findExpired();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certificate by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.certService.findOne(id);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get signed S3 download URL for certificate' })
  getDownloadUrl(@Param('id', ParseUUIDPipe) id: string) {
    return this.certService.getSignedDownloadUrl(id);
  }

  @Post('upload-url')
  @Roles(Role.PROPERTY_COORDINATOR, Role.OPS_MANAGER, Role.STORE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get signed S3 upload URL for certificate file' })
  getUploadUrl(
    @Body('storeId') storeId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
  ) {
    return this.certService.getUploadUrl(storeId, fileName, mimeType);
  }

  @Delete(':id')
  @Roles(Role.OPS_MANAGER, Role.PROPERTY_COORDINATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a certificate' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.certService.deactivate(id);
  }
}

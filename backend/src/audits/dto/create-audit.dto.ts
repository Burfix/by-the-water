import { IsOptional, IsUUID, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty({ description: 'UUID of the store being audited' })
  @IsUUID()
  storeId: string;

  @ApiPropertyOptional({ description: 'UUID of the coordinator assigned to this audit' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

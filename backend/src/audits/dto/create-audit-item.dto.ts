import { IsString, IsEnum, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditItemResult } from '../../common/enums/audit-status.enum';

export class CreateAuditItemDto {
  @ApiProperty({ example: 'Food Safety' })
  @IsString()
  @MaxLength(200)
  category: string;

  @ApiProperty({ example: 'Is the kitchen temperature logged daily?' })
  @IsString()
  @MaxLength(500)
  question: string;

  @ApiPropertyOptional({ enum: AuditItemResult, default: AuditItemResult.NOT_APPLICABLE })
  @IsOptional()
  @IsEnum(AuditItemResult)
  result?: AuditItemResult = AuditItemResult.NOT_APPLICABLE;

  @ApiPropertyOptional({ description: 'Weight/importance (1–10)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  weight?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

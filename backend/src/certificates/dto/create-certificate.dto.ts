import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  MaxLength,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDto {
  @ApiProperty({ description: 'Store UUID this certificate belongs to' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ example: 'Food Safety Certificate' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'FOOD_SAFETY' })
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ description: 'S3 object key returned from upload-url endpoint' })
  @IsString()
  @MaxLength(500)
  s3Key: string;

  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  @MaxLength(255)
  s3Bucket: string;

  @ApiProperty({ example: 'food_cert_2025.pdf' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(100)
  mimeType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  fileSizeBytes?: number;
}

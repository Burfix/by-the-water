import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrecinctDto {
  @ApiProperty({ example: 'Northern Precinct' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Covers all stores in the northern region' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Gauteng North' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  region?: string;
}

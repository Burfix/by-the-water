import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@compliance.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@1234!' })
  @IsString()
  @MinLength(6)
  password: string;
}

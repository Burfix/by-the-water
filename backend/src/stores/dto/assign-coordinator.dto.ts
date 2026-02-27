import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCoordinatorDto {
  @ApiProperty({ description: 'UUID of the coordinator user to assign' })
  @IsUUID()
  coordinatorId: string;
}

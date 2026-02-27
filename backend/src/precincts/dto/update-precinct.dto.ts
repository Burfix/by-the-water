import { PartialType } from '@nestjs/swagger';
import { CreatePrecinctDto } from './create-precinct.dto';

export class UpdatePrecinctDto extends PartialType(CreatePrecinctDto) {}

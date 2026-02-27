import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrecinctsController } from './precincts.controller';
import { PrecinctsService } from './precincts.service';
import { Precinct } from '../entities/precinct.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Precinct])],
  controllers: [PrecinctsController],
  providers: [PrecinctsService],
  exports: [PrecinctsService],
})
export class PrecinctsModule {}

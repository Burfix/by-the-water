import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseUploadController } from './database-upload.controller';
import { DatabaseUploadService } from './database-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [DatabaseUploadController],
  providers: [DatabaseUploadService],
})
export class DatabaseUploadModule {}

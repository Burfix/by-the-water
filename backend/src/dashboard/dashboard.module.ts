import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Audit } from '../entities/audit.entity';
import { Store } from '../entities/store.entity';
import { Certificate } from '../entities/certificate.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audit, Store, Certificate, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

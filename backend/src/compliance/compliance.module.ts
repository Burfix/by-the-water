import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { AuditItem } from '../entities/audit-item.entity';
import { Audit } from '../entities/audit.entity';
import { Store } from '../entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditItem, Audit, Store])],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}

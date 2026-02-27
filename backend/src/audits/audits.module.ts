import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditsController } from './audits.controller';
import { AuditsService } from './audits.service';
import { Audit } from '../entities/audit.entity';
import { AuditItem } from '../entities/audit-item.entity';
import { AuditPhoto } from '../entities/audit-photo.entity';
import { Store } from '../entities/store.entity';
import { StoreAssignment } from '../entities/store-assignment.entity';
import { ComplianceModule } from '../compliance/compliance.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audit, AuditItem, AuditPhoto, Store, StoreAssignment]),
    ComplianceModule,
    StorageModule,
  ],
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService],
})
export class AuditsModule {}

import { Module } from '@nestjs/common';
import { CertificateExpiryService } from './certificate-expiry.service';
import { CertificatesModule } from '../certificates/certificates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CertificatesModule, NotificationsModule, ConfigModule],
  providers: [CertificateExpiryService],
})
export class SchedulerModule {}

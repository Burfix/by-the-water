import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CertificatesService } from '../certificates/certificates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums/notification-type.enum';

@Injectable()
export class CertificateExpiryService {
  private readonly logger = new Logger(CertificateExpiryService.name);

  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Run daily at 07:00 (server time) to detect and notify about
   * expiring or expired certificates.
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkExpiringCertificates(): Promise<void> {
    this.logger.log('Running daily certificate expiry check...');

    const warningDays = this.config.get<number>('app.certExpiryWarningDays', 30);
    const criticalDays = this.config.get<number>('app.certExpiryCriticalDays', 7);

    try {
      // Refresh all expiry status flags
      const refreshed = await this.certificatesService.refreshExpiryStatuses();
      this.logger.log(`Refreshed expiry status on ${refreshed} certificates`);

      // --- Critical threshold ---
      const critical = await this.certificatesService.findExpiring(criticalDays);
      if (critical.length > 0) {
        const notifications = critical.map((cert) => ({
          storeId: cert.storeId,
          type: NotificationType.CERTIFICATE_EXPIRY_CRITICAL,
          title: `⚠️ Certificate expiring in ${cert.daysUntilExpiry} day(s)`,
          message: `"${cert.name}" for store "${cert.store?.name}" expires on ${cert.expiryDate}. Immediate action required.`,
          data: {
            certificateId: cert.id,
            certificateName: cert.name,
            expiryDate: cert.expiryDate,
            daysUntilExpiry: cert.daysUntilExpiry,
          },
        }));
        await this.notificationsService.createBulk(notifications);
        this.logger.warn(`Sent ${critical.length} critical expiry notifications`);
      }

      // --- Warning threshold (exclude those already in critical) ---
      const allWarning = await this.certificatesService.findExpiring(warningDays);
      const criticalIds = new Set(critical.map((c) => c.id));
      const warningOnly = allWarning.filter((c) => !criticalIds.has(c.id));

      if (warningOnly.length > 0) {
        const notifications = warningOnly.map((cert) => ({
          storeId: cert.storeId,
          type: NotificationType.CERTIFICATE_EXPIRY_WARNING,
          title: `📋 Certificate expiring soon (${cert.daysUntilExpiry} days)`,
          message: `"${cert.name}" for store "${cert.store?.name}" expires on ${cert.expiryDate}.`,
          data: {
            certificateId: cert.id,
            certificateName: cert.name,
            expiryDate: cert.expiryDate,
            daysUntilExpiry: cert.daysUntilExpiry,
          },
        }));
        await this.notificationsService.createBulk(notifications);
        this.logger.log(`Sent ${warningOnly.length} warning expiry notifications`);
      }

      // --- Already expired ---
      const expired = await this.certificatesService.findExpired();
      if (expired.length > 0) {
        const notifications = expired.map((cert) => ({
          storeId: cert.storeId,
          type: NotificationType.CERTIFICATE_EXPIRED,
          title: '🚫 Certificate EXPIRED',
          message: `"${cert.name}" for store "${cert.store?.name}" has expired. Please renew immediately.`,
          data: { certificateId: cert.id, expiryDate: cert.expiryDate },
        }));
        await this.notificationsService.createBulk(notifications);
        this.logger.error(`Sent ${expired.length} expired certificate notifications`);
      }

      this.logger.log('Certificate expiry check completed');
    } catch (err) {
      this.logger.error(`Certificate expiry job failed: ${err.message}`, err.stack);
    }
  }
}

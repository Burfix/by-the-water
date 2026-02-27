import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditItem } from '../entities/audit-item.entity';
import { Store } from '../entities/store.entity';
import { Audit } from '../entities/audit.entity';
import { AuditItemResult, AuditStatus } from '../common/enums/audit-status.enum';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(AuditItem)
    private readonly itemRepo: Repository<AuditItem>,
    @InjectRepository(Audit)
    private readonly auditRepo: Repository<Audit>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
  ) {}

  /**
   * Calculate compliance score for an audit.
   *
   * Score formula:
   *   Σ(weight of PASS items) / Σ(weight of applicable items) × 100
   *
   * NOT_APPLICABLE items are excluded from both numerator and denominator.
   * Returns 100 if no applicable items exist.
   */
  async calculateScore(auditId: string): Promise<number> {
    const items = await this.itemRepo.find({ where: { auditId } });

    const applicable = items.filter((i) => i.result !== AuditItemResult.NOT_APPLICABLE);

    if (applicable.length === 0) {
      this.logger.warn(`Audit ${auditId} has no applicable items — score defaults to 100`);
      return 100;
    }

    const totalWeight = applicable.reduce((sum, i) => sum + i.weight, 0);
    const passedWeight = applicable
      .filter((i) => i.result === AuditItemResult.PASS)
      .reduce((sum, i) => sum + i.weight, 0);

    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100 * 100) / 100 : 0;

    this.logger.debug(
      `Audit ${auditId} score: ${score}% (passed ${passedWeight}/${totalWeight} weight)`,
    );

    return score;
  }

  /**
   * Update a store's overall compliance score based on the average
   * of its last 3 APPROVED audits.
   */
  async updateStoreScore(storeId: string): Promise<void> {
    const recentAudits = await this.auditRepo.find({
      where: { storeId, status: AuditStatus.APPROVED },
      order: { completedDate: 'DESC' },
      take: 3,
    });

    if (recentAudits.length === 0) {
      return;
    }

    const validAudits = recentAudits.filter((a) => a.complianceScore !== null);
    if (validAudits.length === 0) return;

    const avgScore =
      validAudits.reduce((sum, a) => sum + Number(a.complianceScore), 0) / validAudits.length;

    const rounded = Math.round(avgScore * 100) / 100;

    await this.storeRepo.update(storeId, { complianceScore: rounded });
    this.logger.log(`Store ${storeId} compliance score updated to ${rounded}%`);
  }
}

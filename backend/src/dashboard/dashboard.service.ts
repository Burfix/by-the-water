import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from '../entities/audit.entity';
import { Store } from '../entities/store.entity';
import { Certificate } from '../entities/certificate.entity';
import { User } from '../entities/user.entity';
import { AuditStatus } from '../common/enums/audit-status.enum';
import { Role } from '../common/enums/role.enum';

export interface DashboardMetrics {
  totalStores: number;
  totalAudits: number;
  pendingAudits: number;
  approvedAudits: number;
  averageComplianceScore: number;
  expiringCertificates: number;
  expiredCertificates: number;
  activeCoordinators: number;
  auditsByStatus: { status: string; count: number }[];
  topPerformingStores: { storeId: string; storeName: string; score: number }[];
  lowPerformingStores: { storeId: string; storeName: string; score: number }[];
  recentAudits: Partial<Audit>[];
  complianceTrend: { month: string; avgScore: number }[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepo: Repository<Audit>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(Certificate)
    private readonly certRepo: Repository<Certificate>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [
      totalStores,
      totalAudits,
      pendingAudits,
      approvedAudits,
      activeCoordinators,
    ] = await Promise.all([
      this.storeRepo.count({ where: { isActive: true } }),
      this.auditRepo.count(),
      this.auditRepo.count({ where: { status: AuditStatus.SUBMITTED } }),
      this.auditRepo.count({ where: { status: AuditStatus.APPROVED } }),
      this.userRepo.count({ where: { role: Role.PROPERTY_COORDINATOR, isActive: true } }),
    ]);

    // Average compliance score across all active stores
    const avgResult = await this.storeRepo
      .createQueryBuilder('s')
      .select('AVG(s.complianceScore)', 'avg')
      .where('s.isActive = true')
      .getRawOne<{ avg: string }>();

    const averageComplianceScore = Math.round(Number(avgResult?.avg || 0) * 100) / 100;

    // Certificate stats
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + 30);

    const [expiringCertificates, expiredCertificates] = await Promise.all([
      this.certRepo
        .createQueryBuilder('c')
        .where('c.isActive = true AND c.isExpired = false AND c.expiryDate <= :d', {
          d: warningDate,
        })
        .getCount(),
      this.certRepo.count({ where: { isActive: true, isExpired: true } }),
    ]);

    // Audits by status
    const auditsByStatusRaw = await this.auditRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.status')
      .getRawMany<{ status: string; count: string }>();

    const auditsByStatus = auditsByStatusRaw.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));

    // Top and low performing stores
    const topPerformingStores = await this.storeRepo.find({
      where: { isActive: true },
      order: { complianceScore: 'DESC' },
      take: 5,
      select: ['id', 'name', 'complianceScore'],
    });

    const lowPerformingStores = await this.storeRepo.find({
      where: { isActive: true },
      order: { complianceScore: 'ASC' },
      take: 5,
      select: ['id', 'name', 'complianceScore'],
    });

    // Recent audits
    const recentAudits = await this.auditRepo.find({
      relations: ['store', 'assignedTo'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Compliance trend (last 6 months)
    const complianceTrend = await this.getComplianceTrend(6);

    return {
      totalStores,
      totalAudits,
      pendingAudits,
      approvedAudits,
      averageComplianceScore,
      expiringCertificates,
      expiredCertificates,
      activeCoordinators,
      auditsByStatus,
      topPerformingStores: topPerformingStores.map((s) => ({
        storeId: s.id,
        storeName: s.name,
        score: Number(s.complianceScore),
      })),
      lowPerformingStores: lowPerformingStores.map((s) => ({
        storeId: s.id,
        storeName: s.name,
        score: Number(s.complianceScore),
      })),
      recentAudits,
      complianceTrend,
    };
  }

  async getPrecinctSummary(): Promise<{ precinctName: string; storeCount: number; avgScore: number }[]> {
    return this.storeRepo
      .createQueryBuilder('store')
      .leftJoin('store.precinct', 'precinct')
      .select('precinct.name', 'precinctName')
      .addSelect('COUNT(store.id)', 'storeCount')
      .addSelect('AVG(store.complianceScore)', 'avgScore')
      .where('store.isActive = true')
      .groupBy('precinct.id, precinct.name')
      .orderBy('precinct.name', 'ASC')
      .getRawMany<{ precinctName: string; storeCount: string; avgScore: string }>()
      .then((rows) =>
        rows.map((r) => ({
          precinctName: r.precinctName,
          storeCount: parseInt(r.storeCount, 10),
          avgScore: Math.round(Number(r.avgScore || 0) * 100) / 100,
        })),
      );
  }

  private async getComplianceTrend(months: number): Promise<{ month: string; avgScore: number }[]> {
    const results = await this.auditRepo
      .createQueryBuilder('a')
      .select("TO_CHAR(DATE_TRUNC('month', a.completed_date), 'YYYY-MM')", 'month')
      .addSelect('AVG(a.compliance_score)', 'avgScore')
      .where('a.status = :status', { status: AuditStatus.APPROVED })
      .andWhere(
        `a.completed_date >= NOW() - INTERVAL '${months} months'`,
      )
      .groupBy("DATE_TRUNC('month', a.completed_date)")
      .orderBy("DATE_TRUNC('month', a.completed_date)", 'ASC')
      .getRawMany<{ month: string; avgScore: string }>();

    return results.map((r) => ({
      month: r.month,
      avgScore: Math.round(Number(r.avgScore || 0) * 100) / 100,
    }));
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Audit } from '../entities/audit.entity';
import { AuditItem } from '../entities/audit-item.entity';
import { AuditPhoto } from '../entities/audit-photo.entity';
import { Store } from '../entities/store.entity';
import { StoreAssignment } from '../entities/store-assignment.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { CreateAuditItemDto } from './dto/create-audit-item.dto';
import { AuditStatus } from '../common/enums/audit-status.enum';
import { Role } from '../common/enums/role.enum';
import { ComplianceService } from '../compliance/compliance.service';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class AuditsService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepo: Repository<Audit>,
    @InjectRepository(AuditItem)
    private readonly itemRepo: Repository<AuditItem>,
    @InjectRepository(AuditPhoto)
    private readonly photoRepo: Repository<AuditPhoto>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreAssignment)
    private readonly assignmentRepo: Repository<StoreAssignment>,
    private readonly complianceService: ComplianceService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateAuditDto, actorId: string): Promise<Audit> {
    const store = await this.storeRepo.findOne({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException(`Store ${dto.storeId} not found`);

    const audit = this.auditRepo.create({
      ...dto,
      createdById: actorId,
      status: AuditStatus.DRAFT,
    });

    return this.auditRepo.save(audit);
  }

  async findAll(filter: FilterAuditDto, actorId: string, actorRole: Role): Promise<PaginatedResult<Audit>> {
    const { page = 1, limit = 20, storeId, status, precinctId, minScore, maxScore, scheduledFrom, scheduledTo } = filter;

    const query = this.auditRepo.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.store', 'store')
      .leftJoinAndSelect('store.precinct', 'precinct')
      .leftJoinAndSelect('audit.assignedTo', 'assignedTo')
      .leftJoinAndSelect('audit.createdBy', 'createdBy');

    // PROPERTY_COORDINATOR only sees their assigned audits
    if (actorRole === Role.PROPERTY_COORDINATOR) {
      query.andWhere('audit.assignedToId = :actorId', { actorId });
    }

    // STORE role only sees audits for their store
    if (actorRole === Role.STORE) {
      const assignment = await this.assignmentRepo.findOne({
        where: { userId: actorId, isActive: true },
      });
      if (!assignment) throw new ForbiddenException('No store assignment found');
      query.andWhere('audit.storeId = :storeId', { storeId: assignment.storeId });
    }

    if (storeId) query.andWhere('audit.storeId = :storeId', { storeId });
    if (status) query.andWhere('audit.status = :status', { status });
    if (precinctId) query.andWhere('precinct.id = :precinctId', { precinctId });
    if (minScore !== undefined) query.andWhere('audit.complianceScore >= :minScore', { minScore });
    if (maxScore !== undefined) query.andWhere('audit.complianceScore <= :maxScore', { maxScore });
    if (scheduledFrom) query.andWhere('audit.scheduledDate >= :scheduledFrom', { scheduledFrom });
    if (scheduledTo) query.andWhere('audit.scheduledDate <= :scheduledTo', { scheduledTo });

    query
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findOne(id: string): Promise<Audit> {
    const audit = await this.auditRepo.findOne({
      where: { id },
      relations: ['store', 'store.precinct', 'assignedTo', 'createdBy', 'approvedBy', 'items', 'photos'],
    });
    if (!audit) throw new NotFoundException(`Audit ${id} not found`);
    return audit;
  }

  async update(id: string, dto: UpdateAuditDto, actorId: string, actorRole: Role): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status === AuditStatus.APPROVED) {
      throw new BadRequestException('Cannot modify an approved audit');
    }

    if (actorRole === Role.PROPERTY_COORDINATOR && audit.assignedToId !== actorId) {
      throw new ForbiddenException('You can only update audits assigned to you');
    }

    Object.assign(audit, dto);
    return this.auditRepo.save(audit);
  }

  async startAudit(id: string, actorId: string): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status !== AuditStatus.DRAFT) {
      throw new BadRequestException(`Cannot start audit in ${audit.status} status`);
    }

    if (audit.assignedToId !== actorId) {
      throw new ForbiddenException('You can only start audits assigned to you');
    }

    audit.status = AuditStatus.IN_PROGRESS;
    return this.auditRepo.save(audit);
  }

  async submitAudit(id: string, actorId: string): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status !== AuditStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot submit audit in ${audit.status} status`);
    }

    if (audit.assignedToId !== actorId) {
      throw new ForbiddenException('Only the assigned coordinator can submit this audit');
    }

    // Calculate compliance score before submission
    const score = await this.complianceService.calculateScore(id);

    audit.status = AuditStatus.SUBMITTED;
    audit.completedDate = new Date();
    audit.complianceScore = score;

    const saved = await this.auditRepo.save(audit);

    // Update store's overall compliance score
    await this.complianceService.updateStoreScore(audit.storeId);

    return saved;
  }

  async approveAudit(id: string, actorId: string): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status !== AuditStatus.SUBMITTED) {
      throw new BadRequestException(`Cannot approve audit in ${audit.status} status`);
    }

    audit.status = AuditStatus.APPROVED;
    audit.approvedById = actorId;
    return this.auditRepo.save(audit);
  }

  async rejectAudit(id: string, reason: string, actorId: string): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status !== AuditStatus.SUBMITTED) {
      throw new BadRequestException(`Cannot reject audit in ${audit.status} status`);
    }

    audit.status = AuditStatus.IN_PROGRESS;
    audit.rejectionReason = reason;
    return this.auditRepo.save(audit);
  }

  async addItems(auditId: string, items: CreateAuditItemDto[]): Promise<AuditItem[]> {
    const audit = await this.findOne(auditId);

    if (audit.status === AuditStatus.APPROVED || audit.status === AuditStatus.SUBMITTED) {
      throw new BadRequestException('Cannot add items to a submitted/approved audit');
    }

    const auditItems = items.map((item, index) =>
      this.itemRepo.create({ ...item, auditId, sortOrder: index }),
    );

    return this.itemRepo.save(auditItems);
  }

  async updateItem(
    auditId: string,
    itemId: string,
    dto: Partial<CreateAuditItemDto>,
  ): Promise<AuditItem> {
    const item = await this.itemRepo.findOne({ where: { id: itemId, auditId } });
    if (!item) throw new NotFoundException(`Audit item ${itemId} not found`);
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async getPhotos(auditId: string): Promise<AuditPhoto[]> {
    await this.findOne(auditId); // validate exists
    return this.photoRepo.find({
      where: { auditId },
      relations: ['uploadedBy', 'auditItem'],
      order: { createdAt: 'DESC' },
    });
  }
}

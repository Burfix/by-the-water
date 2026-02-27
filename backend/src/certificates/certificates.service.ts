import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { Certificate } from '../entities/certificate.entity';
import { Store } from '../entities/store.entity';
import { StoreAssignment } from '../entities/store-assignment.entity';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { StorageService } from '../storage/storage.service';
import { Role } from '../common/enums/role.enum';
import { PaginationDto, PaginatedResult, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certRepo: Repository<Certificate>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreAssignment)
    private readonly assignmentRepo: Repository<StoreAssignment>,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateCertificateDto, uploadedById: string): Promise<Certificate> {
    const store = await this.storeRepo.findOne({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException(`Store ${dto.storeId} not found`);

    const cert = this.certRepo.create({ ...dto, uploadedById });
    return this.certRepo.save(cert);
  }

  async findAll(
    storeId: string,
    pagination: PaginationDto,
    actorId: string,
    actorRole: Role,
  ): Promise<PaginatedResult<Certificate>> {
    const { page = 1, limit = 20 } = pagination;

    // Validate access
    if (actorRole === Role.PROPERTY_COORDINATOR || actorRole === Role.STORE) {
      const assignment = await this.assignmentRepo.findOne({
        where: { userId: actorId, storeId, isActive: true },
      });
      if (!assignment) throw new ForbiddenException('Access denied to this store\'s certificates');
    }

    const [items, total] = await this.certRepo.findAndCount({
      where: { storeId, isActive: true },
      relations: ['uploadedBy'],
      order: { expiryDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  async findExpiring(days: number): Promise<Certificate[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return this.certRepo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.store', 'store')
      .leftJoinAndSelect('store.precinct', 'precinct')
      .where('cert.isActive = true')
      .andWhere('cert.isExpired = false')
      .andWhere('cert.expiryDate <= :cutoff', { cutoff: cutoffDate })
      .orderBy('cert.expiryDate', 'ASC')
      .getMany();
  }

  async findExpired(): Promise<Certificate[]> {
    return this.certRepo
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.store', 'store')
      .where('cert.isActive = true AND cert.isExpired = true')
      .getMany();
  }

  async findOne(id: string): Promise<Certificate> {
    const cert = await this.certRepo.findOne({
      where: { id },
      relations: ['store', 'uploadedBy'],
    });
    if (!cert) throw new NotFoundException(`Certificate ${id} not found`);
    return cert;
  }

  async getSignedDownloadUrl(id: string): Promise<{ url: string }> {
    const cert = await this.findOne(id);
    const url = await this.storageService.getSignedDownloadUrl(cert.s3Key);
    return { url };
  }

  async getUploadUrl(
    storeId: string,
    fileName: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; s3Key: string; s3Bucket: string }> {
    const key = `certificates/${storeId}/${Date.now()}-${fileName}`;
    const result = await this.storageService.getSignedUploadUrl(key, mimeType);
    return result;
  }

  async deactivate(id: string): Promise<void> {
    const cert = await this.findOne(id);
    cert.isActive = false;
    await this.certRepo.save(cert);
  }

  async refreshExpiryStatuses(): Promise<number> {
    const certs = await this.certRepo.find({ where: { isActive: true } });
    let updated = 0;

    for (const cert of certs) {
      const prev = { isExpired: cert.isExpired, isExpiringSoon: cert.isExpiringSoon };
      cert.computeExpiryStatus();
      if (cert.isExpired !== prev.isExpired || cert.isExpiringSoon !== prev.isExpiringSoon) {
        await this.certRepo.save(cert);
        updated++;
      }
    }

    return updated;
  }
}

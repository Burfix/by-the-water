import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { StoreAssignment } from '../entities/store-assignment.entity';
import { User } from '../entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FilterStoreDto } from './dto/filter-store.dto';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(StoreAssignment)
    private readonly assignmentRepo: Repository<StoreAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateStoreDto): Promise<Store> {
    if (dto.storeCode) {
      const existing = await this.storeRepo.findOne({ where: { storeCode: dto.storeCode } });
      if (existing) throw new ConflictException(`Store code ${dto.storeCode} already exists`);
    }
    const store = this.storeRepo.create(dto);
    return this.storeRepo.save(store);
  }

  async findAll(
    filter: FilterStoreDto,
    actorId: string,
    actorRole: Role,
  ): Promise<PaginatedResult<Store>> {
    const { page = 1, limit = 20, search, precinctId, minScore, maxScore } = filter;

    const query = this.storeRepo.createQueryBuilder('store')
      .leftJoinAndSelect('store.precinct', 'precinct')
      .leftJoinAndSelect('store.assignments', 'assignments', 'assignments.isActive = true')
      .leftJoinAndSelect('assignments.user', 'coordinator')
      .where('store.isActive = true');

    // PROPERTY_COORDINATOR only sees assigned stores
    if (actorRole === Role.PROPERTY_COORDINATOR) {
      query.andWhere(
        'assignments.userId = :actorId AND assignments.isActive = true',
        { actorId },
      );
    }

    // STORE users can only see their own store via a separate endpoint
    if (actorRole === Role.STORE) {
      throw new ForbiddenException('Use /stores/my-store endpoint');
    }

    if (search) {
      query.andWhere(
        '(store.name ILIKE :search OR store.storeCode ILIKE :search OR store.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (precinctId) {
      query.andWhere('store.precinctId = :precinctId', { precinctId });
    }

    if (minScore !== undefined) {
      query.andWhere('store.complianceScore >= :minScore', { minScore });
    }

    if (maxScore !== undefined) {
      query.andWhere('store.complianceScore <= :maxScore', { maxScore });
    }

    query
      .orderBy('store.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findMyStore(userId: string): Promise<Store> {
    // For STORE role users — their user account is linked to a store by email
    const assignment = await this.assignmentRepo.findOne({
      where: { userId, isActive: true },
      relations: ['store', 'store.precinct'],
    });

    if (!assignment) throw new NotFoundException('No store assigned to your account');
    return assignment.store;
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepo.findOne({
      where: { id },
      relations: ['precinct', 'assignments', 'assignments.user'],
    });
    if (!store) throw new NotFoundException(`Store ${id} not found`);
    return store;
  }

  async update(id: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    store.isActive = false;
    await this.storeRepo.save(store);
  }

  async assignCoordinator(
    storeId: string,
    dto: AssignCoordinatorDto,
    actorId: string,
  ): Promise<StoreAssignment> {
    const store = await this.findOne(storeId);
    const coordinator = await this.userRepo.findOne({
      where: { id: dto.coordinatorId, role: Role.PROPERTY_COORDINATOR, isActive: true },
    });

    if (!coordinator) {
      throw new NotFoundException(`Coordinator ${dto.coordinatorId} not found or not active`);
    }

    // Deactivate existing assignment if present
    await this.assignmentRepo.update(
      { storeId, userId: dto.coordinatorId },
      { isActive: false },
    );

    const assignment = this.assignmentRepo.create({
      storeId,
      userId: dto.coordinatorId,
      assignedById: actorId,
      isActive: true,
    });

    return this.assignmentRepo.save(assignment);
  }

  async removeCoordinatorAssignment(storeId: string, coordinatorId: string): Promise<void> {
    await this.assignmentRepo.update(
      { storeId, userId: coordinatorId },
      { isActive: false },
    );
  }

  async getStoresByPrecinct(): Promise<{ precinctId: string; precinctName: string; stores: Store[] }[]> {
    const stores = await this.storeRepo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.precinct', 'precinct')
      .where('store.isActive = true')
      .orderBy('precinct.name', 'ASC')
      .addOrderBy('store.name', 'ASC')
      .getMany();

    const grouped = new Map<string, { precinctId: string; precinctName: string; stores: Store[] }>();

    for (const store of stores) {
      if (!store.precinct) continue;
      if (!grouped.has(store.precinctId)) {
        grouped.set(store.precinctId, {
          precinctId: store.precinctId,
          precinctName: store.precinct.name,
          stores: [],
        });
      }
      grouped.get(store.precinctId)!.stores.push(store);
    }

    return Array.from(grouped.values());
  }
}

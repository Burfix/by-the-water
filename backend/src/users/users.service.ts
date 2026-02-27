import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto, actorRole: Role): Promise<User> {
    // Only OPS_MANAGER can create users (admins promote)
    const existing = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already in use');

    const user = this.userRepo.create({ ...dto, email: dto.email.toLowerCase() });
    return this.userRepo.save(user);
  }

  async findAll(
    pagination: PaginationDto,
    search?: string,
    role?: Role,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20 } = pagination;

    const query = this.userRepo.createQueryBuilder('user');

    if (search) {
      query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    query.orderBy('user.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string, actorRole: Role): Promise<User> {
    const user = await this.findOne(id);

    // Users can only update their own profile unless they are OPS_MANAGER
    if (actorId !== id && actorRole !== Role.OPS_MANAGER) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Only OPS_MANAGER can change roles
    if (dto.role && actorRole !== Role.OPS_MANAGER) {
      throw new ForbiddenException('Only OPS_MANAGER can change roles');
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    return this.userRepo.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    return this.userRepo.save(user);
  }

  async findCoordinators(): Promise<User[]> {
    return this.userRepo.find({
      where: { role: Role.PROPERTY_COORDINATOR, isActive: true },
      order: { firstName: 'ASC' },
    });
  }
}

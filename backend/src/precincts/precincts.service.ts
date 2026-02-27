import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Precinct } from '../entities/precinct.entity';
import { CreatePrecinctDto } from './dto/create-precinct.dto';
import { UpdatePrecinctDto } from './dto/update-precinct.dto';
import { PaginationDto, PaginatedResult, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class PrecinctsService {
  constructor(
    @InjectRepository(Precinct)
    private readonly precinctRepo: Repository<Precinct>,
  ) {}

  async create(dto: CreatePrecinctDto): Promise<Precinct> {
    const precinct = this.precinctRepo.create(dto);
    return this.precinctRepo.save(precinct);
  }

  async findAll(pagination: PaginationDto, search?: string): Promise<PaginatedResult<Precinct>> {
    const { page = 1, limit = 20 } = pagination;

    const query = this.precinctRepo.createQueryBuilder('precinct')
      .loadRelationCountAndMap('precinct.storeCount', 'precinct.stores');

    if (search) {
      query.andWhere('precinct.name ILIKE :search OR precinct.region ILIKE :search', {
        search: `%${search}%`,
      });
    }

    query.orderBy('precinct.name', 'ASC').skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findOne(id: string): Promise<Precinct> {
    const precinct = await this.precinctRepo.findOne({
      where: { id },
      relations: ['stores'],
    });
    if (!precinct) throw new NotFoundException(`Precinct ${id} not found`);
    return precinct;
  }

  async update(id: string, dto: UpdatePrecinctDto): Promise<Precinct> {
    const precinct = await this.findOne(id);
    Object.assign(precinct, dto);
    return this.precinctRepo.save(precinct);
  }

  async remove(id: string): Promise<void> {
    const precinct = await this.findOne(id);
    precinct.isActive = false;
    await this.precinctRepo.save(precinct);
  }
}

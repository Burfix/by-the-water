import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { PaginationDto, PaginatedResult, paginate } from '../common/dto/pagination.dto';

export interface CreateNotificationData {
  userId?: string;
  storeId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(input: CreateNotificationData): Promise<Notification> {
    const notification = this.notificationRepo.create(input);
    return this.notificationRepo.save(notification);
  }

  async createBulk(inputs: CreateNotificationData[]): Promise<void> {
    const notifications = inputs.map((n) => this.notificationRepo.create(n));
    await this.notificationRepo.save(notifications);
  }

  async findForUser(
    userId: string,
    pagination: PaginationDto,
    unreadOnly = false,
  ): Promise<PaginatedResult<Notification>> {
    const { page = 1, limit = 20 } = pagination;

    const query = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (unreadOnly) {
      query.andWhere('n.isRead = false');
    }

    const [items, total] = await query.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findForStore(
    storeId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Notification>> {
    const { page = 1, limit = 20 } = pagination;

    const [items, total] = await this.notificationRepo.findAndCount({
      where: { storeId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      // Return a placeholder if not found
      throw new Error(`Notification ${id} not found for user ${userId}`);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllReadForUser(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }
}

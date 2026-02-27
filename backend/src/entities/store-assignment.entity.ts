import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Store } from './store.entity';

@Entity('store_assignments')
@Unique(['userId', 'storeId'])
export class StoreAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.storeAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => Store, (s) => s.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'assigned_by_id', nullable: true })
  assignedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy: User;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt: Date;
}

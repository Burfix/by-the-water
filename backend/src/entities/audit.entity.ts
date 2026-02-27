import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AuditStatus } from '../common/enums/audit-status.enum';
import { Store } from './store.entity';
import { User } from './user.entity';
import { AuditItem } from './audit-item.entity';
import { AuditPhoto } from './audit-photo.entity';

@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => Store, (s) => s.audits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, (u) => u.audits, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.DRAFT,
  })
  status: AuditStatus;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ name: 'completed_date', type: 'timestamptz', nullable: true })
  completedDate: Date;

  @Column({ name: 'compliance_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  complianceScore: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ length: 200, nullable: true })
  title: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────────────────────
  @OneToMany(() => AuditItem, (i) => i.audit, { cascade: true })
  items: AuditItem[];

  @OneToMany(() => AuditPhoto, (p) => p.audit, { cascade: true })
  photos: AuditPhoto[];
}

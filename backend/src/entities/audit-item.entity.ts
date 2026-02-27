import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditItemResult } from '../common/enums/audit-status.enum';
import { Audit } from './audit.entity';

@Entity('audit_items')
export class AuditItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'audit_id' })
  auditId: string;

  @ManyToOne(() => Audit, (a) => a.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'audit_id' })
  audit: Audit;

  @Column({ length: 200 })
  category: string;

  @Column({ length: 500 })
  question: string;

  @Column({
    type: 'enum',
    enum: AuditItemResult,
    default: AuditItemResult.NOT_APPLICABLE,
  })
  result: AuditItemResult;

  /** Weight 0–100 representing importance of this item to overall score */
  @Column({ type: 'int', default: 1 })
  weight: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

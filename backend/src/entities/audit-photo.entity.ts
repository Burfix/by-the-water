import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Audit } from './audit.entity';
import { AuditItem } from './audit-item.entity';
import { User } from './user.entity';

@Entity('audit_photos')
export class AuditPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'audit_id' })
  auditId: string;

  @ManyToOne(() => Audit, (a) => a.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'audit_id' })
  audit: Audit;

  @Column({ name: 'audit_item_id', nullable: true })
  auditItemId: string;

  @ManyToOne(() => AuditItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'audit_item_id' })
  auditItem: AuditItem;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User, (u) => u.uploadedPhotos)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ name: 's3_key', length: 500 })
  s3Key: string;

  @Column({ name: 's3_bucket', length: 255 })
  s3Bucket: string;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ name: 'file_size_bytes', type: 'bigint', nullable: true })
  fileSizeBytes: number;

  @Column({ type: 'text', nullable: true })
  caption: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

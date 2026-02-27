import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Store } from './store.entity';
import { User } from './user.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => Store, (s) => s.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User, (u) => u.uploadedCertificates)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  type: string;

  @Column({ name: 'issued_date', type: 'date', nullable: true })
  issuedDate: Date;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

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

  @Column({ name: 'is_expired', default: false })
  isExpired: boolean;

  @Column({ name: 'is_expiring_soon', default: false })
  isExpiringSoon: boolean;

  @Column({ name: 'days_until_expiry', type: 'int', nullable: true })
  daysUntilExpiry: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  computeExpiryStatus(): void {
    if (this.expiryDate) {
      const today = new Date();
      const expiry = new Date(this.expiryDate);
      const diffMs = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      this.daysUntilExpiry = diffDays;
      this.isExpired = diffDays < 0;
      this.isExpiringSoon = diffDays >= 0 && diffDays <= 30;
    }
  }
}

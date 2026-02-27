import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { StoreAssignment } from './store-assignment.entity';
import { Audit } from './audit.entity';
import { AuditPhoto } from './audit-photo.entity';
import { Certificate } from './certificate.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ type: 'enum', enum: Role, default: Role.STORE })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'phone', length: 50, nullable: true })
  phone: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────────────────────
  @OneToMany(() => StoreAssignment, (sa) => sa.user)
  storeAssignments: StoreAssignment[];

  @OneToMany(() => Audit, (a) => a.assignedTo)
  audits: Audit[];

  @OneToMany(() => AuditPhoto, (p) => p.uploadedBy)
  uploadedPhotos: AuditPhoto[];

  @OneToMany(() => Certificate, (c) => c.uploadedBy)
  uploadedCertificates: Certificate[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  // ── Hooks ──────────────────────────────────────────────────────────────────
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

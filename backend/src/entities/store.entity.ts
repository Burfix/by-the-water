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
import { Precinct } from './precinct.entity';
import { StoreAssignment } from './store-assignment.entity';
import { Audit } from './audit.entity';
import { Certificate } from './certificate.entity';
import { Notification } from './notification.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ name: 'store_code', unique: true, length: 50, nullable: true })
  storeCode: string;

  @Column({ name: 'compliance_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  complianceScore: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'precinct_id' })
  precinctId: string;

  @ManyToOne(() => Precinct, (p) => p.stores, { eager: false })
  @JoinColumn({ name: 'precinct_id' })
  precinct: Precinct;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────────────────────
  @OneToMany(() => StoreAssignment, (sa) => sa.store)
  assignments: StoreAssignment[];

  @OneToMany(() => Audit, (a) => a.store)
  audits: Audit[];

  @OneToMany(() => Certificate, (c) => c.store)
  certificates: Certificate[];

  @OneToMany(() => Notification, (n) => n.store)
  notifications: Notification[];
}

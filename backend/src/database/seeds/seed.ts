/**
 * Seed script – run with: npm run seed
 *
 * Creates:
 *  - 1 OPS_MANAGER admin user
 *  - 1 EXEC user
 *  - 2 PROPERTY_COORDINATORs
 *  - 2 Precincts
 *  - 4 Stores (2 per precinct)
 *  - Store assignments
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { User } from '../../entities/user.entity';
import { Precinct } from '../../entities/precinct.entity';
import { Store } from '../../entities/store.entity';
import { StoreAssignment } from '../../entities/store-assignment.entity';
import { Role } from '../../common/enums/role.enum';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'compliance_user',
  password: process.env.DB_PASSWORD || 'compliance_pass',
  database: process.env.DB_NAME || 'compliance_db',
  entities: [User, Precinct, Store, StoreAssignment],
  synchronize: true,
  logging: false,
});

async function hashPw(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

async function seed(): Promise<void> {
  console.log('🌱 Connecting to database...');
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const precinctRepo = dataSource.getRepository(Precinct);
  const storeRepo = dataSource.getRepository(Store);
  const assignmentRepo = dataSource.getRepository(StoreAssignment);

  console.log('🌱 Seeding users...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@compliance.local';
  const existing = await userRepo.findOne({ where: { email: adminEmail } });

  if (existing) {
    console.log('ℹ️  Admin user already exists – skipping user seed');
  } else {
    const [adminPw, execPw, coord1Pw, coord2Pw, storePw] = await Promise.all([
      hashPw(process.env.SEED_ADMIN_PASSWORD || 'Admin@1234!'),
      hashPw('Exec@1234!'),
      hashPw('Coord@1234!'),
      hashPw('Coord@1234!'),
      hashPw('Store@1234!'),
    ]);

    const users = await userRepo.save([
      userRepo.create({
        email: adminEmail,
        password: adminPw,
        firstName: process.env.SEED_ADMIN_FIRST_NAME || 'System',
        lastName: process.env.SEED_ADMIN_LAST_NAME || 'Administrator',
        role: Role.OPS_MANAGER,
        isActive: true,
      }),
      userRepo.create({
        email: 'exec@compliance.local',
        password: execPw,
        firstName: 'Executive',
        lastName: 'Viewer',
        role: Role.EXEC,
        isActive: true,
      }),
      userRepo.create({
        email: 'coordinator1@compliance.local',
        password: coord1Pw,
        firstName: 'Alice',
        lastName: 'Coordinator',
        role: Role.PROPERTY_COORDINATOR,
        isActive: true,
      }),
      userRepo.create({
        email: 'coordinator2@compliance.local',
        password: coord2Pw,
        firstName: 'Bob',
        lastName: 'Coordinator',
        role: Role.PROPERTY_COORDINATOR,
        isActive: true,
      }),
      userRepo.create({
        email: 'storemanager@compliance.local',
        password: storePw,
        firstName: 'Store',
        lastName: 'Manager',
        role: Role.STORE,
        isActive: true,
      }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // ── Precincts ─────────────────────────────────────────────────────────
    console.log('🌱 Seeding precincts...');
    const [northPrecinct, southPrecinct] = await precinctRepo.save([
      precinctRepo.create({ name: 'Northern Precinct', region: 'Gauteng North', isActive: true }),
      precinctRepo.create({ name: 'Southern Precinct', region: 'Gauteng South', isActive: true }),
    ]);
    console.log('✅ Created 2 precincts');

    // ── Stores ────────────────────────────────────────────────────────────
    console.log('🌱 Seeding stores...');
    const [store1, store2, store3, store4] = await storeRepo.save([
      storeRepo.create({
        name: 'Sandton Branch',
        storeCode: 'S001',
        address: '123 Rivonia Rd, Sandton',
        email: 'sandton@mychain.co.za',
        phone: '+27113001000',
        precinctId: northPrecinct.id,
        isActive: true,
        complianceScore: 0,
      }),
      storeRepo.create({
        name: 'Rosebank Branch',
        storeCode: 'S002',
        address: '15 Bath Ave, Rosebank',
        email: 'rosebank@mychain.co.za',
        phone: '+27113001001',
        precinctId: northPrecinct.id,
        isActive: true,
        complianceScore: 0,
      }),
      storeRepo.create({
        name: 'Soweto Branch',
        storeCode: 'S003',
        address: '7 Vilakazi St, Soweto',
        email: 'soweto@mychain.co.za',
        phone: '+27113001002',
        precinctId: southPrecinct.id,
        isActive: true,
        complianceScore: 0,
      }),
      storeRepo.create({
        name: 'Alberton Branch',
        storeCode: 'S004',
        address: '22 New Redruth Ave, Alberton',
        email: 'alberton@mychain.co.za',
        phone: '+27113001003',
        precinctId: southPrecinct.id,
        isActive: true,
        complianceScore: 0,
      }),
    ]);
    console.log('✅ Created 4 stores');

    // ── Store Assignments ─────────────────────────────────────────────────
    console.log('🌱 Seeding store assignments...');
    const coordinator1 = users[2];
    const coordinator2 = users[3];
    const storeUser = users[4];

    await assignmentRepo.save([
      assignmentRepo.create({ storeId: store1.id, userId: coordinator1.id, isActive: true, assignedById: users[0].id }),
      assignmentRepo.create({ storeId: store2.id, userId: coordinator1.id, isActive: true, assignedById: users[0].id }),
      assignmentRepo.create({ storeId: store3.id, userId: coordinator2.id, isActive: true, assignedById: users[0].id }),
      assignmentRepo.create({ storeId: store4.id, userId: coordinator2.id, isActive: true, assignedById: users[0].id }),
      // Link store user to store1
      assignmentRepo.create({ storeId: store1.id, userId: storeUser.id, isActive: true, assignedById: users[0].id }),
    ]);
    console.log('✅ Created store assignments');
  }

  await dataSource.destroy();
  console.log('\n🎉 Seed complete!\n');
  console.log('Credentials:');
  console.log('  OPS_MANAGER  : admin@compliance.local       / Admin@1234!');
  console.log('  EXEC         : exec@compliance.local        / Exec@1234!');
  console.log('  COORDINATOR1 : coordinator1@compliance.local / Coord@1234!');
  console.log('  COORDINATOR2 : coordinator2@compliance.local / Coord@1234!');
  console.log('  STORE        : storemanager@compliance.local / Store@1234!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

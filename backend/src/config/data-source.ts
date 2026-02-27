import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'compliance_user',
  password: process.env.DB_PASSWORD || 'compliance_pass',
  database: process.env.DB_NAME || 'compliance_db',
  entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../database/migrations/**/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

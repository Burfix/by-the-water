import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import s3Config from './config/s3.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrecinctsModule } from './precincts/precincts.module';
import { StoresModule } from './stores/stores.module';
import { AuditsModule } from './audits/audits.module';
import { CertificatesModule } from './certificates/certificates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StorageModule } from './storage/storage.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseUploadModule } from './database-upload/database-upload.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Configuration ──────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, s3Config],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ── Database ───────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('app.nodeEnv') === 'production';
        const dbUrl = config.get<string>('database.url');
        const base = {
          type: 'postgres' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          synchronize: config.get<string>('app.nodeEnv') === 'local' || process.env.DB_SYNC === 'true',
          logging: config.get<string>('app.nodeEnv') === 'development',
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          retryAttempts: 10,
          retryDelay: 3000,
        };
        if (dbUrl) {
          return { ...base, url: dbUrl };
        }
        return {
          ...base,
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.user'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.name'),
        };
      },
    }),

    // ── Rate limiting ──────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('app.throttleTtl', 60) * 1000,
          limit: config.get<number>('app.throttleLimit', 100),
        },
      ],
    }),

    // ── Scheduler ─────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature modules ────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    PrecinctsModule,
    StoresModule,
    AuditsModule,
    CertificatesModule,
    NotificationsModule,
    StorageModule,
    ComplianceModule,
    SchedulerModule,
    DashboardModule,
    DatabaseUploadModule,
    HealthModule,
  ],
})
export class AppModule {}

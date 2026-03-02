import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface DatabaseUploadResult {
  success: boolean;
  message: string;
  statementsExecuted: number;
  executedAt: string;
}

@Injectable()
export class DatabaseUploadService {
  private readonly logger = new Logger(DatabaseUploadService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Parses and executes a SQL dump file against the connected PostgreSQL database.
   * Each statement is executed inside a single transaction — if any statement fails
   * the whole upload is rolled back.
   */
  async executeSqlDump(fileBuffer: Buffer, originalName: string): Promise<DatabaseUploadResult> {
    const sql = fileBuffer.toString('utf8');

    if (!sql.trim()) {
      throw new BadRequestException('The uploaded SQL file is empty.');
    }

    // Split on semicolons that are NOT inside string literals (best-effort split)
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    if (statements.length === 0) {
      throw new BadRequestException('No executable SQL statements found in the file.');
    }

    this.logger.log(
      `Starting SQL dump import: "${originalName}" — ${statements.length} statement(s)`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const statement of statements) {
        await queryRunner.query(statement);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `SQL dump import succeeded: ${statements.length} statement(s) committed.`,
      );

      return {
        success: true,
        message: `Database import completed successfully.`,
        statementsExecuted: statements.length,
        executedAt: new Date().toISOString(),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();

      this.logger.error(`SQL dump import failed — transaction rolled back. Error: ${err.message}`);

      throw new InternalServerErrorException(
        `Database import failed and was rolled back: ${err.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}

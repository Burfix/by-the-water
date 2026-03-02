import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** GET /health — always returns 200 if the process is up */
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe — is the process running?' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** GET /ready — returns 200 only if DB is reachable */
  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — is the DB reachable?' })
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ready', db: 'connected', timestamp: new Date().toISOString() };
    } catch (err) {
      // Return 503 by throwing — the global exception filter will catch it
      throw new Error(`Database unreachable: ${(err as Error).message}`);
    }
  }
}

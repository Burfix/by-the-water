import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { DatabaseUploadService } from './database-upload.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

@ApiTags('Database Upload')
@ApiBearerAuth('JWT-auth')
@Controller('database-upload')
export class DatabaseUploadController {
  constructor(private readonly databaseUploadService: DatabaseUploadService) {}

  /**
   * POST /api/v1/database-upload
   *
   * Accepts a multipart/form-data request with a single field named "file"
   * containing a .sql dump. The file is executed inside a single PostgreSQL
   * transaction. Restricted to OPS_MANAGER role only.
   */
  @Post()
  @Roles(Role.OPS_MANAGER)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        const allowed = /\.(sql)$/i;
        if (!allowed.test(file.originalname)) {
          return callback(
            new BadRequestException('Only .sql files are accepted.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload and execute a SQL database dump (OPS_MANAGER only)',
    description:
      'Upload a .sql file (max 50 MB). All statements are executed inside a single ' +
      'PostgreSQL transaction. If any statement fails the entire import is rolled back.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'SQL dump file (.sql, max 50 MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Import completed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or empty file.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @ApiResponse({ status: 500, description: 'SQL execution failed — transaction rolled back.' })
  async uploadDatabase(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file was provided. Send a .sql file in the "file" field.');
    }

    return this.databaseUploadService.executeSqlDump(file.buffer, file.originalname);
  }
}

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3001);
  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');

  // ── Global prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── CORS ───────────────────────────────────────────────────────────────────
  const corsOrigins = configService
    .get<string>('app.corsOrigins', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // ── Global pipes ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters ─────────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global interceptors ────────────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );

  // ── Swagger ────────────────────────────────────────────────────────────────
  if (configService.get<boolean>('swagger.enabled', true)) {
    const swaggerPath = configService.get<string>('swagger.path', 'api/docs');
    const config = new DocumentBuilder()
      .setTitle('Compliance & Audit Management API')
      .setDescription(
        'Production-ready REST API for multi-tenant compliance and audit management. ' +
        'Supports 4 roles: STORE, PROPERTY_COORDINATOR, OPS_MANAGER, EXEC.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management')
      .addTag('Precincts', 'Precinct management')
      .addTag('Stores', 'Store management')
      .addTag('Audits', 'Audit lifecycle management')
      .addTag('Certificates', 'Certificate tracking')
      .addTag('Notifications', 'Notification management')
      .addTag('Dashboard', 'Analytics and metrics')
      .addTag('Storage', 'File upload / signed URLs')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger available at: http://localhost:${port}/${swaggerPath}`);
  }

  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}/api/v1 [${nodeEnv}]`);
}

bootstrap();

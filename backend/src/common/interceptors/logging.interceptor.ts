import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Attach or generate correlation ID
    const correlationId =
      (req.headers['x-correlation-id'] as string) || uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `${method} ${url} → ${res.statusCode} [${ms}ms] corr=${correlationId}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.error(
            `${method} ${url} → ${err.status ?? 500} [${ms}ms] corr=${correlationId} — ${err.message}`,
          );
        },
      }),
    );
  }
}

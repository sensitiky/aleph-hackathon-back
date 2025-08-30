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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, params, query } = request;
    
    const now = Date.now();
    
    // Log request
    this.logger.log({
      type: 'REQUEST',
      method,
      url,
      body: this.sanitizeBody(body),
      params,
      query,
      userAgent: request.get('User-Agent') || '',
      ip: request.ip,
    });

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          const duration = Date.now() - now;
          
          this.logger.log({
            type: 'RESPONSE',
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            // Don't log the full response data to avoid cluttering logs
            hasData: !!responseData,
          });
        },
        error: (error) => {
          const duration = Date.now() - now;
          
          this.logger.error({
            type: 'ERROR_RESPONSE',
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    // Clone the body to avoid modifying the original
    const sanitized = { ...body };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['privateKey', 'password', 'secret', 'token'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***masked***';
      }
    });
    
    return sanitized;
  }
}
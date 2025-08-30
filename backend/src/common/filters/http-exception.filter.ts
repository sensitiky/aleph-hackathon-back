import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
      ...(typeof exceptionResponse === 'object' ? exceptionResponse : {}),
    };

    // Log error details
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error: ${JSON.stringify(errorResponse)}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`HTTP ${status} Error: ${JSON.stringify(errorResponse)}`);
    }

    response.status(status).json(errorResponse);
  }
}
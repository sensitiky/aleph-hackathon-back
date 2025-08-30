import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        details = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // Handle specific blockchain errors
      if (message.includes('insufficient funds') || message.includes('gas')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Fondos insuficientes o problema con gas';
      } else if (message.includes('nonce')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Error de nonce en la transacción';
      } else if (message.includes('revert')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Transacción revertida por el contrato';
      } else if (message.includes('network')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Error de conectividad de red blockchain';
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details && { details }),
    };

    // Log error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `Unhandled Exception: ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : 'Unknown error',
      );
    } else {
      this.logger.warn(`Client Error: ${JSON.stringify(errorResponse)}`);
    }

    response.status(status).json(errorResponse);
  }
}
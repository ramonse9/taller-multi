import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const known = exception instanceof HttpException;
    const status = known ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = known ? exception.getResponse() : undefined;
    const message = typeof payload === 'string' ? payload : this.safeMessage(payload, status);

    if (!known || status >= 500) {
      this.logger.error(
        JSON.stringify({
          event: 'request_failed',
          method: request.method,
          path: request.path,
          status,
        }),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }

  private safeMessage(payload: object | undefined, status: number): string | string[] {
    if (status >= 500) return 'Ocurrió un error interno';
    if (payload && 'message' in payload) {
      const value = (payload as { message?: unknown }).message;
      if (
        typeof value === 'string' ||
        (Array.isArray(value) && value.every((v) => typeof v === 'string'))
      )
        return value;
    }
    return 'Solicitud inválida';
  }
}

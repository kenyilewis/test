import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

type HttpExceptionResponse = {
  message: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private isHttpExceptionResponse(
    response: string | object,
  ): response is HttpExceptionResponse {
    return (
      typeof response === 'object' && response !== null && 'message' in response
    );
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (this.isHttpExceptionResponse(exceptionResponse)) {
      const msg = exceptionResponse.message;
      message = Array.isArray(msg) ? msg.join(', ') : msg;
    } else {
      message = 'Internal server error';
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}

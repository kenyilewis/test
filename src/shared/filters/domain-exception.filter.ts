import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ImageProcessingException,
  InvalidImagePathException,
  TaskNotFoundException,
  InvalidImageFormatException,
  ImageDownloadException,
} from '@task/domain/exceptions';

@Catch(
  TaskNotFoundException,
  InvalidImagePathException,
  ImageProcessingException,
  InvalidImageFormatException,
  ImageDownloadException,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | TaskNotFoundException
      | InvalidImagePathException
      | ImageProcessingException
      | InvalidImageFormatException
      | ImageDownloadException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof TaskNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (
      exception instanceof InvalidImagePathException ||
      exception instanceof InvalidImageFormatException ||
      exception instanceof ImageDownloadException
    ) {
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof ImageProcessingException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}

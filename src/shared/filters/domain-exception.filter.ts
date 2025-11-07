import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ImageProcessingException } from '@task/domain/exceptions/image-processing.exception';
import { InvalidImagePathException } from '@task/domain/exceptions/invalid-image-path.exception';
import { TaskNotFoundException } from '@task/domain/exceptions/task-not-found.exception';

@Catch(
  TaskNotFoundException,
  InvalidImagePathException,
  ImageProcessingException,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | TaskNotFoundException
      | InvalidImagePathException
      | ImageProcessingException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof TaskNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof InvalidImagePathException) {
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


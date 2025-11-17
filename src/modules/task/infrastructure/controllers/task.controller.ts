import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

import { GetTaskUseCase } from '@modules/task/application/use-cases/get-task.use-case';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import { ProcessImageUseCase } from '@task/application/use-cases/process-image.use-case';
import { CreateTaskDto } from '@task/infrastructure/dtos/create-task.dto';
import { TaskResponseDto } from '../dtos';
import { TaskMapper } from '../mappers';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
};

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly processImageUseCase: ProcessImageUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './output/temp',
        filename: (req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Create a new image processing task',
    description: `
Creates a new task with a random price (between 5.00 and 50.00) and processes the image asynchronously to generate two resolutions: 1024px and 800px width.

**This endpoint supports TWO different content types:**

📄 **Option 1: application/json** - For image URLs or local paths
   - Set Content-Type: application/json
   - Send "imagePath" field with the URL or file path
   - Example: { "imagePath": "https://example.com/image.jpg" }

📁 **Option 2: multipart/form-data** - For direct file upload
   - Set Content-Type: multipart/form-data
   - Send "file" field with the image file
   - Only image files are allowed (jpg, png, gif, webp, etc.)

⚠️ **Important:** You must use ONLY ONE option at a time. Sending both imagePath and file will result in a 400 error.
    `,
  })
  @ApiBody({
    description:
      'For application/json: send imagePath. For multipart/form-data: upload file field',
    schema: {
      type: 'object',
      properties: {
        imagePath: {
          type: 'string',
          description:
            'URL or local file path (for application/json only)',
          example: 'https://example.com/sample-image.jpg',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (for multipart/form-data only)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully with pending status',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid input (missing required field, both fields provided, invalid file type, or invalid content-type)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'imagePath is required when using application/json',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  async createTask(
    @Req() req: Request,
    @Body() dto: CreateTaskDto,
    @UploadedFile() file?: MulterFile,
  ): Promise<TaskResponseDto> {
    const contentType = req.headers['content-type'] || '';
    const { imagePath, isUploadedFile } = this.validateAndExtractImageSource(
      contentType,
      file,
      dto,
    );

    const task = await this.createTaskUseCase.execute({ imagePath });

    this.processImageUseCase
      .execute(task.id, task.originalPath, isUploadedFile)
      .catch(() => {});

    return TaskMapper.toResponseDto(task);
  }

  @Get(':taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get task status and details',
    description:
      'Returns the current status, price, and processed images (if completed) of a task',
  })
  @ApiParam({
    name: 'taskId',
    description: 'MongoDB ObjectId of the task',
    example: '65d4a54b89c5e342b2c2c5f6',
  })
  @ApiResponse({
    status: 200,
    description: 'Task found',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async getTask(@Param('taskId') taskId: string): Promise<TaskResponseDto> {
    const task = await this.getTaskUseCase.execute({ taskId });
    return TaskMapper.toResponseDto(task);
  }

  private validateAndExtractImageSource(
    contentType: string,
    file: MulterFile | undefined,
    dto: CreateTaskDto,
  ): { imagePath: string; isUploadedFile: boolean } {
    const isMultipart = contentType.includes('multipart/form-data');
    const isJson = contentType.includes('application/json');

    if (!isMultipart && !isJson) {
      throw new BadRequestException(
        'Content-Type must be either multipart/form-data or application/json',
      );
    }

    if (isMultipart) {
      return this.validateMultipartRequest(file, dto);
    }

    return this.validateJsonRequest(file, dto);
  }

  private validateMultipartRequest(
    file: MulterFile | undefined,
    dto: CreateTaskDto,
  ): { imagePath: string; isUploadedFile: boolean } {
    if (!file) {
      throw new BadRequestException(
        'File is required when using multipart/form-data',
      );
    }

    if (dto.imagePath) {
      throw new BadRequestException(
        'imagePath is not allowed when using multipart/form-data. Use file field instead',
      );
    }

    return { imagePath: file.path, isUploadedFile: true };
  }

  private validateJsonRequest(
    file: MulterFile | undefined,
    dto: CreateTaskDto,
  ): { imagePath: string; isUploadedFile: boolean } {
    if (file) {
      throw new BadRequestException(
        'File upload is not allowed when using application/json. Use imagePath field instead',
      );
    }

    if (!dto.imagePath) {
      throw new BadRequestException(
        'imagePath is required when using application/json',
      );
    }

    return { imagePath: dto.imagePath, isUploadedFile: false };
  }
}

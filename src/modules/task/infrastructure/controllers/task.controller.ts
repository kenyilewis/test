import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { GetTaskUseCase } from '@modules/task/application/use-cases/get-task.use-case';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import { ProcessImageUseCase } from '@task/application/use-cases/process-image.use-case';
import { CreateTaskDto } from '@task/infrastructure/dtos/create-task.dto';
import { TaskResponseDto } from '../dtos';
import { TaskMapper } from '../mappers';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
    private readonly processImageUseCase: ProcessImageUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new image processing task',
    description: `Creates a new task with a random price (between 5.00 and 50.00) and processes the image asynchronously to generate two resolutions: 1024px and 800px width.

The imagePath can be:
- A URL (HTTP/HTTPS): The image will be downloaded and processed
- A local file path: The file will be read directly from the file system

The task is created immediately with "pending" status, and image processing happens asynchronously in the background.`,
  })
  @ApiBody({
    description: 'Image path or URL to process',
    type: CreateTaskDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully with pending status',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid input (missing imagePath, invalid URL, or invalid image file)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'imagePath must be a string',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  async createTask(@Body() dto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.createTaskUseCase.execute(dto.toInput());

    this.processImageUseCase
      .execute(task.id, task.originalPath)
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
}

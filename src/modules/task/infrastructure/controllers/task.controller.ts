import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import { CreateTaskDto } from '@task/infrastructure/dtos/create-task.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';

@Controller('tasks')
export class TaskController {
  constructor(private readonly createTaskUseCase: CreateTaskUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new image processing task',
    description:
      'Creates a new task with a random price and starts processing the image asynchronously',
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: CreateTaskDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image path',
  })
  async createTask(
    @Body() dto: CreateTaskDto,
  ): Promise<CreateTaskDto> {
    const task = await this.createTaskUseCase.execute({
      imagePath: dto.imagePath,
    });
    return dto;
  }
}

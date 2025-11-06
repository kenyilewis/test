import { Body, Controller, Post } from '@nestjs/common';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.use-case';
import { CreateTaskDto } from '../dtos/create-task.dto';

@Controller('task')
export class TaskController {
  constructor(private readonly createTaskUseCase: CreateTaskUseCase) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.createTaskUseCase.execute(createTaskDto.toInput());
  }
}

import { Module } from '@nestjs/common';
import { CreateTaskUseCase } from './application/use-cases/create-task.use-case';
import { TaskController } from './infrastructure/controllers/task.controller';

@Module({
  controllers: [TaskController],
  providers: [CreateTaskUseCase],
})
export class TaskModule {}

import { Module } from '@nestjs/common';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import { TaskController } from '@task/infrastructure/controllers/task.controller';
import { TaskRepository } from '@task/infrastructure/repositories/task.repository';

@Module({
  controllers: [TaskController],
  providers: [
    CreateTaskUseCase,
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
  ],
})
export class TaskModule {}

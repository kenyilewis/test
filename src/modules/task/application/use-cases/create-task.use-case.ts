import { Inject, Injectable } from '@nestjs/common';
import type { ITaskRepository } from '@task/domain/repositories';
import { CreateTaskInput } from '@task/application/inputs/create-task.input';
import { Task } from '@task/domain/entities/task.entity';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { generateRandomPrice } from '@shared/utils/price-generator.util';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    const now = new Date();
    const task = new Task(
      '',
      TaskStatus.PENDING,
      generateRandomPrice(),
      input.imagePath,
      now,
      now,
      [],
    );

    const createdTask = await this.taskRepository.create(task);
    return createdTask;
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Task } from '@task/domain/entities/task.entity';
import { TaskNotFoundException } from '@task/domain/exceptions/task-not-found.exception';
import type { ITaskRepository } from '@task/domain/repositories/task.repository';
import { GetTaskInput } from '../inputs/get-task.input';

@Injectable()
export class GetTaskUseCase {
  constructor(
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(input: GetTaskInput): Promise<Task> {
    const task = await this.taskRepository.findById(input.taskId);

    if (!task) {
      throw new TaskNotFoundException(input.taskId);
    }

    return task;
  }
}


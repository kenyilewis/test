import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import type { ITaskRepository } from '@task/domain/repositories';
import { CreateTaskInput } from '@task/application/inputs/create-task.input';
import { Task } from '@task/domain/entities/task.entity';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { InvalidImagePathException } from '@task/domain/exceptions/invalid-image-path.exception';
import { generateRandomPrice } from '@shared/utils/price-generator.util';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    await this.validateImagePath(input.imagePath);

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

  private async validateImagePath(imagePath: string): Promise<void> {
    try {
      const stats = await fs.stat(imagePath);
      if (!stats.isFile()) {
        throw new InvalidImagePathException('The provided path is not a file');
      }
    } catch (error) {
      throw new InvalidImagePathException('Invalid image path: file does not exist');
    }
  }
}

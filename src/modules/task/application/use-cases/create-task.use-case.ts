import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import type { ITaskRepository } from '@task/domain/repositories';
import { CreateTaskInput } from '@task/application/inputs/create-task.input';
import { Task } from '@task/domain/entities/task.entity';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import {
  InvalidImagePathException,
  InvalidImageFormatException,
  ImageDownloadException,
} from '@task/domain/exceptions';
import { generateRandomPrice } from '@shared/utils/price-generator.util';
import { isUrl, downloadImage, validateImageFile } from '@shared/utils';

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
      if (isUrl(imagePath)) {
        const tempFilePath = await downloadImage(imagePath);
        await validateImageFile(tempFilePath);
        await fs.unlink(tempFilePath);
      } else {
        const stats = await fs.stat(imagePath);
        if (!stats.isFile()) {
          throw new InvalidImagePathException('The provided path is not a file');
        }
        await validateImageFile(imagePath);
      }
    } catch (error) {
      if (
        error instanceof InvalidImagePathException ||
        error instanceof InvalidImageFormatException ||
        error instanceof ImageDownloadException
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Invalid image path or URL';
      throw new InvalidImagePathException(message);
    }
  }
}

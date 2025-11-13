import { Injectable, Inject } from '@nestjs/common';
import { Types } from 'mongoose';
import type { ITaskRepository } from '@task/domain/repositories/task.repository';
import type { IImageRepository } from '@task/domain/repositories/image.repository';
import type { IImageProcessor } from '../services/image-processor.interface';
import { Image } from '@task/domain/entities/image.entity';
import { TaskImage } from '@task/domain/entities/task.entity';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { ImageProcessingException } from '@task/domain/exceptions/image-processing.exception';
import { isUrl, downloadImage, cleanupTempFile } from '@shared/utils';

@Injectable()
export class ProcessImageUseCase {
  constructor(
    @Inject('ITaskRepository')
    private readonly taskRepository: ITaskRepository,
    @Inject('IImageRepository')
    private readonly imageRepository: IImageRepository,
    @Inject('IImageProcessor')
    private readonly imageProcessor: IImageProcessor,
  ) {}

  async execute(taskId: string, imagePath: string): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      const actualImagePath = isUrl(imagePath) 
        ? (tempFilePath = await downloadImage(imagePath))
        : imagePath;

      const processedImages = await this.imageProcessor.processImage(actualImagePath);

      const taskImages: TaskImage[] = [];
      const imageEntities: Image[] = [];

      for (const processed of processedImages) {
        const imageId = new Types.ObjectId().toString();
        const now = new Date();

        const image = new Image(
          imageId,
          taskId,
          processed.resolution,
          processed.path,
          processed.md5,
          now,
        );

        imageEntities.push(image);
        taskImages.push({
          resolution: processed.resolution,
          path: processed.path,
        });
      }

      for (const image of imageEntities) {
        await this.imageRepository.create(image);
      }

      await this.taskRepository.addImages(taskId, taskImages);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.taskRepository.updateStatus(taskId, TaskStatus.FAILED, errorMessage);
      throw new ImageProcessingException(errorMessage, error as Error);
    } finally {
      if (tempFilePath) {
        await cleanupTempFile(tempFilePath);
      }
    }
  }
}


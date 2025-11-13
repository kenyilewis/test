import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import * as fs from 'fs/promises';

import { Task } from '@task/domain/entities/task.entity';
import { ITaskRepository } from '@task/domain/repositories/task.repository';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import {
  InvalidImagePathException,
  InvalidImageFormatException,
  ImageDownloadException,
} from '@task/domain/exceptions';
import { CreateTaskUseCase } from './create-task.use-case';
import * as imageDownloader from '@shared/utils/image-downloader.util';
import * as imageValidator from '@shared/utils/image-validator.util';

jest.mock('fs/promises');
jest.mock('@shared/utils/image-downloader.util');
jest.mock('@shared/utils/image-validator.util');

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let taskRepository: jest.Mocked<ITaskRepository>;

  beforeEach(async () => {
    const mockTaskRepository: Partial<jest.Mocked<ITaskRepository>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskUseCase,
        {
          provide: 'ITaskRepository',
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateTaskUseCase>(CreateTaskUseCase);
    taskRepository = module.get('ITaskRepository');

    jest.clearAllMocks();
  });

  describe('Local file paths', () => {
    it('should create a task with random price between 5 and 50 for valid local path', async () => {
      const mockTask = new Task(
        new Types.ObjectId().toString(),
        TaskStatus.PENDING,
        25.5,
        '/path/to/image.jpg',
        new Date(),
        new Date(),
        [],
      );

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      (fs.stat as jest.Mock).mockResolvedValue({ isFile: () => true });
      (imageValidator.validateImageFile as jest.Mock).mockResolvedValue(undefined);
      taskRepository.create.mockResolvedValue(mockTask);

      const result = await useCase.execute({ imagePath: '/path/to/image.jpg' });

      expect(result).toBeDefined();
      expect(result.status).toBe(TaskStatus.PENDING);
      expect(result.price).toBeGreaterThanOrEqual(5);
      expect(result.price).toBeLessThanOrEqual(50);
      expect(taskRepository.create).toHaveBeenCalled();
      expect(imageDownloader.isUrl).toHaveBeenCalledWith('/path/to/image.jpg');
      expect(imageValidator.validateImageFile).toHaveBeenCalledWith('/path/to/image.jpg');
    });

    it('should throw InvalidImagePathException for non-existent file', async () => {
      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      (fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(
        useCase.execute({ imagePath: '/nonexistent/path.jpg' }),
      ).rejects.toThrow(InvalidImagePathException);

      expect(taskRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidImagePathException for non-file path', async () => {
      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      (fs.stat as jest.Mock).mockResolvedValue({ isFile: () => false });

      await expect(
        useCase.execute({ imagePath: '/path/to/directory' }),
      ).rejects.toThrow(InvalidImagePathException);

      expect(taskRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidImageFormatException for invalid image file', async () => {
      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      (fs.stat as jest.Mock).mockResolvedValue({ isFile: () => true });
      (imageValidator.validateImageFile as jest.Mock).mockRejectedValue(
        new InvalidImageFormatException('Input buffer contains unsupported image format')
      );

      await expect(
        useCase.execute({ imagePath: '/path/to/invalid.txt' }),
      ).rejects.toThrow(InvalidImageFormatException);

      expect(taskRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('URL paths', () => {
    it('should create a task with valid image URL', async () => {
      const mockTask = new Task(
        new Types.ObjectId().toString(),
        TaskStatus.PENDING,
        30.5,
        'https://example.com/image.jpg',
        new Date(),
        new Date(),
        [],
      );

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(true);
      (imageDownloader.downloadImage as jest.Mock).mockResolvedValue('/tmp/temp-image.jpg');
      (imageValidator.validateImageFile as jest.Mock).mockResolvedValue(undefined);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
      taskRepository.create.mockResolvedValue(mockTask);

      const result = await useCase.execute({ imagePath: 'https://example.com/image.jpg' });

      expect(result).toBeDefined();
      expect(result.status).toBe(TaskStatus.PENDING);
      expect(imageDownloader.isUrl).toHaveBeenCalledWith('https://example.com/image.jpg');
      expect(imageDownloader.downloadImage).toHaveBeenCalledWith('https://example.com/image.jpg');
      expect(imageValidator.validateImageFile).toHaveBeenCalledWith('/tmp/temp-image.jpg');
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/temp-image.jpg');
      expect(taskRepository.create).toHaveBeenCalled();
    });

    it('should throw ImageDownloadException for invalid URL', async () => {
      (imageDownloader.isUrl as jest.Mock).mockReturnValue(true);
      (imageDownloader.downloadImage as jest.Mock).mockRejectedValue(
        new ImageDownloadException('Not Found')
      );

      await expect(
        useCase.execute({ imagePath: 'https://example.com/nonexistent.jpg' }),
      ).rejects.toThrow(ImageDownloadException);

      expect(taskRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidImageFormatException for URL pointing to non-image', async () => {
      (imageDownloader.isUrl as jest.Mock).mockReturnValue(true);
      (imageDownloader.downloadImage as jest.Mock).mockResolvedValue('/tmp/temp-file.html');
      (imageValidator.validateImageFile as jest.Mock).mockRejectedValue(
        new InvalidImageFormatException('Input buffer contains unsupported image format')
      );
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await expect(
        useCase.execute({ imagePath: 'https://example.com/page.html' }),
      ).rejects.toThrow(InvalidImageFormatException);

      expect(taskRepository.create).not.toHaveBeenCalled();
    });
  });
});


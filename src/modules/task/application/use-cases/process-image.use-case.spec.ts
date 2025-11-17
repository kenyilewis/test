import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ITaskRepository } from '@task/domain/repositories/task.repository';
import { IImageRepository } from '@task/domain/repositories/image.repository';
import {
  IImageProcessor,
  ProcessedImageResult,
} from '@task/application/services/image-processor.interface';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { ImageProcessingException } from '@task/domain/exceptions/image-processing.exception';
import { ProcessImageUseCase } from './process-image.use-case';
import * as imageDownloader from '@shared/utils/image-downloader.util';

jest.mock('@shared/utils/image-downloader.util');

describe('ProcessImageUseCase', () => {
  let useCase: ProcessImageUseCase;
  let addImagesMock: jest.Mock;
  let updateStatusMock: jest.Mock;
  let createImageMock: jest.Mock;
  let processImageMock: jest.Mock;

  beforeEach(async () => {
    addImagesMock = jest.fn();
    updateStatusMock = jest.fn();
    createImageMock = jest.fn();
    processImageMock = jest.fn();

    const mockTaskRepository: Partial<jest.Mocked<ITaskRepository>> = {
      addImages: addImagesMock,
      updateStatus: updateStatusMock,
    };

    const mockImageRepository: Partial<jest.Mocked<IImageRepository>> = {
      create: createImageMock,
    };

    const mockImageProcessor: Partial<jest.Mocked<IImageProcessor>> = {
      processImage: processImageMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessImageUseCase,
        {
          provide: 'ITaskRepository',
          useValue: mockTaskRepository,
        },
        {
          provide: 'IImageRepository',
          useValue: mockImageRepository,
        },
        {
          provide: 'IImageProcessor',
          useValue: mockImageProcessor,
        },
      ],
    }).compile();

    useCase = module.get<ProcessImageUseCase>(ProcessImageUseCase);

    jest.clearAllMocks();
  });

  describe('Local file paths', () => {
    it('should process image successfully and update task status to completed', async () => {
      const taskId = new Types.ObjectId().toString();
      const imagePath = '/path/to/image.jpg';

      const processedImages: ProcessedImageResult[] = [
        {
          resolution: '1024',
          path: '/output/image/1024/abc123.jpg',
          md5: 'abc123',
          buffer: Buffer.from('fake'),
        },
        {
          resolution: '800',
          path: '/output/image/800/def456.jpg',
          md5: 'def456',
          buffer: Buffer.from('fake'),
        },
      ];

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      processImageMock.mockResolvedValue(processedImages);
      createImageMock.mockResolvedValue({
        id: new Types.ObjectId().toString(),
        taskId,
        resolution: '1024',
        path: '/output/image/1024/abc123.jpg',
        md5: 'abc123',
        createdAt: new Date(),
      });

      await useCase.execute(taskId, imagePath);

      expect(imageDownloader.isUrl).toHaveBeenCalledWith(imagePath);
      expect(processImageMock).toHaveBeenCalledWith(imagePath);
      expect(createImageMock).toHaveBeenCalledTimes(2);
      expect(addImagesMock).toHaveBeenCalledWith(taskId, [
        { resolution: '1024', path: '/output/image/1024/abc123.jpg' },
        { resolution: '800', path: '/output/image/800/def456.jpg' },
      ]);
      expect(imageDownloader.cleanupTempFile).not.toHaveBeenCalled();
    });

    it('should update task status to failed when image processing fails', async () => {
      const taskId = new Types.ObjectId().toString();
      const imagePath = '/path/to/image.jpg';
      const error = new Error('Processing failed');

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      processImageMock.mockRejectedValue(error);

      await expect(useCase.execute(taskId, imagePath)).rejects.toThrow(
        ImageProcessingException,
      );

      expect(updateStatusMock).toHaveBeenCalledWith(
        taskId,
        TaskStatus.FAILED,
        'Processing failed',
      );
      expect(createImageMock).not.toHaveBeenCalled();
      expect(addImagesMock).not.toHaveBeenCalled();
    });
  });

  describe('URL paths', () => {
    it('should download image from URL, process it, and cleanup temp file', async () => {
      const taskId = new Types.ObjectId().toString();
      const imageUrl = 'https://example.com/image.jpg';
      const tempFilePath = '/tmp/downloaded-image.jpg';

      const processedImages: ProcessedImageResult[] = [
        {
          resolution: '1024',
          path: '/output/image/1024/abc123.jpg',
          md5: 'abc123',
          buffer: Buffer.from('fake'),
        },
        {
          resolution: '800',
          path: '/output/image/800/def456.jpg',
          md5: 'def456',
          buffer: Buffer.from('fake'),
        },
      ];

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(true);
      (imageDownloader.downloadImage as jest.Mock).mockResolvedValue(
        tempFilePath,
      );
      (imageDownloader.cleanupTempFile as jest.Mock).mockResolvedValue(
        undefined,
      );
      processImageMock.mockResolvedValue(processedImages);
      createImageMock.mockResolvedValue({
        id: new Types.ObjectId().toString(),
        taskId,
        resolution: '1024',
        path: '/output/image/1024/abc123.jpg',
        md5: 'abc123',
        createdAt: new Date(),
      });

      await useCase.execute(taskId, imageUrl);

      expect(imageDownloader.isUrl).toHaveBeenCalledWith(imageUrl);
      expect(imageDownloader.downloadImage).toHaveBeenCalledWith(imageUrl);
      expect(processImageMock).toHaveBeenCalledWith(tempFilePath);
      expect(createImageMock).toHaveBeenCalledTimes(2);
      expect(addImagesMock).toHaveBeenCalledWith(taskId, [
        { resolution: '1024', path: '/output/image/1024/abc123.jpg' },
        { resolution: '800', path: '/output/image/800/def456.jpg' },
      ]);
      expect(imageDownloader.cleanupTempFile).toHaveBeenCalledWith(
        tempFilePath,
      );
    });

    it('should cleanup temp file even when processing fails', async () => {
      const taskId = new Types.ObjectId().toString();
      const imageUrl = 'https://example.com/image.jpg';
      const tempFilePath = '/tmp/downloaded-image.jpg';
      const error = new Error('Processing failed');

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(true);
      (imageDownloader.downloadImage as jest.Mock).mockResolvedValue(
        tempFilePath,
      );
      (imageDownloader.cleanupTempFile as jest.Mock).mockResolvedValue(
        undefined,
      );
      processImageMock.mockRejectedValue(error);

      await expect(useCase.execute(taskId, imageUrl)).rejects.toThrow(
        ImageProcessingException,
      );

      expect(imageDownloader.downloadImage).toHaveBeenCalledWith(imageUrl);
      expect(updateStatusMock).toHaveBeenCalledWith(
        taskId,
        TaskStatus.FAILED,
        'Processing failed',
      );
      expect(imageDownloader.cleanupTempFile).toHaveBeenCalledWith(
        tempFilePath,
      );
    });

    it('should handle download failures', async () => {
      const taskId = new Types.ObjectId().toString();
      const imageUrl = 'https://example.com/nonexistent.jpg';
      const error = new Error('Failed to download image');

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(true);
      (imageDownloader.downloadImage as jest.Mock).mockRejectedValue(error);

      await expect(useCase.execute(taskId, imageUrl)).rejects.toThrow(
        ImageProcessingException,
      );

      expect(updateStatusMock).toHaveBeenCalledWith(
        taskId,
        TaskStatus.FAILED,
        'Failed to download image',
      );
      expect(processImageMock).not.toHaveBeenCalled();
    });
  });

  it('should handle unknown errors gracefully', async () => {
    const taskId = new Types.ObjectId().toString();
    const imagePath = '/path/to/image.jpg';

    (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
    processImageMock.mockRejectedValue('Unknown error');

    await expect(useCase.execute(taskId, imagePath)).rejects.toThrow(
      ImageProcessingException,
    );

    expect(updateStatusMock).toHaveBeenCalledWith(
      taskId,
      TaskStatus.FAILED,
      'Unknown error',
    );
  });

  describe('Uploaded files', () => {
    it('should process uploaded file and cleanup temp file', async () => {
      const taskId = new Types.ObjectId().toString();
      const uploadedFilePath = './output/temp/uploaded-image.jpg';

      const processedImages: ProcessedImageResult[] = [
        {
          resolution: '1024',
          path: '/output/image/1024/abc123.jpg',
          md5: 'abc123',
          buffer: Buffer.from('fake'),
        },
        {
          resolution: '800',
          path: '/output/image/800/def456.jpg',
          md5: 'def456',
          buffer: Buffer.from('fake'),
        },
      ];

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      processImageMock.mockResolvedValue(processedImages);
      createImageMock.mockResolvedValue({
        id: new Types.ObjectId().toString(),
        taskId,
        resolution: '1024',
        path: '/output/image/1024/abc123.jpg',
        md5: 'abc123',
        createdAt: new Date(),
      });

      await useCase.execute(taskId, uploadedFilePath, true);

      expect(imageDownloader.isUrl).toHaveBeenCalledWith(uploadedFilePath);
      expect(processImageMock).toHaveBeenCalledWith(uploadedFilePath);
      expect(createImageMock).toHaveBeenCalledTimes(2);
      expect(addImagesMock).toHaveBeenCalledWith(taskId, [
        { resolution: '1024', path: '/output/image/1024/abc123.jpg' },
        { resolution: '800', path: '/output/image/800/def456.jpg' },
      ]);
      expect(imageDownloader.cleanupTempFile).toHaveBeenCalledWith(
        uploadedFilePath,
      );
    });

    it('should cleanup uploaded file even when processing fails', async () => {
      const taskId = new Types.ObjectId().toString();
      const uploadedFilePath = './output/temp/uploaded-image.jpg';
      const error = new Error('Processing failed');

      (imageDownloader.isUrl as jest.Mock).mockReturnValue(false);
      processImageMock.mockRejectedValue(error);

      await expect(
        useCase.execute(taskId, uploadedFilePath, true),
      ).rejects.toThrow(ImageProcessingException);

      expect(updateStatusMock).toHaveBeenCalledWith(
        taskId,
        TaskStatus.FAILED,
        'Processing failed',
      );
      expect(imageDownloader.cleanupTempFile).toHaveBeenCalledWith(
        uploadedFilePath,
      );
    });
  });
});

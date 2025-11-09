import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ITaskRepository } from '@task/domain/repositories/task.repository';
import { IImageRepository } from '@task/domain/repositories/image.repository';
import { IImageProcessor, ProcessedImageResult } from '@task/application/services/image-processor.interface';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { ImageProcessingException } from '@task/domain/exceptions/image-processing.exception';
import { ProcessImageUseCase } from './process-image.use-case';

describe('ProcessImageUseCase', () => {
  let useCase: ProcessImageUseCase;
  let taskRepository: jest.Mocked<ITaskRepository>;
  let imageRepository: jest.Mocked<IImageRepository>;
  let imageProcessor: jest.Mocked<IImageProcessor>;

  beforeEach(async () => {
    const mockTaskRepository: Partial<jest.Mocked<ITaskRepository>> = {
      addImages: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockImageRepository: Partial<jest.Mocked<IImageRepository>> = {
      create: jest.fn(),
    };

    const mockImageProcessor: Partial<jest.Mocked<IImageProcessor>> = {
      processImage: jest.fn(),
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
    taskRepository = module.get('ITaskRepository');
    imageRepository = module.get('IImageRepository');
    imageProcessor = module.get('IImageProcessor');
  });

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

    imageProcessor.processImage.mockResolvedValue(processedImages);
    imageRepository.create.mockResolvedValue({
      id: new Types.ObjectId().toString(),
      taskId,
      resolution: '1024',
      path: '/output/image/1024/abc123.jpg',
      md5: 'abc123',
      createdAt: new Date(),
    });

    await useCase.execute(taskId, imagePath);

    expect(imageProcessor.processImage).toHaveBeenCalledWith(imagePath);
    expect(imageRepository.create).toHaveBeenCalledTimes(2);
    expect(taskRepository.addImages).toHaveBeenCalledWith(taskId, [
      { resolution: '1024', path: '/output/image/1024/abc123.jpg' },
      { resolution: '800', path: '/output/image/800/def456.jpg' },
    ]);
  });

  it('should update task status to failed when image processing fails', async () => {
    const taskId = new Types.ObjectId().toString();
    const imagePath = '/path/to/image.jpg';
    const error = new Error('Processing failed');

    imageProcessor.processImage.mockRejectedValue(error);

    await expect(useCase.execute(taskId, imagePath)).rejects.toThrow(
      ImageProcessingException,
    );

    expect(taskRepository.updateStatus).toHaveBeenCalledWith(
      taskId,
      TaskStatus.FAILED,
      'Processing failed',
    );
    expect(imageRepository.create).not.toHaveBeenCalled();
    expect(taskRepository.addImages).not.toHaveBeenCalled();
  });

  it('should handle unknown errors gracefully', async () => {
    const taskId = new Types.ObjectId().toString();
    const imagePath = '/path/to/image.jpg';

    imageProcessor.processImage.mockRejectedValue('Unknown error');

    await expect(useCase.execute(taskId, imagePath)).rejects.toThrow(
      ImageProcessingException,
    );

    expect(taskRepository.updateStatus).toHaveBeenCalledWith(
      taskId,
      TaskStatus.FAILED,
      'Unknown error',
    );
  });
});


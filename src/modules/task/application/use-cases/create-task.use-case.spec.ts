import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import * as fs from 'fs/promises';

import { Task } from '@task/domain/entities/task.entity';
import { ITaskRepository } from '@task/domain/repositories/task.repository';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { InvalidImagePathException } from '@task/domain/exceptions/invalid-image-path.exception';
import { CreateTaskUseCase } from './create-task.use-case';

jest.mock('fs/promises');

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
  });

  it('should create a task with random price between 5 and 50', async () => {
    const mockTask = new Task(
      new Types.ObjectId().toString(),
      TaskStatus.PENDING,
      25.5,
      '/path/to/image.jpg',
      new Date(),
      new Date(),
      [],
    );

    (fs.stat as jest.Mock).mockResolvedValue({ isFile: () => true });
    taskRepository.create.mockResolvedValue(mockTask);

    const result = await useCase.execute({ imagePath: '/path/to/image.jpg' });

    expect(result).toBeDefined();
    expect(result.status).toBe(TaskStatus.PENDING);
    expect(result.price).toBeGreaterThanOrEqual(5);
    expect(result.price).toBeLessThanOrEqual(50);
    expect(taskRepository.create).toHaveBeenCalled();
  });

  it('should throw InvalidImagePathException for non-existent file', async () => {
    (fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

    await expect(
      useCase.execute({ imagePath: '/nonexistent/path.jpg' }),
    ).rejects.toThrow(InvalidImagePathException);

    expect(taskRepository.create).not.toHaveBeenCalled();
  });
});


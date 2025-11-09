import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { Task } from '@task/domain/entities/task.entity';
import { ITaskRepository } from '@task/domain/repositories/task.repository';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { CreateTaskUseCase } from './create-task.use-case';
import { ProcessImageUseCase } from './process-image.use-case';

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let taskRepository: jest.Mocked<ITaskRepository>;
  let processImageUseCase: jest.Mocked<ProcessImageUseCase>;

  beforeEach(async () => {
    const mockTaskRepository: Partial<jest.Mocked<ITaskRepository>> = {
      create: jest.fn(),
    };

    const mockProcessImageUseCase: Partial<jest.Mocked<ProcessImageUseCase>> = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskUseCase,
        {
          provide: 'ITaskRepository',
          useValue: mockTaskRepository,
        },
        {
          provide: ProcessImageUseCase,
          useValue: mockProcessImageUseCase,
        },
      ],
    }).compile();

    useCase = module.get<CreateTaskUseCase>(CreateTaskUseCase);
    taskRepository = module.get('ITaskRepository');
    processImageUseCase = module.get(ProcessImageUseCase);
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

    taskRepository.create.mockResolvedValue(mockTask);

    const result = await useCase.execute({ imagePath: '/path/to/image.jpg' });

    expect(result).toBeDefined();
    expect(result.status).toBe(TaskStatus.PENDING);
    expect(result.price).toBeGreaterThanOrEqual(5);
    expect(result.price).toBeLessThanOrEqual(50);
    expect(taskRepository.create).toHaveBeenCalled();
  });

  it('should start image processing asynchronously', async () => {
    const mockTask = new Task(
      new Types.ObjectId().toString(),
      TaskStatus.PENDING,
      15.75,
      '/path/to/image.jpg',
      new Date(),
      new Date(),
      [],
    );

    taskRepository.create.mockResolvedValue(mockTask);

    await useCase.execute({ imagePath: '/path/to/image.jpg' });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(processImageUseCase.execute).toHaveBeenCalled();
  });
});


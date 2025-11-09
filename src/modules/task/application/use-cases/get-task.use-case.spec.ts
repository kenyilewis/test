import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { Task } from '@task/domain/entities/task.entity';
import { TaskNotFoundException } from '@task/domain/exceptions/task-not-found.exception';
import { ITaskRepository } from '@task/domain/repositories/task.repository';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { GetTaskUseCase } from './get-task.use-case';

describe('GetTaskUseCase', () => {
  let useCase: GetTaskUseCase;
  let taskRepository: jest.Mocked<ITaskRepository>;

  beforeEach(async () => {
    const mockTaskRepository: Partial<jest.Mocked<ITaskRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTaskUseCase,
        {
          provide: 'ITaskRepository',
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetTaskUseCase>(GetTaskUseCase);
    taskRepository = module.get('ITaskRepository');
  });

  it('should return a task when it exists', async () => {
    const taskId = new Types.ObjectId().toString();
    const mockTask = new Task(
      taskId,
      TaskStatus.COMPLETED,
      25.5,
      '/path/to/image.jpg',
      new Date(),
      new Date(),
      [
        { resolution: '1024', path: '/output/image/1024/abc.jpg' },
        { resolution: '800', path: '/output/image/800/def.jpg' },
      ],
    );

    taskRepository.findById.mockResolvedValue(mockTask);

    const result = await useCase.execute({ taskId });

    expect(result).toBeDefined();
    expect(result.id).toBe(taskId);
    expect(result.status).toBe(TaskStatus.COMPLETED);
    expect(taskRepository.findById).toHaveBeenCalledWith(taskId);
  });

  it('should throw TaskNotFoundException when task does not exist', async () => {
    const taskId = new Types.ObjectId().toString();
    taskRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ taskId })).rejects.toThrow(
      TaskNotFoundException,
    );
    expect(taskRepository.findById).toHaveBeenCalledWith(taskId);
  });
});


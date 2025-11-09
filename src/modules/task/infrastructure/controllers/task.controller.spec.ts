import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import { GetTaskUseCase } from '@task/application/use-cases/get-task.use-case';
import { ProcessImageUseCase } from '@task/application/use-cases/process-image.use-case';
import type { ITaskRepository } from '@task/domain/repositories';

describe('TaskController', () => {
  let controller: TaskController;

  const mockTaskRepository: ITaskRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    addImages: jest.fn(),
  };

  const mockGetTaskUseCase = {
    execute: jest.fn(),
  };

  const mockProcessImageUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        CreateTaskUseCase,
        {
          provide: GetTaskUseCase,
          useValue: mockGetTaskUseCase,
        },
        {
          provide: ProcessImageUseCase,
          useValue: mockProcessImageUseCase,
        },
        {
          provide: 'ITaskRepository',
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import type { ITaskRepository } from '@task/domain/repositories';

describe('TaskController', () => {
  let controller: TaskController;

  const mockTaskRepository: ITaskRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    addImages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        CreateTaskUseCase,
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

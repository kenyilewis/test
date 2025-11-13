import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CreateTaskUseCase } from '../../src/modules/task/application/use-cases/create-task.use-case';
import { GetTaskUseCase } from '../../src/modules/task/application/use-cases/get-task.use-case';
import { TaskRepository } from '../../src/modules/task/infrastructure/repositories/task.repository';
import { TaskSchema } from '../../src/modules/task/infrastructure/schemas/task.schema';
import { Task } from '../../src/modules/task/domain/entities/task.entity';
import { TaskStatus } from '../../src/modules/task/domain/value-objects/task-status.vo';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Task Repository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let createTaskUseCase: CreateTaskUseCase;
  let getTaskUseCase: GetTaskUseCase;
  let taskRepository: TaskRepository;
  let testImagePath: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const testImageDir = path.join(__dirname, '../../test-images');
    await fs.mkdir(testImageDir, { recursive: true });
    testImagePath = path.join(testImageDir, 'integration-test.jpg');

    const minimalJPEG = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x7F, 0xFF, 0xD9
    ]);
    await fs.writeFile(testImagePath, minimalJPEG);

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([{ name: 'Task', schema: TaskSchema }]),
      ],
      providers: [
        CreateTaskUseCase,
        GetTaskUseCase,
        TaskRepository,
        {
          provide: 'ITaskRepository',
          useExisting: TaskRepository,
        },
      ],
    }).compile();

    createTaskUseCase = moduleRef.get<CreateTaskUseCase>(CreateTaskUseCase);
    getTaskUseCase = moduleRef.get<GetTaskUseCase>(GetTaskUseCase);
    taskRepository = moduleRef.get<TaskRepository>(TaskRepository);
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongoServer.stop();
    
    if (testImagePath) {
      try {
        await fs.unlink(testImagePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('CreateTaskUseCase with Real Repository', () => {
    it('should create a task in MongoDB with pending status and random price', async () => {
      const task = await createTaskUseCase.execute({ imagePath: testImagePath });

      expect(task.id).toBeDefined();
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.price).toBeGreaterThanOrEqual(5);
      expect(task.price).toBeLessThanOrEqual(50);
      expect(task.originalPath).toBe(testImagePath);
      expect(task.images).toEqual([]);

      const savedTask = await taskRepository.findById(task.id);
      expect(savedTask).toBeDefined();
      expect(savedTask?.id).toBe(task.id);
      expect(savedTask?.status).toBe(TaskStatus.PENDING);
    });

    it('should throw error for non-existent image path', async () => {
      await expect(
        createTaskUseCase.execute({ imagePath: '/nonexistent/image.jpg' })
      ).rejects.toThrow();
    });

    it('should throw error for invalid image file', async () => {
      const invalidFilePath = path.join(__dirname, '../../test-images/invalid.txt');
      await fs.writeFile(invalidFilePath, 'This is not an image');

      await expect(
        createTaskUseCase.execute({ imagePath: invalidFilePath })
      ).rejects.toThrow();

      await fs.unlink(invalidFilePath);
    });
  });

  describe('GetTaskUseCase with Real Repository', () => {
    it('should retrieve a task from MongoDB', async () => {
      const createdTask = await createTaskUseCase.execute({ imagePath: testImagePath });

      const retrievedTask = await getTaskUseCase.execute({ taskId: createdTask.id });

      expect(retrievedTask.id).toBe(createdTask.id);
      expect(retrievedTask.status).toBe(TaskStatus.PENDING);
      expect(retrievedTask.price).toBe(createdTask.price);
      expect(retrievedTask.originalPath).toBe(testImagePath);
    });

    it('should throw error for non-existent task', async () => {
      const fakeTaskId = '507f1f77bcf86cd799439011';

      await expect(
        getTaskUseCase.execute({ taskId: fakeTaskId })
      ).rejects.toThrow();
    });
  });

  describe('Task Repository Direct Operations', () => {
    it('should update task status in MongoDB', async () => {
      const task = await createTaskUseCase.execute({ imagePath: testImagePath });

      await taskRepository.updateStatus(task.id, TaskStatus.COMPLETED);

      const updatedTask = await taskRepository.findById(task.id);
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
    });

    it('should add images to task in MongoDB', async () => {
      const task = await createTaskUseCase.execute({ imagePath: testImagePath });

      const images = [
        { resolution: '1024', path: '/output/test/1024/abc123.jpg' },
        { resolution: '800', path: '/output/test/800/def456.jpg' },
      ];

      await taskRepository.addImages(task.id, images);

      const updatedTask = await taskRepository.findById(task.id);
      expect(updatedTask?.images).toHaveLength(2);
      expect(updatedTask?.images[0].resolution).toBe('1024');
      expect(updatedTask?.images[1].resolution).toBe('800');
    });
  });
});


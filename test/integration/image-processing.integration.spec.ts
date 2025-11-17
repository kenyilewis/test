import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProcessImageUseCase } from '../../src/modules/task/application/use-cases/process-image.use-case';
import { CreateTaskUseCase } from '../../src/modules/task/application/use-cases/create-task.use-case';
import { TaskRepository } from '../../src/modules/task/infrastructure/repositories/task.repository';
import { ImageRepository } from '../../src/modules/task/infrastructure/repositories/image.repository';
import { SharpImageProcessorService } from '../../src/modules/task/infrastructure/services/sharp-image-processor.service';
import {
  TaskDocument,
  TaskSchema,
} from '../../src/modules/task/infrastructure/schemas/task.schema';
import {
  ImageDocument,
  ImageSchema,
} from '../../src/modules/task/infrastructure/schemas/image.schema';
import { TaskStatus } from '../../src/modules/task/domain/value-objects/task-status.vo';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Image Processing Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let moduleRef: TestingModule;
  let createTaskUseCase: CreateTaskUseCase;
  let processImageUseCase: ProcessImageUseCase;
  let taskRepository: TaskRepository;
  let imageRepository: ImageRepository;
  let imageProcessor: SharpImageProcessorService;
  let testImagePath: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const testImageDir = path.join(__dirname, '../../test-images');
    await fs.mkdir(testImageDir, { recursive: true });
    testImagePath = path.join(testImageDir, 'sharp-test.jpg');

    const minimalJPEG = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
      0x7f, 0xff, 0xd9,
    ]);
    await fs.writeFile(testImagePath, minimalJPEG);

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([
          { name: TaskDocument.name, schema: TaskSchema },
          { name: ImageDocument.name, schema: ImageSchema },
        ]),
      ],
      providers: [
        CreateTaskUseCase,
        ProcessImageUseCase,
        TaskRepository,
        ImageRepository,
        SharpImageProcessorService,
        {
          provide: 'ITaskRepository',
          useExisting: TaskRepository,
        },
        {
          provide: 'IImageRepository',
          useExisting: ImageRepository,
        },
        {
          provide: 'IImageProcessor',
          useExisting: SharpImageProcessorService,
        },
      ],
    }).compile();

    createTaskUseCase = moduleRef.get<CreateTaskUseCase>(CreateTaskUseCase);
    processImageUseCase =
      moduleRef.get<ProcessImageUseCase>(ProcessImageUseCase);
    taskRepository = moduleRef.get<TaskRepository>(TaskRepository);
    imageRepository = moduleRef.get<ImageRepository>(ImageRepository);
    imageProcessor = moduleRef.get<SharpImageProcessorService>(
      SharpImageProcessorService,
    );
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongoServer.stop();

    if (testImagePath) {
      try {
        await fs.unlink(testImagePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('ProcessImageUseCase with Real Sharp Service', () => {
    it('should process image with Sharp and create resized variants', async () => {
      const task = await createTaskUseCase.execute({
        imagePath: testImagePath,
      });

      await processImageUseCase.execute(task.id, testImagePath);

      const updatedTask = await taskRepository.findById(task.id);
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
      expect(updatedTask?.images).toHaveLength(2);

      const image1024 = updatedTask?.images.find(
        (img) => img.resolution === '1024',
      );
      const image800 = updatedTask?.images.find(
        (img) => img.resolution === '800',
      );

      expect(image1024).toBeDefined();
      expect(image800).toBeDefined();

      const images = await imageRepository.findByTaskId(task.id);
      expect(images).toHaveLength(2);

      for (const image of images) {
        expect(image.md5).toBeDefined();
        expect(image.path).toContain('output/');
        expect(['1024', '800']).toContain(image.resolution);

        const fileExists = await fs
          .access(image.path)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);
      }
    });

    it('should update task status to FAILED if processing fails', async () => {
      const task = await createTaskUseCase.execute({
        imagePath: testImagePath,
      });

      await expect(
        processImageUseCase.execute(task.id, '/nonexistent/image.jpg'),
      ).rejects.toThrow();

      const updatedTask = await taskRepository.findById(task.id);
      expect(updatedTask?.status).toBe(TaskStatus.FAILED);
      expect(updatedTask?.error).toBeDefined();
    });

    it('should process different image formats with Sharp', async () => {
      const pngImagePath = path.join(__dirname, '../../test-images/test.png');
      const minimalPNG = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);
      await fs.writeFile(pngImagePath, minimalPNG);

      const task = await createTaskUseCase.execute({ imagePath: pngImagePath });
      await processImageUseCase.execute(task.id, pngImagePath);

      const updatedTask = await taskRepository.findById(task.id);
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);

      await fs.unlink(pngImagePath);
    });
  });

  describe('SharpImageProcessorService Direct Operations', () => {
    it('should generate correct number of resized images', async () => {
      const result = await imageProcessor.processImage(testImagePath);

      expect(result).toHaveLength(2);
      expect(result[0].resolution).toBe('1024');
      expect(result[1].resolution).toBe('800');

      for (const processed of result) {
        expect(processed.md5).toBeDefined();
        expect(processed.path).toContain('output/');
        expect(processed.buffer).toBeInstanceOf(Buffer);
      }
    });

    it('should maintain aspect ratio when resizing', async () => {
      const result = await imageProcessor.processImage(testImagePath);

      expect(result[0].buffer).toBeInstanceOf(Buffer);
      expect(result[1].buffer).toBeInstanceOf(Buffer);

      expect(result[0].buffer.length).toBeGreaterThan(0);
      expect(result[1].buffer.length).toBeGreaterThan(0);
    });
  });
});

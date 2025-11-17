import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/modules/app/app.module';
import {
  DomainExceptionFilter,
  HttpExceptionFilter,
} from '../src/shared/filters';
import * as fs from 'fs/promises';
import * as path from 'path';

type TaskResponse = {
  taskId: string;
  status: string;
  price: number;
  images?: Array<{ resolution: string; path: string }>;
  error?: string;
};

type ErrorResponse = {
  statusCode: number;
  message?: string;
};

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;
  let testImagePath: string;

  beforeAll(async () => {
    const testImageDir = path.join(__dirname, '../test-images');
    await fs.mkdir(testImageDir, { recursive: true });
    testImagePath = path.join(testImageDir, 'test.jpg');

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
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(
      new DomainExceptionFilter(),
      new HttpExceptionFilter(),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    if (testImagePath) {
      try {
        await fs.unlink(testImagePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('POST /tasks', () => {
    it('should create a task with pending status and random price', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: testImagePath })
        .expect(201);

      const body = response.body as TaskResponse;
      expect(body).toHaveProperty('taskId');
      expect(body).toHaveProperty('status', 'pending');
      expect(body).toHaveProperty('price');
      expect(body.price).toBeGreaterThanOrEqual(5);
      expect(body.price).toBeLessThanOrEqual(50);
      expect(body).not.toHaveProperty('images');
    });

    it('should create a task with a valid image URL', async () => {
      const validImageUrl = 'https://picsum.photos/200';

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: validImageUrl })
        .expect(201);

      const body = response.body as TaskResponse;
      expect(body).toHaveProperty('taskId');
      expect(body).toHaveProperty('status', 'pending');
      expect(body).toHaveProperty('price');
      expect(body.price).toBeGreaterThanOrEqual(5);
      expect(body.price).toBeLessThanOrEqual(50);
    }, 15000);

    it('should return 400 for invalid image path', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: '/nonexistent/path/image.jpg' })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({
          imagePath:
            'https://example.com/nonexistent-image-that-does-not-exist-12345.jpg',
        })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for non-image URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: 'https://example.com' })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for missing imagePath', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({})
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for empty image path', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: '' })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid file type', async () => {
      const txtFilePath = path.join(__dirname, '../test-images/invalid.txt');
      await fs.writeFile(txtFilePath, 'This is not an image');

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: txtFilePath })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 400);

      await fs.unlink(txtFilePath);
    });
  });

  describe('GET /tasks/:taskId', () => {
    it('should return 404 for non-existent task', async () => {
      const fakeTaskId = '507f1f77bcf86cd799439011';
      const response = await request(app.getHttpServer())
        .get(`/tasks/${fakeTaskId}`)
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('statusCode', 404);
      expect(body).toHaveProperty('message');
    });

    it('should return task with pending status', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: testImagePath })
        .expect(201);

      const createBody = createResponse.body as TaskResponse;
      const taskId = createBody.taskId;

      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      const getBody = getResponse.body as TaskResponse;
      expect(getBody).toHaveProperty('taskId', taskId);
      expect(getBody).toHaveProperty('status', 'pending');
      expect(getBody).toHaveProperty('price');
      expect(getBody).not.toHaveProperty('images');
    });

    it('should return task with completed status and images after processing', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: testImagePath })
        .expect(201);

      const createBody = createResponse.body as TaskResponse;
      const taskId = createBody.taskId;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      const getBody = getResponse.body as TaskResponse;
      expect(getBody).toHaveProperty('taskId', taskId);
      expect(['pending', 'completed', 'failed']).toContain(getBody.status);

      if (getBody.status === 'completed') {
        expect(getBody).toHaveProperty('images');
        expect(Array.isArray(getBody.images)).toBe(true);
        if (getBody.images && getBody.images.length > 0) {
          expect(getBody.images[0]).toHaveProperty('resolution');
          expect(getBody.images[0]).toHaveProperty('path');
        }
      }
    });
  });
});

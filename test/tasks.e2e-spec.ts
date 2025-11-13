import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/modules/app/app.module';
import { DomainExceptionFilter, HttpExceptionFilter } from '../src/shared/filters';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;
  let testImagePath: string;

  beforeAll(async () => {
    const testImageDir = path.join(__dirname, '../test-images');
    await fs.mkdir(testImageDir, { recursive: true });
    testImagePath = path.join(testImageDir, 'test.jpg');

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
      } catch (error) {
      }
    }
  });

  describe('POST /tasks', () => {
    it('should create a task with pending status and random price', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: testImagePath })
        .expect(201);

      expect(response.body).toHaveProperty('taskId');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('price');
      expect(response.body.price).toBeGreaterThanOrEqual(5);
      expect(response.body.price).toBeLessThanOrEqual(50);
      expect(response.body).not.toHaveProperty('images');
    });

    it('should create a task with a valid image URL', async () => {
      const validImageUrl = 'https://via.placeholder.com/150.jpg';
      
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: validImageUrl })
        .expect(201);

      expect(response.body).toHaveProperty('taskId');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('price');
      expect(response.body.price).toBeGreaterThanOrEqual(5);
      expect(response.body.price).toBeLessThanOrEqual(50);
    });

    it('should return 400 for invalid image path', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: '/nonexistent/path/image.jpg' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: 'https://example.com/nonexistent-image-that-does-not-exist-12345.jpg' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for non-image URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: 'https://example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for empty image path', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: '' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode');
    });

    it('should return 400 for invalid file type', async () => {
      const txtFilePath = path.join(__dirname, '../test-images/invalid.txt');
      await fs.writeFile(txtFilePath, 'This is not an image');

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: txtFilePath })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);

      await fs.unlink(txtFilePath);
    });
  });

  describe('GET /tasks/:taskId', () => {
    it('should return 404 for non-existent task', async () => {
      const fakeTaskId = '507f1f77bcf86cd799439011';
      const response = await request(app.getHttpServer())
        .get(`/tasks/${fakeTaskId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return task with pending status', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: testImagePath })
        .expect(201);

      const taskId = createResponse.body.taskId;

      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('taskId', taskId);
      expect(getResponse.body).toHaveProperty('status', 'pending');
      expect(getResponse.body).toHaveProperty('price');
      expect(getResponse.body).not.toHaveProperty('images');
    });

    it('should return task with completed status and images after processing', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .send({ imagePath: testImagePath })
        .expect(201);

      const taskId = createResponse.body.taskId;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('taskId', taskId);
      expect(['pending', 'completed', 'failed']).toContain(getResponse.body.status);

      if (getResponse.body.status === 'completed') {
        expect(getResponse.body).toHaveProperty('images');
        expect(Array.isArray(getResponse.body.images)).toBe(true);
        if (getResponse.body.images.length > 0) {
          expect(getResponse.body.images[0]).toHaveProperty('resolution');
          expect(getResponse.body.images[0]).toHaveProperty('path');
        }
      }
    });
  });
});


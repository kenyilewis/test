import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@modules/app/app.module';
import { appConfig } from '@config/app.config';
import { DomainExceptionFilter, HttpExceptionFilter } from '@shared/filters';

async function main() {
  const app = await NestFactory.create(AppModule);

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

  const config = new DocumentBuilder()
    .setTitle('Image Processing API')
    .setDescription('API REST for image processing and task management. Processes images to generate variants at specific resolutions (1024px and 800px width) and manages task status with associated pricing.')
    .setVersion('1.0')
    .addTag('tasks', 'Image processing tasks management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(appConfig.port);
  console.log(`Server is running on port ${appConfig.port}`);
  console.log(`Swagger documentation available at http://localhost:${appConfig.port}/api/docs`);
}

main().catch((error) => {
  console.error('Fatal error in initialization:', error);
  process.exit(1);
});

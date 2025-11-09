import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateTaskUseCase } from '@task/application/use-cases/create-task.use-case';
import { GetTaskUseCase } from '@task/application/use-cases/get-task.use-case';
import { ProcessImageUseCase } from '@task/application/use-cases/process-image.use-case';
import { TaskController } from '@task/infrastructure/controllers/task.controller';
import { TaskRepository } from '@task/infrastructure/repositories/task.repository';
import { ImageRepository } from '@task/infrastructure/repositories/image.repository';
import { SharpImageProcessorService } from '@task/infrastructure/services/sharp-image-processor.service';
import { TaskDocument, TaskSchema } from '@task/infrastructure/schemas/task.schema';
import { ImageDocument, ImageSchema } from '@task/infrastructure/schemas/image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskDocument.name, schema: TaskSchema },
      { name: ImageDocument.name, schema: ImageSchema },
    ]),
  ],
  controllers: [TaskController],
  providers: [
    CreateTaskUseCase,
    GetTaskUseCase,
    ProcessImageUseCase,
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
    {
      provide: 'IImageRepository',
      useClass: ImageRepository,
    },
    {
      provide: 'IImageProcessor',
      useClass: SharpImageProcessorService,
    },
  ],
})
export class TaskModule {}

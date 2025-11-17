import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { Task, TaskImage } from '@task/domain/entities/task.entity';
import { ITaskRepository } from '@task/domain/repositories';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { TaskDocument, TaskImageDocument } from '../schemas/task.schema';

type TaskDocumentObject = {
  _id: Types.ObjectId;
  status: TaskStatus;
  price: number;
  originalPath: string;
  images: TaskImageDocument[];
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type TaskStatusUpdate = {
  status: TaskStatus;
  error?: string;
};

@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @InjectModel(TaskDocument.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}

  async create(task: Task): Promise<Task> {
    const taskDoc = new this.taskModel({
      status: task.status,
      price: task.price,
      originalPath: task.originalPath,
      images: task.images,
      error: task.error,
    });

    const saved = await taskDoc.save();
    return this.toDomainEntity(saved);
  }

  async findById(id: string): Promise<Task | null> {
    const taskDoc = await this.taskModel.findById(id).exec();
    if (!taskDoc) {
      return null;
    }
    return this.toDomainEntity(taskDoc);
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    error?: string,
  ): Promise<void> {
    const update: TaskStatusUpdate = { status };
    if (error) {
      update.error = error;
    }
    const updateQuery: UpdateQuery<TaskDocument> = update;
    await this.taskModel.updateOne({ _id: id }, updateQuery).exec();
  }

  async addImages(id: string, images: TaskImage[]): Promise<void> {
    await this.taskModel
      .updateOne(
        { _id: id },
        {
          $set: {
            images,
            status: TaskStatus.COMPLETED,
          },
        },
      )
      .exec();
  }

  private toDomainEntity(doc: TaskDocument): Task {
    const docObj = doc.toObject() as TaskDocumentObject;
    const id = docObj._id.toString();
    return new Task(
      id,
      docObj.status,
      docObj.price,
      docObj.originalPath,
      docObj.createdAt || new Date(),
      docObj.updatedAt || new Date(),
      docObj.images || [],
      docObj.error,
    );
  }
}

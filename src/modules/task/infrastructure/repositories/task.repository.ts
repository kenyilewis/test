import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskImage } from '@task/domain/entities/task.entity';
import { ITaskRepository } from '@task/domain/repositories';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';
import { TaskDocument } from '../schemas/task.schema';

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

  async updateStatus(id: string, status: TaskStatus, error?: string): Promise<void> {
    const update: any = { status };
    if (error) {
      update.error = error;
    }
    await this.taskModel.updateOne({ _id: id }, update).exec();
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
    const docObj = doc.toObject();
    const id = (doc._id as any).toString();
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

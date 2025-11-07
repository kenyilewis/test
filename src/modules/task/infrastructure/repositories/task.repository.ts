import { Injectable } from '@nestjs/common';
import { Task, TaskImage } from '@task/domain/entities/task.entity';
import { ITaskRepository } from '@task/domain/repositories';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';

@Injectable()
export class TaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private currentId = 1;

  async create(task: Task): Promise<Task> {
    const id = this.generateId();
    const newTask = new Task(
      id,
      task.status,
      task.price,
      task.originalPath,
      task.createdAt,
      task.updatedAt,
      task.images,
      task.error,
    );
    this.tasks.set(id, newTask);
    return newTask;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async updateStatus(id: string, status: TaskStatus, error?: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      task.updatedAt = new Date();
      if (error) {
        task.error = error;
      }
    }
  }

  async addImages(id: string, images: TaskImage[]): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.images = images;
      task.updatedAt = new Date();
    }
  }

  private generateId(): string {
    return `task_${this.currentId++}_${Date.now()}`;
  }
}

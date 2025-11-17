import { Task, TaskImage } from '@task/domain/entities/task.entity';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';

export interface ITaskRepository {
  create(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  updateStatus(id: string, status: TaskStatus, error?: string): Promise<void>;
  addImages(id: string, images: TaskImage[]): Promise<void>;
}

import { TaskStatus } from '@task/domain/value-objects/task-status.vo';

export interface TaskImage {
  resolution: string;
  path: string;
}

export class Task {
  constructor(
    public readonly id: string,
    public status: TaskStatus,
    public readonly price: number,
    public readonly originalPath: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public images: TaskImage[],
    public error?: string,
  ) {}

  markAsCompleted(images: TaskImage[]): void {
    this.status = TaskStatus.COMPLETED;
    this.images = images;
    this.updatedAt = new Date();
  }

  markAsFailed(error: string): void {
    this.status = TaskStatus.FAILED;
    this.error = error;
    this.updatedAt = new Date();
  }

  isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === TaskStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === TaskStatus.FAILED;
  }
}


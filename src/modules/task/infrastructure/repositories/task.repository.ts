import { Injectable } from '@nestjs/common';
import { Task } from 'src/modules/task/domain/entities/task.entity';
import { ITaskRepository } from '../../domain/repositories';

@Injectable()
export class TaskRepository implements ITaskRepository {
  create(task: Task): Promise<Task> {
    return Promise.resolve(task);
  }
}

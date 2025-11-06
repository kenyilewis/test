import { Task } from '../entities/task.entity';

export interface ITaskRepository {
  create(task: Task): Promise<Task>;
}

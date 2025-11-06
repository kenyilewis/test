import { ITaskRepository } from '../../domain/repositories';
import { CreateTaskInput } from '../inputs/create-task.input';

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput) {
    const task = await this.taskRepository.create(input);
    return task;
  }
}

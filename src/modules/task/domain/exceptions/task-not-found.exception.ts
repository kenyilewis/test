export class TaskNotFoundException extends Error {
  constructor(taskId: string) {
    super(`Task with ID ${taskId} not found`);
    this.name = 'TaskNotFoundException';
  }
}


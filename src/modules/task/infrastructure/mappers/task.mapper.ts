import { Task } from '@task/domain/entities/task.entity';
import { TaskResponseDto, ImageResponseDto } from '@task/infrastructure/dtos';

export class TaskMapper {
  static toResponseDto(task: Task): TaskResponseDto {
    const dto: TaskResponseDto = {
      taskId: task.id,
      status: task.status,
      price: task.price,
    };

    if (task.isCompleted() && task.images.length > 0) {
      dto.images = task.images.map((img) => ({
        resolution: img.resolution,
        path: img.path,
      }));
    }

    return dto;
  }
}


import { ApiProperty } from '@nestjs/swagger';
import { ImageResponseDto } from './image-response.dto';

export class TaskResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Unique task identifier',
  })
  taskId: string;

  @ApiProperty({
    example: 'pending',
    description: 'Current task status',
    enum: ['pending', 'completed', 'failed'],
  })
  status: string;

  @ApiProperty({
    example: 25.99,
    description: 'Random price between 5 and 50',
  })
  price: number;

  @ApiProperty({
    type: [ImageResponseDto],
    description: 'Processed images (only when completed)',
    required: false,
  })
  images?: ImageResponseDto[];
}




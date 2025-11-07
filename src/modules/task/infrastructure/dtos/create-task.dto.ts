import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateTaskInput } from '@task/application/inputs/create-task.input';

export class CreateTaskDto {
  @ApiProperty({
    example: '/path/to/image.jpg',
    description: 'Local path or URL of the image to process',
  })
  @IsString()
  @IsNotEmpty()
  imagePath: string;

  public toInput(): CreateTaskInput {
    return {
      imagePath: this.imagePath,
    };
  }
}


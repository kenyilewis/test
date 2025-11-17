import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { CreateTaskInput } from '@task/application/inputs/create-task.input';

export class CreateTaskDto {
  @ApiProperty({
    description: 'URL (HTTP/HTTPS) or local file path to the image to process',
    example: 'https://picsum.photos/2000/1500',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  imagePath!: string;

  public toInput(): CreateTaskInput {
    return {
      imagePath: this.imagePath,
    };
  }
}

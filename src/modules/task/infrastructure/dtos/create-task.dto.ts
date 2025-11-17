import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { CreateTaskInput } from '@task/application/inputs/create-task.input';

export class CreateTaskDto {
  @ApiProperty({
    description:
      'URL or local file path to the image to process. Required when using Content-Type: application/json. Not allowed when using multipart/form-data (use file upload instead).',
    example: 'https://example.com/sample-image.jpg',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  imagePath?: string;

  public toInput(): CreateTaskInput {
    return {
      imagePath: this.imagePath!,
    };
  }
}

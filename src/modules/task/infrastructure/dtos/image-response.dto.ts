import { ApiProperty } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({
    example: '1024',
    description: 'Image resolution width in pixels',
  })
  resolution: string;

  @ApiProperty({
    example: '/output/image/1024/abc123.jpg',
    description: 'Path to the processed image',
  })
  path: string;
}


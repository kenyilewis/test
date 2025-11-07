import { Image } from '@task/domain/entities/image.entity';

export interface IImageRepository {
  create(image: Image): Promise<Image>;
  findByTaskId(taskId: string): Promise<Image[]>;
  findByMd5(md5: string): Promise<Image | null>;
}


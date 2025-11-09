import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Image } from '@task/domain/entities/image.entity';
import { IImageRepository } from '@task/domain/repositories/image.repository';
import { ImageDocument } from '../schemas/image.schema';

@Injectable()
export class ImageRepository implements IImageRepository {
  constructor(
    @InjectModel(ImageDocument.name)
    private readonly imageModel: Model<ImageDocument>,
  ) {}

  async create(image: Image): Promise<Image> {
    const imageDoc = new this.imageModel({
      taskId: new Types.ObjectId(image.taskId),
      resolution: image.resolution,
      path: image.path,
      md5: image.md5,
    });

    const saved = await imageDoc.save();
    return this.toDomainEntity(saved);
  }

  async findByTaskId(taskId: string): Promise<Image[]> {
    const imageDocs = await this.imageModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .exec();
    return imageDocs.map((doc) => this.toDomainEntity(doc));
  }

  async findByMd5(md5: string): Promise<Image | null> {
    const imageDoc = await this.imageModel.findOne({ md5 }).exec();
    if (!imageDoc) {
      return null;
    }
    return this.toDomainEntity(imageDoc);
  }

  private toDomainEntity(doc: ImageDocument): Image {
    const docObj = doc.toObject();
    const id = (doc._id as any).toString();
    const taskId = (docObj.taskId as any).toString();
    return new Image(
      id,
      taskId,
      docObj.resolution,
      docObj.path,
      docObj.md5,
      docObj.createdAt || new Date(),
    );
  }
}


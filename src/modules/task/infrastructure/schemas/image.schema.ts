import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'images', timestamps: true })
export class ImageDocument extends Document {
  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'TaskDocument',
    index: true,
  })
  taskId: Types.ObjectId;

  @Prop({ required: true, type: String })
  resolution: string;

  @Prop({ required: true, type: String })
  path: string;

  @Prop({ required: true, type: String, index: true })
  md5: string;
}

export const ImageSchema = SchemaFactory.createForClass(ImageDocument);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TaskStatus } from '@task/domain/value-objects/task-status.vo';

export interface TaskImageDocument {
  resolution: string;
  path: string;
}

@Schema({ collection: 'tasks', timestamps: true })
export class TaskDocument extends Document {
  @Prop({ required: true, enum: TaskStatus, index: true })
  status: TaskStatus;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, type: String })
  originalPath: string;

  @Prop({ type: [{ resolution: String, path: String }], default: [] })
  images: TaskImageDocument[];

  @Prop({ type: String, required: false })
  error?: string;
}

export const TaskSchema = SchemaFactory.createForClass(TaskDocument);

TaskSchema.index({ _id: 1 });
TaskSchema.index({ status: 1 });


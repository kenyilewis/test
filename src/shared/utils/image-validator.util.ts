import sharp from 'sharp';
import * as fs from 'fs/promises';
import { InvalidImageFormatException } from '@task/domain/exceptions';

export async function validateImageFile(imagePath: string): Promise<void> {
  try {
    await fs.access(imagePath);
    
    await sharp(imagePath).metadata();
  } catch (error) {
    if (error instanceof Error) {
      throw new InvalidImageFormatException(error.message);
    }
    throw new InvalidImageFormatException('Unable to read image metadata');
  }
}


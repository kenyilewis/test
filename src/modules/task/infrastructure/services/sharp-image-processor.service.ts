import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  IImageProcessor,
  ProcessedImageResult,
} from '@task/application/services/image-processor.interface';
import { appConfig } from '@config/app.config';
import {
  buildImageOutputPath,
  extractFileName,
  getFileExtension,
} from '@shared/utils/path-builder.util';
import { calculateMd5 } from '@shared/utils/md5-hasher.util';

@Injectable()
export class SharpImageProcessorService implements IImageProcessor {
  private readonly resolutions = [1024, 800];

  async processImage(imagePath: string): Promise<ProcessedImageResult[]> {
    const results: ProcessedImageResult[] = [];
    const originalFileName = extractFileName(imagePath);
    const fileExtension = getFileExtension(imagePath);

    for (const resolution of this.resolutions) {
      const buffer = await this.resizeImage(imagePath, resolution);
      const md5 = calculateMd5(buffer);

      const outputPath = buildImageOutputPath(
        appConfig.outputDir,
        originalFileName,
        resolution.toString(),
        md5,
        fileExtension,
      );

      await this.ensureDirectoryExists(path.dirname(outputPath));
      await fs.writeFile(outputPath, buffer);

      results.push({
        resolution: resolution.toString(),
        path: outputPath,
        md5,
        buffer,
      });
    }

    return results;
  }

  private async resizeImage(imagePath: string, width: number): Promise<Buffer> {
    return await sharp(imagePath)
      .resize(width, null, { fit: 'inside' })
      .toBuffer();
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export interface ProcessedImageResult {
  resolution: string;
  path: string;
  md5: string;
  buffer: Buffer;
}

export interface IImageProcessor {
  processImage(imagePath: string): Promise<ProcessedImageResult[]>;
}


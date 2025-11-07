export class ImageProcessingException extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(`Image processing failed: ${message}`);
    this.name = 'ImageProcessingException';
  }
}


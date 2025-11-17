export class InvalidImageFormatException extends Error {
  constructor(message: string) {
    super(`Invalid image format: ${message}`);
    this.name = 'InvalidImageFormatException';
  }
}

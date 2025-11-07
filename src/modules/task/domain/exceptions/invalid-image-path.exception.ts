export class InvalidImagePathException extends Error {
  constructor(path: string) {
    super(`Invalid image path: ${path}`);
    this.name = 'InvalidImagePathException';
  }
}


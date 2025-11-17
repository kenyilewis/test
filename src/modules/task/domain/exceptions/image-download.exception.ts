export class ImageDownloadException extends Error {
  constructor(message: string) {
    super(`Image download failed: ${message}`);
    this.name = 'ImageDownloadException';
  }
}

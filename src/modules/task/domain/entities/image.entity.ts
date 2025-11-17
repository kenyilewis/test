export class Image {
  constructor(
    public readonly id: string,
    public readonly taskId: string,
    public readonly resolution: string,
    public readonly path: string,
    public readonly md5: string,
    public readonly createdAt: Date,
  ) {}
}

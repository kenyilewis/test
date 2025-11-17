import * as path from 'path';

export function buildImageOutputPath(
  outputDir: string,
  originalFileName: string,
  resolution: string,
  md5: string,
  extension: string,
): string {
  const baseFileName = path.parse(originalFileName).name;
  return path.join(outputDir, baseFileName, resolution, `${md5}${extension}`);
}

export function extractFileName(filePath: string): string {
  return path.basename(filePath);
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath);
}

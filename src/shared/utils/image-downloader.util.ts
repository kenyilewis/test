import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { appConfig } from '@config/app.config';
import { ImageDownloadException } from '@task/domain/exceptions';

export function isUrl(imagePath: string): boolean {
  return /^https?:\/\//i.test(imagePath);
}

export async function downloadImage(url: string): Promise<string> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new ImageDownloadException(response.statusText);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.startsWith('image/')) {
    throw new ImageDownloadException('URL does not point to a valid image');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  
  const tempDir = path.join(appConfig.outputDir, 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const randomName = crypto.randomBytes(16).toString('hex');
  const extension = getExtensionFromContentType(contentType) || '.jpg';
  const tempFilePath = path.join(tempDir, `${randomName}${extension}`);
  
  await fs.writeFile(tempFilePath, buffer);
  
  return tempFilePath;
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore errors during cleanup
  }
}

function getExtensionFromContentType(contentType: string): string | null {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'image/bmp': '.bmp',
  };
  
  return mimeToExt[contentType] || null;
}


import * as crypto from 'crypto';
import * as fs from 'fs';

export async function calculateMd5(buffer: Buffer): Promise<string> {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export async function calculateMd5FromFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}


import { calculateMd5 } from './md5-hasher.util';

describe('Md5Hasher', () => {
  describe('calculateMd5', () => {
    it('should calculate MD5 hash of buffer', async () => {
      const buffer = Buffer.from('test data');
      const md5 = await calculateMd5(buffer);

      expect(md5).toBeTruthy();
      expect(typeof md5).toBe('string');
      expect(md5).toHaveLength(32);
    });

    it('should return consistent hash for same data', async () => {
      const buffer = Buffer.from('consistent data');
      const md5_1 = await calculateMd5(buffer);
      const md5_2 = await calculateMd5(buffer);

      expect(md5_1).toBe(md5_2);
    });

    it('should return different hash for different data', async () => {
      const buffer1 = Buffer.from('data 1');
      const buffer2 = Buffer.from('data 2');
      const md5_1 = await calculateMd5(buffer1);
      const md5_2 = await calculateMd5(buffer2);

      expect(md5_1).not.toBe(md5_2);
    });
  });
});


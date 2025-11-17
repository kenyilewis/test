import {
  buildImageOutputPath,
  extractFileName,
  getFileExtension,
} from './path-builder.util';
import * as path from 'path';

describe('PathBuilder', () => {
  describe('buildImageOutputPath', () => {
    it('should build correct output path', () => {
      const result = buildImageOutputPath(
        '/output',
        'image.jpg',
        '1024',
        'abc123',
        '.jpg',
      );

      expect(result).toBe(path.join('/output', 'image', '1024', 'abc123.jpg'));
    });

    it('should handle file names without extension in original name', () => {
      const result = buildImageOutputPath(
        './output',
        'myimage',
        '800',
        'def456',
        '.png',
      );

      expect(result).toContain('myimage');
      expect(result).toContain('800');
      expect(result).toContain('def456.png');
    });
  });

  describe('extractFileName', () => {
    it('should extract filename from path', () => {
      expect(extractFileName('/path/to/image.jpg')).toBe('image.jpg');
      expect(extractFileName('image.jpg')).toBe('image.jpg');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('image.jpg')).toBe('.jpg');
      expect(getFileExtension('/path/to/photo.png')).toBe('.png');
    });
  });
});

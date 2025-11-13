import { isUrl, downloadImage, cleanupTempFile } from './image-downloader.util';
import { ImageDownloadException } from '@task/domain/exceptions';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('Image Downloader Utilities', () => {
  describe('isUrl', () => {
    it('should return true for valid HTTP URL', () => {
      expect(isUrl('http://example.com/image.jpg')).toBe(true);
    });

    it('should return true for valid HTTPS URL', () => {
      expect(isUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('should return false for local file path', () => {
      expect(isUrl('/path/to/image.jpg')).toBe(false);
    });

    it('should return false for relative path', () => {
      expect(isUrl('./image.jpg')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isUrl('')).toBe(false);
    });
  });

  describe('downloadImage', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn();
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    });

    it('should download image from valid URL', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('image/jpeg'),
        },
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      const tempFilePath = await downloadImage('https://example.com/image.jpg');

      expect(tempFilePath).toMatch(/\/output\/temp\/[a-f0-9]{32}\.jpg$/);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg');
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw ImageDownloadException for failed download', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(downloadImage('https://example.com/nonexistent.jpg'))
        .rejects
        .toThrow(ImageDownloadException);
      
      await expect(downloadImage('https://example.com/nonexistent.jpg'))
        .rejects
        .toThrow('Image download failed: Not Found');
    });

    it('should throw ImageDownloadException for non-image content type', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
      });

      await expect(downloadImage('https://example.com/page.html'))
        .rejects
        .toThrow(ImageDownloadException);
      
      await expect(downloadImage('https://example.com/page.html'))
        .rejects
        .toThrow('Image download failed: URL does not point to a valid image');
    });

    it('should throw ImageDownloadException for missing content-type header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      });

      await expect(downloadImage('https://example.com/file'))
        .rejects
        .toThrow(ImageDownloadException);
      
      await expect(downloadImage('https://example.com/file'))
        .rejects
        .toThrow('Image download failed: URL does not point to a valid image');
    });
  });

  describe('cleanupTempFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete temp file successfully', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await cleanupTempFile('/tmp/temp-image.jpg');

      expect(fs.unlink).toHaveBeenCalledWith('/tmp/temp-image.jpg');
    });

    it('should not throw error if file deletion fails', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(cleanupTempFile('/tmp/nonexistent.jpg')).resolves.not.toThrow();
    });
  });
});


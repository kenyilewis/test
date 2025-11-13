import { validateImageFile } from './image-validator.util';
import { InvalidImageFormatException } from '@task/domain/exceptions';
import sharp from 'sharp';
import * as fs from 'fs/promises';

jest.mock('sharp');
jest.mock('fs/promises');

describe('Image Validator Utilities', () => {
  describe('validateImageFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should validate a valid image file', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      const mockMetadata = jest.fn().mockResolvedValue({
        format: 'jpeg',
        width: 1024,
        height: 768,
      });
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: mockMetadata,
      });

      await expect(validateImageFile('/path/to/image.jpg')).resolves.not.toThrow();

      expect(fs.access).toHaveBeenCalledWith('/path/to/image.jpg');
      expect(sharp).toHaveBeenCalledWith('/path/to/image.jpg');
      expect(mockMetadata).toHaveBeenCalled();
    });

    it('should throw InvalidImageFormatException if file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(validateImageFile('/path/to/nonexistent.jpg'))
        .rejects
        .toThrow(InvalidImageFormatException);
    });

    it('should throw InvalidImageFormatException if Sharp fails to read metadata', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      const mockMetadata = jest.fn().mockRejectedValue(new Error('Input buffer contains unsupported image format'));
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: mockMetadata,
      });

      await expect(validateImageFile('/path/to/invalid.txt'))
        .rejects
        .toThrow(InvalidImageFormatException);
      
      await expect(validateImageFile('/path/to/invalid.txt'))
        .rejects
        .toThrow('Invalid image format: Input buffer contains unsupported image format');
    });

    it('should throw InvalidImageFormatException for non-Error exceptions', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      const mockMetadata = jest.fn().mockRejectedValue('Something went wrong');
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: mockMetadata,
      });

      await expect(validateImageFile('/path/to/corrupted.jpg'))
        .rejects
        .toThrow(InvalidImageFormatException);
      
      await expect(validateImageFile('/path/to/corrupted.jpg'))
        .rejects
        .toThrow('Invalid image format: Unable to read image metadata');
    });
  });
});


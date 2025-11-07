import { generateRandomPrice } from './price-generator.util';

describe('PriceGenerator', () => {
  describe('generateRandomPrice', () => {
    it('should generate a price between 5 and 50', () => {
      for (let i = 0; i < 100; i++) {
        const price = generateRandomPrice();
        expect(price).toBeGreaterThanOrEqual(5);
        expect(price).toBeLessThanOrEqual(50);
      }
    });

    it('should generate a price with at most 2 decimal places', () => {
      for (let i = 0; i < 100; i++) {
        const price = generateRandomPrice();
        const decimalPlaces = (price.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      }
    });

    it('should return a number', () => {
      const price = generateRandomPrice();
      expect(typeof price).toBe('number');
    });
  });
});


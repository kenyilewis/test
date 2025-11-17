export function generateRandomPrice(): number {
  const min = 5;
  const max = 50;
  const price = Math.random() * (max - min) + min;
  return Math.round(price * 100) / 100;
}

import { estimatedAmount, formatPesos, parseQuantity } from '../../src/transactions/model/money';

// ADR-026 and D-C11 on the buyer's side: the price is never sent; the estimate shown before
// paying uses the server's rule, round_half_up(quantity × unitPrice, 0).
describe('transactions model', () => {
  it('formats whole pesos, with COP only on totals', () => {
    expect(formatPesos(462500)).toBe('$ 462.500');
    expect(formatPesos(462500, { suffix: true })).toBe('$ 462.500 COP');
  });

  it('estimates the amount rounding half up to whole pesos', () => {
    expect(estimatedAmount(2.5, 185000)).toBe(462500);
    expect(estimatedAmount(1.5, 333)).toBe(500);
  });

  it.each([
    ['2', 2],
    ['2,5', 2.5],
    ['12.25', 12.25],
    [' 3 ', 3],
  ])('reads the quantity %j as %d', (text, value) => {
    expect(parseQuantity(text)).toBe(value);
  });

  it.each(['', 'dos', '1.125', '-1', '1e3', '2,5,1'])('rejects the quantity %j', (text) => {
    expect(parseQuantity(text)).toBeNull();
  });
});

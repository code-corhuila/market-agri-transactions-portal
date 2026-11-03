import {
  estimatedAmountCents,
  formatCents,
  parseQuantity,
} from '../../src/transactions/model/money';

// ADR-029 and D-C11 (amended 2026-11-01) on the buyer's side: the price is never sent; the estimate
// shown before paying uses the server's rule, round_half_up(quantity × unitPriceCents, 0), in
// integer centavos; the screen shows pesos, and centavos only when they are not zero.
describe('transactions model', () => {
  it('formats integer centavos as pesos, with COP only on totals', () => {
    expect(formatCents(46_250_000)).toBe('$ 462.500');
    expect(formatCents(46_250_000, { suffix: true })).toBe('$ 462.500 COP');
    expect(formatCents(3_125_000, { suffix: true })).toBe('$ 31.250 COP');
  });

  it('shows the centavos only when they are not zero', () => {
    expect(formatCents(8_500_050)).toBe('$ 85.000,50');
    expect(formatCents(8_500_005, { suffix: true })).toBe('$ 85.000,05 COP');
    expect(formatCents(100)).toBe('$ 1');
  });

  it('estimates the amount in centavos, rounding half up to whole centavos', () => {
    expect(estimatedAmountCents(12.5, 680_000)).toBe(8_500_000); // ADR-029's example
    expect(estimatedAmountCents(2.5, 18_500_000)).toBe(46_250_000);
    expect(estimatedAmountCents(1.5, 333)).toBe(500); // 499.5
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

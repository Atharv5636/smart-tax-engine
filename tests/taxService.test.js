const { calculateNewTax, calculateOldTax } = require("../services/taxService");

describe("taxService", () => {
  test("new regime rebate under 7L taxable income should return 0 tax", () => {
    expect(calculateNewTax(775000)).toBe(0);
  });

  test("old regime rebate under 5L taxable income should return 0 tax", () => {
    expect(calculateOldTax(600000, 100000)).toBe(0);
  });

  test("tax increases with higher income", () => {
    const lowerIncomeTax = calculateNewTax(800000);
    const higherIncomeTax = calculateNewTax(1200000);

    expect(higherIncomeTax).toBeGreaterThan(lowerIncomeTax);
  });

  test("standard deduction is applied in new regime", () => {
    expect(calculateNewTax(800000)).toBe(28600);
  });
});

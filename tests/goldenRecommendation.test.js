const { calculateNewTax, calculateOldTax } = require("../services/taxService");
const { optimizeTax } = require("../services/optimizerService");

function decideRegime(income, deductions) {
  const newTax = calculateNewTax(income);
  const oldTax = calculateOldTax(income, deductions);
  return {
    newTax,
    oldTax,
    regime: newTax <= oldTax ? "New" : "Old",
  };
}

describe("golden regression: tax values and recommendation consistency", () => {
  test.each([
    { income: 600000, deductions: 0, expectedNewTax: 0, expectedOldTax: 33800, expectedRegime: "New" },
    { income: 800000, deductions: 0, expectedNewTax: 28600, expectedOldTax: 75400, expectedRegime: "New" },
    { income: 1000000, deductions: 50000, expectedNewTax: 50700, expectedOldTax: 106600, expectedRegime: "New" },
    { income: 1200000, deductions: 100000, expectedNewTax: 81900, expectedOldTax: 148200, expectedRegime: "New" },
    { income: 1200000, deductions: 225000, expectedNewTax: 81900, expectedOldTax: 111800, expectedRegime: "New" },
    { income: 1500000, deductions: 150000, expectedNewTax: 140400, expectedOldTax: 226200, expectedRegime: "New" },
    { income: 1800000, deductions: 225000, expectedNewTax: 226200, expectedOldTax: 296400, expectedRegime: "New" },
    { income: 2500000, deductions: 225000, expectedNewTax: 444600, expectedOldTax: 514800, expectedRegime: "New" },
    { income: 5000000, deductions: 0, expectedNewTax: 1224600, expectedOldTax: 1365000, expectedRegime: "New" },
    { income: 5200000, deductions: 225000, expectedNewTax: 1415700, expectedOldTax: 1492920, expectedRegime: "New" },
  ])(
    "income ₹$income with deductions ₹$deductions",
    ({ income, deductions, expectedNewTax, expectedOldTax, expectedRegime }) => {
      const result = decideRegime(income, deductions);

      expect(result.newTax).toBe(expectedNewTax);
      expect(result.oldTax).toBe(expectedOldTax);
      expect(result.regime).toBe(expectedRegime);
    }
  );

  test("optimizer never increases old-regime tax when additional budget increases", () => {
    const income = 1200000;
    const existing = { section80C: 100000, section80D: 0, nps: 0 };
    const lowBudget = optimizeTax(income, existing, 25000);
    const highBudget = optimizeTax(income, existing, 125000);

    expect(highBudget.minimumTax).toBeLessThanOrEqual(lowBudget.minimumTax);
  });

  test("optimizer respects overall deduction cap of ₹225000", () => {
    const income = 1200000;
    const existing = { section80C: 150000, section80D: 25000, nps: 50000 };
    const result = optimizeTax(income, existing, 100000);

    expect(result.totalDeduction).toBe(225000);
    expect(result.additionalUsed).toBe(0);
    expect(result.isFullyUtilized).toBe(true);
  });
});

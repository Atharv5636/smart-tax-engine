const { optimizeTax } = require("../services/optimizerService");

describe("optimizerService", () => {
  test("additional investment used should never exceed additional budget", () => {
    const additionalBudget = 100000;
    const result = optimizeTax(1200000, { section80C: 20000, section80D: 0, nps: 0 }, additionalBudget);
    const totalUsed = result.additionalUsed;

    expect(totalUsed).toBeLessThanOrEqual(additionalBudget);
  });

  test("zero additional budget should not change existing deductions", () => {
    const existing = { section80C: 100000, section80D: 5000, nps: 10000 };
    const result = optimizeTax(1200000, existing, 0);

    expect(result.additionalUsed).toBe(0);
    expect(result.bestCombination).toEqual({
      section80C: 100000,
      section80D: 5000,
      nps: 10000,
    });
  });

  test("higher additional budget should not increase tax", () => {
    const existing = { section80C: 90000, section80D: 0, nps: 0 };
    const lowBudgetResult = optimizeTax(1200000, existing, 50000);
    const highBudgetResult = optimizeTax(1200000, existing, 200000);

    expect(highBudgetResult.minimumTax).toBeLessThanOrEqual(lowBudgetResult.minimumTax);
  });

  test("existing deductions above limits are capped", () => {
    const result = optimizeTax(
      1200000,
      { section80C: 300000, section80D: 100000, nps: 70000 },
      50000
    );

    expect(result.existingDeductions).toEqual({
      section80C: 150000,
      section80D: 25000,
      nps: 50000,
    });
    expect(result.isFullyUtilized).toBe(true);
    expect(result.additionalUsed).toBe(0);
  });
});

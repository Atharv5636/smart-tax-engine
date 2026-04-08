const { calculateOldTax } = require("./taxService");

function simulateTaxChange(income, currentDeductions, newDeductions) {
  const currentTax = calculateOldTax(income, currentDeductions);
  const updatedTax = calculateOldTax(income, newDeductions);
  const taxSaved = currentTax - updatedTax;

  return {
    currentTax,
    updatedTax,
    taxSaved,
  };
}

module.exports = {
  simulateTaxChange,
};

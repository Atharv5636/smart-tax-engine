const { calculateNewTax, calculateOldTax } = require("../services/taxService");

function calculateTax(req, res) {
  try {
    const { income, deductions = 0 } = req.body;
    const parsedIncome = Number(income);
    const parsedDeductions = Number(deductions);

    if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
      return res.status(400).json({
        success: false,
        message: "Income must be a positive number",
      });
    }

    if (!Number.isFinite(parsedDeductions) || parsedDeductions < 0) {
      return res.status(400).json({
        success: false,
        message: "Deductions must be a non-negative number",
      });
    }

    const newTax = calculateNewTax(parsedIncome);
    const oldTax = calculateOldTax(parsedIncome, parsedDeductions);

    return res.status(200).json({
      success: true,
      data: {
        newTax,
        oldTax,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to calculate tax",
    });
  }
}

module.exports = {
  calculateTax,
};

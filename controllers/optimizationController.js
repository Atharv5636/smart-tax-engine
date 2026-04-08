const { optimizeDeductions } = require("../services/optimizationService");

function optimizeTax(req, res) {
  try {
    const { income, deductions = {} } = req.body;
    const parsedIncome = Number(income);

    if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
      return res.status(400).json({
        success: false,
        message: "Income must be a positive number",
      });
    }

    const result = optimizeDeductions(parsedIncome, deductions);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to optimize deductions",
    });
  }
}

module.exports = {
  optimizeTax,
};

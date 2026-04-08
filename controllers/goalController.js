const { optimizeForGoal } = require("../services/goalService");

function optimizeGoal(req, res) {
  try {
    const { income, currentDeductions = 0, targetTax } = req.body;
    const parsedIncome = Number(income);
    const parsedCurrentDeductions = Number(currentDeductions);
    const parsedTargetTax = Number(targetTax);

    if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
      return res.status(400).json({
        success: false,
        message: "Income must be a positive number",
      });
    }

    if (!Number.isFinite(parsedCurrentDeductions) || parsedCurrentDeductions < 0) {
      return res.status(400).json({
        success: false,
        message: "currentDeductions must be a non-negative number",
      });
    }

    if (!Number.isFinite(parsedTargetTax) || parsedTargetTax < 0) {
      return res.status(400).json({
        success: false,
        message: "targetTax must be a non-negative number",
      });
    }

    const result = optimizeForGoal(
      parsedIncome,
      parsedCurrentDeductions,
      parsedTargetTax
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to optimize tax goal",
    });
  }
}

module.exports = {
  optimizeGoal,
};

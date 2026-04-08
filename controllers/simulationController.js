const { simulateTaxChange } = require("../services/simulationService");

function simulateTax(req, res) {
  try {
    const { income, currentDeductions = 0, newDeductions = 0 } = req.body;
    const parsedIncome = Number(income);
    const parsedCurrentDeductions = Number(currentDeductions);
    const parsedNewDeductions = Number(newDeductions);

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

    if (!Number.isFinite(parsedNewDeductions) || parsedNewDeductions < 0) {
      return res.status(400).json({
        success: false,
        message: "newDeductions must be a non-negative number",
      });
    }

    const simulation = simulateTaxChange(
      parsedIncome,
      parsedCurrentDeductions,
      parsedNewDeductions
    );

    return res.status(200).json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to simulate tax change",
    });
  }
}

module.exports = {
  simulateTax,
};

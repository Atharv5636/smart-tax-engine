const { simulateTaxChange } = require("../services/simulationService");

function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function simulateTax(req, res, next) {
  try {
    const { income, currentDeductions = 0, newDeductions = 0 } = req.body;
    const simulation = simulateTaxChange(income, currentDeductions, newDeductions);

    return res.status(200).json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    return next(createHttpError(error.message || "Failed to simulate tax change", error.statusCode));
  }
}

module.exports = {
  simulateTax,
};

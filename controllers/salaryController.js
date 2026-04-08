const { calculateHRA } = require("../services/salaryService");

function calculateSalaryHRA(req, res) {
  try {
    const { basicSalary, hra, rentPaid, isMetro = false } = req.body;
    const result = calculateHRA(basicSalary, hra, rentPaid, isMetro);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to calculate HRA",
    });
  }
}

module.exports = {
  calculateSalaryHRA,
};

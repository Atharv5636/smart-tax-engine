const { calculateCapitalGainsTax } = require("../services/capitalGainsService");

function calculateCapitalGains(req, res) {
  try {
    const { gain, holdingPeriodMonths } = req.body;
    const parsedGain = Number(gain);

    if (!Number.isFinite(parsedGain) || parsedGain < 0) {
      return res.status(400).json({
        success: false,
        message: "gain must be a non-negative number",
      });
    }

    const result = calculateCapitalGainsTax(gain, holdingPeriodMonths);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to calculate capital gains tax",
    });
  }
}

module.exports = {
  calculateCapitalGains,
};

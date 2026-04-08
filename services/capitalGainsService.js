function calculateCapitalGainsTax(gain, holdingPeriodMonths) {
  const parsedGain = Number(gain);
  const parsedHolding = Number(holdingPeriodMonths);

  if (!Number.isFinite(parsedGain) || parsedGain < 0) {
    const error = new Error("gain must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(parsedHolding) || parsedHolding < 0) {
    const error = new Error("holdingPeriodMonths must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }

  let type = "";
  let taxableGain = 0;
  let tax = 0;

  if (parsedHolding <= 12) {
    type = "STCG";
    taxableGain = parsedGain;
    tax = taxableGain * 0.15;
  } else {
    type = "LTCG";
    const exemption = 100000;
    taxableGain = Math.max(0, parsedGain - exemption);
    tax = taxableGain * 0.1;
  }

  return {
    type,
    taxableGain: Math.round(taxableGain),
    tax: Math.round(tax),
  };
}

module.exports = {
  calculateCapitalGainsTax,
};

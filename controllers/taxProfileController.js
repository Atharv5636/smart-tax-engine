const {
  saveTaxProfile,
  getUserTaxHistory,
} = require("../services/taxProfileService");

async function saveTax(req, res) {
  try {
    const { income, deductions = 0, newTax, oldTax } = req.body;
    const userId = String(req.user._id);

    const profile = await saveTaxProfile({
      userId,
      income,
      deductions,
      newTax,
      oldTax,
    });

    return res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save tax profile",
    });
  }
}

async function getHistory(req, res) {
  try {
    const userId = String(req.user._id);

    const history = await getUserTaxHistory(userId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tax history",
    });
  }
}

module.exports = {
  saveTax,
  getHistory,
};

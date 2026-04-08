const TaxProfile = require("../models/TaxProfile");

async function saveTaxProfile(data) {
  const { userId, income, deductions = 0, newTax, oldTax } = data;

  const profile = await TaxProfile.create({
    userId,
    income,
    deductions,
    newTax,
    oldTax,
  });

  return profile;
}

async function getUserTaxHistory(userId) {
  const history = await TaxProfile.find({ userId }).sort({ createdAt: -1 }).lean();
  return history;
}

module.exports = {
  saveTaxProfile,
  getUserTaxHistory,
};

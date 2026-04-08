const mongoose = require("mongoose");

const taxProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    income: {
      type: Number,
      required: true,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    newTax: {
      type: Number,
      required: true,
      min: 0,
    },
    oldTax: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TaxProfile", taxProfileSchema);

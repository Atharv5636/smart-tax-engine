function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function getNumericValue(value, fallback = undefined) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return NaN;
  }

  return parsed;
}

function validateIncome(req, res, next) {
  const income = getNumericValue(req.body && req.body.income);

  if (!Number.isFinite(income) || income <= 0) {
    return next(createValidationError("Income must be a number greater than 0"));
  }

  req.body.income = income;
  return next();
}

function validateBudget(req, res, next) {
  const budgetInput = req.body && (req.body.additionalBudget ?? req.body.budget);
  const budget = getNumericValue(budgetInput, undefined);

  if (budget === undefined) {
    return next();
  }

  if (!Number.isFinite(budget) || budget < 0) {
    return next(createValidationError("Additional budget must be a number greater than or equal to 0"));
  }

  req.body.additionalBudget = budget;
  return next();
}

function validateDeductions(req, res, next) {
  const income = getNumericValue(req.body && req.body.income);
  const hasIncome = Number.isFinite(income);

  const deductionFields = ["deductions", "currentDeductions", "newDeductions"];

  for (const field of deductionFields) {
    if (!(req.body && Object.prototype.hasOwnProperty.call(req.body, field))) {
      continue;
    }

    const value = getNumericValue(req.body[field], 0);
    if (!Number.isFinite(value) || value < 0) {
      return next(createValidationError(`${field} must be a number greater than or equal to 0`));
    }

    if (hasIncome && value > income) {
      return next(createValidationError(`${field} cannot be greater than income`));
    }

    req.body[field] = value;
  }

  return next();
}

module.exports = {
  validateIncome,
  validateBudget,
  validateDeductions,
};

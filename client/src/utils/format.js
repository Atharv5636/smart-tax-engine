export const toNumber = (value) => Number(value);

export const hasEmptyField = (values) =>
  values.some((value) => String(value).trim() === "");

export const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

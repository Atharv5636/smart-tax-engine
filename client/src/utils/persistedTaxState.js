const APP_PREFIX = "smart-tax-engine";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getCurrentUserId() {
  if (!isBrowser()) {
    return "guest";
  }

  try {
    const rawUser = window.localStorage.getItem("user");
    if (!rawUser) {
      return "guest";
    }

    const parsedUser = JSON.parse(rawUser);
    return String(parsedUser?._id || parsedUser?.id || "guest");
  } catch {
    return "guest";
  }
}

function getScopedKey(suffix) {
  const userId = getCurrentUserId();
  return `${APP_PREFIX}:${userId}:${suffix}`;
}

function readJson(key, fallbackValue) {
  if (!isBrowser()) {
    return fallbackValue;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function writeJson(key, value) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write errors to avoid breaking the UI.
  }
}

export function getStoredTaxInputs() {
  return readJson(getScopedKey("tax-inputs"), null);
}

export function setStoredTaxInputs(value) {
  writeJson(getScopedKey("tax-inputs"), value);
}

export function getStoredPdfExtraction() {
  return readJson(getScopedKey("pdf-extraction"), null);
}

export function setStoredPdfExtraction(value) {
  writeJson(getScopedKey("pdf-extraction"), value);
}

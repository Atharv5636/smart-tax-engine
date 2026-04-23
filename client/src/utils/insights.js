export function getTaxInsight(result) {
  if (!result) return "";

  const diff = result.oldTax - result.newTax;

  if (diff > 0) {
    return `You can save Rs ${diff.toLocaleString("en-IN")} by choosing the New Regime.`;
  }

  return "Old Regime is better based on your current deductions.";
}

export function getSimulationInsight(result) {
  if (!result) return "";

  return `Increasing deductions helped you save Rs ${result.taxSaved.toLocaleString("en-IN")}.`;
}

export function getGoalInsight(result) {
  if (!result) return "";

  if (result.goalAchieved) {
    return "Your tax goal is achievable with optimized deductions.";
  }

  return "Your target tax may not be achievable within current limits.";
}

export function getSalaryInsight(result) {
  if (!result) return "";

  return `You can reduce taxable income by Rs ${result.hraExemption.toLocaleString(
    "en-IN"
  )} using HRA.`;
}

export function getCapitalGainsInsight(result) {
  if (!result) return "";

  if (result.type === "LTCG" && result.tax === 0) {
    return "No tax due because your gains are within exemption limit.";
  }

  return `You will pay Rs ${result.tax.toLocaleString("en-IN")} tax on your gains.`;
}

export function getOptimizationInsight(result) {
  if (!result) return "";

  if ((result.unused80C || 0) > 0) {
    return `You still have Rs ${result.unused80C.toLocaleString(
      "en-IN"
    )} available under Section 80C.`;
  }

  return "Your Section 80C limit appears fully utilized.";
}

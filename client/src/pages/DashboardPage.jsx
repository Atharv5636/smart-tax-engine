import { useEffect, useMemo, useState } from "react";
import { calculateTax } from "../api/taxApi";
import MagicBento from "../components/dashboard/MagicBento";
import Insights from "../components/Insights";
import PageHeader from "../components/PageHeader";
import PdfUpload from "../components/PdfUpload";
import TaxChart from "../components/TaxChart";
import { getStoredTaxInputs, setStoredTaxInputs } from "../utils/persistedTaxState";

const features = [
  { title: "Tax Calculation", description: "Compare old and new regime tax quickly.", label: "Insights", to: "/tax", icon: "\uD83D\uDCB0" },
  { title: "Simulation", description: "Test impact of deduction changes.", label: "Scenario", to: "/simulation", icon: "\uD83D\uDCCA" },
  { title: "Deduction Optimization", description: "Find unused deduction capacity.", label: "Efficiency", to: "/optimize", icon: "\uD83E\uDDE0" },
  { title: "Goal Planning", description: "Work backward from target tax.", label: "Planning", to: "/goal", icon: "\uD83C\uDFAF" },
  { title: "Salary (HRA)", description: "Calculate HRA exemption and taxable HRA.", label: "Salary", to: "/salary", icon: "\uD83C\uDFE2" },
  { title: "Capital Gains", description: "Evaluate STCG/LTCG tax for equity gains.", label: "Returns", to: "/capital-gains", icon: "\uD83D\uDCC8" },
];

const FALLBACK_CHART_DATA = [
  { deduction: 0, tax: 150000 },
  { deduction: 50000, tax: 140000 },
  { deduction: 100000, tax: 130000 },
  { deduction: 150000, tax: 120000 },
  { deduction: 200000, tax: 110000 },
];

const DEFAULT_DEDUCTIONS = {
  "80C": 0,
  "80D": 0,
  nps: 0,
};
const DEFAULT_INCOME = 1200000;
const DEFAULT_DASHBOARD_DEDUCTIONS = { "80C": 150000, "80D": 0, nps: 0 };

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeDeductions(values = {}) {
  return {
    "80C": toSafeNumber(values["80C"] ?? values.section80C),
    "80D": toSafeNumber(values["80D"] ?? values.section80D),
    nps: toSafeNumber(values.nps),
  };
}

function getTotalDeductions(deductions = DEFAULT_DEDUCTIONS) {
  return toSafeNumber(deductions["80C"]) + toSafeNumber(deductions["80D"]) + toSafeNumber(deductions.nps);
}

function getResponseData(response) {
  return response?.data?.data || {};
}

function buildDeductionPoints(totalDeduction) {
  const safeTotal = toSafeNumber(totalDeduction);
  const maxValue = Math.max(200000, safeTotal);
  const stepCount = 4;
  const points = Array.from({ length: stepCount + 1 }, (_, index) =>
    Math.round((maxValue * index) / stepCount)
  );

  if (safeTotal > 0 && !points.includes(safeTotal)) {
    points.push(safeTotal);
  }

  return Array.from(new Set(points)).sort((a, b) => a - b);
}

function DashboardPage() {
  const [income, setIncome] = useState(() => {
    const stored = getStoredTaxInputs();
    return toSafeNumber(stored?.income) || DEFAULT_INCOME;
  });
  const [deductions, setDeductions] = useState(() => {
    const stored = getStoredTaxInputs();
    if (stored?.deductions) {
      return normalizeDeductions(stored.deductions);
    }

    return DEFAULT_DASHBOARD_DEDUCTIONS;
  });
  const [summary, setSummary] = useState({ tax: 150000, savings: 0 });
  const [bestStrategy, setBestStrategy] = useState("Optimize deductions across Section 80C, 80D, and NPS.");
  const [chartData, setChartData] = useState(FALLBACK_CHART_DATA);
  const [loading, setLoading] = useState(true);
  const [calculationError, setCalculationError] = useState("");

  const runTaxAnalysis = async (nextIncome, nextDeductions, totalDeductionsInput) => {
    const safeIncome = toSafeNumber(nextIncome);
    const safeDeductions = normalizeDeductions(nextDeductions);
    const totalDeductions = Number.isFinite(Number(totalDeductionsInput))
      ? Math.max(0, Number(totalDeductionsInput))
      : getTotalDeductions(safeDeductions);

    setIncome(safeIncome);
    setDeductions(safeDeductions);
    setStoredTaxInputs({
      income: safeIncome,
      deductions: safeDeductions,
      totalDeductions,
      updatedAt: new Date().toISOString(),
    });
    setLoading(true);
    setCalculationError("");

    try {
      const taxResponse = await calculateTax({
        income: safeIncome,
        deductions: totalDeductions,
      });

      const taxData = getResponseData(taxResponse);
      const oldTax = toSafeNumber(taxData.oldTax);
      const newTax = toSafeNumber(taxData.newTax);
      const savings = Math.max(0, oldTax - newTax);

      setSummary({
        tax: newTax,
        savings,
      });

      setBestStrategy(
        `Use deductions up to Rs ${new Intl.NumberFormat("en-IN").format(totalDeductions)} for best tax outcome.`
      );

      const deductionPoints = buildDeductionPoints(totalDeductions);
      const chartResponses = await Promise.all(
        deductionPoints.map(async (point) => {
          const pointResponse = await calculateTax({
            income: safeIncome,
            deductions: point,
          });
          const pointTaxData = getResponseData(pointResponse);

          return {
            deduction: point,
            tax: toSafeNumber(pointTaxData.oldTax ?? pointTaxData.newTax),
          };
        })
      );

      setChartData(chartResponses);
    } catch (error) {
      setSummary({ tax: 150000, savings: 40000 });
      setBestStrategy("Allocate deductions evenly across 80C, 80D, and NPS to reduce tax.");
      setChartData(FALLBACK_CHART_DATA);
      setCalculationError("Could not update dashboard right now. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getStoredTaxInputs();
    const initialIncome = toSafeNumber(stored?.income) || DEFAULT_INCOME;
    const initialDeductions = stored?.deductions
      ? normalizeDeductions(stored.deductions)
      : DEFAULT_DASHBOARD_DEDUCTIONS;
    const initialTotalDeductions = Number.isFinite(Number(stored?.totalDeductions))
      ? Math.max(0, Number(stored.totalDeductions))
      : undefined;

    runTaxAnalysis(initialIncome, initialDeductions, initialTotalDeductions).catch(() => {});
  }, []);

  const chartSeries = useMemo(() => chartData, [chartData]);

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Track your tax position, uncover savings, and jump into actionable tools."
      />
      <Insights
        estimatedTax={summary.tax}
        potentialSavings={summary.savings}
        bestStrategy={bestStrategy}
      />
      {calculationError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {calculationError}
        </p>
      ) : null}
      <TaxChart data={chartSeries} loading={loading} />
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-md">
        {"\uD83D\uDCA1"} Increasing deductions can reduce your tax significantly depending on your regime.
      </p>
      <MagicBento
        items={features}
        textAutoHide
        enableStars
        enableSpotlight
        enableBorderGlow
        enableTilt
        enableMagnetism
        clickEffect
        spotlightRadius={300}
        particleCount={12}
        glowColor="193, 38, 201"
      />
      <PdfUpload
        isCalculating={loading}
        onApplyExtractedData={runTaxAnalysis}
      />
    </section>
  );
}

export default DashboardPage;


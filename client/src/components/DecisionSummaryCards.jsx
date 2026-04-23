import ResultCard from "./ResultCard";
import { formatCurrency } from "../utils/format";

function DecisionSummaryCards({ currentTax, optimizedTax, savings }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <ResultCard
        title="Current Tax"
        value={formatCurrency(currentTax)}
        hint="Before strategy optimization"
      />
      <ResultCard
        title="Final Tax"
        value={formatCurrency(optimizedTax)}
        hint="After recommendation"
        tone="blue"
      />
      <ResultCard
        title="Savings"
        value={formatCurrency(savings)}
        hint="Estimated annual reduction"
        tone="emerald"
      />
    </div>
  );
}

export default DecisionSummaryCards;

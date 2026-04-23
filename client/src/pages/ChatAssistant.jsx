import { useEffect, useMemo, useRef, useState } from "react";
import { chatAnalyze, generateTaxReportPdf } from "../api/taxApi";
import PageHeader from "../components/PageHeader";

const INITIAL_CONTEXT = {
  income: null,
  deductions: {
    section80C: 0,
    section80D: 0,
    nps: 0,
  },
};

const INITIAL_MESSAGE = {
  role: "assistant",
  content: "Hi! Tell me about your income and investments, and I'll analyze your tax.",
};

const SUGGESTIONS = [
  "I earn 12L with no investments",
  "I invested 1.5L in 80C",
  "Compare old vs new regime",
];

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function mergeContext(previousContext, parsed) {
  return {
    income: parsed?.income || previousContext.income,
    deductions: {
      section80C:
        parsed?.deductions?.section80C ?? previousContext.deductions.section80C,
      section80D:
        parsed?.deductions?.section80D ?? previousContext.deductions.section80D,
      nps: parsed?.deductions?.nps ?? previousContext.deductions.nps,
    },
  };
}

function formatAssistantReply(parsed, result, explanation) {
  const income = toSafeNumber(parsed?.income);
  const regime = result?.regime || "New";
  const finalTax = toSafeNumber(result?.finalTax);
  const reasoning =
    explanation?.reasoning || "Based on your profile, this regime is currently the better fit.";
  const suggestion =
    explanation?.suggestion ||
    "Review your deduction profile before making additional tax-saving investments.";
  const insights = Array.isArray(explanation?.insights) ? explanation.insights : [];
  const insightLines =
    insights.length > 0
      ? insights.map((insight) => `- ${insight}`).join("\n")
      : "- No additional insights available for this input.";

  return [
    "Tax Summary",
    "",
    `Income: Rs ${income.toLocaleString("en-IN")}`,
    `Regime: ${regime}`,
    `Final Tax: Rs ${finalTax.toLocaleString("en-IN")}`,
    "",
    "Why?",
    reasoning,
    "",
    "What should you do?",
    suggestion,
    "",
    "Insights:",
    insightLines,
  ].join("\n");
}

function getRoiTextClass(roiValue) {
  const roi = Number(roiValue);

  if (roi > 0.2) {
    return "text-emerald-700";
  }

  if (roi >= 0.1) {
    return "text-amber-700";
  }

  return "text-slate-600";
}

function ChatAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [context, setContext] = useState(INITIAL_CONTEXT);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isAnalyzing,
    [input, isAnalyzing]
  );

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const resetConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setContext(INITIAL_CONTEXT);
    setLatestAnalysis(null);
    setInput("");
    setError("");
  };

  const downloadReport = async () => {
    if (!latestAnalysis || isAnalyzing) {
      return;
    }

    try {
      const res = await generateTaxReportPdf(latestAnalysis);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tax-report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Could not download tax report right now. Please try again.");
    }
  };

  const handleSend = async (forcedText) => {
    const rawInput = typeof forcedText === "string" ? forcedText : input;
    const trimmed = rawInput.trim();

    if (!trimmed || isAnalyzing) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError("");
    setIsAnalyzing(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Analyzing your tax..." },
    ]);

    try {
      const res = await chatAnalyze({
        text: trimmed,
        context,
      });

      if (!res?.data?.success) {
        throw new Error("Parse failed");
      }

      const {
        parsed,
        result,
        explanation,
        changes = [],
        nextQuestion = null,
        advice = [],
        context: serverContext,
      } =
        res.data.data || {};

      const updatedContext = mergeContext(context, parsed);
      setContext(serverContext || updatedContext);

      const formattedMessage = result
        ? formatAssistantReply(parsed, result, explanation)
        : "Got it. I have updated your profile context.";

      if (result) {
        setLatestAnalysis({
          parsed: {
            income: parsed?.income,
            deductions: parsed?.deductions || {},
          },
          result,
          explanation,
          advice,
        });
      }

      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            role: "assistant",
            content: formattedMessage,
            changes,
            nextQuestion,
            advice,
          },
        ];
      });
    } catch (requestError) {
      setMessages((prev) => {
        const withoutLoading = prev.slice(0, -1);
        return [
          ...withoutLoading,
          {
            role: "assistant",
            content:
              "I couldn't understand fully. Try: 'I earn 10 lakh and invested 1 lakh in 80C'",
          },
        ];
      });

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Could not analyze this prompt."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await handleSend();
  };

  return (
    <section className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Tax Chat Assistant"
        description="Type your income and investment details naturally, and get advisor-style tax analysis."
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Profile
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Income: Rs {toSafeNumber(context.income).toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-slate-700">
              80C: Rs {toSafeNumber(context.deductions.section80C).toLocaleString("en-IN")} | 80D: Rs{" "}
              {toSafeNumber(context.deductions.section80D).toLocaleString("en-IN")} | NPS: Rs{" "}
              {toSafeNumber(context.deductions.nps).toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={resetConversation}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Reset Conversation
          </button>
          <button
            type="button"
            onClick={downloadReport}
            disabled={!latestAnalysis || isAnalyzing}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            📄 Download Tax Report
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-md">
        <div
          ref={listRef}
          className="h-[62vh] space-y-3 overflow-y-auto rounded-t-2xl bg-slate-50 p-4"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <article
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <p>{message.content}</p>

                {message.role === "assistant" &&
                Array.isArray(message.changes) &&
                message.changes.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                    <p className="font-semibold">🔄 Updated Profile</p>
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {message.changes.map((change, changeIndex) => (
                        <li key={`${change.field}-${changeIndex}`} className="list-disc">
                          {change.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {message.role === "assistant" && message.nextQuestion ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm font-semibold text-amber-900">
                    💡 Next Step: {message.nextQuestion}
                  </div>
                ) : null}

                {message.role === "assistant" &&
                Array.isArray(message.advice) &&
                message.advice.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-yellow-50 p-2 text-xs text-amber-900">
                    <p className="font-semibold">⚠️ Opportunities to Save Tax</p>
                    <ul className="mt-1 space-y-1 pl-4">
                      {message.advice.slice(0, 3).map((item, adviceIndex) => {
                        const savings = toSafeNumber(item.savings);
                        const roi = Number(item.roi) || 0;

                        return (
                          <li key={`${item.type}-${adviceIndex}`} className="list-disc">
                            <p>{item.message}</p>
                            <p>→ Save approx ₹{savings.toLocaleString("en-IN")}</p>
                            <p className={getRoiTextClass(roi)}>
                              → ROI: {(roi * 100).toFixed(1)}%
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : message.role === "assistant" && Array.isArray(message.advice) ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-800">
                    ✅ You are already utilizing deductions efficiently.
                  </div>
                ) : null}
              </article>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3 border-t border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleSend(suggestion)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type something like: I earn 12 lakh and invested 1.5 lakh in ELSS"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}

export default ChatAssistant;

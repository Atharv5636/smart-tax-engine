import { useCallback, useEffect, useState } from "react";
import { fetchRecentUploadedPdfs, uploadPdfDocument } from "../api/taxApi";
import { getStoredPdfExtraction, setStoredPdfExtraction } from "../utils/persistedTaxState";

function formatCurrency(value) {
  if (value === null || value === undefined) {
    return "Not found";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "Not found";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

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

function formatUploadTime(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(sizeBytes) {
  const size = Number(sizeBytes);
  if (!Number.isFinite(size) || size < 0) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function PdfUpload({ onApplyExtractedData, isCalculating = false }) {
  const persistedPdfData = getStoredPdfExtraction();
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(persistedPdfData?.result || null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(
    persistedPdfData?.status || { extracted: false, applied: false }
  );
  const [lastFileName, setLastFileName] = useState(persistedPdfData?.fileName || "");
  const [recentUploads, setRecentUploads] = useState([]);
  const [recentUploadsLoading, setRecentUploadsLoading] = useState(true);

  const loadRecentUploads = useCallback(async () => {
    try {
      setRecentUploadsLoading(true);
      const response = await fetchRecentUploadedPdfs();
      const nextUploads = Array.isArray(response?.data?.data) ? response.data.data : [];
      setRecentUploads(nextUploads);
    } catch {
      setRecentUploads([]);
    } finally {
      setRecentUploadsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentUploads();
  }, [loadRecentUploads]);

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setResult(null);
    setError("");
    setStatus({ extracted: false, applied: false });
    setStoredPdfExtraction(null);

    if (!file) {
      setSelectedFile(null);
      setLastFileName("");
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setSelectedFile(null);
      setLastFileName("");
      setError("Please select a PDF file.");
      return;
    }

    setSelectedFile(file);
    setLastFileName(file.name);
  };

  const applyDataToDashboard = async (extractedData) => {
    if (!onApplyExtractedData) {
      setStatus((previous) => ({ ...previous, applied: true }));
      return;
    }

    const safeIncome = toSafeNumber(extractedData?.income);
    const safeDeductions = normalizeDeductions(extractedData?.deductions || {});

    await onApplyExtractedData(safeIncome, safeDeductions);
    const nextStatus = { extracted: true, applied: true };
    setStatus(nextStatus);
    setStoredPdfExtraction({
      result: extractedData,
      status: nextStatus,
      fileName: lastFileName,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file before uploading.");
      return;
    }

    setIsUploading(true);
    setError("");
    setResult(null);
    setStatus({ extracted: false, applied: false });

    try {
      const response = await uploadPdfDocument(selectedFile);
      const extractedData = response?.data?.data || {};
      const safePayload = {
        ...extractedData,
        income: toSafeNumber(extractedData?.income),
        deductions: normalizeDeductions(extractedData?.deductions || {}),
      };

      setResult(safePayload);
      const extractedStatus = { extracted: true, applied: false };
      setStatus(extractedStatus);
      setStoredPdfExtraction({
        result: safePayload,
        status: extractedStatus,
        fileName: selectedFile?.name || lastFileName,
        updatedAt: new Date().toISOString(),
      });
      await loadRecentUploads();
      await applyDataToDashboard(safePayload);
    } catch (uploadError) {
      setError("Upload failed. Please try again with a valid PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualApply = async () => {
    if (!result) {
      return;
    }

    setError("");
    setStatus((previous) => ({ ...previous, applied: false }));

    try {
      await applyDataToDashboard(result);
    } catch {
      setError("Data was extracted, but dashboard update failed. Please try again.");
    }
  };

  const isBusy = isUploading || isCalculating;

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-b from-[#0d0d17]/95 to-[#06070f]/95 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Document Ingestion</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-100 sm:text-3xl">Upload Form 16 / AIS PDF</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            Upload once to auto-extract income, salary, deductions, and tax deducted values.
          </p>
        </div>
        <span className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Auto Extraction
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-violet-400/25 bg-black/20 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-xl border border-indigo-400/40 bg-[#080a14] p-2.5 text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-violet-500 file:to-indigo-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:from-violet-400 hover:file:to-indigo-400"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={isBusy}
            className="inline-flex min-w-[132px] items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Uploading..." : isCalculating ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          File selection resets on refresh due to browser security. We persist extracted values below.
        </p>
        {lastFileName ? (
          <p className="mt-2 text-sm text-slate-200">
            Last uploaded file: <span className="font-semibold text-cyan-200">{lastFileName}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {status.extracted ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-200">
            ✓ Form 16 processed successfully
          </p>
        ) : null}
        {status.applied ? (
          <p className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-200">
            ✓ Data applied to dashboard
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-violet-400/25 bg-[#070a14]/85 p-4">
        <h3 className="text-lg font-semibold text-slate-100 sm:text-xl">Recent uploaded files</h3>
        {recentUploadsLoading ? (
          <p className="mt-2 text-sm text-slate-400">Loading recent uploads...</p>
        ) : recentUploads.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No uploaded files found yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {recentUploads.map((file) => (
              <li
                key={`${file.name}-${file.uploadedAt}`}
                className="rounded-xl border border-slate-700/70 bg-black/25 px-4 py-3"
              >
                <p className="font-semibold text-slate-100">{file.displayName || file.name}</p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(file.sizeBytes)} | {formatUploadTime(file.uploadedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {result && (
        <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-900/30 to-[#09121a] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Output</p>
              <h3 className="mt-1 text-2xl font-semibold text-emerald-100">Extracted Data</h3>
            </div>
            <button
              type="button"
              onClick={handleManualApply}
              disabled={isCalculating}
              className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCalculating ? "Applying..." : "Start Analysis"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Income</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatCurrency(result.income)}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Gross Salary</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">
                {formatCurrency(result.grossSalary ?? result.salary)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">HRA</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatCurrency(result.hra)}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Tax Deducted</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatCurrency(result.taxDeducted)}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Deduction 80C</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatCurrency(result?.deductions?.["80C"])}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Deduction 80D</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatCurrency(result?.deductions?.["80D"])}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-[#050b12] p-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">Deduction NPS</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-300">{formatCurrency(result?.deductions?.nps)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PdfUpload;

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const HEADER_TOP = 30;
const FOOTER_TOP = 805;
const CONTENT_TOP = 100;
const CONTENT_BOTTOM = 760;

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return `₹${toSafeNumber(value).toLocaleString("en-IN")}`;
}

function addHeader(doc, generatedOn, logoPath) {
  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, HEADER_TOP, { width: 50 });
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#111827")
    .text("Smart Tax Advisor", 320, HEADER_TOP + 10, {
      width: 225,
      align: "right",
    });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#6b7280")
    .text(`Generated on: ${generatedOn}`, 50, HEADER_TOP + 54);

  doc
    .moveTo(50, 80)
    .lineTo(PAGE_WIDTH - 45, 80)
    .strokeColor("#d1d5db")
    .lineWidth(1)
    .stroke();

  doc.fillColor("#111827");
  doc.y = CONTENT_TOP;
}

function addFooter(doc, pageNumber) {
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#9ca3af")
    .text(`Page ${pageNumber}`, 50, FOOTER_TOP, {
      width: PAGE_WIDTH - 100,
      align: "center",
    });
  doc.fillColor("#111827");
}

function ensureSpace(doc, heightNeeded, generatedOn, logoPath) {
  if (doc.y + heightNeeded <= CONTENT_BOTTOM) {
    return;
  }

  addFooter(doc, doc.page.pageNumber);
  doc.addPage();
  addHeader(doc, generatedOn, logoPath);
}

function sectionTitle(doc, title, generatedOn, logoPath) {
  ensureSpace(doc, 34, generatedOn, logoPath);
  doc.moveDown(0.4);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#374151")
    .text(title, { underline: true });
  doc.moveDown(0.3);
  doc.fillColor("#111827");
}

function drawKeyValue(doc, label, value, generatedOn, logoPath) {
  ensureSpace(doc, 22, generatedOn, logoPath);
  doc.font("Helvetica-Bold").fontSize(11).text(`${label}: `, { continued: true });
  doc.font("Helvetica").fontSize(11).text(String(value));
}

function drawRecommendation(doc, item, index, generatedOn, logoPath) {
  ensureSpace(doc, 52, generatedOn, logoPath);
  const savings = formatCurrency(item?.savings);
  const roi = `${(toSafeNumber(item?.roi) * 100).toFixed(1)}%`;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#111827")
    .text(`• ${index + 1}. ${item?.message || "Recommendation"}`);
  doc.font("Helvetica").fontSize(11).fillColor("#111827").text(`  Save: ${savings}`);
  doc.font("Helvetica").fontSize(11).fillColor("#111827").text(`  ROI: ${roi}`);
  doc.moveDown(0.4);
}

function generateTaxReport(data, res) {
  const parsed = data?.parsed || {};
  const deductions = parsed?.deductions || {};
  const result = data?.result || {};
  const explanation = data?.explanation || {};
  const advice = Array.isArray(data?.advice) ? data.advice : [];
  const generatedOn = new Date().toLocaleString("en-IN");
  const logoPath = path.join(process.cwd(), "assets", "logo.png");

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    bufferPages: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=tax-report.pdf");

  doc.pipe(res);
  addHeader(doc, generatedOn, logoPath);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#111827")
    .text("Tax Analysis Report");
  doc.moveDown(0.6);

  // Key takeaway summary box
  ensureSpace(doc, 95, generatedOn, logoPath);
  const boxTop = doc.y;
  doc
    .roundedRect(50, boxTop, PAGE_WIDTH - 95, 78, 8)
    .fillAndStroke("#eef6ff", "#bfd7ff");
  doc.fillColor("#0f172a");
  doc.font("Helvetica-Bold").fontSize(12).text("Key Takeaway", 62, boxTop + 10);
  doc.font("Helvetica").fontSize(11).text(`Best Regime: ${result?.regime || "N/A"}`, 62, boxTop + 30);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`Total Tax: ${formatCurrency(result?.finalTax)}`, 250, boxTop + 30);
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(`Top Recommendation: ${advice[0]?.message || "Maintain current optimized profile."}`, 62, boxTop + 48, {
      width: PAGE_WIDTH - 130,
    });
  doc.y = boxTop + 90;
  doc.fillColor("#111827");

  sectionTitle(doc, "User Profile", generatedOn, logoPath);
  drawKeyValue(doc, "Income", formatCurrency(parsed?.income), generatedOn, logoPath);
  drawKeyValue(doc, "80C", formatCurrency(deductions?.section80C), generatedOn, logoPath);
  drawKeyValue(doc, "80D", formatCurrency(deductions?.section80D), generatedOn, logoPath);
  drawKeyValue(doc, "NPS", formatCurrency(deductions?.nps), generatedOn, logoPath);

  sectionTitle(doc, "Tax Summary", generatedOn, logoPath);
  drawKeyValue(doc, "Regime", result?.regime || "N/A", generatedOn, logoPath);
  drawKeyValue(doc, "Final Tax", formatCurrency(result?.finalTax), generatedOn, logoPath);
  drawKeyValue(doc, "Old Tax", formatCurrency(result?.oldTax), generatedOn, logoPath);
  drawKeyValue(doc, "New Tax", formatCurrency(result?.newTax), generatedOn, logoPath);

  const taxSaved = Math.max(0, toSafeNumber(result?.oldTax) - toSafeNumber(result?.newTax));
  const higherTax = Math.max(0, toSafeNumber(result?.newTax) - toSafeNumber(result?.oldTax));
  ensureSpace(doc, 24, generatedOn, logoPath);

  if (taxSaved > 0) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("green").text(`Savings: ${formatCurrency(taxSaved)}`);
  } else if (higherTax > 0) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("red").text(`Higher Tax Difference: ${formatCurrency(higherTax)}`);
  }
  doc.fillColor("#111827");

  sectionTitle(doc, "Explanation", generatedOn, logoPath);
  drawKeyValue(doc, "Summary", explanation?.summary || "N/A", generatedOn, logoPath);
  drawKeyValue(doc, "Reasoning", explanation?.reasoning || "N/A", generatedOn, logoPath);
  drawKeyValue(doc, "Suggestion", explanation?.suggestion || "N/A", generatedOn, logoPath);

  sectionTitle(doc, "Top Recommendations", generatedOn, logoPath);
  if (advice.length === 0) {
    doc.font("Helvetica").fontSize(11).text("You are already utilizing deductions efficiently.");
  } else {
    advice.forEach((item, index) => drawRecommendation(doc, item, index, generatedOn, logoPath));
  }

  // Add footer for each buffered page with page number
  const pageRange = doc.bufferedPageRange();
  for (let index = 0; index < pageRange.count; index += 1) {
    doc.switchToPage(pageRange.start + index);
    addFooter(doc, index + 1);
  }

  doc.end();
}

module.exports = {
  generateTaxReport,
};

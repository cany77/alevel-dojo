import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const gradeOrder = ["A*", "A", "B", "C", "D", "E"];

export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    pages.push(text);
  }

  return pages.join("\n");
}

export function normalizeSubjectName(raw = "") {
  const value = String(raw).replace(/\s+/g, " ").trim();
  const lower = value.toLowerCase();
  if (lower.includes("computer")) return "Computer Science";
  if (lower.includes("further") && lower.includes("math")) return "Further Mathematics";
  if (lower.includes("math")) return "Mathematics";
  if (lower.includes("statistic")) return "Statistics";
  if (lower.includes("mechanic")) return "Mechanics";
  if (lower.includes("physic")) return "Physics";
  if (lower.includes("chem")) return "Chemistry";
  if (lower.includes("bio")) return "Biology";
  if (lower.includes("psych")) return "Psychology";
  return value;
}

export function normalizeUnitName(raw = "") {
  const value = String(raw).replace(/\s+/g, " ").trim();
  const lower = value.toLowerCase();
  const number = value.match(/\b(\d+)\b/)?.[1];
  if (lower.includes("further pure") || /^fp\s*\d/i.test(value)) return `Further Pure ${number || value.replace(/\D/g, "") || ""}`.trim();
  if (lower.includes("pure") || /^p\s*\d/i.test(value)) return `Pure ${number || value.replace(/\D/g, "") || ""}`.trim();
  if (lower.includes("statistic") || /^s\s*\d/i.test(value)) return `Statistics ${number || value.replace(/\D/g, "") || ""}`.trim();
  if (lower.includes("mechanic") || /^m\s*\d/i.test(value)) return `Mechanics ${number || value.replace(/\D/g, "") || ""}`.trim();
  if (lower.includes("paper")) return `Paper ${number || ""}`.trim();
  if (lower.includes("unit")) return `Unit ${number || ""}`.trim();
  return value;
}

function parseSession(metadata = {}) {
  const session = String(metadata.session || "").trim();
  const year = Number(session.match(/\b(20\d{2})\b/)?.[1]) || new Date().getFullYear();
  const month = session.match(/\b(Jan(?:uary)?|June?|May|Nov(?:ember)?|Oct(?:ober)?)\b/i)?.[1] || "";
  const monthLabel = month.toLowerCase().startsWith("jan")
    ? "Jan"
    : month.toLowerCase().startsWith("nov") || month.toLowerCase().startsWith("oct")
      ? "Nov"
      : month
        ? "June"
        : "";

  return {
    session: session || `${monthLabel} ${year}`.trim(),
    year,
    month: monthLabel,
  };
}

function buildBoundaryMap(values = []) {
  const boundaries = {};
  gradeOrder.forEach((grade, index) => {
    const mark = Number(values[index]);
    if (Number.isFinite(mark)) boundaries[grade] = mark;
  });
  return boundaries;
}

function findSubject(line = "", fallback = "") {
  const known = [
    "Computer Science",
    "Further Mathematics",
    "Mathematics",
    "Statistics",
    "Mechanics",
    "Physics",
    "Chemistry",
    "Biology",
    "Psychology",
  ];
  const found = known.find((subject) => line.toLowerCase().includes(subject.toLowerCase()));
  return found || normalizeSubjectName(fallback || line.replace(/\d+/g, " ").trim());
}

function parseGenericRows(text, metadata, board) {
  const session = parseSession(metadata);
  const lines = text
    .split(/\n|(?=\b(?:Physics|Chemistry|Biology|Psychology|Mathematics|Further Mathematics|Statistics|Mechanics|Computer Science)\b)/i)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const numbers = line.match(/\b\d{1,3}\b/g)?.map(Number) || [];
      const maxMarkIndex = numbers.findIndex((value, index) => value >= 40 && numbers.slice(index + 1).length >= 6);
      const maxMark = maxMarkIndex >= 0 ? numbers[maxMarkIndex] : numbers[0];
      const gradeValues = maxMarkIndex >= 0 ? numbers.slice(maxMarkIndex + 1, maxMarkIndex + 7) : numbers.slice(-6);
      if (!Number.isFinite(maxMark) || gradeValues.length < 3) return null;

      const code = line.match(/\b\d{4}\/\d{1,3}\b|\b[A-Z]{1,4}\d{1,4}\/?\d*\b/)?.[0] || null;
      const unitMatch = line.match(/\b(Unit|Paper|Pure|Further Pure|Statistics|Mechanics|FP|P|S|M)\s*\d+\b/i)?.[0] || "";
      const subject = findSubject(line, metadata.subject);
      const unit = normalizeUnitName(unitMatch || metadata.unit || metadata.paper || "");
      const boundaries = buildBoundaryMap(gradeValues);
      const confidence = Object.keys(boundaries).length >= 5 && maxMark >= Math.max(...Object.values(boundaries)) ? "high" : "low";

      return normalizeGradeBoundaryRow({
        board,
        subject,
        unit,
        paper: unit,
        component_code: code,
        ...session,
        variant: line.match(/\bvariant\s*(\d+)\b/i)?.[1] || null,
        max_mark: maxMark,
        boundaries,
        source_file: metadata.sourceFile || "",
        source_type: "pdf",
        confidence,
        raw_text: line,
      });
    })
    .filter(Boolean);
}

export function normalizeGradeBoundaryRow(row) {
  const maxMark = Number(row.max_mark ?? row.maxMark);
  return {
    board: row.board || "",
    subject: normalizeSubjectName(row.subject || ""),
    unit: normalizeUnitName(row.unit || row.paper || ""),
    paper: normalizeUnitName(row.paper || row.unit || ""),
    component_code: row.component_code || row.componentCode || null,
    session: row.session || "",
    year: Number(row.year) || null,
    month: row.month || "",
    variant: row.variant || null,
    max_mark: Number.isFinite(maxMark) ? maxMark : null,
    boundaries: row.boundaries || {},
    source_file: row.source_file || row.sourceFile || "",
    source_type: row.source_type || row.sourceType || "pdf",
    confidence: row.confidence || "low",
    raw_text: row.raw_text || row.rawText || "",
  };
}

export function parseOxfordAqaBoundaries(text, metadata = {}) {
  return parseGenericRows(text, metadata, "OxfordAQA");
}

export function parseEdexcelBoundaries(text, metadata = {}) {
  return parseGenericRows(text, metadata, "Edexcel");
}

export function parseCambridgeBoundaries(text, metadata = {}) {
  return parseGenericRows(text, metadata, "Cambridge");
}

export function parseGradeBoundaryPdf(text, metadata = {}) {
  const board = String(metadata.board || "").toLowerCase();
  if (board.includes("oxford")) return parseOxfordAqaBoundaries(text, metadata);
  if (board.includes("edexcel")) return parseEdexcelBoundaries(text, metadata);
  if (board.includes("cambridge")) return parseCambridgeBoundaries(text, metadata);
  return parseGenericRows(text, metadata, metadata.board || "");
}

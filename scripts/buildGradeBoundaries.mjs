import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const inputDirs = [
  path.join(rootDir, "public", "grade-boundaries"),
  path.join(rootDir, "public", "ums-boundaries"),
];
const outputFile = path.join(rootDir, "src", "data", "gradeBoundaries.generated.js");
const supportedExtensions = new Set([".pdf", ".html", ".htm"]);
const supportedSubjects = [
  "Physics",
  "Chemistry",
  "Biology",
  "Psychology",
  "Computer Science",
  "Mathematics",
  "Further Mathematics",
  "Statistics",
  "Mechanics",
  "Decisions",
  "Economics",
];

function normaliseSpaces(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function parseFilename(fileName) {
  const name = path.basename(fileName, path.extname(fileName));
  const fullYear = Number(name.match(/\b(20\d{2})\b/)?.[1]) || null;
  const shortYearMatch = name.match(/\b(?:jan|january|june?|nov|november)[-\s_]*(\d{2})\b/i);
  const shortYear = shortYearMatch ? 2000 + Number(shortYearMatch[1]) : null;
  const year = fullYear || shortYear || null;
  const monthRaw = name.match(/\b(Jan(?:uary)?|June?|Nov(?:ember)?)\b/i)?.[1] || "";
  const month = monthRaw.toLowerCase().startsWith("jan")
    ? "Jan"
    : monthRaw.toLowerCase().startsWith("nov")
      ? "Nov"
      : monthRaw
        ? "June"
        : "";
  const board = /cambridge/i.test(name)
    ? "Cambridge"
    : /oxfordaqa/i.test(name)
      ? "OxfordAQA"
      : /edexcel|pearson|ial-subject-grade-boundaries/i.test(name)
        ? "Edexcel"
        : "";
  const subject = /cambridge\s+cs/i.test(name) ? "Computer Science" : "";
  return {
    board,
    subject,
    month,
    year,
    session: month && year ? `${month} ${year}` : "",
  };
}

function shouldReadFile(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return supportedExtensions.has(extension) || extension === "";
}

async function extractPdfText(filePath) {
  const data = new Uint8Array(await fs.readFile(filePath));
  const doc = await pdfjs.getDocument({ data, disableFontFace: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}

async function extractHtmlText(filePath) {
  const html = await fs.readFile(filePath, "utf8");
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function normaliseSubject(raw = "") {
  const value = normaliseSpaces(raw).toLowerCase();
  if (value.includes("computer")) return "Computer Science";
  if (value.includes("further") && value.includes("math")) return "Further Mathematics";
  if (value.includes("math")) return "Mathematics";
  if (value.includes("statistic")) return "Statistics";
  if (value.includes("mechanic")) return "Mechanics";
  if (value.includes("physic")) return "Physics";
  if (value.includes("chem")) return "Chemistry";
  if (value.includes("bio")) return "Biology";
  if (value.includes("psych")) return "Psychology";
  return normaliseSpaces(raw);
}

function mapEdexcelComponent(componentCode = "", unitName = "") {
  const code = componentCode.toUpperCase();
  const unitText = unitName.toLowerCase();
  const direct = {
    WMA11: ["Mathematics", "Pure 1"],
    WMA12: ["Mathematics", "Pure 2"],
    WMA13: ["Mathematics", "Pure 3"],
    WMA14: ["Mathematics", "Pure 4"],
    WFM01: ["Further Mathematics", "Further Pure 1"],
    WFM02: ["Further Mathematics", "Further Pure 2"],
    WFM03: ["Further Mathematics", "Further Pure 3"],
    WST01: ["Statistics", "Statistics 1"],
    WST02: ["Statistics", "Statistics 2"],
    WST03: ["Statistics", "Statistics 3"],
    WME01: ["Mechanics", "Mechanics 1"],
    WME02: ["Mechanics", "Mechanics 2"],
    WME03: ["Mechanics", "Mechanics 3"],
    WDM11: ["Decisions", "Decisions 1"],
    WDM12: ["Decisions", "Decisions 2"],
    WDM01: ["Decisions", "Decisions 1"],
    WDM02: ["Decisions", "Decisions 2"],
  };
  if (direct[code]) {
    const [subject, unit] = direct[code];
    return { subject, unit };
  }

  const econMatch = code.match(/^WEC(?:0|1)?([1-4])$/) || unitText.match(/\bunit\s+([1-4])\b/);
  if (econMatch && (code.startsWith("WEC") || unitText.includes("econom"))) {
    return { subject: "Economics", unit: `Unit ${econMatch[1]}` };
  }

  const scienceMatch = unitText.match(/\bunit\s+(\d+)/) || code.match(/^W(?:BI|CH|PH)(?:0|1)([1-6])$/);
  if (code.startsWith("WBI") && scienceMatch) return { subject: "Biology", unit: `Unit ${scienceMatch[1]}` };
  if (code.startsWith("WCH") && scienceMatch) return { subject: "Chemistry", unit: `Unit ${scienceMatch[1]}` };
  if (code.startsWith("WPH") && scienceMatch) return { subject: "Physics", unit: `Unit ${scienceMatch[1]}` };

  return null;
}

function boundaryMap(values, gradeLabels) {
  return Object.fromEntries(
    gradeLabels
      .map((grade, index) => {
        const raw = values[index];
        if (raw === "-" || raw === "–" || raw === undefined) return null;
        const mark = Number(raw);
        return Number.isFinite(mark) ? [grade, mark] : null;
      })
      .filter(Boolean)
  );
}

function validateRow(row, fileName, rawText) {
  if (!row.board || !row.subject || !row.unit || !row.paper) return false;
  if (!supportedSubjects.includes(row.subject)) return false;
  if (!Number.isFinite(Number(row.max_mark)) || row.max_mark <= 0 || row.max_mark > 600) {
    console.warn(`Skipping invalid max mark in ${fileName}: ${rawText}`);
    return false;
  }
  const marks = Object.values(row.boundaries || {});
  if (!marks.length) {
    console.warn(`Skipping row without grade marks in ${fileName}: ${rawText}`);
    return false;
  }
  if (marks.some((mark) => !Number.isFinite(Number(mark)) || mark < 0 || mark > row.max_mark)) {
    console.warn(`Skipping invalid grade mark in ${fileName}: ${rawText}`);
    return false;
  }
  for (let index = 1; index < marks.length; index += 1) {
    if (Number(marks[index - 1]) < Number(marks[index])) {
      console.warn(`Skipping non-descending grade marks in ${fileName}: ${rawText}`);
      return false;
    }
  }
  return true;
}

function parseOxfordAqa(text, meta, fileName) {
  const rows = [];
  const compact = normaliseSpaces(text);
  const regex = /\b([A-Z]{2}\d{2})\s+([A-Z][A-Z ]+?)\s+UNIT\s+(\d+)\s+(\d{2,3})\s+([-\u2013]|\d{1,3})\s+([-\u2013]|\d{1,3})\s+([-\u2013]|\d{1,3})\s+([-\u2013]|\d{1,3})\s+([-\u2013]|\d{1,3})\s+([-\u2013]|\d{1,3})/g;
  let match;
  while ((match = regex.exec(compact))) {
    const [, code, rawSubject, unitNumber, maxMark, astar, a, b, c, d, e] = match;
    const subject = normaliseSubject(rawSubject);
    const unit = `Unit ${unitNumber}`;
    const row = {
      board: "OxfordAQA",
      subject,
      unit,
      paper: unit,
      component_code: code,
      session: meta.session,
      year: meta.year,
      month: meta.month,
      max_mark: Number(maxMark),
      boundaries: boundaryMap([astar, a, b, c, d, e], ["A*", "A", "B", "C", "D", "E"]),
      source_file: fileName,
    };
    if (validateRow(row, fileName, match[0])) rows.push(row);
  }
  return rows;
}

function parseCambridge(text, meta, fileName) {
  const rows = [];
  const compact = normaliseSpaces(text);
  const componentRegex = /\bComponent\s+(\d{2})\s+(\d{2,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/g;
  let match;
  while ((match = componentRegex.exec(compact))) {
    const [, component, maxMark, a, b, c, d, e] = match;
    const paperNumber = component.slice(0, 1);
    const row = {
      board: "Cambridge",
      subject: meta.subject || "Computer Science",
      unit: `Paper ${paperNumber}`,
      paper: `Component ${component}`,
      component_code: `9618/${component}`,
      variant: component.slice(1),
      session: meta.session,
      year: meta.year,
      month: meta.month,
      max_mark: Number(maxMark),
      boundaries: boundaryMap([a, b, c, d, e], ["A", "B", "C", "D", "E"]),
      source_file: fileName,
    };
    if (validateRow(row, fileName, match[0])) rows.push(row);
  }

  const optionSection = compact.split("The overall thresholds for the different grades were set as follows.")[1] || "";
  const optionRegex = /\b([A-Z]{1,2}\d?|P2|S[XYZ])\s+(\d{2,3})\s+([0-9,\s]+)\s+([-\u2013]|\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/g;
  while ((match = optionRegex.exec(optionSection))) {
    const [, option, maxMark, combination, astar, a, b, c, d, e] = match;
    const row = {
      board: "Cambridge",
      subject: meta.subject || "Computer Science",
      unit: `Option ${option}`,
      paper: `Option ${option}`,
      component_code: option,
      variant: normaliseSpaces(combination),
      session: meta.session,
      year: meta.year,
      month: meta.month,
      max_mark: Number(maxMark),
      boundaries: boundaryMap([astar, a, b, c, d, e], ["A*", "A", "B", "C", "D", "E"]),
      source_file: fileName,
    };
    if (validateRow(row, fileName, match[0])) rows.push(row);
  }

  return rows;
}

function parseEdexcel(text, meta, fileName) {
  const compact = normaliseSpaces(text);
  if (!/International\s+(?:AS|A2|A)\s+.*grade boundaries/i.test(compact) && !/Edexcel\s+International\s+AS\/A\s+Level/i.test(compact)) {
    return [];
  }

  const rows = [];
  const rowRegex = /\b(W[A-Z]{2}\d{2})\s+(.{2,180}?\S)\s+Raw\s+((?:\d{1,3}\s+){6,8})UMS\s+((?:\d{1,3}\s*){6,8})/g;
  let match;
  while ((match = rowRegex.exec(compact))) {
    const [, componentCode, unitName, rawText] = match;
    if (/\bUnit\s+\d+A\b/i.test(unitName)) continue;
    const mapping = mapEdexcelComponent(componentCode, unitName);
    if (!mapping) continue;

    const rawValues = rawText.trim().split(/\s+/).map(Number).filter(Number.isFinite);
    if (rawValues.length < 7) continue;

    const grades = rawValues.length >= 8 ? ["A*", "A", "B", "C", "D", "E", "U"] : ["A", "B", "C", "D", "E", "U"];
    const maxMark = rawValues[0];
    const boundaries = {};
    grades.forEach((grade, index) => {
      const value = rawValues[index + 1];
      if (Number.isFinite(value)) boundaries[grade] = value;
    });

    const row = {
      board: "Edexcel",
      subject: mapping.subject,
      unit: mapping.unit,
      paper: mapping.unit,
      component_code: componentCode,
      session: meta.session,
      year: meta.year,
      month: meta.month,
      max_mark: maxMark,
      boundaries,
      source_file: fileName,
    };
    if (validateRow(row, fileName, match[0])) rows.push(row);
  }
  return rows;
}

function parseRows(text, meta, fileName) {
  if (meta.board === "OxfordAQA") return parseOxfordAqa(text, meta, fileName);
  if (meta.board === "Cambridge") return parseCambridge(text, meta, fileName);
  if (meta.board === "Edexcel") return parseEdexcel(text, meta, fileName);
  console.warn(`No parser for ${fileName}`);
  return [];
}

function stableId(row) {
  return [
    row.board,
    row.subject,
    row.unit,
    row.paper,
    row.component_code,
    row.session,
    row.variant,
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
}

async function main() {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  let files = [];
  for (const inputDir of inputDirs) {
    try {
      const entries = await fs.readdir(inputDir, { withFileTypes: true });
      files.push(
        ...entries
          .filter((entry) => entry.isFile() && shouldReadFile(entry.name))
          .map((entry) => ({ inputDir, fileName: entry.name }))
      );
    } catch (error) {
      console.warn(`Could not read ${inputDir}: ${error.message}`);
    }
  }

  console.log(`Grade boundary files found: ${files.length}`);
  const rowsById = new Map();
  let edexcelBoundaryFilesFound = 0;
  let edexcelRowsParsed = 0;

  for (const { inputDir, fileName } of files) {
    const filePath = path.join(inputDir, fileName);
    const extension = path.extname(fileName).toLowerCase();
    const meta = parseFilename(fileName);
    if (!meta.board || !meta.year || !meta.month) {
      console.warn(`Skipping file with unclear metadata: ${fileName}`);
      continue;
    }

    const text = extension === ".pdf" ? await extractPdfText(filePath) : await extractHtmlText(filePath);
    const rows = parseRows(text, meta, fileName);
    if (meta.board === "Edexcel") {
      edexcelBoundaryFilesFound += 1;
      edexcelRowsParsed += rows.length;
    }
    rows.forEach((row) => rowsById.set(stableId(row), row));
    console.log(`${fileName}: ${rows.length} rows`);
  }

  const rows = [...rowsById.values()].sort((a, b) =>
    `${a.board}|${a.subject}|${a.unit}|${a.session}|${a.component_code}`.localeCompare(
      `${b.board}|${b.subject}|${b.unit}|${b.session}|${b.component_code}`
    )
  );
  const content = `// Generated by scripts/buildGradeBoundaries.mjs\n// Do not edit by hand. Add official files to public/grade-boundaries and run npm run build:boundaries.\n\nexport const gradeBoundaries = ${JSON.stringify(rows, null, 2)};\n`;
  await fs.writeFile(outputFile, content, "utf8");
  const edexcelRowsGenerated = rows.filter((row) => row.board === "Edexcel").length;
  const edexcelSubjects = [...new Set(rows.filter((row) => row.board === "Edexcel").map((row) => row.subject).filter(Boolean))].sort();
  const edexcelUnits = [...new Set(rows.filter((row) => row.board === "Edexcel").map((row) => row.unit).filter(Boolean))].sort();
  console.log(`Edexcel boundary files found: ${edexcelBoundaryFilesFound}`);
  console.log(`Edexcel grade-boundary rows parsed: ${edexcelRowsParsed}`);
  console.log(`Edexcel grade-boundary rows generated: ${edexcelRowsGenerated}`);
  console.log(`Edexcel subjects extracted: ${edexcelSubjects.length ? edexcelSubjects.join(", ") : "none"}`);
  console.log(`Edexcel units extracted: ${edexcelUnits.length ? edexcelUnits.join(", ") : "none"}`);
  console.log(`Generated ${rows.length} grade boundary rows at src/data/gradeBoundaries.generated.js`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const inputDir = path.join(rootDir, "public", "ums-boundaries");
const outputFile = path.join(rootDir, "src", "data", "umsBoundaries.generated.js");
const supportedExtensions = new Set([".pdf", ".html", ".htm"]);
const gradeLabels = ["A*", "A", "B", "C", "D", "E"];

function normaliseSpaces(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function parseFilename(fileName) {
  const name = path.basename(fileName, path.extname(fileName));
  const year = Number(name.match(/\b(20\d{2})\b/)?.[1]) || null;
  const monthRaw = name.match(/\b(Jan(?:uary)?|June?|Nov(?:ember)?)\b/i)?.[1] || "";
  const month = monthRaw.toLowerCase().startsWith("jan")
    ? "Jan"
    : monthRaw.toLowerCase().startsWith("nov")
      ? "Nov"
      : monthRaw
        ? "June"
        : "";
  const board = /oxfordaqa/i.test(name) ? "OxfordAQA" : /edexcel/i.test(name) ? "Edexcel" : /cambridge/i.test(name) ? "Cambridge" : "";
  return {
    board,
    month,
    year,
    session: month && year ? `${month} ${year}` : "",
  };
}

async function extractPdfPages(filePath) {
  const data = new Uint8Array(await fs.readFile(filePath));
  const doc = await pdfjs.getDocument({ data, disableFontFace: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages;
}

async function extractHtmlSections(filePath) {
  const html = await fs.readFile(filePath, "utf8");
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  const sections = normaliseSpaces(text)
    .split(/(?=\bUnit\s+[A-Z]{2}\d{2}:)/i)
    .map(normaliseSpaces)
    .filter(Boolean);
  return sections.length > 1 ? sections : [text];
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

function parseOxfordAqaSection(section, meta, sourceFile) {
  const compact = normaliseSpaces(section);
  const unitMatch = compact.match(/\bUnit\s+([A-Z]{2}\d{2}):\s+(.+?)\s+UNIT\s+(\d+)\b/i);
  if (!unitMatch) {
    console.warn(`Could not parse OxfordAQA UMS unit metadata in ${sourceFile}`);
    return null;
  }

  const [, componentCode, rawSubject, unitNumber] = unitMatch;
  const tableText = compact.slice(0, unitMatch.index);
  const maxMatch = compact.match(/\bMax\.?\s+(\d{1,3})\s+(\d{1,3})\b/i);
  if (!maxMatch) {
    console.warn(`Could not parse OxfordAQA UMS max marks in ${sourceFile}: ${unitMatch[0]}`);
    return null;
  }

  const umsBoundaries = {};
  const rawBoundaries = {};
  for (const grade of gradeLabels) {
    const escapedGrade = grade.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = tableText.match(new RegExp(`(?:^|\\s)${escapedGrade}\\s+(\\d{1,3})\\s+(\\d{1,3})(?=\\s|$)`));
    if (match) {
      rawBoundaries[grade] = Number(match[1]);
      umsBoundaries[grade] = Number(match[2]);
    }
  }

  if (!Object.keys(umsBoundaries).length) {
    console.warn(`Could not parse OxfordAQA UMS grade rows in ${sourceFile}: ${unitMatch[0]}`);
    return null;
  }

  const rawToUms = {};
  const pairRegex = /\b(\d{1,3})\s+(\d{1,3})\b/g;
  let pairMatch;
  while ((pairMatch = pairRegex.exec(tableText))) {
    const raw = Number(pairMatch[1]);
    const ums = Number(pairMatch[2]);
    if (Number.isFinite(raw) && Number.isFinite(ums)) {
      rawToUms[String(raw)] = ums;
    }
  }

  const maxRaw = Number(maxMatch[1]);
  const maxUMS = Number(maxMatch[2]);
  if (!Number.isFinite(maxRaw) || !Number.isFinite(maxUMS) || maxRaw <= 0 || maxUMS <= 0) {
    console.warn(`Skipping invalid OxfordAQA UMS max marks in ${sourceFile}: ${unitMatch[0]}`);
    return null;
  }
  if (!Object.keys(rawToUms).length) {
    console.warn(`Could not parse OxfordAQA raw-to-UMS rows in ${sourceFile}: ${unitMatch[0]}`);
    return null;
  }

  return {
    board: "OxfordAQA",
    subject: normaliseSubject(rawSubject),
    unit: `Unit ${unitNumber}`,
    componentCode,
    session: meta.session,
    year: meta.year,
    maxRaw,
    maxUMS,
    rawToUms,
    umsBoundaries,
    rawBoundaries,
    sourceFile,
  };
}

function parseRows(sections, meta, sourceFile) {
  if (meta.board !== "OxfordAQA") {
    console.warn(`No UMS parser yet for ${sourceFile}; skipping.`);
    return [];
  }

  return sections
    .map((section) => parseOxfordAqaSection(section, meta, sourceFile))
    .filter(Boolean);
}

function stableId(row) {
  return [row.board, row.subject, row.unit, row.componentCode, row.session, row.sourceFile]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
}

async function main() {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  let files = [];
  try {
    files = (await fs.readdir(inputDir)).filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()));
  } catch (error) {
    console.warn(`Could not read ${inputDir}: ${error.message}`);
  }

  console.log(`UMS boundary files found: ${files.length}`);
  const rowsById = new Map();

  for (const fileName of files) {
    const filePath = path.join(inputDir, fileName);
    const extension = path.extname(fileName).toLowerCase();
    const meta = parseFilename(fileName);
    if (!meta.board || !meta.year || !meta.month) {
      console.warn(`Skipping UMS file with unclear metadata: ${fileName}`);
      continue;
    }

    const sections = extension === ".pdf" ? await extractPdfPages(filePath) : await extractHtmlSections(filePath);
    const rows = parseRows(sections, meta, fileName);
    rows.forEach((row) => rowsById.set(stableId(row), row));
    console.log(`${fileName}: ${rows.length} UMS rows`);
  }

  const rows = [...rowsById.values()].sort((a, b) =>
    `${a.board}|${a.subject}|${a.unit}|${a.session}`.localeCompare(`${b.board}|${b.subject}|${b.unit}|${b.session}`)
  );
  const content = `// Generated by scripts/buildUmsBoundaries.mjs\n// Do not edit by hand. Add official files to public/ums-boundaries and run npm run build:ums.\n\nexport const umsBoundaries = ${JSON.stringify(rows, null, 2)};\n`;
  await fs.writeFile(outputFile, content, "utf8");
  console.log(`Generated ${rows.length} UMS boundary rows at src/data/umsBoundaries.generated.js`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

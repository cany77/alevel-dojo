import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const inputDir = path.join(rootDir, "public", "ums-boundaries");
const edexcelCsvDir = path.join(inputDir, "edexcel");
const outputFile = path.join(rootDir, "src", "data", "umsBoundaries.generated.js");
const edexcelSourcesFile = path.join(rootDir, "src", "data", "edexcelUmsSources.js");
const edexcelManualFile = path.join(rootDir, "src", "data", "edexcelUmsManual.js");
const supportedExtensions = new Set([".pdf", ".html", ".htm"]);
const gradeLabels = ["A*", "A", "B", "C", "D", "E"];

function normaliseSpaces(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value = "") {
  return normaliseSpaces(
    decodeHtml(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function parseFilename(fileName) {
  const name = path.basename(fileName, path.extname(fileName));
  const fullYear = Number(name.match(/\b(20\d{2})\b/)?.[1]) || null;
  const shortYear = Number(name.match(/\b(?:Jan(?:uary)?|June?|Nov(?:ember)?)[-\s]*(\d{2})\b/i)?.[1]) || null;
  const year = fullYear || (shortYear ? 2000 + shortYear : null);
  const monthRaw = name.match(/\b(Jan(?:uary)?|June?|Nov(?:ember)?)\b/i)?.[1] || "";
  const month = monthRaw.toLowerCase().startsWith("jan")
    ? "Jan"
    : monthRaw.toLowerCase().startsWith("nov")
      ? "Nov"
      : monthRaw
        ? "June"
        : "";
  const board = /oxfordaqa/i.test(name)
    ? "OxfordAQA"
    : /edexcel|pearson|ial-subject-grade-boundaries/i.test(name)
      ? "Edexcel"
      : /cambridge/i.test(name)
        ? "Cambridge"
        : "";
  return {
    board,
    month,
    year,
    session: month && year ? `${month} ${year}` : "",
  };
}

function sourceMetaFromFile(fileName) {
  const meta = parseFilename(fileName);
  const base = path.basename(fileName, path.extname(fileName)).toLowerCase();
  const isEdexcelIalSource = meta.board === "Edexcel" && /\bial\b|international[-\s]*(?:a|advanced)[-\s]*level|ial-subject-grade-boundaries/.test(base);
  const isEdexcelBoundarySource = meta.board === "Edexcel" && /grade-boundar/.test(base);
  const qualification = base.includes("pure-mathematics") || base.includes("pure mathematics")
    ? "Pure Mathematics"
    : base.includes("further")
      ? "Further Pure Mathematics"
      : base.includes("statistics")
        ? "Statistics"
        : base.includes("mechanics")
          ? "Mechanics"
          : base.includes("decision")
            ? "Decision Mathematics"
            : "";
  return {
    ...meta,
    qualification,
    qualificationFamily: isEdexcelIalSource ? "International A Level" : "",
    isEdexcelIalSource,
    isEdexcelBoundarySource,
  };
}

async function importOptionalArray(filePath, exportName) {
  try {
    const module = await import(pathToFileURL(filePath).href);
    return Array.isArray(module[exportName]) ? module[exportName] : [];
  } catch (error) {
    console.warn(`Could not load ${path.relative(rootDir, filePath)}: ${error.message}`);
    return [];
  }
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
  const text = stripHtml(html);
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
  if (value.includes("decision")) return "Decisions";
  if (value.includes("economic")) return "Economics";
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

function normalisePearsonUnit(value = "", qualification = "") {
  const text = `${value} ${qualification}`.toLowerCase();
  const codeMap = [
    [/wma11|pure\s*(?:mathematics\s*)?1|\bp1\b|pure\s*1/, "Pure 1"],
    [/wma12|pure\s*(?:mathematics\s*)?2|\bp2\b|pure\s*2/, "Pure 2"],
    [/wma13|pure\s*(?:mathematics\s*)?3|\bp3\b|pure\s*3/, "Pure 3"],
    [/wma14|pure\s*(?:mathematics\s*)?4|\bp4\b|pure\s*4/, "Pure 4"],
    [/wfm01|further\s*pure\s*1|\bfp1\b/, "Further Pure 1"],
    [/wfm02|further\s*pure\s*2|\bfp2\b/, "Further Pure 2"],
    [/wfm03|further\s*pure\s*3|\bfp3\b/, "Further Pure 3"],
    [/wst01|statistics\s*1|\bs1\b/, "Statistics 1"],
    [/wst02|statistics\s*2|\bs2\b/, "Statistics 2"],
    [/wst03|statistics\s*3|\bs3\b/, "Statistics 3"],
    [/wme01|mechanics\s*1|\bm1\b/, "Mechanics 1"],
    [/wme02|mechanics\s*2|\bm2\b/, "Mechanics 2"],
    [/wme03|mechanics\s*3|\bm3\b/, "Mechanics 3"],
    [/wdm11|decision\s*(?:mathematics\s*)?1|\bd1\b/, "Decisions 1"],
    [/wdm12|decision\s*(?:mathematics\s*)?2|\bd2\b/, "Decisions 2"],
    [/wec01|economics\s*(?:unit\s*)?1|unit\s*1/, "Unit 1"],
    [/wec02|economics\s*(?:unit\s*)?2|unit\s*2/, "Unit 2"],
    [/wec03|economics\s*(?:unit\s*)?3|unit\s*3/, "Unit 3"],
    [/wec04|economics\s*(?:unit\s*)?4|unit\s*4/, "Unit 4"],
  ];

  for (const [pattern, unit] of codeMap) {
    if (pattern.test(text)) return unit;
  }
  return "";
}

function normalisePearsonQualification(value = "", unit = "") {
  const text = `${value} ${unit}`.toLowerCase();
  if (/further\s*pure|wfm\d\d/.test(text)) return "Further Pure Mathematics";
  if (/pure\s*mathematics|wma\d\d|\bpure\s*\d/.test(text)) return "Pure Mathematics";
  if (/statistics|wst\d\d/.test(text)) return "Statistics";
  if (/mechanics|wme\d\d/.test(text)) return "Mechanics";
  if (/decision|wdm\d\d/.test(text)) return "Decision Mathematics";
  if (/economics|wec\d\d/.test(text)) return "Economics";
  if (/biology|wbi\d\d|6bi\d\d/.test(text)) return "Biology";
  if (/chemistry|wch\d\d|6ch\d\d/.test(text)) return "Chemistry";
  if (/physics|wph\d\d|6ph\d\d/.test(text)) return "Physics";
  return normaliseSpaces(value);
}

function subjectFromPearsonQualification(qualification = "") {
  const text = qualification.toLowerCase();
  if (text.includes("further pure")) return "Further Mathematics";
  if (text.includes("pure mathematics")) return "Mathematics";
  if (text.includes("statistics")) return "Statistics";
  if (text.includes("mechanics")) return "Mechanics";
  if (text.includes("decision")) return "Decisions";
  if (text.includes("economics")) return "Economics";
  if (text.includes("biology")) return "Biology";
  if (text.includes("chemistry")) return "Chemistry";
  if (text.includes("physics")) return "Physics";
  return "Mathematics";
}

function mapEdexcelComponent(componentCode = "", unitName = "") {
  const code = componentCode.toUpperCase();
  const unitText = unitName.toLowerCase();
  const direct = {
    WMA11: ["Mathematics", "Pure Mathematics", "Pure 1"],
    WMA12: ["Mathematics", "Pure Mathematics", "Pure 2"],
    WMA13: ["Mathematics", "Pure Mathematics", "Pure 3"],
    WMA14: ["Mathematics", "Pure Mathematics", "Pure 4"],
    WFM01: ["Further Mathematics", "Further Pure Mathematics", "Further Pure 1"],
    WFM02: ["Further Mathematics", "Further Pure Mathematics", "Further Pure 2"],
    WFM03: ["Further Mathematics", "Further Pure Mathematics", "Further Pure 3"],
    WST01: ["Statistics", "Statistics", "Statistics 1"],
    WST02: ["Statistics", "Statistics", "Statistics 2"],
    WST03: ["Statistics", "Statistics", "Statistics 3"],
    WME01: ["Mechanics", "Mechanics", "Mechanics 1"],
    WME02: ["Mechanics", "Mechanics", "Mechanics 2"],
    WME03: ["Mechanics", "Mechanics", "Mechanics 3"],
    WDM11: ["Decisions", "Decision Mathematics", "Decisions 1"],
    WDM12: ["Decisions", "Decision Mathematics", "Decisions 2"],
    WDM01: ["Decisions", "Decision Mathematics", "Decisions 1"],
    WDM02: ["Decisions", "Decision Mathematics", "Decisions 2"],
  };
  if (direct[code]) {
    const [subject, qualification, unit] = direct[code];
    return { subject, qualification, unit };
  }

  const econMatch = code.match(/^WEC(?:0|1)?([1-4])$/) || unitText.match(/\bunit\s+([1-4])\b/);
  if (econMatch && (code.startsWith("WEC") || unitText.includes("econom"))) {
    return { subject: "Economics", qualification: "Economics", unit: `Unit ${econMatch[1]}` };
  }

  const scienceMatch = unitText.match(/\bunit\s+(\d+)/) || code.match(/^W(?:BI|CH|PH)(?:0|1)([1-6])$/);
  if (code.startsWith("WBI") && scienceMatch) return { subject: "Biology", qualification: "Biology", unit: `Unit ${scienceMatch[1]}` };
  if (code.startsWith("WCH") && scienceMatch) return { subject: "Chemistry", qualification: "Chemistry", unit: `Unit ${scienceMatch[1]}` };
  if (code.startsWith("WPH") && scienceMatch) return { subject: "Physics", qualification: "Physics", unit: `Unit ${scienceMatch[1]}` };

  return null;
}

function interpolateRawToUms(maxRaw, maxUMS, rawBoundaries, umsBoundaries) {
  const orderedGrades = ["A*", "A", "B", "C", "D", "E"];
  const highestGradeIndex = orderedGrades.findIndex((grade, index) =>
    Number.isFinite(rawBoundaries[grade]) &&
    Number.isFinite(umsBoundaries[grade]) &&
    orderedGrades.slice(index + 1).some((nextGrade) => Number.isFinite(rawBoundaries[nextGrade]) && Number.isFinite(umsBoundaries[nextGrade]))
  );
  const highestGrade = highestGradeIndex >= 0 ? orderedGrades[highestGradeIndex] : null;
  const nextGrade = highestGrade
    ? orderedGrades.slice(highestGradeIndex + 1).find((grade) => Number.isFinite(rawBoundaries[grade]) && Number.isFinite(umsBoundaries[grade]))
    : null;
  let rawForMaxUms = maxRaw;

  if (highestGrade && nextGrade) {
    const rawGap = rawBoundaries[highestGrade] - rawBoundaries[nextGrade];
    const umsGap = umsBoundaries[highestGrade] - umsBoundaries[nextGrade];
    const extraUmsNeeded = maxUMS - umsBoundaries[highestGrade];
    if (rawGap > 0 && umsGap > 0 && extraUmsNeeded > 0) {
      rawForMaxUms = rawBoundaries[highestGrade] + (extraUmsNeeded / umsGap) * rawGap;
    }
  }
  rawForMaxUms = Math.min(maxRaw, Math.max(0, rawForMaxUms));

  const anchors = [
    { raw: 0, ums: 0 },
    ...Object.keys(rawBoundaries)
      .map((grade) => ({ raw: rawBoundaries[grade], ums: umsBoundaries[grade] }))
      .filter((point) => Number.isFinite(point.raw) && Number.isFinite(point.ums)),
    { raw: rawForMaxUms, ums: maxUMS },
  ]
    .sort((a, b) => a.raw - b.raw)
    .filter((point, index, points) => index === 0 || point.raw !== points[index - 1].raw);

  const rawToUms = {};
  for (let raw = 0; raw <= maxRaw; raw += 1) {
    if (raw >= rawForMaxUms) {
      rawToUms[String(raw)] = maxUMS;
      continue;
    }
    const high = anchors.find((point) => point.raw >= raw) || anchors[anchors.length - 1];
    const low = [...anchors].reverse().find((point) => point.raw <= raw) || anchors[0];
    const value = high.raw === low.raw
      ? high.ums
      : low.ums + ((raw - low.raw) / (high.raw - low.raw)) * (high.ums - low.ums);
    rawToUms[String(raw)] = Math.max(0, Math.min(maxUMS, Math.round(value)));
  }
  return rawToUms;
}

function parseEdexcelBoundaryText(text = "", meta = {}, sourceFile = "") {
  const compact = normaliseSpaces(text);
  if (!/International\s+(?:AS|A2|A)\s+.*grade boundaries/i.test(compact) && !/Edexcel\s+International\s+AS\/A\s+Level/i.test(compact)) {
    return [];
  }

  const rows = [];
  const rowRegex = /\b(W[A-Z]{2}\d{2})\s+(.{2,180}?\S)\s+Raw\s+((?:\d{1,3}\s+){6,8})UMS\s+((?:\d{1,3}\s*){6,8})/g;
  let match;
  while ((match = rowRegex.exec(compact))) {
    const [, componentCode, unitName, rawText, umsText] = match;
    if (/\bUnit\s+\d+A\b/i.test(unitName)) continue;
    const mapping = mapEdexcelComponent(componentCode, unitName);
    if (!mapping) continue;

    const rawValues = rawText.trim().split(/\s+/).map(Number).filter(Number.isFinite);
    const umsValues = umsText.trim().split(/\s+/).map(Number).filter(Number.isFinite);
    if (rawValues.length < 7 || umsValues.length < 7 || rawValues.length !== umsValues.length) continue;

    const grades = rawValues.length >= 8 ? ["A*", "A", "B", "C", "D", "E", "U"] : ["A", "B", "C", "D", "E", "U"];
    const maxRaw = rawValues[0];
    const maxUMS = umsValues[0];
    const rawBoundaries = {};
    const umsBoundaries = {};
    grades.forEach((grade, index) => {
      if (grade !== "U") {
        rawBoundaries[grade] = rawValues[index + 1];
        umsBoundaries[grade] = umsValues[index + 1];
      }
    });

    rows.push({
      board: "Edexcel",
      subject: mapping.subject,
      qualification: mapping.qualification,
      unit: mapping.unit,
      componentCode,
      session: meta.session,
      year: meta.year,
      maxRaw,
      maxUMS,
      rawToUms: interpolateRawToUms(maxRaw, maxUMS, rawBoundaries, umsBoundaries),
      umsBoundaries,
      rawBoundaries,
      sourceType: "edexcel-boundary-interpolation",
      sourceFile,
    });
  }

  return rows;
}

function parseCsv(text = "") {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function csvHeaderKey(value = "") {
  return normaliseSpaces(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseNumber(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function groupKeyFromCsvRow(row) {
  return [
    row.board,
    row.subject,
    row.qualification,
    row.unit,
    row.session,
  ].map((value) => normaliseSpaces(value || "").toLowerCase()).join("|");
}

function normaliseCsvGrade(value = "") {
  const grade = normaliseSpaces(value).toUpperCase().replace(/\s+/g, "");
  return gradeLabels.find((label) => label.toUpperCase() === grade) || "";
}

async function parseEdexcelCsvFile(filePath, sourceFile) {
  const text = await fs.readFile(filePath, "utf8");
  const rows = parseCsv(text);
  if (rows.length < 2) return { rows: [], rowCount: 0 };

  const headers = rows[0].map(csvHeaderKey);
  const indexOf = (...names) => names.map(csvHeaderKey).map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const indexes = {
    board: indexOf("board"),
    subject: indexOf("subject"),
    qualification: indexOf("qualification"),
    unit: indexOf("unit", "paper"),
    session: indexOf("session"),
    maxRaw: indexOf("maxRaw", "max raw"),
    maxUMS: indexOf("maxUMS", "max UMS"),
    raw: indexOf("raw", "raw mark"),
    ums: indexOf("ums", "ums mark"),
    grade: indexOf("grade"),
    umsBoundary: indexOf("umsBoundary", "ums boundary"),
  };

  const groups = new Map();
  let dataRowsRead = 0;

  for (const csvRow of rows.slice(1)) {
    const get = (name) => indexes[name] >= 0 ? csvRow[indexes[name]] : "";
    const board = normaliseSpaces(get("board") || "Edexcel");
    if (board.toLowerCase() !== "edexcel") continue;

    const qualification = normaliseSpaces(get("qualification"));
    const unit = normaliseSpaces(get("unit"));
    const subject = normaliseSpaces(get("subject") || subjectFromPearsonQualification(qualification));
    const session = normaliseSpaces(get("session"));
    if (!subject || !unit || !session) {
      console.warn(`Skipping Edexcel CSV row with missing subject/unit/session in ${sourceFile}`);
      continue;
    }

    const record = {
      board: "Edexcel",
      subject,
      qualification,
      unit,
      session,
      maxRaw: parseNumber(get("maxRaw")),
      maxUMS: parseNumber(get("maxUMS")),
      raw: parseNumber(get("raw")),
      ums: parseNumber(get("ums")),
      grade: normaliseCsvGrade(get("grade")),
      umsBoundary: parseNumber(get("umsBoundary")),
    };

    const key = groupKeyFromCsvRow(record);
    if (!groups.has(key)) {
      groups.set(key, {
        board: "Edexcel",
        subject: record.subject,
        qualification: record.qualification,
        unit: record.unit,
        session: record.session,
        maxRaw: record.maxRaw || 0,
        maxUMS: record.maxUMS || 0,
        rawToUms: {},
        gradeSamples: {},
        explicitBoundaries: {},
      });
    }

    const group = groups.get(key);
    group.maxRaw = Math.max(group.maxRaw || 0, record.maxRaw || 0, record.raw || 0);
    group.maxUMS = Math.max(group.maxUMS || 0, record.maxUMS || 0, record.ums || 0, record.umsBoundary || 0);

    if (Number.isFinite(record.raw) && Number.isFinite(record.ums)) {
      group.rawToUms[String(record.raw)] = record.ums;
      if (record.grade) {
        group.gradeSamples[record.grade] = group.gradeSamples[record.grade] || [];
        group.gradeSamples[record.grade].push(record.ums);
      }
      dataRowsRead += 1;
    }

    if (record.grade && Number.isFinite(record.umsBoundary)) {
      group.explicitBoundaries[record.grade] = record.umsBoundary;
      dataRowsRead += 1;
    }
  }

  const generatedRows = [];
  for (const group of groups.values()) {
    const umsBoundaries = { ...group.explicitBoundaries };
    for (const grade of gradeLabels) {
      if (umsBoundaries[grade] === undefined && group.gradeSamples[grade]?.length) {
        umsBoundaries[grade] = Math.min(...group.gradeSamples[grade]);
      }
    }

    if (!Object.keys(group.rawToUms).length) {
      console.warn(`Skipping Edexcel CSV unit without raw-to-UMS rows: ${group.subject} ${group.unit} ${group.session} (${sourceFile})`);
      continue;
    }
    if (!Object.keys(umsBoundaries).length) {
      console.warn(`Skipping Edexcel CSV unit without UMS grade boundaries: ${group.subject} ${group.unit} ${group.session} (${sourceFile})`);
      continue;
    }

    generatedRows.push({
      board: "Edexcel",
      subject: group.subject,
      qualification: group.qualification,
      unit: group.unit,
      session: group.session,
      year: Number(group.session.match(/\b(20\d{2})\b/)?.[1]) || null,
      maxRaw: group.maxRaw,
      maxUMS: group.maxUMS,
      rawToUms: group.rawToUms,
      umsBoundaries,
      sourceType: "manual-csv",
      sourceFile,
    });
  }

  return { rows: generatedRows, rowCount: dataRowsRead };
}

async function parseEdexcelCsvDirectory() {
  let files = [];
  try {
    files = (await fs.readdir(edexcelCsvDir)).filter((fileName) => path.extname(fileName).toLowerCase() === ".csv");
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not read ${path.relative(rootDir, edexcelCsvDir)}: ${error.message}`);
    }
  }

  const rows = [];
  let rowCount = 0;
  for (const fileName of files) {
    const parsed = await parseEdexcelCsvFile(path.join(edexcelCsvDir, fileName), fileName);
    rows.push(...parsed.rows);
    rowCount += parsed.rowCount;
    console.log(`${path.join("edexcel", fileName)}: ${parsed.rows.length} Edexcel UMS units`);
  }

  return { files, rows, rowCount };
}

function isInternationalALevelHtml(html = "", fileName = "") {
  const text = `${fileName} ${decodeHtml(html)}`;
  return /international\s+(?:a|advanced)\s+levels?/i.test(text) || /\bial\b/i.test(fileName);
}

function extractTablesFromHtml(html = "") {
  const tables = [];
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(html))) {
    const before = html.slice(Math.max(0, tableMatch.index - 900), tableMatch.index);
    const heading = stripHtml(before).split(/\s{2,}|(?=Unit\s)|(?=Pearson\s)/i).slice(-4).join(" ");
    const rows = [];
    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[0]))) {
      const cells = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[0]))) {
        cells.push(stripHtml(cellMatch[1]));
      }
      if (cells.length) rows.push(cells);
    }
    if (rows.length) tables.push({ heading, rows });
  }
  return tables;
}

function buildEdexcelRowFromRecords(records, meta, source) {
  const rawToUms = {};
  const gradeSamples = {};
  let maxRaw = 0;
  let maxUMS = 0;

  if (!meta.session || records.length < 10) return null;

  for (const record of records) {
    rawToUms[String(record.raw)] = record.ums;
    maxRaw = Math.max(maxRaw, record.raw);
    maxUMS = Math.max(maxUMS, record.ums);
    if (record.grade && gradeLabels.includes(record.grade)) {
      gradeSamples[record.grade] = gradeSamples[record.grade] || [];
      gradeSamples[record.grade].push(record.ums);
    }
  }

  const umsBoundaries = {};
  for (const grade of gradeLabels) {
    if (gradeSamples[grade]?.length) {
      umsBoundaries[grade] = Math.min(...gradeSamples[grade]);
    }
  }

  if (!maxRaw || !maxUMS || !Object.keys(rawToUms).length) return null;
  if (!Object.keys(umsBoundaries).length) {
    console.warn(`Could not extract Edexcel UMS grade boundaries for ${meta.unit || meta.qualification || source.sourceFile || source.sourceUrl}`);
    return null;
  }

  return {
    board: "Edexcel",
    subject: meta.subject || "Mathematics",
    qualification: meta.qualification || "",
    unit: meta.unit,
    session: meta.session,
    year: meta.year,
    maxRaw,
    maxUMS,
    rawToUms,
    umsBoundaries,
    sourceType: source.sourceType,
    ...(source.sourceUrl ? { sourceUrl: source.sourceUrl } : {}),
    ...(source.sourceFile ? { sourceFile: source.sourceFile } : {}),
  };
}

function parseEdexcelHtml(html, sourceMeta, source) {
  const tables = extractTablesFromHtml(html);
  const rows = [];

  for (const table of tables) {
    const headerIndex = table.rows.findIndex((row) =>
      row.some((cell) => /raw|mark/i.test(cell)) &&
      row.some((cell) => /ums|uniform/i.test(cell))
    );
    if (headerIndex === -1) continue;

    const header = table.rows[headerIndex].map((cell) => cell.toLowerCase());
    const rawIndex = header.findIndex((cell) => /raw|mark/.test(cell));
    const umsIndex = header.findIndex((cell) => /ums|uniform/.test(cell));
    const gradeIndex = header.findIndex((cell) => /grade/.test(cell));
    const unitIndex = header.findIndex((cell) => /unit|paper|component/.test(cell));
    if (rawIndex === -1 || umsIndex === -1) continue;

    const recordsByUnit = new Map();
    for (const row of table.rows.slice(headerIndex + 1)) {
      const raw = Number(String(row[rawIndex] || "").match(/\d{1,3}/)?.[0]);
      const ums = Number(String(row[umsIndex] || "").match(/\d{1,3}/)?.[0]);
      if (!Number.isFinite(raw) || !Number.isFinite(ums)) continue;

      const unitText = [row[unitIndex], table.heading, sourceMeta.qualification].filter(Boolean).join(" ");
      const unit = normalisePearsonUnit(unitText, sourceMeta.qualification);
      if (!unit) continue;
      const qualification = normalisePearsonQualification(
        [row[unitIndex], table.heading, sourceMeta.qualification].filter(Boolean).join(" "),
        unit
      );

      const gradeText = normaliseSpaces(row[gradeIndex] || "").toUpperCase().replace(/\s+/g, "");
      const grade = gradeLabels.find((label) => label.toUpperCase() === gradeText) || null;
      if (!recordsByUnit.has(unit)) recordsByUnit.set(unit, []);
      recordsByUnit.get(unit).push({ raw, ums, grade, qualification });
    }

    for (const [unit, records] of recordsByUnit) {
      const qualification = sourceMeta.qualification || records.find((record) => record.qualification)?.qualification || "";
      const row = buildEdexcelRowFromRecords(records, {
        ...sourceMeta,
        subject: sourceMeta.subject || subjectFromPearsonQualification(qualification),
        qualification,
        unit,
      }, source);
      if (row) rows.push(row);
    }
  }

  return rows;
}

function parseRows(sections, meta, sourceFile) {
  if (meta.board === "OxfordAQA") {
    return sections
      .map((section) => parseOxfordAqaSection(section, meta, sourceFile))
      .filter(Boolean);
  }

  if (meta.board === "Edexcel") {
    const html = sections.join("\n");
    if (meta.isEdexcelBoundarySource) {
      const rows = parseEdexcelBoundaryText(html, meta, sourceFile);
      return rows;
    }
    if (meta.isEdexcelIalSource || /edexcel-ial-ums/i.test(sourceFile)) {
      console.log(`Found ${sourceFile}`);
      if (isInternationalALevelHtml(html, sourceFile)) {
        console.log(`Detected qualification family: International A Level (${sourceFile})`);
      } else {
        console.warn(`Could not confirm International A Level data in ${sourceFile}; skipping non-IAL Edexcel data.`);
        return [];
      }
    }
    const rows = parseEdexcelHtml(html, meta, { sourceType: "saved-html", sourceFile });
    if ((meta.isEdexcelIalSource || /edexcel-ial-ums/i.test(sourceFile)) && rows.length === 0) {
      console.warn("Edexcel saved HTML did not contain raw-to-UMS tables. Use Playwright extraction or add manual fallback data.");
    }
    return rows;
  }

  console.warn(`No UMS parser yet for ${sourceFile}; skipping.`);
  return [];
}

async function extractPearsonHtmlWithPlaywright(source) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.warn("Playwright is not installed. Could not extract Edexcel UMS from Pearson URL. Save the page as HTML or add manual data.");
    return "";
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(source.url, { waitUntil: "networkidle", timeout: 45000 });
    await page.getByText(/all scores/i).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
    return await page.content();
  } catch (error) {
    console.warn(`Could not extract Edexcel UMS from Pearson URL. Save the page as HTML or add manual data. ${source.url} (${error.message})`);
    return "";
  } finally {
    await browser?.close().catch(() => {});
  }
}

async function extractPearsonHtmlWithFetch(source) {
  if (typeof fetch !== "function") return "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "user-agent": "A-Level Dojo UMS importer",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) {
      console.warn(`Pearson static fetch failed for ${source.url} (${response.status} ${response.statusText})`);
      return "";
    }
    const html = await response.text();
    return html;
  } catch (error) {
    console.warn(`Pearson static fetch failed for ${source.url} (${error.message})`);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function sourceToMeta(source) {
  const year = Number(String(source.examSeries || source.session || "").match(/\b(20\d{2})\b/)?.[1]) || null;
  return {
    board: "Edexcel",
    subject: source.subject || "Mathematics",
    qualification: source.qualification || "",
    session: source.session || "",
    year,
  };
}

async function parseEdexcelUrlSources(sources) {
  const rows = [];
  console.log(`Pearson Edexcel URLs attempted: ${sources.filter((source) => source?.url).length}`);
  for (const source of sources) {
    if (!source?.url) continue;
    console.log(`Attempting Pearson Edexcel URL: ${source.url}`);
    let html = await extractPearsonHtmlWithFetch(source);
    if (html) {
      console.log(`Pearson static fetch returned HTML for: ${source.url}`);
    }
    if (!html) {
      html = await extractPearsonHtmlWithPlaywright(source);
    }
    if (!html) {
      console.warn(`Pearson extraction failed or returned no HTML for: ${source.url}`);
      continue;
    }
    console.log(`Pearson extraction returned HTML for: ${source.url}`);
    const parsed = parseEdexcelHtml(html, sourceToMeta(source), {
      sourceType: "pearson-url",
      sourceUrl: source.url,
    });
    console.log(`Pearson rows parsed from URL: ${parsed.length} (${source.url})`);
    if (!parsed.length) {
      console.warn(`Could not extract Edexcel UMS from Pearson URL. Save the page as HTML or add manual data. ${source.url}`);
    }
    rows.push(...parsed);
  }
  return rows;
}

function stableId(row) {
  return [
    row.board,
    row.subject,
    row.qualification,
    row.unit,
    row.componentCode,
    row.session,
  ]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
}

function mergeRows(rowsById, rows) {
  rows.forEach((row) => {
    if (!row?.board || !row?.unit || !row?.session || !row?.rawToUms) return;
    rowsById.set(stableId(row), row);
  });
}

async function main() {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  const edexcelSources = await importOptionalArray(edexcelSourcesFile, "edexcelUmsSources");
  const edexcelManual = await importOptionalArray(edexcelManualFile, "edexcelUmsManual");
  let files = [];
  try {
    files = (await fs.readdir(inputDir)).filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()));
  } catch (error) {
    console.warn(`Could not read ${inputDir}: ${error.message}`);
  }

  console.log(`UMS boundary files found: ${files.length}`);
  console.log(`Edexcel Pearson URL sources found: ${edexcelSources.length}`);
  const rowsById = new Map();
  let oxfordAqaFilesScanned = 0;
  let oxfordAqaRowsGenerated = 0;
  let savedEdexcelFilesScanned = 0;
  let savedEdexcelRowsGenerated = 0;
  let edexcelBoundaryFilesScanned = 0;
  let edexcelBoundaryRowsGenerated = 0;

  for (const fileName of files) {
    const filePath = path.join(inputDir, fileName);
    const extension = path.extname(fileName).toLowerCase();
    const meta = sourceMetaFromFile(fileName);
    if (!meta.board || (meta.board !== "Edexcel" && (!meta.year || !meta.month))) {
      console.warn(`Skipping UMS file with unclear metadata: ${fileName}`);
      continue;
    }

    const sections = extension === ".pdf"
      ? await extractPdfPages(filePath)
      : meta.board === "Edexcel"
        ? [await fs.readFile(filePath, "utf8")]
        : await extractHtmlSections(filePath);
    const rows = parseRows(sections, meta, fileName);
    if (meta.board === "OxfordAQA") {
      oxfordAqaFilesScanned += 1;
      oxfordAqaRowsGenerated += rows.length;
    }
    if (meta.board === "Edexcel") {
      savedEdexcelFilesScanned += 1;
      savedEdexcelRowsGenerated += rows.length;
      if (meta.isEdexcelBoundarySource) {
        edexcelBoundaryFilesScanned += 1;
        edexcelBoundaryRowsGenerated += rows.length;
      }
    }
    mergeRows(rowsById, rows);
    console.log(`${fileName}: ${rows.length} UMS rows`);
  }
  console.log(`OxfordAQA files scanned: ${oxfordAqaFilesScanned}`);
  console.log(`OxfordAQA rows generated: ${oxfordAqaRowsGenerated}`);
  console.log(`Saved Pearson Edexcel HTML files scanned: ${savedEdexcelFilesScanned}`);
  console.log(`Saved Pearson Edexcel rows generated: ${savedEdexcelRowsGenerated}`);
  console.log(`Edexcel boundary files found: ${edexcelBoundaryFilesScanned}`);
  console.log(`Edexcel boundary interpolation rows generated: ${edexcelBoundaryRowsGenerated}`);

  const csvResult = await parseEdexcelCsvDirectory();
  mergeRows(rowsById, csvResult.rows);
  console.log(`Edexcel CSV files found: ${csvResult.files.length}`);
  console.log(`Edexcel CSV rows read: ${csvResult.rowCount}`);
  console.log(`Edexcel UMS units generated: ${csvResult.rows.length}`);

  if (edexcelSources.length) {
    console.log(`Pearson URL extraction skipped: ${edexcelSources.length} configured source(s). Use Edexcel boundary files, CSV, or manual fallback data instead.`);
  }
  mergeRows(rowsById, edexcelManual.map((row) => ({ ...row, sourceType: row.sourceType || "manual" })));
  if (edexcelManual.length) console.log(`Manual Edexcel UMS rows loaded: ${edexcelManual.length}`);

  const rows = [...rowsById.values()].sort((a, b) =>
    `${a.board}|${a.subject}|${a.unit}|${a.session}`.localeCompare(`${b.board}|${b.subject}|${b.unit}|${b.session}`)
  );
  const edexcelRowsGenerated = rows.filter((row) => row.board === "Edexcel").length;
  const edexcelSubjects = [...new Set(rows.filter((row) => row.board === "Edexcel").map((row) => row.subject).filter(Boolean))].sort();
  const edexcelUnits = [...new Set(rows.filter((row) => row.board === "Edexcel").map((row) => row.unit).filter(Boolean))].sort();
  const wma11Check = rows.find((row) =>
    row.board === "Edexcel" &&
    row.componentCode === "WMA11" &&
    row.unit === "Pure 1" &&
    row.session === "Jan 2026"
  ) || rows.find((row) =>
    row.board === "Edexcel" &&
    row.componentCode === "WMA11" &&
    row.unit === "Pure 1"
  );
  const content = `// Generated by scripts/buildUmsBoundaries.mjs\n// Do not edit by hand. Add official files to public/ums-boundaries, Pearson URLs to src/data/edexcelUmsSources.js, or exact manual rows to src/data/edexcelUmsManual.js, then run npm run build:ums.\n\nexport const umsBoundaries = ${JSON.stringify(rows, null, 2)};\n`;
  await fs.writeFile(outputFile, content, "utf8");
  console.log(`Edexcel rows generated: ${edexcelRowsGenerated}`);
  console.log(`Edexcel UMS units generated: ${edexcelRowsGenerated}`);
  console.log(`Edexcel subjects extracted: ${edexcelSubjects.length ? edexcelSubjects.join(", ") : "none"}`);
  console.log(`Edexcel units extracted: ${edexcelUnits.length ? edexcelUnits.join(", ") : "none"}`);
  if (wma11Check) {
    console.log(`WMA11 check (${wma11Check.session}): 70 raw = ${wma11Check.rawToUms?.["70"]} UMS`);
    console.log(`WMA11 check (${wma11Check.session}): 56 raw = ${wma11Check.rawToUms?.["56"]} UMS`);
    console.log(`WMA11 check (${wma11Check.session}): 49 raw = ${wma11Check.rawToUms?.["49"]} UMS`);
  }
  console.log(`Generated ${rows.length} UMS boundary rows at src/data/umsBoundaries.generated.js`);
  console.log(`Generated file saved to: ${path.relative(rootDir, outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const rawDir = path.join(rootDir, "src", "data", "examTimetables", "raw");
const outputFile = path.join(rootDir, "src", "data", "examDates.js");

const supportedSubjects = [
  "Further Mathematics",
  "Computer Science",
  "Mathematics",
  "Mechanics",
  "Statistics",
  "Psychology",
  "Chemistry",
  "Physics",
  "Biology",
];

const monthNumbers = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sept: "09",
  sep: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

const monthNames = {
  jan: "January",
  january: "January",
  june: "June",
  jun: "June",
  nov: "November",
  november: "November",
};

const sessionTimes = {
  morning: "09:00",
  afternoon: "13:00",
  evening: "17:00",
  am: "09:00",
  pm: "13:00",
  ev: "17:00",
};

const cambridgeQualifications = {
  AS: "AS",
  AL: "A Level",
  IG: "IGCSE",
  OL: "O Level",
  "9-1": "IGCSE",
};

function cleanText(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function detectBoard(fileName) {
  const upper = fileName.toUpperCase();
  if (upper.includes("CAMBRIDGE")) return "Cambridge";
  if (upper.includes("EDEXCEL")) return "Edexcel";
  if (upper.includes("OXFORDAQA") || upper.includes("OXFORD AQA")) return "OxfordAQA";
  return null;
}

function detectZone(fileName) {
  const match = fileName.match(/ZONE\s*(\d+)/i);
  return match ? `Zone ${match[1]}` : null;
}

function detectSession(fileName) {
  const monthMatch = fileName.match(/\b(JAN|JANUARY|JUNE|JUN|NOV|NOVEMBER)\b/i);
  const yearMatch = fileName.match(/\b(20\d{2})\b/);
  if (!monthMatch || !yearMatch) return null;
  return `${monthNames[monthMatch[1].toLowerCase()] || monthMatch[1]} ${yearMatch[1]}`;
}

function sessionYear(session) {
  return session?.match(/\b(20\d{2})\b/)?.[1] || null;
}

function isoDateFromParts(day, month, year) {
  const monthNumber = monthNumbers[String(month).toLowerCase()];
  if (!day || !monthNumber || !year) return null;
  return `${year}-${monthNumber}-${String(Number(day)).padStart(2, "0")}`;
}

function parseDateFromText(value, session) {
  const text = cleanText(value);
  const fullDate = text.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i);
  if (fullDate) return isoDateFromParts(fullDate[1], fullDate[2], fullDate[3]);

  const partialDate = text.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i);
  if (partialDate) return isoDateFromParts(partialDate[1], partialDate[2], sessionYear(session));

  return null;
}

function normalizeSubject(value = "") {
  const lower = cleanText(value).toLowerCase();
  return supportedSubjects.find((subject) => lower.includes(subject.toLowerCase())) || null;
}

function isDuration(value = "") {
  return /^(\d+h(?:\s*\d+m)?|\d+m|\d+h\s*\d{2}m)$/i.test(cleanText(value));
}

function parseDuration(value = "") {
  const text = cleanText(value);
  const hourMatch = text.match(/(\d+)\s*h/i);
  const minuteMatch = text.match(/(\d+)\s*m/i);
  if (!hourMatch && !minuteMatch) return null;

  const parts = [];
  if (hourMatch) parts.push(`${Number(hourMatch[1])}h`);
  if (minuteMatch) parts.push(`${Number(minuteMatch[1])}m`);
  return parts.join(" ");
}

function normalizeEdexcelPaper(title = "") {
  const clean = cleanText(title);
  const pure = clean.match(/\bP(\d+):\s*Pure Mathematics\s*\d+/i);
  if (pure) return `Pure ${pure[1]}`;
  const mechanics = clean.match(/\bM(\d+):\s*Mechanics\s*\d+/i);
  if (mechanics) return `Mechanics ${mechanics[1]}`;
  const statistics = clean.match(/\bS(\d+):\s*Statistics\s*\d+/i);
  if (statistics) return `Statistics ${statistics[1]}`;
  const unit = clean.match(/\bUnit\s*\d+[:\s-]*(.*)$/i);
  if (unit) return clean.replace(/\s+/g, " ");
  return clean || null;
}

function normalizeOxfordPaper(title = "", code = "") {
  const clean = cleanText(title);
  const paper = clean.match(/\bPaper\s*\d+[A-Z]?\b/i)?.[0];
  const unitFromCode = cleanText(code).match(/[A-Z]+0?(\d+)/i)?.[1];
  if (paper) return clean;
  if (unitFromCode) return `Unit ${Number(unitFromCode)} ${clean}`.trim();
  return clean || null;
}

function normalizeOxfordQualification(value = "") {
  const clean = cleanText(value).toLowerCase();
  if (clean === "a" || clean === "a-level" || clean === "a level") return "A Level";
  if (clean === "as") return "AS";
  return null;
}

function cambridgePaperFromCode(code = "") {
  const component = cleanText(code).split("/")[1];
  return component ? `Paper ${component}` : null;
}

function makeExam(context, fields) {
  const subject = normalizeSubject(fields.subject);
  if (!subject || !fields.date) return null;

  const paper = fields.paper || fields.unit || null;
  if (!paper) return null;

  return {
    id: slugify([
      context.board,
      context.zone,
      subject,
      fields.code,
      paper,
      context.session,
      fields.date,
      fields.time,
    ].filter(Boolean).join(" ")),
    board: context.board,
    zone: context.zone,
    subject,
    qualification: fields.qualification || null,
    code: fields.code || null,
    paper,
    unit: fields.unit || null,
    session: context.session,
    date: fields.date,
    time: fields.time || null,
    duration: fields.duration || null,
    source: context.source,
  };
}

function tableRows(html) {
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  return rows
    .map((row) => [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanText(cell[1])))
    .filter((cells) => cells.length >= 3);
}

function parseHtmlFile(fileName, html, context, warnings) {
  const rows = tableRows(html);
  if (rows.length === 0) {
    warnings.push(`Could not parse: ${fileName} - no HTML table rows found.`);
    return [];
  }

  const exams = rows
    .map((cells) => {
      const joined = cells.join(" | ");
      const date = parseDateFromText(joined, context.session);
      const subject = normalizeSubject(joined);
      const paper = joined.match(/\bPaper\s*\d+[A-Z]?\b/i)?.[0] || joined.match(/\bUnit\s*\d+[^|]*/i)?.[0];
      return makeExam(context, {
        subject,
        code: joined.match(/\b\d{4}(?:\/\d{1,2})?\b/)?.[0],
        paper,
        date,
        time: sessionTimes[(joined.match(/\b(Morning|Afternoon|Evening|AM|PM|EV)\b/i)?.[1] || "").toLowerCase()] || null,
        duration: parseDuration(joined),
        qualification: /A\s*Level/i.test(joined) ? "A Level" : /AS/i.test(joined) ? "AS" : null,
      });
    })
    .filter(Boolean);

  if (exams.length === 0) warnings.push(`Could not parse: ${fileName} - table rows did not match supported exam subjects.`);
  return exams;
}

async function pdfTokens(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjs.getDocument({ data, disableWorker: true }).promise;
  const tokens = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const text = cleanText(item.str);
      if (text) tokens.push(text);
    }
  }

  return tokens;
}

function parseOxfordPdf(tokens, context) {
  const exams = [];
  let currentDate = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const parsedDate = parseDateFromText(token, context.session);
    if (parsedDate) {
      currentDate = parsedDate;
      continue;
    }

    const code = token;
    const duration = tokens[index + 1];
    const title = tokens[index + 2];
    const level = tokens[index + 3];

    if (!currentDate || !isDuration(duration) || !normalizeSubject(title)) continue;

    const qualification = normalizeOxfordQualification(level);
    if (!qualification) continue;

    const exam = makeExam(context, {
      subject: title,
      code,
      paper: normalizeOxfordPaper(title, code),
      unit: normalizeOxfordPaper(title, code)?.match(/^Unit\s+\d+/i)?.[0] || null,
      date: currentDate,
      time: "08:00",
      duration: parseDuration(duration),
      qualification,
    });

    if (exam) exams.push(exam);
  }

  return exams;
}

function parseEdexcelPdf(tokens, context) {
  const exams = [];

  for (let index = 0; index < tokens.length - 5; index += 1) {
    const date = parseDateFromText(tokens[index], context.session);
    if (!date) continue;

    const code = tokens[index + 1];
    const subject = tokens[index + 2];
    const title = tokens[index + 3];
    const session = tokens[index + 4];
    const duration = tokens[index + 5];

    if (!normalizeSubject(subject) || !isDuration(duration)) continue;

    const exam = makeExam(context, {
      subject,
      code,
      paper: normalizeEdexcelPaper(title),
      unit: title.match(/\bUnit\s*\d+/i)?.[0] || null,
      date,
      time: sessionTimes[session.toLowerCase()] || null,
      duration: parseDuration(duration),
      qualification: "IAL",
    });

    if (exam) exams.push(exam);
  }

  return exams;
}

function parseCambridgePdf(tokens, context) {
  const exams = [];
  let currentDate = null;

  for (let index = 0; index < tokens.length - 4; index += 1) {
    const parsedDate = parseDateFromText(tokens[index], context.session);
    if (parsedDate) {
      currentDate = parsedDate;
      continue;
    }

    const qualificationCode = tokens[index];
    if (!currentDate || !cambridgeQualifications[qualificationCode]) continue;
    if (qualificationCode !== "AS" && qualificationCode !== "AL") continue;

    const subject = tokens[index + 1];
    const code = tokens[index + 2];
    const duration = tokens[index + 3];
    const session = tokens[index + 4];

    if (!normalizeSubject(subject) || !/^\d{4}\/\d{1,2}$/i.test(code) || !isDuration(duration)) continue;

    const exam = makeExam(context, {
      subject,
      code,
      paper: cambridgePaperFromCode(code),
      date: currentDate,
      time: sessionTimes[session.toLowerCase()] || null,
      duration: parseDuration(duration),
      qualification: cambridgeQualifications[qualificationCode],
    });

    if (exam) exams.push(exam);
  }

  return exams;
}

function uniqueExams(exams) {
  const seen = new Set();
  return exams.filter((exam) => {
    if (seen.has(exam.id)) return false;
    seen.add(exam.id);
    return true;
  });
}

async function parsePdfFile(fileName, filePath, context, warnings) {
  const tokens = await pdfTokens(filePath);
  let exams = [];

  if (context.board === "OxfordAQA") exams = parseOxfordPdf(tokens, context);
  if (context.board === "Edexcel") exams = parseEdexcelPdf(tokens, context);
  if (context.board === "Cambridge") exams = parseCambridgePdf(tokens, context);

  exams = uniqueExams(exams);
  if (exams.length === 0) warnings.push(`Could not parse: ${fileName} - no supported exam rows found in extracted PDF text.`);
  return exams;
}

function writeOutput(exams) {
  const sorted = uniqueExams(exams).sort((a, b) => {
    const dateCompare = String(a.date).localeCompare(String(b.date));
    if (dateCompare) return dateCompare;
    return String(a.time || "").localeCompare(String(b.time || ""));
  });

  const body = `// Generated by scripts/importExamTimetables.js.
// To update future exam dates:
// 1. Add official timetable HTML files to src/data/examTimetables/raw.
// 2. Run: node scripts/importExamTimetables.js
// 3. Review warnings/TODOs, then commit the updated src/data/examDates.js.

export const examDates = ${JSON.stringify(sorted, null, 2)};

export default examDates;
`;

  fs.writeFileSync(outputFile, body, "utf8");
}

async function main() {
  fs.mkdirSync(rawDir, { recursive: true });

  const warnings = [];
  const files = fs.readdirSync(rawDir).sort();
  const exams = [];

  console.log(`Found ${files.length} timetable files in ${path.relative(rootDir, rawDir)}:`);
  files.forEach((fileName) => console.log(`- ${fileName}`));

  for (const fileName of files) {
    const extension = path.extname(fileName).toLowerCase();
    const filePath = path.join(rawDir, fileName);
    const context = {
      board: detectBoard(fileName),
      zone: detectZone(fileName),
      session: detectSession(fileName),
      source: fileName,
    };

    if (!context.board || !context.session) {
      warnings.push(`Could not parse: ${fileName} - board/session could not be detected from filename.`);
      console.log(`${fileName}: parsed 0 exams`);
      continue;
    }

    let parsed = [];
    if (extension === ".html" || extension === ".htm") {
      parsed = parseHtmlFile(fileName, fs.readFileSync(filePath, "utf8"), context, warnings);
    } else if (extension === ".pdf") {
      parsed = await parsePdfFile(fileName, filePath, context, warnings);
    } else {
      warnings.push(`Could not parse: ${fileName} - unsupported file type ${extension || "extensionless"}.`);
    }

    console.log(`${fileName}: parsed ${parsed.length} exams`);
    exams.push(...parsed);
  }

  writeOutput(exams);

  console.log(`Imported ${uniqueExams(exams).length} exam rows into ${path.relative(rootDir, outputFile)}.`);
  if (warnings.length > 0) {
    console.warn("\nWarnings:");
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
}

main();

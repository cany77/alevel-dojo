import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const papersRoot = path.join(publicDir, "papers");
const outputFile = path.join(rootDir, "src", "papersData.js");
const supportedExtensions = new Set([".pdf", ".html", ".htm"]);

const edexcelSubjects = {
  decisions: "Decisions",
  economics: "Economics",
  "further-maths": "Further Mathematics",
  maths: "Mathematics",
  mechanics: "Mechanics",
  statistics: "Statistics",
};

const sessionRank = {
  Jan: 3,
  June: 2,
  Nov: 1,
  Oct: 1,
  May: 2,
  March: 2,
};

const unitOrder = [
  "Pure 1",
  "Pure 2",
  "Pure 3",
  "Pure 4",
  "Further Pure 1",
  "Further Pure 2",
  "Further Pure 3",
  "Statistics 1",
  "Statistics 2",
  "Statistics 3",
  "Mechanics 1",
  "Mechanics 2",
  "Mechanics 3",
  "Decisions 1",
  "Decisions 2",
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Unit 5",
  "Paper 1",
  "Paper 2",
  "Paper 3",
  "Paper 4",
];

function normaliseSpaces(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function niceName(text = "") {
  return normaliseSpaces(text)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeBoard(board = "") {
  const lower = board.toLowerCase();
  if (lower === "oxfordaqa") return "OxfordAQA";
  if (lower === "aqa") return "AQA";
  if (lower === "edexcel") return "Edexcel";
  if (lower === "cambridge") return "Cambridge";
  return niceName(board);
}

function normalizeSubject(subject = "") {
  const lower = subject.toLowerCase();
  if (lower === "computer-science") return "Computer Science";
  if (lower === "further-maths") return "Further Mathematics";
  if (lower === "maths") return "Mathematics";
  return edexcelSubjects[lower] || niceName(subject);
}

function normalizeQualification(qualification = "") {
  const lower = qualification.toLowerCase();
  if (lower === "as-level") return "AS Level";
  if (lower === "a-level") return "A Level";
  if (lower.includes("as level")) return "AS Level";
  if (lower.includes("a level")) return "A Level";
  return niceName(qualification);
}

async function walk(dir) {
  const results = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walk(fullPath));
    } else if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

function fileUrl(filePath) {
  const relativeFromPublic = path.relative(publicDir, filePath).replaceAll("\\", "/");
  return `/${relativeFromPublic}`;
}

function fileType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html" || extension === ".htm") return "html";
  return "pdf";
}

function parseSession(value = "") {
  const text = normaliseSpaces(value);
  const year = Number(text.match(/\b(20\d{2})\b/)?.[1]) || null;
  const monthRaw = text.match(/\b(Jan(?:uary)?|Jun(?:e)?|Nov(?:ember)?|Oct(?:ober)?|March|May)\b/i)?.[1] || "";
  const lower = monthRaw.toLowerCase();
  const month = lower.startsWith("jan")
    ? "Jan"
    : lower.startsWith("jun")
      ? "June"
      : lower.startsWith("nov") || lower.startsWith("oct")
        ? "Nov"
        : lower.startsWith("may")
          ? "May"
          : lower.startsWith("march")
            ? "March"
            : "";
  return {
    month,
    year,
    session: month && year ? `${month} ${year}` : "",
  };
}

function findSessionPart(parts) {
  for (let index = parts.length - 2; index >= 0; index -= 1) {
    const parsed = parseSession(parts[index]);
    if (parsed.month && parsed.year) return { index, ...parsed };
  }
  return null;
}

function normalizeUnit(value = "", fileName = "") {
  const text = normaliseSpaces(value || fileName);
  const lower = text.toLowerCase();
  const dMatch = lower.match(/\bd\s*([12])\b/);
  if (dMatch) return `Decisions ${dMatch[1]}`;
  const decisionsMatch = lower.match(/\bdecisions?\s*([12])\b/);
  if (decisionsMatch) return `Decisions ${decisionsMatch[1]}`;
  const furtherPureMatch = lower.match(/\bf(?:urther)?\s*p(?:ure)?\s*([123])\b/);
  if (furtherPureMatch) return `Further Pure ${furtherPureMatch[1]}`;
  const pureMatch = lower.match(/\bp(?:ure)?\s*([1-4])\b/);
  if (pureMatch) return `Pure ${pureMatch[1]}`;
  const statisticsMatch = lower.match(/\b(?:statistics|stats|s)\s*([123])\b/);
  if (statisticsMatch) return `Statistics ${statisticsMatch[1]}`;
  const mechanicsMatch = lower.match(/\b(?:mechanics|mech|m)\s*([123])\b/);
  if (mechanicsMatch) return `Mechanics ${mechanicsMatch[1]}`;
  const unitMatch = lower.match(/\bunit\s*([1-9])\b/);
  if (unitMatch) return `Unit ${unitMatch[1]}`;
  const paperMatch = lower.match(/\bpaper\s*([1-9])\b/);
  if (paperMatch) return `Paper ${paperMatch[1]}`;
  return niceName(text);
}

function getUnitOrPaper(fileName = "") {
  return normalizeUnit(fileName);
}

function parseCambridgeComponentCode(fileName = "") {
  const name = path.basename(fileName, path.extname(fileName));
  const explicitMatch = name.match(/\b(?:q|qp|ms)\s*([1-4][1-3])\b/i);
  if (explicitMatch) return explicitMatch[1];
  return name.match(/\b([1-4][1-3])\b/)?.[1] || "";
}

function cambridgePaperFromComponent(componentCode = "") {
  const paperNumber = String(componentCode)[0];
  return paperNumber ? `Paper ${paperNumber}` : "";
}

function cambridgeVariantFromComponent(componentCode = "", fallbackVariant = "") {
  const variantNumber = String(componentCode)[1] || fallbackVariant;
  return variantNumber ? `Variant ${variantNumber}` : "";
}

function isQuestion(fileName = "") {
  const name = path.basename(fileName, path.extname(fileName));
  return /\b(?:q|qp)\b/i.test(name) || /question(?:\s*paper)?/i.test(name);
}

function isMarkScheme(fileName = "") {
  const name = path.basename(fileName, path.extname(fileName));
  return /\bms\b/i.test(name) || /mark\s*scheme|markscheme/i.test(name);
}

function isExaminerReport(fileName = "") {
  const name = path.basename(fileName, path.extname(fileName));
  return /\ber\b/i.test(name) || /examiner/i.test(name);
}

function sessionSortValue(row) {
  const sessionName = String(row.session || row.month || "").split(/\s+/)[0];
  return Number(row.year || 0) * 10 + (sessionRank[sessionName] || sessionRank[row.month] || 0);
}

function unitSortValue(unit = "") {
  const index = unitOrder.findIndex((candidate) => candidate.toLowerCase() === String(unit).toLowerCase());
  return index === -1 ? 999 : index;
}

function createPastPaperGroup(groups, key, base) {
  if (!groups[key]) {
    groups[key] = {
      type: "Past Paper",
      questionPaper: "",
      markScheme: "",
      examinerReport: "",
      questionUrl: "",
      markSchemeUrl: "",
      fileType: "",
      questionFileType: "",
      markSchemeFileType: "",
      ...base,
    };
  }
  return groups[key];
}

function attachFile(group, filePath) {
  const url = fileUrl(filePath);
  const type = fileType(filePath);
  const baseName = path.basename(filePath);
  if (isQuestion(baseName)) {
    group.questionPaper = url;
    group.questionUrl = url;
    group.fileType = type;
    group.questionFileType = type;
  } else if (isMarkScheme(baseName)) {
    group.markScheme = url;
    group.markSchemeUrl = url;
    group.markSchemeFileType = type;
    if (!group.fileType) group.fileType = type;
  } else if (isExaminerReport(baseName)) {
    group.examinerReport = url;
  }
}

function processCambridge({ groups, filePath, parts, board, subject }) {
  const variantFolder = parts[3] || "";
  const sessionInfo = findSessionPart(parts);
  const qualificationFolder = parts[sessionInfo ? sessionInfo.index + 1 : 5] || "";
  const fileName = path.basename(filePath);
  const fileSession = parseSession(fileName);
  const year = fileSession.year || sessionInfo?.year || "";
  const month = fileSession.month || sessionInfo?.month || "";
  const session = fileSession.session || sessionInfo?.session || (month && year ? `${month} ${year}` : month);
  const componentCode = parseCambridgeComponentCode(fileName);
  const unit = cambridgePaperFromComponent(componentCode) || getUnitOrPaper(fileName);
  const qualification = normalizeQualification(qualificationFolder);
  const variant = cambridgeVariantFromComponent(componentCode, variantFolder);
  const key = [board, subject, qualification, session, year, componentCode || unit].join("|");
  const group = createPastPaperGroup(groups, key, {
    board,
    subject,
    variant,
    qualification,
    componentCode,
    paper: unit,
    year,
    session,
    month,
    unit,
  });
  attachFile(group, filePath);
}

function processEdexcel({ groups, filePath, parts, board, subject }) {
  const sessionInfo = findSessionPart(parts);
  if (!sessionInfo) return;
  const unitFolder = parts[sessionInfo.index - 1] || "";
  const fileName = path.basename(filePath);
  const unit = normalizeUnit(unitFolder, fileName);
  const key = [board, subject, "IAL", sessionInfo.month, sessionInfo.year, unit].join("|");
  const group = createPastPaperGroup(groups, key, {
    board,
    subject,
    qualification: "IAL",
    year: sessionInfo.year,
    month: sessionInfo.month,
    session: sessionInfo.session,
    unit,
  });
  attachFile(group, filePath);
}

function processStandard({ groups, topicTests, filePath, parts, board, subject }) {
  const qualificationFolder = parts[3] || "";
  const sectionFolder = String(parts[4] || "").toLowerCase();
  const qualification = normalizeQualification(qualificationFolder);
  const fileName = path.basename(filePath, path.extname(filePath));
  const url = fileUrl(filePath);

  if (sectionFolder === "topic-test" || sectionFolder === "topic-tests") {
    const topicFolder = parts[5] || "";
    topicTests.push({
      type: "Topic Test",
      board,
      subject,
      qualification,
      topic: niceName(topicFolder),
      title: fileName,
      pdf: url,
      fileType: fileType(filePath),
    });
    return;
  }

  const sessionInfo = findSessionPart(parts);
  if (!sessionInfo) return;
  const fileSession = parseSession(fileName);
  const session = fileSession.month || sessionInfo.month;
  const year = fileSession.year || sessionInfo.year;
  const unit = getUnitOrPaper(fileName);
  const key = [board, subject, qualification, session, year, unit].join("|");
  const group = createPastPaperGroup(groups, key, {
    board,
    subject,
    qualification,
    year,
    month: session,
    session,
    unit,
  });
  attachFile(group, filePath);
}

async function main() {
  const files = await walk(papersRoot);
  const pastPaperGroups = {};
  const topicTests = [];
  let edexcelFiles = 0;

  for (const filePath of files) {
    const relativeFromPublic = path.relative(publicDir, filePath);
    const parts = relativeFromPublic.split(path.sep);
    if (parts[0] !== "papers" || parts.length < 4) continue;

    const boardFolder = parts[1];
    const subjectFolder = parts[2];
    const board = normalizeBoard(boardFolder);
    const subject = normalizeSubject(subjectFolder);

    if (boardFolder === "cambridge" && subjectFolder === "computer-science") {
      processCambridge({ groups: pastPaperGroups, filePath, parts, board, subject });
    } else if (boardFolder === "edexcel") {
      edexcelFiles += 1;
      processEdexcel({ groups: pastPaperGroups, filePath, parts, board, subject });
    } else {
      processStandard({ groups: pastPaperGroups, topicTests, filePath, parts, board, subject });
    }
  }

  const pastPapers = Object.values(pastPaperGroups)
    .filter((paper) => paper.questionPaper || paper.markScheme)
    .sort((a, b) => {
      const subjectCompare = `${a.board}|${a.subject}`.localeCompare(`${b.board}|${b.subject}`);
      if (subjectCompare) return subjectCompare;
      const unitCompare = unitSortValue(a.unit) - unitSortValue(b.unit);
      if (unitCompare) return unitCompare;
      const sessionCompare = sessionSortValue(b) - sessionSortValue(a);
      if (sessionCompare) return sessionCompare;
      return String(a.variant || "").localeCompare(String(b.variant || ""), undefined, { numeric: true });
    });
  const allPapers = [...pastPapers, ...topicTests];
  const edexcelEntries = pastPapers.filter((paper) => paper.board === "Edexcel").length;
  const content = `export const papers = ${JSON.stringify(allPapers, null, 2)};\n`;

  await fs.writeFile(outputFile, content, "utf8");
  console.log(`Paper files found: ${files.length}`);
  console.log(`Edexcel paper files found: ${edexcelFiles}`);
  console.log(`Generated ${pastPapers.length} past papers`);
  console.log(`Generated ${edexcelEntries} Edexcel past paper entries`);
  console.log(`Generated ${topicTests.length} topic tests`);
  console.log("Saved to src/papersData.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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
  "Unit 6",
  "Paper 1",
  "Paper 1R",
  "Paper 1H",
  "Paper 1HR",
  "Paper 2",
  "Paper 2R",
  "Paper 2H",
  "Paper 2HR",
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
  if (lower === "math") return "Math";
  if (lower === "business (gcse)") return "Business";
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
  if (/\bspecimen\b/i.test(text)) {
    return { month: "Specimen", year: null, session: "Specimen" };
  }
  const year = Number(text.match(/\b(20\d{2})\b/)?.[1]) || null;
  const monthRaw = text.match(/\b(Jan(?:uary)?|Jun(?:e)?|Nov(?:ember)?|Oct(?:ober)?|March|Mar|May)\b/i)?.[1] || "";
  const lower = monthRaw.toLowerCase();
  const month = lower.startsWith("jan")
    ? "Jan"
    : lower.startsWith("jun")
      ? "June"
      : lower.startsWith("nov") || lower.startsWith("oct")
        ? "Nov"
        : lower.startsWith("may")
          ? "May"
          : lower.startsWith("mar")
            ? "March"
            : "";
  return {
    month,
    year,
    session: month === "Specimen" ? "Specimen" : month && year ? `${month} ${year}` : "",
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
  const combined = normaliseSpaces(`${value} ${fileName}`);
  const lower = text.toLowerCase();
  const combinedLower = combined.toLowerCase();
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
  const gcsePaperMatch = combinedLower.match(/\bpaper\s*([1-9])\s*(hr|h|r)?\b/);
  if (gcsePaperMatch) return `Paper ${gcsePaperMatch[1]}${(gcsePaperMatch[2] || "").toUpperCase()}`;
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
  if (/worked\s*solutions?|\bsolutions?\b/i.test(name)) return false;
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

function isGradeBoundary(fileName = "") {
  const name = path.basename(fileName, path.extname(fileName));
  return /grade\s*boundar/i.test(name);
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
  } else if (isGradeBoundary(baseName)) {
    group.gradeBoundaries = url;
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

function gcseSubjectAndQualification(parts) {
  const boardFolder = parts[2] || "";
  const subjectFolder = parts[3] || "";
  const boardKey = boardFolder.toLowerCase();
  const subjectKey = subjectFolder.toLowerCase();

  if (boardKey === "edexcel") {
    if (subjectKey === "business (gcse)") {
      return { board: "Edexcel GCSE", subject: "Business", qualification: "Edexcel GCSE" };
    }
    if (subjectKey === "english") {
      const isLiterature = parts.some((part) => /^lit$/i.test(part));
      return {
        board: "Edexcel International GCSE",
        subject: isLiterature ? "English Literature" : "English Language",
        qualification: "Edexcel International GCSE",
      };
    }
    return {
      board: "Edexcel International GCSE",
      subject: subjectKey === "math" ? "Math" : normalizeSubject(subjectFolder),
      qualification: "Edexcel International GCSE",
    };
  }

  if (boardKey === "oxford aqa") {
    return {
      board: "OxfordAQA International GCSE",
      subject: normalizeSubject(subjectFolder),
      qualification: "OxfordAQA International GCSE",
    };
  }

  if (boardKey === "cambridge") {
    return {
      board: "Cambridge IGCSE",
      subject: normalizeSubject(subjectFolder),
      qualification: "Cambridge IGCSE",
    };
  }

  return { board: normalizeBoard(boardFolder), subject: normalizeSubject(subjectFolder), qualification: "GCSE / IGCSE" };
}

function isGcsePastPaperPath(parts) {
  const lowerParts = parts.map((part) => part.toLowerCase());
  if (lowerParts.includes("topic tests") || lowerParts.includes("notes") || lowerParts.includes("spec")) return false;
  if (lowerParts.some((part) => part.includes("textbook") || part.includes("data files") || part === "grade boundaries")) return false;
  if (lowerParts.includes("past papers")) return true;
  return lowerParts[2] === "cambridge" && lowerParts[3] === "computer science" && lowerParts.includes("0478");
}

function gcseSessionInfo(parts, fileName) {
  const fileSession = parseSession(fileName);
  if (fileSession.session) return fileSession;
  const sessionPart = findSessionPart(parts);
  if (sessionPart?.session) return sessionPart;
  const specimenPart = parts.find((part) => /specimen/i.test(part));
  if (specimenPart) return { month: "Specimen", year: null, session: "Specimen" };
  const monthPart = parts.find((part) => /^(jan|january|june|nov|november|march|mar|may)$/i.test(part));
  const yearPart = parts.find((part) => /^20\d{2}$/.test(part));
  if (monthPart && yearPart) return parseSession(`${monthPart} ${yearPart}`);
  return { month: "", year: null, session: "" };
}

function gcseUnit(parts, fileName, subject) {
  const name = path.basename(fileName, path.extname(fileName));
  const fromFile = normalizeUnit(name, name);
  if (/^Paper\s+\d/i.test(fromFile)) return fromFile;

  const pastIndex = parts.findIndex((part) => /^past papers$/i.test(part));
  if (pastIndex >= 0) {
    const afterPast = parts.slice(pastIndex + 1, -1).find((part) => /paper\s*\d/i.test(part));
    if (afterPast) return normalizeUnit(afterPast, name);
  }

  if (subject === "English Language") {
    const match = name.match(/Lang\s+Paper\s*([12])\s*(R)?/i);
    if (match) return `Paper ${match[1]}${match[2] ? "R" : ""}`;
  }
  if (subject === "English Literature") {
    const match = name.match(/Lit\s+Paper\s*([12])\s*(R)?/i);
    if (match) return `Paper ${match[1]}${match[2] ? "R" : ""}`;
  }

  return fromFile;
}

function processGcseIgcse({ groups, filePath, parts, stats }) {
  if (!isGcsePastPaperPath(parts)) return;
  const fileName = path.basename(filePath);
  if (!isQuestion(fileName) && !isMarkScheme(fileName) && !isExaminerReport(fileName) && !isGradeBoundary(fileName)) return;

  const { board, subject, qualification } = gcseSubjectAndQualification(parts);
  const sessionInfo = gcseSessionInfo(parts, fileName);
  if (!sessionInfo.session) return;
  const unit = gcseUnit(parts, fileName, subject);
  if (!/^Paper\s+\d/i.test(unit)) return;

  const key = [board, subject, qualification, sessionInfo.session, sessionInfo.year || "", unit].join("|");
  const group = createPastPaperGroup(groups, key, {
    board,
    subject,
    qualification,
    category: "GCSE / IGCSE",
    level: "GCSE / IGCSE",
    year: sessionInfo.year || "",
    month: sessionInfo.month,
    session: sessionInfo.session,
    unit,
    paper: unit,
  });
  attachFile(group, filePath);
  stats.files += 1;
  stats.boards.add(board);
}
function processOxfordAqaEnglishLiterature({ groups, filePath, parts, board }) {
  const sectionFolder = parts[3] || "";
  if (!/past\s*papers/i.test(sectionFolder)) return;

  const fileNameWithExt = path.basename(filePath);
  if (!isQuestion(fileNameWithExt) && !isMarkScheme(fileNameWithExt) && !isExaminerReport(fileNameWithExt) && !isGradeBoundary(fileNameWithExt)) return;

  const fileName = path.basename(filePath, path.extname(filePath));
  const sessionFolder = parts[4] || "";
  const folderSession = parseSession(sessionFolder);
  const fileSession = parseSession(fileName);
  const sessionInfo = fileSession.session ? fileSession : folderSession;
  if (!sessionInfo.session) return;

  const unit = normalizeUnit(fileName, fileName);
  if (!/^Unit\s+[1-4]$/i.test(unit)) return;

  const qualification = /^as[-\s]*level/i.test(sectionFolder) ? "AS Level" : "A Level";
  const key = [board, "English Literature", qualification, sessionInfo.session, sessionInfo.year || "", unit].join("|");
  const group = createPastPaperGroup(groups, key, {
    board,
    subject: "English Literature",
    qualification,
    year: sessionInfo.year || "",
    month: sessionInfo.month,
    session: sessionInfo.session,
    unit,
    paper: unit,
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
  const gcseStats = { files: 0, boards: new Set() };

  for (const filePath of files) {
    const relativeFromPublic = path.relative(publicDir, filePath);
    const parts = relativeFromPublic.split(path.sep);
    if (parts[0] !== "papers" || parts.length < 4) continue;

    if (parts[1] === "gcse-igcse") {
      processGcseIgcse({ groups: pastPaperGroups, filePath, parts, stats: gcseStats });
      continue;
    }


    const paperParts = parts[1] === "a-level" ? [parts[0], ...parts.slice(2)] : parts;
    if (paperParts.length < 4) continue;

    const boardFolder = paperParts[1];
    const subjectFolder = paperParts[2];
    const board = normalizeBoard(boardFolder);
    const subject = normalizeSubject(subjectFolder);

    if (boardFolder === "oxfordaqa" && subjectFolder.toLowerCase() === "english lit") {
      processOxfordAqaEnglishLiterature({ groups: pastPaperGroups, filePath, parts: paperParts, board });
    } else if (boardFolder === "cambridge" && subjectFolder === "computer-science") {
      processCambridge({ groups: pastPaperGroups, filePath, parts: paperParts, board, subject });
    } else if (boardFolder === "edexcel") {
      edexcelFiles += 1;
      processEdexcel({ groups: pastPaperGroups, filePath, parts: paperParts, board, subject });
    } else {
      processStandard({ groups: pastPaperGroups, topicTests, filePath, parts: paperParts, board, subject });
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
  const aLevelEntries = pastPapers.filter((paper) => paper.category !== "GCSE / IGCSE").length;
  const gcseEntries = pastPapers.filter((paper) => paper.category === "GCSE / IGCSE").length;
  const unpaired = pastPapers.filter((paper) => paper.category === "GCSE / IGCSE" && (!paper.questionPaper || !paper.markScheme));
  const content = `export const papers = ${JSON.stringify(allPapers, null, 2)};\n`;

  await fs.writeFile(outputFile, content, "utf8");
  console.log(`Paper files found: ${files.length}`);
  console.log(`Edexcel paper files found: ${edexcelFiles}`);
  console.log(`Generated ${pastPapers.length} past papers`);
  console.log(`A-Level papers: ${aLevelEntries}`);
  console.log(`GCSE/IGCSE papers: ${gcseEntries}`);
  console.log(`GCSE/IGCSE boards found: ${Array.from(gcseStats.boards).sort().join(", ") || "None"}`);
  console.log(`Generated ${edexcelEntries} Edexcel A-Level past paper entries`);
  console.log(`Generated ${topicTests.length} topic tests`);
  console.log(`GCSE/IGCSE unpaired Q/MS warnings: ${unpaired.length}`);
  unpaired.slice(0, 25).forEach((paper) => {
    const missing = paper.questionPaper ? "MS" : "Q";
    console.warn(`Unpaired GCSE/IGCSE ${missing}: ${paper.board} ${paper.subject} ${paper.unit} ${paper.session}`);
  });
  if (unpaired.length > 25) console.warn(`...and ${unpaired.length - 25} more unpaired GCSE/IGCSE entries.`);
  console.log("Saved to src/papersData.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "public", "papers");
const output = path.join(__dirname, "..", "src", "papersData.js");

function walk(dir) {
  let results = [];

  if (!fs.existsSync(dir)) return results;

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (item.toLowerCase().endsWith(".pdf")) {
      results.push(fullPath);
    }
  }

  return results;
}

function niceName(text) {
  return text
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeBoard(board) {
  const lower = board.toLowerCase();

  if (lower === "oxfordaqa") return "OxfordAQA";
  if (lower === "aqa") return "AQA";
  if (lower === "edexcel") return "Edexcel";
  if (lower === "cambridge") return "Cambridge";

  return niceName(board);
}

function normalizeSubject(subject) {
  if (subject === "computer-science") return "Computer Science";
  if (subject === "further-maths") return "Further Mathematics";
  if (subject === "maths") return "Mathematics";

  return niceName(subject);
}

function normalizeQualification(qualification) {
  const lower = qualification.toLowerCase();

  if (lower === "as-level") return "AS Level";
  if (lower === "a-level") return "A Level";

  // Cambridge folder names like:
  // AS level (Paper 1 & 2)
  // A level (Paper 3 & 4)
  if (lower.includes("as level")) return "AS Level";
  if (lower.includes("a level")) return "A Level";

  return niceName(qualification);
}

function getSession(filename) {
  const match = filename.match(/Jan|June|Nov|March|May|Oct|November/i);
  if (!match) return "";

  const session = match[0].toLowerCase();

  if (session === "november") return "Nov";
  if (session === "oct") return "Oct";
  if (session === "march") return "March";
  if (session === "may") return "May";
  if (session === "jan") return "Jan";
  if (session === "june") return "June";
  if (session === "nov") return "Nov";

  return match[0];
}

function getYear(filename, fallback = "") {
  const match = filename.match(/(20\d{2})/);
  return match ? match[1] : fallback;
}

function getUnitOrPaper(filename) {
  const unitMatch = filename.match(/Unit\s*\d+/i);
  if (unitMatch) return unitMatch[0].replace(/\s+/, " ");

  const paperMatch = filename.match(/Paper\s*\d+/i);
  if (paperMatch) return paperMatch[0].replace(/\s+/, " ");

  // Cambridge style:
  // Q 12 = Paper 1 variant 2
  // MS 12 = Paper 1 variant 2
  // Q 22 = Paper 2 variant 2
  // Q 32 = Paper 3 variant 2
  const cambridgeCodeMatch = filename.match(/\b(?:Q|MS)\s*(\d)(\d)\b/i);
  if (cambridgeCodeMatch) {
    return `Paper ${cambridgeCodeMatch[1]}`;
  }

  return "";
}

function isQuestion(filename) {
  return (
    filename.includes(" Q") ||
    filename.toLowerCase().includes("question") ||
    filename.toLowerCase().includes("qp")
  );
}

function isMarkScheme(filename) {
  return (
    filename.includes(" MS") ||
    filename.toLowerCase().includes("mark") ||
    filename.toLowerCase().includes("ms")
  );
}

function isExaminerReport(filename) {
  return (
    filename.includes(" ER") ||
    filename.toLowerCase().includes("examiner") ||
    filename.toLowerCase().includes("er")
  );
}

const files = walk(root);

const pastPaperGroups = {};
const topicTests = [];

for (const file of files) {
  const relativeFromPublic = path.relative(
    path.join(__dirname, "..", "public"),
    file
  );

  const url = "/" + relativeFromPublic.replaceAll("\\", "/");
  const parts = relativeFromPublic.split(path.sep);

  // parts example:
  // papers / oxfordaqa / physics / as-level / past-papers / Jan 2023 / file.pdf
  // papers / oxfordaqa / physics / as-level / topic-test / Electricity / file.pdf
  // papers / cambridge / computer-science / 1 / 2023 / as-level / file.pdf

  const boardFolder = parts[1];
  const subjectFolder = parts[2];

  const board = normalizeBoard(boardFolder);
  const subject = normalizeSubject(subjectFolder);
  const filename = path.basename(file, ".pdf");

  // ======================================================
  // CAMBRIDGE COMPUTER SCIENCE SPECIAL STRUCTURE
  // board / subject / variant / year / qualification / file
  // ======================================================
if (boardFolder === "cambridge" && subjectFolder === "computer-science") {
  const variantFolder = parts[3];        // 1, 2, or 3
  const sessionYearFolder = parts[4];    // June 2021
  const qualificationFolder = parts[5];  // AS level (Paper 1 & 2)

  const variant = `Variant ${variantFolder}`;
  const qualification = normalizeQualification(qualificationFolder);
  const year = getYear(filename, sessionYearFolder);
  const session = getSession(filename) || sessionYearFolder.split(" ")[0];
  const unit = getUnitOrPaper(filename);

  const key = `${board}-${subject}-${variant}-${qualification}-${session}-${year}-${unit}`;

  if (!pastPaperGroups[key]) {
    pastPaperGroups[key] = {
      type: "Past Paper",
      board,
      subject,
      variant,
      qualification,
      year,
      session,
      unit,
      questionPaper: "",
      markScheme: "",
      examinerReport: "",
    };
  }

  if (isQuestion(filename)) {
    pastPaperGroups[key].questionPaper = url;
  }

  if (isMarkScheme(filename)) {
    pastPaperGroups[key].markScheme = url;
  }

  if (isExaminerReport(filename)) {
    pastPaperGroups[key].examinerReport = url;
  }

  continue;
}
// ======================================================
// EDEXCEL SPECIAL STRUCTURE
// board / subject / module / session-year / file
// Example:
// papers / edexcel / further-maths / Pure 1 / June 2023 / file.pdf
// ======================================================
if (boardFolder === "edexcel") {
  const moduleFolder = parts[3];        // Pure 1, Statistics 1, Mechanics 1
  const sessionYearFolder = parts[4];   // June 2023

  const qualification = "Edexcel";
  const year = getYear(filename, sessionYearFolder);
  const session = getSession(filename) || sessionYearFolder.split(" ")[0];
  const unit = moduleFolder;

  const key = `${board}-${subject}-${qualification}-${session}-${year}-${unit}`;

  if (!pastPaperGroups[key]) {
    pastPaperGroups[key] = {
      type: "Past Paper",
      board,
      subject,
      qualification,
      year,
      session,
      unit,
      questionPaper: "",
      markScheme: "",
      examinerReport: "",
    };
  }

  if (isQuestion(filename)) {
    pastPaperGroups[key].questionPaper = url;
  }

  if (isMarkScheme(filename)) {
    pastPaperGroups[key].markScheme = url;
  }

  if (isExaminerReport(filename)) {
    pastPaperGroups[key].examinerReport = url;
  }

  continue;
}
  // ======================================================
  // NORMAL STRUCTURE
  // board / subject / qualification / past-papers / session-year / file
  // board / subject / qualification / topic-test / topic / file
  // ======================================================
  const qualificationFolder = parts[3];
  const sectionFolder = parts[4];

  const qualification = normalizeQualification(qualificationFolder);

  // Topic tests
  if (sectionFolder === "topic-test" || sectionFolder === "topic-tests") {
    const topicFolder = parts[5];

    topicTests.push({
      type: "Topic Test",
      board,
      subject,
      qualification,
      topic: niceName(topicFolder),
      title: filename,
      pdf: url,
    });

    continue;
  }

  // Past papers
  if (sectionFolder === "past-papers") {
    const sessionYearFolder = parts[5];

    const year = getYear(filename);
    const session = getSession(filename) || sessionYearFolder.split(" ")[0];
    const unit = getUnitOrPaper(filename);

    const key = `${board}-${subject}-${qualification}-${session}-${year}-${unit}`;

    if (!pastPaperGroups[key]) {
      pastPaperGroups[key] = {
        type: "Past Paper",
        board,
        subject,
        qualification,
        year,
        session,
        unit,
        questionPaper: "",
        markScheme: "",
        examinerReport: "",
      };
    }

    if (isQuestion(filename)) {
      pastPaperGroups[key].questionPaper = url;
    }

    if (isMarkScheme(filename)) {
      pastPaperGroups[key].markScheme = url;
    }

    if (isExaminerReport(filename)) {
      pastPaperGroups[key].examinerReport = url;
    }
  }
}

const pastPapers = Object.values(pastPaperGroups).filter(
  (paper) => paper.questionPaper
);

const allPapers = [...pastPapers, ...topicTests];

const content = `export const papers = ${JSON.stringify(allPapers, null, 2)};\n`;

fs.writeFileSync(output, content);

console.log(`Generated ${pastPapers.length} past papers`);
console.log(`Generated ${topicTests.length} topic tests`);
console.log(`Saved to src/papersData.js`);
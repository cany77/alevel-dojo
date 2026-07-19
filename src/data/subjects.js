const aLevelLabel = "A-Level";
const gcseLabel = "GCSE / IGCSE";

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function subjectEntry({
  id,
  qualification,
  qualificationLabel,
  qualificationType = qualificationLabel,
  board,
  boardLabel = board,
  name,
  displayName = name,
  detail,
  legacyIds = [],
}) {
  return {
    id,
    qualification,
    qualificationLabel,
    qualificationType,
    board,
    boardLabel,
    subject: name,
    name,
    displayName,
    detail,
    legacyIds,
  };
}

export const subjectLevelGroups = [
  {
    qualification: "a-level",
    qualificationLabel: aLevelLabel,
    groups: [
      {
        board: "OxfordAQA",
        boardLabel: "OxfordAQA",
        description: "International AQA subjects",
        subjects: [
          subjectEntry({ id: "a-level:oxfordaqa:physics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "OxfordAQA", name: "Physics", detail: "Units 1-5, topic tests, practical skills", legacyIds: ["physics"] }),
          subjectEntry({ id: "a-level:oxfordaqa:chemistry", qualification: "a-level", qualificationLabel: aLevelLabel, board: "OxfordAQA", name: "Chemistry", detail: "Physical, organic, inorganic, practical skills", legacyIds: ["chemistry"] }),
          subjectEntry({ id: "a-level:oxfordaqa:biology", qualification: "a-level", qualificationLabel: aLevelLabel, board: "OxfordAQA", name: "Biology", detail: "Cells, molecules, genetics, physiology, ecology", legacyIds: ["biology"] }),
          subjectEntry({ id: "a-level:oxfordaqa:psychology", qualification: "a-level", qualificationLabel: aLevelLabel, board: "OxfordAQA", name: "Psychology", detail: "Research methods, approaches, memory, attachment", legacyIds: ["psychology"] }),
          subjectEntry({ id: "a-level:oxfordaqa:english-literature", qualification: "a-level", qualificationLabel: aLevelLabel, board: "OxfordAQA", name: "English Literature", detail: "AS Units 1-2, A-Level Units 3-4, comparative literature", legacyIds: ["english-literature", "english-lit"] }),
        ],
      },
      {
        board: "Cambridge",
        boardLabel: "Cambridge",
        description: "CAIE subjects and variants",
        subjects: [
          subjectEntry({ id: "a-level:cambridge:computer-science", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Cambridge", name: "Computer Science", detail: "Papers 1-4 and variants 1-3", legacyIds: ["computer-science"] }),
          subjectEntry({ id: "a-level:cambridge:mathematics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Cambridge", name: "Mathematics", detail: "Pure mathematics, statistics, mechanics", legacyIds: ["cambridge-maths"] }),
          subjectEntry({ id: "a-level:cambridge:physics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Cambridge", name: "Physics", detail: "AS and A Level structured papers", legacyIds: ["cambridge-physics"] }),
        ],
      },
      {
        board: "Edexcel",
        boardLabel: "Edexcel",
        description: "Pearson Edexcel subjects",
        subjects: [
          subjectEntry({ id: "a-level:edexcel:mathematics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Edexcel", name: "Mathematics", detail: "Pure 1-4, statistics, mechanics", legacyIds: ["maths"] }),
          subjectEntry({ id: "a-level:edexcel:further-mathematics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Edexcel", name: "Further Mathematics", detail: "Further pure, mechanics, statistics", legacyIds: ["further-maths"] }),
          subjectEntry({ id: "a-level:edexcel:statistics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Edexcel", name: "Statistics", detail: "Probability, distributions, hypothesis testing", legacyIds: ["statistics"] }),
          subjectEntry({ id: "a-level:edexcel:mechanics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Edexcel", name: "Mechanics", detail: "Kinematics, forces, moments, projectiles", legacyIds: ["mechanics"] }),
          subjectEntry({ id: "a-level:edexcel:decisions", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Edexcel", name: "Decisions", detail: "Decision mathematics, algorithms, networks", legacyIds: ["decisions"] }),
          subjectEntry({ id: "a-level:edexcel:economics", qualification: "a-level", qualificationLabel: aLevelLabel, board: "Edexcel", name: "Economics", detail: "Markets, macroeconomics, global economy", legacyIds: ["economics"] }),
        ],
      },
    ],
  },
  {
    qualification: "gcse-igcse",
    qualificationLabel: gcseLabel,
    groups: [
      {
        board: "Edexcel International GCSE",
        boardLabel: "Edexcel International GCSE",
        description: "Pearson Edexcel International GCSE subjects",
        subjects: [
          subjectEntry({ id: "gcse-igcse:edexcel-international-gcse:ict", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "Edexcel International GCSE", name: "ICT", detail: "Paper 1, Paper 1R, Paper 2", legacyIds: ["gcse-edexcel-ict"] }),
          subjectEntry({ id: "gcse-igcse:edexcel-international-gcse:english-language", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "Edexcel International GCSE", name: "English Language", detail: "Linear language papers and regional variants", legacyIds: ["gcse-edexcel-english-language"] }),
          subjectEntry({ id: "gcse-igcse:edexcel-international-gcse:english-literature", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "Edexcel International GCSE", name: "English Literature", detail: "Linear literature papers", legacyIds: ["gcse-edexcel-english-literature"] }),
          subjectEntry({ id: "gcse-igcse:edexcel-international-gcse:math", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "Edexcel International GCSE", name: "Math", detail: "Higher and regional higher papers", legacyIds: ["gcse-edexcel-math"] }),
        ],
      },
      {
        board: "Edexcel GCSE",
        boardLabel: "Edexcel GCSE",
        description: "Pearson Edexcel GCSE subjects",
        subjects: [
          subjectEntry({ id: "gcse-igcse:edexcel-gcse:business", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "GCSE", board: "Edexcel GCSE", name: "Business", detail: "GCSE Business Paper 1 and Paper 2", legacyIds: ["gcse-edexcel-business"] }),
        ],
      },
      {
        board: "OxfordAQA International GCSE",
        boardLabel: "OxfordAQA International GCSE",
        description: "OxfordAQA International GCSE sciences",
        subjects: [
          subjectEntry({ id: "gcse-igcse:oxfordaqa-international-gcse:biology", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "OxfordAQA International GCSE", name: "Biology", detail: "Paper 1 and Paper 2", legacyIds: ["gcse-oxfordaqa-biology"] }),
          subjectEntry({ id: "gcse-igcse:oxfordaqa-international-gcse:chemistry", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "OxfordAQA International GCSE", name: "Chemistry", detail: "Paper 1 and Paper 2", legacyIds: ["gcse-oxfordaqa-chemistry"] }),
          subjectEntry({ id: "gcse-igcse:oxfordaqa-international-gcse:physics", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "International GCSE", board: "OxfordAQA International GCSE", name: "Physics", detail: "Paper 1 and Paper 2", legacyIds: ["gcse-oxfordaqa-physics"] }),
        ],
      },
      {
        board: "Cambridge IGCSE",
        boardLabel: "Cambridge IGCSE",
        description: "Cambridge IGCSE subjects",
        subjects: [
          subjectEntry({ id: "gcse-igcse:cambridge-igcse:computer-science", qualification: "gcse-igcse", qualificationLabel: gcseLabel, qualificationType: "IGCSE", board: "Cambridge IGCSE", name: "Computer Science", detail: "0478 Paper 1 and Paper 2", legacyIds: ["gcse-cambridge-computer-science"] }),
        ],
      },
    ],
  },
];

export const subjectGroups = subjectLevelGroups.flatMap((level) =>
  level.groups.map((group) => ({
    ...group,
    qualification: level.qualification,
    qualificationLabel: level.qualificationLabel,
    subjects: group.subjects.map((subject) => ({ ...subject })),
  }))
);

export function getAllSubjects() {
  return subjectGroups.flatMap((group) =>
    group.subjects.map((subject) => ({
      ...subject,
      board: group.board,
      boardLabel: group.boardLabel || group.board,
      qualification: subject.qualification || group.qualification,
      qualificationLabel: subject.qualificationLabel || group.qualificationLabel,
    }))
  );
}

export function subjectToProfileSubject(subject) {
  return {
    id: subject.id,
    qualification: subject.qualification,
    qualificationLabel: subject.qualificationLabel,
    qualificationType: subject.qualificationType || subject.qualificationLabel,
    board: subject.board,
    boardLabel: subject.boardLabel || subject.board,
    subject: subject.name || subject.subject,
    displayName: subject.displayName || subject.name || subject.subject,
  };
}

export function subjectProfileKey(subject) {
  if (!subject) return "";
  if (typeof subject === "string") return subject;
  return subject.id || [subject.qualification, subject.board, subject.subject || subject.name].filter(Boolean).join(":");
}

export function normalizeBoardKey(value = "") {
  const normalized = slugify(value);
  if (normalized.includes("oxfordaqa-international-gcse")) return "oxfordaqa-international-gcse";
  if (normalized.includes("edexcel-international-gcse")) return "edexcel-international-gcse";
  if (normalized.includes("cambridge-igcse")) return "cambridge-igcse";
  if (normalized.includes("edexcel-gcse")) return "edexcel-gcse";
  if (normalized.includes("oxford") || normalized.includes("aqa")) return "oxfordaqa";
  if (normalized.includes("cambridge") || normalized.includes("caie")) return "cambridge";
  if (normalized.includes("edexcel") || normalized.includes("pearson")) return "edexcel";
  return normalized;
}

export function normalizeQualificationKey(value = "") {
  const normalized = slugify(value);
  if (normalized.includes("gcse") || normalized.includes("igcse")) return "gcse-igcse";
  if (normalized.includes("a-level") || normalized.includes("alevel") || normalized.includes("as-level")) return "a-level";
  return normalized;
}

export function normalizeSubjectNameKey(value = "") {
  const normalized = String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bmaths\b/g, "mathematics")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "math" || normalized === "mathematics pure") return "mathematics";
  return normalized;
}

function matchesSubject(subject, item) {
  const subjectName = item.subject || item.name || item.subject_name || item.displayName;
  const board = item.board || item.boardLabel;
  const qualification = item.qualification || item.qualificationLabel || item.level || item.category;
  if (subjectName && normalizeSubjectNameKey(subject.name) !== normalizeSubjectNameKey(subjectName)) return false;
  if (board && normalizeBoardKey(subject.board) !== normalizeBoardKey(board)) return false;
  if (qualification && normalizeQualificationKey(subject.qualification) !== normalizeQualificationKey(qualification)) return false;
  return Boolean(subjectName || board || qualification);
}

export function normalizeSubjectSelection(profileSubjects = [], subjects = getAllSubjects()) {
  const resolved = [];
  const add = (id) => {
    if (id && !resolved.includes(id)) resolved.push(id);
  };

  profileSubjects.forEach((item) => {
    if (!item) return;

    if (typeof item === "string") {
      const exact = subjects.find((subject) => subject.id === item);
      if (exact) {
        add(exact.id);
        return;
      }

      const legacy = subjects.find((subject) => subject.legacyIds?.includes(item));
      if (legacy) {
        add(legacy.id);
        return;
      }

      const matches = subjects.filter((subject) => normalizeSubjectNameKey(subject.name) === normalizeSubjectNameKey(item));
      const preferred = matches.find((subject) => subject.qualification === "a-level") || matches[0];
      add(preferred?.id);
      return;
    }

    const exact = item.id ? subjects.find((subject) => subject.id === item.id) : null;
    if (exact) {
      add(exact.id);
      return;
    }

    const legacy = item.id ? subjects.find((subject) => subject.legacyIds?.includes(item.id)) : null;
    if (legacy) {
      add(legacy.id);
      return;
    }

    const matches = subjects.filter((subject) => matchesSubject(subject, item));
    const preferred = matches.find((subject) => subject.qualification === "a-level") || matches[0];
    add(preferred?.id);
  });

  return resolved;
}

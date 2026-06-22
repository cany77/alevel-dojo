export const subjectGroups = [
  {
    board: "OxfordAQA",
    description: "International AQA subjects",
    subjects: [
      { id: "physics", name: "Physics", detail: "Units 1-5, topic tests, practical skills" },
      { id: "chemistry", name: "Chemistry", detail: "Physical, organic, inorganic, practical skills" },
      { id: "biology", name: "Biology", detail: "Cells, molecules, genetics, physiology, ecology" },
      { id: "psychology", name: "Psychology", detail: "Research methods, approaches, memory, attachment" },
    ],
  },
  {
    board: "Cambridge",
    description: "CAIE subjects and variants",
    subjects: [
      { id: "computer-science", name: "Computer Science", detail: "Papers 1-4 and variants 1-3" },
      { id: "cambridge-maths", name: "Mathematics", detail: "Pure mathematics, statistics, mechanics" },
      { id: "cambridge-physics", name: "Physics", detail: "AS and A Level structured papers" },
    ],
  },
  {
    board: "Edexcel",
    description: "Pearson Edexcel subjects",
    subjects: [
      { id: "maths", name: "Mathematics", detail: "Pure 1-4, statistics, mechanics" },
      { id: "further-maths", name: "Further Mathematics", detail: "Further pure, mechanics, statistics" },
      { id: "statistics", name: "Statistics", detail: "Probability, distributions, hypothesis testing" },
      { id: "mechanics", name: "Mechanics", detail: "Kinematics, forces, moments, projectiles" },
      { id: "decisions", name: "Decisions", detail: "Decision mathematics, algorithms, networks" },
      { id: "economics", name: "Economics", detail: "Markets, macroeconomics, global economy" },
    ],
  },
];

export function getAllSubjects() {
  return subjectGroups.flatMap((group) =>
    group.subjects.map((subject) => ({ ...subject, board: group.board }))
  );
}

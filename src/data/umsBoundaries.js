import { umsBoundaries as generatedUmsBoundaries } from "./umsBoundaries.generated";

// Add official UMS conversion files to public/ums-boundaries, Pearson URLs to
// src/data/edexcelUmsSources.js, or exact manual rows to
// src/data/edexcelUmsManual.js, then run:
// npm run build:ums
//
// Generated rows use this shape:
// {
//   board: "OxfordAQA",
//   subject: "Physics",
//   unit: "Unit 1",
//   session: "Jan 2026",
//   maxRaw: 80,
//   maxUMS: 120,
//   umsBoundaries: {
//     "A*": 108,
//     A: 96,
//     B: 84,
//     C: 72,
//     D: 60,
//     E: 48,
//   },
//   sourceFile: "OxfordAQA-January-2026-UMS-conversion.html"
// }

export const umsBoundaries = generatedUmsBoundaries;

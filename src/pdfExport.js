import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseColor(value = "#22d3ee") {
  const text = String(value || "").trim();

  const rgba = text.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const [r = 34, g = 211, b = 238, a = 1] = rgba[1]
      .split(",")
      .map((part) => Number(String(part).trim()));
    return {
      color: rgb(clamp(r, 0, 255) / 255, clamp(g, 0, 255) / 255, clamp(b, 0, 255) / 255),
      opacity: clamp(Number.isFinite(a) ? a : 1, 0, 1),
    };
  }

  const hex = text.replace("#", "");
  const fullHex = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex.padEnd(6, "0").slice(0, 6);
  const int = Number.parseInt(fullHex, 16);
  if (!Number.isFinite(int)) {
    return { color: rgb(0.13, 0.83, 0.93), opacity: 1 };
  }

  return {
    color: rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255),
    opacity: 1,
  };
}

function toPdfPoint(point = {}, pageWidth, pageHeight) {
  return {
    x: (Number(point.x) || 0) * pageWidth,
    y: pageHeight - (Number(point.y) || 0) * pageHeight,
  };
}

function normalBox(annotation = {}, pageWidth, pageHeight) {
  const x = (Number(annotation.x) || 0) * pageWidth;
  const y = pageHeight - (Number(annotation.y) || 0) * pageHeight;
  const width = (Number(annotation.width) || 0) * pageWidth;
  const height = (Number(annotation.height) || 0) * pageHeight;
  const left = Math.min(x, x + width);
  const top = Math.max(y, y - height);
  return {
    x: left,
    y: Math.min(y, y - height),
    width: Math.abs(width),
    height: Math.abs(height),
    top,
  };
}

function drawStroke(page, annotation, pageWidth, pageHeight) {
  const points = Array.isArray(annotation.points) ? annotation.points : [];
  if (points.length === 0) return;

  const { color, opacity: colorOpacity } = parseColor(annotation.color);
  const opacity = Number.isFinite(annotation.opacity)
    ? clamp(annotation.opacity, 0, 1)
    : colorOpacity;
  const thickness = Math.max(0.5, Number(annotation.strokeWidth) || 2);

  if (points.length === 1) {
    const point = toPdfPoint(points[0], pageWidth, pageHeight);
    page.drawLine({
      start: point,
      end: { x: point.x + 0.01, y: point.y + 0.01 },
      thickness,
      color,
      opacity,
    });
    return;
  }

  for (let index = 1; index < points.length; index += 1) {
    page.drawLine({
      start: toPdfPoint(points[index - 1], pageWidth, pageHeight),
      end: toPdfPoint(points[index], pageWidth, pageHeight),
      thickness,
      color,
      opacity,
    });
  }
}

function drawArrowHead(page, start, end, color, thickness, opacity) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = Math.max(9, thickness * 4);
  const spread = Math.PI / 7;

  [angle + Math.PI - spread, angle + Math.PI + spread].forEach((headAngle) => {
    page.drawLine({
      start: end,
      end: {
        x: end.x + Math.cos(headAngle) * length,
        y: end.y + Math.sin(headAngle) * length,
      },
      thickness,
      color,
      opacity,
    });
  });
}

function drawShape(page, annotation, pageWidth, pageHeight) {
  const { color, opacity } = parseColor(annotation.color);
  const borderWidth = Math.max(0.5, Number(annotation.strokeWidth) || 2);
  const box = normalBox(annotation, pageWidth, pageHeight);

  if (annotation.type === "line" || annotation.type === "arrow") {
    const start = {
      x: (Number(annotation.x) || 0) * pageWidth,
      y: pageHeight - (Number(annotation.y) || 0) * pageHeight,
    };
    const end = {
      x: start.x + (Number(annotation.width) || 0) * pageWidth,
      y: start.y - (Number(annotation.height) || 0) * pageHeight,
    };
    page.drawLine({ start, end, thickness: borderWidth, color, opacity });
    if (annotation.type === "arrow") drawArrowHead(page, start, end, color, borderWidth, opacity);
    return;
  }

  if (annotation.type === "ellipse") {
    page.drawEllipse({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      xScale: box.width / 2,
      yScale: box.height / 2,
      borderColor: color,
      borderWidth,
      borderOpacity: opacity,
      color,
      opacity: 0.08,
    });
    return;
  }

  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    borderColor: color,
    borderWidth,
    borderOpacity: opacity,
    color,
    opacity: 0.08,
  });
}

function wrapText(text, maxChars) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function drawTextAnnotation(page, annotation, pageWidth, pageHeight, font) {
  const text = String(annotation.text || "").trim();
  if (!text) return;

  const { color, opacity } = parseColor(annotation.color || "#0f172a");
  const fontSize = Math.max(8, Number(annotation.fontSize) || 18);
  const x = (Number(annotation.x) || 0) * pageWidth;
  const top = pageHeight - (Number(annotation.y) || 0) * pageHeight;
  const width = Math.max(40, (Number(annotation.width) || 0.18) * pageWidth);
  const lineHeight = fontSize * 1.18;
  const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.52)));

  wrapText(text, maxChars).forEach((line, index) => {
    page.drawText(line, {
      x: x + 4,
      y: top - fontSize - index * lineHeight - 4,
      size: fontSize,
      font,
      color,
      opacity,
      maxWidth: width,
    });
  });
}

function flattenAnnotationsForPage(page, annotations, font) {
  const { width, height } = page.getSize();

  annotations.forEach((annotation) => {
    if (annotation.type === "pen" || annotation.type === "highlight") {
      drawStroke(page, annotation, width, height);
      return;
    }

    if (annotation.type === "text") {
      drawTextAnnotation(page, annotation, width, height, font);
      return;
    }

    drawShape(page, annotation, width, height);
  });
}

export function cleanPdfExportFilename(name = "A-Level-Dojo-Paper-Export.pdf") {
  const base = String(name || "A-Level-Dojo-Paper-Export")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return `${base || "A-Level-Dojo-Paper-Export"}.pdf`;
}

export function annotationsFromPayload(payload) {
  if (!payload?.pages || typeof payload.pages !== "object") return [];
  return Object.entries(payload.pages).flatMap(([pageNumber, items]) =>
    Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          pageNumber: Number(item.pageNumber || item.page || pageNumber),
        }))
      : []
  );
}

export async function exportAnnotatedPdf({ fileUrl, annotations = [], fileName }) {
  if (!fileUrl) throw new Error("No PDF file is available to export.");

  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error("Could not load the original PDF.");

  const originalBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(originalBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const pageNumber = index + 1;
    const pageAnnotations = annotations.filter(
      (annotation) => Number(annotation.pageNumber || annotation.page || 1) === pageNumber
    );
    if (pageAnnotations.length) flattenAnnotationsForPage(page, pageAnnotations, font);
  });

  const exportedBytes = await pdfDoc.save();
  const blob = new Blob([exportedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = cleanPdfExportFilename(fileName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

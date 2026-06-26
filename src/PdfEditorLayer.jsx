import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, Circle, Line, PencilBrush, Polygon, Rect, Textbox, Triangle } from "fabric";
import {
  ChevronDown,
  Circle as CircleIcon,
  Eraser,
  FileDown,
  Highlighter,
  Minus,
  MousePointer2,
  MoveUpRight,
  PenLine,
  Redo2,
  Shapes,
  StickyNote,
  Square,
  Trash2,
  Triangle as TriangleIcon,
  Type,
  Undo2,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { exportAnnotatedPdf } from "./pdfExport";

const toolOptions = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pen", label: "Pen", icon: PenLine },
  { id: "highlighter", label: "Highlighter", icon: Highlighter },
  { id: "shape", label: "Shapes", icon: Shapes },
  { id: "line", label: "Line", icon: Minus },
  { id: "sticky", label: "Sticky note", icon: StickyNote },
  { id: "text", label: "Text", icon: Type },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

const colors = ["#000000", "#0b1f4d", "#22d3ee", "#8b5cf6", "#fb7185", "#f59e0b", "#22c55e", "#ffffff"];
const textColors = ["#0f172a", "#0e7490", "#6d28d9", "#be123c", "#ffffff"];
const highlighterColors = [
  "rgba(34, 211, 238, 0.32)",
  "rgba(251, 113, 133, 0.32)",
  "rgba(245, 158, 11, 0.34)",
  "rgba(139, 92, 246, 0.30)",
];
const stickyColors = [
  "rgba(253, 230, 138, 0.94)",
  "rgba(254, 215, 170, 0.94)",
  "rgba(251, 207, 232, 0.94)",
  "rgba(186, 230, 253, 0.94)",
  "rgba(187, 247, 208, 0.94)",
  "rgba(221, 214, 254, 0.94)",
];

function emptyAnnotationPayload() {
  return { pages: { 1: null } };
}

const editorTools = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pen", label: "Pen", icon: PenLine },
  { id: "highlight", label: "Highlighter", icon: Highlighter },
  { id: "shape", label: "Shapes", icon: Shapes },
  { id: "text", label: "Text", icon: Type },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

const workingToolFlyouts = ["pen", "highlight", "shape", "text", "eraser"];
const shapeChoices = [
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "ellipse", label: "Ellipse", icon: CircleIcon },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: MoveUpRight },
];
const compactColors = ["#000000", "#0b1f4d", "#22d3ee", "#8b5cf6", "#fb7185", "#f59e0b", "#22c55e", "#ffffff"];
const colorLabels = {
  "#000000": "Black",
  "#0b1f4d": "Navy blue",
  "#22d3ee": "Cyan",
  "#8b5cf6": "Violet",
  "#fb7185": "Rose",
  "#f59e0b": "Amber",
  "#22c55e": "Green",
  "#ffffff": "White",
};
const PEN_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 21l1.7-5.8L16.9 3a2.1 2.1 0 013 3L7.7 18.2 3 21z' fill='%23050816' stroke='%2367e8f9' stroke-width='1.4' stroke-linejoin='round'/%3E%3Cpath d='M14.9 5l4.1 4.1M4.7 15.2l3 3' fill='none' stroke='%23c4b5fd' stroke-width='1.3'/%3E%3C/svg%3E") 3 21, crosshair`;
const compactHighlightColors = [
  "rgba(34, 211, 238, 0.38)",
  "rgba(251, 113, 133, 0.38)",
  "rgba(245, 158, 11, 0.42)",
  "rgba(139, 92, 246, 0.38)",
];

const eraserSizes = [
  { id: "small", label: "Small", radius: 12 },
  { id: "medium", label: "Medium", radius: 22 },
  { id: "large", label: "Large", radius: 36 },
];

function uid(prefix = "annotation") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizePoint(point, size) {
  return {
    x: size.width ? point.x / size.width : 0,
    y: size.height ? point.y / size.height : 0,
  };
}

function denormalizePoint(point, size) {
  return {
    x: (point.x || 0) * size.width,
    y: (point.y || 0) * size.height,
  };
}

function emptyEditorPayload() {
  return { pages: { 1: [] } };
}

function getPointer(event, element) {
  const rect = element.getBoundingClientRect();
  return {
    x: clamp(event.clientX - rect.left, 0, rect.width),
    y: clamp(event.clientY - rect.top, 0, rect.height),
  };
}

function pathFromPoints(points, size) {
  if (!points?.length) return "";
  const actual = points.map((point) => denormalizePoint(point, size));
  if (actual.length === 1) {
    return `M ${actual[0].x} ${actual[0].y} L ${actual[0].x + 0.01} ${actual[0].y + 0.01}`;
  }
  return actual
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    0,
    1
  );

  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function rectIntersectsCircle(rect, point, radius) {
  const closestX = clamp(point.x, rect.left, rect.left + rect.width);
  const closestY = clamp(point.y, rect.top, rect.top + rect.height);
  return Math.hypot(point.x - closestX, point.y - closestY) <= radius;
}

function normalizeAnnotationForSave(annotation) {
  const { pageElement, pageSize, ...persistableAnnotation } = annotation;
  return {
    ...persistableAnnotation,
    pageNumber: annotation.pageNumber || annotation.page || 1,
  };
}

function pageNumberFromLayer(element) {
  const testId = element?.getAttribute?.("data-testid") || "";
  const match = testId.match(/core__page-layer-(\d+)/);
  return match ? Number(match[1]) + 1 : 1;
}

function annotationsAreEmpty(payload) {
  if (!payload?.pages) return true;
  return Object.values(payload.pages).every((items) => !Array.isArray(items) || items.length === 0);
}

export default function PdfEditorLayer({
  storageKey = "default-pdf",
  user = null,
  paperId = "",
  pdfType = "question",
  exportFileName = "A-Level-Dojo-Paper-Export.pdf",
  canExportPdf = true,
  onExportBlocked = () => {},
}) {
  const markerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const currentDraftRef = useRef(null);
  const activeToolRef = useRef("select");
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const dragRef = useRef(null);
  const annotationsRef = useRef([]);
  const isErasingRef = useRef(false);
  const erasedDuringStrokeRef = useRef(new Set());

  const [tool, setTool] = useState("select");
  const [activeFlyout, setActiveFlyout] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [draft, setDraft] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("Ready");
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [strokeColor, setStrokeColor] = useState("#22d3ee");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [highlightColor, setHighlightColor] = useState(compactHighlightColors[0]);
  const [shapeType, setShapeType] = useState("rect");
  const [textColor, setTextColor] = useState("#0f172a");
  const [fontSize, setFontSize] = useState(18);
  const [pageElements, setPageElements] = useState([]);
  const [eraserSize, setEraserSize] = useState("medium");
  const [eraserCursor, setEraserCursor] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const eraserRadius =
    eraserSizes.find((sizeOption) => sizeOption.id === eraserSize)?.radius || 22;

  const annotationKey = useMemo(
    () => paperId || storageKey || "default-pdf",
    [paperId, storageKey]
  );

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const savePayload = useCallback(
    (nextAnnotations = annotations) => ({
      pages: nextAnnotations.reduce((pages, annotation) => {
        const pageNumber = String(annotation.pageNumber || annotation.page || 1);
        pages[pageNumber] = [...(pages[pageNumber] || []), normalizeAnnotationForSave(annotation)];
        return pages;
      }, {}),
    }),
    [annotations]
  );

  const writeAnnotations = useCallback(
    async (nextAnnotations = annotations) => {
      const payload = savePayload(nextAnnotations);

      try {
        localStorage.setItem(
          `pdf-editor-${annotationKey}-${pdfType}`,
          JSON.stringify(payload)
        );
      } catch {}

      if (!user?.id || !paperId) {
        setSaveStatus("Saved locally");
        return;
      }

      setSaveStatus("Saving...");

      const { error } = await supabase.from("pdf_annotations").upsert(
        {
          user_id: user.id,
          paper_id: paperId,
          pdf_type: pdfType,
          annotations: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,paper_id,pdf_type" }
      );

      setSaveStatus(error ? "Save failed" : "Saved");

      if (!error) {
        window.dispatchEvent(
          new CustomEvent("alevel-dojo:pdf-annotations-saved", {
            detail: { paperId, pdfType, hasAnnotations: !annotationsAreEmpty(payload) },
          })
        );
      }
    },
    [annotationKey, annotations, paperId, pdfType, savePayload, user?.id]
  );

  const resetPaperAnnotations = useCallback(async () => {
    const confirmed = window.confirm("Clear all annotations on this paper?");
    if (!confirmed) return;

    window.clearTimeout(saveTimerRef.current);
    setAnnotations([]);
    annotationsRef.current = [];
    setDraft(null);
    currentDraftRef.current = null;
    isErasingRef.current = false;
    erasedDuringStrokeRef.current = new Set();
    setEraserCursor(null);
    setSelectedId(null);
    historyRef.current = [JSON.stringify([])];
    historyIndexRef.current = 0;

    try {
      localStorage.removeItem(`pdf-editor-${annotationKey}-${pdfType}`);
    } catch {}

    if (user?.id && paperId) {
      setSaveStatus("Saving...");
      const { error } = await supabase
        .from("pdf_annotations")
        .delete()
        .eq("user_id", user.id)
        .eq("paper_id", paperId)
        .eq("pdf_type", pdfType);

      setSaveStatus(error ? "Save failed" : "Saved");
      window.dispatchEvent(
        new CustomEvent("alevel-dojo:pdf-annotations-reset", {
          detail: { paperId, pdfType },
        })
      );
      return;
    }

    setSaveStatus("Saved");
  }, [annotationKey, paperId, pdfType, user?.id]);

  const scheduleSave = useCallback(
    (nextAnnotations) => {
      setSaveStatus("Unsaved changes");
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        writeAnnotations(nextAnnotations);
      }, 800);
    },
    [writeAnnotations]
  );

  const pushHistory = useCallback((nextAnnotations) => {
    const snapshot = JSON.stringify(nextAnnotations);
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    if (nextHistory[nextHistory.length - 1] === snapshot) return;
    nextHistory.push(snapshot);
    historyRef.current = nextHistory.slice(-80);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const commitAnnotations = useCallback(
    (updater, shouldSave = true) => {
      setAnnotations((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        annotationsRef.current = next;
        pushHistory(next);
        if (shouldSave) scheduleSave(next);
        return next;
      });
    },
    [pushHistory, scheduleSave]
  );

  const stopCurrentSession = useCallback(() => {
    currentDraftRef.current = null;
    dragRef.current = null;
    isErasingRef.current = false;
    erasedDuringStrokeRef.current = new Set();
    setDraft(null);
    setEraserCursor(null);
  }, []);

  const chooseTool = useCallback(
    (nextTool) => {
      stopCurrentSession();
      activeToolRef.current = nextTool;
      setTool(nextTool);
      setSelectedId(null);
      setActiveFlyout(workingToolFlyouts.includes(nextTool) ? nextTool : null);
    },
    [stopCurrentSession]
  );

  const deleteAnnotation = useCallback(
    (id) => {
      if (!id) return;
      setSelectedId((current) => (current === id ? null : current));
      commitAnnotations((current) => current.filter((item) => item.id !== id));
    },
    [commitAnnotations]
  );

  const saveTextBoxMetrics = useCallback(
    (id, element) => {
      const pageElement = element?.closest?.('[data-testid^="core__page-layer-"]');
      if (!id || !element || !pageElement) return;
      const wrapperRect = pageElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      commitAnnotations((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                pageNumber: pageNumberFromLayer(pageElement),
                x: clamp(elementRect.left - wrapperRect.left, 0, wrapperRect.width) / wrapperRect.width,
                y: clamp(elementRect.top - wrapperRect.top, 0, wrapperRect.height) / wrapperRect.height,
                width: Math.max(120, elementRect.width) / wrapperRect.width,
                height: Math.max(42, elementRect.height) / wrapperRect.height,
              }
            : item
        )
      );
    },
    [commitAnnotations]
  );

  const annotationTouchesEraser = useCallback((annotation, point, pageSize) => {
    const radius = eraserRadius;

    if (annotation.type === "pen" || annotation.type === "highlight") {
      const points = (annotation.points || []).map((item) => denormalizePoint(item, pageSize));

      if (points.length === 1) {
        return Math.hypot(point.x - points[0].x, point.y - points[0].y) <= radius;
      }

      for (let index = 1; index < points.length; index += 1) {
        if (distanceToSegment(point, points[index - 1], points[index]) <= radius) {
          return true;
        }
      }

      return false;
    }

    const x = (annotation.x || 0) * pageSize.width;
    const y = (annotation.y || 0) * pageSize.height;
    const width = (annotation.width || 0) * pageSize.width;
    const height = (annotation.height || 0) * pageSize.height;

    if (annotation.type === "line" || annotation.type === "arrow") {
      return distanceToSegment(point, { x, y }, { x: x + width, y: y + height }) <= radius;
    }

    const left = Math.min(x, x + width);
    const top = Math.min(y, y + height);
    const box = {
      left,
      top,
      width: Math.max(Math.abs(width), annotation.type === "text" ? 120 : 1),
      height: Math.max(Math.abs(height), annotation.type === "text" ? 42 : 1),
    };

    return rectIntersectsCircle(box, point, radius);
  }, [eraserRadius]);

  const eraseAtPoint = useCallback(
    (event, pageNumber, pageElement, pageSize) => {
      if (!pageElement || !pageSize) return;

      const point = getPointer(event, pageElement);
      setEraserCursor({
        pageNumber,
        x: point.x,
        y: point.y,
      });

      if (!isErasingRef.current) return;

      const touchedIds = annotationsRef.current
        .filter((annotation) => Number(annotation.pageNumber || annotation.page || 1) === pageNumber)
        .filter((annotation) => !erasedDuringStrokeRef.current.has(annotation.id))
        .filter((annotation) => annotationTouchesEraser(annotation, point, pageSize))
        .map((annotation) => annotation.id);

      if (touchedIds.length === 0) return;

      touchedIds.forEach((id) => erasedDuringStrokeRef.current.add(id));

      setAnnotations((current) => {
        const next = current.filter((annotation) => !touchedIds.includes(annotation.id));
        annotationsRef.current = next;
        setSaveStatus("Unsaved changes");
        return next;
      });
    },
    [annotationTouchesEraser]
  );

  useEffect(() => {
    function deleteSelectedWithKeyboard(event) {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (!selectedId) return;

      const activeElement = document.activeElement;
      const isTypingInTextBox =
        activeElement?.tagName === "TEXTAREA" &&
        activeElement?.dataset?.textEditor === selectedId;

      if (isTypingInTextBox) return;

      event.preventDefault();
      deleteAnnotation(selectedId);
    }

    window.addEventListener("keydown", deleteSelectedWithKeyboard);
    return () => {
      window.removeEventListener("keydown", deleteSelectedWithKeyboard);
    };
  }, [deleteAnnotation, selectedId]);

  useEffect(() => {
    const panel = markerRef.current?.closest(".question-editor-panel");

    if (!panel) return;

    function collectPages() {
      const layers = Array.from(
        panel.querySelectorAll('[data-testid^="core__page-layer-"]')
      );

      layers.forEach((layer) => {
        layer.style.position = "relative";
        layer.style.overflow = "visible";
      });

      setPageElements((current) => {
        if (
          current.length === layers.length &&
          current.every((item, index) => item === layers[index])
        ) {
          return current;
        }

        return layers;
      });
    }

    collectPages();
    const observer = new MutationObserver(collectPages);
    observer.observe(panel, { childList: true, subtree: true });
    window.addEventListener("resize", collectPages);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", collectPages);
    };
  }, [annotationKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnotations() {
      let savedPayload = null;

      if (user?.id && paperId) {
        const { data, error } = await supabase
          .from("pdf_annotations")
          .select("annotations")
          .eq("user_id", user.id)
          .eq("paper_id", paperId)
          .eq("pdf_type", pdfType)
          .maybeSingle();

        if (!error && data?.annotations) savedPayload = data.annotations;
      }

      if (!savedPayload) {
        try {
          const saved = localStorage.getItem(`pdf-editor-${annotationKey}-${pdfType}`);
          savedPayload = saved ? JSON.parse(saved) : null;
        } catch {}
      }

      if (!isMounted) return;

      const loaded =
        savedPayload?.pages && typeof savedPayload.pages === "object"
          ? Object.entries(savedPayload.pages).flatMap(([pageNumber, items]) =>
              Array.isArray(items)
                ? items.map((item) => ({
                    ...item,
                    pageNumber: Number(item.pageNumber || item.page || pageNumber),
                  }))
                : []
            )
          : [];

      setAnnotations(loaded);
      historyRef.current = [JSON.stringify(loaded)];
      historyIndexRef.current = 0;
      setSaveStatus(loaded.length ? "Saved" : "Ready");
    }

    loadAnnotations();

    return () => {
      isMounted = false;
      window.clearTimeout(saveTimerRef.current);
    };
  }, [annotationKey, paperId, pdfType, user?.id]);

  useEffect(() => {
    function handleGlobalPointerMove(event) {
      if (!dragRef.current) return;
      moveAnnotationPointer(event);
    }

    function stopOnGlobalRelease() {
      if (!currentDraftRef.current && !dragRef.current && !isErasingRef.current) return;

      if (isErasingRef.current) {
        isErasingRef.current = false;
        erasedDuringStrokeRef.current = new Set();
        pushHistory(annotationsRef.current);
        scheduleSave(annotationsRef.current);
        return;
      }

      const currentDraft = currentDraftRef.current;
      if (currentDraft) {
        commitAnnotations((current) => [...current, normalizeAnnotationForSave(currentDraft)]);
      }

      stopCurrentSession();
    }

    window.addEventListener("pointerup", stopOnGlobalRelease);
    window.addEventListener("mouseup", stopOnGlobalRelease);
    window.addEventListener("pointercancel", stopOnGlobalRelease);
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("blur", stopOnGlobalRelease);

    return () => {
      window.removeEventListener("pointerup", stopOnGlobalRelease);
      window.removeEventListener("mouseup", stopOnGlobalRelease);
      window.removeEventListener("pointercancel", stopOnGlobalRelease);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("blur", stopOnGlobalRelease);
    };
  }, [commitAnnotations, pushHistory, scheduleSave, stopCurrentSession]);

  function beginAnnotation(event, pageNumber, pageElement, pageSize) {
    if (!pageElement) return;
    const point = normalizePoint(getPointer(event, pageElement), pageSize);

    if (tool === "select") return;

    if (tool === "eraser") {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      isErasingRef.current = true;
      erasedDuringStrokeRef.current = new Set();
      setActiveFlyout(null);
      eraseAtPoint(event, pageNumber, pageElement, pageSize);
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActiveFlyout(null);

    if (tool === "pen" || tool === "highlight") {
      const newStroke = {
        id: uid(tool),
        type: tool === "pen" ? "pen" : "highlight",
        pageNumber,
        pageElement,
        pageSize,
        points: [point],
        color: tool === "pen" ? strokeColor : highlightColor,
        strokeWidth: tool === "pen" ? strokeWidth : Math.max(10, strokeWidth * 3),
        opacity: tool === "pen" ? 1 : 0.42,
        createdAt: new Date().toISOString(),
      };
      currentDraftRef.current = newStroke;
      setDraft(newStroke);
      return;
    }

    if (tool === "shape") {
      const newShape = {
        id: uid(shapeType),
        type: shapeType,
        pageNumber,
        pageElement,
        pageSize,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        color: strokeColor,
        strokeWidth,
        opacity: 1,
        createdAt: new Date().toISOString(),
      };
      currentDraftRef.current = newShape;
      setDraft(newShape);
      return;
    }

    if (tool === "text") {
      const textAnnotation = {
        id: uid("text"),
        type: "text",
        pageNumber,
        x: point.x,
        y: point.y,
        width: 0.18,
        height: 0.055,
        text: "",
        color: textColor,
        fontSize,
        createdAt: new Date().toISOString(),
      };
      commitAnnotations((current) => [...current, textAnnotation]);
      setSelectedId(textAnnotation.id);
      setActiveFlyout(null);
      setTimeout(() => {
        document.querySelector(`[data-text-editor="${textAnnotation.id}"]`)?.focus();
      }, 30);
    }
  }

  function moveAnnotationPointer(event, pageElement = null, pageSize = null) {
    const targetElement = pageElement || currentDraftRef.current?.pageElement || dragRef.current?.pageElement;
    const targetSize = pageSize || currentDraftRef.current?.pageSize || dragRef.current?.pageSize;
    if (!targetElement || !targetSize) return;
    const point = normalizePoint(getPointer(event, targetElement), targetSize);
    const currentDraft = currentDraftRef.current;

    if (currentDraft) {
      if (currentDraft.type === "pen" || currentDraft.type === "highlight") {
        const nextDraft = {
          ...currentDraft,
          points: [...currentDraft.points, point],
        };
        currentDraftRef.current = nextDraft;
        setDraft(nextDraft);
      } else {
        const nextDraft = {
          ...currentDraft,
          width: point.x - currentDraft.x,
          height: point.y - currentDraft.y,
        };
        currentDraftRef.current = nextDraft;
        setDraft(nextDraft);
      }
      return;
    }

    if (dragRef.current) {
      const { id, offset } = dragRef.current;
      commitAnnotations(
        (current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  x: point.x - offset.x,
                  y: point.y - offset.y,
                }
              : item
          ),
        false
      );
    }
  }

  function finishAnnotation() {
    if (isErasingRef.current) {
      isErasingRef.current = false;
      erasedDuringStrokeRef.current = new Set();
      pushHistory(annotationsRef.current);
      scheduleSave(annotationsRef.current);
      return;
    }

    if (dragRef.current) {
      dragRef.current = null;
      pushHistory(annotationsRef.current);
      scheduleSave(annotationsRef.current);
      return;
    }

    const currentDraft = currentDraftRef.current;
    if (!currentDraft) return;

    const shouldKeep =
      currentDraft.type === "pen" ||
      currentDraft.type === "highlight" ||
      Math.abs(currentDraft.width || 0) > 0.004 ||
      Math.abs(currentDraft.height || 0) > 0.004;

    if (shouldKeep) {
      commitAnnotations((current) => [...current, normalizeAnnotationForSave(currentDraft)]);
    }

    stopCurrentSession();
  }

  function beginMove(event, annotation) {
    if (tool !== "select") return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const pageElement = event.currentTarget.closest('[data-testid^="core__page-layer-"]');
    if (!pageElement) return;
    const pageSize = {
      width: Math.max(1, pageElement.clientWidth),
      height: Math.max(1, pageElement.clientHeight),
    };
    const point = normalizePoint(getPointer(event, pageElement), pageSize);
    setSelectedId(annotation.id);
    if (annotation.type === "pen" || annotation.type === "highlight") return;
    dragRef.current = {
      id: annotation.id,
      offset: {
        x: point.x - (annotation.x || 0),
        y: point.y - (annotation.y || 0),
      },
      pageElement,
      pageSize,
    };
  }

  function updateText(id, text) {
    commitAnnotations((current) =>
      current.map((item) => (item.id === id ? { ...item, text } : item))
    );
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    historyIndexRef.current = nextIndex;
    const restored = JSON.parse(historyRef.current[nextIndex] || "[]");
    setAnnotations(restored);
    scheduleSave(restored);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    historyIndexRef.current = nextIndex;
    const restored = JSON.parse(historyRef.current[nextIndex] || "[]");
    setAnnotations(restored);
    scheduleSave(restored);
  }

  async function exportCurrentPdf() {
    if (isExporting) return;
    if (!canExportPdf) {
      onExportBlocked();
      return;
    }
    setExportError("");
    setIsExporting(true);

    try {
      await exportAnnotatedPdf({
        fileUrl: storageKey,
        annotations: annotationsRef.current,
        fileName: exportFileName,
      });
    } catch (error) {
      setExportError(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function renderShape(annotation, pageSize, isDraft = false) {
    const x = annotation.x * pageSize.width;
    const y = annotation.y * pageSize.height;
    const width = annotation.width * pageSize.width;
    const height = annotation.height * pageSize.height;
    const left = Math.min(x, x + width);
    const top = Math.min(y, y + height);
    const absWidth = Math.abs(width);
    const absHeight = Math.abs(height);
    const common = {
      "data-annotation-id": annotation.id,
      fill: "rgba(34, 211, 238, 0.08)",
      stroke: annotation.color,
      strokeWidth: annotation.strokeWidth,
      opacity: isDraft ? 0.78 : 1,
      className: tool === "select" ? "cursor-move" : "",
      style: { pointerEvents: tool === "select" || tool === "eraser" ? "auto" : "none" },
      onPointerDown: (event) => beginMove(event, annotation),
    };

    if (annotation.type === "ellipse") {
      return (
        <ellipse
          key={annotation.id}
          {...common}
          cx={left + absWidth / 2}
          cy={top + absHeight / 2}
          rx={absWidth / 2}
          ry={absHeight / 2}
        />
      );
    }

    if (annotation.type === "line" || annotation.type === "arrow") {
      return (
        <g key={annotation.id}>
          {annotation.type === "arrow" && (
            <defs>
              <marker id={`arrow-${annotation.id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill={annotation.color} />
              </marker>
            </defs>
          )}
          <line
            {...common}
            x1={x}
            y1={y}
            x2={x + width}
            y2={y + height}
            fill="none"
            markerEnd={annotation.type === "arrow" ? `url(#arrow-${annotation.id})` : undefined}
          />
        </g>
      );
    }

    return (
      <rect
        key={annotation.id}
        {...common}
        x={left}
        y={top}
        width={absWidth}
        height={absHeight}
        rx={8}
      />
    );
  }

  const visibleAnnotations = draft ? [...annotations, draft] : annotations;
  const isCreatingAnnotation =
    tool === "pen" || tool === "highlight" || tool === "shape" || tool === "text";

  function renderPageOverlay(pageElement) {
    const pageNumber = pageNumberFromLayer(pageElement);
    const pageSize = {
      width: Math.max(1, pageElement.clientWidth),
      height: Math.max(1, pageElement.clientHeight),
    };
    const pageAnnotations = visibleAnnotations.filter(
      (annotation) => Number(annotation.pageNumber || annotation.page || 1) === pageNumber
    );

    return createPortal(
      <div
        className="alevel-dojo-pdf-annotation-page absolute inset-0 z-[4]"
        data-pdf-annotation-page={pageNumber}
        style={{
          pointerEvents: isCreatingAnnotation || tool === "eraser" ? "auto" : "none",
          cursor: tool === "pen" ? PEN_CURSOR : undefined,
        }}
        onPointerDown={(event) => beginAnnotation(event, pageNumber, pageElement, pageSize)}
        onPointerMove={(event) => {
          if (tool === "eraser") {
            eraseAtPoint(event, pageNumber, pageElement, pageSize);
            return;
          }
          if (!currentDraftRef.current && !dragRef.current) return;
          moveAnnotationPointer(event, pageElement, pageSize);
        }}
        onPointerUp={finishAnnotation}
        onPointerCancel={finishAnnotation}
        onPointerLeave={() => {
          finishAnnotation();
          setEraserCursor(null);
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {pageAnnotations.map((annotation) => {
            if (annotation.type === "pen" || annotation.type === "highlight") {
              return (
                <path
                  key={annotation.id}
                  data-annotation-id={annotation.id}
                  d={pathFromPoints(annotation.points, pageSize)}
                  fill="none"
                  stroke={annotation.color}
                  strokeWidth={annotation.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={annotation.opacity}
                  className={tool === "eraser" ? "cursor-not-allowed" : ""}
                  style={{ pointerEvents: tool === "eraser" ? "auto" : "none" }}
                />
              );
            }

            if (annotation.type === "text") return null;
            return renderShape(annotation, pageSize, annotation.id === draft?.id);
          })}
        </svg>

        {tool === "eraser" && eraserCursor?.pageNumber === pageNumber && (
          <div
            className="pointer-events-none absolute z-30 rounded-full border border-cyan-200/90 bg-cyan-200/10 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            style={{
              left: eraserCursor.x - eraserRadius,
              top: eraserCursor.y - eraserRadius,
              width: eraserRadius * 2,
              height: eraserRadius * 2,
            }}
          />
        )}

        {pageAnnotations
          .filter((annotation) => annotation.type === "text")
          .map((annotation) => {
            const point = denormalizePoint(annotation, pageSize);
            const isSelected = selectedId === annotation.id;
            return (
              <div
                key={annotation.id}
                data-annotation-id={annotation.id}
                className="absolute"
                style={{
                  left: point.x,
                  top: point.y,
                  pointerEvents: tool === "select" || tool === "text" || tool === "eraser" ? "auto" : "none",
                }}
                onPointerDown={(event) => {
                  if (tool === "eraser") {
                    return;
                  }
                  event.stopPropagation();
                  setSelectedId(annotation.id);
                }}
              >
                {isSelected && (
                  <div className="absolute -top-9 left-0 z-20 flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/92 p-1 shadow-xl backdrop-blur">
                    <button
                      type="button"
                      title="Move text box"
                      className="cursor-move rounded-lg px-2 py-1 text-xs font-black text-cyan-100 hover:bg-white/10"
                      onPointerDown={(event) => beginMove(event, annotation)}
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      title="Delete text box"
                      onClick={() => deleteAnnotation(annotation.id)}
                      className="rounded-lg p-1 text-rose-200 hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <textarea
                  data-text-editor={annotation.id}
                  value={annotation.text}
                  placeholder="Type..."
                  onFocus={() => {
                    setSelectedId(annotation.id);
                    setActiveFlyout(null);
                  }}
                  onClick={() => setSelectedId(annotation.id)}
                  onChange={(event) => updateText(annotation.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      (event.key === "Delete" || event.key === "Backspace") &&
                      annotation.text.length === 0
                    ) {
                      event.preventDefault();
                      deleteAnnotation(annotation.id);
                    }
                  }}
                  onBlur={(event) => saveTextBoxMetrics(annotation.id, event.currentTarget)}
                  onMouseUp={(event) => saveTextBoxMetrics(annotation.id, event.currentTarget)}
                  className={`block resize rounded-lg border bg-white/92 px-2 py-1 leading-tight text-slate-950 outline-none ${
                    isSelected ? "border-cyan-300 ring-2 ring-cyan-300/30" : "border-white/50"
                  }`}
                  style={{
                    width: Math.max(140, annotation.width * pageSize.width),
                    height: Math.max(46, annotation.height * pageSize.height),
                    color: annotation.color,
                    fontSize: annotation.fontSize,
                    overflow: "auto",
                  }}
                />
              </div>
            );
          })}
      </div>,
      pageElement
    );
  }

  return (
    <>
      <span ref={markerRef} className="hidden" />
      {pageElements.map((pageElement) => (
        <Fragment key={pageElement.getAttribute("data-testid") || pageNumberFromLayer(pageElement)}>
          {renderPageOverlay(pageElement)}
        </Fragment>
      ))}

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4">
        <div className="pointer-events-auto relative rounded-[1.5rem] border border-white/10 bg-[#050816]/94 p-2 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          {activeFlyout && (
            <div className="absolute bottom-full left-1/2 mb-3 min-w-64 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#050816]/96 p-3 text-white shadow-2xl backdrop-blur-xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-white/45">
                {activeFlyout}
              </p>

              {(activeFlyout === "pen" || activeFlyout === "shape") && (
                <>
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    {compactColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setStrokeColor(color)}
                        aria-label={`Use ${colorLabels[color]} ink`}
                        title={colorLabels[color]}
                        className={`h-7 w-7 rounded-full border transition ${strokeColor === color ? "border-cyan-100 ring-2 ring-cyan-300 ring-offset-2 ring-offset-[#050816]" : "border-white/25 hover:border-white/55"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <label className="block text-xs font-bold text-white/45">
                    Stroke width
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={strokeWidth}
                      onChange={(event) => setStrokeWidth(Number(event.target.value))}
                      className="mt-2 w-full accent-cyan-300"
                    />
                  </label>
                </>
              )}

              {activeFlyout === "highlight" && (
                <>
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    {compactHighlightColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setHighlightColor(color)}
                        className={`h-8 rounded-xl border ${highlightColor === color ? "border-cyan-200" : "border-white/15"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <label className="block text-xs font-bold text-white/45">
                    Thickness
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={strokeWidth}
                      onChange={(event) => setStrokeWidth(Number(event.target.value))}
                      className="mt-2 w-full accent-cyan-300"
                    />
                  </label>
                </>
              )}

              {activeFlyout === "shape" && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {shapeChoices.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      aria-label={label}
                      onClick={() => setShapeType(id)}
                      className={`flex h-10 items-center justify-center rounded-xl ${
                        shapeType === id ? "bg-cyan-300 text-slate-950" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              )}

              {activeFlyout === "text" && (
                <>
                  <div className="mb-3 grid grid-cols-6 gap-2">
                    {["#0f172a", "#0e7490", "#7c3aed", "#be123c", "#ffffff"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTextColor(color)}
                        className={`h-7 w-7 rounded-full border ${textColor === color ? "border-cyan-200" : "border-white/15"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <label className="block text-xs font-bold text-white/45">
                    Font size
                    <input
                      type="range"
                      min="12"
                      max="34"
                      value={fontSize}
                      onChange={(event) => setFontSize(Number(event.target.value))}
                      className="mt-2 w-full accent-cyan-300"
                    />
                  </label>
                </>
              )}

              {activeFlyout === "eraser" && (
                <div className="grid grid-cols-3 gap-2">
                  {eraserSizes.map((sizeOption) => (
                    <button
                      key={sizeOption.id}
                      type="button"
                      onClick={() => setEraserSize(sizeOption.id)}
                      className={`rounded-xl px-3 py-2 text-xs font-black ${
                        eraserSize === sizeOption.id
                          ? "bg-cyan-300 text-slate-950"
                          : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                      }`}
                    >
                      {sizeOption.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {editorTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => chooseTool(id)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                  tool === id
                    ? "bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.22)]"
                    : "bg-transparent text-white/68 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon size={19} />
              </button>
            ))}

            <div className="mx-1 h-7 w-px bg-white/10" />

            <button
              type="button"
              title="Undo"
              aria-label="Undo"
              onClick={undo}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-white/68 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Undo2 size={19} />
            </button>
            <button
              type="button"
              title="Redo"
              aria-label="Redo"
              onClick={redo}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-white/68 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Redo2 size={19} />
            </button>

            <div className="mx-1 h-7 w-px bg-white/10" />

            <button
              type="button"
              title={isExporting ? "Exporting..." : "Export PDF"}
              aria-label="Export PDF"
              onClick={exportCurrentPdf}
              disabled={isExporting}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
            >
              <FileDown size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/88 px-3 py-1.5 text-xs font-bold text-white/65 backdrop-blur">
        <span>{isExporting ? "Exporting..." : exportError || saveStatus}</span>
        <span className="h-3 w-px bg-white/15" />
        <button
          type="button"
          onClick={resetPaperAnnotations}
          className="text-rose-200 hover:text-rose-100"
        >
          Reset paper
        </button>
      </div>
    </>
  );
}

function LegacyPdfEditorLayer({
  storageKey = "default-pdf",
  user = null,
  paperId = "",
  pdfType = "question",
}) {
  const wrapperRef = useRef(null);
  const toolbarRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const saveTimerRef = useRef(null);
  const loadingRef = useRef(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const toolRef = useRef("select");
  const isDrawingRef = useRef(false);

  const [tool, setTool] = useState("select");
  const [activeFlyout, setActiveFlyout] = useState(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#22d3ee");
  const [penWidth, setPenWidth] = useState(3);
  const [highlightColor, setHighlightColor] = useState(highlighterColors[0]);
  const [shapeType, setShapeType] = useState("rect");
  const [lineMode, setLineMode] = useState("line");
  const [stickyColor, setStickyColor] = useState(stickyColors[0]);
  const [textColor, setTextColor] = useState("#0f172a");
  const [textSize, setTextSize] = useState(18);

  const annotationKey = useMemo(
    () => paperId || storageKey || "default-pdf",
    [paperId, storageKey]
  );

  const serializeCanvas = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return emptyAnnotationPayload();
    return {
      pages: {
        1: fabricCanvas.toJSON(),
      },
    };
  }, []);

  const writeAnnotations = useCallback(async () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const annotations = serializeCanvas();

    try {
      localStorage.setItem(
        `pdf-editor-${annotationKey}-${pdfType}`,
        JSON.stringify(annotations)
      );
    } catch {}

    if (!user?.id || !paperId) {
      setSaveStatus("Saved locally");
      return;
    }

    setSaveStatus("Saving...");

    const { error } = await supabase.from("pdf_annotations").upsert(
      {
        user_id: user.id,
        paper_id: paperId,
        pdf_type: pdfType,
        annotations,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,paper_id,pdf_type" }
    );

    setSaveStatus(error ? "Save failed" : "Saved");
  }, [annotationKey, paperId, pdfType, serializeCanvas, user?.id]);

  const scheduleSave = useCallback(() => {
    if (loadingRef.current) return;

    setSaveStatus("Unsaved changes");

    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      writeAnnotations();
    }, 800);
  }, [writeAnnotations]);

  const pushHistory = useCallback(() => {
    if (loadingRef.current) return;

    const snapshot = JSON.stringify(serializeCanvas());
    const currentIndex = historyIndexRef.current;
    const nextHistory = historyRef.current.slice(0, currentIndex + 1);

    if (nextHistory[nextHistory.length - 1] === snapshot) return;

    nextHistory.push(snapshot);
    historyRef.current = nextHistory.slice(-60);
    historyIndexRef.current = historyRef.current.length - 1;
  }, [serializeCanvas]);

  const loadCanvasJson = useCallback(async (canvasJson) => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas || !canvasJson) return;

    loadingRef.current = true;
    const loaded = fabricCanvas.loadFromJSON(canvasJson, () => {
      fabricCanvas.requestRenderAll();
    });

    if (loaded && typeof loaded.then === "function") {
      await loaded;
    }

    fabricCanvas.getObjects().forEach((object) => {
      object.selectable = true;
      object.evented = true;
    });
    fabricCanvas.requestRenderAll();
    loadingRef.current = false;
  }, []);

  const loadAnnotations = useCallback(async () => {
    let savedPayload = null;

    if (user?.id && paperId) {
      const { data, error } = await supabase
        .from("pdf_annotations")
        .select("annotations")
        .eq("user_id", user.id)
        .eq("paper_id", paperId)
        .eq("pdf_type", pdfType)
        .maybeSingle();

      if (!error && data?.annotations) {
        savedPayload = data.annotations;
      }
    }

    if (!savedPayload) {
      try {
        const localSaved = localStorage.getItem(
          `pdf-editor-${annotationKey}-${pdfType}`
        );
        savedPayload = localSaved ? JSON.parse(localSaved) : null;
      } catch {}
    }

    if (savedPayload?.pages?.["1"] || savedPayload?.pages?.[1]) {
      await loadCanvasJson(savedPayload.pages["1"] || savedPayload.pages[1]);
    }

    pushHistory();
    setSaveStatus(savedPayload ? "Saved" : "Ready");
  }, [annotationKey, loadCanvasJson, paperId, pdfType, pushHistory, user?.id]);

  const applyDrawingBrush = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas?.freeDrawingBrush) return;

    fabricCanvas.freeDrawingBrush.color =
      toolRef.current === "highlighter" ? highlightColor : penColor;
    fabricCanvas.freeDrawingBrush.width =
      toolRef.current === "highlighter" ? Math.max(10, penWidth * 3) : penWidth;

    if ("strokeLineCap" in fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.strokeLineCap = "round";
    }

    if ("strokeLineJoin" in fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.strokeLineJoin = "round";
    }
  }, [highlightColor, penColor, penWidth]);

  const stopDrawing = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;
    isDrawingRef.current = false;
    setIsDrawing(false);

    if (fabricCanvas && (toolRef.current === "pen" || toolRef.current === "highlighter")) {
      fabricCanvas.isDrawingMode = false;

      if (fabricCanvas._isCurrentlyDrawing) {
        fabricCanvas._isCurrentlyDrawing = false;
      }

      fabricCanvas.requestRenderAll();
    }
  }, []);

  const startDrawing = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;

    if (!fabricCanvas || (toolRef.current !== "pen" && toolRef.current !== "highlighter")) {
      return;
    }

    isDrawingRef.current = true;
    setIsDrawing(true);
    fabricCanvas.isDrawingMode = true;
    fabricCanvas.selection = false;
    applyDrawingBrush();
  }, [applyDrawingBrush]);

  const setActiveTool = useCallback(
    (nextTool) => {
      stopDrawing();
      setTool(nextTool);
      toolRef.current = nextTool;
      setActiveFlyout(["pen", "highlighter", "shape", "line", "sticky", "text"].includes(nextTool) ? nextTool : null);
    },
    [stopDrawing]
  );

  useEffect(() => {
    function closeFlyoutOnOutsidePointer(event) {
      if (!toolbarRef.current || toolbarRef.current.contains(event.target)) return;
      setActiveFlyout(null);
    }

    document.addEventListener("pointerdown", closeFlyoutOnOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", closeFlyoutOnOutsidePointer);
    };
  }, []);

  useEffect(() => {
    let resizeObserver;
    let handleCanvasChange;
    let handleMouseDown;
    let handlePointerDown;
    let handlePointerMove;
    let initTimer;
    let upperCanvas;

    initTimer = setTimeout(() => {
      if (!canvasRef.current || fabricCanvasRef.current) return;

      const fabricCanvas = new Canvas(canvasRef.current, {
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = fabricCanvas;

      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color = "#22d3ee";
      fabricCanvas.freeDrawingBrush.width = 3;

      function resizeCanvas() {
        const wrapper = wrapperRef.current;
        if (!wrapper || !fabricCanvasRef.current) return;

        const width = wrapper.clientWidth;
        const height = wrapper.clientHeight;

        fabricCanvasRef.current.setDimensions({
          width,
          height,
        });

        fabricCanvasRef.current.calcOffset();
        fabricCanvasRef.current.requestRenderAll();
      }

      resizeCanvas();

      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });

      if (wrapperRef.current) {
        resizeObserver.observe(wrapperRef.current);
      }

      handleCanvasChange = () => {
        pushHistory();
        scheduleSave();
      };

      handleMouseDown = (event) => {
        const currentTool = toolRef.current;
        const pointer = fabricCanvas.getPointer(event.e);

        if (currentTool === "eraser") {
          if (event.target) {
            fabricCanvas.remove(event.target);
            fabricCanvas.discardActiveObject();
            fabricCanvas.requestRenderAll();
          }
          return;
        }

        if (currentTool === "text") {
          addTextboxAt(pointer.x, pointer.y);
          return;
        }

        if (currentTool === "sticky") {
          addStickyAt(pointer.x, pointer.y);
          return;
        }

        if (currentTool === "shape") {
          addShapeAt(pointer.x, pointer.y);
          return;
        }

        if (currentTool === "line") {
          addLineAt(pointer.x, pointer.y);
        }
      };

      handlePointerDown = (event) => {
        if (toolRef.current !== "pen" && toolRef.current !== "highlighter") return;
        startDrawing();

        if (typeof event.currentTarget.setPointerCapture === "function" && event.pointerId !== undefined) {
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      };

      handlePointerMove = () => {
        if (!isDrawingRef.current && (toolRef.current === "pen" || toolRef.current === "highlighter")) {
          fabricCanvas.isDrawingMode = false;
        }
      };

      fabricCanvas.on("object:added", handleCanvasChange);
      fabricCanvas.on("object:modified", handleCanvasChange);
      fabricCanvas.on("object:removed", handleCanvasChange);
      fabricCanvas.on("path:created", handleCanvasChange);
      fabricCanvas.on("text:changed", handleCanvasChange);
      fabricCanvas.on("mouse:down", handleMouseDown);

      upperCanvas = fabricCanvas.upperCanvasEl;
      if (upperCanvas) {
        upperCanvas.addEventListener("pointerdown", handlePointerDown, true);
        upperCanvas.addEventListener("pointermove", handlePointerMove, true);
        upperCanvas.addEventListener("pointerup", stopDrawing);
        upperCanvas.addEventListener("pointercancel", stopDrawing);
        upperCanvas.addEventListener("pointerleave", stopDrawing);
        upperCanvas.addEventListener("mouseup", stopDrawing);
        upperCanvas.addEventListener("mouseleave", stopDrawing);
        upperCanvas.addEventListener("touchend", stopDrawing);
        upperCanvas.addEventListener("touchcancel", stopDrawing);
      }

      window.addEventListener("pointerup", stopDrawing);
      window.addEventListener("mouseup", stopDrawing);
      window.addEventListener("blur", stopDrawing);

      loadAnnotations();
    }, 0);

    return () => {
      clearTimeout(initTimer);
      window.clearTimeout(saveTimerRef.current);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      const fabricCanvas = fabricCanvasRef.current;

      if (fabricCanvas) {
        if (handleCanvasChange) {
          fabricCanvas.off("object:added", handleCanvasChange);
          fabricCanvas.off("object:modified", handleCanvasChange);
          fabricCanvas.off("object:removed", handleCanvasChange);
          fabricCanvas.off("path:created", handleCanvasChange);
          fabricCanvas.off("text:changed", handleCanvasChange);
        }

        if (handleMouseDown) {
          fabricCanvas.off("mouse:down", handleMouseDown);
        }

        if (upperCanvas) {
          upperCanvas.removeEventListener("pointerdown", handlePointerDown, true);
          upperCanvas.removeEventListener("pointermove", handlePointerMove, true);
          upperCanvas.removeEventListener("pointerup", stopDrawing);
          upperCanvas.removeEventListener("pointercancel", stopDrawing);
          upperCanvas.removeEventListener("pointerleave", stopDrawing);
          upperCanvas.removeEventListener("mouseup", stopDrawing);
          upperCanvas.removeEventListener("mouseleave", stopDrawing);
          upperCanvas.removeEventListener("touchend", stopDrawing);
          upperCanvas.removeEventListener("touchcancel", stopDrawing);
        }

        window.removeEventListener("pointerup", stopDrawing);
        window.removeEventListener("mouseup", stopDrawing);
        window.removeEventListener("blur", stopDrawing);

        writeAnnotations();
        fabricCanvas.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [loadAnnotations, pushHistory, scheduleSave, startDrawing, stopDrawing, writeAnnotations]);

  useEffect(() => {
    toolRef.current = tool;

    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode =
      (tool === "pen" || tool === "highlighter") && isDrawingRef.current;

    if (tool === "pen" || tool === "highlighter") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";
      applyDrawingBrush();
    }

    if (tool === "select") {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = "default";
    }

    if (tool === "text") {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "text";
    }

    if (["sticky", "shape", "line"].includes(tool)) {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";
    }

    if (tool === "eraser") {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "not-allowed";
    }

    fabricCanvas.getObjects().forEach((object) => {
      object.selectable = tool === "select";
      object.evented = tool === "select" || tool === "eraser";
    });

    fabricCanvas.calcOffset();
    fabricCanvas.requestRenderAll();
  }, [applyDrawingBrush, highlightColor, penColor, penWidth, tool]);

  const deleteSelected = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const activeObjects = fabricCanvas.getActiveObjects();

    activeObjects.forEach((object) => {
      fabricCanvas.remove(object);
    });

    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }, []);

  const clearCanvas = useCallback(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    fabricCanvas.requestRenderAll();
    try {
      localStorage.removeItem(`pdf-editor-${annotationKey}-${pdfType}`);
    } catch {}
  }, [annotationKey, pdfType]);

  function activateSelectAndEdit(object) {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas || !object) return;

    setTool("select");
    fabricCanvas.setActiveObject(object);
    fabricCanvas.requestRenderAll();
  }

  function addTextboxAt(left = 180, top = 180) {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const textbox = new Textbox("Type here", {
      left,
      top,
      width: 220,
      fontSize: textSize,
      fill: textColor,
      backgroundColor: "rgba(255,255,255,0.92)",
      padding: 8,
      selectable: true,
      evented: true,
      editable: true,
    });

    fabricCanvas.add(textbox);
    activateSelectAndEdit(textbox);

    setTimeout(() => {
      if (typeof textbox.enterEditing === "function") textbox.enterEditing();
      if (typeof textbox.selectAll === "function") textbox.selectAll();
      fabricCanvas.requestRenderAll();
    }, 50);
  }

  function addStickyAt(left = 180, top = 180) {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const note = new Textbox("Revision note", {
      left,
      top,
      width: 180,
      fontSize: 16,
      fill: "#1f2937",
      backgroundColor: stickyColor,
      padding: 14,
      selectable: true,
      evented: true,
      editable: true,
    });

    fabricCanvas.add(note);
    activateSelectAndEdit(note);
  }

  function addShapeAt(left = 180, top = 180) {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const shared = {
      left,
      top,
      fill: "rgba(34, 211, 238, 0.12)",
      stroke: penColor,
      strokeWidth: 3,
      selectable: true,
      evented: true,
    };

    let shape;
    if (shapeType === "circle") {
      shape = new Circle({ ...shared, radius: 42 });
    } else if (shapeType === "triangle") {
      shape = new Triangle({ ...shared, width: 88, height: 78 });
    } else if (shapeType === "diamond") {
      shape = new Polygon(
        [
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 50, y: 100 },
          { x: 0, y: 50 },
        ],
        shared
      );
    } else if (shapeType === "pentagon") {
      shape = new Polygon(
        [
          { x: 50, y: 0 },
          { x: 100, y: 38 },
          { x: 82, y: 100 },
          { x: 18, y: 100 },
          { x: 0, y: 38 },
        ],
        shared
      );
    } else if (shapeType === "rounded") {
      shape = new Rect({ ...shared, width: 120, height: 72, rx: 18, ry: 18 });
    } else {
      shape = new Rect({ ...shared, width: 120, height: 72, rx: 2, ry: 2 });
    }

    fabricCanvas.add(shape);
    activateSelectAndEdit(shape);
  }

  function addLineAt(left = 180, top = 180) {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const line = new Line([left, top, left + 140, top], {
      stroke: penColor,
      strokeWidth: 4,
      strokeDashArray: lineMode === "dotted" ? [10, 10] : undefined,
      selectable: true,
      evented: true,
    });

    if (lineMode === "arrow") {
      line.set({ strokeDashArray: [0, 0] });
    }

    fabricCanvas.add(line);
    activateSelectAndEdit(line);
  }

  async function restoreHistory(index) {
    const snapshot = historyRef.current[index];
    if (!snapshot) return;
    historyIndexRef.current = index;
    const payload = JSON.parse(snapshot);
    await loadCanvasJson(payload.pages?.["1"] || payload.pages?.[1]);
    scheduleSave();
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    restoreHistory(historyIndexRef.current - 1);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    restoreHistory(historyIndexRef.current + 1);
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className="absolute left-0 top-[48px] bottom-0 z-30 w-full"
        style={{
          pointerEvents: tool ? "auto" : "none",
        }}
        onWheel={(event) => {
          const viewer = event.currentTarget
            .closest(".question-editor-panel")
            ?.querySelector(".rpv-core__viewer");

          if (viewer) {
            viewer.scrollTop += event.deltaY;
            viewer.scrollLeft += event.deltaX;
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div ref={toolbarRef} className="absolute left-4 top-20 z-[9999] flex items-start gap-3">
        <div className="flex flex-col items-center gap-1.5 rounded-[1.35rem] border border-white/10 bg-[#050816]/92 p-2 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          {toolOptions.map(({ id, label, icon: Icon }) => {
            const isActive = tool === id;
            return (
              <div key={id} className="relative">
                <button
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => setActiveTool(id)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                    isActive
                      ? "bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,0.25)]"
                      : "bg-transparent text-white/65 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                </button>
              </div>
            );
          })}

          <div className="my-1 h-px w-8 bg-white/10" />

          <button
            type="button"
            title="Undo"
            aria-label="Undo"
            onClick={undo}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Undo2 size={19} />
          </button>
          <button
            type="button"
            title="Redo"
            aria-label="Redo"
            onClick={redo}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-white/65 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Redo2 size={19} />
          </button>

          <div
            title={`${saveStatus}${isDrawing ? " - drawing" : ""}`}
            className={`mt-1 h-2.5 w-2.5 rounded-full ${
              saveStatus === "Save failed"
                ? "bg-rose-400"
                : saveStatus === "Saving..." || saveStatus === "Unsaved changes"
                  ? "bg-amber-300"
                  : "bg-emerald-300"
            }`}
          />
        </div>

        {activeFlyout && (
          <div className="min-w-56 rounded-2xl border border-white/10 bg-[#050816]/94 p-3 text-white shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                {activeFlyout}
              </p>
              <ChevronDown size={16} className="text-white/35" />
            </div>

            {(activeFlyout === "pen" || activeFlyout === "shape" || activeFlyout === "line") && (
              <>
                {activeFlyout === "pen" && (
                  <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: penColor, height: `${Math.max(2, penWidth)}px` }}
                    />
                  </div>
                )}
                <p className="mb-2 text-xs font-bold text-white/45">Colour</p>
                <div className="mb-3 grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Use ${color}`}
                      onClick={() => setPenColor(color)}
                      className={`h-7 w-7 rounded-full border ${
                        penColor === color ? "border-cyan-200" : "border-white/15"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </>
            )}

            {activeFlyout === "highlighter" && (
              <>
                <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      backgroundColor: highlightColor,
                      height: `${Math.max(8, penWidth * 2)}px`,
                    }}
                  />
                </div>
                <p className="mb-2 text-xs font-bold text-white/45">Highlight</p>
                <div className="mb-3 grid grid-cols-4 gap-2">
                  {highlighterColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHighlightColor(color)}
                      className={`h-8 rounded-xl border ${
                        highlightColor === color ? "border-cyan-200" : "border-white/15"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </>
            )}

            {(activeFlyout === "pen" || activeFlyout === "highlighter") && (
              <label className="block text-xs font-bold text-white/45">
                Width
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={penWidth}
                  onChange={(event) => setPenWidth(Number(event.target.value))}
                  className="mt-2 w-full accent-cyan-300"
                />
              </label>
            )}

            {activeFlyout === "shape" && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["rect", Square],
                  ["rounded", Square],
                  ["circle", CircleIcon],
                  ["triangle", TriangleIcon],
                  ["diamond", Square],
                  ["pentagon", Shapes],
                ].map(([id, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setShapeType(id)}
                    className={`flex h-10 items-center justify-center rounded-xl ${
                      shapeType === id ? "bg-cyan-300 text-slate-950" : "bg-white/[0.06] text-white/70"
                    }`}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            )}

            {activeFlyout === "line" && (
              <div className="grid grid-cols-3 gap-2">
                {["line", "arrow", "dotted"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLineMode(item)}
                    className={`rounded-xl px-3 py-2 text-sm font-bold capitalize ${
                      lineMode === item ? "bg-cyan-300 text-slate-950" : "bg-white/[0.06] text-white/70"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {activeFlyout === "sticky" && (
              <>
                <p className="mb-2 text-xs font-bold text-white/45">Note colour</p>
                <div className="mb-3 grid grid-cols-6 gap-2">
                  {stickyColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label="Sticky note colour"
                      onClick={() => setStickyColor(color)}
                      className={`h-7 w-7 rounded-full border ${
                        stickyColor === color ? "border-cyan-200" : "border-white/15"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-sm text-white/58">
                  Click the PDF to place an editable note.
                </p>
              </>
            )}

            {activeFlyout === "text" && (
              <>
                <p className="mb-2 text-xs font-bold text-white/45">Text colour</p>
                <div className="mb-3 grid grid-cols-5 gap-2">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label="Text colour"
                      onClick={() => setTextColor(color)}
                      className={`h-7 w-7 rounded-full border ${
                        textColor === color ? "border-cyan-200" : "border-white/15"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <label className="block text-xs font-bold text-white/45">
                  Size
                  <input
                    type="range"
                    min="12"
                    max="32"
                    value={textSize}
                    onChange={(event) => setTextSize(Number(event.target.value))}
                    className="mt-2 w-full accent-cyan-300"
                  />
                </label>
              </>
            )}

            <button
              type="button"
              onClick={() => setActiveFlyout(null)}
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-white/70 hover:bg-white/[0.08]"
            >
              Close options
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/88 px-3 py-1.5 text-xs font-bold text-white/65 backdrop-blur">
        <button
          type="button"
          onClick={writeAnnotations}
          className="text-cyan-200 hover:text-cyan-100"
        >
          Save
        </button>
        <span className="h-3 w-px bg-white/15" />
        <span>{saveStatus}</span>
      </div>
    </>
  );
}

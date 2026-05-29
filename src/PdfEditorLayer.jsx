import { useEffect, useRef, useState } from "react";
import { Canvas, PencilBrush, Textbox } from "fabric";

export default function PdfEditorLayer({ storageKey = "default-pdf" }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  const [tool, setTool] = useState(null);

  useEffect(() => {
    let resizeObserver;
    let saveCanvas;
    let initTimer;

    initTimer = setTimeout(() => {
      if (!canvasRef.current || fabricCanvasRef.current) return;

      const fabricCanvas = new Canvas(canvasRef.current, {
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = fabricCanvas;

      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color = "#2563eb";
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

      const saved = localStorage.getItem(`pdf-editor-${storageKey}`);

      if (saved) {
        const loaded = fabricCanvas.loadFromJSON(saved, () => {
          fabricCanvas.requestRenderAll();
        });

        if (loaded && typeof loaded.then === "function") {
          loaded.then(() => {
            fabricCanvas.requestRenderAll();
          });
        }
      }

      saveCanvas = () => {
        try {
          localStorage.setItem(
            `pdf-editor-${storageKey}`,
            JSON.stringify(fabricCanvas.toJSON())
          );
        } catch {}
      };

      fabricCanvas.on("object:added", saveCanvas);
      fabricCanvas.on("object:modified", saveCanvas);
      fabricCanvas.on("object:removed", saveCanvas);
      fabricCanvas.on("path:created", saveCanvas);
      fabricCanvas.on("text:changed", saveCanvas);
    }, 0);

    return () => {
      clearTimeout(initTimer);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      const fabricCanvas = fabricCanvasRef.current;

      if (fabricCanvas) {
        if (saveCanvas) {
          fabricCanvas.off("object:added", saveCanvas);
          fabricCanvas.off("object:modified", saveCanvas);
          fabricCanvas.off("object:removed", saveCanvas);
          fabricCanvas.off("path:created", saveCanvas);
          fabricCanvas.off("text:changed", saveCanvas);
        }

        fabricCanvas.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [storageKey]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = tool === "draw";

    if (tool === "draw") {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "crosshair";

      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = "#2563eb";
        fabricCanvas.freeDrawingBrush.width = 3;
      }
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

    if (tool === null) {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "default";
    }

    fabricCanvas.getObjects().forEach((object) => {
      object.selectable = tool === "select";
      object.evented = tool === "select";
    });

    fabricCanvas.calcOffset();
    fabricCanvas.requestRenderAll();
  }, [tool]);


  function deleteSelected() {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const activeObjects = fabricCanvas.getActiveObjects();

    activeObjects.forEach((object) => {
      fabricCanvas.remove(object);
    });

    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }

  function clearCanvas() {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    fabricCanvas.requestRenderAll();

    localStorage.removeItem(`pdf-editor-${storageKey}`);
  }
function addTextBox() {
  const fabricCanvas = fabricCanvasRef.current;
  if (!fabricCanvas) return;

  fabricCanvas.isDrawingMode = false;
  fabricCanvas.selection = true;

  const canvasWidth =
    typeof fabricCanvas.getWidth === "function"
      ? fabricCanvas.getWidth()
      : fabricCanvas.width;

  const canvasHeight =
    typeof fabricCanvas.getHeight === "function"
      ? fabricCanvas.getHeight()
      : fabricCanvas.height;

  const textbox = new Textbox("Type here", {
    left: canvasWidth / 2 - 110,
    top: Math.min(canvasHeight / 2 - 30, 220),
    width: 220,
    fontSize: 22,
    fill: "#111827",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 8,
    selectable: true,
    evented: true,
    editable: true,
  });

  fabricCanvas.add(textbox);
  fabricCanvas.setActiveObject(textbox);

  setTool("select");

  fabricCanvas.calcOffset();
  fabricCanvas.requestRenderAll();

  setTimeout(() => {
    fabricCanvas.setActiveObject(textbox);

    if (typeof textbox.enterEditing === "function") {
      textbox.enterEditing();
    }

    if (typeof textbox.selectAll === "function") {
      textbox.selectAll();
    }

    fabricCanvas.requestRenderAll();
  }, 50);
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

      <div className="fixed bottom-6 left-1/2 z-[999999] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
        <button
          onClick={() => setTool(tool === "select" ? null : "select")}
          className={`rounded-xl px-3 py-2 text-sm font-bold ${
            tool === "select"
              ? "bg-cyan-400 text-slate-950"
              : "bg-white/10 text-white"
          }`}
        >
          Select
        </button>

        <button
          onClick={() => setTool(tool === "draw" ? null : "draw")}
          className={`rounded-xl px-3 py-2 text-sm font-bold ${
            tool === "draw"
              ? "bg-cyan-400 text-slate-950"
              : "bg-white/10 text-white"
          }`}
        >
          Draw
        </button>

        <button
          onClick={addTextBox}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
        >
          Text
        </button>

        <button
          onClick={deleteSelected}
          className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white"
        >
          Delete
        </button>

        <button
          onClick={clearCanvas}
          className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white"
        >
          Clear
        </button>
      </div>
    </>
  );
}
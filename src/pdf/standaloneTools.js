import { MousePointer2, Highlighter, PenLine, Shapes, Type, Eraser, Hand, TextSelect, Sigma, ImagePlus, Ruler, Compass, Triangle, Calculator, Settings2 } from "lucide-react";

export const standaloneTools = [
  ["select", "Select annotations", MousePointer2], ["highlight-select", "Select highlights only", Highlighter], ["native", "Select PDF text", TextSelect], ["hand", "Pan document", Hand],
  ["pen", "Pen", PenLine], ["highlight", "Highlighter", Highlighter], ["text", "Text annotation", Type], ["math", "Math expression", Sigma],
  ["shape", "Shapes", Shapes], ["ruler", "Ruler", Ruler], ["protractor", "Protractor", Triangle], ["compass", "Compass", Compass],
  ["image", "Insert image", ImagePlus], ["eraser", "Eraser", Eraser], ["calculator", "Calculator", Calculator], ["settings", "Tool preferences", Settings2],
].map(([id, label, icon]) => ({ id, label, icon }));

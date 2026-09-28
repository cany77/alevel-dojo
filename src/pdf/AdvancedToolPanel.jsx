import { useRef, useState } from "react";
import { X, Square, Circle, Minus, MoveUpRight, Pentagon, Triangle, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Pipette } from "lucide-react";
import { standaloneTools } from "./standaloneTools";

const palette = ["#000000", "#0b1f4d", "#ef4444", "#f97316", "#facc15", "#22c55e", "#8b5cf6", "#ffffff", "#22d3ee"];
const mathSymbols = {
  Structures: ["\\frac{a}{b}", "\\sqrt{x}", "x^{2}", "x_{1}", "\\left(x\\right)", "\\sum_{i=1}^{n}i", "\\int_0^1 x\\,dx"],
  Functions: ["\\sin x", "\\cos x", "\\tan x", "\\log x", "\\ln x", "e^x"],
  Greek: ["\\alpha", "\\beta", "\\gamma", "\\theta", "\\lambda", "\\pi", "\\Delta", "\\Omega"],
  Operators: ["+", "-", "\\times", "\\div", "\\pm", "\\infty"],
  Comparisons: ["=", "\\neq", "\\leq", "\\geq", "\\approx"],
  Arrows: ["\\rightarrow", "\\leftarrow", "\\Rightarrow", "\\leftrightarrow"],
  Science: ["\\angle ABC", "90^\\circ", "\\perp", "\\parallel", "\\vec{F}", "\\mathrm{H}_2\\mathrm{O}"],
};
const descriptions = {
  select: "Click an annotation, or drag a box to select several.",
  "highlight-select": "Select existing highlights only.",
  native: "Select and copy PDF text.",
  hand: "Drag the document to pan around.",
  pen: "Draw on the PDF. Each press begins a new stroke.",
  highlight: "Add translucent marks over the page.",
  text: "Click the page to create a text box.",
  math: "Prepare an expression, then click to place it.",
  shape: "Choose a shape, then drag on the page.",
  ruler: "Draw a measurement on the page.",
  protractor: "Measure an angle on the page.",
  compass: "Draw a measured circle on the page.",
  image: "Prepare an image, then click to place it.",
  eraser: "Drag across annotations to remove them.",
  calculator: "A quick calculator alongside your working.",
  settings: "Adjust input and tool panel preferences.",
};

async function imageAsset(file) {
  if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 10*1024*1024) throw new Error("Images must be 10 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1,2048/Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width*scale); canvas.height = Math.round(bitmap.height*scale);
    canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
    return { image:canvas.toDataURL("image/png"), aspect:canvas.width/canvas.height, width:200 };
  } finally { bitmap.close(); }
}

function Button({ icon: Icon, label, active, onClick }) {
  return <button type="button" aria-label={label} title={label} aria-pressed={!!active} onClick={onClick} className={`local-pdf-icon ${active ? "!bg-cyan-300 !text-black" : ""}`}><Icon size={17}/></button>;
}

export default function AdvancedToolPanel({ tool, selectTool, extended: opts, setExtended, strokeColor, setStrokeColor, strokeWidth, setStrokeWidth, textColor, setTextColor, fontSize, setFontSize, shapeType, setShapeType, highlightColor, setHighlightColor, eraserSize, setEraserSize, selected, updateSelected, clear, close }) {
  const file = useRef(null);
  const [error, setError] = useState("");
  const [expression, setExpression] = useState(opts.asset?.source || "");
  const [symbols, setSymbols] = useState("Structures");
  const [rendering, setRendering] = useState(false);
  const [a, setA] = useState(""); const [b,setB] = useState(""); const [operator,setOperator] = useState("+");
  function update(changes) {
    setExtended(current=>({...current,...changes}));
    if (selected && selected.type === "text" && tool === "text") updateSelected(changes);
  }
  async function loadImage(image) { try { const asset=await imageAsset(image); update({asset}); setError(""); } catch(error) { setError(error.message); } }
  async function pasteImage() {
    try { const items=await navigator.clipboard.read(); for(const item of items) { const type=item.types.find(t=>/^image\/(png|jpeg|webp)$/.test(t)); if(type) { await loadImage(await item.getType(type)); return; } } throw new Error("No image on the clipboard. Use the image picker instead."); }
    catch { setError("Clipboard unavailable or no image found. Use Choose image instead."); }
  }
  async function renderMath() {
    setRendering(true); setError("");
    try {
      const { mathAsset }=await import("./mathAsset");
      const asset=await mathAsset(expression, textColor, fontSize);
      update({asset});
      if(selected?.type === "math") updateSelected(asset);
    } catch(error) { setError(error.message || "This expression could not render."); }
    finally { setRendering(false); }
  }
  const color=tool === "text" || tool === "math" ? textColor : tool === "highlight" ? highlightColor : strokeColor;
  function changeColor(value) { if(tool === "text" || tool === "math") { setTextColor(value); if(selected?.type==="text")updateSelected({color:value}); } else if(tool==="highlight")setHighlightColor(value); else setStrokeColor(value); }
  const showStyle=["pen","highlight","shape","text","math","ruler","protractor","compass"].includes(tool);
  const result = a === "" || b === "" ? "" : operator === "+" ? Number(a)+Number(b) : operator === "-" ? Number(a)-Number(b) : operator === "×" ? Number(a)*Number(b) : Number(b)===0 ? "Cannot divide by zero" : Number(a)/Number(b);
  return <div className="local-pdf-options">
    <header className="mb-1 flex items-center justify-between"><strong className="text-sm capitalize">{["ruler","protractor","compass"].includes(tool) ? "Measure" : ["select","highlight-select","native","hand"].includes(tool) ? "Select" : standaloneTools.find(t=>t.id===tool)?.label}</strong><Button icon={X} label="Close tool options" onClick={close}/></header>
    <p className="mb-4 text-xs leading-5 text-white/55">{descriptions[tool]}</p>
    {error && <p role="alert" className="mb-3 text-sm text-rose-200">{error}</p>}
    {["select","highlight-select","native","hand"].includes(tool) && <div className="local-pdf-option-group"><span className="local-pdf-option-label">Selection mode</span><div className="local-pdf-mode-grid">{[["select","Annotations"],["highlight-select","Highlights"],["native","PDF text"],["hand","Hand / pan"]].map(([id,label])=><button key={id} type="button" aria-pressed={tool===id} onClick={()=>selectTool(id)}>{label}</button>)}</div><p className="mt-2 text-xs text-white/50">For annotations, click to select or drag on empty space to select a group.</p></div>}
    {showStyle && <>
      <span className="local-pdf-option-label">{tool === "highlight" ? "Highlight colour" : "Colour"}</span>
      <div className="mb-3 flex flex-wrap gap-2">{(tool === "highlight" ? ["#a5f3fc","#fbcfe8","#fde68a","#ddd6fe","#bbf7d0"] : palette).map(c=><button key={c} aria-label={`Colour ${c}`} title={c} aria-pressed={color===c} className={`h-7 w-7 rounded-full border border-white/40 ${color===c?"ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950":""}`} style={{background:c}} onClick={()=>changeColor(c)}/>)}</div>
      <label>Custom colour<input aria-label="Custom colour" type="color" value={/^#[\da-f]{6}$/i.test(color)?color:"#22d3ee"} onChange={e=>changeColor(e.target.value)}/></label>
      {typeof window.EyeDropper === "function" && <Button icon={Pipette} label="Pick colour from screen" onClick={async()=>{try {const picked=await new window.EyeDropper().open();changeColor(picked.sRGBHex);}catch{/* User canceled. */}}}/>}
      {tool !== "highlight" && <label>Opacity<input type="range" min="0.1" max="1" step="0.05" value={opts.opacity ?? 1} onChange={e=>update({opacity:Number(e.target.value)})}/></label>}
      {!["text","math"].includes(tool) && <label>Width (PDF points)<input type="range" min="1" max={tool === "highlight" ? 30 : 12} value={strokeWidth} onChange={e=>setStrokeWidth(Number(e.target.value))}/></label>}
      {["pen","shape","ruler","protractor","compass"].includes(tool) && <label><input type="checkbox" checked={!!opts.dotted} onChange={e=>update({dotted:e.target.checked})}/> Dotted stroke</label>}
    </>}
    {tool === "shape" && <><div className="flex flex-wrap gap-1">{[["rect",Square],["ellipse",Circle],["line",Minus],["arrow",MoveUpRight],["triangle",Triangle],["polygon",Pentagon]].map(([id,Icon])=><Button key={id} icon={Icon} label={id} active={shapeType===id} onClick={()=>setShapeType(id)}/>)}</div>{shapeType === "polygon" && <label>Sides<input type="number" min="3" max="12" value={opts.sides||5} onChange={e=>update({sides:Number(e.target.value)})}/></label>}</>}
    {["text","math"].includes(tool) && <label>Font size (PDF points)<input type="number" min="8" max="96" value={fontSize} onChange={e=>{const value=Math.max(8,Math.min(96,Number(e.target.value)));setFontSize(value);if(selected?.type==="text")updateSelected({fontSize:value});}}/></label>}
    {tool === "text" && <>
      <label>Font<select value={opts.fontFamily||"Arial"} onChange={e=>update({fontFamily:e.target.value})}><option>Arial</option><option>Times New Roman</option><option>Courier New</option></select></label>
      <div className="my-2 flex flex-wrap gap-1">{[["bold",Bold],["italic",Italic],["underline",Underline],["strike",Strikethrough]].map(([id,Icon])=><Button key={id} icon={Icon} label={id} active={opts[id]} onClick={()=>update({[id]:!opts[id]})}/>)}{[["left",AlignLeft],["center",AlignCenter],["right",AlignRight]].map(([id,Icon])=><Button key={id} icon={Icon} label={`Align ${id}`} active={opts.align===id} onClick={()=>update({align:id})}/>)}</div>
      <label>List<select value={opts.list||"none"} onChange={e=>update({list:e.target.value})}><option value="none">None</option><option value="bullet">Bulleted</option><option value="number">Numbered</option></select></label>
      {[['background','Box background'],['textHighlight','Text highlight']].map(([id,label])=><label key={id}>{label}<input type="color" value={opts[id]&&opts[id]!=="transparent"?opts[id]:"#ffffff"} onChange={e=>update({[id]:e.target.value})}/><button onClick={()=>update({[id]:"transparent"})}>Transparent</button></label>)}
    </>}
    {tool === "math" && <>
      <label>Expression (TeX)<textarea aria-label="Math expression" value={expression} onChange={e=>setExpression(e.target.value)} maxLength={2000}/></label>
      <select aria-label="Symbol group" value={symbols} onChange={e=>setSymbols(e.target.value)}>{Object.keys(mathSymbols).map(group=><option key={group}>{group}</option>)}</select>
      <div className="my-2 flex flex-wrap gap-1">{mathSymbols[symbols].map(symbol=><button key={symbol} className="rounded border border-white/15 px-2 py-1 text-xs" onClick={()=>setExpression(value=>value+symbol)}>{symbol}</button>)}</div>
      <button className="local-pdf-action" disabled={!expression.trim()||rendering} onClick={renderMath}>{rendering?"Rendering...":selected?.type==="math"?"Update expression":"Prepare expression"}</button>
      {opts.asset?.image && <img alt="Expression preview" src={opts.asset.image} className="mt-2 max-h-28 max-w-full bg-white p-2"/>}
    </>}
    {tool === "image" && <><input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>loadImage(e.target.files?.[0])}/><button className="local-pdf-action" onClick={()=>file.current?.click()}>Choose image</button><button className="local-pdf-action" onClick={pasteImage}>Paste image</button><p className="mt-2 text-xs text-white/50">PNG, JPEG or WebP, up to 10 MB.</p>{opts.asset?.image&&<img alt="Image ready to place" src={opts.asset.image} className="mt-2 max-h-28 max-w-full"/>}</>}
    {["ruler","protractor","compass"].includes(tool) && <><span className="local-pdf-option-label">Instrument</span><div className="local-pdf-mode-grid">{[["ruler","Ruler"],["protractor","Protractor"],["compass","Compass"]].map(([id,label])=><button key={id} type="button" aria-pressed={tool===id} onClick={()=>selectTool(id)}>{label}</button>)}</div><label>Decimal places<input type="number" min="0" max="4" value={opts.decimals??1} onChange={e=>update({decimals:Math.max(0,Math.min(4,Number(e.target.value)))})}/></label><label>Scale (mm per PDF point)<input type="number" min="0.0001" step="0.001" value={opts.mmPerPoint||25.4/72} onChange={e=>update({mmPerPoint:Math.max(.0001,Number(e.target.value))})}/></label><p className="text-xs text-white/50">At 1:1, 72 PDF points = 25.4 mm. Calibrate for scaled drawings. Angles use the rightward horizontal baseline.</p></>}
    {tool === "eraser" && <><span className="local-pdf-option-label">Eraser size</span><div className="local-pdf-mode-grid">{["small","medium","large"].map(size=><button key={size} type="button" aria-pressed={eraserSize===size} onClick={()=>setEraserSize(size)}>{size}</button>)}</div><p className="mt-2 text-xs text-white/50">The circle cursor previews the erase area.</p><span className="local-pdf-option-label mt-4">Annotation targets</span>{["pen","highlight","rect","ellipse","line","arrow","triangle","polygon","text","math","image","ruler","protractor","compass"].map(type=><label key={type}><input type="checkbox" checked={opts.eraseTargets?.[type]!==false} onChange={e=>update({eraseTargets:{...opts.eraseTargets,[type]:e.target.checked}})}/> {type}</label>)}<div className="local-pdf-option-group mt-4"><span className="local-pdf-option-label">Clear annotations</span><button className="local-pdf-action" onClick={()=>clear("page")}>Clear current page</button><button className="local-pdf-action" onClick={()=>clear("all")}>Clear all pages</button></div></>}
    {tool === "settings" && <><label><input type="checkbox" checked={!!opts.touch} onChange={e=>update({touch:e.target.checked})}/> One-finger annotation</label><label>Tool panel<select value={opts.panel||"auto"} onChange={e=>update({panel:e.target.value})}><option value="auto">Auto</option><option value="open">Always open</option><option value="closed">Until requested</option></select></label><button className="local-pdf-action" onClick={()=>{setExtended({opacity:1,dotted:false,touch:false,panel:"auto"});setStrokeWidth(3);setStrokeColor("#22d3ee");setTextColor("#0f172a");setFontSize(18);}}>Reset tool preferences</button></>}
    {tool === "calculator" && <><input aria-label="First number" type="number" value={a} onChange={e=>setA(e.target.value)}/><select aria-label="Operation" value={operator} onChange={e=>setOperator(e.target.value)}>{["+","-","×","÷"].map(op=><option key={op}>{op}</option>)}</select><input aria-label="Second number" type="number" value={b} onChange={e=>setB(e.target.value)}/><output className="mt-3 block break-all text-xl text-cyan-200">{result}</output></>}
  </div>;
}

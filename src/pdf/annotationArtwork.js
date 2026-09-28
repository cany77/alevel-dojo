const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
const number = value => Number(value) || 0;
export function annotationBounds(item) {
  if (item.points?.length) {
    const xs = item.points.map(p => p.x); const ys = item.points.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  return { x: Math.min(item.x || 0, (item.x || 0) + (item.width || 0)), y: Math.min(item.y || 0, (item.y || 0) + (item.height || 0)), width: Math.abs(item.width || .02), height: Math.abs(item.height || .02) };
}

export function moveOrResize(item, dx, dy, target) {
  const bounds = annotationBounds(item);
  if (!target) return item.points ? { ...item, points: item.points.map(p => ({ x: p.x + dx, y: p.y + dy })) } : { ...item, x: item.x + dx, y: item.y + dy };
  if (item.points) return { ...item, points: item.points.map(p => ({ x: bounds.x + (p.x - bounds.x) * target.width / Math.max(.0001, bounds.width), y: bounds.y + (p.y - bounds.y) * target.height / Math.max(.0001, bounds.height) })) };
  return { ...item, width: Math.sign(item.width || 1) * target.width, height: Math.sign(item.height || 1) * target.height };
}

function textLines(item, width) {
  const size = item.fontSize || 18;
  const family = item.fontFamily || "Arial";
  const context = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (context) context.font = `${item.italic ? "italic" : "normal"} ${item.bold ? "bold" : "normal"} ${size}px ${family}`;
  const measure = text => context ? context.measureText(text).width : text.length * size * .55;
  const lines = [];
  String(item.text || "").split("\n").forEach((paragraph, index) => {
    let line = item.list === "bullet" ? "• " : item.list === "number" ? `${index + 1}. ` : "";
    for (const char of paragraph) {
      if (measure(line + char) > Math.max(size, width - 12) && line) { lines.push(line); line = ""; }
      line += char;
    }
    lines.push(line);
  });
  return { lines, measure };
}

export function annotationMarkup(a, width, height) {
  const x = number(a.x) * width, y = number(a.y) * height;
  const w = number(a.width) * width, h = number(a.height) * height;
  const left = Math.min(x, x + w), top = Math.min(y, y + h);
  const color = escape(a.color || "#000000");
  const opacity = Math.max(0, Math.min(1, a.opacity ?? 1));
  const stroke = Math.max(.25, a.strokeWidth || 2);
  const style = `stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"${a.dotted ? ` stroke-dasharray="${stroke} ${stroke * 3}"` : ""}`;
  let content = "";
  if (a.type === "pen" || a.type === "highlight") {
    const points = (a.points || []).map(p => ({ x: p.x * width, y: p.y * height }));
    if (!points.length) return "";
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L${points[i].x},${points[i].y}`;
    if (points.length === 1) d += ` l.01,.01`;
    content = `<path d="${d}" ${style}/>`;
  } else if (a.type === "image" || a.type === "math") {
    if (!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(a.image || "")) return "";
    content = `<image href="${a.image}" x="${left}" y="${top}" width="${Math.abs(w)}" height="${Math.abs(h)}" preserveAspectRatio="xMidYMid meet"/>`;
  } else if (a.type === "text") {
    const size = a.fontSize || 18;
    const { lines, measure } = textLines(a, Math.abs(w));
    const clip = `clip-${escape(a.id)}`;
    content = `<defs><clipPath id="${clip}"><rect x="${left}" y="${top}" width="${Math.abs(w)}" height="${Math.abs(h)}"/></clipPath></defs><g clip-path="url(#${clip})">`;
    if (a.background && a.background !== "transparent") content += `<rect x="${left}" y="${top}" width="${Math.abs(w)}" height="${Math.abs(h)}" fill="${escape(a.background)}"/>`;
    lines.forEach((line, index) => {
      const lineWidth = measure(line);
      const tx = a.align === "center" ? left + (Math.abs(w) - lineWidth) / 2 : a.align === "right" ? left + Math.abs(w) - lineWidth - 6 : left + 6;
      const ty = top + size + 4 + index * size * 1.25;
      if (a.textHighlight && a.textHighlight !== "transparent") content += `<rect x="${tx}" y="${ty - size}" width="${lineWidth}" height="${size * 1.2}" fill="${escape(a.textHighlight)}"/>`;
      content += `<text x="${tx}" y="${ty}" fill="${color}" font-family="${escape(a.fontFamily || "Arial")}" font-size="${size}" font-weight="${a.bold ? "bold" : "normal"}" font-style="${a.italic ? "italic" : "normal"}" text-decoration="${[a.underline && "underline", a.strike && "line-through"].filter(Boolean).join(" ")}">${escape(line)}</text>`;
    });
    content += "</g>";
  } else if (["line", "arrow", "ruler", "protractor"].includes(a.type)) {
    content = `<path d="M${x},${y} L${x+w},${y+h}" ${style}/>`;
    const angle = Math.atan2(h, w);
    if (a.type === "arrow") {
      const length = Math.max(10, stroke * 4);
      content += `<path d="M${x+w-Math.cos(angle-.45)*length},${y+h-Math.sin(angle-.45)*length} L${x+w},${y+h} L${x+w-Math.cos(angle+.45)*length},${y+h-Math.sin(angle+.45)*length}" ${style}/>`;
    }
    if (a.type === "ruler" || a.type === "protractor") {
      const value = a.type === "ruler" ? Math.hypot(w,h) * (a.mmPerPoint || 25.4/72) : Math.abs(angle * 180 / Math.PI);
      const label = `${value.toFixed(a.decimals ?? 1)} ${a.type === "ruler" ? "mm" : "°"}`;
      if (a.type === "protractor") content += `<path d="M${x},${y} h${Math.hypot(w,h)}" ${style}/>`;
      content += `<text x="${x+w/2+5}" y="${y+h/2-8}" font-family="Arial" font-size="14" fill="${color}">${label}</text>`;
    }
  } else if (a.type === "ellipse" || a.type === "compass") {
    content = `<ellipse cx="${left+Math.abs(w)/2}" cy="${top+Math.abs(h)/2}" rx="${Math.abs(w)/2}" ry="${Math.abs(h)/2}" ${style}/>`;
  } else if (a.type === "triangle" || a.type === "polygon") {
    const count = a.type === "triangle" ? 3 : Math.max(3, Math.min(12, a.sides || 5));
    const points = Array.from({ length: count }, (_, i) => `${left+Math.abs(w)/2 + Math.cos(i*2*Math.PI/count-Math.PI/2)*Math.abs(w)/2},${top+Math.abs(h)/2 + Math.sin(i*2*Math.PI/count-Math.PI/2)*Math.abs(h)/2}`).join(" ");
    content = `<polygon points="${points}" ${style}/>`;
  } else content = `<rect x="${left}" y="${top}" width="${Math.abs(w)}" height="${Math.abs(h)}" ${style}/>`;
  return `<g opacity="${opacity}">${content}</g>`;
}

export async function rasterAnnotations(items, width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${items.map(a => annotationMarkup(a,width,height)).join("")}</svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(2, 4096 / Math.max(width,height));
    const canvas = document.createElement("canvas"); canvas.width = Math.ceil(width*scale); canvas.height = Math.ceil(height*scale);
    canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL("image/png");
  } finally { URL.revokeObjectURL(url); }
}

import { mathjax } from "@mathjax/src/js/mathjax.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import "@mathjax/src/js/input/tex/base/BaseConfiguration.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";
import "@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const engine = mathjax.document("", { InputJax: new TeX({ packages: ["base", "ams", "newcommand"], maxBuffer: 4000 }), OutputJax: new SVG({ fontCache: "none" }) });

export async function mathAsset(source, color = "#000000", size = 18) {
  if (!source.trim() || source.length > 2000) throw new Error("Enter an expression up to 2,000 characters.");
  const node = await engine.convertPromise(source, { display: true, em: size, ex: size/2, containerWidth: 1000 });
  const svg = adaptor.tags(node,"svg")[0];
  if (!svg || adaptor.outerHTML(node).includes("data-mml-node=\"merror\"")) throw new Error("Check the expression syntax and try again.");
  const box = adaptor.getAttribute(svg,"viewBox").split(/\s+/).map(Number);
  const aspect = box[2]/box[3];
  const height = Math.max(size, box[3]/1000*size);
  const width = height*aspect;
  adaptor.setAttribute(svg,"width",String(width*3)); adaptor.setAttribute(svg,"height",String(height*3));
  adaptor.setAttribute(svg,"color",/^#[\da-f]{6}$/i.test(color)?color:"#000000");
  const url=URL.createObjectURL(new Blob([adaptor.outerHTML(svg)],{type:"image/svg+xml"}));
  try {
    const image=new Image(); image.src=url; await image.decode();
    const canvas=document.createElement("canvas");canvas.width=Math.ceil(width*3);canvas.height=Math.ceil(height*3);
    canvas.getContext("2d").drawImage(image,0,0);
    return { image:canvas.toDataURL("image/png"), source, aspect, width, color, fontSize:size };
  } finally {URL.revokeObjectURL(url);}
}

import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PDFDocument } from "pdf-lib";
import StandalonePdfEditor from "../src/StandalonePdfEditor";
import { saveLocalDraft, readLocalDraft } from "../src/pdf/localDrafts";
import { assembleLocalPdf } from "../src/pdf/localDocumentPdf";
import "../src/index.css";

export default function Harness() {
  const [key,setKey]=useState(0);
  const [exportCheck,setExportCheck]=useState("");
  const [fixtureId,setFixtureId]=useState(() => localStorage.getItem("alevel-dojo-local-pdf-active:local-regression-test") || "fixture");
  const [editorOpen,setEditorOpen]=useState(false);
  async function verifyExport() {
    try {
      const draft=await readLocalDraft("local-regression-test",fixtureId);
      const bytes=await assembleLocalPdf(draft,{annotations:true});
      const parsed=await PDFDocument.load(bytes);
      const original=await PDFDocument.load(draft.original.slice(0));
      setExportCheck(`Annotated export valid: ${parsed.getPageCount()} pages, ${draft.annotations.length} annotations. Original valid: ${original.getPageCount()} pages, ${draft.original.byteLength} bytes. View ${JSON.stringify(draft.view)}`);
    } catch (error) { setExportCheck(`Export failed: ${error.message}`); }
  }
  async function fixture() {
    const pdf=await PDFDocument.create();
    const id=`fixture-${Date.now()}`;
    for(let i=1;i<=3;i++){const page=pdf.addPage([595,842]);page.drawText(`Regression fixture page ${i}`,{x:40,y:770,size:22});page.drawText("Searchable physics and mathematics text.",{x:40,y:730,size:16});}
    await saveLocalDraft("local-regression-test",{id,name:"Regression fixture.pdf",original:(await pdf.save()).buffer,updatedAt:Date.now(),pages:[0,1,2].map(i=>({id:`${id}-page-${i}`,sourceIndex:i,width:595,height:842,rotation:0})),annotations:[],preferences:{},view:{}});
    setFixtureId(id);localStorage.setItem("alevel-dojo-local-pdf-active:local-regression-test",id);setKey(v=>v+1);
  }
  async function scannedFixture() {
    const canvas=document.createElement("canvas"); canvas.width=600; canvas.height=800;
    const context=canvas.getContext("2d"); context.fillStyle="white"; context.fillRect(0,0,600,800);
    context.fillStyle="black"; context.font="30px Arial"; context.fillText("Image-only sample page",40,100);
    const pdf=await PDFDocument.create(); const png=await pdf.embedPng(canvas.toDataURL("image/png"));
    pdf.addPage([600,800]).drawImage(png,{x:0,y:0,width:600,height:800});
    const id=`scanned-${Date.now()}`;
    await saveLocalDraft("local-regression-test",{id,name:"Image-only fixture.pdf",original:(await pdf.save()).buffer,updatedAt:Date.now(),pages:[{id:`${id}-page-0`,sourceIndex:0,width:600,height:800,rotation:0}],annotations:[],preferences:{},view:{}});
    setFixtureId(id);localStorage.setItem("alevel-dojo-local-pdf-active:local-regression-test",id);setKey(v=>v+1);
  }
  return <div style={{background:"#080c18",minHeight:"100vh",padding:16}}>{!editorOpen && <><aside>Dashboard sidebar</aside><nav>Dashboard top bar</nav></>}<button style={{color:"white",marginBottom:16}} onClick={fixture}>Create regression fixture</button><button style={{color:"white",margin:"0 12px"}} onClick={scannedFixture}>Create image-only fixture</button><button style={{color:"white",margin:"0 12px"}} onClick={verifyExport}>Verify flattened export</button><span role="status" style={{color:"white"}}>{exportCheck}</span><StandalonePdfEditor key={key} user={{id:"local-regression-test"}} authorizeOpen={async()=>true} canExport onExportBlocked={()=>{}} onDocumentOpenChange={setEditorOpen}/></div>;
}
const root=createRoot(document.getElementById("root"));
root.render(<Harness/>);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());

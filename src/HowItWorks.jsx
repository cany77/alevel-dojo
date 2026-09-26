import { memo, useRef, useState, useSyncExternalStore } from "react";
import { FileText, Check, Repeat2, Pause, Play, ChevronDown } from "lucide-react";
import "./HowItWorks.css";

const steps = [
  { title: "Find the right paper", description: "Choose your board, subject, unit, year and session to find exactly what you need.", context: "Paper finder / Physics" },
  { title: "Complete and mark it", description: "Write directly on the PDF and check your answers using the matching mark scheme.", context: "PDF Edit / Unit 1" },
  { title: "Track your progress", description: "Mark work complete, record mistakes and see what you should revise next.", context: "Home / Revision progress" },
];
function subscribeVisibility(notify) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
function subscribeMotion(notify) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
const isHidden = () => document.hidden;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverSnapshot = () => false;

function Count({ value }) {
  return <span className="workflow-count" aria-label={String(value)}>
    <span aria-hidden="true" className="workflow-count-strip" style={{ "--count": value }}>{Array.from({ length: value + 1 }, (_, n) => <span key={n}>{n}</span>)}</span>
  </span>;
}

function Preview({ step }) {
  if (step === 0) return <div className="workflow-demo-body">
    <dl className="workflow-selectors">{[["Exam board", "OxfordAQA"], ["Subject", "Physics"], ["Unit", "Unit 1"]].map(([label, value], i) => <div key={label} style={{ "--delay": `${i * 0.65}s` }}><dt>{label}</dt><dd>{value}<ChevronDown size={12} aria-hidden="true" /></dd></div>)}</dl>
    <div className="workflow-paper workflow-reveal" style={{ "--delay": "2s" }}>
      <div className="workflow-paper-heading"><FileText size={32} aria-hidden="true" /><div><h3>Physics Unit 1</h3><p>June 2025 · Question paper</p></div><span className="workflow-paper-tag">AS Level</span></div>
      <div className="workflow-paper-lines" aria-hidden="true"><i /><i /><i /></div>
      <div className="workflow-actions" aria-hidden="true"><span>Question Paper</span><span>Mark Scheme</span><span className="workflow-edit">PDF Edit</span></div>
    </div>
    <p className="workflow-caption workflow-reveal" style={{ "--delay": "2.5s" }}>Your paper and matching mark scheme, together.</p>
  </div>;
  if (step === 1) return <div className="workflow-demo-body">
    <div className="workflow-question"><h3>Question 1</h3><span>4 marks</span></div>
    <div className="workflow-question-lines" aria-hidden="true">{[0, 1, 2].map(i => <i className="workflow-draw" key={i} style={{ "--delay": `${i * 0.2}s` }} />)}<b className="workflow-annotation workflow-draw" style={{ "--delay": "0.9s" }} /></div>
    <div className="workflow-marking"><div className="workflow-working"><p>Your working</p><span className="workflow-draw" style={{ "--delay": "1.5s" }}>F = ma</span><span className="workflow-draw" style={{ "--delay": "2.1s" }}>2.0 × 3.0 = 6.0 N</span></div>
      <div className="workflow-checklist workflow-reveal" style={{ "--delay": "2.7s" }}><p>Mark scheme</p>{["Correct equation", "Substitution and units"].map((label, i) => <div key={label}><Check size={17} className="workflow-tick" style={{ "--delay": `${3.1 + i * 0.5}s` }} aria-hidden="true" /><span>{label}</span></div>)}</div>
    </div>
  </div>;
  return <div className="workflow-demo-body">
    <div className="workflow-metrics"><div><Count value={8} /><span>Papers completed</span></div><div><Count value={3} /><span>Topic tests completed</span></div></div>
    <div className="workflow-goal"><div><span>Weekly revision goal</span><span>3 / 4 sessions</span></div><div className="workflow-goal-track"><i /></div></div>
    <div className="workflow-activity" aria-label="Example weekly revision activity">{[28, 48, 35, 65, 52, 86, 70].map((height, i) => <div key={i}><i className="workflow-bar" style={{ height: `${height}%`, "--delay": `${1 + i * 0.12}s` }} /><span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span></div>)}</div>
    <div className="workflow-next workflow-reveal" style={{ "--delay": "2.4s" }}><span>Next revision</span><strong>Review your mechanics mistakes</strong></div>
  </div>;
}

export default memo(function HowItWorks() {
  const [selection, setSelection] = useState({ active: 0, run: 0 });
  const [userPaused, setUserPaused] = useState(false);
  const hidden = useSyncExternalStore(subscribeVisibility, isHidden, serverSnapshot);
  const reduced = useSyncExternalStore(subscribeMotion, reducedMotion, serverSnapshot);
  const tabs = useRef([]);
  const { active, run } = selection;
  function select(index) { setSelection(previous => ({ active: index, run: previous.run + 1 })); }
  function onKeyDown(event, index) {
    let next;
    if (["ArrowDown", "ArrowRight"].includes(event.key)) next = (index + 1) % steps.length;
    if (["ArrowUp", "ArrowLeft"].includes(event.key)) next = (index + steps.length - 1) % steps.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = steps.length - 1;
    if (next !== undefined) { event.preventDefault(); select(next); tabs.current[next]?.focus(); }
  }
  return <section aria-labelledby="workflow-heading" className="dojo-workflow" data-paused={hidden || userPaused} data-reduced={reduced}>
    <header className="workflow-heading"><h2 id="workflow-heading">How it works</h2><span>in 3 simple steps</span>{!reduced && <button type="button" className="workflow-playback" onClick={() => setUserPaused(value => !value)} aria-label={userPaused ? "Resume demonstration" : "Pause demonstration"} title={userPaused ? "Resume demonstration" : "Pause demonstration"}>{userPaused ? <Play size={15} /> : <Pause size={15} />}</button>}</header>
    <div className="workflow-layout"><div className="workflow-steps">
      <div role="tablist" aria-label="Revision workflow" aria-orientation="vertical" className="workflow-tabs">
        {steps.map(({ title, description }, index) => <button key={title} ref={el => { tabs.current[index] = el; }} type="button" role="tab" id={`workflow-step-${index}`} aria-controls={`workflow-panel-${index}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onKeyDown={event => onKeyDown(event, index)} onClick={() => select(index)} className="workflow-step">
          <span className="workflow-step-label">STEP {index + 1}<i /></span><span className="workflow-step-title">{title}</span><span className="workflow-description" aria-hidden={active !== index}><span>{description}</span></span>
          {active === index && <span key={run} aria-hidden="true" className="workflow-timer" onAnimationEnd={event => {
            // CSS preserves the clock's remaining time during pauses; no catch-up timers.
            if (event.animationName === "workflow-clock" && !hidden && !reduced && !userPaused) select((active + 1) % steps.length);
          }} />}
        </button>)}
      </div><p className="workflow-repeat"><Repeat2 size={14} aria-hidden="true" /><span>Repeat the process. Build progress. <em>Reach your target.</em></span></p>
    </div>
    <div className="workflow-window" aria-label="Illustrative revision workflow">{steps.map((step, index) => <div key={index} id={`workflow-panel-${index}`} role="tabpanel" aria-labelledby={`workflow-step-${index}`} aria-hidden={active !== index} inert={active !== index} tabIndex={active === index ? 0 : -1} className="workflow-panel" data-active={active === index}>
      <div className="workflow-window-header"><span className="workflow-window-dots" aria-hidden="true"><i /><i /><i /></span><span>{step.context}</span></div>
      <div key={active === index ? run : undefined} className="workflow-preview"><Preview step={index} /></div>
    </div>)}</div></div>
  </section>;
});

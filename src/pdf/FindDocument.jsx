import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";

export default function FindDocument({ search, open, close }) {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const input = useRef(null);
  const api = useRef(search);
  const searched = useRef("");
  useEffect(() => { api.current = search; });

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) { api.current.clearKeyword(); searched.current = ""; return; }
    const timer = setTimeout(() => {
      api.current.changeMatchCase(caseSensitive);
      api.current.setKeyword(query);
    }, 180);
    return () => clearTimeout(timer);
  }, [open, query, caseSensitive]);
  useEffect(() => {
    if (!open || !search.keyword) return;
    const key = `${search.keyword}:${search.matchCase}`;
    if (searched.current === key) return;
    searched.current = key;
    api.current.search();
  }, [open, search.keyword, search.matchCase]);

  if (!open) return null;
  const count = search.numberOfMatches;
  return <div className="local-pdf-find" role="search" aria-label="Find in document">
    <Search size={16} aria-hidden="true" />
    <input ref={input} value={query} onChange={event => setQuery(event.target.value)} placeholder="Find in document" aria-label="Find in document" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Enter") { event.preventDefault(); event.shiftKey ? search.jumpToPreviousMatch() : search.jumpToNextMatch(); }
    }} />
    <span className="local-pdf-find-count" aria-live="polite">{query ? count ? `${search.currentMatch} of ${count}` : "No matches" : ""}</span>
    <button type="button" title="Case sensitive" aria-label="Case sensitive" aria-pressed={caseSensitive} className={caseSensitive ? "is-active" : ""} onClick={() => setCaseSensitive(value => !value)}>Aa</button>
    <button type="button" title="Previous match" aria-label="Previous match" disabled={!count} onClick={() => search.jumpToPreviousMatch()}><ArrowUp size={16}/></button>
    <button type="button" title="Next match" aria-label="Next match" disabled={!count} onClick={() => search.jumpToNextMatch()}><ArrowDown size={16}/></button>
    <button type="button" title="Close find" aria-label="Close find" onClick={close}><X size={16}/></button>
    {query && !count && <span className="local-pdf-find-hint">Scanned pages without a text layer cannot be searched.</span>}
  </div>;
}

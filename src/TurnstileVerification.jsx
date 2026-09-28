import { useEffect, useRef, useState } from "react";
import { loadTurnstile, resolveTurnstileSiteKey } from "./lib/turnstile";

const configuredKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
const sitekey = resolveTurnstileSiteKey(configuredKey, import.meta.env.DEV);
if (import.meta.env.DEV && !configuredKey?.trim()) {
  console.info("[Turnstile] Local Site Key missing. Add VITE_CLOUDFLARE_TURNSTILE_SITE_KEY to .env.local and restart Vite. The widget must allow localhost; Supabase needs the matching private Secret Key.");
}

export default function TurnstileVerification({ onToken }) {
  const container = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading human verification...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let widget;
    let api;
    let expires;
    let resetTimer;
    onToken("");
    const removeWidget = () => {
      if (widget !== undefined) {
        api.remove(widget);
        widget = undefined;
      }
    };
    const invalidate = () => {
      clearTimeout(expires);
      onToken("");
    };
    const fail = () => {
      if (disposed) return;
      invalidate();
      clearTimeout(resetTimer);
      // Defer teardown until Cloudflare finishes invoking its callback.
      resetTimer = setTimeout(() => { if (!disposed) removeWidget(); }, 0);
      setFailed(true);
      setStatus("Human verification could not load. Please try again.");
    };
    const expire = () => {
      if (disposed) return;
      invalidate();
      setStatus("Verification expired. Please verify again.");
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (!disposed && widget !== undefined) {
          try { api.reset(widget); } catch { fail(); }
        }
      }, 0);
    };
    if (sitekey) loadTurnstile().then(turnstile => {
      if (disposed) return;
      api = turnstile;
      setStatus("Complete the human verification to continue.");
      widget = api.render(container.current, {
        sitekey, theme: "dark", size: "flexible", retry: "never",
        "refresh-expired": "manual",
        "response-field": false,
        callback: token => {
          if (disposed) return;
          clearTimeout(resetTimer);
          clearTimeout(expires);
          setFailed(false);
          setStatus("Verification complete.");
          onToken(token);
          // Clear locally before Cloudflare's five-minute validity limit as a backup.
          expires = setTimeout(expire, 290000);
        },
        "expired-callback": expire,
        "error-callback": fail,
        "timeout-callback": fail,
      });
    }).catch(fail);
    return () => {
      disposed = true;
      clearTimeout(expires);
      clearTimeout(resetTimer);
      removeWidget();
      onToken("");
    };
  }, [attempt, onToken]);

  function retry() {
    onToken("");
    setFailed(false);
    setStatus("Loading human verification...");
    setAttempt(value => value + 1);
  }

  return <div className="min-w-0 space-y-2">
    <div ref={container} />
    <p role="status" aria-live="polite" className="text-xs leading-5 text-white/60">{sitekey ? status : import.meta.env.DEV ? "Local verification setup: add the public Turnstile Site Key to .env.local, allow localhost on the widget, then restart Vite." : "Human verification is temporarily unavailable. Please try again shortly."}</p>
    {failed && <button type="button" onClick={retry} className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-400/20 focus-visible:outline-2 focus-visible:outline-cyan-300">Retry verification</button>}
  </div>;
}

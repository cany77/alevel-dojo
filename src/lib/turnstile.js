const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let pendingScript;

export function resolveTurnstileSiteKey(configured, development) {
  const key = typeof configured === "string" ? configured.trim() : "";
  // This app connects to the existing Supabase project; its secret must match this public key.
  if (!development && /^[123]x0{10,}/.test(key)) return "";
  return key;
}

export function loadTurnstile() {
  if (window.turnstile?.render) return Promise.resolve(window.turnstile);
  if (pendingScript) return pendingScript;
  pendingScript = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    const existing = Boolean(script);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
    }
    let finished = false;
    const cleanup = () => {
      clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
    };
    const failed = () => {
      if (finished) return;
      finished = true;
      cleanup();
      script.remove();
      pendingScript = undefined;
      reject(new Error("Human verification could not load. Please try again."));
    };
    const ready = () => {
      if (finished) return;
      if (!window.turnstile?.render) { failed(); return; }
      finished = true;
      cleanup();
      resolve(window.turnstile);
    };
    // The script load event is the readiness signal for asynchronous explicit rendering.
    const loaded = ready;
    const timeout = setTimeout(failed, 20000);
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (!existing) document.head.appendChild(script);
    else if (window.turnstile?.render) loaded();
  });
  return pendingScript;
}

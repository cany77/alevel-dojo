import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import { supabase } from "./supabaseClient";
import Watermark from "./Watermark";
import { logAuthDiagnostic } from "./authDiagnostics";

function callbackParameters() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    code: query.get("code"),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
    error: query.get("error") || hash.get("error"),
    errorCode: query.get("error_code") || hash.get("error_code"),
  };
}

export default function AuthCallbackPage({ onComplete = () => {}, onBackToSignIn = () => {} }) {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirming your A-Level Dojo account...");
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let active = true;
    let redirectTimer;

    function finishConfirmation(session) {
      if (!active || completedRef.current) return;
      completedRef.current = true;
      setStatus("success");
      setMessage("Email confirmed. Taking you to your account...");
      window.history.replaceState({}, "", "/auth/callback");
      redirectTimer = window.setTimeout(() => onCompleteRef.current(session?.user || null), 1000);
    }

    function failConfirmation(error) {
      if (!active || completedRef.current) return;
      logAuthDiagnostic("confirmation callback failed", {
        errorMessage: error || null,
        origin: window.location.origin,
        path: window.location.pathname,
      });
      setStatus("error");
      setMessage("This confirmation link is invalid or expired. Please resend the confirmation email.");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finishConfirmation(session);
    });

    async function confirmEmail() {
      const params = callbackParameters();
      if (params.error || params.errorCode) {
        failConfirmation(params.errorCode || params.error);
        return;
      }

      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (data.session) finishConfirmation(data.session);
        else {
          const { data: fallback } = await supabase.auth.getSession();
          if (fallback.session) finishConfirmation(fallback.session);
          else failConfirmation(error?.message);
        }
        return;
      }

      if (params.accessToken && params.refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });
        if (data.session) finishConfirmation(data.session);
        else {
          const { data: fallback } = await supabase.auth.getSession();
          if (fallback.session) finishConfirmation(fallback.session);
          else failConfirmation(error?.message);
        }
        return;
      }

      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession.session) {
        finishConfirmation(existingSession.session);
        return;
      }

      failConfirmation();
    }

    confirmEmail();
    return () => {
      active = false;
      window.clearTimeout(redirectTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060816] px-5 py-10 text-white">
      <Watermark />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(251,113,133,0.13),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(139,92,246,0.17),transparent_30%),radial-gradient(circle_at_70%_88%,rgba(34,211,238,0.09),transparent_26%)]" />
      <main className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0d1224]/95 p-8 text-center shadow-2xl shadow-black/35 backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
          {status === "success" ? <CheckCircle2 size={28} /> : <MailCheck size={28} />}
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">A-Level Dojo</p>
        <h1 className="mt-3 text-3xl font-black">{status === "success" ? "Account confirmed" : status === "error" ? "Confirmation failed" : "Confirming your account"}</h1>
        <p className={`mt-4 text-sm leading-7 ${status === "error" ? "text-rose-200" : "text-white/55"}`}>{message}</p>
        {status === "loading" && <div className="mx-auto mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" /></div>}
        {status === "error" && <button type="button" onClick={onBackToSignIn} className="mt-7 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-rose-400 px-5 py-4 font-black text-white">Back to Sign in</button>}
      </main>
    </div>
  );
}

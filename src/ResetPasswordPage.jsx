import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { supabase } from "./supabaseClient";
import Watermark from "./Watermark";

const INVALID_LINK_MESSAGE = "This reset link is invalid or expired. Please request a new password reset email.";

function recoveryParameters() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return {
    code: query.get("code"),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
    type: query.get("type") || hash.get("type"),
    error: query.get("error") || hash.get("error"),
    errorCode: query.get("error_code") || hash.get("error_code"),
  };
}

export default function ResetPasswordPage({ onComplete = () => {}, onBackToSignIn = () => {} }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    function markReady() {
      if (!active) return;
      setStatus("ready");
      setMessage("");
      window.history.replaceState({}, "", "/reset-password");
    }

    function markInvalid(details = "") {
      if (!active) return;
      setStatus("error");
      setMessage(details ? `${INVALID_LINK_MESSAGE} (${details})` : INVALID_LINK_MESSAGE);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) markReady();
    });

    async function initializeRecovery() {
      const params = recoveryParameters();
      if (params.error || params.errorCode) {
        markInvalid(params.errorCode || params.error);
        return;
      }

      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (data.session) markReady();
        else {
          const { data: fallback } = await supabase.auth.getSession();
          if (fallback.session) markReady();
          else markInvalid(error?.message);
        }
        return;
      }

      if (params.accessToken && params.refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });
        if (data.session) markReady();
        else {
          const { data: fallback } = await supabase.auth.getSession();
          if (fallback.session) markReady();
          else markInvalid(error?.message);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        markReady();
        return;
      }

      markInvalid();
    }

    initializeRecovery();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < 8) return setMessage("Use at least 8 characters for your new password.");
    if (password !== confirmPassword) return setMessage("The passwords do not match.");

    setStatus("loading");
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setStatus("error");
      setMessage(INVALID_LINK_MESSAGE);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("ready");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Password updated successfully. Taking you to your Home page...");
    window.setTimeout(onComplete, 1400);
  }

  const showForm = status === "ready" || status === "loading";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060816] px-5 py-10 text-white">
      <Watermark />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(251,113,133,0.13),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(139,92,246,0.17),transparent_30%),radial-gradient(circle_at_70%_88%,rgba(34,211,238,0.09),transparent_26%)]" />
      <main className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0d1224]/95 p-7 shadow-2xl shadow-black/35 backdrop-blur-xl md:p-9">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 font-black">A</div>
          <div><p className="font-black">A-Level Dojo</p><p className="text-xs text-white/45">Secure account recovery</p></div>
        </div>

        <div className="mb-6 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">{status === "success" ? <CheckCircle2 size={24} /> : <KeyRound size={24} />}</div>
        <h1 className="text-3xl font-black tracking-tight">Reset your password</h1>
        <p className="mt-3 text-sm leading-7 text-white/50">Choose a new password for your A-Level Dojo account.</p>

        {status === "checking" && <p className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-cyan-200">Verifying your secure reset link...</p>}

        {status === "success" && <div className="mt-7 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</div>}

        {status === "error" && (
          <div className="mt-7 space-y-4">
            <p role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-200">{message || INVALID_LINK_MESSAGE}</p>
            <button type="button" onClick={onBackToSignIn} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 font-black text-white transition hover:bg-white/[0.09]">Back to Sign in</button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="grid gap-2 text-sm font-bold text-white/60">New password<input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300" /></label>
            <label className="grid gap-2 text-sm font-bold text-white/60">Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300" /></label>
            {message && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-200">{message}</p>}
            <button type="submit" disabled={status === "loading"} className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-rose-400 px-5 py-4 font-black text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-45">{status === "loading" ? "Updating password..." : "Update password"}</button>
          </form>
        )}
      </main>
    </div>
  );
}

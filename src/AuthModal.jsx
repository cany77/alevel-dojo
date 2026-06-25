import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { supabase } from "./supabaseClient";
import { logAuthDiagnostic } from "./authDiagnostics";
import useResendCooldown from "./useResendCooldown";
import PasswordInput from "./PasswordInput";

export default function AuthModal({ showAuthModal, setShowAuthModal, email, setEmail, password, setPassword, signIn, signUp }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [shouldRender, setShouldRender] = useState(showAuthModal);
  const [visible, setVisible] = useState(false);
  const [authStatus, setAuthStatus] = useState("idle");
  const [authMessage, setAuthMessage] = useState("");
  const { secondsRemaining, startCooldown, coolingDown } = useResendCooldown();

  useEffect(() => {
    let timer;
    if (showAuthModal) {
      setShouldRender(true);
      setVisible(false);
      timer = setTimeout(() => setVisible(true), 40);
    } else {
      setVisible(false);
      timer = setTimeout(() => setShouldRender(false), 300);
    }
    return () => clearTimeout(timer);
  }, [showAuthModal]);

  if (!shouldRender) return null;

  const isSignUp = mode === "signup";
  const isForgotPassword = mode === "forgot";
  const isConfirmation = mode === "confirmation";

  function changeMode(nextMode) {
    setMode(nextMode);
    setConfirmPassword("");
    setAuthStatus("idle");
    setAuthMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isForgotPassword) {
      if (!email.trim()) return setAuthMessage("Enter your email address.");
      setAuthStatus("loading");
      setAuthMessage("");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setAuthStatus(error ? "error" : "success");
      setAuthMessage(error ? error.message : "Check your email for a secure reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthStatus("error");
      setAuthMessage("Passwords do not match.");
      return;
    }

    if (isSignUp) {
      setAuthStatus("loading");
      setAuthMessage("");
      const result = await signUp(name);
      if (!result?.ok) {
        setAuthStatus("error");
        setAuthMessage(result?.error || "Could not create your account.");
        return;
      }
      if (result.requiresConfirmation) {
        setConfirmationEmail(result.email || email.trim());
        setMode("confirmation");
        setAuthStatus("success");
        setAuthMessage("Check your email to confirm your account.");
      }
      return;
    }

    setAuthStatus("loading");
    setAuthMessage("");
    const result = await signIn();
    if (!result?.ok) {
      setAuthStatus("error");
      setAuthMessage(result?.error || "Could not sign in.");
    }
  }

  async function resendConfirmation() {
    const targetEmail = confirmationEmail || email.trim();
    if (!targetEmail) return setAuthMessage("Enter your email address and try again.");
    if (coolingDown) return;
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    startCooldown();
    setAuthStatus("loading");
    setAuthMessage("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo },
    });
    logAuthDiagnostic("confirmation resend response", {
      hasError: Boolean(error),
      errorMessage: error?.message || null,
      origin: window.location.origin,
      redirectUrl: emailRedirectTo,
    });
    setAuthStatus(error ? "error" : "success");
    setAuthMessage(error ? "We could not resend the email. Please wait and try again when the timer ends." : "Confirmation email resent. Check your inbox and spam.");
  }

  const subtitle = isConfirmation ? "Confirm your email" : isForgotPassword ? "Recover your account" : isSignUp ? "Create your account" : "Welcome back";

  return (
    <div onClick={() => setShowAuthModal(false)} className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 px-4 transition-all duration-300 ease-out ${visible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-none"}`}>
      <div onClick={(event) => event.stopPropagation()} className={`w-full max-w-[430px] rounded-[24px] border border-white/20 bg-[#17132d]/95 p-7 text-white shadow-2xl transition-all duration-300 ease-out ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"}`}>
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 font-black text-white">A</div>
            <div><h2 className="text-xl font-black">A-Level Dojo</h2><p className="text-sm text-white/45">{subtitle}</p></div>
          </div>
          <button type="button" onClick={() => setShowAuthModal(false)} aria-label="Close" className="text-2xl text-white/40 hover:text-white">&times;</button>
        </div>

        {isConfirmation ? (
          <div>
            <div className="mb-5 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-200"><MailCheck size={24} /></div>
            <h3 className="text-2xl font-black">Check your email</h3>
            <p className="mt-3 text-sm leading-7 text-white/55">We sent a confirmation link to <span className="font-bold text-white">{confirmationEmail}</span>. Confirm your account before signing in.</p>
            <p className="mt-3 text-xs leading-6 text-white/40">If it does not arrive, check spam or press resend. If it still does not arrive, email delivery may need SMTP setup in Supabase.</p>
            {authMessage && <p role="status" className={`mt-4 rounded-xl border p-3 text-sm ${authStatus === "error" ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100"}`}>{authMessage}</p>}
            <button type="button" onClick={resendConfirmation} disabled={authStatus === "loading" || coolingDown} className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-rose-400 py-4 font-black text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{authStatus === "loading" ? "Sending..." : coolingDown ? `Resend again in ${secondsRemaining}s` : "Resend confirmation email"}</button>
            <button type="button" onClick={() => changeMode("signin")} className="mt-3 w-full text-center text-sm font-bold text-white/50 hover:text-white">Back to sign in</button>
          </div>
        ) : (
          <>
            {!isForgotPassword && (
              <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/[0.04] p-1">
                <button type="button" onClick={() => changeMode("signin")} className={`rounded-lg py-3 font-bold transition ${!isSignUp ? "bg-[#ff554f] text-white" : "text-white/45 hover:text-white"}`}>Sign in</button>
                <button type="button" onClick={() => changeMode("signup")} className={`rounded-lg py-3 font-bold transition ${isSignUp ? "bg-[#ff554f] text-white ring-2 ring-white" : "text-white/45 hover:text-white"}`}>Sign up</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border border-white/25 bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-cyan-300" />}
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-xl border border-white/25 bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-cyan-300" />
              {!isForgotPassword && <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete={isSignUp ? "new-password" : "current-password"} />}
              {!isForgotPassword && <PasswordInput value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" autoComplete={isSignUp ? "new-password" : "current-password"} />}
              {authMessage && <p role="status" className={`text-sm ${authStatus === "error" ? "text-rose-300" : "text-cyan-200"}`}>{authMessage}</p>}
              <button type="submit" disabled={authStatus === "loading"} className="w-full rounded-xl bg-gradient-to-r from-rose-400 to-violet-500 py-4 font-black text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{authStatus === "loading" ? "Please wait..." : isForgotPassword ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}</button>
            </form>

            {!isSignUp && !isForgotPassword && <button type="button" onClick={() => changeMode("forgot")} className="mt-4 w-full text-center text-sm font-bold text-cyan-200 hover:text-cyan-100">Forgot password?</button>}
            {isForgotPassword && <button type="button" onClick={() => changeMode("signin")} className="mt-4 w-full text-center text-sm font-bold text-white/50 hover:text-white">Back to sign in</button>}
            {!isForgotPassword && <p className="mt-6 text-center text-xs leading-6 text-white/35">By continuing, you agree to our <span className="text-[#ff554f]">Terms</span> and <span className="text-[#ff554f]">Privacy Policy</span></p>}
          </>
        )}
      </div>
    </div>
  );
}

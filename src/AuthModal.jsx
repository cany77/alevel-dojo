import { useEffect, useState } from "react";

export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  email,
  setEmail,
  password,
  setPassword,
  signIn,
  signUp,
}) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [shouldRender, setShouldRender] = useState(showAuthModal);
  const [visible, setVisible] = useState(false);

useEffect(() => {
  let timer;

  if (showAuthModal) {
    setShouldRender(true);
    setVisible(false);

    timer = setTimeout(() => {
      setVisible(true);
    }, 40);
  } else {
    setVisible(false);

    timer = setTimeout(() => {
      setShouldRender(false);
    }, 300);
  }

  return () => clearTimeout(timer);
}, [showAuthModal]);
  if (!shouldRender) return null;

  const isSignUp = mode === "signup";

  function handleSubmit(event) {
    event.preventDefault();

    if (isSignUp) {
      signUp(name);
    } else {
      signIn();
    }
  }

  return (
    <div
  onClick={() => setShowAuthModal(false)}
  className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 px-4 transition-all duration-300 ease-out ${
    visible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-none"
  }`}
>
      <div
  onClick={(event) => event.stopPropagation()}
  className={`w-full max-w-[430px] rounded-[24px] border border-white/25 bg-[#17132d]/95 p-7 text-white shadow-2xl transition-all duration-300 ease-out ${
    visible
      ? "translate-y-0 scale-100 opacity-100"
      : "translate-y-8 scale-95 opacity-0"
  }`}
>
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff554f] font-black text-white">
              A
            </div>

            <div>
              <h2 className="text-xl font-black">A-Level Dojo</h2>
              <p className="text-sm text-white/45">
                {isSignUp ? "Create your account" : "Welcome back"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(false)}
            className="text-2xl text-white/40 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg py-3 font-bold transition ${
              !isSignUp
                ? "bg-[#ff554f] text-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-3 font-bold transition ${
              isSignUp
                ? "bg-[#ff554f] text-white ring-2 ring-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-[#ff554f]"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-[#ff554f]"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-white/35 bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-[#ff554f]"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-[#ff554f] py-4 font-black text-white transition hover:brightness-110"
          >
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 text-center text-sm text-white/35">or</div>

        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-white/35 py-3 text-white/70 hover:bg-white/5">
            Google
          </button>

          <button className="rounded-xl border border-white/35 py-3 text-white/70 hover:bg-white/5">
            GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-xs leading-6 text-white/35">
          By continuing, you agree to our{" "}
          <span className="text-[#ff554f]">Terms</span> and{" "}
          <span className="text-[#ff554f]">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
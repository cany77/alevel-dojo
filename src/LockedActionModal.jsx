import { useEffect, useState } from "react";
export default function LockedActionModal({
  showLockedModal,
  setShowLockedModal,
  setShowAuthModal,
}) {
    const [shouldRender, setShouldRender] = useState(showLockedModal);
const [visible, setVisible] = useState(false);

useEffect(() => {
  let timer;

  if (showLockedModal) {
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
}, [showLockedModal]);
  if (!shouldRender) return null;

  return (
    <div
  onClick={() => setShowLockedModal(false)}
  className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 px-4 transition-all duration-300 ease-out ${
  visible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-none"
}`}
>
      <div
  onClick={(event) => event.stopPropagation()}
  className={`w-full max-w-[430px] rounded-[24px] border border-white/25 bg-[#17132d]/95 p-8 text-center text-white shadow-2xl transition-all duration-300 ease-out ${
    visible
      ? "translate-y-0 scale-100 opacity-100"
      : "translate-y-8 scale-95 opacity-0"
  }`}
>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-[#ff554f]">
          🔒
        </div>

        <h2 className="text-2xl font-black">Sign in required</h2>

        <p className="mx-auto mt-4 max-w-[330px] text-base leading-7 text-white/55">
          Create a free account to access paper downloads — plus all papers,
          mark schemes, and revision tools.
        </p>

<button
  onClick={() => {
    setShowLockedModal(false);

    setTimeout(() => {
      setShowAuthModal(true);
    }, 180);
  }}
          className="mt-7 w-full rounded-xl bg-[#ff554f] py-4 font-black text-white transition hover:brightness-110"
        >
          Sign in or create account — free
        </button>

        <button
          onClick={() => setShowLockedModal(false)}
          className="mt-3 w-full rounded-xl border border-white/35 py-4 font-bold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          Maybe later
        </button>

        <div className="mt-6 flex items-center justify-center gap-5 text-xs text-white/30">
          <span>✓ Free forever</span>
          <span>✓ 494+ papers</span>
          <span>✓ AI tutor</span>
        </div>
      </div>
    </div>
  );
}
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
  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-black text-white">
            Welcome back
          </h2>

          <button
            onClick={() => setShowAuthModal(false)}
            className="text-2xl text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <p className="mb-6 text-slate-400">
          Login or create your account
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-2xl bg-slate-950 p-4 text-white outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-2xl bg-slate-950 p-4 text-white outline-none"
        />

        <div className="flex gap-3">
          <button
            onClick={signIn}
            className="flex-1 rounded-2xl bg-cyan-400 py-4 font-black text-slate-950"
          >
            Login
          </button>

          <button
            onClick={signUp}
            className="flex-1 rounded-2xl bg-white py-4 font-black text-slate-950"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
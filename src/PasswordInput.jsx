import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "current-password",
  className = "",
  inputClassName = "w-full rounded-xl border border-white/25 bg-transparent px-4 py-4 pr-12 text-white outline-none placeholder:text-white/35 focus:border-cyan-300",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        required
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Hide ${placeholder.toLowerCase()}` : `Show ${placeholder.toLowerCase()}`}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-cyan-200"
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}

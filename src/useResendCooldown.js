import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "aleveldojo_confirmation_resend_available_at";
const COOLDOWN_MS = 60_000;

function remainingSeconds() {
  try {
    const availableAt = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

export default function useResendCooldown() {
  const [secondsRemaining, setSecondsRemaining] = useState(remainingSeconds);

  useEffect(() => {
    if (secondsRemaining <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsRemaining(remainingSeconds()), 1000);
    return () => window.clearInterval(timer);
  }, [secondsRemaining > 0]);

  const startCooldown = useCallback(() => {
    const availableAt = Date.now() + COOLDOWN_MS;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(availableAt));
    } catch {}
    setSecondsRemaining(60);
  }, []);

  return { secondsRemaining, startCooldown, coolingDown: secondsRemaining > 0 };
}

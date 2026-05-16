import { useEffect, useMemo, useState } from "react";

export default function MockTimer({ baseMinutes = 90, initialExtraTime = 0 }) {
  const [extraTime, setExtraTime] = useState(initialExtraTime);
  const totalSeconds = useMemo(
    () => Math.round(baseMinutes * (1 + extraTime / 100)) * 60,
    [baseMinutes, extraTime]
  );

  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setSecondsLeft(totalSeconds);
    setRunning(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [running, secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
      <p className="text-sm font-bold text-cyan-200">Timed mock</p>

      <p className={`text-4xl font-black ${secondsLeft === 0 ? "text-red-300" : "text-white"}`}>
        {mins}:{String(secs).padStart(2, "0")}
      </p>

      <p className="text-sm text-slate-300">
        Base: {baseMinutes} min • Extra time: {extraTime}% • Total: {Math.round(baseMinutes * (1 + extraTime / 100))} min
      </p>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={extraTime}
        onChange={(e) => setExtraTime(Number(e.target.value))}
        className="mt-4 w-full"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setRunning(!running)}
          className="rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950"
        >
          {running ? "Pause" : "Start"}
        </button>

        <button
          onClick={() => {
            setRunning(false);
            setSecondsLeft(totalSeconds);
          }}
          className="rounded-xl bg-white/10 px-4 py-2 font-bold text-white"
        >
          Reset
        </button>

        <button
          onClick={() => {
            setRunning(false);
            setSecondsLeft(0);
          }}
          className="rounded-xl bg-red-500/20 px-4 py-2 font-bold text-red-200"
        >
          Stop
        </button>
      </div>

      {secondsLeft === 0 && <p className="mt-2 font-bold text-red-300">Time is up.</p>}
    </div>
  );
}
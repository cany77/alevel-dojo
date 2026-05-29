import { useEffect, useState } from "react";

export default function FloatingMockTimer({ onClose }) {
  const [extraTime, setExtraTime] = useState(0);
  const [seconds, setSeconds] = useState(90 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setSeconds((previous) => {
        if (previous <= 1) {
          setRunning(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function applyExtraTime(value) {
    setExtraTime(value);

    const baseTime = 90 * 60;
    const finalTime = Math.round(baseTime * (1 + value / 100));

    setSeconds(finalTime);
    setRunning(false);
  }

  function resetTimer() {
    const baseTime = 90 * 60;
    const finalTime = Math.round(baseTime * (1 + extraTime / 100));

    setSeconds(finalTime);
    setRunning(false);
  }

return (
  <div className="fixed left-8 top-3 z-[999999] w-[430px] rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
    <div className="mb-1 flex items-center justify-between">
      <p className="font-black text-purple-300">Mock Timer</p>

      <button
        onClick={onClose}
        className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white hover:bg-white/20"
      >
        ×
      </button>
    </div>

    <div className="grid grid-cols-[150px_1fr] gap-3">
      <div className="rounded-xl bg-black/30 p-3 text-center text-2xl font-black text-white">
        {formatTime(seconds)}
      </div>

      <div className="flex flex-col justify-center">
        <label className="text-xs font-bold text-slate-400">
          Extra time: {extraTime}%
        </label>

        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={extraTime}
          onChange={(event) => applyExtraTime(Number(event.target.value))}
          className="mt-2 w-full"
        />
      </div>
    </div>

    <div className="mt-3 flex gap-2">
      <button
        onClick={() => setRunning(!running)}
        className="flex-1 rounded-xl bg-purple-400 px-3 py-2 text-sm font-black text-slate-950"
      >
        {running ? "Pause" : "Start"}
      </button>

      <button
        onClick={resetTimer}
        className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-white"
      >
        Reset
      </button>
    </div>
  </div>
);
}
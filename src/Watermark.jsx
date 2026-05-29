export default function Watermark() {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[99999] select-none rounded-xl bg-slate-950/40 px-3 py-1 text-sm font-black text-white/25 backdrop-blur-sm">
      ALevelDojo by Ahmed Shantour
    </div>
  );
}
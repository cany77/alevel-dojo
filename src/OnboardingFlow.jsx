import React, { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft, Sparkles } from "lucide-react";
import Watermark from "./Watermark";
import { getAllSubjects, normalizeSubjectSelection, subjectLevelGroups, subjectToProfileSubject } from "./data/subjects";

const yearGroups = ["Year 12", "Year 13", "Private candidate", "Other"];
const examSeasons = ["June 2026", "Nov 2026", "Jan 2027", "June 2027", "Not sure yet"];
const weeklyGoals = ["2 hours", "5 hours", "10 hours", "15+ hours"];
const focusOptions = ["Past papers", "Topic tests", "Mistakes", "Grade boundaries", "AI tutor"];

export default function OnboardingFlow({ user, initialProfile = {}, onComplete = async () => {} }) {
  const allSubjects = useMemo(() => getAllSubjects(), []);
  const initialSubjectIds = useMemo(
    () => normalizeSubjectSelection(initialProfile?.subjects || initialProfile?.selected_subjects || [], allSubjects),
    [initialProfile?.subjects, initialProfile?.selected_subjects, allSubjects]
  );
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const preferences = initialProfile?.preferences || {};
  const [form, setForm] = useState({
    name: initialProfile?.full_name || initialProfile?.name || user?.user_metadata?.full_name || "",
    yearGroup: initialProfile?.year_group || "Year 13",
    subjectIds: initialSubjectIds,
    examSeason: preferences.examSeason || "Not sure yet",
    weeklyRevisionGoal: preferences.weeklyRevisionGoal || "5 hours",
    mainFocus: preferences.mainFocus || "Past papers",
  });

  const selectedSubjects = useMemo(
    () => allSubjects.filter((subject) => form.subjectIds.includes(subject.id)),
    [allSubjects, form.subjectIds]
  );

  const selectedSubjectLabels = useMemo(
    () => selectedSubjects.map((item) => `${item.displayName || item.name} (${item.board}, ${item.qualificationLabel})`).join(", "),
    [selectedSubjects]
  );

  function toggleSubject(subjectId) {
    setForm((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(subjectId)
        ? current.subjectIds.filter((id) => id !== subjectId)
        : [...current.subjectIds, subjectId],
    }));
  }

  async function finish() {
    setSaving(true);
    const savedSubjects = selectedSubjects.map(subjectToProfileSubject);
    await onComplete({
      full_name: form.name.trim(),
      name: form.name.trim(),
      year_group: form.yearGroup,
      subjects: savedSubjects,
      selected_subjects: savedSubjects,
      preferences: {
        ...preferences,
        examSeason: form.examSeason,
        weeklyRevisionGoal: form.weeklyRevisionGoal,
        mainFocus: form.mainFocus,
      },
      onboarding_completed: true,
    });
    setSaving(false);
  }

  const canContinue = step === 0 || (step === 1 && form.subjectIds.length > 0) || (step === 2 && form.name.trim() && form.yearGroup);

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <Watermark />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,92,82,0.13),transparent_26%),radial-gradient(circle_at_88%_14%,rgba(124,58,237,0.16),transparent_28%),radial-gradient(circle_at_74%_82%,rgba(34,211,238,0.08),transparent_24%)]" />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10">
        <section className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-violet-500 font-black">A</div>
                <div><p className="font-black">A-Level Dojo</p><p className="text-xs text-white/42">Set up your revision dashboard</p></div>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((item) => <span key={item} className={`h-2.5 w-10 rounded-full ${item <= step ? "bg-cyan-300" : "bg-white/12"}`} />)}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {step === 0 && (
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200"><Sparkles size={26} /></div>
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">Welcome to A-Level Dojo</h1>
                <p className="mt-5 text-base leading-8 text-white/58">Choose your subjects and set a simple revision profile. You can change everything later in Settings.</p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">Choose your subjects</h1>
                <p className="mt-3 text-white/55">Select the subjects and boards you are currently studying.</p>
                <div className="mt-8 space-y-8">
                  {subjectLevelGroups.map((level) => (
                    <section key={level.qualification} className="space-y-4">
                      <div>
                        <h2 className="text-xl font-black">{level.qualificationLabel}</h2>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {level.qualification === "a-level" ? "A-Level boards" : "GCSE and IGCSE boards"}
                        </p>
                      </div>
                      {level.groups.map((group) => (
                        <section key={group.board} className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
                          <div className="mb-3">
                            <h3 className="font-black text-white">{group.boardLabel || group.board}</h3>
                            <p className="mt-1 text-xs text-white/40">{group.description}</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {group.subjects.map((subject) => {
                              const selected = form.subjectIds.includes(subject.id);
                              return (
                                <button type="button" key={subject.id} onClick={() => toggleSubject(subject.id)} className={`rounded-2xl border p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${selected ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-slate-950/45 hover:bg-white/[0.05]"}`}>
                                  <div className="flex items-center justify-between gap-2"><span className="font-black">{subject.displayName || subject.name}</span>{selected && <Check size={18} className="text-cyan-200" />}</div>
                                  <p className="mt-2 text-xs text-white/42">{group.boardLabel || group.board}</p>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </section>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">Student profile</h1>
                <p className="mt-3 text-white/55">A few useful details to shape your revision dashboard.</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-white/60">Display name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Display name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-300" /></label>
                  <label className="grid gap-2 text-sm font-bold text-white/60">Year group<select value={form.yearGroup} onChange={(event) => setForm({ ...form, yearGroup: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300">{yearGroups.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-bold text-white/60">Exam season<select value={form.examSeason} onChange={(event) => setForm({ ...form, examSeason: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300">{examSeasons.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-bold text-white/60">Weekly revision goal<select value={form.weeklyRevisionGoal} onChange={(event) => setForm({ ...form, weeklyRevisionGoal: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300">{weeklyGoals.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-bold text-white/60 md:col-span-2">Main focus<select value={form.mainFocus} onChange={(event) => setForm({ ...form, mainFocus: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-300">{focusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                </div>
                <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-7 text-white/50">Selected subjects: {selectedSubjectLabels || "None selected yet"}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
            <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.05] disabled:opacity-35"><ChevronLeft size={16} /> Back</button>
            {step < 2 ? (
              <button type="button" onClick={() => setStep(step + 1)} disabled={!canContinue} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-3 text-sm font-black text-white transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-35">Continue <ArrowRight size={16} /></button>
            ) : (
              <button type="button" onClick={finish} disabled={saving || !canContinue} className="rounded-2xl bg-gradient-to-r from-rose-400 to-violet-500 px-6 py-3 text-sm font-black text-white transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:opacity-50">{saving ? "Saving..." : "Go to Home"}</button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

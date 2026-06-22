import { useState } from "react";
import { Mail, Send } from "lucide-react";

const initialForm = { name: "", email: "", subject: "", message: "", website: "" };

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not send your message.");
      setForm(initialForm);
      setStatus("sent");
      setFeedback("Message sent. We will get back to you soon.");
    } catch (error) {
      setStatus("error");
      setFeedback(error.message || "Could not send your message. Please try again.");
    }
  }

  const fieldClass = "w-full rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/10";

  return (
    <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:grid-cols-[0.75fr_1.25fr]">
      <div>
        <div className="mb-4 inline-flex rounded-xl bg-cyan-400/10 p-3 text-cyan-200"><Mail size={22} /></div>
        <h3 className="text-2xl font-black text-white">Contact the Dojo</h3>
        <p className="mt-3 max-w-sm text-sm leading-7 text-white/50">Questions, feedback, or a resource request? Send us a message and we will reply by email.</p>
        <a href="mailto:support@aleveldojo.com" className="mt-4 inline-block text-sm font-bold text-cyan-200 hover:text-cyan-100">support@aleveldojo.com</a>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <input required name="name" value={form.name} onChange={updateField} maxLength={80} placeholder="Name" className={fieldClass} />
        <input required type="email" name="email" value={form.email} onChange={updateField} maxLength={254} placeholder="Email" className={fieldClass} />
        <input required name="subject" value={form.subject} onChange={updateField} minLength={3} maxLength={120} placeholder="Subject" className={`${fieldClass} sm:col-span-2`} />
        <textarea required name="message" value={form.message} onChange={updateField} minLength={10} maxLength={5000} rows={5} placeholder="Message" className={`${fieldClass} resize-y sm:col-span-2`} />
        <input tabIndex={-1} autoComplete="off" name="website" value={form.website} onChange={updateField} className="hidden" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <p role="status" className={`text-sm ${status === "error" ? "text-rose-300" : "text-emerald-300"}`}>{feedback}</p>
          <button type="submit" disabled={status === "sending"} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
            <Send size={16} /> {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </div>
      </form>
    </div>
  );
}

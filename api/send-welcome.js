import { emailShell, escapeHtml, sendEmail, sendJson } from "./_lib/resend.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  const providedSecret = request.headers["x-supabase-webhook-secret"];
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return sendJson(response, 401, { error: "Unauthorized." });
  }

  const record = request.body?.record || request.body;
  const email = String(record?.email || "").trim().toLowerCase();
  const name = String(record?.full_name || record?.name || "Student").trim() || "Student";

  if (!email || !email.includes("@")) {
    return sendJson(response, 400, { error: "The profile record has no valid email." });
  }

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to A-Level Dojo",
      html: emailShell({
        eyebrow: "Welcome to the Dojo",
        title: `Welcome, ${escapeHtml(name)}.`,
        body: "<p>Your revision space is ready. Explore Past Papers, Topic Tests, Grade Boundaries, the Mistakes Tracker, and your AI Tutor whenever you are ready.</p><p>Good luck with your A-Levels. You have got this.</p>",
        action: `<a href="${escapeHtml(process.env.VITE_SITE_URL || "https://aleveldojo.com")}" style="display:inline-block;margin-top:18px;border-radius:12px;background:linear-gradient(90deg,#22d3ee,#8b5cf6,#fb7185);color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:800">Open A-Level Dojo</a>`,
      }),
    });
    return sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error("Welcome email failed:", error);
    return sendJson(response, 500, { error: "Welcome email could not be sent." });
  }
}

import { emailShell, escapeHtml, sendEmail, sendJson } from "./_lib/resend.js";

const attempts = new Map();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRateLimited(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const ip = String(forwarded || request.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 5;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const origin = request.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.host) {
        return sendJson(response, 403, { error: "Invalid request origin." });
      }
    } catch {
      return sendJson(response, 403, { error: "Invalid request origin." });
    }
  }

  if (isRateLimited(request)) {
    return sendJson(response, 429, { error: "Too many messages. Please try again later." });
  }

  const { name = "", email = "", subject = "", message = "", website = "" } = request.body || {};
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanSubject = String(subject).trim();
  const cleanMessage = String(message).trim();

  if (website) return sendJson(response, 200, { ok: true });
  if (cleanName.length < 2 || cleanName.length > 80) return sendJson(response, 400, { error: "Enter your name." });
  if (!EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > 254) return sendJson(response, 400, { error: "Enter a valid email address." });
  if (cleanSubject.length < 3 || cleanSubject.length > 120) return sendJson(response, 400, { error: "Enter a subject." });
  if (cleanMessage.length < 10 || cleanMessage.length > 5000) return sendJson(response, 400, { error: "Message must be between 10 and 5,000 characters." });

  const supportEmail = process.env.SUPPORT_EMAIL || "support@aleveldojo.com";

  try {
    await sendEmail({
      to: supportEmail,
      replyTo: cleanEmail,
      subject: `[Contact] ${cleanSubject}`,
      html: emailShell({
        eyebrow: "New contact message",
        title: escapeHtml(cleanSubject),
        body: `<p><strong>From:</strong> ${escapeHtml(cleanName)} (${escapeHtml(cleanEmail)})</p><p style="white-space:pre-wrap">${escapeHtml(cleanMessage)}</p>`,
      }),
    });

    await sendEmail({
      to: cleanEmail,
      subject: "We received your message · A-Level Dojo",
      html: emailShell({
        eyebrow: "Message received",
        title: `Thanks, ${escapeHtml(cleanName)}.`,
        body: "<p>We have received your message and will get back to you as soon as possible.</p><p>Good luck with your revision.</p>",
        action: `<a href="${escapeHtml(process.env.VITE_SITE_URL || "https://aleveldojo.com")}" style="display:inline-block;margin-top:18px;border-radius:12px;background:linear-gradient(90deg,#22d3ee,#8b5cf6,#fb7185);color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:800">Open A-Level Dojo</a>`,
      }),
    });

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error("Contact email failed:", error);
    return sendJson(response, 500, { error: "We could not send your message. Please try again." });
  }
}

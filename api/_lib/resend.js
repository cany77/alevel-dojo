const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function sendJson(response, status, body) {
  response.status(status).json(body);
}

export async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "A-Level Dojo <hello@aleveldojo.com>";

  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${details}`);
  }

  return response.json();
}

export function emailShell({ eyebrow, title, body, action = "" }) {
  return `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#060816;color:#f8fafc;font-family:Arial,sans-serif;padding:32px 16px">
      <div style="max-width:600px;margin:0 auto;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:#0d1224;padding:32px">
        <div style="display:inline-block;border-radius:12px;background:linear-gradient(135deg,#fb7185,#8b5cf6);padding:10px 13px;font-weight:800">A</div>
        <p style="margin:24px 0 8px;color:#67e8f9;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${eyebrow}</p>
        <h1 style="margin:0 0 18px;font-size:28px;line-height:1.2">${title}</h1>
        <div style="color:#cbd5e1;font-size:15px;line-height:1.75">${body}</div>
        ${action}
        <p style="margin:28px 0 0;border-top:1px solid rgba(255,255,255,.1);padding-top:20px;color:#64748b;font-size:12px">A-Level Dojo · Smarter A-Level revision</p>
      </div>
    </body>
  </html>`;
}

const fs = require("fs");
const path = require("path");

async function sendMail({ to, subject, text, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "Bloom Invoices <onboarding@resend.dev>";

  if (resendKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          text,
          html
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return { sent: true, provider: "resend", id: data.id || null };
      }

      await saveLocalMail({ to, subject, text, html, providerError: data.message || data.error || "Resend rejected email" });
      return { sent: false, provider: "local-outbox", error: data.message || data.error || "Resend rejected email" };
    } catch (error) {
      await saveLocalMail({ to, subject, text, html, providerError: error.message });
      return { sent: false, provider: "local-outbox", error: error.message };
    }
  }

  await saveLocalMail({ to, subject, text, html, providerError: "RESEND_API_KEY missing" });
  return { sent: false, provider: "local-outbox", error: "RESEND_API_KEY missing" };
}

async function saveLocalMail(message) {
  const outboxPath = path.resolve(__dirname, "..", "..", "work", "email-outbox.jsonl");
  const entry = {
    createdAt: new Date().toISOString(),
    ...message
  };

  try {
    fs.mkdirSync(path.dirname(outboxPath), { recursive: true });
    fs.appendFileSync(outboxPath, `${JSON.stringify(entry)}\n`);
  } catch {
    console.log("Email outbox write failed:", entry);
  }
}

module.exports = { sendMail };

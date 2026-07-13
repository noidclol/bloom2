const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const rawBody = event.body || "{}";
  if (!isValidSignature(rawBody, event.headers)) {
    return json(401, { error: "Invalid signature" });
  }

  let payment;
  try {
    payment = JSON.parse(rawBody);
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const paidStatuses = new Set(["confirmed", "finished"]);
  if (!paidStatuses.has(payment.payment_status)) {
    return json(200, { ok: true, ignored: payment.payment_status });
  }

  const email = extractEmail(payment.order_description || "");
  if (!email) {
    return json(200, { ok: false, error: "No email found on order" });
  }

  const accessKey = makeAccessKey(payment.order_id || payment.payment_id || Date.now());
  await sendAccessEmail(email, accessKey, payment);

  return json(200, { ok: true });
};

function isValidSignature(rawBody, headers) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) return true;

  const signature = headers["x-nowpayments-sig"] || headers["X-NOWPAYMENTS-SIG"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function extractEmail(text) {
  const match = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return match ? match[0] : "";
}

function makeAccessKey(seed) {
  const hash = crypto.createHash("sha256").update(String(seed)).digest("hex").slice(0, 16).toUpperCase();
  return `BLOOM-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

async function sendAccessEmail(email, accessKey, payment) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "Bloom <noreply@example.com>";

  if (!resendKey) {
    console.log("Paid order confirmed. Email delivery not configured.", { email, accessKey, paymentId: payment.payment_id });
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "Your Bloom access key",
      text: `Thanks for purchasing Bloom.\n\nYour access key is:\n${accessKey}\n\nOrder: ${payment.order_id || payment.payment_id}`
    })
  });
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}

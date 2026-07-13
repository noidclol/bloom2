const crypto = require("crypto");
const { sendMail } = require("./_mail");

const planPrices = {
  Weekly: 5,
  Monthly: 10,
  Lifetime: 25
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const plan = String(body.plan || "");
  const coin = String(body.coin || "BTC").toUpperCase();
  const email = String(body.email || "").trim();
  const priceUsd = planPrices[plan];

  if (!priceUsd) return json(400, { error: "Invalid plan" });
  if (!["BTC", "LTC", "ETH", "SOL"].includes(coin)) return json(400, { error: "Invalid coin" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Invalid email" });

  const configuredAddress = process.env[`${coin}_PAYMENT_ADDRESS`];
  const address = isUsableAddress(configuredAddress)
    ? configuredAddress
    : fallbackAddress(coin);

  const orderId = `bloom-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const accessKey = makeAccessKey(orderId);
  const statusPayload = {
    orderId,
    plan,
    coin,
    email,
    address,
    priceUsd,
    confirmationsRequired: 3
  };
  const statusUrl = makeStatusUrl(event, statusPayload);
  const emailDelivery = await sendInvoiceEmail({
    email,
    orderId,
    plan,
    coin,
    address,
    priceUsd,
    statusUrl
  });

  return json(200, {
    orderId,
    plan,
    coin,
    email,
    address,
    demoAddress: !isUsableAddress(configuredAddress),
    priceUsd,
    confirmationsRequired: 3,
    statusUrl,
    emailDelivery,
    accessKeyPreview: accessKey
  });
};

function isUsableAddress(address) {
  return Boolean(address && !String(address).startsWith("your_"));
}

function fallbackAddress(coin) {
  return {
    BTC: "bc1q-bloom-demo-wallet-address",
    LTC: "ltc1-bloom-demo-wallet-address",
    ETH: "0xBloomDemoWalletAddress",
    SOL: "sol-bloom-demo-wallet-address"
  }[coin];
}

function makeStatusUrl(event, payload) {
  const siteUrl = process.env.SITE_URL || requestOrigin(event) || "http://127.0.0.1:8888";
  const encoded = Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${siteUrl.replace(/\/$/g, "")}/#invoice-status=${encoded}`;
}

function requestOrigin(event) {
  const headers = event.headers || {};
  const host = headers.host || headers.Host;
  if (!host) return "";
  const proto = headers["x-forwarded-proto"] || headers["X-Forwarded-Proto"] || "http";
  return `${proto}://${host}`;
}

function makeAccessKey(seed) {
  const hash = crypto.createHash("sha256").update(String(seed)).digest("hex").slice(0, 16).toUpperCase();
  return `BLOOM-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

async function sendInvoiceEmail({ email, orderId, plan, coin, address, priceUsd, statusUrl }) {
  const text = [
    "Your Bloom invoice is ready.",
    "",
    `Order: ${orderId}`,
    `Plan: ${plan}`,
    `Total: $${priceUsd} USD`,
    `Payment coin: ${coin}`,
    `Wallet address: ${address}`,
    `Check invoice: ${statusUrl}`,
    "",
    "After your payment reaches 3 confirmations, Bloom will unlock your access key on-site and send the key by email.",
    "",
    "If you did not request this invoice, you can ignore this email."
  ].join("\n");

  return sendMail({
    to: email,
    subject: `Bloom payment invoice - ${plan} access`,
    text,
    html: invoiceHtml({ orderId, plan, coin, address, priceUsd, statusUrl })
  });
}

function invoiceHtml({ orderId, plan, coin, address, priceUsd, statusUrl }) {
  return emailShell(`
    <div style="text-align:center;padding:8px 0 24px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#ff8cea,#ff2ea6);box-shadow:0 18px 55px rgba(255,46,166,.35);line-height:72px;font-size:34px;">✿</div>
      <h1 style="margin:18px 0 8px;color:#fff8fc;font-size:34px;line-height:1;font-family:Arial,Helvetica,sans-serif;">Payment Invoice</h1>
      <p style="margin:0;color:#cdbbc7;font-size:15px;">Your Bloom order is reserved and ready for payment.</p>
    </div>

    <div style="border:1px solid rgba(240,140,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(255,85,219,.15),rgba(255,255,255,.035));padding:22px;margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:18px;">
        <div>
          <div style="color:#f08cff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Invoice</div>
          <div style="color:#fff;font-size:16px;font-weight:800;">${escapeHtml(orderId)}</div>
        </div>
        <div style="padding:9px 13px;border-radius:999px;background:rgba(255,46,166,.18);color:#f08cff;font-weight:800;font-size:13px;">Awaiting Payment</div>
      </div>

      ${row("Product", `Bloom ${plan} Access`)}
      ${row("Amount Due", `$${priceUsd} USD`)}
      ${row("Payment Method", coin)}
    </div>

    <div style="border:1px solid rgba(240,140,255,.22);border-radius:16px;background:#100b14;padding:20px;margin-bottom:18px;">
      <div style="color:#f08cff;font-size:13px;font-weight:800;margin-bottom:10px;">Payment Address</div>
      <div style="padding:14px;border-radius:12px;background:#19131f;color:#ff8cea;font-family:Consolas,Menlo,monospace;font-size:14px;line-height:1.45;word-break:break-all;">${escapeHtml(address)}</div>
    </div>

    <div style="border:1px solid rgba(34,220,117,.25);border-radius:16px;background:rgba(34,220,117,.07);padding:18px;">
      <div style="color:#22dc75;font-weight:900;margin-bottom:8px;">Next Steps</div>
      <ol style="margin:0;padding-left:20px;color:#d8cad4;line-height:1.7;">
        <li>Send the exact payment to the wallet above.</li>
        <li>Return to checkout and check confirmations.</li>
        <li>After 3 confirmations, your access key is shown on-site and emailed automatically.</li>
      </ol>
    </div>

    <div style="text-align:center;margin-top:20px;">
      <a href="${escapeHtml(statusUrl)}" style="display:inline-block;padding:15px 22px;border-radius:12px;background:linear-gradient(135deg,#f08cff,#ff2ea6);color:#fff;text-decoration:none;font-weight:900;">Check Invoice Status</a>
      <p style="margin:12px 0 0;color:#8f8190;font-size:12px;">Use this link after payment to check confirmations and receive your key.</p>
    </div>
  `);
}

function row(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-top:1px solid rgba(255,255,255,.07);">
      <span style="color:#cdbbc7;">${escapeHtml(label)}</span>
      <strong style="color:#fff8fc;">${escapeHtml(value)}</strong>
    </div>
  `;
}

function emailShell(content) {
  return `
    <div style="margin:0;padding:32px;background:#050407;font-family:Arial,Helvetica,sans-serif;color:#fff8fc;">
      <div style="max-width:620px;margin:0 auto;border:1px solid rgba(240,140,255,.2);border-radius:24px;background:radial-gradient(circle at 50% 0%,rgba(255,85,219,.18),transparent 280px),#08060c;padding:28px;box-shadow:0 28px 90px rgba(0,0,0,.35);">
        ${content}
        <p style="margin:22px 0 0;color:#8f8190;font-size:12px;text-align:center;">Bloom Quality Scripting Hub</p>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}

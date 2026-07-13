const crypto = require("crypto");
const { sendMail } = require("./_mail");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const orderId = String(body.orderId || "");
  const coin = String(body.coin || "").toUpperCase();
  const address = String(body.address || "");
  const email = String(body.email || "").trim();

  if (!orderId || !coin || !address) return json(400, { error: "Missing order details" });

  const status = await checkPublicChain(coin, address);
  const confirmed = status.confirmations >= 3 && status.detected;

  if (!confirmed) {
    return json(200, {
      paid: false,
      detected: status.detected,
      confirmations: status.confirmations,
      message: status.message || "Waiting for payment and confirmations."
    });
  }

  const accessKey = makeAccessKey(orderId);
  const emailDelivery = await sendAccessEmail(email, accessKey, orderId);
  const webhookDelivery = await sendDiscordWebhook({
    orderId,
    accessKey,
    coin,
    address,
    confirmations: status.confirmations
  });

  return json(200, {
    paid: true,
    detected: true,
    confirmations: status.confirmations,
    emailDelivery,
    webhookDelivery,
    accessKey
  });
};

async function checkPublicChain(coin, address) {
  if (coin === "BTC" || coin === "LTC") {
    const chain = coin === "BTC" ? "btc/main" : "ltc/main";
    const response = await fetch(`https://api.blockcypher.com/v1/${chain}/addrs/${address}`);
    if (!response.ok) return { detected: false, confirmations: 0, message: "Public chain API unavailable." };
    const data = await response.json();
    const txrefs = [...(data.txrefs || []), ...(data.unconfirmed_txrefs || [])];
    if (!txrefs.length) return { detected: false, confirmations: 0 };
    const confirmations = Math.max(...txrefs.map((tx) => tx.confirmations || 0));
    return { detected: true, confirmations };
  }

  if (coin === "ETH") {
    const key = process.env.ETHERSCAN_API_KEY;
    if (!key) return { detected: false, confirmations: 0, message: "Missing ETHERSCAN_API_KEY." };
    const response = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${key}`);
    const data = await response.json();
    const tx = Array.isArray(data.result) ? data.result[0] : null;
    if (!tx) return { detected: false, confirmations: 0 };
    return { detected: true, confirmations: Number(tx.confirmations || 0) };
  }

  if (coin === "SOL") {
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [address, { limit: 10 }]
      })
    });
    if (!response.ok) return { detected: false, confirmations: 0, message: "Solana public RPC unavailable." };
    const data = await response.json();
    const tx = Array.isArray(data.result) ? data.result[0] : null;
    if (!tx) return { detected: false, confirmations: 0 };
    const confirmations = tx.confirmationStatus === "finalized" ? 3 : tx.confirmationStatus === "confirmed" ? 1 : 0;
    return { detected: confirmations > 0, confirmations };
  }

  return { detected: false, confirmations: 0, message: "Unsupported coin." };
}

function makeAccessKey(seed) {
  const hash = crypto.createHash("sha256").update(String(seed)).digest("hex").slice(0, 16).toUpperCase();
  return `BLOOM-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

async function sendAccessEmail(email, accessKey, orderId) {
  if (!email) return;
  const text = [
    "Your Bloom payment is confirmed.",
    "",
    `Access key: ${accessKey}`,
    `Order: ${orderId}`,
    "",
    "Thanks for purchasing Bloom."
  ].join("\n");

  return sendMail({
    to: email,
    subject: "Your Bloom access key",
    text,
    html: keyHtml({ accessKey, orderId })
  });
}

async function sendDiscordWebhook({ orderId, accessKey, coin, address, confirmations }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { sent: false, reason: "DISCORD_WEBHOOK_URL missing" };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Bloom Orders",
        embeds: [
          {
            title: "Bloom Payment Confirmed",
            color: 16724961,
            fields: [
              { name: "Order", value: orderId || "Unknown", inline: false },
              { name: "Coin", value: coin || "Unknown", inline: true },
              { name: "Confirmations", value: String(confirmations || 0), inline: true },
              { name: "Wallet", value: `\`${address || "Unknown"}\``, inline: false },
              { name: "License Key", value: `\`${accessKey}\``, inline: false }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      })
    });

    return { sent: response.ok, status: response.status };
  } catch (error) {
    return { sent: false, error: error.message };
  }
}

function keyHtml({ accessKey, orderId }) {
  return `
    <div style="margin:0;padding:32px;background:#050407;font-family:Arial,Helvetica,sans-serif;color:#fff8fc;">
      <div style="max-width:620px;margin:0 auto;border:1px solid rgba(240,140,255,.22);border-radius:24px;background:radial-gradient(circle at 50% 0%,rgba(255,85,219,.18),transparent 280px),#08060c;padding:30px;text-align:center;">
        <div style="display:inline-block;width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#ff8cea,#ff2ea6);line-height:72px;font-size:34px;box-shadow:0 18px 55px rgba(255,46,166,.35);">✿</div>
        <h1 style="margin:18px 0 8px;color:#fff8fc;font-size:34px;line-height:1;">Access Granted</h1>
        <p style="margin:0 0 24px;color:#cdbbc7;">Your Bloom payment is confirmed.</p>
        <div style="padding:18px;border-radius:14px;background:#19131f;border:1px solid rgba(240,140,255,.22);color:#ff8cea;font-family:Consolas,Menlo,monospace;font-size:20px;font-weight:800;letter-spacing:.03em;word-break:break-all;">${escapeHtml(accessKey)}</div>
        <p style="margin:18px 0 0;color:#8f8190;font-size:12px;">Order ${escapeHtml(orderId)}</p>
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
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(data)
  };
}

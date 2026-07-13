const planPrices = {
  Weekly: 5,
  Monthly: 10,
  Lifetime: 25
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Missing NOWPAYMENTS_API_KEY" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const plan = String(body.plan || "");
  const coin = String(body.coin || "BTC").toLowerCase();
  const email = String(body.email || "").trim();
  const price = planPrices[plan];

  if (!price) return json(400, { error: "Invalid plan" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Invalid email" });

  const orderId = `bloom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const siteUrl = process.env.SITE_URL || "";

  const paymentPayload = {
    price_amount: price,
    price_currency: "usd",
    pay_currency: coin,
    order_id: orderId,
    order_description: `Bloom ${plan} access for ${email}`,
    ipn_callback_url: `${siteUrl}/.netlify/functions/nowpayments-webhook`,
    success_url: siteUrl,
    cancel_url: siteUrl
  };

  const response = await fetch("https://api.nowpayments.io/v1/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(paymentPayload)
  });

  const data = await response.json();
  if (!response.ok) {
    return json(response.status, { error: "Payment provider error", details: data });
  }

  return json(200, {
    orderId,
    paymentId: data.payment_id,
    payAddress: data.pay_address,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
    status: data.payment_status || "waiting"
  });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}

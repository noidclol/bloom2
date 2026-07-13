const navLinks = document.querySelectorAll(".tabs a[href^='#'], .hero-actions a[href^='#'], .back-link, .login-link[href^='#']");
const pages = document.querySelectorAll(".page");
const topNavLinks = document.querySelectorAll(".tabs a[href^='#']");
const loginLink = document.querySelector(".login-link");
const games = [
  {
    name: "Playground Basketball",
    status: "Live",
    note: "",
    image: "https://tr.rbxcdn.com/180DAY-fdc1bc2b2e22c06d68c8652f1fb5322e/768/432/Image/Webp/noFilter",
    features: [
      "Aimbot",
      "Speed",
      "Auto Block",
      "Ball Magnet"
    ],
    date: "2026-07-11"
  }
];

let activeSort = "Newest first";
let activeFilter = "All games";

function showPage(pageId) {
  const target = document.querySelector(pageId) || document.querySelector("#home");

  pages.forEach((page) => {
    page.classList.toggle("is-active", page === target);
  });

  topNavLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${target.id}`);
  });

  if (loginLink) {
    loginLink.textContent = "Login";
    loginLink.setAttribute("href", "#login");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    event.preventDefault();
    history.pushState(null, "", href);
    showPage(href);
  });
});

window.addEventListener("popstate", () => {
  showPage(location.hash || "#home");
});

showPage(location.hash || "#home");

const gameGrid = document.querySelector("#game-grid");
const gameSearch = document.querySelector("#game-search");
const gameCount = document.querySelector("#game-count");
const liveCount = document.querySelector("#live-count");
const emptyGames = document.querySelector("#empty-games");

function renderGames() {
  if (!gameGrid) return;

  const query = (gameSearch?.value || "").trim().toLowerCase();

  let visibleGames = games.filter((game) => {
    const featureText = (game.features || []).join(" ");
    const matchesSearch = `${game.name} ${game.note} ${game.status} ${featureText}`.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "All games" || game.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  visibleGames.sort((a, b) => {
    if (activeSort === "Name (A-Z)") return a.name.localeCompare(b.name);
    if (activeSort === "Status") return a.status.localeCompare(b.status);
    return new Date(b.date) - new Date(a.date);
  });

  gameGrid.innerHTML = visibleGames.map((game) => `
    <article class="game-card">
      <span class="game-badge">${game.status}</span>
      <div class="game-art${game.image ? " has-cover" : ""}">
        <img src="${game.image || "assets/bloom-icon.png"}" alt="${game.name}">
      </div>
      <div class="game-info">
        <h3>${game.name}</h3>
        ${game.note ? `<p>${game.note}</p>` : ""}
        ${(game.features || []).length ? `
          <ul class="game-feature-list">
            ${game.features.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
        ` : ""}
      </div>
    </article>
  `).join("");

  gameCount.textContent = String(games.length);
  liveCount.textContent = String(games.filter((game) => game.status === "Live").length);
  emptyGames.classList.toggle("is-visible", visibleGames.length === 0);
}

gameSearch?.addEventListener("input", renderGames);

document.querySelectorAll(".custom-select").forEach((select) => {
  const trigger = select.querySelector(":scope > button");
  const options = select.querySelectorAll(".select-menu button");

  trigger.addEventListener("click", () => {
    const isOpen = select.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;
      trigger.textContent = value;
      select.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");

      if (select.dataset.select === "sort") activeSort = value;
      if (select.dataset.select === "filter") activeFilter = value;
      renderGames();
    });
  });
});

document.addEventListener("click", (event) => {
  document.querySelectorAll(".custom-select.is-open").forEach((select) => {
    if (select.contains(event.target)) return;
    select.classList.remove("is-open");
    select.querySelector(":scope > button")?.setAttribute("aria-expanded", "false");
  });
});

renderGames();

const checkoutModal = document.querySelector("#checkout-modal");
const checkoutPanel = document.querySelector(".checkout-panel");
const checkoutTitle = document.querySelector("#checkout-title");
const checkoutPrice = document.querySelector("#checkout-price");
const checkoutSummaryPlan = document.querySelector("#checkout-summary-plan");
const checkoutSummaryPrice = document.querySelector("#checkout-summary-price");
const coinSelect = document.querySelector("#coin-select");
const coinTrigger = document.querySelector(".coin-trigger");
const coinSelectedImg = document.querySelector("#coin-selected-img");
const coinSelectedName = document.querySelector("#coin-selected-name");
const coinSelectedMeta = document.querySelector("#coin-selected-meta");
const walletAddress = document.querySelector("#wallet-address");
const checkoutEmail = document.querySelector("#checkout-email");
const invoiceStatus = document.querySelector("#invoice-status");
const createInvoiceButton = document.querySelector("#create-invoice");
const deliveredKey = document.querySelector("#delivered-key");
const keyEmailNote = document.querySelector("#key-email-note");
const statusOrder = document.querySelector("#status-order");
const statusTitle = document.querySelector("#status-title");
const statusCopy = document.querySelector("#status-copy");
const statusWallet = document.querySelector("#status-wallet");
const statusKey = document.querySelector("#status-key");
const statusCheck = document.querySelector("#status-check");
const statusPill = document.querySelector("#status-pill");
const statusCoin = document.querySelector("#status-coin");
const statusPlan = document.querySelector("#status-plan");
const statusTotal = document.querySelector("#status-total");
const statusProductName = document.querySelector("#status-product-name");
const statusProductCopy = document.querySelector("#status-product-copy");
const statusProductPrice = document.querySelector("#status-product-price");
const statusConfirmations = document.querySelector("#status-confirmations");
const statusProgressPayment = document.querySelector("#status-progress-payment");
const statusProgressKey = document.querySelector("#status-progress-key");
const copyWallet = document.querySelector("#copy-wallet");
const walletMap = {
  BTC: "bc1qy87gyxqt2axyxvan6vkacauha2v9t2lue03wtc",
  LTC: "LSYPkJLC6ep6CW8diehXEEnWtDBf41LUHn",
  ETH: "0x9F27d6594CdBEA53Ef02717A5b08056C7A1010Af",
  SOL: "3FeNLRTHjwS1BwTfwHosL4ogrKwiXoqUgh93oxkkyCb1"
};
const coinMeta = {
  BTC: { name: "Bitcoin", meta: "BTC network", img: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=040" },
  LTC: { name: "Litecoin", meta: "LTC network", img: "https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=040" },
  ETH: { name: "Ethereum", meta: "ETH mainnet", img: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040" },
  SOL: { name: "Solana", meta: "SOL network", img: "https://cryptologos.cc/logos/solana-sol-logo.png?v=040" }
};
let selectedCheckout = { plan: "Weekly", price: "$5", coin: "BTC" };
let selectedMethod = "crypto";
let activeOrder = null;

function setPaymentMethod(method) {
  selectedMethod = method;
  checkoutPanel?.setAttribute("data-method", method);
  document.querySelectorAll(".method-card").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.method === method);
  });

  if (method === "crypto" && !activeOrder) {
    const details = coinMeta[selectedCheckout.coin] || coinMeta.BTC;
    setCheckoutState("ready", `Ready for a <strong>${details.name}</strong> invoice. Enter your email and Bloom will send the payment details.`);
  }
}

function setSelectedCoin(coin) {
  const details = coinMeta[coin] || coinMeta.BTC;
  selectedCheckout.coin = coin;
  if (walletAddress) walletAddress.textContent = walletMap[coin] || walletMap.BTC;
  if (coinSelectedImg) {
    coinSelectedImg.src = details.img;
    coinSelectedImg.alt = `${details.name} logo`;
  }
  if (coinSelectedName) coinSelectedName.textContent = details.name;
  if (coinSelectedMeta) coinSelectedMeta.textContent = details.meta;

  document.querySelectorAll(".coin-menu button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.coin === coin);
  });
}

function setCheckoutState(state, message) {
  if (invoiceStatus) invoiceStatus.innerHTML = message;
}

function openCheckout(plan, price) {
  selectedCheckout.plan = plan;
  selectedCheckout.price = price;
  setSelectedCoin("BTC");
  checkoutTitle.textContent = `Buy ${plan}`;
  checkoutPrice.textContent = `${price} Bloom access`;
  if (checkoutSummaryPlan) checkoutSummaryPlan.textContent = `Bloom ${plan}`;
  if (checkoutSummaryPrice) checkoutSummaryPrice.textContent = price;
  activeOrder = null;
  setPaymentMethod("crypto");
  setCheckoutState("ready", "Choose a coin and enter your email. The full invoice and key vault open after this step.");
  checkoutModal.classList.add("is-open");
  checkoutModal.setAttribute("aria-hidden", "false");
}

document.querySelectorAll("[data-plan][data-price]").forEach((button) => {
  button.addEventListener("click", () => {
    openCheckout(button.dataset.plan, button.dataset.price);
  });
});

document.querySelector(".checkout-close")?.addEventListener("click", () => {
  checkoutModal.classList.remove("is-open");
  checkoutModal.setAttribute("aria-hidden", "true");
});

checkoutModal?.addEventListener("click", (event) => {
  if (event.target !== checkoutModal) return;
  checkoutModal.classList.remove("is-open");
  checkoutModal.setAttribute("aria-hidden", "true");
});

document.querySelectorAll(".method-card").forEach((button) => {
  button.addEventListener("click", () => {
    setPaymentMethod(button.dataset.method || "crypto");
  });
});

coinTrigger?.addEventListener("click", () => {
  const isOpen = coinSelect?.classList.toggle("is-open");
  coinTrigger.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

document.querySelectorAll(".coin-menu button").forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedCoin(button.dataset.coin);
    coinSelect?.classList.remove("is-open");
    coinTrigger?.setAttribute("aria-expanded", "false");
    if (!activeOrder) {
      const details = coinMeta[selectedCheckout.coin] || coinMeta.BTC;
      setCheckoutState("ready", `Ready for a <strong>${details.name}</strong> invoice. Add your email to continue.`);
    }
  });
});

document.addEventListener("click", (event) => {
  if (!coinSelect?.classList.contains("is-open")) return;
  if (coinSelect.contains(event.target)) return;
  coinSelect.classList.remove("is-open");
  coinTrigger?.setAttribute("aria-expanded", "false");
});

createInvoiceButton?.addEventListener("click", async () => {
  if (selectedMethod !== "crypto") return;

  const email = (checkoutEmail?.value || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setCheckoutState("ready", "Add a valid email first so Bloom can send your invoice and access key.");
    return;
  }

  createInvoiceButton.disabled = true;
  createInvoiceButton.textContent = "Creating invoice...";
  setCheckoutState("creating", "Creating your invoice and opening the order page...");

  try {
    const response = await fetch("/.netlify/functions/create-self-crypto-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: selectedCheckout.plan,
        coin: selectedCheckout.coin,
        email
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Invoice failed");
    }

    activeOrder = data;
    localStorage.setItem("bloomActiveOrder", JSON.stringify(data));
    checkoutModal.classList.remove("is-open");
    checkoutModal.setAttribute("aria-hidden", "true");
    loadStatusPage(data);
    history.pushState(null, "", "#invoice-status-page");
    showPage("#invoice-status-page");
  } catch (error) {
    walletAddress.textContent = walletMap[selectedCheckout.coin] || walletMap.BTC;
    setCheckoutState("ready", error.message || "Could not create invoice yet. Try again in a moment.");
  } finally {
    createInvoiceButton.disabled = false;
    createInvoiceButton.textContent = "Continue to Invoice";
  }
});

function decodeInvoiceFromHash() {
  const marker = "#invoice-status=";
  if (!location.hash.startsWith(marker)) return null;

  try {
    const encoded = location.hash.slice(marker.length).replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

function loadStatusPage(order) {
  const stored = order || JSON.parse(localStorage.getItem("bloomActiveOrder") || "null");
  if (!stored) return;

  activeOrder = stored;
  localStorage.setItem("bloomActiveOrder", JSON.stringify(stored));
  if (statusOrder) statusOrder.textContent = stored.orderId || "Invoice loaded";
  if (statusTitle) statusTitle.textContent = `${stored.plan || "Bloom"} invoice`;
  if (statusCopy) statusCopy.innerHTML = `Waiting for <strong>${stored.coin}</strong> payment approval. Check status after sending payment.`;
  if (statusWallet) statusWallet.textContent = stored.address || "Wallet unavailable";
  if (statusKey) statusKey.textContent = "LOCKED UNTIL PAYMENT CONFIRMS";
  if (statusPill) statusPill.textContent = "Pending";
  if (statusCoin) statusCoin.textContent = stored.coin || "Crypto";
  if (statusPlan) statusPlan.textContent = `Bloom ${stored.plan || "Access"}`;
  if (statusTotal) statusTotal.textContent = `$${stored.priceUsd || 0} USD`;
  if (statusProductName) statusProductName.textContent = `Bloom ${stored.plan || "Access"}`;
  if (statusProductCopy) statusProductCopy.textContent = `${stored.coin || "Crypto"} invoice for Bloom key delivery.`;
  if (statusProductPrice) statusProductPrice.textContent = `$${stored.priceUsd || 0}`;
  if (statusConfirmations) statusConfirmations.textContent = `0 / ${stored.confirmationsRequired || 3}`;
  statusProgressPayment?.classList.add("is-active");
  statusProgressPayment?.classList.remove("is-done");
  statusProgressKey?.classList.remove("is-active", "is-done");
}

copyWallet?.addEventListener("click", async () => {
  const wallet = statusWallet?.textContent || "";
  if (!wallet || wallet === "Waiting for invoice details") return;

  try {
    await navigator.clipboard.writeText(wallet);
    copyWallet.textContent = "Copied";
    setTimeout(() => {
      copyWallet.textContent = "Copy Wallet";
    }, 1400);
  } catch {
    copyWallet.textContent = "Copy failed";
  }
});

statusCheck?.addEventListener("click", async () => {
  const stored = activeOrder || JSON.parse(localStorage.getItem("bloomActiveOrder") || "null");
  if (!stored) {
    statusCopy.textContent = "No invoice is loaded yet. Create an invoice from checkout first.";
    return;
  }

  statusCheck.disabled = true;
  statusCopy.textContent = "Checking blockchain confirmations...";

  try {
    const response = await fetch("/.netlify/functions/check-self-crypto-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stored)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Status check failed");

    if (!data.paid) {
      statusCopy.innerHTML = `${data.message || "Payment not confirmed yet."}<br>Confirmations: <strong>${data.confirmations || 0}/3</strong>`;
      if (statusPill) statusPill.textContent = `${data.confirmations || 0}/3 Confirmed`;
      if (statusConfirmations) statusConfirmations.textContent = `${data.confirmations || 0} / 3`;
      return;
    }

    deliveredKey.textContent = data.accessKey;
    if (statusKey) statusKey.textContent = data.accessKey;
    if (statusPill) statusPill.textContent = "Approved";
    if (statusConfirmations) statusConfirmations.textContent = "3 / 3";
    statusProgressPayment?.classList.remove("is-active");
    statusProgressPayment?.classList.add("is-done");
    statusProgressKey?.classList.add("is-done");
    keyEmailNote.textContent = data.emailDelivery?.sent
      ? `Your key was emailed to ${stored.email}.`
      : `Your key was saved to the local email outbox for ${stored.email}.`;
    history.pushState(null, "", "#key");
    showPage("#key");
  } catch (error) {
    statusCopy.textContent = "Could not check this invoice yet. Try again in a moment.";
  } finally {
    statusCheck.disabled = false;
  }
});

const invoiceFromHash = decodeInvoiceFromHash();
if (invoiceFromHash) {
  loadStatusPage(invoiceFromHash);
  history.replaceState(null, "", "#invoice-status-page");
  showPage("#invoice-status-page");
} else if (location.hash === "#invoice-status-page") {
  loadStatusPage();
}

// Shared LocalStorage layer + tiny UI helpers (toast, modal, confirm)
const S = (() => {
  const K = "pks_db",
    uid = (p) => p + "_" + Math.random().toString(36).slice(2, 9),
    now = () => new Date().toISOString();
  const kb = (cat, q, a) => ({ id: uid("kb"), cat, q, a, on: true });
  const seed = () => {
    const plans = [
      [1, 299],
      [3, 769],
      [6, 1439],
      [12, 2699],
    ].map(([m, p]) => ({
      id: uid("plan"),
      name: m + (m > 1 ? " Months" : " Month"),
      months: m,
      price: p,
      on: true,
    }));
    const codes = plans.flatMap((p, i) =>
      [1, 2, 3].map((n) => ({
        id: uid("code"),
        code: `DEMO-${p.months}M-${1000 + i * 10 + n}-XXXX`,
        planId: p.id,
        status: "Available",
        orderId: null,
        customerId: null,
      })),
    );
    return {
      customers: [],
      conversations: [],
      messages: [],
      plans,
      codes,
      orders: [],
      payments: [],
      subs: [],
      audit: [],
      settings: { store: "Premium Store", owner: "Owner" },
      kb: [
        kb(
          "Code activation",
          "How do I activate my code?",
          "Open the app, go to Settings > Activate and enter the code exactly as delivered. Activation is instant.",
        ),
        kb(
          "Login and account issues",
          "I cannot log in",
          "Check your username and password, then restart the app. If it still fails, reply here and the owner will help.",
        ),
        kb(
          "Android TV setup",
          "How do I set up on Android TV?",
          "Install the app from the Play Store on your TV, sign in, then enter your subscription code under Settings > Activate.",
        ),
        kb(
          "Payment",
          "How do I pay?",
          "Choose Get Subscription, pick a plan and payment method, create an order and send payment within 30 minutes. Then upload the screenshot.",
        ),
        kb(
          "Subscription renewal",
          "How do I renew my subscription?",
          "Choose Get Subscription and order a new plan before expiry. Your new code is delivered after payment is confirmed.",
        ),
        kb(
          "Account sharing",
          "Can I share my account?",
          "Each code is for one account. Sharing may cause it to be blocked.",
        ),
        kb(
          "App errors",
          "The app shows an error",
          "Update to the latest version, clear the cache and restart. Send us the error text if it continues.",
        ),
      ],
    };
  };
  function expire(d) {
    const t = Date.now();
    d.subs.forEach((s) => {
      if (s.status === "Active" && new Date(s.expiry) < t) {
        s.status = "Expired";
        const c = d.codes.find((x) => x.id === s.codeId);
        if (c) c.status = "Expired";
      }
    });
  }
  function load() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(K));
    } catch (e) {}
    if (!d || !d.kb) {
      d = seed();
    }
    expire(d);
    save(d);
    return d;
  }
  function save(d) {
    try {
      localStorage.setItem(K, JSON.stringify(d));
      return true;
    } catch (e) {
      UI.toast(
        "Storage full — reset demo data or delete old screenshots",
        "err",
      );
      return false;
    }
  }
  const tx = (fn) => {
    const d = load();
    const r = fn(d);
    save(d);
    return r;
  };
  const audit = (d, type, detail) =>
    d.audit.push({
      id: uid("aud"),
      type,
      detail,
      by: d.settings.owner,
      at: now(),
    });
  const reset = () => {
    localStorage.removeItem(K);
    localStorage.removeItem("pks_cust");
    localStorage.removeItem("pks_conv");
  };
  return { load, save, tx, uid, now, audit, reset };
})();
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const UI = {
  toast(m, t = "ok") {
    const e = document.createElement("div");
    e.className = "toast " + t;
    e.textContent = m;
    document.getElementById("toasts").append(e);
    setTimeout(() => e.remove(), 3200);
  },
  modal(title, html) {
    UI.close();
    const m = document.createElement("div");
    m.className = "overlay";
    m.id = "mdl";
    m.innerHTML = `<div class="modal"><div class="mh"><b>${title}</b><button class="btn ghost sm" onclick="UI.close()">✕</button></div><div class="mb">${html}</div></div>`;
    document.body.append(m);
  },
  close() {
    document.getElementById("mdl")?.remove();
  },
  confirm(msg) {
    return new Promise((r) => {
      const m = document.createElement("div");
      m.className = "overlay";
      m.style.zIndex = 99;
      m.innerHTML = `<div class="modal sm"><div class="mb"><p>${esc(msg)}</p><div class="row end"><button class="btn ghost" id="n">Cancel</button><button class="btn" id="y">Confirm</button></div></div></div>`;
      document.body.append(m);
      m.querySelector("#n").onclick = () => {
        m.remove();
        r(false);
      };
      m.querySelector("#y").onclick = () => {
        m.remove();
        r(true);
      };
    });
  },
};

const $ = (s) => document.querySelector(s);
let cust,
  convId,
  draft = {},
  hits = [],
  hi = -1,
  sig = "";
const fmt = (t) =>
  new Date(t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const D = () => S.load(),
  conv = () => D().conversations.find((c) => c.id === convId);
const LBL = { customer: "You", ai: "AI Assistant", owner: "Owner" };
function init() {
  const id = localStorage.getItem("pks_cust");
  S.tx((d) => {
    let c = d.customers.find((x) => x.id === id);
    if (!c) {
      c = {
        id: S.uid("cus"),
        name: "Guest " + (100 + Math.floor(Math.random() * 900)),
        email: "guest@demo.local",
        at: S.now(),
      };
      d.customers.push(c);
      localStorage.setItem("pks_cust", c.id);
    }
    cust = c;
  });
  const cid = localStorage.getItem("pks_conv");
  D().conversations.find((c) => c.id === cid) ? open(cid) : newChat();
}
function newChat() {
  const id = S.tx((d) => {
    const c = {
      id: S.uid("conv"),
      customerId: cust.id,
      title: "New chat",
      mode: "ai",
      at: S.now(),
    };
    d.conversations.push(c);
    return c.id;
  });
  open(id);
}
function open(id) {
  convId = id;
  localStorage.setItem("pks_conv", id);
  draft = {};
  if (!D().messages.some((m) => m.convId === id)) {
    add("ai", "✨ Welcome Here! How can we help you today?");
  }
  render();
  menu();
  $("#side").classList.remove("show");
}
function add(sender, text) {
  S.tx((d) => {
    d.messages.push({ id: S.uid("msg"), convId, sender, text, at: S.now() });
    const c = d.conversations.find((x) => x.id === convId);
    if (sender === "customer" && c.title === "New chat")
      c.title = text.slice(0, 40);
  });
  render();
}
function render() {
  const d = D(),
    c = d.conversations.find((x) => x.id === convId),
    ms = d.messages.filter((m) => m.convId === convId),
    q = $("#search").value.trim().toLowerCase();
  $("#who").textContent = c.mode === "owner" ? "Owner" : "AI Assistant";
  hits = [];
  $("#msgs").innerHTML = ms
    .map((m) => {
      let t = esc(m.text);
      const hit = q && m.text.toLowerCase().includes(q);
      if (hit) {
        hits.push(m.id);
        t = t.replace(
          new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
          (x) => `<mark>${x}</mark>`,
        );
      }
      return `<div class="msg ${m.sender}" id="${m.id}"><div class="lbl">${LBL[m.sender]}</div><div class="bub">${t.replace(/\n/g, "<br>")}</div><div class="ts">${fmt(m.at)}</div></div>`;
    })
    .join("");
  $("#msgs").scrollTop = q ? $("#msgs").scrollTop : 1e9;
  const mine = d.conversations
    .filter((x) => x.customerId === cust.id)
    .sort((a, b) => (b.at < a.at ? -1 : 1));
  $("#hist").innerHTML = mine
    .map((x) => {
      const l = d.messages.filter((m) => m.convId === x.id).pop();
      return `<div class="hitem ${x.id === convId ? "on" : ""}" data-c="${x.id}"><b>${esc(x.title)}</b><small>${fmt(x.at)}</small><span>${esc((l?.text || "").slice(0, 50))}</span></div>`;
    })
    .join("");
  sig = ms.length + "|" + d.orders.map((o) => o.status).join();
}
function jump(n) {
  if (!hits.length) return;
  hi = (hi + n + hits.length) % hits.length;
  const e = document.getElementById(hits[hi]);
  e.scrollIntoView({ block: "center" });
  e.classList.add("flash");
  setTimeout(() => e.classList.remove("flash"), 900);
}
const P = (h) => ($("#panel").innerHTML = h),
  btns = (a) =>
    a
      .map(([k, l]) => `<button class="opt" data-o="${k}">${l}</button>`)
      .join("");
function menu() {
  P(
    `<div class="opts">${btns([
      ["chat", "💬 General Chat"],
      ["sub", "🛒 Get Subscription"],
      ["support", "🛟 Other Support"],
    ])}</div>`,
  );
}
function search(text, cat) {
  const w = (t) => t.toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  const qw = new Set(w(text));
  let best = null,
    bs = 0;
  D()
    .kb.filter((k) => k.on && (!cat || k.cat === cat))
    .forEach((k) => {
      const s = w(k.q + " " + k.q + " " + k.a + " " + k.cat).filter((x) =>
        qw.has(x),
      ).length;
      if (s > bs) {
        bs = s;
        best = k;
      }
    });
  return bs >= 1 ? best : null;
}
function answer(text) {
  setTimeout(() => {
    const k = search(text);
    if (k)
      add("ai", k.a + "\n\n(Simulated AI answer from the knowledge base.)");
    else {
      add(
        "ai",
        "I couldn't find an answer to that in our knowledge base. Would you like the owner to take over this chat?",
      );
      P(
        `<div class="opts">${btns([
          ["owner", "👤 Contact owner"],
          ["menu", "Back to menu"],
        ])}</div>`,
      );
    }
  }, 500);
}
function send() {
  const v = $("#inp").value.trim();
  if (!v) return;
  $("#inp").value = "";
  add("customer", v);
  if (conv().mode !== "owner") answer(v);
}
function plansPanel() {
  const ps = D().plans.filter((p) => p.on);
  P(
    ps.length
      ? `<div class="opts">${ps.map((p) => `<button class="opt" data-plan="${p.id}"><b>${esc(p.name)}</b><br>Rs. ${p.price.toLocaleString()}</button>`).join("")}</div>`
      : '<p class="empty">No plans are available right now.</p>',
  );
}
function methodsPanel() {
  P(
    `<div class="opts">${["JazzCash", "EasyPaisa", "NayaPay", "Other Bank"].map((m) => `<button class="opt" data-m="${m}">${m}</button>`).join("")}</div>`,
  );
}
const TERMS =
  "Create an order only when you are ready to make payment. Payment must be completed within 30 minutes of order creation. Payment account details may change, so confirm the current instructions before sending payment.";
const HOW =
  "How it works:\n1. Create the order and note your reference.\n2. Send the exact amount with the chosen method within 30 minutes.\n3. Upload the payment screenshot here.\n4. The owner checks it manually. After confirmation your code appears in My orders.";
function createOrder() {
  if (draft.orderId) return;
  const p = D().plans.find((x) => x.id === draft.planId);
  const o = S.tx((d) => {
    const o = {
      id: S.uid("ord"),
      ref:
        "PS-" +
        Date.now().toString(36).toUpperCase() +
        Math.floor(Math.random() * 90 + 10),
      customerId: cust.id,
      planId: p.id,
      method: draft.method,
      amount: p.price,
      status: "Awaiting Payment",
      created: S.now(),
    };
    d.orders.push(o);
    return o;
  });
  draft.orderId = o.id;
  add(
    "ai",
    `Order ${o.ref} created.\nPlan: ${p.name} — Rs. ${p.price.toLocaleString()} via ${o.method}.\nPay within 30 minutes (by ${fmt(Date.parse(o.created) + 18e5)}).\n[SIMULATED] Send to demo account 0300-0000000 (Premium Store). Confirm current details with the owner.`,
  );
  uploadPanel();
}
function uploadPanel() {
  P(
    `<div class="up"><b>Upload payment screenshot</b><input type="file" id="file" accept="image/png,image/jpeg"><img id="prev-img" hidden><div class="row"><button class="btn" id="submitShot" disabled>Submit for verification</button><button class="btn ghost" data-o="menu">Cancel</button></div></div>`,
  );
}
let shot = null;
function pick(f) {
  shot = null;
  $("#submitShot").disabled = true;
  if (!f) return;
  if (!/^image\/(png|jpe?g)$/.test(f.type))
    return UI.toast("Only PNG, JPG or JPEG files are allowed", "err");
  if (f.size > 5e6) return UI.toast("File is over 5 MB", "err");
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 900 / im.width),
        c = document.createElement("canvas");
      c.width = im.width * k;
      c.height = im.height * k;
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      shot = c.toDataURL("image/jpeg", 0.7);
      const p = $("#prev-img");
      p.src = shot;
      p.hidden = false;
      $("#submitShot").disabled = false;
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
}
function submitShot() {
  if (!shot || !draft.orderId) return;
  const ok = S.tx((d) => {
    const o = d.orders.find((x) => x.id === draft.orderId);
    if (o.status !== "Awaiting Payment") return false;
    d.payments.push({
      id: S.uid("pay"),
      orderId: o.id,
      shot,
      at: S.now(),
      status: "Pending",
    });
    o.status = "Pending Verification";
    return o;
  });
  if (ok === false)
    return UI.toast("A screenshot was already submitted", "err");
  UI.toast("Screenshot submitted");
  add(
    "ai",
    "Screenshot received. Your order is Pending Verification — the owner will check it manually. Payments are never approved automatically.",
  );
  draft = {};
  menu();
}
function ordersPanel() {
  const d = D(),
    os = d.orders.filter((o) => o.customerId === cust.id).reverse();
  P(
    `<div class="up"><b>My orders & subscriptions</b>${
      os.length
        ? os
            .map((o) => {
              const p = d.plans.find((x) => x.id === o.planId),
                s = d.subs.find(
                  (x) => x.orderId === o.id && x.status === "Active",
                ),
                c = s && d.codes.find((x) => x.id === s.codeId);
              return `<div class="ord"><b>${o.ref}</b> · ${esc(p?.name)} · Rs. ${o.amount.toLocaleString()} <span class="badge ${o.status.replace(/ /g, "")}">${o.status}</span>${c ? `<div class="code">Code: <b>${esc(c.code)}</b><br><small>Issued ${fmt(s.issued)} · Expires ${fmt(s.expiry)}</small></div>` : ""}</div>`;
            })
            .join("")
        : '<p class="empty">No orders yet.</p>'
    }<button class="btn ghost" data-o="menu">Close</button></div>`,
  );
}
function supportPanel() {
  P(
    `<div class="opts">${["Login and account issues", "Code activation", "App errors", "Account sharing", "Android TV setup", "Subscription renewal"].map((c) => `<button class="opt" data-cat="${c}">${c}</button>`).join("")}</div><p class="hint">Or type your own question below.</p>`,
  );
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("button,.hitem");
  if (!t) return;
  const o = t.dataset.o;
  if (t.dataset.c) open(t.dataset.c);
  if (o === "menu") menu();
  if (o === "chat") {
    add("customer", "General Chat");
    add(
      "ai",
      "Ask me anything. I answer from the owner’s knowledge base (simulated AI). You can also ask for the owner at any time.",
    );
    P(
      `<div class="opts">${btns([
        ["owner", "👤 Contact owner"],
        ["menu", "Back to menu"],
      ])}</div>`,
    );
  }
  if (o === "sub") {
    add("customer", "Get Subscription");
    add("ai", "Choose a plan:");
    plansPanel();
  }
  if (o === "support") {
    add("customer", "Other Support");
    add("ai", "Choose a topic or type your question.");
    supportPanel();
  }
  if (o === "owner") {
    S.tx((d) => {
      d.conversations.find((c) => c.id === convId).mode = "owner";
    });
    add(
      "ai",
      "The owner has been notified and can take over this chat. [Demo: owner replies from admin.html]",
    );
    menu();
  }
  if (o === "how") {
    add("customer", "HOW — Process Details");
    add("ai", HOW);
  }
  if (o === "yes") {
    add("customer", "YES — Create Order");
    createOrder();
  }
  if (t.dataset.plan) {
    draft.planId = t.dataset.plan;
    const p = D().plans.find((x) => x.id === draft.planId);
    add("customer", `${p.name} — Rs. ${p.price.toLocaleString()}`);
    add("ai", "Select a payment method:");
    methodsPanel();
  }
  if (t.dataset.m) {
    draft.method = t.dataset.m;
    add("customer", draft.method);
    add("ai", TERMS);
    P(
      `<div class="opts">${btns([
        ["yes", "YES — Create Order"],
        ["how", "HOW — Process Details"],
      ])}</div>`,
    );
  }
  if (t.dataset.cat) {
    add("customer", t.dataset.cat);
    const k = search(t.dataset.cat, t.dataset.cat);
    add(
      "ai",
      k
        ? k.a
        : "No answer is available for this topic yet. Ask the owner for help.",
    );
  }
  if (t.id === "submitShot") submitShot();
  if (t.id === "send") send();
  if (t.id === "newBtn") newChat();
  if (t.id === "ordersBtn") ordersPanel();
  if (t.id === "menuBtn") $("#side").classList.toggle("show");
  if (t.id === "prev") jump(-1);
  if (t.id === "next") jump(1);
});
document.addEventListener("change", (e) => {
  if (e.target.id === "file") pick(e.target.files[0]);
});
$("#inp").addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
$("#search").addEventListener("input", () => {
  hi = -1;
  render();
  jump(1);
});
init();
setInterval(() => {
  const d = D();
  if (
    sig !==
    d.messages.filter((m) => m.convId === convId).length +
      "|" +
      d.orders.map((o) => o.status).join()
  ) {
    render();
  }
}, 2000);
window.addEventListener("storage", render);

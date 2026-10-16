const $ = (s) => document.querySelector(s);
const fmt = (t) =>
  t
    ? new Date(t).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
const NAV = [
  ["overview", "Overview"],
  ["conv", "Conversations"],
  ["kb", "Knowledge Base"],
  ["plans", "Subscription Plans"],
  ["orders", "Orders & Payments"],
  ["codes", "Subscription Codes"],
  ["customers", "Customers"],
  ["settings", "Settings"],
];
let page = location.hash.slice(1) || "overview",
  sel = null,
  tab = "Pending",
  q = "",
  busy = false;
const D = () => S.load(),
  by = (a, id) => a.find((x) => x.id === id),
  nm = (d, id) => by(d.customers, id)?.name || "—";
const tbl = (h, r) =>
  r.length
    ? `<div class="tw"><table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${r.map((x) => `<tr>${x.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : '<p class="empty">Nothing to show yet.</p>';
const bd = (s) =>
    `<span class="badge ${String(s).replace(/ /g, "")}">${s}</span>`,
  bt = (a, id, l, c = "") =>
    `<button class="btn sm ${c}" data-a="${a}" data-id="${id}">${l}</button>`;
const addM = (d, m) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
};
const V = {
  overview(d) {
    const st = (s) => d.orders.filter((o) => s.includes(o.status)).length,
      av = d.codes.filter((c) => c.status === "Available").length;
    const cards = [
      ["Customers", d.customers.length],
      ["Orders", d.orders.length],
      ["Pending verification", st(["Pending Verification"])],
      ["Confirmed payments", st(["Confirmed", "Delivered"])],
      [
        "Active subscriptions",
        d.subs.filter((s) => s.status === "Active").length,
      ],
      ["Available codes", av],
    ];
    const dist = [
        "Awaiting Payment",
        "Pending Verification",
        "Confirmed",
        "Delivered",
        "Rejected",
      ].map((s) => [s, st([s])]),
      mx = Math.max(1, ...dist.map((x) => x[1]));
    return `<div class="cards">${cards.map((c) => `<div class="card"><small>${c[0]}</small><h3>${c[1]}</h3></div>`).join("")}</div><div class="grid2">
 <div class="card"><b>Recent payment submissions</b>${tbl(
   ["Date", "Customer", "Status"],
   d.payments
     .slice(-5)
     .reverse()
     .map((p) => {
       const o = by(d.orders, p.orderId);
       return [fmt(p.at), nm(d, o.customerId), bd(p.status)];
     }),
 )}</div>
 <div class="card"><b>Recent code deliveries</b>${tbl(
   ["Date", "Customer", "Expires"],
   d.subs
     .slice(-5)
     .reverse()
     .map((s) => [fmt(s.issued), nm(d, s.customerId), fmt(s.expiry)]),
 )}</div>
 <div class="card"><b>Recent conversations</b>${tbl(
   ["Customer", "Title", "Mode"],
   d.conversations
     .slice(-5)
     .reverse()
     .map((c) => [nm(d, c.customerId), esc(c.title), c.mode]),
 )}</div>
 <div class="card"><b>Order status</b>${dist.map(([s, n]) => `<div class="bar"><span>${s}</span><i style="width:${(n / mx) * 100}%"></i><em>${n}</em></div>`).join("")}</div></div>`;
  },
  conv(d) {
    const cs = d.conversations
        .filter((c) =>
          (nm(d, c.customerId) + c.title)
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .reverse(),
      c = by(d.conversations, sel),
      ms = c ? d.messages.filter((m) => m.convId === c.id) : [];
    return `<div class="split"><div class="card list"><input class="inp" id="q" placeholder="Search conversations" value="${esc(q)}">${cs.map((x) => `<div class="hitem ${x.id === sel ? "on" : ""}" data-a="selc" data-id="${x.id}"><b>${esc(nm(d, x.customerId))}</b><small>${esc(x.title)} · ${x.mode === "owner" ? "Owner" : "AI"}</small></div>`).join("") || '<p class="empty">No conversations yet. Start one in the chatbot.</p>'}</div>
 <div class="card thread">${
   c
     ? `<div class="row"><b>${esc(c.title)}</b><div class="grow"></div>${bt("mode", c.id, c.mode === "owner" ? "Return to AI" : "Take over")}</div><input class="inp sm" id="mq" placeholder="Search messages">
 <div class="msgs" id="tm">${ms.map((m) => `<div class="msg ${m.sender}" data-t="${esc(m.text.toLowerCase())}"><div class="lbl">${{ customer: "Customer", ai: "AI", owner: "Owner" }[m.sender]}</div><div class="bub">${esc(m.text).replace(/\n/g, "<br>")}</div><div class="ts">${fmt(m.at)}</div></div>`).join("")}</div>
 <div class="row"><input class="inp" id="rep" placeholder="Reply as owner…"><button class="btn" data-a="reply" data-id="${c.id}">Send</button></div>`
     : '<p class="empty">Select a conversation.</p>'
 }</div></div>`;
  },
  kb(d) {
    const es = d.kb.filter((k) =>
      (k.q + k.a + k.cat).toLowerCase().includes(q.toLowerCase()),
    );
    return `<div class="row"><input class="inp" id="q" placeholder="Search entries" value="${esc(q)}"><div class="grow"></div>${bt("kbform", "", "+ Add entry")}</div>${tbl(
      ["Category", "Question", "Answer", "Enabled", ""],
      es.map((k) => [
        esc(k.cat),
        esc(k.q),
        esc(k.a.slice(0, 70)),
        `<input type="checkbox" data-a="kbtog" data-id="${k.id}" ${k.on ? "checked" : ""}>`,
        bt("kbform", k.id, "Edit", "ghost") +
          bt("kbdel", k.id, "Delete", "danger"),
      ]),
    )}`;
  },
  plans(d) {
    return `<div class="row"><div class="grow"></div>${bt("planform", "", "+ Add plan")}</div>${tbl(
      ["Plan", "Months", "Price (Rs.)", "Enabled", ""],
      d.plans.map((p) => [
        esc(p.name),
        p.months,
        p.price.toLocaleString(),
        `<input type="checkbox" data-a="plantog" data-id="${p.id}" ${p.on ? "checked" : ""}>`,
        bt("planform", p.id, "Edit", "ghost") +
          bt("plandel", p.id, "Remove", "danger"),
      ]),
    )}`;
  },
  orders(d) {
    const f = {
      Pending: ["Pending Verification"],
      Confirmed: ["Confirmed", "Delivered"],
      Rejected: ["Rejected"],
      All: null,
    }[tab];
    const os = d.orders.filter((o) => !f || f.includes(o.status)).reverse();
    return `<div class="tabs">${["Pending", "Confirmed", "Rejected", "All"].map((t) => `<button class="btn sm ${t === tab ? "" : "ghost"}" data-a="tab" data-id="${t}">${t}</button>`).join("")}</div>${tbl(
      [
        "Ref",
        "Customer",
        "Plan",
        "Amount",
        "Method",
        "Screenshot",
        "Submitted",
        "Status",
        "",
      ],
      os.map((o) => {
        const p = d.payments.find((x) => x.orderId === o.id),
          pl = by(d.plans, o.planId);
        return [
          o.ref,
          esc(nm(d, o.customerId)),
          esc(pl?.name),
          "Rs. " + o.amount.toLocaleString(),
          o.method,
          p ? `<img class="thumb" src="${p.shot}">` : "—",
          fmt(p?.at),
          bd(o.status),
          (p ? bt("view", o.id, "Review", "ghost") : "") +
            (o.status === "Confirmed" ? bt("prov", o.id, "Provide Code") : ""),
        ];
      }),
    )}`;
  },
  codes(d) {
    const cs = d.codes.filter(
      (c) =>
        c.code.toLowerCase().includes(q.toLowerCase()) ||
        c.status.toLowerCase().includes(q.toLowerCase()),
    );
    return `<div class="row"><input class="inp" id="q" placeholder="Search code or status (Available, Delivered, Expired)" value="${esc(q)}"><div class="grow"></div>${bt("codeform", "", "+ Add codes")}</div>${tbl(
      ["Code", "Plan", "Status", "Customer", "Order"],
      cs.map((c) => [
        `<code>${esc(c.code)}</code>`,
        esc(by(d.plans, c.planId)?.name),
        bd(c.status),
        c.customerId ? esc(nm(d, c.customerId)) : "—",
        by(d.orders, c.orderId)?.ref || "—",
      ]),
    )}`;
  },
  customers(d) {
    const cs = d.customers.filter((c) =>
      (c.name + c.email + c.id).toLowerCase().includes(q.toLowerCase()),
    );
    return `<input class="inp" id="q" placeholder="Search customers" value="${esc(q)}">${tbl(
      [
        "ID",
        "Name",
        "Email",
        "Registered",
        "Chats",
        "Orders",
        "Subscription",
        "",
      ],
      cs.map((c) => [
        c.id,
        esc(c.name),
        esc(c.email),
        fmt(c.at),
        d.conversations.filter((x) => x.customerId === c.id).length,
        d.orders.filter((x) => x.customerId === c.id).length,
        d.subs.some((s) => s.customerId === c.id && s.status === "Active")
          ? bd("Active")
          : d.subs.some((s) => s.customerId === c.id)
            ? bd("Expired")
            : "None",
        bt("cust", c.id, "Open", "ghost"),
      ]),
    )}`;
  },
  settings(d) {
    return `<div class="card"><label>Owner name (recorded in audit trail)</label><input class="inp" id="own" value="${esc(d.settings.owner)}"><br><br>${bt("saveset", "", "Save settings")}</div><div class="card" style="margin-top:16px"><b>Audit log</b>${tbl(
      ["When", "By", "Event", "Detail"],
      d.audit
        .slice(-15)
        .reverse()
        .map((a) => [fmt(a.at), esc(a.by), a.type, esc(a.detail)]),
    )}</div><div class="card" style="margin-top:16px"><b>Danger zone</b><p>Deletes all demo data from this browser.</p>${bt("reset", "", "Reset demo data", "danger")}</div>`;
  },
};
function draw() {
  const d = D();
  $("#nav").innerHTML =
    `<div class="brand">Premium Store<small>Owner dashboard</small></div>` +
    NAV.map(
      ([k, l]) => `<a href="#${k}" class="${k === page ? "on" : ""}">${l}</a>`,
    ).join("");
  $("#title").textContent = NAV.find((n) => n[0] === page)[1];
  $("#view").innerHTML = V[page](d);
  $("#nav").classList.remove("show");
}
window.addEventListener("hashchange", () => {
  page = location.hash.slice(1) || "overview";
  q = "";
  sel = null;
  draw();
});
const val = (id) => $("#" + id).value.trim();
const A = {
  selc: (id) => {
    sel = id;
    draw();
  },
  tab: (id) => {
    tab = id;
    draw();
  },
  mode: (id) => {
    S.tx((d) => {
      const c = by(d.conversations, id);
      c.mode = c.mode === "owner" ? "ai" : "owner";
      S.audit(d, "Conversation", c.mode);
    });
    draw();
  },
  reply: (id) => {
    const t = val("rep");
    if (!t) return;
    S.tx((d) => {
      d.messages.push({
        id: S.uid("msg"),
        convId: id,
        sender: "owner",
        text: t,
        at: S.now(),
      });
      by(d.conversations, id).mode = "owner";
    });
    draw();
  },
  kbtog: (id) => {
    S.tx((d) => {
      const k = by(d.kb, id);
      k.on = !k.on;
    });
    draw();
  },
  kbform: (id) => {
    const k = id ? by(D().kb, id) : { q: "", a: "", cat: "General" };
    UI.modal(
      id ? "Edit entry" : "Add entry",
      `<label>Category</label><input class="inp" id="f1" value="${esc(k.cat)}"><label>Question</label><input class="inp" id="f2" value="${esc(k.q)}"><label>Answer</label><textarea class="inp" id="f3" rows="4">${esc(k.a)}</textarea><div class="row end"><button class="btn" data-a="kbsave" data-id="${id}">Save entry</button></div>`,
    );
  },
  kbsave: (id) => {
    const [c, qq, a] = [val("f1"), val("f2"), val("f3")];
    if (!qq || !a) return UI.toast("Question and answer are required", "err");
    S.tx((d) => {
      if (id) {
        Object.assign(by(d.kb, id), { cat: c, q: qq, a });
      } else d.kb.push({ id: S.uid("kb"), cat: c, q: qq, a, on: true });
      S.audit(d, "KB", qq);
    });
    UI.close();
    UI.toast("Entry saved");
    draw();
  },
  kbdel: async (id) => {
    if (await UI.confirm("Delete this entry?")) {
      S.tx((d) => {
        d.kb = d.kb.filter((k) => k.id !== id);
      });
      draw();
    }
  },
  plantog: (id) => {
    S.tx((d) => {
      const p = by(d.plans, id);
      p.on = !p.on;
    });
    draw();
  },
  planform: (id) => {
    const p = id ? by(D().plans, id) : { name: "", months: 1, price: 0 };
    UI.modal(
      id ? "Edit plan" : "Add plan",
      `<label>Name</label><input class="inp" id="f1" value="${esc(p.name)}"><label>Months</label><input class="inp" id="f2" type="number" min="1" value="${p.months}"><label>Price (Rs.)</label><input class="inp" id="f3" type="number" min="0" value="${p.price}"><div class="row end"><button class="btn" data-a="plansave" data-id="${id}">Save plan</button></div>`,
    );
  },
  plansave: (id) => {
    const o = { name: val("f1"), months: +val("f2"), price: +val("f3") };
    if (!o.name || o.months < 1 || o.price < 0)
      return UI.toast("Enter a name, months and price", "err");
    S.tx((d) => {
      if (id) Object.assign(by(d.plans, id), o);
      else d.plans.push({ id: S.uid("plan"), ...o, on: true });
    });
    UI.close();
    draw();
  },
  plandel: async (id) => {
    if (
      await UI.confirm("Remove this plan? Existing orders keep their records.")
    ) {
      S.tx((d) => {
        d.plans = d.plans.filter((p) => p.id !== id);
      });
      draw();
    }
  },
  view: (id) => {
    const d = D(),
      o = by(d.orders, id),
      p = d.payments.find((x) => x.orderId === id);
    UI.modal(
      "Review payment " + o.ref,
      `<img class="shot" src="${p.shot}"><p>${esc(nm(d, o.customerId))} · ${by(d.plans, o.planId)?.name} · Rs. ${o.amount.toLocaleString()} · ${o.method}<br>${bd(o.status)} ${p.reason ? "Reason: " + esc(p.reason) : ""}</p>${o.status === "Pending Verification" ? `<input class="inp" id="rsn" placeholder="Rejection reason (optional)"><div class="row end"><button class="btn danger" data-a="rej" data-id="${id}">Reject payment</button><button class="btn" data-a="conf" data-id="${id}">Confirm payment</button></div><p class="hint">Simulated: compare with your real transaction history first.</p>` : ""}`,
    );
  },
  conf: async (id) => {
    if (!(await UI.confirm("Confirm this payment?"))) return;
    S.tx((d) => {
      const o = by(d.orders, id);
      if (o.status !== "Pending Verification") return;
      o.status = "Confirmed";
      d.payments.find((x) => x.orderId === id).status = "Confirmed";
      S.audit(d, "Payment confirmed", o.ref);
    });
    UI.close();
    UI.toast("Payment confirmed");
    draw();
  },
  rej: async (id) => {
    const r = $("#rsn")?.value || "";
    if (!(await UI.confirm("Reject this payment?"))) return;
    S.tx((d) => {
      const o = by(d.orders, id);
      if (o.status !== "Pending Verification") return;
      o.status = "Rejected";
      const p = d.payments.find((x) => x.orderId === id);
      p.status = "Rejected";
      p.reason = r;
      S.audit(d, "Payment rejected", o.ref + " " + r);
    });
    UI.close();
    draw();
  },
  prov: (id) => {
    const d = D(),
      o = by(d.orders, id);
    if (o.status !== "Confirmed")
      return UI.toast("Payment must be confirmed first", "err");
    window._o = id;
    UI.modal(
      "Provide code",
      `<p><b>${esc(nm(d, o.customerId))}</b> · ${o.ref} · Rs. ${o.amount.toLocaleString()}</p><label>Plan / duration (override allowed)</label><select class="inp" id="pl" data-a="plch">${d.plans.map((p) => `<option value="${p.id}" ${p.id === o.planId ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select><label>Code from inventory</label><select class="inp" id="cs"></select><label>Or enter manually</label><input class="inp" id="cm" placeholder="Manual code"><p>Issue date: ${fmt(Date.now())}<br>Expiry: <b id="ex"></b></p><div class="row end"><button class="btn" id="dl" data-a="deliver" data-id="${id}">Deliver code</button></div>`,
    );
    A.plch();
  },
  plch: () => {
    const d = D(),
      pid = $("#pl").value,
      pl = by(d.plans, pid);
    $("#cs").innerHTML =
      '<option value="">— auto: first available —</option>' +
      d.codes
        .filter((c) => c.status === "Available" && c.planId === pid)
        .map((c) => `<option value="${c.id}">${esc(c.code)}</option>`)
        .join("");
    $("#ex").textContent = fmt(addM(Date.now(), pl.months));
  },
  deliver: (id) => {
    if (busy) return;
    busy = true;
    $("#dl").disabled = true;
    const pid = $("#pl").value,
      cid = $("#cs").value,
      man = val("cm");
    const r = S.tx((d) => {
      const o = by(d.orders, id);
      if (o.status !== "Confirmed") return "Already delivered or not confirmed";
      const pl = by(d.plans, pid);
      let c;
      if (man) {
        if (d.codes.some((x) => x.code.toLowerCase() === man.toLowerCase()))
          return "That code already exists in the inventory";
        c = { id: S.uid("code"), code: man, planId: pid, status: "Available" };
        d.codes.push(c);
      } else
        c = cid
          ? by(d.codes, cid)
          : d.codes.find((x) => x.status === "Available" && x.planId === pid);
      if (!c || c.status !== "Available")
        return "No available code — add codes first";
      const now = S.now();
      Object.assign(c, {
        status: "Delivered",
        orderId: o.id,
        customerId: o.customerId,
      });
      o.status = "Delivered";
      d.subs.push({
        id: S.uid("sub"),
        customerId: o.customerId,
        orderId: o.id,
        codeId: c.id,
        planId: pid,
        issued: now,
        expiry: addM(now, pl.months).toISOString(),
        status: "Active",
        issuedBy: d.settings.owner,
      });
      S.audit(d, "Code delivered", o.ref + " → " + c.code);
      return null;
    });
    busy = false;
    if (r) {
      UI.toast(r, "err");
      $("#dl") && ($("#dl").disabled = false);
      return;
    }
    UI.close();
    UI.toast("Code delivered");
    draw();
  },
  codeform: () => {
    const d = D();
    UI.modal(
      "Add codes",
      `<label>Plan</label><select class="inp" id="cp">${d.plans.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select><label>Codes (one per line)</label><textarea class="inp" id="ct" rows="6"></textarea><div class="row end"><button class="btn" data-a="codesave">Add codes</button></div>`,
    );
  },
  codesave: () => {
    const ls = [
      ...new Set(
        $("#ct")
          .value.split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ];
    let n = 0,
      sk = 0;
    S.tx((d) => {
      ls.forEach((l) => {
        if (d.codes.some((c) => c.code.toLowerCase() === l.toLowerCase())) sk++;
        else {
          d.codes.push({
            id: S.uid("code"),
            code: l,
            planId: $("#cp").value,
            status: "Available",
          });
          n++;
        }
      });
    });
    UI.close();
    UI.toast(`${n} added, ${sk} duplicate(s) skipped`);
    draw();
  },
  cust: (id) => {
    const d = D();
    UI.modal(
      esc(nm(d, id)),
      `<b>Conversations</b>${tbl(
        ["Title", "Date"],
        d.conversations
          .filter((c) => c.customerId === id)
          .map((c) => [esc(c.title), fmt(c.at)]),
      )}<b>Orders & payments</b>${tbl(
        ["Ref", "Amount", "Status"],
        d.orders
          .filter((o) => o.customerId === id)
          .map((o) => [o.ref, o.amount, bd(o.status)]),
      )}<b>Subscriptions & codes</b>${tbl(
        ["Code", "Issued", "Expiry", "Status"],
        d.subs
          .filter((s) => s.customerId === id)
          .map((s) => [
            esc(by(d.codes, s.codeId)?.code),
            fmt(s.issued),
            fmt(s.expiry),
            bd(s.status),
          ]),
      )}`,
    );
  },
  saveset: () => {
    S.tx((d) => {
      d.settings.owner = val("own") || "Owner";
    });
    UI.toast("Settings saved");
  },
  reset: async () => {
    if (await UI.confirm("Delete ALL demo data in this browser?")) {
      S.reset();
      location.reload();
    }
  },
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-a]");
  if (!a || a.tagName === "INPUT" || a.tagName === "SELECT") return;
  A[a.dataset.a]?.(a.dataset.id);
});
document.addEventListener("change", (e) => {
  const a = e.target.dataset.a;
  if (a) A[a](e.target.dataset.id);
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") {
    q = e.target.value;
    const p = e.target.selectionStart;
    draw();
    const n = $("#q");
    n.focus();
    n.setSelectionRange(p, p);
  }
  if (e.target.id === "mq")
    document
      .querySelectorAll("#tm .msg")
      .forEach(
        (m) =>
          (m.style.display = m.dataset.t.includes(e.target.value.toLowerCase())
            ? ""
            : "none"),
      );
});
$("#navBtn").onclick = () => $("#nav").classList.toggle("show");
draw();
setInterval(() => {
  if (
    !document.getElementById("mdl") &&
    !document.activeElement.matches("input,textarea")
  )
    draw();
}, 4000);

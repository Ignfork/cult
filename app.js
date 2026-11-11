/* ============================================================
   LAUNCH ON CULT — shared logic
   Set CONFIG to go live. With API_BASE empty, every page shows its
   real empty state: no simulated markets, everything starts at 0.
   ============================================================ */
const CONFIG = {
  TICKER: "CULT",
  API_BASE: "",       // your payout-desk backend, e.g. "https://api.yourdomain.xyz" (see README)
  X_URL: "https://x.com/LaunchOnCult",
  PAYOUT_WALLET: "",  // wallet that receives 100% of pump.fun creator fees
  MIN_HOLD_SOL: 0.2, PAYOUT_MINUTES: 3, MARK_CHECK_MINUTES: 30, MAX_FIRST_BUY: 50, SECT_FEE_PCT: 0.95
};

const $ = (s, r = document) => r.querySelector(s) || document.createElement("div");
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n, d = 2) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const int = n => Number(n || 0).toLocaleString("en-US");
const usd = n => !n ? "$0" : "$" + (n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? (n / 1e3).toFixed(2) + "K" : Math.round(n));
const short = a => a ? a.slice(0, 5) + "…" + a.slice(-5) : "";
const ago = t => { const s = (Date.now() - new Date(t)) / 1000; return s < 60 ? Math.floor(s) + "s" : s < 3600 ? Math.floor(s / 60) + "m" : s < 86400 ? Math.floor(s / 3600) + "h" : Math.floor(s / 86400) + "d"; };
const dur = sec => sec < 3600 ? Math.floor(sec / 60) + " min" : sec < 86400 ? (sec / 3600).toFixed(1) + " h" : (sec / 86400).toFixed(1) + " days";
const pct = n => (Number(n || 0) * 100).toFixed(0) + "%";
const devotion = days => 1 + 3 * (1 - Math.exp(-days / 20));
const params = () => { const u = new URLSearchParams(location.search); return u.get("mint") || decodeURIComponent(location.hash.slice(1)); };
const cultUrl = c => `cult.html?mint=${encodeURIComponent(c.mint)}#${encodeURIComponent(c.mint)}`;
const IC = {
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M4 4l6.6 8.8L4.3 20h1.6l5.4-6.3L16 20h4l-7-9.2L19 4h-1.6l-5 5.8L8 4z" fill="currentColor" stroke="none"/></svg>',
  menu: '<svg class="i" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
  pyr: '<svg class="i sig" viewBox="0 0 24 24"><path d="M12 3 22 20H2z"/><path d="M8.5 14.5s1.4-1.8 3.5-1.8 3.5 1.8 3.5 1.8-1.4 1.8-3.5 1.8-3.5-1.8-3.5-1.8z"/></svg>'
};

/* ---------- API: empty fallbacks without a backend ---------- */
async function api(path, fallback, opts) {
  if (!CONFIG.API_BASE) return fallback;
  try { const r = await fetch(CONFIG.API_BASE.replace(/\/$/, "") + path, opts); if (!r.ok) throw 0; return await r.json(); } catch { return fallback; }
}
const getStats = () => api("/stats", { paid_sol: 0, cults: 0, wearing: 0, sects: 0 });
const getCults = (kind = "all", sort = "mcap") => api(`/cults?kind=${kind}&sort=${sort}`, []);
const getLedger = (type = "all") => api(`/ledger?type=${type}`, { totals: { collected: 0, paid: 0, network: 0, waiting: 0 }, rows: [] });
const getCult = mint => api(`/cults/${encodeURIComponent(mint)}`, null);
const getMe = w => api(`/me/${encodeURIComponent(w)}`, { bags: [] });

/* ---------- nav + footer (same layout as the template) ---------- */
function chrome() {
  const pg = document.body.dataset.page;
  const L = [["cults", "cults.html", "Cults"], ["launch", "launch.html", "Launch"], ["how", "how.html", "How it works"], ["faq", "faq.html", "FAQ"], ["ledger", "ledger.html", "Ledger"], ["me", "me.html", "Your offerings"]];
  document.body.insertAdjacentHTML("afterbegin", `
  <header class="nav"><div class="wrap">
    <a class="brand" href="index.html"><img src="mark.png" alt=""><b>CULT</b></a>
    <nav class="links">${L.map(([k, h, t]) => `<a href="${h}" class="${k === pg ? "on" : ""}">${t}</a>`).join("")}</nav>
    <span class="sp"></span>
    ${CONFIG.X_URL ? `<a class="ibtn" href="${esc(CONFIG.X_URL)}" target="_blank" rel="noopener" aria-label="X">${IC.x}</a>` : ""}
    <a class="btn primary launch-btn" href="launch.html">Found a cult</a>
    <button class="btn wallet" id="walletBtn">Connect</button>
    <button class="ibtn burger" id="menuBtn" aria-label="Menu">${IC.menu}</button>
    <nav class="menu" id="menu">${L.map(([k, h, t]) => `<a href="${h}" class="${k === pg ? "on" : ""}">${t}</a>`).join("")}</nav>
  </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
  <footer><div class="wrap"><span>CULT. Every fee goes to the faithful.</span>
    <nav><a href="cults.html">Cults</a><a href="launch.html">Launch</a><a href="how.html">How it works</a><a href="faq.html">FAQ</a><a href="ledger.html">Ledger</a><a href="me.html">Your offerings</a>${CONFIG.X_URL ? `<a href="${esc(CONFIG.X_URL)}" target="_blank" rel="noopener">X</a>` : ""}</nav></div></footer>
  <div class="toast" id="toast"></div><div class="modal" id="modal"><div class="mbox" id="mbox"></div></div>`);
  $("#menuBtn").onclick = () => $("#menu").classList.toggle("open");
  $("#walletBtn").onclick = () => Wallet.toggle();
  $("#modal").onclick = e => { if (e.target.id === "modal") closeModal(); };
  Wallet.restore();
}
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2400); }
function modal(h) { $("#mbox").innerHTML = h; $("#modal").classList.add("on"); }
function closeModal() { $("#modal").classList.remove("on"); }
async function copy(t) { try { await navigator.clipboard.writeText(t); toast("Copied"); } catch { toast("Copy blocked, select it manually"); } }
const notLive = what => modal(`<h3>Opens with the payout desk</h3><p>${what} goes live when the CULT payout desk does${CONFIG.X_URL ? ", announced on X" : ""}. Nothing was sent or signed.</p><div class="acts"><button class="btn primary" onclick="closeModal()">OK</button></div>`);

/* ---------- wallet: real Phantom / Solflare / Backpack ---------- */
const Wallet = {
  pk: null,
  provider() { return window.phantom?.solana || window.solflare || window.backpack?.solana || window.solana || null; },
  paint() { const b = $("#walletBtn"); if (b) { b.textContent = this.pk ? short(this.pk) : "Connect"; b.classList.toggle("on", !!this.pk); } document.dispatchEvent(new CustomEvent("wallet", { detail: this.pk })); },
  async connect() {
    const p = this.provider();
    if (!p) { modal(`<h3>No wallet found</h3><p>Install a Solana wallet like Phantom, Solflare or Backpack, then reload the page.</p><div class="acts"><a class="btn primary" href="https://phantom.app" target="_blank" rel="noopener">Get Phantom</a><button class="btn" onclick="closeModal()">Close</button></div>`); return null; }
    try { const r = await p.connect(); this.pk = (r?.publicKey || p.publicKey).toString(); this.paint(); return this.pk; } catch { toast("Connection cancelled"); return null; }
  },
  async disconnect() { try { await this.provider()?.disconnect(); } catch { } this.pk = null; this.paint(); },
  toggle() { this.pk ? this.disconnect() : this.connect(); },
  async restore() { const p = this.provider(); if (p) { try { const r = await p.connect({ onlyIfTrusted: true }); this.pk = (r?.publicKey || p.publicKey)?.toString() || null; } catch { } } this.paint(); }
};

/* ---------- shared renderers ---------- */
const cc = c => `<div class="cc">${c.image ? `<img src="${esc(c.image)}" alt="">` : `<span class="ph"></span>`}<div><b>${esc(c.name)}</b><span class="t ${c.parent ? "sect" : ""}">$${esc(c.ticker)}</span>${c.parent ? `<span class="of">sect of $${esc(c.parent)}</span>` : ""}</div></div>`;
const LT = { fee: "FEE", payout: "TITHE", wearing: "MARK", launch: "LAUNCH" };
const ledgerRow = r => `<tr><td class="dim">${ago(r.when)} ago</td><td><span class="tag ${esc(r.type)}">${LT[r.type] || "EVENT"}</span>${esc(r.what)}</td><td class="num">${r.amount != null ? fmt(r.amount, 3) + " " + esc(r.unit || "SOL") : ""}</td><td class="num">${r.sig ? `<a class="tx" href="https://solscan.io/tx/${esc(r.sig)}" target="_blank" rel="noopener">${short(r.sig)}</a>` : ""}</td></tr>`;

/* ---------- HOME ---------- */
async function initHome() {
  const [cults, stats, L] = await Promise.all([getCults("all", "mcap"), getStats(), getLedger("payout")]);
  const top = cults.filter(c => !c.parent);
  [["p2", 1], ["p1", 0], ["p3", 2]].forEach(([cls, i]) => {
    const c = top[i], el = $("." + cls);
    if (!c) { el.classList.add("empty"); el.querySelector(".body").innerHTML = `<div class="img">Open</div><div class="open">This throne is empty</div>`; return; }
    el.onclick = () => location.href = cultUrl(c); el.style.cursor = "pointer";
    el.querySelector(".body").innerHTML = `<div class="img">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}</div><div class="nm">${esc(c.name)}</div><div class="tk">$${esc(c.ticker)}</div>
      <div class="grid"><div><div class="k">Market cap</div><div class="v">${usd(c.mcap_usd)}</div></div><div><div class="k">Faithful</div><div class="v">${int(c.holders)}</div></div>
      <div><div class="k">Wearing</div><div class="v wear">${pct(c.wearing_pct)}</div></div><div><div class="k">Paid</div><div class="v">${fmt(c.paid_sol)} SOL</div></div></div>`;
  });
  $("#sPaid").textContent = fmt(stats.paid_sol) + " SOL"; $("#sCults").textContent = int(stats.cults); $("#sWear").textContent = int(stats.wearing); $("#sSects").textContent = int(stats.sects);
  $("#payouts").innerHTML = L.rows.length ? `<div class="list">${L.rows.slice(0, 6).map(r => `<div class="row"><span>${esc(r.what)}</span><span class="r">${fmt(r.amount, 3)} SOL</span></div>`).join("")}</div>`
    : `<div class="emptyc">No tithes yet. The first one goes out a few minutes after the first cult earns its first fees.</div>`;
  const more = cults.filter(c => !top.slice(0, 3).includes(c)).slice(0, 6);
  $("#more").innerHTML = more.length ? `<div class="list">${more.map(c => `<a href="${cultUrl(c)}">${cc(c)}<span class="r">${usd(c.mcap_usd)}</span></a>`).join("")}</div>`
    : `<div class="emptyc">${cults.length ? "Every cult is on the altar." : "No cults yet. The first one founded here takes the first throne."}</div>`;
}

/* ---------- CULTS ---------- */
async function initCults() {
  let kind = "all", sort = "mcap";
  const load = async () => {
    const list = await getCults(kind, sort), body = $("#rows");
    if (!list.length) { body.innerHTML = `<tr class="erow"><td colspan="7">${kind === "sects" ? "No sects yet. A sect is paired with its parent cult, so every buy of the sect buys the parent first." : "No cults yet. Be the first to raise a congregation."} <a class="tx" href="launch.html">Found one</a></td></tr>`; return; }
    body.innerHTML = list.map((c, i) => `<tr class="click" data-u="${cultUrl(c)}"><td class="dim">${i + 1}</td><td>${cc(c)}</td><td class="num">${usd(c.mcap_usd)}</td><td class="num">${int(c.holders)}</td><td class="num wear">${pct(c.wearing_pct)}</td><td class="num">${fmt(c.paid_sol)} SOL</td><td class="num dim">${c.born ? ago(c.born) : ""}</td></tr>`).join("");
    $$("tr.click").forEach(tr => tr.onclick = () => location.href = tr.dataset.u);
  };
  $$("#kind .chip").forEach(b => b.onclick = () => { $$("#kind .chip").forEach(x => x.classList.remove("on")); b.classList.add("on"); kind = b.dataset.k; load(); });
  $("#sort").onchange = e => { sort = e.target.value; load(); };
  load();
}

/* ---------- LEDGER ---------- */
async function initLedger() {
  let type = "all";
  const load = async () => {
    const L = await getLedger(type), t = L.totals || {};
    $("#tC").textContent = fmt(t.collected, 3) + " SOL"; $("#tP").textContent = fmt(t.paid, 3) + " SOL"; $("#tN").textContent = fmt(t.network, 3) + " SOL"; $("#tW").textContent = fmt(t.waiting, 3) + " SOL";
    $("#rows").innerHTML = L.rows?.length ? L.rows.map(ledgerRow).join("") : `<tr class="erow"><td colspan="4">Nothing has moved yet. Every launch, fee collection, tithe and mark check will be written here with its Solana transaction.</td></tr>`;
  };
  $$("#ltype .chip").forEach(b => b.onclick = () => { $$("#ltype .chip").forEach(x => x.classList.remove("on")); b.classList.add("on"); type = b.dataset.t; load(); });
  $("#dl").onclick = async () => {
    const all = await getLedger("all"), jsonl = (all.rows || []).map(r => JSON.stringify(r)).join("\n");
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([jsonl], { type: "application/x-ndjson" })); a.download = "cult-ledger.jsonl"; document.body.appendChild(a); a.click(); a.remove(); toast(all.rows?.length ? `Downloaded ${all.rows.length} lines` : "Ledger is empty, downloaded a blank file"); } catch { copy(jsonl); }
  };
  load();
}

/* ---------- HOW (devotion line) ---------- */
function initHow() { }

/* ---------- LAUNCH ---------- */
function initLaunch() {
  const S = { type: "cult", file: null };
  const err = (id, m) => { const e = $("#" + id); e.textContent = m; e.classList.toggle("err", !!m); return !m; };
  const setType = t => { S.type = t; $$(".type").forEach(b => b.classList.toggle("on", b.dataset.t === t)); $("#parentWrap").style.display = t === "sect" ? "block" : "none"; $("#wPair").textContent = t === "sect" ? "$" + ($("#parent").value || "parent") : "SOL"; $("#wFee").textContent = t === "sect" ? `${CONFIG.SECT_FEE_PCT}% in parent coin` : "100%"; };
  $$(".type").forEach(b => b.onclick = () => setType(b.dataset.t));
  const q = new URLSearchParams(location.search);
  if (q.get("parent") || location.hash.startsWith("#sect")) { setType("sect"); $("#parent").value = (q.get("parent") || location.hash.slice(6)).toUpperCase(); setType("sect"); }
  $("#parent").oninput = e => { e.target.value = e.target.value.toUpperCase(); setType("sect"); };
  getCults("all", "mcap").then(list => {
    $("#parents").innerHTML = list.filter(c => !c.parent).map(c => `<option value="${esc(c.ticker)}">${esc(c.name)}</option>`).join("");
    if (!list.length) $("#parentHint").textContent = "No cults exist yet. Found a new cult first, then sects can split off it.";
  });

  const drop = $("#drop"), inp = $("#img");
  drop.onclick = () => inp.click();
  ["dragover", "dragenter"].forEach(e => drop.addEventListener(e, v => { v.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(e => drop.addEventListener(e, v => { v.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", v => v.dataTransfer.files[0] && take(v.dataTransfer.files[0]));
  inp.onchange = () => inp.files[0] && take(inp.files[0]);
  function take(f) {
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(f.type)) return err("imgErr", "PNG, JPG, GIF or WebP only.");
    if (f.size >= 4 * 1024 * 1024) return err("imgErr", "Under 4 MB, please.");
    err("imgErr", ""); S.file = f; const r = new FileReader(); r.onload = () => { $("#pv").innerHTML = `<img src="${r.result}" alt="">`; $("#imgName").textContent = f.name; }; r.readAsDataURL(f);
  }
  const cnt = (id, max, fix) => { const el = $("#" + id); el.oninput = () => { if (fix) el.value = fix(el.value); $("#" + id + "C").textContent = `${el.value.length}/${max}`; }; };
  cnt("name", 32); cnt("ticker", 10, v => v.toUpperCase().replace(/[^A-Z0-9]/g, "")); cnt("look", 120); cnt("about", 500);
  $("#payout").textContent = CONFIG.PAYOUT_WALLET ? short(CONFIG.PAYOUT_WALLET) : "set at go-live";
  document.addEventListener("wallet", e => $("#go").textContent = e.detail ? "Found the cult" : "Connect wallet to launch");

  $("#form").onsubmit = async ev => {
    ev.preventDefault();
    const name = $("#name").value.trim(), ticker = $("#ticker").value.trim(), about = $("#about").value.trim(), buy = +$("#buy").value || 0, x = $("#xh").value.trim();
    let ok = true;
    ok = err("imgErr", S.file ? "" : "Every cult needs a face. Upload its image.") && ok;
    ok = err("nameErr", name ? "" : "Give the cult a name.") && ok;
    ok = err("tickerErr", ticker.length >= 2 ? "" : "2 to 10 letters or numbers.") && ok;
    ok = err("aboutErr", about ? "" : "Say what the cult is about.") && ok;
    ok = err("buyErr", buy >= 0 && buy <= CONFIG.MAX_FIRST_BUY ? "" : `Up to ${CONFIG.MAX_FIRST_BUY} SOL.`) && ok;
    ok = err("parentErr", S.type === "sect" && !$("#parent").value.trim() ? "Pick the parent cult." : "") && ok;
    if (!ok) { document.querySelector(".hint.err")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const pk = Wallet.pk || await Wallet.connect(); if (!pk) return;
    const twitter = !x ? "" : x.startsWith("http") ? x : "https://x.com/" + x.replace(/^@/, "");
    const payload = { type: S.type, parent: S.type === "sect" ? $("#parent").value.trim() : null, name, ticker, look: $("#look").value.trim(), about, twitter, first_buy_sol: buy, creator: pk };
    if (!CONFIG.API_BASE) {
      modal(`<h3>Ready to found</h3><p>Everything checks out. Launching opens when the CULT payout desk goes live${CONFIG.X_URL ? ", announced on X" : ""}. Nothing was signed and no SOL left your wallet.</p>
      <dl class="kv"><dt>Cult</dt><dd>${esc(name)}</dd><dt>Ticker</dt><dd>$${esc(ticker)}</dd><dt>Pair</dt><dd>${S.type === "sect" ? "$" + esc(payload.parent) : "SOL"}</dd><dt>First buy</dt><dd>${buy ? buy + " SOL" : "none"}</dd><dt>Founder</dt><dd>${short(pk)}</dd></dl>
      <div class="acts"><button class="btn" onclick='copy(${JSON.stringify(JSON.stringify(payload))})'>Copy details</button><button class="btn primary" onclick="closeModal()">Done</button></div>`);
      return;
    }
    const go = $("#go");
    try {
      go.disabled = true; go.textContent = "Preparing…";
      const fd = new FormData(); fd.append("image", S.file); fd.append("data", JSON.stringify(payload));
      const r = await fetch(CONFIG.API_BASE.replace(/\/$/, "") + "/launch", { method: "POST", body: fd });
      if (!r.ok) throw new Error((await r.text()) || "The launch desk refused the request");
      const { tx, mint } = await r.json(); await loadWeb3();
      const t = solanaWeb3.VersionedTransaction.deserialize(Uint8Array.from(atob(tx), c => c.charCodeAt(0)));
      const { signature } = await Wallet.provider().signAndSendTransaction(t);
      modal(`<h3>The cult is born</h3><p>$${esc(ticker)} is live on pump.fun with fee sharing locked to the CULT payout wallet.</p><div class="acts"><a class="btn primary" href="cult.html?mint=${esc(mint)}#${esc(mint)}">Open its page</a><a class="btn" href="https://solscan.io/tx/${esc(signature)}" target="_blank" rel="noopener">Transaction</a></div>`);
    } catch (e) { modal(`<h3>Launch failed</h3><p>${esc(e.message || e)}</p><div class="acts"><button class="btn" onclick="closeModal()">Close</button></div>`); }
    finally { go.disabled = false; go.textContent = "Found the cult"; }
  };
}
const loadWeb3 = () => window.solanaWeb3 ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js"; s.onload = res; s.onerror = () => rej(new Error("Could not load the Solana library")); document.head.appendChild(s); });

/* ---------- CULT page (each cult's own website) ---------- */
const ADDS = ["a black hood", "a ritual robe", "a sigil pendant", "glowing red eyes", "a crown of thorns", "a lit candle", "a bone mask", "a dark halo", "horns", "a gold chain", "sunglasses", "a cap"];
const dressPrompt = add => `Edit the attached image and keep every part of it as it is: the same character, expression, pose, art style, colours, background and crop. The only change: add ${add}. Draw the addition in the image's own style, matching its line work, shading, palette and level of detail, so it looks like it was part of the original from the start. Pixel art stays pixel art at the same pixel size; a flat cartoon stays flat with the same outlines; only a photo may get a photographic addition. Change nothing else. Square output, no text, no watermark.`;
async function initCult() {
  const mint = params(), root = $("#root");
  if (!mint) { root.innerHTML = noCult("No cult picked", "Open one from the list of cults."); return; }
  const c = await getCult(mint);
  if (!c) { root.innerHTML = noCult("No cult here yet", "Nothing with this address has been founded on Launch On Cult."); return; }
  document.title = `$${c.ticker}: ${c.name} on CULT`;
  const H = c.holders_list || [], kids = c.sects || [], gal = c.gallery || [];
  root.innerHTML = `<div class="wrap">
  <div class="coin-h">${c.image ? `<img src="${esc(c.image)}" alt="">` : ""}<div><div class="t">$${esc(c.ticker)}${c.parent ? ` · sect of $${esc(c.parent)}` : ""}</div><h1>${esc(c.name)}</h1></div>
    <div class="acts"><button class="pill" onclick="copy('${esc(c.mint)}')">${short(c.mint)}</button><a class="btn" href="https://pump.fun/coin/${esc(c.mint)}" target="_blank" rel="noopener">Buy on pump.fun</a><a class="btn primary" href="launch.html?parent=${esc(c.ticker)}">Start a sect</a></div></div>
  ${c.about ? `<p style="color:var(--txt2);max-width:760px;margin-bottom:14px">${esc(c.about)}</p>` : ""}
  <div class="card look"><div class="eyebrow">The mark</div><div class="q">${esc(c.look || "this cult's own picture")}</div><div class="hint">A profile picture that follows this look earns the wearing bonus, on pump.fun and on X, whatever the animal, background or style.</div></div>
  <div class="boxes five"><div class="box"><div class="k">Market cap</div><div class="v">${usd(c.mcap_usd)}</div></div><div class="box"><div class="k">Faithful</div><div class="v">${int(c.holders)}</div></div><div class="box"><div class="k">Wearing the mark</div><div class="v wear">${pct(c.wearing_pct)}</div></div><div class="box"><div class="k">Paid to the faithful</div><div class="v">${fmt(c.paid_sol)} SOL</div></div><div class="box"><div class="k">Sects</div><div class="v" style="color:var(--rite)">${kids.length}</div></div></div>
  <div class="subh">Sects <span class="cnt">${kids.length}</span></div>
  ${kids.length ? `<div class="kids">${kids.map(k => `<a class="kid" href="${cultUrl(k)}">${k.image ? `<img src="${esc(k.image)}" alt="">` : ""}<div><b>${esc(k.name)}</b><span><i>$${esc(k.ticker)}</i> · ${usd(k.mcap_usd)}</span></div></a>`).join("")}</div>` : `<div class="card emptyc">No sects yet. <a class="tx" href="launch.html?parent=${esc(c.ticker)}">Start the first one</a> and every buy of it buys $${esc(c.ticker)} first.</div>`}
  <div class="subh">Faithful</div>
  <div class="tbl"><table><thead><tr><th>Wallet</th><th class="num">Share</th><th class="num">Held for</th><th>Devotion</th><th>Wearing it</th><th class="num">Multiplier</th><th class="num">Paid</th></tr></thead><tbody>
  ${H.length ? H.map(h => { const d = devotion((h.held_seconds || 0) / 86400); return `<tr><td class="mono">${short(h.wallet)}</td><td class="num">${(h.share * 100).toFixed(2)}%</td><td class="num">${dur(h.held_seconds || 0)}</td><td><span class="bar"><i style="width:${(d - 1) / 3 * 100}%"></i></span><span class="mono">${d.toFixed(2)}x</span></td><td>${[h.wear_pf && "pump.fun", h.wear_x && "X"].filter(Boolean).join(" + ") || '<span class="dim">no</span>'}</td><td class="num">${(h.multiplier || 1).toFixed(2)}x</td><td class="num">${fmt(h.paid_sol, 3)} SOL</td></tr>`; }).join("") : `<tr class="erow"><td colspan="7">No wallet holds 0.2 SOL worth yet.</td></tr>`}
  </tbody></table></div>
  <div class="card dress"><div class="eyebrow">The rite</div><h2>Robe up $${esc(c.ticker)}</h2>
    <p>A cult wears the same face. Keep the cult's picture exactly as it is and give it something new: pick what to add, copy the prompt, and give it to ChatGPT or any image tool along with the cult's picture. Then add the result to the gallery below, and anyone wearing it counts straight away.</p>
    <div class="lbl">Add</div><div class="adds">${ADDS.map((a, i) => `<button class="add ${i ? "" : "on"}" data-a="${a}">${a.replace(/^an? /, "")}</button>`).join("")}</div>
    <div class="lbl">Or write your own</div><input id="own" placeholder="a cracked stone crown">
    <div class="lbl">The prompt</div><textarea id="prompt" rows="4" readonly></textarea>
    <div class="acts"><button class="btn primary" id="cpP">Copy the prompt</button>${c.image ? `<a class="btn" href="${esc(c.image)}" download="${esc(c.ticker)}.png" target="_blank" rel="noopener">Get the cult's picture</a>` : ""}</div></div>
  <div class="subh">The gallery <span class="cnt">${gal.length}</span></div>
  <div class="hint" style="margin:-4px 0 10px">Every picture here is the cult's own picture with something new. Wear any of them on pump.fun or X and it counts for the bonus right away.</div>
  <label class="gal-up"><div class="pv">PNG, JPG,<br>GIF, WebP</div><div><b>Add your picture</b><div class="hint" style="margin:2px 0 0">It is checked once, then it is in.</div></div><input type="file" id="galIn" accept="image/png,image/jpeg,image/gif,image/webp" hidden></label>
  ${gal.length ? `<div class="gallery">${gal.map(g => `<img src="${esc(g.image)}" alt="">`).join("")}</div>` : `<div class="gal-empty">No pictures yet. Make the first one and add it here.</div>`}
  </div>`;
  let add = ADDS[0];
  const upd = () => $("#prompt").value = dressPrompt($("#own").value.trim() || add);
  $$(".add").forEach(b => b.onclick = () => { $$(".add").forEach(x => x.classList.remove("on")); b.classList.add("on"); add = b.dataset.a; $("#own").value = ""; upd(); });
  $("#own").oninput = () => { $$(".add").forEach(x => x.classList.toggle("on", !$("#own").value.trim() && x.dataset.a === add)); upd(); };
  $("#cpP").onclick = () => copy($("#prompt").value); upd();
  $("#galIn").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size >= 4 * 1024 * 1024) return toast("Under 4 MB, please");
    if (!CONFIG.API_BASE) return notLive("Adding pictures to the gallery");
    const fd = new FormData(); fd.append("image", f); fd.append("wallet", Wallet.pk || "");
    const r = await api(`/cults/${encodeURIComponent(c.mint)}/gallery`, null, { method: "POST", body: fd });
    toast(r ? "Sent. It is checked once, then it is in." : "Upload failed, try again");
  };
}
const noCult = (t, s) => `<div class="wrap"><div class="phead"><div class="eyebrow">Cult</div><h1>${t}</h1><p>${s}</p><div style="display:flex;gap:8px;margin-top:20px"><a class="btn primary lg" href="cults.html">Every cult</a><a class="btn lg" href="launch.html">Found a cult</a></div></div></div>`;

/* ---------- ME (your offerings) ---------- */
function initMe() {
  const draw = async pk => {
    const box = $("#bags");
    if (!pk) { box.innerHTML = `<h3>Connect the wallet you hold with</h3><p>Nothing is signed to look. Your bags are read from the chain.</p><button class="btn primary" onclick="Wallet.connect()">Connect wallet</button>`; return; }
    const me = await getMe(pk), bags = me.bags || [];
    box.innerHTML = `<h3>Your bags <span class="mono dim" style="font-weight:400;font-size:13px;margin-left:6px">${short(pk)}</span></h3>` + (bags.length
      ? `<div class="tbl" style="margin-top:10px"><table style="min-width:520px"><thead><tr><th>Cult</th><th class="num">Held for</th><th class="num">Devotion</th><th class="num">Mark</th><th class="num">Paid you</th></tr></thead><tbody>${bags.map(b => `<tr class="click" onclick="location.href='${cultUrl(b)}'"><td>${cc(b)}</td><td class="num">${dur(b.held_seconds || 0)}</td><td class="num">${devotion((b.held_seconds || 0) / 86400).toFixed(2)}x</td><td class="num">${(b.mark || 1).toFixed(2)}x</td><td class="num">${fmt(b.paid_sol, 3)} SOL</td></tr>`).join("")}</tbody></table></div>`
      : `<p style="margin-top:6px">This wallet holds no cult with 0.2 SOL worth or more yet. <a class="tx" href="cults.html">Find a cult</a></p>`);
  };
  document.addEventListener("wallet", e => draw(e.detail)); draw(Wallet.pk);
  $("#xIn").onclick = async () => {
    if (!CONFIG.API_BASE) return notLive("Signing in with X");
    const pk = Wallet.pk || await Wallet.connect(); if (!pk) return;
    location.href = CONFIG.API_BASE.replace(/\/$/, "") + "/auth/x?wallet=" + encodeURIComponent(pk);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  chrome();
  ({ home: initHome, cults: initCults, ledger: initLedger, how: initHow, faq: () => { }, launch: initLaunch, cult: initCult, me: initMe }[document.body.dataset.page] || (() => { }))();
});
addEventListener("hashchange", () => document.body.dataset.page === "cult" && initCult());

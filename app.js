/* CBB Model picks site: renders window.CBB (data/site_data.js, written by export_site.py). */
(function () {
  "use strict";
  const D = window.CBB || {};
  const TODAY = D.today || { bets: [] };
  const RESULTS = D.results || [];
  const MINUS = "−";
  const app = document.getElementById("app");
  const sheet = document.getElementById("sheet");
  const state = { tFilter: "all", rMarket: "all", rPeriod: "season" };

  // ---------- formatting ----------
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const isNum = v => typeof v === "number" && isFinite(v);
  const signed = (v, d = 1) => !isNum(v) ? "—" : (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(v).toFixed(d);
  const spreadTxt = v => !isNum(v) ? "—" : v === 0 ? "PK" : (v > 0 ? "+" : MINUS) + Math.abs(v);
  const priceTxt = p => !isNum(p) ? "—" : (p > 0 ? "+" : MINUS) + Math.abs(Math.round(p));
  const pct = (v, d = 1) => !isNum(v) ? "—" : (v * 100).toFixed(d) + "%";
  const evTxt = v => !isNum(v) ? "—" : (v >= 0 ? "+" : MINUS) + Math.abs(v * 100).toFixed(1) + "%";
  const unitsTxt = u => !isNum(u) ? "—" : (u % 1 === 0 ? u.toFixed(0) : u.toFixed(1)) + "u";
  const profitTxt = v => !isNum(v) ? "—" : (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(v).toFixed(2) + "u";
  const cls = v => !isNum(v) || v === 0 ? "" : v > 0 ? "pos" : "neg";
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parseDay = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const dateTxt = (s, long = true) => { const d = parseDay(s); return isNaN(d) ? s : (long ? DAYS[d.getDay()] + ", " : DAYS[d.getDay()].slice(0, 3) + " ") + MONTHS[d.getMonth()] + " " + d.getDate(); };
  const tipTxt = t => {
    if (!t || !/^\d{1,2}:\d{2}/.test(t)) return "Time TBA";
    let [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ap}`;
  };
  const tipMin = t => (t && /^\d{1,2}:\d{2}/.test(t)) ? t.split(":").reduce((a, b, i) => a + (i ? +b : +b * 60), 0) : 9999;
  const rk = r => isNum(r) ? `<span class="rk">#${r}</span>` : "";
  const dots = u => `<span class="dots" aria-label="${unitsTxt(u)}">${[1, 2].map(i => `<i class="${i <= u ? "f" : ""}"></i>`).join("")}</span>`;
  const betTxt = b => b.market === "Spread" ? `${b.pick} ${spreadTxt(b.line)}` : `${b.pick} ${b.line}`;
  const nowET = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // ---------- header bits ----------
  function header() {
    const u = document.getElementById("updated");
    if (D.generated) {
      const [day, time] = D.generated.split(" ");
      u.textContent = `Updated ${dateTxt(day, false)} ${tipTxt(time)} ET`;
    }
  }
  function banners() {
    let h = "";
    if (D.sample) h += `<div class="banner"><b>Preview.</b> The bets are real (Nov 5, 6:00 AM odds); tip times, other books' lines, team ratings and results are sample numbers until the first export from your morning run.</div>`;
    const st = D.status || {};
    const bad = (st.steps || []).filter(s => !s.ok);
    if (bad.length) h += `<div class="banner bad"><b>This morning's run had a problem:</b> ${bad.map(s => esc(s.name)).join(", ")} did not finish. The picks below may be from an earlier run.</div>`;
    return h;
  }

  // ---------- TODAY ----------
  function tile(b) {
    let rows;
    if (b.market === "Spread") {
      const aw = b.side === "Away" ? b.line : isNum(b.line) ? -b.line : null;
      const hm = isNum(aw) ? -aw : null;
      rows = `<div class="team ${b.side === "Away" ? "pk" : ""}"><span class="nm">${rk(b.away_rank)}${esc(b.away)}</span><span class="ln">${spreadTxt(aw)}</span></div>
              <div class="team ${b.side === "Home" ? "pk" : ""}"><span class="nm">${rk(b.home_rank)}${esc(b.home)}</span><span class="ln">${spreadTxt(hm)}</span></div>`;
    } else {
      rows = `<div class="team"><span class="nm">${rk(b.away_rank)}${esc(b.away)}</span><span class="ln"></span></div>
              <div class="team"><span class="nm">${rk(b.home_rank)}${esc(b.home)}</span><span class="ln"></span></div>
              <div class="team pk"><span class="nm">${esc(b.pick)}</span><span class="ln">${b.line}</span></div>`;
    }
    const third = b.market === "Spread" ? ["Edge", signed(b.edge)] : ["Cover", pct(b.cover)];
    return `<button type="button" class="tile" data-id="${esc(b.id)}" aria-label="Details: ${esc(betTxt(b))}, ${esc(b.away)} at ${esc(b.home)}">
      <span class="t-bar"><span>${b.market} &middot; ${unitsTxt(b.units)}</span>${dots(b.units)}</span>
      ${rows}
      <span class="t-foot"><span>Price<b>${priceTxt(b.price)}</b></span><span>Book<b>${esc(b.book)}</b></span><span>${third[0]}<b>${third[1]}</b></span><span>EV<b>${evTxt(b.ev)}</b></span></span>
    </button>`;
  }

  function viewToday() {
    const all = TODAY.bets || [];
    const f = state.tFilter;
    const list = all.filter(b => f === "all" || (f === "spread" && b.market === "Spread") || (f === "total" && b.market === "Total") || (f === "two" && b.units >= 2));
    const sum = a => a.reduce((t, b) => t + (b.units || 0), 0);
    const sp = all.filter(b => b.market === "Spread"), to = all.filter(b => b.market === "Total");
    const notToday = TODAY.date && TODAY.date !== isoDay(nowET());
    const chip = (k, label) => `<button type="button" class="chip" data-tf="${k}" aria-pressed="${f === k}">${label}</button>`;
    let body;
    if (!all.length) {
      body = `<div class="empty">${TODAY.games ? `<b>No bets today.</b> The model priced ${TODAY.games} games and none passed the staking rule.` : `<b>No picks yet.</b> Today's picks appear after the morning run (about 6:10 AM ET).`}</div>`;
    } else if (!list.length) {
      body = `<div class="empty">No bets match this filter.</div>`;
    } else {
      const slots = [];
      list.slice().sort((a, b) => tipMin(a.tip) - tipMin(b.tip)).forEach(b => {
        const k = tipTxt(b.tip);
        if (!slots.length || slots[slots.length - 1].k !== k) slots.push({ k, bets: [] });
        slots[slots.length - 1].bets.push(b);
      });
      body = slots.map(s => `<section class="slot"><h2>${s.k}</h2><div class="grid">${s.bets.map(tile).join("")}</div></section>`).join("");
    }
    app.innerHTML = `${banners()}
      <div class="head">
        <div><h1>${TODAY.date ? dateTxt(TODAY.date) : "Today"}</h1>
          <p>${notToday ? "Latest picks available &middot; " : ""}Lines from ${TODAY.odds_pulled ? tipTxt(TODAY.odds_pulled.slice(11)) + " ET" : "the morning pull"} at the best book. Tap a game for details.</p></div>
        <div class="chips" role="group" aria-label="Filter">${chip("all", `All ${all.length}`)}${chip("spread", `Spreads ${sp.length}`)}${chip("total", `Totals ${to.length}`)}${chip("two", "2-unit")}</div>
      </div>
      <div class="stats">
        <div class="stat"><span>Bets</span><strong>${all.length}</strong><small>${TODAY.games || 0} games priced</small></div>
        <div class="stat"><span>Units</span><strong>${unitsTxt(sum(all))}</strong><small>at risk today</small></div>
        <div class="stat"><span>Spreads</span><strong>${sp.length}</strong><small>${unitsTxt(sum(sp))}</small></div>
        <div class="stat"><span>Totals</span><strong>${to.length}</strong><small>${unitsTxt(sum(to))}</small></div>
      </div>
      ${TODAY.early ? `<div class="small" style="margin:0 0 12px">${esc(TODAY.early)}</div>` : ""}
      ${body}`;
    app.querySelectorAll("[data-tf]").forEach(b => b.addEventListener("click", () => { state.tFilter = b.dataset.tf; viewToday(); }));
    app.querySelectorAll(".tile").forEach(t => t.addEventListener("click", () => openDetail(t.dataset.id)));
  }

  // ---------- detail sheet ----------
  function openDetail(id) {
    const b = (TODAY.bets || []).find(x => x.id === id);
    if (!b) return;
    const S = b.market === "Spread";
    const kv = (pairs, wide) => `<div class="kv${wide ? " wide" : ""}">${pairs.filter(Boolean).map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join("")}</div>`;
    // why it qualified
    const rule = ((D.rule || {})[S ? "spread" : "total"]) || "";
    const why = `Edge <b>${signed(b.edge)} pts</b> and EV <b>${evTxt(b.ev)}</b> qualify for <b>${unitsTxt(b.units)}</b>`
      + (rule ? ` under the ${S ? "spread" : "total"} rule: ${esc(rule)}.` : ".")
      + ((D.rule || {}).early ? ` ${esc(D.rule.early)}.` : "");
    let to = "";
    if (S) {
      const p = [];
      if (isNum(b.to2)) p.push(`<b>2u</b> through ${spreadTxt(b.to2)}`);
      if (isNum(b.to1)) p.push(`<b>1u</b> through ${spreadTxt(b.to1)}`);
      to = p.length ? `At a ${priceTxt(-110)} price, ${esc(b.pick)} is still a bet: ${p.join(", ")}. A better price (like ${priceTxt(-105)}) can still qualify at a worse line; the books table below checks each one.` : "";
    } else if (isNum(b.to1)) {
      to = `At a ${priceTxt(-110)} price, still a bet ${b.side === "Over" ? "up to" : "down to"} <b>${b.side} ${b.to1}</b>. A better price can still qualify past that; the books table below checks each one.`;
    }
    // playable to: each line moving against the pick, with the worst price that still gets 1u / 2u
    const lineTxt = v => S ? spreadTxt(v) : `${b.side} ${v}`;
    const worst = p => !isNum(p) ? "—" : p <= -300 ? "any price" : `${priceTxt(p)} or better`;
    const play = (b.play || []).map(([ln, p1, p2]) => `<tr class="${ln === b.line ? "best" : ""}">
        <td>${lineTxt(ln)}</td><td class="r">${worst(p1)}</td><td class="r">${isNum(p2) ? worst(p2) : "—"}</td></tr>`).join("");
    const last = (b.play || []).length ? b.play[b.play.length - 1] : null;
    const playHtml = play ? `<div class="tbl"><table><thead><tr><th>Line</th><th class="r">1 unit if price is</th><th class="r">2 units if price is</th></tr></thead><tbody>${play}</tbody></table></div>
      <div class="small">Playable down to <b>${lineTxt(last[0])} at ${priceTxt(last[1])}</b>. Worse than any row here, no bet. "${priceTxt(-110)} or better" means ${priceTxt(-110)}, ${priceTxt(-105)}, +100 and so on.</div>` : "";
    const cons = isNum(b.cons_line) ? `Consensus ${S ? spreadTxt(b.cons_line) : b.side + " " + b.cons_line} (${priceTxt(b.cons_price)}): cover ${pct(b.cons_cover)}, EV ${evTxt(b.cons_ev)}.` : "";
    // books
    const books = (b.books || []).map(x => {
      const best = x.book === b.book && x.line === b.line;
      return `<tr class="${best ? "best" : ""} ${x.units > 0 ? "" : "nobet"}">
        <td>${esc(x.book)}</td><td class="r">${S ? spreadTxt(x.line) : x.line}</td><td class="r">${priceTxt(x.price)}</td>
        <td class="r hide-sm">${pct(x.cover)}</td><td class="r">${evTxt(x.ev)}</td>
        <td class="r">${x.units > 0 ? `<span class="u-pill ${x.units >= 2 ? "two" : ""}">${unitsTxt(x.units)}</span>` : "no bet"}</td></tr>`;
    }).join("");
    // prediction
    const P = b.pred || {};
    const marg = v => !isNum(v) ? "—" : v >= 0 ? `${esc(b.home)} by ${v.toFixed(1)}` : `${esc(b.away)} by ${(-v).toFixed(1)}`;
    const awayWin = isNum(P.away_pts) && isNum(P.home_pts) && P.away_pts > P.home_pts;
    // game
    const G = b.game || {}, A = G.away || {}, H = G.home || {};
    const trow = (label, f) => `<tr><td>${label}</td><td class="r">${f(A, b.away_rank)}</td><td class="r">${f(H, b.home_rank)}</td></tr>`;
    const n1 = (v, d = 1) => isNum(v) ? v.toFixed(d) : "—";
    const place = [G.venue, [G.city, G.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
    sheet.innerHTML = `<div class="sheet-in">
      <div class="sh-head">
        <div class="sh-top"><span>${tipTxt(b.tip)} ET &middot; ${b.market} &middot; ${unitsTxt(b.units)} ${dots(b.units)}</span>
          <button type="button" class="close" id="sheet-close">Close</button></div>
        <div class="sh-bet" id="sheet-title">${esc(b.pick)} <em>${S ? spreadTxt(b.line) : b.line}</em></div>
        <div class="sh-sub num">${priceTxt(b.price)} at ${esc(b.book)} &middot; ${esc(b.away)} at ${esc(b.home)}</div>
      </div>
      <div class="sh-body">
        <section class="sec"><h3>The bet</h3>
          ${kv([["Units", unitsTxt(b.units)], ["Edge", S ? signed(b.edge) + " pts" : signed(b.edge) + " pts"], ["Cover", pct(b.cover)], isNum(b.push) && b.push > 0.001 ? ["Push", pct(b.push)] : null, ["EV / unit", evTxt(b.ev)]])}
          <div class="note">${why}</div>
          ${to && !play ? `<div class="note">${to}</div>` : ""}
          ${cons ? `<div class="small num">${cons}</div>` : ""}
        </section>
        ${playHtml ? `<section class="sec"><h3>Playable to</h3>${playHtml}</section>` : ""}
        <section class="sec"><h3>Every sportsbook</h3>
          ${books ? `<div class="tbl"><table><thead><tr><th>Book</th><th class="r">Line</th><th class="r">Price</th><th class="r hide-sm">Cover</th><th class="r">EV</th><th class="r">Bet?</th></tr></thead><tbody>${books}</tbody></table></div>
          <div class="small">Highlighted row is the line the bet was made at. "No bet" means that line or price fails the staking rule.</div>` : `<div class="small">No book-by-book lines saved for this game.</div>`}
        </section>
        <section class="sec"><h3>Model prediction</h3>
          <div class="score num">
            <span class="${awayWin ? "w" : "small"}">${esc(b.away)}</span><span class="s">${n1(P.away_pts)}</span>
            <span class="${!awayWin ? "w" : "small"}">${esc(b.home)}</span><span class="s">${n1(P.home_pts)}</span>
          </div>
          ${kv([["Model margin", marg(P.margin)], ["Model total", n1(P.total)], ["Home win", pct(P.home_wp, 0)],
                ["Model + market margin", isNum(P.exp_margin) ? `${marg(P.exp_margin)} ±${n1(P.margin_sd)}` : "—"],
                ["Model + market total", isNum(P.exp_total) ? `${n1(P.exp_total)} ±${n1(P.total_sd)}` : "—"]], true)}
          <div class="small">Cover % and EV come from the model-plus-market estimate, which weighs the model against the 7am line using every earlier game.</div>
        </section>
        <section class="sec"><h3>Game</h3>
          ${kv([["Tip", tipTxt(b.tip) + " ET"], ["Site", esc(G.site || "—")], ["Conference game", esc(G.conf_game || "—")], G.tv ? ["TV", esc(G.tv)] : null, isNum(G.books) ? ["Books with lines", G.books] : null])}
          ${place ? `<div class="small">${esc(place)}</div>` : ""}
          <div class="tbl"><table><thead><tr><th></th><th class="r">${esc(b.away)}</th><th class="r">${esc(b.home)}</th></tr></thead><tbody>
            ${trow("Record", t => isNum(t.wins) ? `${t.wins}-${t.losses}` : "—")}
            ${trow("Conference", t => esc(t.conf || "—"))}
            ${trow("AP rank", (t, r) => isNum(r) ? "#" + r : "—")}
            ${trow("Torvik adj. offense", t => n1(t.adjoe))}
            ${trow("Torvik adj. defense", t => n1(t.adjde))}
            ${trow("Tempo", t => n1(t.adjt))}
            ${trow("Barthag", t => isNum(t.barthag) ? t.barthag.toFixed(3) : "—")}
            ${trow("Elo", t => n1(t.elo, 0))}
            ${trow("Days rest", t => n1(t.rest, 0))}
          </tbody></table></div>
        </section>
      </div></div>`;
    sheet.querySelector("#sheet-close").addEventListener("click", () => sheet.close());
    if (typeof sheet.showModal === "function") sheet.showModal(); else sheet.setAttribute("open", "");
  }
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });

  // ---------- RESULTS ----------
  const graded = r => r.result === "Win" || r.result === "Loss" || r.result === "Push";
  function summarize(rows) {
    const g = rows.filter(graded);
    const w = g.filter(r => r.result === "Win").length, l = g.filter(r => r.result === "Loss").length, p = g.length - w - l;
    const risk = g.reduce((t, r) => t + (r.units || 0), 0), prof = g.reduce((t, r) => t + (r.profit || 0), 0);
    const c = g.filter(r => isNum(r.clv));
    return { n: g.length, w, l, p, risk, prof, roi: risk ? prof / risk : null,
      clv: c.length ? c.reduce((t, r) => t + r.clv, 0) / c.length : null, beat: c.length ? c.filter(r => r.clv > 0).length / c.length : null };
  }
  function filteredResults() {
    let rows = RESULTS.slice();
    if (state.rMarket !== "all") rows = rows.filter(r => r.market === (state.rMarket === "spread" ? "Spread" : "Total"));
    if (state.rPeriod !== "season") {
      const days = state.rPeriod === "7" ? 7 : 30;
      const cut = nowET(); cut.setDate(cut.getDate() - days);
      rows = rows.filter(r => parseDay(r.date) >= new Date(cut.getFullYear(), cut.getMonth(), cut.getDate()));
    }
    return rows;
  }
  function statTiles(s) {
    return `<div class="stats">
      <div class="stat"><span>Record</span><strong>${s.w}-${s.l}${s.p ? "-" + s.p : ""}</strong><small>${s.n} graded bets</small></div>
      <div class="stat"><span>Profit</span><strong class="${cls(s.prof)}">${profitTxt(s.prof)}</strong><small>on ${unitsTxt(s.risk)} risked</small></div>
      <div class="stat"><span>ROI</span><strong class="${cls(s.roi)}">${isNum(s.roi) ? (s.roi >= 0 ? "+" : MINUS) + Math.abs(s.roi * 100).toFixed(1) + "%" : "—"}</strong><small>per unit risked</small></div>
      <div class="stat"><span>Avg CLV</span><strong class="${cls(s.clv)}">${isNum(s.clv) ? signed(s.clv, 2) : "—"}</strong><small>${isNum(s.beat) ? pct(s.beat, 0) + " beat the close" : "points vs the close"}</small></div>
    </div>`;
  }
  function viewResults() {
    const rows = filteredResults();
    const chip = (key, k, label) => `<button type="button" class="chip" data-${key}="${k}" aria-pressed="${state[key === "rm" ? "rMarket" : "rPeriod"] === k}">${label}</button>`;
    const byDay = {};
    rows.forEach(r => (byDay[r.date] = byDay[r.date] || []).push(r));
    const days = Object.keys(byDay).sort().reverse();
    const row = r => `<div class="row">
      ${graded(r) ? `<span class="res ${r.result}">${r.result === "Win" ? "WIN" : r.result === "Loss" ? "LOSS" : "PUSH"}</span>` : `<span class="pend">${r.result === "Pending" ? "PENDING" : "NO RESULT"}</span>`}
      <span class="u">${unitsTxt(r.units)}</span>
      <span class="b">${esc(r.bet)} <span class="small num">${priceTxt(r.price)} ${esc(r.book)}</span></span>
      <span class="p ${cls(r.profit)}">${graded(r) ? profitTxt(r.profit) : ""}</span>
      <span></span><span></span>
      <span class="g">${r.market} &middot; ${esc(r.game)}${r.final ? " &middot; final " + esc(r.final) : ""}</span>
      <span class="c num">${isNum(r.clv) ? "CLV " + signed(r.clv) : ""}</span>
    </div>`;
    const body = days.length ? days.map(d => {
      const s = summarize(byDay[d]);
      const pend = byDay[d].length - s.n;
      const sub = s.n ? `${s.w}-${s.l}${s.p ? "-" + s.p : ""} &middot; <span class="${cls(s.prof)}">${profitTxt(s.prof)}</span> on ${unitsTxt(s.risk)}${pend ? ` &middot; ${pend} pending` : ""}` : `${pend} pending`;
      const ordered = byDay[d].slice().sort((a, b) => tipMin(a.tip) - tipMin(b.tip));
      return `<section class="day"><h2>${dateTxt(d)}<span class="num">${sub}</span></h2><div class="rows">${ordered.map(row).join("")}</div></section>`;
    }).join("") : `<div class="empty">No staked bets in this view yet.</div>`;
    app.innerHTML = `${banners()}
      <div class="head"><div><h1>Results</h1><p>Every staked bet at the price it was made, graded after the games. Profit is in units.</p></div>
        <div class="chips" role="group" aria-label="Filter results">
          ${chip("rm", "all", "All")}${chip("rm", "spread", "Spreads")}${chip("rm", "total", "Totals")}
          ${chip("rp", "7", "7 days")}${chip("rp", "30", "30 days")}${chip("rp", "season", "Season")}
        </div></div>
      ${statTiles(summarize(rows))}
      ${body}`;
    app.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { state.rMarket = b.dataset.rm; viewResults(); }));
    app.querySelectorAll("[data-rp]").forEach(b => b.addEventListener("click", () => { state.rPeriod = b.dataset.rp; viewResults(); }));
  }

  // ---------- PERFORMANCE ----------
  function chart(rows) {
    const g = rows.filter(graded);
    const days = [...new Set(g.map(r => r.date))].sort();
    if (days.length < 2) return `<div class="small">The profit chart appears after two graded days.</div>`;
    const series = ["All", "Spread", "Total"].map(m => {
      let run = 0;
      return { m, pts: days.map(d => { run += g.filter(r => r.date === d && (m === "All" || r.market === m)).reduce((t, r) => t + (r.profit || 0), 0); return run; }) };
    });
    const vals = series.flatMap(s => s.pts).concat([0]);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const span = Math.max(hi - lo, 4); const stepRaw = span / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(stepRaw))); const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => k >= stepRaw);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const W = 800, H = 260, L = 44, R = 118, T = 12, B = 28;
    const x = i => L + (W - L - R) * (days.length === 1 ? 0 : i / (days.length - 1));
    const y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    let grid = "";
    for (let v = lo; v <= hi + 1e-9; v += step) {
      grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="${Math.abs(v) < 1e-9 ? 1.5 : 1}"/>
        <text x="${L - 8}" y="${y(v) + 4}" fill="var(--muted)" font-size="12" text-anchor="end">${v > 0 ? "+" : v < 0 ? MINUS : ""}${Math.abs(v)}</text>`;
    }
    const lab = [0, Math.floor((days.length - 1) / 2), days.length - 1].filter((v, i, a) => a.indexOf(v) === i)
      .map((i, k, a) => `<text x="${x(i)}" y="${H - 8}" fill="var(--muted)" font-size="12" text-anchor="${k === 0 ? "start" : k === a.length - 1 ? "end" : "middle"}">${dateTxt(days[i], false).slice(4)}</text>`).join("");
    const colors = { All: "var(--hot)", Spread: "var(--ink)", Total: "var(--muted)" };
    const path = s => s.pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    const all = series[0];
    const area = `${path(all)}L${x(days.length - 1)},${y(Math.max(lo, Math.min(0, hi)))}L${x(0)},${y(Math.max(lo, Math.min(0, hi)))}Z`;
    const lines = series.map(s => `<path d="${path(s)}" fill="none" stroke="${colors[s.m]}" stroke-width="${s.m === "All" ? 2.5 : 1.5}" ${s.m === "Total" ? 'stroke-dasharray="5 4"' : ""}/>`).join("");
    const ends = series.map(s => { const v = s.pts[s.pts.length - 1]; return { s, v }; });
    // keep end labels from overlapping
    const placed = ends.slice().sort((a, b) => y(a.v) - y(b.v)); let lastY = -99;
    const endLabels = placed.map(e => { let yy = Math.max(y(e.v) + 4, lastY + 14); lastY = yy;
      return `<circle cx="${x(days.length - 1)}" cy="${y(e.v)}" r="${e.s.m === "All" ? 4 : 3}" fill="${colors[e.s.m]}"/>
        <text x="${x(days.length - 1) + 8}" y="${yy}" fill="${colors[e.s.m]}" font-size="12">${e.s.m === "All" ? "All" : e.s.m + "s"} ${e.v > 0 ? "+" : e.v < 0 ? MINUS : ""}${Math.abs(e.v).toFixed(1)}</text>`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative profit in units by day">
      ${grid}<path d="${area}" fill="var(--hot)" opacity=".12"/>${lines}${endLabels}${lab}</svg>`;
  }
  function table(title, groups) {
    const rows = groups.filter(([, rs]) => rs.some(graded)).map(([label, rs]) => {
      const s = summarize(rs);
      return `<tr><td>${label}</td><td class="r">${s.n}</td><td class="r">${s.w}-${s.l}${s.p ? "-" + s.p : ""}</td>
        <td class="r ${cls(s.prof)}">${profitTxt(s.prof)}</td><td class="r ${cls(s.roi)}">${isNum(s.roi) ? (s.roi >= 0 ? "+" : MINUS) + Math.abs(s.roi * 100).toFixed(1) + "%" : "—"}</td>
        <td class="r">${isNum(s.clv) ? signed(s.clv, 2) : "—"}</td></tr>`;
    }).join("");
    return `<div class="panel"><h2>${title}</h2>${rows ? `<div class="tbl"><table><thead><tr><th></th><th class="r">Bets</th><th class="r">W-L-P</th><th class="r">Profit</th><th class="r">ROI</th><th class="r">CLV</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="small">No graded bets yet.</div>`}</div>`;
  }
  function viewPerformance() {
    const rows = RESULTS;
    const s = summarize(rows);
    const sp = rows.filter(r => r.market === "Spread"), to = rows.filter(r => r.market === "Total");
    const edgeB = [[2, 3], [3, 4], [4, 5], [5, 99]], evB = [[0.04, 0.06], [0.06, 0.08], [0.08, 9]];
    const months = [...new Set(rows.map(r => r.date.slice(0, 7)))].sort();
    app.innerHTML = `${banners()}
      <div class="head"><div><h1>Performance</h1><p>Season to date, staked bets under the live rule. Spreads: ${esc((D.rule || {}).spread || "")}. Totals: ${esc((D.rule || {}).total || "")}.${(D.rule || {}).books ? ` Books: ${esc(D.rule.books)}.` : ""}${(D.rule || {}).early ? ` ${esc(D.rule.early)}.` : ""}</p></div></div>
      ${statTiles(s)}
      <div class="stats">
        <div class="stat"><span>Win rate</span><strong>${s.w + s.l ? pct(s.w / (s.w + s.l)) : "—"}</strong><small>break-even about 52.4% at ${MINUS}110</small></div>
        <div class="stat"><span>Spreads</span><strong class="${cls(summarize(sp).prof)}">${profitTxt(summarize(sp).prof)}</strong><small>${summarize(sp).n} graded</small></div>
        <div class="stat"><span>Totals</span><strong class="${cls(summarize(to).prof)}">${profitTxt(summarize(to).prof)}</strong><small>${summarize(to).n} graded</small></div>
        <div class="stat"><span>Graded days</span><strong>${new Set(rows.filter(graded).map(r => r.date)).size}</strong><small>since the first pick</small></div>
      </div>
      <div class="panel chart"><h2>Profit over time (units)</h2>${chart(rows)}</div>
      <div class="cols">
        ${table("By market", [["Spreads", sp], ["Totals", to]])}
        ${table("By units", [["1 unit", rows.filter(r => r.units === 1)], ["2 units", rows.filter(r => r.units >= 2)]])}
        ${table("Spreads by edge (pts)", edgeB.map(([a, b]) => [b > 50 ? `${a}+` : `${a}–${b}`, sp.filter(r => isNum(r.edge) && r.edge >= a && r.edge < b)]))}
        ${table("Totals by EV", evB.map(([a, b]) => [b > 1 ? `${a * 100}%+` : `${a * 100}–${b * 100}%`, to.filter(r => isNum(r.ev) && r.ev >= a && r.ev < b)]))}
        ${table("By month", months.map(m => [`${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}`, rows.filter(r => r.date.startsWith(m))]))}
      </div>
      <p class="foot">Early-season samples are small: a few dozen bets can swing either way on luck alone. Average CLV (how often the bet beat the closing line) is the earliest sign of a real edge.</p>`;
  }

  // ---------- routing ----------
  const VIEWS = { today: viewToday, results: viewResults, performance: viewPerformance };
  function route() {
    const v = (location.hash || "").slice(1);
    const key = VIEWS[v] ? v : "today";
    document.querySelectorAll(".nav a").forEach(a => a.setAttribute("aria-current", a.dataset.view === key ? "page" : "false"));
    if (sheet.open) sheet.close();
    VIEWS[key]();
    window.scrollTo(0, 0);
  }
  header();
  window.addEventListener("hashchange", route);
  route();
})();

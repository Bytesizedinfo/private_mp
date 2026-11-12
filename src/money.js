/* ===== Spend & Save money engine =====
   Pure functions: no DOM, no storage, no clock. The app passes in the settings, the current plan month and a few
   ledger facts (balances now, what's been put in this month, Spending left). Plan months are 'YYYY-MM' keys named
   like the app's short month labels: the month a period starts in when it starts on the 1st–15th, otherwise the
   month it ends in. Money is added up in whole cents and rounded to cents on the way out.

   The money order every month: bills (and debt minimums) → savings % → goals by priority → spending money.
   Extras (bonus, side gigs, ang bao) never fund the plan; in the "with extras" scenario their counted share is
   shared out by its own rule: a % to goals, the rest to spending (or savings). */
const Money = (() => {
'use strict';
const r2 = n => Math.round((+n + Number.EPSILON) * 100) / 100;
const cents = n => Math.round((+n || 0) * 100);
const sum = a => a.reduce((x, y) => x + (+y || 0), 0);
const pad = n => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const parts = s => s.split('-').map(Number);
const daysIn = (y, m) => new Date(y, m, 0).getDate();
const toDate = s => { const [y, m, d] = parts(s); return new Date(y, m - 1, d); };
const fromDate = dt => ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
const addDays = (s, n) => { const dt = toDate(s); dt.setDate(dt.getDate() + n); return fromDate(dt); };
const addMonths = (s, n) => { let [y, m, d] = parts(s); m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return ymd(y, m, Math.min(d, daysIn(y, m))); };
const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
const isKey = v => /^\d{4}-\d{2}$/.test(v || '');

/* ---------- plan months ---------- */
const keyAdd = (k, n) => addMonths(k + '-01', n).slice(0, 7);
const keyDiff = (a, b) => { const [y1, m1] = parts(a), [y2, m2] = parts(b); return (y2 - y1) * 12 + (m2 - m1); };
const keyList = (a, n) => Array.from({ length: Math.max(0, n) }, (_, i) => keyAdd(a, i));
const msOf = st => Math.min(28, Math.max(1, Math.round(+(st && st.monthStart) || 1)));
function periodOfDate(ds, ms) { let [y, m, d] = parts(ds); if (d < ms) { m--; if (m < 1) { m = 12; y--; } } const start = ymd(y, m, ms); return { start, end: addDays(addMonths(start, 1), -1) }; }
const planKey = (p, ms) => (ms <= 15 ? p.start : p.end).slice(0, 7);
const keyOfDate = (ds, ms) => planKey(periodOfDate(ds, ms), ms);
function periodOfKey(k, ms) { const [y, m] = parts(ms <= 15 ? k : keyAdd(k, -1)); const start = ymd(y, m, ms); return { start, end: addDays(addMonths(start, 1), -1) }; }

/* ---------- income ---------- */
const sortSalary = list => [...(list || [])].filter(s => s && isFinite(+s.amt)).sort((a, b) => (a.from || '') < (b.from || '') ? -1 : (a.from || '') > (b.from || '') ? 1 : 0);
/* salary for a plan month: the latest change on or before it, unless that month has its own amount */
function salaryAt(inc, k) {
  const o = inc && inc.over && inc.over[k];
  if (o && o.sal != null && o.sal !== '' && isFinite(+o.sal)) return r2(+o.sal);
  let v = 0; for (const s of sortSalary(inc && inc.salary)) if (!s.from || s.from <= k) v = +s.amt || 0;
  return r2(v);
}
/* extras expected in a month that haven't arrived or been dropped */
const extrasIn = (inc, k) => ((inc && inc.extras) || []).filter(x => x && x.month === k && !x.got && !x.gone && +x.amt > 0);
const countedOf = x => x.count === false ? 0 : r2(+x.amt * (x.share == null ? 0.5 : Math.max(0, Math.min(1, +x.share))));

/* ---------- bills ---------- */
function stepDate(x, d) {
  if (x.cycle === 'daily') return addDays(d, 1);
  if (x.cycle === 'weekly') return addDays(d, 7);
  const n = x.cycle === 'quarterly' ? 3 : x.cycle === 'yearly' ? 12 : 1, [y, m] = parts(d), [fy, fm] = parts(addMonths(ymd(y, m, 1), n));
  return ymd(fy, fm, Math.min(x.day || parts(d)[2], daysIn(fy, fm)));
}
/* every unpaid bill from its next due date to the end of endKey, by plan month; overdue ones count in curKey.
   { key: { spend: amount paid from Spending, cats: { saveCatId: amount paid from that savings category } } } */
function billsByKey(st, curKey, endKey) {
  const ms = msOf(st), end = periodOfKey(endKey, ms).end, cats = new Set((st.saveCats || []).map(c => c.id)), out = {};
  for (const x of st.subs || []) {
    if (x.active === false || !(+x.amount > 0) || !isDay(x.next)) continue;
    const from = x.from && x.from !== 'spend' && cats.has(x.from) ? x.from : 'spend';
    let d = x.next, guard = 0;
    while (d <= end && guard++ < 8000) {
      let k = keyOfDate(d, ms); if (k < curKey) k = curKey;
      const b = out[k] || (out[k] = { spend: 0, cats: {} });
      if (from === 'spend') b.spend = r2(b.spend + +x.amount); else b.cats[from] = r2((b.cats[from] || 0) + +x.amount);
      d = stepDate(x, d);
    }
  }
  return out;
}
const monthlyEq = x => x.cycle === 'yearly' ? x.amount / 12 : x.cycle === 'quarterly' ? x.amount / 3 : x.cycle === 'weekly' ? x.amount * 52 / 12 : x.cycle === 'daily' ? x.amount * 365 / 12 : +x.amount;

/* ---------- goals & plans ---------- */
const KIND_ORDER = { emergency: 0, debt: 1, travel: 2, big: 3, other: 4 };
const isDebt = c => !!(c && c.kind === 'debt' && c.debt);
const hasPlan = c => !!(c && ((c.phases && c.phases.length) || c.goal));
/* goals still open, plus savings categories with a monthly plan, in priority order */
function planItems(st) {
  const pri = st.priority || [];
  const list = (st.saveCats || []).filter(c => !c.done && hasPlan(c));
  const rank = c => { const i = pri.indexOf(c.id); return i >= 0 ? i : 1000 + (c.goal ? 0 : 500) + (KIND_ORDER[c.kind] ?? 4) * 10; };
  return list.map((c, i) => ({ c, r: rank(c), i })).sort((a, b) => a.r - b.r || a.i - b.i).map(x => x.c);
}
/* what a plan puts in during month k (phases may overlap; they add up) */
function phaseAmt(phases, k) { let a = 0; for (const p of phases || []) if ((!p.from || p.from <= k) && (!p.to || k <= p.to)) a += +p.amt || 0; return r2(a); }
/* consecutive months with the same amount become one phase; months with nothing are left out */
function groupPhases(keys, amts, openEnd = false) {
  const out = []; let cur = null;
  keys.forEach((k, i) => {
    const a = r2(amts[i] || 0);
    if (cur && Math.abs(cur.amt - a) < 0.005 && a > 0.004) { cur.to = k; return; }
    cur = a > 0.004 ? { from: k, to: k, amt: a } : null; if (cur) out.push(cur);
  });
  if (openEnd && out.length && out[out.length - 1].to === keys[keys.length - 1]) out[out.length - 1].to = null;
  return out;
}
const expandPhases = (phases, keys) => keys.map(k => phaseAmt(phases, k));
/* checks for phases you typed: overlaps, negative amounts, from after to */
function checkPhases(phases) {
  const errs = [], list = (phases || []).map((p, i) => ({ ...p, i }));
  for (const p of list) {
    if (!(+p.amt >= 0)) errs.push({ i: p.i, msg: 'Amount can’t be negative.' });
    if (p.from && p.to && p.from > p.to) errs.push({ i: p.i, msg: 'Ends before it starts.' });
  }
  for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
    const A = list[a], B = list[b], aS = A.from || '0000-00', aE = A.to || '9999-99', bS = B.from || '0000-00', bE = B.to || '9999-99';
    if (aS <= bE && bS <= aE) errs.push({ i: B.i, msg: 'Overlaps another phase.' });
  }
  return errs;
}
const stepFor = a => a < 100 ? 5 : a < 1000 ? 10 : 50;
const ceilTo = (v, s) => Math.ceil(r2(v) / s - 1e-9) * s;

/* ---------- the forecast ----------
   ctx: { st, curKey, months, scenario: 'salary' | 'extras',
          bal: { catId: balance now }, put: { catId: put in this plan month so far (debts: also paid to the lender) },
          spendLeft, payLogged, payAmt, owed: { debtId: owed now }, target: { goalId: target to use (emergency fund) },
          phases: { goalId: phases to use instead of its own } }
   returns { keys, months: [M], finish: { id: key it's reached | null }, start: { bal, owed } } */
function saveSplitOf(st) {
  const ids = new Set((st.saveCats || []).map(c => c.id)), raw = st.saveSplit || {}, out = {};
  for (const [k, v] of Object.entries(raw)) if (ids.has(k) && +v > 0) out[k] = +v;
  if (!Object.keys(out).length) out[ids.has('general') ? 'general' : ids.has('other') ? 'other' : [...ids][0] || 'other'] = 100;
  return out;
}
function splitCents(c, split) { // share c cents by percentages; the rounding remainder goes to the biggest share
  const keys = Object.keys(split).filter(k => +split[k] > 0), tot = sum(keys.map(k => +split[k])), out = {};
  if (!keys.length || !tot) return out;
  let used = 0, big = keys[0];
  for (const k of keys) { out[k] = Math.round(c * split[k] / tot); used += out[k]; if (+split[k] > +split[big]) big = k; }
  out[big] += c - used; return out;
}
function forecast(ctx) {
  const st = ctx.st, inc = st.income || {}, n = Math.max(1, Math.min(240, Math.round(ctx.months || 12))), keys = keyList(ctx.curKey, n);
  const items = planItems(st).filter(c => !(ctx.skip || []).includes(c.id));
  const phasesOf = c => ctx.phases && Object.prototype.hasOwnProperty.call(ctx.phases, c.id) ? ctx.phases[c.id] || [] : c.phases || [];
  const tgtOf = c => ctx.target && ctx.target[c.id] != null ? +ctx.target[c.id] : +c.target || 0;
  const bills = billsByKey(st, ctx.curKey, keys[keys.length - 1]);
  const pct = Math.max(0, Math.min(100, +st.savePct || 0)), split = saveSplitOf(st), floor = +st.spendFloor || 0;
  const goalPctDefault = st.extraGoalPct == null ? 50 : +st.extraGoalPct;
  const carryMode = st.monthEnd !== 'savings', extrasOn = ctx.scenario === 'extras';
  const put = id => cents(ctx.put && ctx.put[id]);
  const bal = {}; for (const c of st.saveCats || []) bal[c.id] = cents(ctx.bal && ctx.bal[c.id]);
  const owed = {}; for (const c of items) if (isDebt(c)) owed[c.id] = Math.max(0, cents(ctx.owed && ctx.owed[c.id] != null ? ctx.owed[c.id] : c.debt.bal));
  const finish = {}, reached = c => isDebt(c) ? owed[c.id] <= 0 : tgtOf(c) > 0 && bal[c.id] >= cents(tgtOf(c));
  for (const c of items) finish[c.id] = reached(c) ? ctx.curKey : null;
  const start = { bal: Object.fromEntries(Object.entries(bal).map(([k, v]) => [k, v / 100])), owed: Object.fromEntries(Object.entries(owed).map(([k, v]) => [k, v / 100])) };
  let carry = 0; const months = [];
  keys.forEach((k, idx) => {
    const now = idx === 0;
    const salExp = salaryAt(inc, k), salBase = now && ctx.payLogged ? r2(ctx.payAmt) : salExp, salIn = now && ctx.payLogged ? 0 : salExp;
    let pot = cents(salIn) + carry + (now ? cents(ctx.spendLeft) : 0);
    const take = w => { const y = Math.max(0, Math.min(Math.round(w), pot)); pot -= y; return y; };
    const M = { key: k, now, inc: { sal: salBase, ext: 0, extFull: 0 }, billsDue: 0, bills: 0, save: 0, saveTo: {}, goals: {}, short: {}, extra: {}, spend: 0, low: false, debt: {}, bal: {}, saved: 0, owed: 0, net: 0 };
    // 1. bills, then debt minimums
    const b = bills[k] || { spend: 0, cats: {} }, minWant = {}, oweNow = {};
    for (const c of items) if (isDebt(c) && owed[c.id] > 0) {
      const r = (+c.debt.apr || 0) / 1200, owe = now ? owed[c.id] : cents(r2(owed[c.id] / 100 * (1 + r)));
      oweNow[c.id] = owe;
      let w = Math.min(cents(c.debt.min), Math.max(0, owe - (now ? bal[c.id] : 0)));
      if (now) w = Math.max(0, w - put(c.id));
      minWant[c.id] = w;
    }
    const billWant = cents(b.spend), billGot = take(billWant), minGot = {};
    for (const id in minWant) minGot[id] = take(minWant[id]);
    const dueC = billWant + sum(Object.values(minWant)), gotC = billGot + sum(Object.values(minGot));
    M.billsDue = dueC / 100; M.bills = gotC / 100; if (gotC < dueC) M.short._bills = (dueC - gotC) / 100;
    // 2. savings %
    const saveWant = Math.max(0, cents(salBase * pct / 100) - (now ? sum(Object.keys(split).map(put)) : 0)), saveGot = take(saveWant);
    M.save = saveGot / 100; const saveTo = splitCents(saveGot, split); for (const id in saveTo) M.saveTo[id] = saveTo[id] / 100;
    if (saveGot < saveWant) M.short._save = (saveWant - saveGot) / 100;
    // 3. goals and plans, by priority
    const goalC = {}, needLeft = {};
    for (const c of items) {
      let want = cents(phaseAmt(phasesOf(c), k));
      if (isDebt(c)) {
        if (!(owed[c.id] > 0)) continue;
        if (now) want = Math.max(0, want - Math.max(0, put(c.id) - cents(c.debt.min)));
        const left = Math.max(0, oweNow[c.id] - (minGot[c.id] || 0) - (now ? bal[c.id] : 0)); want = Math.min(want, left);
        const got = take(want); goalC[c.id] = got; needLeft[c.id] = left - got; if (got < want) M.short[c.id] = (want - got) / 100;
        continue;
      }
      if (now) want = Math.max(0, want - put(c.id));
      const tg = tgtOf(c), left = tg > 0 ? Math.max(0, cents(tg) - bal[c.id]) : Infinity;
      want = Math.min(want, left);
      const got = take(want); goalC[c.id] = got; needLeft[c.id] = left - got; if (got < want) M.short[c.id] = (want - got) / 100;
    }
    // extras (only in the "with extras" scenario): a % to goals, the rest to spending or savings
    const extraC = {}; let extraSpend = 0, extraSave = 0;
    const fillPriority = amt => { for (const c of items) { if (amt <= 0) break; if (!(c.goal || isDebt(c)) || !(needLeft[c.id] > 0) || needLeft[c.id] === Infinity) continue; const y = Math.min(amt, needLeft[c.id]); needLeft[c.id] -= y; extraC[c.id] = (extraC[c.id] || 0) + y; amt -= y; } return amt; };
    for (const x of extrasIn(inc, k)) {
      M.inc.extFull = r2(M.inc.extFull + +x.amt);
      if (!extrasOn) continue;
      const a = cents(countedOf(x)); if (!a) continue;
      M.inc.ext = r2(M.inc.ext + a / 100);
      const al = x.alloc || {}, gp = Math.max(0, Math.min(100, al.goalPct == null ? goalPctDefault : +al.goalPct));
      let g = Math.round(a * gp / 100); const rest = a - g;
      if (al.goals && typeof al.goals === 'object') {
        const shares = splitCents(g, al.goals);
        for (const [id, v] of Object.entries(shares)) { if (!(needLeft[id] > 0)) continue; const y = Math.min(v, needLeft[id]); needLeft[id] -= y; extraC[id] = (extraC[id] || 0) + y; g -= y; }
      }
      g = fillPriority(g); extraSave += g;
      if (al.rest === 'save') extraSave += rest; else extraSpend += rest;
    }
    for (const id in extraC) M.extra[id] = extraC[id] / 100;
    if (extraSpend) M.extra.spend = extraSpend / 100;
    if (extraSave) { M.extra.save = extraSave / 100; const es = splitCents(extraSave, split); for (const id in es) bal[id] = (bal[id] || 0) + es[id]; }
    for (const id in goalC) if (goalC[id]) M.goals[id] = goalC[id] / 100;
    M.spend = (pot + extraSpend) / 100; M.low = M.spend < floor - 0.004;
    // roll the balances forward
    for (const id in saveTo) bal[id] = (bal[id] || 0) + saveTo[id];
    for (const [id, v] of Object.entries(b.cats)) bal[id] = (bal[id] || 0) - cents(v);
    for (const c of items) {
      if (isDebt(c)) {
        if (!(owed[c.id] > 0)) { M.debt[c.id] = { owed: 0, paid: 0, int: 0 }; continue; }
        const before = owed[c.id], owe = oweNow[c.id], pay = Math.min(owe, (now ? bal[c.id] : 0) + (minGot[c.id] || 0) + (goalC[c.id] || 0) + (extraC[c.id] || 0));
        if (now) bal[c.id] = 0;
        owed[c.id] = owe - pay; M.debt[c.id] = { owed: owed[c.id] / 100, paid: pay / 100, int: (owe - before) / 100 };
      } else bal[c.id] = (bal[c.id] || 0) + (goalC[c.id] || 0) + (extraC[c.id] || 0);
      if (!finish[c.id] && reached(c)) finish[c.id] = k;
    }
    const shortBills = Math.max(0, dueC - gotC);
    if (carryMode) carry = -shortBills; else { carry = 0; if (shortBills) bal.other = (bal.other || 0) - shortBills; }
    for (const id in bal) M.bal[id] = bal[id] / 100;
    M.saved = sum(Object.values(bal)) / 100; M.owed = sum(Object.values(owed)) / 100; M.net = r2(M.saved - M.owed);
    months.push(M);
  });
  return { keys, months, finish, start };
}
const forecastBoth = ctx => ({ salary: forecast({ ...ctx, scenario: 'salary' }), extras: forecast({ ...ctx, scenario: 'extras' }) });
const monthOf = (run, k) => run.months.find(m => m.key === k) || null;

/* ---------- planning a goal ---------- */
/* By date: share what's needed across the months, in proportion to the spending money each month has above your
   floor (cap), rounded to tidy steps. Months with a raise get more. Returns phases, and the shortfall if it can't fit. */
function suggestPhases(need, keys, cap) {
  need = r2(need);
  if (!(need > 0.004) || !keys.length) return { phases: [], ok: true, shortfall: 0 };
  const capC = keys.map(k => Math.max(0, cents(cap[k] || 0))), C = sum(capC), needC = cents(need), stepC = cents(stepFor(need / keys.length));
  if (C < needC) {
    const amt = capC.map(c => Math.floor(c / 500) * 500);
    return { phases: groupPhases(keys, amt.map(a => a / 100)), ok: false, shortfall: r2((needC - sum(amt)) / 100) };
  }
  const amt = capC.map(c => Math.min(Math.floor(c / stepC) * stepC, Math.round(needC * c / C / stepC) * stepC));
  let total = sum(amt), guard = 0;
  while (total < needC && guard++ < 5000) {
    // add a step to the latest run of equal months that all have room, so the phases stay tidy
    let done = false;
    for (let e = keys.length - 1; e >= 0 && !done;) {
      let s = e; while (s > 0 && amt[s - 1] === amt[e]) s--;
      let room = true; for (let i = s; i <= e; i++) if (capC[i] - amt[i] < stepC) room = false;
      if (room) { for (let i = s; i <= e; i++) amt[i] += stepC; total += stepC * (e - s + 1); done = true; }
      e = s - 1;
    }
    if (!done) { // no run has room: put the rest in single months, latest first, then the last month
      for (let i = keys.length - 1; i >= 0 && total < needC; i--) { const y = Math.min(capC[i] - amt[i], needC - total); if (y > 0) { amt[i] += y; total += y; } }
      if (total < needC) { amt[keys.length - 1] += needC - total; total = needC; }
    }
  }
  return { phases: groupPhases(keys, amt.map(a => a / 100)), ok: true, shortfall: 0 };
}
/* spending money above your floor each month, with this goal's own plan taken out (salary only) */
function capacity(ctx, id, keys) {
  const run = forecast({ ...ctx, scenario: 'salary', months: keys.length, phases: { ...(ctx.phases || {}), [id]: [] } }), floor = +ctx.st.spendFloor || 0, cap = {};
  for (const m of run.months) cap[m.key] = r2(m.spend - floor);
  return cap;
}
const goalOf = (st, id) => (st.saveCats || []).find(c => c.id === id);
/* plan by date: suggested phases from now to the goal's date */
function planByDate(ctx, id, dateKey) {
  const g = goalOf(ctx.st, id), keys = keyList(ctx.curKey, Math.max(1, keyDiff(ctx.curKey, dateKey) + 1)), cap = capacity(ctx, id, keys);
  if (isDebt(g)) { // level extra payment on top of the minimum, found by stepping up until it's paid off in time
    const owe = r2((ctx.owed && ctx.owed[id] != null) ? ctx.owed[id] : g.debt.bal), months = keys.length, r = (+g.debt.apr || 0) / 1200;
    const pmt = r > 0 ? owe * r / (1 - Math.pow(1 + r, -months)) : owe / months, step = stepFor(Math.max(1, pmt - (+g.debt.min || 0)));
    let x = Math.max(0, ceilTo(pmt - (+g.debt.min || 0), step)), guard = 0;
    const fin = x2 => forecast({ ...ctx, scenario: 'salary', months: months + 1, phases: { ...(ctx.phases || {}), [id]: x2 > 0 ? [{ from: keys[0], to: dateKey, amt: x2 }] : [] } }).finish[id];
    while (guard++ < 400) { const f = fin(x); if (f && f <= dateKey) break; x += step; }
    const over = keys.filter(k => x > cap[k] + 0.004);
    return { phases: x > 0 ? [{ from: keys[0], to: dateKey, amt: x }] : [], ok: !over.length, shortfall: 0, tight: over };
  }
  const need = r2(((ctx.target && ctx.target[id] != null) ? +ctx.target[id] : +g.target || 0) - ((+(ctx.bal && ctx.bal[id]) || 0) - (+(ctx.put && ctx.put[id]) || 0)));
  const res = suggestPhases(need, keys, cap);
  return { ...res, tight: keys.filter(k => phaseAmt(res.phases, k) > (cap[k] || 0) + 0.004) };
}
/* plan by amount: S$amt a month from now on; when it's reached (null = more than 20 years, or never for a debt) */
function solveFinish(ctx, id, phases) {
  const run = forecast({ ...ctx, scenario: 'salary', months: 240, phases: { ...(ctx.phases || {}), [id]: phases } });
  return run.finish[id] || null;
}
/* on track / ahead / behind, from the salary-only forecast */
function goalStatus(c, run, ctx) {
  const ms = msOf(ctx.st), fin = run.finish[c.id] || null, tgt = ctx.target && ctx.target[c.id] != null ? +ctx.target[c.id] : +c.target || 0;
  const startBal = run.start.bal[c.id] || 0, startOwed = run.start.owed[c.id];
  if (isDebt(c) ? startOwed != null && startOwed <= 0.004 : tgt > 0 && startBal >= tgt - 0.004) return { s: 'done', fin: ctx.curKey, short: 0 };
  if (!isDebt(c) && !(tgt > 0)) return { s: 'notarget', fin: null, short: 0 };
  const dateKey = isDay(c.date) ? keyOfDate(c.date, ms) : null;
  if (!dateKey) return { s: fin ? 'ontrack' : 'noplan', fin, short: 0 };
  if (dateKey < ctx.curKey) { const short = isDebt(c) ? r2(startOwed) : r2(tgt - startBal); return { s: 'behind', late: true, fin, short, dateKey }; }
  if (!fin || fin > dateKey) {
    const at = monthOf(run, dateKey) || run.months[run.months.length - 1];
    const short = isDebt(c) ? r2((at.debt[c.id] || {}).owed || 0) : r2(Math.max(0, tgt - (at.bal[c.id] || 0)));
    if (short <= Math.max(1, 0.005 * (isDebt(c) ? +c.debt.orig || +c.debt.bal || 0 : tgt))) return { s: 'ontrack', fin, short: 0, dateKey };
    return { s: 'behind', fin, short, dateKey };
  }
  return { s: keyDiff(fin, dateKey) >= 1 ? 'ahead' : 'ontrack', fin, short: 0, dateKey };
}
/* the two ways to catch up when a goal is behind */
function behindOptions(c, ctx, status) {
  if (!status || status.s !== 'behind') return null;
  const ms = msOf(ctx.st), dateKey = status.late ? ctx.curKey : status.dateKey, phases = c.phases || [];
  const left = Math.max(1, keyDiff(ctx.curKey, dateKey) + 1), keys = keyList(ctx.curKey, left), step = stepFor(status.short / left);
  const withX = x => { const amts = expandPhases(phases, keys).map(a => a + x); const pre = phases.filter(p => p.to && p.to < ctx.curKey), post = phases.filter(p => !p.to || p.to > dateKey).map(p => ({ ...p, from: !p.from || p.from <= dateKey ? keyAdd(dateKey, 1) : p.from })); return [...pre, ...groupPhases(keys, amts), ...post]; };
  let x = ceilTo(status.short / left, step), guard = 0;
  while (guard++ < 300) { const f = solveFinish(ctx, c.id, withX(x)); if (f && f <= dateKey) break; x += step; }
  const cap = capacity(ctx, c.id, keys), base = expandPhases(phases, keys);
  const catchUp = { add: x, phases: withX(x), fits: keys.every((k, i) => base[i] + x <= cap[k] + 0.004) };
  // move the date: keep paying the last amount until it's done
  const last = [...phases].sort((a, b) => (a.from || '') < (b.from || '') ? -1 : 1).pop();
  let move = null;
  if (last && +last.amt > 0) {
    const ext = phases.map(p => p === last ? { ...p, to: null } : p), fin = solveFinish(ctx, c.id, ext);
    if (fin) { const base0 = isDay(c.date) ? c.date : periodOfKey(dateKey, ms).end; move = { fin, date: addMonths(base0, keyDiff(dateKey, fin)), phases: ext }; }
  }
  return { catchUp, move, short: status.short, months: left };
}

/* ---------- debts ---------- */
/* paying B at apr% with S$pay a month: how many months and how much interest */
function simDebt(B, apr, pay) {
  const r = (+apr || 0) / 1200; let b = r2(B), I = 0, n = 0, last = 0;
  if (!(b > 0.004)) return { months: 0, interest: 0, last: 0 };
  if (!(pay > r2(b * r) + 0.004)) return { never: true, months: Infinity, interest: Infinity };
  while (b > 0.004 && n < 1200) { const i = r2(b * r); I = r2(I + i); b = r2(b + i); last = Math.min(b, pay); b = r2(b - last); n++; }
  return { months: n, interest: I, last: r2(last) };
}
/* what's owed now: the balance you entered, plus a month's interest at the start of each later month, less payments */
function debtOwed(debt, pays, curKey, ms) {
  if (!debt) return 0;
  const r = (+debt.apr || 0) / 1200, asOf = isDay(debt.asOf) ? debt.asOf : null, k0 = asOf ? keyOfDate(asOf, ms) : curKey, byKey = {};
  for (const p of pays || []) if (!asOf || p.d > asOf) { const k = keyOfDate(p.d, ms); byKey[k] = (byKey[k] || 0) + +p.amt; }
  let k = k0, b = r2((+debt.bal || 0) - (byKey[k] || 0)), guard = 0;
  while (k < curKey && guard++ < 1200) { k = keyAdd(k, 1); b = r2(b + Math.max(0, b) * r); b = r2(b - (byKey[k] || 0)); }
  return r2(Math.max(0, b));
}

/* ---------- emergency fund ---------- */
/* months × a typical month's spending: the average of up to the last 6 complete months; with less than 3 months of
   history, your plan (budget or planned spending, plus bills) fills in the missing months. Rounded up to S$100. */
function emergencyTarget(months, hist, planBase) {
  const h = (hist || []).filter(v => isFinite(v)).slice(-6), n = h.length, avg = n ? sum(h) / n : 0;
  const base = n >= 3 ? avg : (n * avg + (3 - n) * (+planBase || 0)) / 3;
  return Math.max(0, Math.ceil((+months || 0) * base / 100 - 1e-9) * 100);
}

/* ---------- spending ---------- */
/* take amounts in order from a total, in cents: what each gets and what's left */
function waterfall(total, wants) { let pot = cents(total); const got = wants.map(w => { const y = Math.max(0, Math.min(cents(w), pot)); pot -= y; return y / 100; }); return { got, left: pot / 100 }; }
/* an allowance for part of the month: what's free to spend now plus what's already been spent in the range, shared
   over the days from the range's start to the month's end. Month = everything. */
function allowance(canSpend, spentInRange, rangeDays, daysToEnd) {
  const base = (+canSpend || 0) + (+spentInRange || 0), allow = daysToEnd > 0 ? base * Math.min(rangeDays, daysToEnd) / daysToEnd : base;
  return { allow: r2(allow), left: r2(allow - (+spentInRange || 0)) };
}

/* ---------- settings v4 → v5 ---------- */
function guessKind(c) {
  const t = `${c.id} ${c.name}`.toLowerCase();
  if (c.id === 'emergency' || /emergenc|rainy/.test(t)) return 'emergency';
  if (/debt|loan|credit|card|owe|bnpl|atome|paylater/.test(t)) return 'debt';
  if (/trip|travel|holiday|flight|vacation|japan|tokyo|korea|seoul|taiwan|bangkok|bali|shanghai|europe/.test(t)) return 'travel';
  return 'big';
}
const asideMonthly = a => { const v = +a.amt || 0; return r2(a.per === 'day' ? v * 365 / 12 : a.per === 'week' ? v * 52 / 12 : a.per === 'year' ? v / 12 : v); };
/* Overwrites rather than fills in: stored settings are laid over the defaults, which already carry v5 placeholders.
   Deterministic (no clock, no random ids), so two devices migrating the same data write the same thing. */
function migrateV5(s) {
  if ((s.v || 1) >= 5) return false;
  const ids = new Set((s.saveCats || []).map(c => c.id)), budMonth = (() => { const b = s.budget || {}; const a = +b.amt || 0; return r2(b.per === 'week' ? a * 52 / 12 : b.per === 'year' ? a / 12 : a); })();
  s.income = { salary: [{ from: null, amt: r2(+s.pay || 0) }], payDay: null, extras: [], over: {} };
  s.savePct = 30; s.saveSplit = { [ids.has('general') ? 'general' : 'other']: 100 };
  s.extraGoalPct = 50; s.spendFloor = budMonth; s.horizon = 6;
  for (const c of s.saveCats || []) {
    if (c.goal) {
      c.kind = guessKind(c);
      if (c.aside && +c.aside.amt > 0) { const m = asideMonthly(c.aside); Object.assign(c, { planBy: 'amount', monthly: m, phases: [{ from: null, to: null, amt: m }] }); }
      else if (isDay(c.date)) Object.assign(c, { planBy: 'date', phases: null });
      else Object.assign(c, { planBy: 'amount', monthly: 0, phases: [] });
      if (c.kind === 'emergency') { c.months = 3; c.autoTarget = !(+c.target > 0); }
    } else if (c.aside && +c.aside.amt > 0) { const m = asideMonthly(c.aside); Object.assign(c, { planBy: 'amount', monthly: m, phases: [{ from: null, to: null, amt: m }] }); }
  }
  const goals = (s.saveCats || []).map((c, i) => ({ c, i })).filter(x => x.c.goal && !x.c.done).sort((a, b) => (KIND_ORDER[a.c.kind] ?? 4) - (KIND_ORDER[b.c.kind] ?? 4) || a.i - b.i).map(x => x.c.id);
  const plans = (s.saveCats || []).filter(c => !c.goal && c.phases && c.phases.length).map(c => c.id);
  s.priority = [...goals, ...plans];
  s.review = true; s.v = 5;
  return true;
}

return {
  r2, cents, sum, addMonths, addDays, isDay, isKey,
  keyAdd, keyDiff, keyList, msOf, periodOfDate, planKey, keyOfDate, periodOfKey,
  sortSalary, salaryAt, extrasIn, countedOf, stepDate, billsByKey, monthlyEq,
  KIND_ORDER, isDebt, planItems, phaseAmt, groupPhases, expandPhases, checkPhases, stepFor, ceilTo, saveSplitOf, splitCents,
  forecast, forecastBoth, monthOf, suggestPhases, capacity, planByDate, solveFinish, goalStatus, behindOptions,
  simDebt, debtOwed, emergencyTarget, waterfall, allowance, guessKind, asideMonthly, migrateV5,
};
})();

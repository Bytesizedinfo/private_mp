/* ---------- the plan (v5) ----------
   Everything forward-looking comes from Money (src/money.js). This part gathers what your entries say today,
   runs one forecast per change (cached on S.rev), and works out this month's set-asides, safe to spend and the
   payday split. Money order: bills → savings % → goals by priority → spending money. */
const ROLE = { bills: 'var(--r-bills)', save: 'var(--r-save)', goal: 'var(--r-goal)', spend: 'var(--r-spend)', extra: 'var(--r-extra)', income: 'var(--r-income)' };
const msNow = () => Money.msOf(S.settings);
const curKey = () => Money.planKey(periodAt(0), msNow());
const keyOfDay = d => Money.keyOfDate(d, msNow());
const keyPeriod = k => mkPeriod(Money.periodOfKey(k, msNow()).start);
const keyShort = (k, withYear) => { const [y, m] = k.split('-').map(Number); return withYear ? `${MON[m - 1]} ’${String(y).slice(2)}` : MON[m - 1]; };
const keyName = k => { const [y, m] = k.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const keyMonth = k => MONTHS[+k.slice(5, 7) - 1];
const goalColor = c => `var(--p${c.color ?? 6})`;
const planDay = t => t.t === 'in' && t.for ? inSpendDay(t) : t.d;
/* money put into a savings category or goal during a plan month (pay meant for next month counts there) */
function putPlan(id, P) { let x = 0; for (const t of S.tx) { const d = planDay(t); if (d < P.start || d > P.end) continue; const e = saveEffect(t, id); if (e > 0) x += e; } return r2(x); }
const loggedPay = P => r2(sum(S.tx.filter(t => t.t === 'in' && t.src === 'pay' && inSpendDay(t) >= P.start && inSpendDay(t) <= P.end).map(t => t.amt)));
const debtPays = id => S.tx.filter(t => t.t === 'out' && t.debt === id).map(t => ({ d: t.d, amt: t.amt, direct: t.from === 'spend' }));
const owedNow = c => Money.debtOwed(c.debt, debtPays(c.id), curKey(), msNow());
/* spending (not bills, not debt payments) from Spending in a date range */
function spentPlain(r) { let x = 0; for (const t of S.tx) if (t.t === 'out' && t.from === 'spend' && !t.bill && !t.debt && t.d >= r.start && t.d <= r.end) x += t.amt; return r2(x); }

/* emergency fund: months × a typical month (last ≤6 complete months of spending + bills; plan fills gaps) */
function expenseHistory() {
  const first = S.tx.length ? S.tx[S.tx.length - 1].d : null, out = []; if (!first) return out;
  for (let i = 6; i >= 1; i--) {
    const P = periodAt(-i); if (P.end < first) continue;
    let e = 0; for (const t of S.tx) if (t.t === 'out' && t.d >= P.start && t.d <= P.end && !t.debt && (t.from === 'spend' || t.bill)) e += t.amt;
    out.push(r2(e));
  }
  return out;
}
const planBase = () => r2(Math.max(budgetNow().month, sum(S.settings.labels.map(l => +l.plan || 0))) + sum(activeBills().map(monthlyEq)));
const emergencyTargetOf = c => Money.emergencyTarget(+c.months || 3, expenseHistory(), planBase());

/* goals in priority order (fixes up the stored order: removed ids out, new goals in by kind) */
function priorityIds() {
  const st = S.settings, open = st.saveCats.filter(c => (c.goal && !c.done) || (!c.goal && c.phases && c.phases.length)), ids = new Set(open.map(c => c.id));
  const kept = (st.priority || []).filter(id => ids.has(id)), rest = open.filter(c => !kept.includes(c.id)).sort((a, b) => (Money.KIND_ORDER[a.kind] ?? 4) - (Money.KIND_ORDER[b.kind] ?? 4)).map(c => c.id);
  return [...kept, ...rest];
}
function movePriority(id, dir) { const ids = priorityIds(), i = ids.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; S.settings.priority = ids; saveSettings(); }

function planCtx() {
  const st = S.settings, P = periodAt(0), t = today(), bal = {}, put = {}, owed = {}, target = {};
  for (const c of st.saveCats) { bal[c.id] = saveBal(c.id, t); put[c.id] = putPlan(c.id, P); }
  for (const c of st.saveCats) {
    if (Money.isDebt(c)) { owed[c.id] = owedNow(c); put[c.id] = r2(put[c.id] + sum(debtPays(c.id).filter(p => p.direct && p.d >= P.start && p.d <= P.end).map(p => p.amt))); }
    if (c.kind === 'emergency' && c.autoTarget) target[c.id] = emergencyTargetOf(c);
  }
  return { st: { ...st, priority: priorityIds() }, curKey: curKey(), months: 120, bal, put, owed, target, spendLeft: spendMonth(P).left, payLogged: payFor(P), payAmt: loggedPay(P) };
}
/* the forecast for both scenarios, plus each goal's status. Recomputed only when something changed. */
function plan() {
  if (S.plan && S.plan.rev === S.rev) return S.plan;
  const ctx = planCtx(), both = Money.forecastBoth(ctx), items = Money.planItems(ctx.st), status = {};
  for (const c of items) if (c.goal) status[c.id] = Money.goalStatus(c, both.salary, ctx);
  S.plan = { rev: S.rev, ctx, run: both.salary, runX: both.extras, items, status, now: both.salary.months[0] };
  return S.plan;
}
const tgtOf = c => { const p = plan(); return p.ctx.target[c.id] != null ? p.ctx.target[c.id] : +c.target || 0; };
/* progress: saved of target, or for a debt, paid off of what was owed */
function progressOf(c) {
  if (Money.isDebt(c)) { const owe = plan().ctx.owed[c.id] ?? owedNow(c), orig = Math.max(+c.debt.orig || 0, +c.debt.bal || 0, owe); return { have: r2(orig - owe), need: orig, pct: orig > 0 ? (orig - owe) / orig : 1, owe, left: owe }; }
  const t = tgtOf(c), b = saveBal(c.id); return { have: b, need: t, pct: t > 0 ? b / t : 0, left: r2(Math.max(0, t - b)) };
}
const STATUS = {
  ontrack: { t: 'On track', cls: 'ok', ico: 'check' }, ahead: { t: 'Ahead', cls: 'ok', ico: 'up' }, behind: { t: 'Behind', cls: 'warn', ico: 'warn' },
  done: { t: 'Reached', cls: 'ok', ico: 'check' }, noplan: { t: 'No plan yet', cls: '', ico: 'dot' }, notarget: { t: 'No target', cls: '', ico: 'dot' },
};
function statusChip(c) {
  const s = plan().status[c.id] || { s: 'noplan' }, d = STATUS[s.s] || STATUS.noplan;
  const txt = s.s === 'behind' ? (s.late ? `Past its date · ${money(s.short, { dp: 0 })} to go` : `Behind by ${money(s.short, { dp: 0 })}`) : d.t;
  return `<span class="chip-s ${d.cls}">${d.ico === 'warn' ? I.warn : d.ico === 'check' ? I.check : d.ico === 'up' ? I.up : ''}${esc(txt)}</span>`;
}
/* "S$150/mo until Jan, then S$580/mo" */
function phaseText(c, short) {
  const k = curKey(), ph = (c.phases || []).filter(p => !p.to || p.to >= k).sort((a, b) => (a.from || '') < (b.from || '') ? -1 : 1);
  if (!ph.length) return Money.isDebt(c) ? `Minimum ${money(+c.debt.min, { dp: 0 })}/mo` : 'Nothing planned yet';
  const one = p => `${mw(p.amt)}/mo${p.to ? ` ${p.from && p.from > k ? `${keyShort(p.from)}–${keyShort(p.to)}` : `until ${keyShort(p.to, p.to.slice(0, 4) !== k.slice(0, 4))}`}` : p.from && p.from > k ? ` from ${keyShort(p.from)}` : ''}`;
  const txt = (short ? ph.slice(0, 2) : ph).map(one).join(', then ') + (short && ph.length > 2 ? '…' : '');
  return Money.isDebt(c) ? `Minimum ${money(+c.debt.min, { dp: 0 })} + ${txt}` : txt;
}

/* this month's set-asides: savings % then each goal, what the plan asks, what's in, what's still due */
function monthItems() {
  const st = S.settings, p = plan(), ctx = p.ctx, out = [];
  const base = ctx.payLogged ? ctx.payAmt : Money.salaryAt(st.income, ctx.curKey), split = Money.saveSplitOf(st);
  const shares = Money.splitCents(Money.cents(base * (+st.savePct || 0) / 100), split);
  for (const id in shares) { const want = shares[id] / 100; if (!(want > 0.004)) continue; const got = ctx.put[id] || 0; out.push({ kind: 'save', id, c: saveCat(id), want, put: r2(Math.min(got, want)), due: r2(Math.max(0, want - got)) }); }
  for (const c of p.items) {
    let want = Money.phaseAmt(c.phases, ctx.curKey);
    if (Money.isDebt(c)) { if (!(ctx.owed[c.id] > 0.004)) continue; want = r2(Math.min((+c.debt.min || 0) + want, ctx.owed[c.id])); }
    else { const tg = tgtOf(c); if (tg > 0) want = r2(Math.min(want, Math.max(0, tg - (ctx.bal[c.id] - (ctx.put[c.id] || 0))))); }
    if (!(want > 0.004)) continue;
    const got = ctx.put[c.id] || 0;
    out.push({ kind: Money.isDebt(c) ? 'debt' : c.goal ? 'goal' : 'plan', id: c.id, c, want, put: r2(Math.min(got, want)), due: r2(Math.max(0, want - got)) });
  }
  return out;
}
const asideLeft = () => plan().ctx.payLogged ? r2(sum(monthItems().map(x => x.due))) : 0;
/* set aside one item's due amount from Spending now */
function asideGo(el) {
  const it = monthItems().find(x => x.id === el.dataset.id); if (!it || !(it.due > 0.004)) return;
  const due = it.due, left = spendMonth(periodAt(0)).left, name = it.c.name;
  const go = () => { addTx([{ id: newId(), d: today(), t: 'move', amt: due, from: 'spend', to: it.id, note: 'Set aside' }]); toast(`Set aside ${money(due)} for ${name}`); };
  if (due > left + 0.004) armDanger(el, `Spending has ${money(Math.max(0, left))}. Tap again`, go); else go();
}

/* safe to spend: Spending left − bills still due − set-asides still due. It's about the money you have; a budget,
   if you set one, is shown beside it as a note rather than taken off. */
function safeNow() {
  const P = periodAt(0), m = spendMonth(P), unpaid = billsAhead(P).total, aside = asideLeft(), t = today();
  const safe = r2(m.left - unpaid - aside);
  const bud = budgetNow().month, budLeft = bud > 0.004 ? r2(bud - spentFromSpend(rangeFor('month'))) : null;
  const can = safe, capped = false;
  const clip = r => ({ start: r.start < P.start ? P.start : r.start, end: r.end > P.end ? P.end : r.end });
  const per = {};
  for (const k of ['day', 'week', 'month']) {
    const r = k === 'month' ? { start: P.start, end: P.end } : clip(rangeFor(k, t)), sR = spentPlain(r);
    per[k] = { ...Money.allowance(Math.max(0, can), sR, diffDays(r.start, r.end) + 1, diffDays(r.start, P.end) + 1), spent: sR, r };
  }
  const payPending = payFor(P) ? 0 : Money.salaryAt(S.settings.income, curKey());
  return { P, m, unpaid, aside, safe, can: r2(can), capped, budLeft, per, daysLeft: diffDays(t, P.end) + 1, payPending };
}

/* the money order applied to a pay as it comes in. Returns rows in order and the Spending part
   (bills still due stay in Spending). forNext: pay meant for next month. */
function paydayRows(amount, forNext) {
  const st = S.settings, p = plan(), ctx = p.ctx, k = forNext ? Money.keyAdd(ctx.curKey, 1) : ctx.curKey, cur = !forNext;
  const P = periodAt(0), unpaid = cur ? billsAhead(P).total : (Money.billsByKey(st, k, k)[k] || { spend: 0 }).spend;
  const reserve = r2(Math.max(0, unpaid - (cur ? Math.max(0, ctx.spendLeft) : 0)));
  const rows = [{ key: 'bills', name: 'Bills still due', want: reserve, stays: true }];
  const split = Money.saveSplitOf(st), shares = Money.splitCents(Money.cents(amount * (+st.savePct || 0) / 100), split);
  for (const id in shares) rows.push({ key: id, kind: 'save', name: saveCat(id).name, color: goalColor(saveCat(id)), want: r2(shares[id] / 100), sub: `${st.savePct}% savings` }); // the % comes off every pay
  const runM = Money.monthOf(p.run, k);
  for (const c of p.items) {
    let want = Money.phaseAmt(c.phases, k);
    if (Money.isDebt(c)) { const owe = runM && runM.debt[c.id] ? (cur ? ctx.owed[c.id] : runM.debt[c.id].owed + runM.debt[c.id].paid) : ctx.owed[c.id]; if (!(owe > 0.004)) continue; want = Math.min((+c.debt.min || 0) + want, owe) - (cur ? ctx.put[c.id] || 0 : 0) - (cur ? Math.max(0, ctx.bal[c.id]) : 0); }
    else { if (cur) want -= ctx.put[c.id] || 0; const tg = tgtOf(c); if (tg > 0) want = Math.min(want, tg - (ctx.bal[c.id] || 0)); }
    want = r2(Math.max(0, want)); if (!(want > 0.004)) continue;
    rows.push({ key: c.id, kind: Money.isDebt(c) ? 'debt' : 'goal', name: c.name, color: goalColor(c), want, sub: Money.isDebt(c) ? 'debt payment' : c.goal ? 'goal' : 'plan' });
  }
  const w = Money.waterfall(amount, rows.map(r => r.want));
  rows.forEach((r, i) => r.got = w.got[i]);
  return { rows, spend: r2(w.left + rows[0].got), left: w.left, short: rows.filter(r => r.got < r.want - 0.004) };
}
/* an extra as it arrives: a % to goals (by priority, or your own split), the rest to Spending or savings */
function extraParts(amount, alloc = {}) {
  const st = S.settings, p = plan(), ctx = p.ctx, gp = Math.max(0, Math.min(100, alloc.goalPct ?? st.extraGoalPct ?? 50));
  let g = Money.cents(amount * gp / 100); const rest = Money.cents(amount) - g, parts = {};
  const need = {}; for (const c of p.items) if (c.goal || Money.isDebt(c)) need[c.id] = Money.cents(Money.isDebt(c) ? Math.max(0, (ctx.owed[c.id] || 0) - Math.max(0, ctx.bal[c.id] || 0)) : Math.max(0, tgtOf(c) - (ctx.bal[c.id] || 0)));
  const give = (id, c) => { parts[id] = (parts[id] || 0) + c; };
  if (alloc.goals && typeof alloc.goals === 'object') { const sh = Money.splitCents(g, alloc.goals); for (const [id, v] of Object.entries(sh)) { const y = Math.min(v, need[id] ?? v); give(id, y); g -= y; if (need[id] != null) need[id] -= y; } }
  for (const c of p.items) { if (g <= 0) break; if (!(need[c.id] > 0)) continue; const y = Math.min(g, need[c.id]); give(c.id, y); need[c.id] -= y; g -= y; }
  const toSave = Money.splitCents(g + (alloc.rest === 'save' ? rest : 0), Money.saveSplitOf(st)); for (const [id, v] of Object.entries(toSave)) if (v) give(id, v);
  if (alloc.rest !== 'save' && rest) give('spend', rest);
  const out = {}; for (const [k, v] of Object.entries(parts)) if (v > 0) out[k] = v / 100; return out;
}

/* fill in phases for "by date" goals that don't have any yet (after migrating, or after a date change) */
function ensurePhases() {
  const st = S.settings; if (!st || (st.v || 0) < 5) return false; let changed = false;
  for (const c of st.saveCats) if (c.goal && !c.done && c.phases == null) {
    try { c.phases = c.planBy === 'date' && Money.isDay(c.date) ? Money.planByDate(planCtx(), c.id, keyOfDay(c.date)).phases : []; } catch (e) { c.phases = []; }
    changed = true;
  }
  return changed;
}
/* expected extras whose month is over and that never got logged: ask what happened */
const missedExtras = () => ((S.settings.income || {}).extras || []).filter(x => !x.got && !x.gone && x.month < curKey());

/* past months for the charts: money in, what went where, savings and net worth at each month end */
function pastMonths(n) {
  const out = [], t = today(), owedAt = (c, k) => Money.debtOwed(c.debt, debtPays(c.id), k, msNow());
  for (let i = n; i >= 1; i--) {
    const P = periodAt(-i), k = Money.planKey(P, msNow());
    let sal = 0, ext = 0, saveIn = 0, goalIn = 0, spendIn = 0;
    for (const x of S.tx) {
      if (x.t !== 'in' || inSpendDay(x) < P.start || inSpendDay(x) > P.end) continue;
      if (x.src === 'pay') sal += x.amt; else ext += x.amt;
      spendIn += +x.spend || 0;
      for (const [id, v] of Object.entries(x.save || {})) { const c = saveCat(id); if (c.goal || (c.phases && c.phases.length)) goalIn += +v; else saveIn += +v; }
    }
    const billsPaid = r2(sum(S.tx.filter(x => x.t === 'out' && x.bill && x.d >= P.start && x.d <= P.end).map(x => x.amt)));
    const at = P.end < t ? P.end : t, saved = totalSaved(at), owed = r2(sum(S.settings.saveCats.filter(Money.isDebt).map(c => owedAt(c, k))));
    out.push({ key: k, P, sal: r2(sal), ext: r2(ext), save: r2(saveIn), goals: r2(goalIn), spendIn: r2(spendIn), bills: billsPaid, saved, owed, net: r2(saved - owed) });
  }
  return out;
}

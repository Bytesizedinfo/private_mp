/* ---------- the four tabs (v5): Home · Goals · Forecast · More ---------- */
const SAFE_K = ['day', 'week', 'month', 'all'], SAFE_NAME = { day: 'Today', week: 'Week', month: 'Month', all: 'All' };
const safeK = () => SAFE_K.includes(S.safeK) ? S.safeK : 'month';

/* ===== Home: the essentials. All your money first, then your pay, what's safe to spend, goals, recent. ===== */
function viewHome(lead = '') {
  const st = S.settings, P = periodAt(0);
  let h = balanceCard() + lead;
  if (st.review) h += setupCard();
  h += payCard() + safeCard();
  const miss = missedExtras();
  if (miss.length) h += `<section class="card nudge"><div class="card-head"><h2>Did it arrive?</h2></div><p class="muted small">${miss.length === 1 ? `You expected ${esc(miss[0].name || 'an extra')} (${money(miss[0].amt)}) in ${esc(keyMonth(miss[0].month))}.` : `${miss.length} expected extras from past months haven’t been logged.`} Log it, move it to a later month, or drop it.</p><div><button class="btn ghost small" data-act="extra" data-id="${esc(miss[0].id)}">Sort it out</button></div></section>`;
  h += goalsSnapCard();
  if (homeOn('bills')) h += billsCard(P);
  if (homeOn('past')) h += pastCard();
  if (homeOn('savDetail')) h += savingsDetailCard(periodAt(homeOn('past') ? S.offset : 0));
  if (homeOn('cats')) h += catCard();
  const recent = [...S.tx, ...S.sweeps].sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0).slice(0, 5);
  h += `<section class="card"><div class="card-head"><h2>Recent</h2><button class="link" data-act="more-tab" data-tab="activity">See all</button></div>${recent.length ? `<div class="txs">${recent.map(txRow).join('')}</div>` : `<div class="empty">Nothing logged yet. Tap + to add spending or money in.</div>`}</section>`;
  return h;
}
function setupCard() {
  return `<section class="card setup"><div class="card-head"><h2>Set up your plan</h2><span class="muted small">2 minutes</span></div>
    <p class="small">New: tell the app your salary (and any changes coming), your savings %, and your goals. It then works out how much to put aside each month and how much you can spend.</p>
    <div class="btn-row"><button class="btn" data-act="setup">Set it up</button><button class="btn ghost" data-act="setup-later">Later</button></div></section>`;
}
function safeCard() {
  const s = safeNow(), k = safeK(), short = s.can < -0.004, big = Math.max(0, s.can), m = s.m;
  const legend = [{ name: 'Spent', color: 'var(--r-spent)' }, ...(m.out > 0.004 ? [{ name: 'Moved to savings', color: ROLE.save }] : []), { name: 'Bills due', color: ROLE.bills }, { name: 'Free to spend', color: ROLE.spend }];
  const monthBar = segBar([
    { name: 'Spent', v: m.spent, color: 'var(--r-spent)' }, { name: 'Moved to savings', v: m.out, color: ROLE.save },
    { name: 'Bills still due', v: s.unpaid, color: ROLE.bills }, { name: 'Free to spend', v: big, color: ROLE.spend },
  ], { big: true });
  const dueSoon = activeBills().filter(x => billFrom(x) === 'spend' && diffDays(today(), x.next) <= 3).sort(byNext);
  const perRow = (key, label) => { const x = s.per[key], over = x.left < -0.004, pct = x.allow > 0 ? Math.min(100, x.spent / x.allow * 100) : (x.spent > 0 ? 100 : 0);
    return `<div class="allow-row"><span class="nm">${label}</span><span class="val"><b class="num${over ? ' neg' : ''}">${money(Math.abs(x.left))}</b> ${over ? 'over' : 'left'} <span class="muted">of ${money(x.allow)}</span></span>
      <span class="bar${over ? ' over' : ''}" role="img" aria-label="${Math.round(pct)}% used" data-tip="${esc(`${label}: spent ${money(x.spent)} of ${money(x.allow)}`)}"><i style="width:${pct.toFixed(1)}%;background:${over ? 'var(--over)' : 'var(--r-spent)'}"></i></span></div>`; };
  let chart;
  if (k === 'month') chart = monthBar + legendHtml(legend);
  else if (k === 'all') chart = perRow('day', 'Today') + perRow('week', 'This week') + perRow('month', 'This month');
  else { const x = s.per[k], over = x.left < -0.004; chart = segBar([{ name: 'Spent', v: x.spent, color: over ? 'var(--over)' : 'var(--r-spent)' }, { name: 'Left', v: Math.max(0, x.left), color: ROLE.spend }], { big: true }) + `<p class="small"><b class="num">${money(Math.max(0, x.left))}</b> left ${k === 'day' ? 'today' : 'this week'} · ${money(x.spent)} spent of ${money(x.allow)}</p>`; }
  const daily = s.per.day.allow;
  return `<section class="card safe" aria-label="Safe to spend">
    <div class="card-head"><h2>Safe to spend</h2><button class="link" data-act="safe-how">How it’s worked out</button></div>
    <div class="avail-num"><b class="num${short ? ' neg' : ''}">${short ? '−' + money(-s.can) : money(big)}</b><span>${short ? 'short this month' : `left this month · ${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'} to go`}</span></div>
    ${short ? `<p class="status over">${I.over}Bills still due need ${money(-s.can)} more than your spending money. Log any money that came in, or move some from savings.</p>` : `<p class="muted small">About <b class="num" style="color:var(--ink)">${money(daily)}</b> a day${s.budLeft != null ? ` · ${s.budLeft >= 0 ? `${money(s.budLeft)} left in your ${mw(budgetNow().month)} budget` : `<span style="color:var(--warn);font-weight:650">${money(-s.budLeft)} over your ${mw(budgetNow().month)} budget</span>`}` : ''}</p>`}
    <div class="seg mini" role="group" aria-label="Show for">${SAFE_K.map(v => `<button data-act="safe-k" data-v="${v}" aria-pressed="${k === v}">${SAFE_NAME[v]}</button>`).join('')}</div>
    ${chart}
    ${dueSoon.map(x => `<div class="bill-line"><span>${I.warn}<b>${esc(x.name)}</b> ${money(x.amount)} · ${diffDays(today(), x.next) < 0 ? 'overdue' : diffDays(today(), x.next) === 0 ? 'due today' : `due ${esc(fmtD(x.next))}`}</span><button class="btn soft small" data-act="pay-bill" data-id="${esc(x.id)}">Paid</button></div>`).join('')}
  </section>`;
}
/* your pay: one tap when it lands (shared out automatically), then where it went */
function payCard() {
  const st = S.settings, sal = Money.salaryAt(st.income, curKey()), pm = payThisMonth();
  const partList = (spend, save) => [...Object.entries(save).filter(([, v]) => v > 0.004).map(([id, v]) => { const c = saveCat(id); return { name: c.name, v, color: c.goal || (c.phases || []).length ? goalColor(c) : ROLE.save }; }), { name: 'Spending money', v: spend, color: ROLE.spend }];
  const legend = list => `<div class="plan-legend">${list.filter(x => x.v > 0.004).map(x => `<span><i class="key" style="background:${x.color}"></i>${esc(x.name)} <b class="num">${mw(x.v)}</b></span>`).join('')}</div>`;
  if (!pm.list.length) {
    if (!(sal > 0)) return `<section class="card nudge"><div class="card-head"><h2>Your pay</h2></div><p class="muted small">Add your salary and the app shares out every pay for you: bills, savings, your goals, then spending money.</p><div><button class="btn soft small" data-act="income">Add my salary</button></div></section>`;
    const x = payParts(sal, false), list = partList(x.spend, x.save);
    return `<section class="card pay-card" aria-label="Got paid?"><div class="card-head"><h2>Got paid?</h2><span class="muted small">${esc(monthName(periodAt(0)))}</span></div>
      <div class="avail-num"><b class="num">${money(sal)}</b><span>your usual salary</span></div>
      <p class="small">Tap when it lands. It’s shared out for you, nothing else to do:</p>${segBar(list, { big: true })}${legend(list)}
      ${x.pr.short.length ? `<p class="status warn">${I.warn}Not enough for every goal this month. ${esc(x.pr.short.map(r => r.name).join(', '))} get${x.pr.short.length === 1 ? 's' : ''} less, so your spending money stays safe.</p>` : ''}
      <div class="btn-row"><button class="btn" data-act="pay-now">I got paid</button><button class="btn ghost" data-act="pay-other">Different amount</button></div></section>`;
  }
  const save = { ...pm.parts }; delete save.spend; const list = partList(pm.parts.spend, save), last = pm.list[pm.list.length - 1];
  return `<section class="card" aria-label="Your pay"><div class="card-head"><h2>Your ${money(pm.amt)} pay</h2><button class="link" data-act="edit-tx" data-id="${esc(pm.list[0].id)}">Edit</button></div>
    ${segBar(list, { big: true })}${legend(list)}
    <p class="muted small">Your goals got their share from this pay automatically${last ? ` on ${esc(fmtD(last.d))}` : ''}. Next month, tap “I got paid” when it lands.</p></section>`;
}
function safeHowSheet() {
  const s = safeNow(), m = s.m, items = monthItems(), ahead = billsAhead(s.P);
  openSheet('How safe to spend is worked out', `<div class="form">
    <div class="flow" style="border-top:0;padding-top:0">${Math.abs(m.carry) > 0.004 ? `<span>From earlier months</span><span>${m.carry > 0 ? '+' : '−'}${money(Math.abs(m.carry))}</span>` : ''}<span>Put into Spending this month</span><span>+${money(m.added)}</span><span>Spent</span><span>−${money(m.spent)}</span>${m.out ? `<span>Moved to savings</span><span>−${money(m.out)}</span>` : ''}<span class="tot">In Spending now</span><span class="tot">${money(m.left)}</span></div>
    <div class="flow"><span class="muted">Still to come this month</span><span></span>${ahead.list.map(o => `<span>${esc(o.x.name)} · ${o.d < today() ? 'overdue' : esc(fmtD(o.d))}</span><span>−${money(o.x.amount)}</span>`).join('') || '<span>No bills</span><span>—</span>'}
      <span class="tot">Safe to spend</span><span class="tot"${s.safe < 0 ? ' style="color:var(--over)"' : ''}>${money(s.safe)}</span></div>
    ${s.budLeft != null ? `<p class="small">Separately, your ${mw(budgetNow().month)} monthly budget has ${s.budLeft >= 0 ? `${money(s.budLeft)} left` : `gone ${money(-s.budLeft)} over`}. The budget is a target; safe to spend is the money you actually have.</p>` : ''}
    <p class="small">Savings and goal money aren’t in here: they’re taken from each pay the moment you log it, so what’s left is yours to spend.</p>
    <p class="muted small">Today’s and this week’s amounts share what’s safe over the days left in the month. Spending on one day leaves a little less for each of the others.</p>
    <div class="btn-row"><button class="btn ghost" data-act="more-tab" data-tab="activity">Spending activity</button><button class="btn ghost" data-act="more-tab" data-tab="plan">Budget &amp; plan</button></div></div>`);
}
function goalsSnapCard() {
  const p = plan(), goals = p.items.filter(c => c.goal).slice(0, 3);
  let h = `<section class="card" aria-label="Goals"><div class="card-head"><h2>Goals</h2><button class="link" data-act="go" data-view="goals">All goals</button></div>`;
  if (!goals.length) return h + `<p class="muted small">Saving for a trip, a laptop, an emergency fund, or paying off a card? Add a goal with a date. The app works out what to put in each month from your income.</p><div><button class="btn soft small" data-act="goal-edit">+ Add a goal</button></div></section>`;
  return h + `<div class="snap">${goals.map(c => { const pr = progressOf(c), each = perPay(c);
    return `<button class="snap-g" data-act="goal" data-id="${esc(c.id)}">${ring(pr.pct, goalColor(c), 54, `${Math.round(Math.min(1, pr.pct) * 100)}%`)}<span class="nm">${esc(c.name)}</span><span class="sub num">${Money.isDebt(c) ? `${money(pr.owe, { dp: 0 })} owed` : `${mw(pr.have)} of ${mw(pr.need)}`}</span><span class="sub per-pay">${each > 0.004 ? `${mw(each)} from each pay` : 'nothing from pay yet'}</span>${statusChip(c)}</button>`; }).join('')}</div>
    <p class="muted small">Goal money comes from your pay: each time you log pay, every goal gets its monthly amount, top goal first.</p></section>`;
}
/* what a goal gets from this month's pay (a debt: its minimum plus any extra) */
const perPay = c => r2(Money.phaseAmt(c.phases, curKey()) + (Money.isDebt(c) ? +c.debt.min || 0 : 0));

/* ===== Goals ===== */
function viewGoals() {
  const st = S.settings, p = plan(), ids = priorityIds(), all = ids.map(saveCat).filter(c => c !== NOCAT), goals = all.filter(c => c.goal), plans = all.filter(c => !c.goal), done = doneGoals();
  const withTarget = goals.filter(c => progressOf(c).need > 0), have = sum(withTarget.map(c => Math.max(0, Math.min(progressOf(c).have, progressOf(c).need)))), need = sum(withTarget.map(c => progressOf(c).need));
  const monthTotal = r2(sum(monthItems().filter(x => x.kind !== 'save').map(x => x.want))), behind = goals.filter(c => (p.status[c.id] || {}).s === 'behind');
  let h = `<section class="card goals-sum"><div class="gs-top">${ring(need ? have / need : 0, 'var(--accent)', 92, need ? `${Math.round(have / need * 100)}%` : '–', 9)}
    <div class="gs-txt"><span class="eyebrow">All goals</span><b class="num big2">${mw(have)}</b><span class="muted small">of ${mw(need)} · ${goals.length} goal${goals.length === 1 ? '' : 's'}</span>
    <span class="small">${monthTotal > 0 ? `<b class="num">${money(monthTotal)}</b> planned this month` : 'Nothing planned this month'}</span>
    ${behind.length ? `<span class="status warn">${I.warn}${behind.length} behind</span>` : goals.length ? `<span class="status ok">${I.check}All on track</span>` : ''}</div></div>
    <button class="btn block" data-act="goal-edit">+ New goal</button></section>`;
  h += goalMoneyCard(goals);
  if (goals.length) {
    const rows = goals.map(c => { const s = p.status[c.id] || {}, dk = Money.isDay(c.date) ? keyOfDay(c.date) : null; return { name: c.name, color: goalColor(c), fin: s.fin || null, date: dk, attrs: `data-act="goal" data-id="${esc(c.id)}" style="cursor:pointer"`, tip: `${c.name}\n${s.fin ? `Done around ${keyName(s.fin)}` : 'Not done within 20 years at this rate'}${dk ? `\nTarget ${fmtDY(c.date)}` : ''}` }; });
    h += `<section class="card"><div class="card-head"><h2>When each goal is done</h2></div>${ganttBars(curKey(), rows)}
      <p class="muted small">Bars run from now to when the forecast says each goal is done, on your salary alone. The black tick is the date you set.</p>
      ${tableHtml('Show as table', ['Goal', 'Done around', 'Target date'], goals.map(c => { const s = p.status[c.id] || {}; return [c.name, s.fin ? keyName(s.fin) : 'not in 20 years', c.date ? fmtDY(c.date) : '—']; }))}</section>`;
    h += `<div class="card-list">${goals.map((c, i) => goalCard(c, i, goals.length)).join('')}</div>`;
  }
  if (plans.length) h += `<section class="card"><div class="card-head"><h2>Other monthly set-asides</h2></div><p class="muted small" style="margin-top:-6px">Savings categories with an amount each month, after your goals.</p>
    <div>${plans.map(c => `<button class="cat-link" data-act="savecat" data-id="${esc(c.id)}"><span class="t"><b><i class="dot" style="background:${goalColor(c)}"></i>${esc(c.name)}</b><span>${phaseText(c, true)} · ${money(saveBal(c.id))} saved</span></span>${I.right}</button>`).join('')}</div></section>`;
  if (done.length) h += `<details class="more"><summary>Completed (${done.length})</summary><div class="more-in"><section class="card"><div>${done.map(g => `<button class="sv-row" data-act="goal" data-id="${esc(g.id)}"><i class="dot" style="background:${goalColor(g)}"></i><span class="nm">${esc(g.name)}</span><span class="val">${mw(saveBal(g.id))}</span><span class="sub">Done ${fmtDY(g.done)}</span></button>`).join('')}</div></section></div></details>`;
  if (!goals.length && !done.length) h += `<div class="empty"><b>No goals yet</b>Add an emergency fund, a trip, a big purchase or a debt to pay off. Set a date and the app plans the monthly amounts from your income.</div>`;
  return h;
}
/* where goal money comes from: your pay, shared out the moment you log it. Shows the last pay as a flow. */
function goalMoneyCard(goals) {
  const st = S.settings, last = S.tx.find(t => t.t === 'in' && t.src === 'pay'), sal = Money.salaryAt(st.income, curKey());
  let outs, title;
  if (last) { title = `Your last pay: ${money(last.amt)} on ${fmtD(last.d)}`; outs = [...Object.entries(last.save || {}).filter(([, v]) => +v > 0.004).map(([id, v]) => { const c = saveCat(id); return { name: c.name, v: +v, color: c.goal || (c.phases || []).length ? goalColor(c) : ROLE.save }; }), { name: 'Spending money', v: +last.spend || 0, color: ROLE.spend }]; }
  else if (sal > 0) { const x = payParts(sal, false); title = `Your next ${money(sal)} pay`; outs = [...Object.entries(x.save).map(([id, v]) => { const c = saveCat(id); return { name: c.name, v, color: c.goal || (c.phases || []).length ? goalColor(c) : ROLE.save }; }), { name: 'Spending money', v: x.spend, color: ROLE.spend }]; }
  return `<section class="card"><div class="card-head"><h2>Where goal money comes from</h2></div>
    <p class="small">From your pay. Each time you log pay, the app shares it out: bills stay in spending money, ${esc(st.savePct)}% goes to savings, your ${mw(+st.spendFloor || 0)} spending floor is kept safe, then every goal gets its monthly amount, top goal first. ${goals.length ? 'Use the arrows on each goal to change the order.' : ''}</p>
    ${outs ? `<span class="eyebrow">${esc(title)}</span>${flowChart('pay', outs)}` : `<div><button class="btn soft small" data-act="income">Add my salary</button></div>`}</section>`;
}
const KIND_NAME = { emergency: 'Emergency fund', debt: 'Debt', travel: 'Travel', big: 'Big purchase', other: 'Goal' };
function goalCard(c, i, n) {
  const p = plan(), pr = progressOf(c), s = p.status[c.id] || {}, thisMonth = (monthItems().find(x => x.id === c.id) || {});
  return `<section class="card goal-card">
    <div class="gc-top"><button class="gc-main" data-act="goal" data-id="${esc(c.id)}">${ring(pr.pct, goalColor(c), 60, `${Math.round(Math.min(1, pr.pct) * 100)}%`)}
      <span class="gc-txt"><span class="eyebrow">${i + 1}. ${esc(KIND_NAME[c.kind] || 'Goal')}</span><b>${esc(c.name)}</b>
      <span class="small num">${Money.isDebt(c) ? `${money(pr.owe)} owed · ${money(pr.have, { dp: 0 })} paid off` : `${money(pr.have)} of ${mw(pr.need)}${c.kind === 'emergency' && c.autoTarget ? ` <span class="muted">(${c.months || 3} months)</span>` : ''}`}</span></span></button>
      <div class="gc-ord"><button class="icon-btn sm" data-act="goal-up" data-id="${esc(c.id)}" aria-label="Move ${esc(c.name)} up" ${i === 0 ? 'disabled' : ''}>${I.chevUp}</button><button class="icon-btn sm" data-act="goal-down" data-id="${esc(c.id)}" aria-label="Move ${esc(c.name)} down" ${i === n - 1 ? 'disabled' : ''}>${I.chevDown}</button></div></div>
    <div class="gc-meta">${statusChip(c)}<span class="muted small">${c.date ? `by ${esc(fmtDY(c.date))}` : s.fin ? `done ~${esc(keyShort(s.fin, true))}` : ''}</span></div>
    <p class="small muted">${esc(phaseText(c, true))}${thisMonth.want ? ` · this month ${money(thisMonth.want)}${thisMonth.due > 0.004 ? '' : ' ✓'}` : ''}</p>
    ${s.s === 'behind' ? `<button class="linkbtn" data-act="goal" data-id="${esc(c.id)}">See how to catch up</button>` : ''}
  </section>`;
}

/* ===== Forecast ===== */
const HORIZONS = [3, 6, 12, 24];
function horizon() { const h = S.settings.horizon; if (h === 'goals') { const ends = plan().items.filter(c => c.goal).flatMap(c => [c.date ? keyOfDay(c.date) : null, (plan().status[c.id] || {}).fin]).filter(Boolean).sort(); return Math.max(3, Math.min(60, ends.length ? Money.keyDiff(curKey(), ends.pop()) + 1 : 12)); } return Math.max(1, Math.min(60, +h || 6)); }
function viewForecast() {
  const tab = S.fcTab === 'past' ? 'past' : 'ahead';
  let h = `<div class="seg" role="group" aria-label="Forecast or past"><button data-act="fc-tab" data-v="ahead" aria-pressed="${tab === 'ahead'}">Ahead</button><button data-act="fc-tab" data-v="past" aria-pressed="${tab === 'past'}">Past</button></div>`;
  if (tab === 'past') return h + viewInsights();
  const st = S.settings, p = plan(), H = horizon(), runS = p.run.months.slice(0, H), runX = p.runX.months.slice(0, H), hv = st.horizon;
  h += `<div class="seg mini range" role="group" aria-label="How far ahead">${HORIZONS.map(v => `<button data-act="fc-h" data-v="${v}" aria-pressed="${+hv === v}">${v}m</button>`).join('')}<button data-act="fc-h" data-v="goals" aria-pressed="${hv === 'goals'}">To goals</button><button data-act="fc-h" data-v="custom" aria-pressed="${!HORIZONS.includes(+hv) && hv !== 'goals'}">${!HORIZONS.includes(+hv) && hv !== 'goals' ? `${H}m` : 'Custom'}</button></div>`;
  const miss = missedExtras();
  if (miss.length) h += `<div class="banner"><b>${miss.length} expected extra${miss.length === 1 ? '' : 's'}</b> from past months ${miss.length === 1 ? 'hasn’t' : 'haven’t'} been logged. <button class="linkbtn" data-act="extra" data-id="${esc(miss[0].id)}">Sort it out</button></div>`;
  // 1. income ahead
  const past = pastMonths(3), sumSal = r2(sum(runS.map(m => m.inc.sal))), sumExt = r2(sum(runS.map(m => m.inc.extFull))), sumCnt = r2(sum(runX.map(m => m.inc.ext)));
  const incCols = [...past.map(m => ({ label: keyShort(m.key), vals: { sal: m.sal, ext: m.ext }, tip: `${keyName(m.key)} (logged)\nSalary ${money(m.sal)}\nOther money in ${money(m.ext)}` })),
    ...runS.map((m, i) => ({ label: keyShort(m.key, m.key.endsWith('-01')), cur: i === 0, future: i > 0, vals: { sal: m.inc.sal, ext: runX[i].inc.ext, unc: r2(m.inc.extFull - runX[i].inc.ext) }, tip: `${keyName(m.key)}\nSalary ${money(m.inc.sal)}${m.inc.extFull ? `\nExtras expected ${money(m.inc.extFull)} (${money(runX[i].inc.ext)} counted)` : ''}\nTap to change this month`, attrs: `data-act="fc-month" data-k="${m.key}" style="cursor:pointer"` }))];
  const incSeries = [{ key: 'sal', name: 'Salary', color: ROLE.income },{ key: 'ext', name: 'Extras (counted)', color: ROLE.extra }, { key: 'unc', name: 'Extras (not counted)', color: ROLE.extra, hatch: true }];
  h += `<section class="card"><div class="card-head"><h2>Income ahead</h2><button class="link" data-act="income">Edit</button></div>
    <div class="trio"><span><span>Salary, ${H} mo</span><b class="num">${mw(sumSal)}</b></span><span><span>Extras expected</span><b class="num">${mw(sumExt)}</b></span><span><span>Extras counted</span><b class="num">${mw(sumCnt)}</b></span></div>
    ${stackCols(incCols, incSeries, { todayAt: past.length, label: 'Income by month' })}${legendHtml(incSeries)}
    <p class="muted small">Goals are planned on salary alone. Extras only add to the “with extras” lines. Tap a month to change it or add an extra.</p>
    ${tableHtml('Show as table', ['Month', 'Salary', 'Extras', 'Counted'], runS.map((m, i) => [keyName(m.key), money(m.inc.sal), money(m.inc.extFull), money(runX[i].inc.ext)]))}</section>`;
  // 2. where each pay goes
  const sel = runS.find(m => m.key === S.fcMonth) || runS[0], ids = [...new Set(runS.flatMap(m => Object.keys(m.goals)))];
  const goalSum = m => r2(sum(Object.values(m.goals)));
  const payCols = runS.map((m, i) => ({ label: keyShort(m.key, m.key.endsWith('-01')), cur: m.key === sel.key, vals: { bills: m.bills, save: m.save, goals: goalSum(m), spend: Math.max(0, m.spend) }, tip: `${keyName(m.key)}\nBills ${money(m.bills)}\nSavings ${money(m.save)}\nGoals ${money(goalSum(m))}\nSpending money ${money(m.spend)}${m.low ? '\n⚠ below your spending floor' : ''}`, attrs: `data-act="fc-sel" data-k="${m.key}" style="cursor:pointer"` }));
  const paySeries = [{ key: 'bills', name: 'Bills', color: ROLE.bills }, { key: 'save', name: 'Savings %', color: ROLE.save }, { key: 'goals', name: 'Goals', color: ROLE.goal }, { key: 'spend', name: 'Spending', color: ROLE.spend }];
  const low = runS.filter(m => m.low), shortG = runS.filter(m => Object.keys(m.short).some(k => !k.startsWith('_')));
  const outs = [{ name: 'Bills', v: sel.bills, color: ROLE.bills }, ...Object.entries(sel.saveTo).map(([id, v]) => ({ name: `${saveCat(id).name} (${st.savePct}%)`, v, color: ROLE.save })), ...ids.filter(id => sel.goals[id]).map(id => ({ name: saveCat(id).name, v: sel.goals[id], color: goalColor(saveCat(id)) })), { name: 'Spending money', v: Math.max(0, sel.spend), color: ROLE.spend }];
  h += `<section class="card"><div class="card-head"><h2>Where each pay goes</h2><span class="muted small">salary only</span></div>
    ${stackCols(payCols, paySeries, { pct: true, label: 'Share of each month’s pay' })}${legendHtml(paySeries)}
    ${low.length ? `<p class="status warn">${I.warn}Spending money drops below your ${mw(st.spendFloor)} floor in ${esc(low.map(m => keyShort(m.key)).join(', '))}.</p>` : ''}
    ${shortG.length ? `<p class="status warn">${I.warn}Some goals get less than planned in ${esc(shortG.map(m => keyShort(m.key)).join(', '))}. Lower goals in your list are cut first.</p>` : ''}
    <div class="card-head" style="margin-top:4px"><h2 style="font-size:.92rem">${esc(keyName(sel.key))}: ${money(sel.inc.sal)}</h2><span class="muted small">tap a column</span></div>
    ${flowChart('salary', outs)}
    ${tableHtml('Show as table', ['Month', 'Bills', 'Savings', 'Goals', 'Spending'], runS.map(m => [keyName(m.key), money(m.bills), money(m.save), money(goalSum(m)), money(m.spend)]))}</section>`;
  // 3. savings & net worth
  const P6 = pastMonths(6), labels = [...P6.map(m => keyShort(m.key)), ...runS.map(m => keyShort(m.key, m.key.endsWith('-01')))], n6 = P6.length;
  const hasDebt = st.saveCats.some(c => Money.isDebt(c) && !c.done);
  const savedPast = [...P6.map(m => m.saved), ...runS.map((m, i) => i === 0 ? null : null)];
  const startSaved = r2(sum(Object.values(p.run.start.bal)));
  const proj = [...P6.map((m, i) => i === n6 - 1 ? m.saved : null), ...runS.map(m => m.saved)]; proj[n6 - 1] = n6 ? P6[n6 - 1].saved : null;
  const projX = [...P6.map(() => null), ...runX.map(m => m.saved)]; if (n6) projX[n6 - 1] = P6[n6 - 1].saved;
  const series = [{ name: 'Savings (so far)', color: ROLE.save, vals: savedPast, area: true }, { name: 'Savings ahead', color: ROLE.save, vals: proj, dash: '5 4' }];
  if (hasDebt) series.push({ name: 'Net worth', color: 'var(--ink-2)', vals: [...P6.map(m => m.net), ...runS.map(m => m.net)], width: 1.5 });
  const end = runS[runS.length - 1], endX = runX[runX.length - 1];
  h += `<section class="card"><div class="card-head"><h2>Savings growth</h2></div>
    <div class="trio"><span><span>Saved now</span><b class="num">${mw(startSaved)}</b></span><span><span>In ${H} months</span><b class="num">${mw(end.saved)}</b></span><span><span>With extras</span><b class="num">${mw(endX.saved)}</b></span></div>
    ${lineChart(labels, series, { band: { lo: [...P6.map(() => null), ...runS.map(m => m.saved)], hi: projX, color: ROLE.save }, todayAt: n6 ? n6 - 1 : null, tips: [...P6.map(m => `${keyName(m.key)}\nSaved ${money(m.saved)}${hasDebt ? `\nOwed ${money(m.owed)}` : ''}`), ...runS.map((m, i) => `${keyName(m.key)} (forecast)\nSaved ${money(m.saved)}\nWith extras ${money(runX[i].saved)}${hasDebt ? `\nOwed ${money(m.owed)}\nNet worth ${money(m.net)}` : ''}`)], label: 'Savings over time' })}
    ${legendHtml([{ name: 'Savings so far', color: ROLE.save }, { name: 'Savings ahead (salary only)', color: ROLE.save, dash: true }, { name: 'Range with extras', color: ROLE.save, hatch: true }, ...(hasDebt ? [{ name: 'Net worth (savings − debts)', color: 'var(--ink-2)' }] : [])])}
    ${tableHtml('Show as table', ['Month', 'Saved', 'With extras', ...(hasDebt ? ['Owed', 'Net worth'] : [])], [...P6.map(m => [keyName(m.key), money(m.saved), '—', ...(hasDebt ? [money(m.owed), money(m.net)] : [])]), ...runS.map((m, i) => [keyName(m.key) + ' ·', money(m.saved), money(runX[i].saved), ...(hasDebt ? [money(m.owed), money(m.net)] : [])])])}</section>`;
  // 4. income & plan settings, short
  const sal = Money.sortSalary(st.income.salary), ex = (st.income.extras || []).filter(x => !x.got && !x.gone).sort((a, b) => a.month < b.month ? -1 : 1);
  h += `<section class="card"><div class="card-head"><h2>Your income</h2><button class="link" data-act="income">Edit</button></div>
    <div>${sal.map((s, i) => `<div class="setting-row"><div class="t"><b class="num">${money(s.amt)} a month</b><span>${s.from ? `from ${esc(keyName(s.from))}` : 'salary'}${sal[i + 1] ? ` until ${esc(keyName(Money.keyAdd(sal[i + 1].from, -1)))}` : ''}</span></div></div>`).join('')}</div>
    ${ex.length ? `<span class="eyebrow">Expected extras</span><div>${ex.map(x => `<button class="cat-link" data-act="extra" data-id="${esc(x.id)}"><span class="t"><b>${esc(x.name || 'Extra')} · ${money(x.amt)}</b><span>${esc(keyName(x.month))} · ${x.count === false ? 'not counted' : `${Math.round((x.share ?? .5) * 100)}% counted`}</span></span>${I.right}</button>`).join('')}</div>` : ''}
    <div class="btn-row"><button class="btn ghost small" data-act="extra-new">+ Expected extra</button><button class="btn ghost small" data-act="more-tab" data-tab="plan">Savings % &amp; plan</button></div></section>`;
  return h;
}

/* ===== More ===== */
const MORE_TABS = [['activity', 'Activity'], ['plan', 'Plan'], ['bills', 'Bills'], ['cats', 'Categories'], ['settings', 'Settings']];
const moreTab = () => MORE_TABS.some(x => x[0] === S.moreTab) ? S.moreTab : 'activity';
function viewMore() {
  const t = moreTab();
  const seg = `<div class="seg range" role="group" aria-label="More sections">${MORE_TABS.map(([v, l]) => `<button data-act="more-tab" data-tab="${v}" aria-pressed="${t === v}">${l}</button>`).join('')}</div>`;
  const body = { activity: viewActivity, plan: () => planSettingsCard() + planSpend(), bills: planBills, cats: planCats, settings: planMore }[t]();
  return seg + body;
}
function planSettingsCard() {
  const st = S.settings, sal = Money.salaryAt(st.income, curKey()), split = Money.saveSplitOf(st), pots = st.saveCats.filter(c => !c.goal && !Money.isDebt(c));
  return `<section class="card" aria-label="Your plan"><div class="card-head"><h2>Your plan</h2></div>
    <div class="field"><label for="ps-pct">Save this much of every pay first</label><div class="slider-row"><input type="range" id="ps-pct" data-ps="savePct" min="0" max="80" step="1" value="${+st.savePct || 0}"><div class="pct-in" style="width:6rem"><input class="input" id="ps-pct-n" data-ps="savePct" inputmode="decimal" value="${+st.savePct || 0}" aria-label="Savings percent"></div></div>
      <span class="hint" id="ps-pct-hint">${sal > 0 ? `${money(sal * (+st.savePct || 0) / 100)} of your ${mw(sal)} salary this month` : 'Add your salary to see the amount.'}</span></div>
    <div class="field"><span>Where that savings goes</span>${pots.map(c => `<div class="goal-in"><span class="nm"><b><i class="dot" style="background:${goalColor(c)}"></i>${esc(c.name)}</b><span>${money(saveBal(c.id))} now</span></span><div class="pct-in"><input class="input" data-split-pot="${esc(c.id)}" inputmode="decimal" value="${split[c.id] || ''}" placeholder="0" aria-label="Percent of savings to ${esc(c.name)}"></div></div>`).join('')}
      <span class="hint" id="ps-split-hint">${Math.round(sum(Object.values(split)))}% shared out${Math.abs(sum(Object.values(split)) - 100) > 0.5 ? ' · it’s scaled to 100%' : ''}</span></div>
    <label class="field"><span>Least spending money a month</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" data-ps="spendFloor" inputmode="decimal" value="${+st.spendFloor || ''}" placeholder="0"></div><span class="hint">Suggested goal amounts never leave you less than this to spend.</span></label>
    <label class="field"><span>When an extra arrives, put this much towards goals</span><div class="pct-in" style="max-width:8rem"><input class="input" data-ps="extraGoalPct" inputmode="decimal" value="${st.extraGoalPct ?? 50}"></div><span class="hint">The rest goes to Spending. You can change it for each extra.</span></label>
    <div class="btn-row"><button class="btn ghost small" data-act="income">Salary &amp; extras</button><button class="btn ghost small" data-act="setup">Run setup again</button></div></section>`;
}

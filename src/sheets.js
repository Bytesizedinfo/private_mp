/* ---------- sheets (v5): goals, income & extras, setup, debt payments ---------- */
const monthIn = (id, v, label) => `<input class="input" type="month" id="${id}" value="${esc(v || '')}" placeholder="YYYY-MM" aria-label="${esc(label)}">`;
const keyOk = v => Money.isKey(v);

/* ===== one goal ===== */
function goalSeries(g, months) { // past month ends + forecast, as balance (or owed, for a debt)
  const p = plan(), debt = Money.isDebt(g), past = [];
  for (let i = 5; i >= 1; i--) { const P = periodAt(-i), k = Money.planKey(P, msNow()); if (S.tx.length && P.end < S.tx[S.tx.length - 1].d && !(+g.start > 0)) continue; past.push({ key: k, v: debt ? Money.debtOwed(g.debt, debtPays(g.id), k, msNow()) : saveBal(g.id, P.end) }); }
  const fut = p.run.months.slice(0, months).map((m, i) => ({ key: m.key, v: debt ? (m.debt[g.id] ? m.debt[g.id].owed : 0) : (m.bal[g.id] || 0), x: debt ? (p.runX.months[i].debt[g.id] ? p.runX.months[i].debt[g.id].owed : 0) : (p.runX.months[i].bal[g.id] || 0) }));
  return { past, fut };
}
function openGoal(id) {
  const g = saveCat(id); if (g === NOCAT) return; if (!g.goal) return openSaveCat(id);
  const p = plan(), ctx = p.ctx, pr = progressOf(g), s = p.status[id] || { s: g.done ? 'done' : 'noplan' }, debt = Money.isDebt(g);
  const dk = Money.isDay(g.date) ? keyOfDay(g.date) : null, endK = [dk, s.fin].filter(Boolean).sort().pop() || Money.keyAdd(ctx.curKey, 11);
  const months = Math.max(4, Math.min(60, Money.keyDiff(ctx.curKey, endK) + 2)), ser = goalSeries(g, months), n0 = ser.past.length;
  const labels = [...ser.past.map(x => keyShort(x.key)), ...ser.fut.map(x => keyShort(x.key, x.key.endsWith('-01')))];
  const col = goalColor(g), tgt = tgtOf(g);
  const chart = lineChart(labels, [
    { name: debt ? 'Owed so far' : 'Saved so far', color: col, vals: [...ser.past.map(x => x.v), ...ser.fut.map((x, i) => i === 0 ? x.v : null)], area: true },
    { name: 'Ahead (salary only)', color: col, vals: [...ser.past.map((x, i) => i === n0 - 1 ? x.v : null), ...ser.fut.map(x => x.v)], dash: '5 4' },
  ], { band: { lo: [...ser.past.map(() => null), ...ser.fut.map(x => x.v)], hi: [...ser.past.map(() => null), ...ser.fut.map(x => x.x)], color: col },
    target: !debt && tgt > 0 ? { v: tgt, label: `Target ${mw(tgt)}` } : null, marker: dk ? { i: n0 + Money.keyDiff(ctx.curKey, dk), label: `By ${keyShort(dk, true)}` } : null, todayAt: n0,
    tips: [...ser.past.map(x => `${keyName(x.key)}\n${debt ? 'Owed' : 'Saved'} ${money(x.v)}`), ...ser.fut.map(x => `${keyName(x.key)} (forecast)\n${debt ? 'Owed' : 'Saved'} ${money(x.v)}\nWith extras ${money(x.x)}`)], label: `${g.name} over time` });
  const thisM = monthItems().find(x => x.id === id);
  const phases = (g.phases || []).filter(ph => !ph.to || ph.to >= ctx.curKey);
  let behind = '';
  if (s.s === 'behind') {
    const opt = Money.behindOptions(g, ctx, s);
    behind = `<div class="behind"><b>${s.late ? `The date has passed with ${money(s.short)} to go.` : `On this plan you’d be ${money(s.short)} short by ${esc(fmtDY(g.date))}.`}</b><span class="muted small">Pick one. You can change it again any time.</span>
      <div class="opt2">${opt && opt.catchUp ? `<div class="opt"><span class="eyebrow">Catch up</span><b class="num">+${money(opt.catchUp.add, { dp: 0 })}/mo</b><span class="small">for ${opt.months} month${opt.months === 1 ? '' : 's'}, keeps ${esc(fmtDY(s.late ? periodAt(0).end : g.date))}</span>${opt.catchUp.fits ? '' : `<span class="status warn">${I.warn}More than you’ll have spare</span>`}<button class="btn small" data-act="gl-catch">Use this</button></div>` : ''}
        ${opt && opt.move ? `<div class="opt"><span class="eyebrow">Move the date</span><b>${esc(fmtDY(opt.move.date))}</b><span class="small">same monthly amount, ${Money.keyDiff(dk || ctx.curKey, opt.move.fin)} month${Money.keyDiff(dk || ctx.curKey, opt.move.fin) === 1 ? '' : 's'} later</span><button class="btn ghost small" data-act="gl-move">Use this</button></div>` : ''}</div></div>`;
  }
  let extra = '';
  if (debt) {
    const owe = pr.owe, min = +g.debt.min || 0, minOnly = Money.simDebt(owe, g.debt.apr, min), planned = min + Money.phaseAmt(g.phases, ctx.curKey), withPlan = Money.simDebt(owe, g.debt.apr, planned);
    extra = `<div class="flow" style="border-top:0;padding-top:0"><span>Owed now</span><span>${money(owe)}</span><span>Interest</span><span>${esc(+g.debt.apr || 0)}% a year</span><span>Minimum</span><span>${money(min)}/mo</span>
      <span>Minimum only</span><span>${minOnly.never ? 'never paid off' : `${minOnly.months} mo · ${money(minOnly.interest, { dp: 0 })} interest`}</span>
      ${planned > min + 0.004 ? `<span>Your plan (${money(planned, { dp: 0 })}/mo)</span><span>${withPlan.never ? 'never' : `${withPlan.months} mo · ${money(withPlan.interest, { dp: 0 })} interest`}</span>` : ''}</div>
      ${planned > min + 0.004 && !minOnly.never && !withPlan.never ? `<p class="status ok">${I.check}Paying ${money(planned - min, { dp: 0 })} more than the minimum saves about ${money(minOnly.interest - withPlan.interest, { dp: 0 })} in interest.</p>` : ''}
      ${saveBal(id) > 0.004 ? `<div class="banner"><b>${money(saveBal(id))}</b> is set aside for this debt. <button class="linkbtn" data-act="gl-pay">Record the payment</button></div>` : ''}`;
  } else if (g.kind === 'emergency') {
    const hist = expenseHistory(), avg = hist.length ? sum(hist) / hist.length : planBase();
    extra = `<div class="field"><span>Cover this many months of expenses</span><div class="chips" role="group" aria-label="Months">${[1, 2, 3, 4, 5, 6, 9, 12].map(m => `<button class="chip" data-act="gl-months" data-v="${m}" aria-pressed="${(+g.months || 3) === m && g.autoTarget}">${m}</button>`).join('')}</div>
      <span class="hint">${g.autoTarget ? `${g.months || 3} × about ${money(avg, { dp: 0 })} a month (${hist.length ? `your last ${hist.length} month${hist.length === 1 ? '' : 's'}` : 'your budget and bills'}) = <b>${mw(tgt)}</b>. It updates as your spending changes.` : `Target set by hand: ${mw(tgt)}. Pick a number of months to work it out from your spending instead.`}</span></div>`;
  }
  openSheet(g.name, `<div class="form">
    <div class="gd-top">${ring(pr.pct, col, 84, `${Math.round(Math.min(1, pr.pct) * 100)}%`, 8)}<div><span class="eyebrow">${esc(KIND_NAME[g.kind] || 'Goal')}${g.done ? ' · done' : ''}</span><div class="big"><span class="cur">${esc(sym())}</span>${nf2.format(debt ? pr.owe : Math.max(0, pr.have))}</div>
      <span class="muted small">${debt ? `still owed · ${money(pr.have, { dp: 0 })} paid off` : `of ${mw(tgt)}${g.date ? ` by ${esc(fmtDY(g.date))}` : ''}`}</span><div style="margin-top:6px">${g.done ? '' : statusChip(g)}</div></div></div>
    ${behind}
    <div>${chart}${legendHtml([{ name: debt ? 'Owed so far' : 'Saved so far', color: col }, { name: 'Ahead, salary only', color: col, dash: true }, { name: 'With extras', color: col, hatch: true }])}</div>
    ${tableHtml('Show as table', ['Month', debt ? 'Owed' : 'Saved', 'With extras'], [...ser.past.map(x => [keyName(x.key), money(x.v), '—']), ...ser.fut.map(x => [keyName(x.key) + ' ·', money(x.v), money(x.x)])])}
    ${s.fin && !g.done ? `<p class="small">${s.s === 'done' ? 'Reached.' : `Forecast: done around <b>${esc(keyName(s.fin))}</b> on your salary alone.`}</p>` : !g.done && s.s !== 'done' ? `<p class="small muted">At this plan it isn’t done within 20 years. Edit the plan to put more in.</p>` : ''}
    ${extra}
    <div class="sheet-sec"><div class="card-head"><h2 style="font-size:.95rem">Plan</h2><span class="muted small">${esc({ date: 'by date', amount: 'by monthly amount', phases: 'custom phases' }[g.planBy] || '')}</span></div>
      ${phases.length ? `<div class="ph-list">${phases.map(ph => `<div class="ph-row"><span>${ph.from && ph.from > ctx.curKey ? esc(keyName(ph.from)) : 'Now'} → ${ph.to ? esc(keyName(ph.to)) : 'until done'}</span><b class="num">${money(ph.amt)}/mo</b></div>`).join('')}</div>` : `<p class="muted small">${debt ? `Just the ${money(+g.debt.min)} minimum each month.` : 'Nothing planned yet.'}</p>`}
      ${thisM ? `<p class="small">This month: <b class="num">${money(thisM.put)}</b> of ${money(thisM.want)} in${thisM.due > 0.004 ? ` · ${money(thisM.due)} to go` : ' ✓'}</p>` : ''}</div>
    <div class="btn-row">${debt ? `<button class="btn soft" data-act="gl-pay">Record a payment</button>` : `<button class="btn soft" data-act="gl-in">Move money in</button>`}<button class="btn ghost" data-act="gl-edit">Edit plan</button></div>
    <button class="btn ${g.done ? 'ghost' : s.s === 'done' ? '' : 'ghost'}" data-act="gl-done">${g.done ? 'Reopen goal' : 'Mark done'}</button></div>`, sheet => {
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'gl-in') openMove(null, { to: id, from: 'spend', amt: thisM && thisM.due > 0.004 ? String(thisM.due) : '' });
      if (a === 'gl-pay') openPayDebt(id);
      if (a === 'gl-edit') openGoalEdit(id, { onDone: () => openGoal(id) });
      if (a === 'gl-months') { g.months = +b.dataset.v; g.autoTarget = true; saveSettings(); openGoal(id); }
      if (a === 'gl-catch' || a === 'gl-move') {
        const opt = Money.behindOptions(g, plan().ctx, plan().status[id]); if (!opt) return;
        if (a === 'gl-catch') { g.phases = opt.catchUp.phases; g.planBy = 'phases'; toast(`${g.name}: +${money(opt.catchUp.add, { dp: 0 })} a month until ${fmtDY(g.date)}`); }
        else { g.phases = opt.move.phases; g.date = opt.move.date; toast(`${g.name}: new date ${fmtDY(g.date)}`); }
        saveSettings(); openGoal(id);
      }
      if (a === 'gl-done') { if (g.done) { delete g.done; saveSettings(); toast(`${g.name} reopened`); } else { g.done = today(); saveSettings(); toast(`${g.name} marked done${saveBal(id) > 0.004 ? `. Its ${money(saveBal(id))} stays put.` : ''}`); } openGoal(id); }
    });
  });
}

/* ===== create or edit a goal: savings goal, emergency fund or debt; planned by date, monthly amount or phases ===== */
function openGoalEdit(id, opts = {}) {
  const s = S.settings, g = id ? s.saveCats.find(x => x.id === id) : null, used = new Set(s.saveCats.map(x => x.color)), cur = curKey();
  const type0 = g ? (Money.isDebt(g) ? 'debt' : g.kind === 'emergency' || (!g.goal && g.id === 'emergency') ? 'emergency' : 'save') : (opts.type || 'save'), gk = g ? g.kind || Money.guessKind(g) : 'big';
  const D = g ? { type: type0, kind: ['travel', 'big', 'other'].includes(gk) ? gk : 'big', name: g.name, color: g.color ?? 4, target: g.target ? String(g.target) : '', start: g.start ? String(g.start) : '', date: g.date || '',
      mode: g.planBy || (g.phases && g.phases.length ? 'phases' : 'date'), monthly: g.monthly ? String(g.monthly) : '', phases: clone((g.phases || []).filter(p => !p.to || p.to >= cur)), months: String(g.months || 3), auto: type0 === 'emergency' ? (g.goal ? !!g.autoTarget : !(+g.target > 0)) : false,
      bal: g.debt ? String(owedNow(g)) : '', apr: g.debt ? String(g.debt.apr ?? '') : '', min: g.debt ? String(g.debt.min ?? '') : '', touched: true }
    : { type: type0, kind: 'big', name: opts.type === 'emergency' ? 'Emergency fund' : '', color: [0, 2, 4, 3, 1, 5, 6].find(x => !used.has(x)) ?? 0, target: '', start: '', date: '', mode: 'date', monthly: '', phases: [], months: '3', auto: true, bal: '', apr: '', min: '', touched: false };
  if (D.mode === 'amount' && !D.monthly && D.phases.length === 1 && !D.phases[0].to) D.monthly = String(type0 === 'debt' ? r2(D.phases[0].amt + (+D.min || 0)) : D.phases[0].amt);
  if (D.mode === 'amount' && type0 === 'debt' && g && g.monthly) D.monthly = String(r2(+g.monthly));
  const tmpId = g ? g.id : '__draft';
  const num = v => r2(parseMoney(v));
  /* a copy of the settings with this goal as drafted, for the preview */
  function draftGoal() {
    const v = { id: tmpId, name: D.name.trim() || 'This goal', color: D.color, goal: true, start: D.type === 'debt' ? 0 : num(D.start) };
    if (D.type === 'debt') { const bal = num(D.bal); Object.assign(v, { kind: 'debt', target: 0, debt: { bal, apr: num(D.apr), min: num(D.min), asOf: today(), orig: Math.max(bal, g && g.debt ? +g.debt.orig || 0 : 0) } }); }
    else if (D.type === 'emergency') Object.assign(v, { kind: 'emergency', months: Math.max(1, Math.round(num(D.months)) || 3), autoTarget: !!D.auto, target: D.auto ? 0 : num(D.target) });
    else Object.assign(v, { kind: D.kind, target: num(D.target) });
    if (Money.isDay(D.date)) v.date = D.date;
    v.planBy = D.mode; v.phases = phasesFor(v);
    if (D.mode === 'amount') v.monthly = num(D.monthly);
    return v;
  }
  function draftCtx(v) {
    const st = clone(S.settings); st.saveCats = st.saveCats.filter(c => c.id !== tmpId); st.saveCats.push(v);
    const pri = priorityIds().filter(x => x !== tmpId); let at = pri.findIndex(x => (Money.KIND_ORDER[(saveCat(x) || {}).kind] ?? 4) > (Money.KIND_ORDER[v.kind] ?? 4));
    if (g) { const i = priorityIds().indexOf(tmpId); at = i < 0 ? pri.length : i; } else if (at < 0) at = pri.length;
    pri.splice(at, 0, tmpId); st.priority = pri;
    const ctx = planCtx(); ctx.st = st;
    const have = g ? saveBal(g.id) - (+g.start || 0) : 0; ctx.bal[tmpId] = r2(have + v.start); ctx.put[tmpId] = g ? ctx.put[g.id] || 0 : 0;
    if (Money.isDebt(v)) ctx.owed[tmpId] = v.debt.bal;
    if (v.kind === 'emergency' && v.autoTarget) ctx.target[tmpId] = Money.emergencyTarget(v.months, expenseHistory(), planBase()); else delete ctx.target[tmpId];
    return ctx;
  }
  function phasesFor(v) {
    if (D.mode === 'amount') { const m = num(D.monthly); const amt = v.kind === 'debt' ? Math.max(0, r2(m - num(D.min))) : m; return amt > 0 ? [{ from: cur, to: null, amt }] : []; }
    if (D.mode === 'phases' || D.touched) return D.phases.filter(p => keyOk(p.from) || p.from == null).map(p => ({ from: p.from || null, to: keyOk(p.to) ? p.to : null, amt: r2(+p.amt || 0) }));
    return D.phases;
  }
  function suggest() { // by date: fill phases from the forecast (unless you've edited them)
    if (D.mode !== 'date' || !Money.isDay(D.date) || D.touched) return null;
    const v = draftGoal(); v.phases = []; const res = Money.planByDate(draftCtx(v), tmpId, keyOfDay(D.date));
    D.phases = res.phases; return res;
  }
  let lastSug = null;
  const preview = () => {
    const v = draftGoal(), errs = Money.checkPhases(v.phases);
    if (D.type === 'debt' ? !(num(D.bal) > 0) : D.type === 'emergency' && D.auto ? false : !(num(D.target) > 0)) return `<p class="muted small">${D.type === 'debt' ? 'Enter what you owe.' : 'Enter the amount you want to save.'}</p>`;
    if (D.mode === 'date' && !Money.isDay(D.date)) return '<p class="muted small">Pick the date you want it done by.</p>';
    if (D.mode === 'amount' && !(num(D.monthly) > 0)) return `<p class="muted small">Enter how much to put in each month${D.type === 'debt' ? ' (including the minimum)' : ''}.</p>`;
    if (errs.length) return `<p class="status over">${I.over}${esc(errs[0].msg)}</p>`;
    const ctx = draftCtx(v), run = Money.forecast({ ...ctx, scenario: 'salary', months: 120 }), st = Money.goalStatus(v, run, ctx), fin = run.finish[tmpId];
    const months = Math.max(4, Math.min(48, Money.keyDiff(cur, [v.date ? keyOfDay(v.date) : null, fin].filter(Boolean).sort().pop() || Money.keyAdd(cur, 11)) + 2)), ms = run.months.slice(0, months);
    const tg = ctx.target[tmpId] ?? v.target, debt = Money.isDebt(v), col = `var(--p${D.color})`;
    const chart = lineChart(ms.map(m => keyShort(m.key, m.key.endsWith('-01'))), [{ name: 'Forecast', color: col, vals: ms.map(m => debt ? (m.debt[tmpId] || {}).owed || 0 : m.bal[tmpId] || 0), area: true }],
      { H: 150, target: !debt && tg > 0 ? { v: tg, label: `Target ${mw(tg)}` } : null, marker: v.date ? { i: Money.keyDiff(cur, keyOfDay(v.date)), label: keyShort(keyOfDay(v.date), true) } : null, tips: ms.map(m => `${keyName(m.key)}\n${debt ? 'Owed' : 'Saved'} ${money(debt ? (m.debt[tmpId] || {}).owed || 0 : m.bal[tmpId] || 0)}${m.goals[tmpId] ? `\nPut in ${money(m.goals[tmpId])}` : ''}${m.short[tmpId] ? `\nShort ${money(m.short[tmpId])}` : ''}`), label: 'Forecast for this goal' });
    const shortM = ms.filter(m => m.short[tmpId] > 0.004);
    let txt = fin ? `Done around <b>${esc(keyName(fin))}</b>` : 'Not done within 20 years at this rate';
    if (st.s === 'behind') txt += ` · <span style="color:var(--warn)">${money(st.short)} short by ${esc(fmtDY(v.date))}</span>`;
    else if (st.s === 'ahead') txt += ' · ahead of your date';
    else if (v.date && st.s === 'ontrack') txt += ' · on track';
    if (D.type === 'emergency' && D.auto) txt = `Target <b>${mw(tg)}</b> (${v.months} months of expenses). ` + txt;
    return `${chart}<p class="small">${txt}.</p>
      ${lastSug && !lastSug.ok ? `<p class="status warn">${I.warn}Your spare money until then only covers ${money(r2((tg || num(D.bal)) - lastSug.shortfall), { dp: 0 })}. Move the date, lower the amount, or lower your spending floor.</p>` : ''}
      ${shortM.length ? `<p class="status warn">${I.warn}Goals above it in your list leave it short in ${esc(shortM.slice(0, 4).map(m => keyShort(m.key)).join(', '))}${shortM.length > 4 ? '…' : ''}.</p>` : ''}`;
  };
  const phaseRows = () => `<div class="ph-edit">${D.phases.map((p, i) => `<div class="ph-erow"><div class="ph-mo">${monthIn(`ph-from-${i}`, p.from || cur, 'From')}<span>→</span>${monthIn(`ph-to-${i}`, p.to || '', 'To (blank = until done)')}</div><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ph-amt-${i}" data-ph="${i}" inputmode="decimal" value="${p.amt || ''}" placeholder="0" aria-label="Amount a month"></div><button class="icon-btn sm" data-act="ph-del" data-i="${i}" aria-label="Remove this phase">${I.close}</button></div>`).join('')}
    <button class="linkbtn" data-act="ph-add">+ Add a phase</button></div>`;
  const body = () => `<div class="form">
    <div class="seg" role="group" aria-label="Kind of goal">${[['save', 'Savings'], ['emergency', 'Emergency'], ['debt', 'Debt']].map(([v, l]) => `<button data-act="ge-type" data-v="${v}" aria-pressed="${D.type === v}">${l}</button>`).join('')}</div>
    <label class="field"><span>Name</span><input class="input" id="ge-name" value="${esc(D.name)}" placeholder="${D.type === 'debt' ? 'e.g. Credit card, Study loan' : D.type === 'emergency' ? 'Emergency fund' : 'e.g. Japan trip, New laptop'}" autocomplete="off"></label>
    ${D.type === 'save' ? `<div class="chips" role="group" aria-label="What kind">${[['travel', 'Travel'], ['big', 'Big purchase'], ['other', 'Other']].map(([v, l]) => `<button class="chip" data-act="ge-kind" data-v="${v}" aria-pressed="${D.kind === v}">${l}</button>`).join('')}</div>` : ''}
    ${D.type === 'debt' ? `<div class="grid2"><label class="field"><span>Owed now</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-bal" inputmode="decimal" value="${esc(D.bal)}" placeholder="0"></div></label>
        <label class="field"><span>Interest a year</span><div class="pct-in"><input class="input" id="ge-apr" inputmode="decimal" value="${esc(D.apr)}" placeholder="0"></div></label></div>
      <label class="field"><span>Minimum payment a month</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-min" inputmode="decimal" value="${esc(D.min)}" placeholder="0"></div><span class="hint">Counted with your bills, before savings and goals.</span></label>`
    : D.type === 'emergency' ? `<div class="field"><span>Cover how many months of expenses?</span><div class="grid2" style="align-items:center"><input class="input" id="ge-months" inputmode="numeric" value="${esc(D.months)}" aria-label="Months"><button class="switch" role="switch" aria-checked="${D.auto}" data-act="ge-auto" aria-label="Work out the target from my spending"></button></div><span class="hint">${D.auto ? 'On: the target is worked out from your spending and bills, and updates by itself.' : 'Off: type your own target below.'}</span></div>
      <div class="grid2">${D.auto ? '' : `<label class="field"><span>Target</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-target" inputmode="decimal" value="${esc(D.target)}" placeholder="0"></div></label>`}<label class="field"><span>Already saved <span class="hint">optional</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-start" inputmode="decimal" value="${esc(D.start)}" placeholder="0"></div></label></div>`
    : `<div class="grid2"><label class="field"><span>Amount you want</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-target" inputmode="decimal" value="${esc(D.target)}" placeholder="0"></div></label>
      <label class="field"><span>Already saved <span class="hint">optional</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-start" inputmode="decimal" value="${esc(D.start)}" placeholder="0"></div></label></div>`}
    <div class="field"><span>How do you want to plan it?</span><div class="seg" role="group" aria-label="Plan it by">${[['date', 'By date'], ['amount', 'Monthly'], ['phases', 'Phases']].map(([v, l]) => `<button data-act="ge-mode" data-v="${v}" aria-pressed="${D.mode === v}">${l}</button>`).join('')}</div>
      <span class="hint">${D.mode === 'date' ? 'Pick a date. The app suggests amounts from your forecast: less while your income is low, more after a raise.' : D.mode === 'amount' ? 'Pick how much each month. The app works out when it’s done.' : 'Set different amounts for different stretches of time.'}</span></div>
    ${D.mode === 'amount' ? `<label class="field"><span>${D.type === 'debt' ? 'Pay each month, in total' : 'Put in each month'}</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ge-monthly" inputmode="decimal" value="${esc(D.monthly)}" placeholder="0"></div></label>` : ''}
    <label class="field"><span>${D.mode === 'date' ? 'Done by' : 'Target date <span class="hint">optional</span>'}</span><input class="input" type="date" id="ge-date" value="${esc(D.date)}"></label>
    ${D.mode !== 'amount' ? `<div class="field"><span>${D.mode === 'date' ? 'Suggested amounts' : 'Phases'} <span class="hint">${D.mode === 'date' ? (D.touched ? 'edited · ' : '') + 'change any amount' : 'months, from → to'}</span></span>${phaseRows()}${D.mode === 'date' && D.touched ? '<button class="linkbtn" data-act="ph-reset">Suggest again</button>' : ''}</div>` : ''}
    <div id="ge-prev" class="ge-prev">${preview()}</div>
    <div class="field"><span>Colour</span><div class="swatches" role="group" aria-label="Colour">${[0, 1, 2, 3, 4, 5].map(i => `<button class="swatch pc${i}" data-act="ge-color" data-v="${i}" aria-pressed="${D.color === i}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
    <p class="small" id="ge-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="ge-save">${g ? 'Save' : 'Create goal'}</button>${g ? '<button class="btn danger" data-act="ge-del">Delete</button>' : ''}${opts.onDone ? '<button class="btn ghost" data-act="ge-back">Back</button>' : ''}</div></div>`;
  lastSug = suggest();
  openSheet(g ? `Edit ${g.name}` : 'New goal', body(), sheet => {
    if (!g) setTimeout(() => { const i = $('#ge-name'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 60);
    const repaint = () => { lastSug = suggest() || lastSug; $('.sheet-body').innerHTML = body(); };
    const soft = () => { const res = suggest(); if (res) { lastSug = res; const ed = $('.ph-edit'); if (ed) ed.outerHTML = phaseRows(); } const pv = $('#ge-prev'); if (pv) pv.innerHTML = preview(); };
    const onIn = e => {
      const t = e.target, map = { 'ge-name': 'name', 'ge-target': 'target', 'ge-start': 'start', 'ge-monthly': 'monthly', 'ge-bal': 'bal', 'ge-apr': 'apr', 'ge-min': 'min', 'ge-months': 'months', 'ge-date': 'date' };
      if (map[t.id]) { D[map[t.id]] = t.value; if (t.id === 'ge-date' && e.type === 'change') { if (D.mode === 'date') D.touched = false; repaint(); return; } }
      const m = /^ph-(from|to|amt)-(\d+)$/.exec(t.id); if (m) { const p = D.phases[+m[2]]; if (p) { if (m[1] === 'amt') p.amt = r2(parseMoney(t.value)); else p[m[1]] = t.value || null; D.touched = true; } }
      if (e.type === 'input' && (t.id === 'ge-name')) return;
      soft();
    };
    sheet.addEventListener('input', onIn); sheet.addEventListener('change', onIn);
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'ge-type') { D.type = b.dataset.v; if (D.type === 'emergency' && !D.name) D.name = 'Emergency fund'; repaint(); }
      if (a === 'ge-kind') { D.kind = b.dataset.v; $$('[data-act="ge-kind"]', sheet).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (a === 'ge-auto') { D.auto = !D.auto; repaint(); }
      if (a === 'ge-mode') { D.mode = b.dataset.v; if (D.mode === 'date') D.touched = false; if (D.mode === 'phases' && !D.phases.length) D.phases = [{ from: cur, to: Money.isDay(D.date) ? keyOfDay(D.date) : null, amt: r2(parseMoney(D.monthly)) || 0 }]; if (D.mode === 'phases') D.touched = true; repaint(); }
      if (a === 'ph-add') { const last = D.phases[D.phases.length - 1], from = last && keyOk(last.to) ? Money.keyAdd(last.to, 1) : last ? Money.keyAdd(last.from || cur, 3) : cur; if (last && !last.to) last.to = Money.keyAdd(from, -1); D.phases.push({ from, to: null, amt: last ? last.amt : 0 }); D.touched = true; repaint(); }
      if (a === 'ph-del') { D.phases.splice(+b.dataset.i, 1); D.touched = true; repaint(); }
      if (a === 'ph-reset') { D.touched = false; repaint(); }
      if (a === 'ge-color') { D.color = +b.dataset.v; $$('[data-act="ge-color"]', sheet).forEach(x => x.setAttribute('aria-pressed', x === b)); soft(); }
      if (a === 'ge-back') opts.onDone();
      if (a === 'ge-del') {
        const bal = saveBal(g.id); if (Math.abs(bal) > 0.004) { const err = $('#ge-err'); err.textContent = `Move the ${money(bal)} in ${g.name} somewhere else first, or mark the goal done instead.`; err.hidden = false; return; }
        armDanger(b, 'Tap again to delete', () => { removeGoal(g.id); saveSettings(); closeSheet(); toast(`${g.name} deleted`); });
      }
      if (a === 'ge-save') {
        const v = draftGoal(), name = D.name.trim(), err = $('#ge-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!name) return fail('Give the goal a name.');
        if (D.type === 'debt' && !(num(D.bal) > 0)) return fail('Enter what you owe.');
        if (D.type === 'save' && !(num(D.target) > 0)) return fail('Enter the amount you want to save.');
        if (D.type === 'emergency' && !D.auto && !(num(D.target) > 0)) return fail('Enter a target, or turn on “work it out from my spending”.');
        if (D.mode === 'date' && !Money.isDay(D.date)) return fail('Pick the date you want it done by.');
        const errs = Money.checkPhases(v.phases); if (errs.length) return fail(errs[0].msg);
        if (s.saveCats.some(x => x.id !== (g && g.id) && x.name.trim().toLowerCase() === name.toLowerCase())) return fail(`You already have something called ${name}.`);
        const nid = g ? g.id : newId('g'); v.id = nid; v.name = name;
        if (g && Money.isDebt(g) && Money.isDebt(v) && Math.abs(v.debt.bal - owedNow(g)) < 0.005) v.debt = { ...g.debt, apr: v.debt.apr, min: v.debt.min }; // owed unchanged: keep its history
        const pri = priorityIds();
        if (g) { for (const k of ['date', 'monthly', 'debt', 'months', 'autoTarget', 'aside', 'plan']) delete g[k]; Object.assign(g, v); }
        else { s.saveCats.push(v); const at = pri.findIndex(x => (Money.KIND_ORDER[saveCat(x).kind] ?? 4) > (Money.KIND_ORDER[v.kind] ?? 4)); pri.splice(at < 0 ? pri.length : at, 0, nid); s.priority = pri; }
        saveSettings(); toast(g ? `${name} saved` : `${name} added to your goals`, '', 3500);
        if (opts.onSaved) opts.onSaved(nid); else if (opts.onDone) opts.onDone(); else openGoal(nid);
      }
    });
  });
}
function removeGoal(id) {
  const s = S.settings;
  s.saveCats = s.saveCats.filter(x => x.id !== id); s.priority = (s.priority || []).filter(x => x !== id);
  if (s.saveSplit && s.saveSplit[id]) delete s.saveSplit[id];
  for (const x of (s.income && s.income.extras) || []) if (x.alloc && x.alloc.goals && typeof x.alloc.goals === 'object' && x.alloc.goals[id] != null) { delete x.alloc.goals[id]; if (!Object.keys(x.alloc.goals).length) x.alloc.goals = 'priority'; }
}

/* ===== record a debt payment (from the money set aside for it, or straight from Spending) ===== */
function openPayDebt(id) {
  const g = saveCat(id); if (!Money.isDebt(g)) return;
  const pot = saveBal(id), owe = owedNow(g), V = { amt: String(r2(Math.min(owe, pot > 0.004 ? pot : +g.debt.min || 0)) || ''), from: pot > 0.004 ? id : 'spend', d: today() };
  const body = () => `<div class="form"><p class="muted small">${money(owe)} owed${pot > 0.004 ? ` · ${money(pot)} set aside for it` : ''}.</p>
    <label class="amount-big"><span>${esc(sym())}</span><input id="pd-amt" inputmode="decimal" value="${esc(V.amt)}" aria-label="Amount paid"></label>
    <div class="field"><span>Paid from</span><div class="pick"><button data-act="pd-from" data-v="${esc(id)}" aria-pressed="${V.from === id}"><b><i class="dot" style="background:${goalColor(g)}"></i>Set aside for it</b><span>${money(pot)}</span></button><button data-act="pd-from" data-v="spend" aria-pressed="${V.from === 'spend'}"><b><i class="dot rs"></i>Spending</b><span>${money(spendMonth(periodAt(0)).left)} left</span></button></div></div>
    <label class="field"><span>Date</span><input class="input" type="date" id="pd-date" value="${esc(V.d)}"></label>
    <p class="small" id="pd-err" style="color:var(--over)" hidden></p><button class="btn" data-act="pd-save">Record payment</button></div>`;
  openSheet(`Pay ${g.name}`, body(), sheet => {
    sheet.addEventListener('input', e => { if (e.target.id === 'pd-amt') V.amt = e.target.value; if (e.target.id === 'pd-date') V.d = e.target.value || today(); });
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'pd-from') { V.from = b.dataset.v; $('.sheet-body').innerHTML = body(); }
      if (b.dataset.act === 'pd-save') {
        const amt = r2(parseMoney(V.amt)), err = $('#pd-err'); if (!(amt > 0)) { err.textContent = 'Enter an amount above zero.'; err.hidden = false; return; }
        const lab = S.settings.labels.some(l => l.id === 'bills') ? 'bills' : '';
        addTx([{ id: newId(), d: V.d, t: 'out', amt, label: lab, from: V.from, note: `Payment · ${g.name}`, debt: id }]);
        closeSheet(); toast(`${money(amt)} paid to ${g.name}. ${money(owedNow(g))} left to pay.`, '', 4500);
      }
    });
  });
}

/* ===== income: salary changes, payday, expected extras ===== */
function openIncome() {
  const s = S.settings, inc = s.income, cur = curKey();
  const D = { salary: Money.sortSalary(inc.salary).map(x => ({ from: x.from, amt: String(x.amt) })), payDay: inc.payDay ? String(inc.payDay) : '' };
  if (!D.salary.length) D.salary.push({ from: null, amt: '' });
  const body = () => `<div class="form">
    <div class="field"><span>Salary (take-home, a month)</span><div class="sal-list">${D.salary.map((x, i) => `<div class="sal-row"><span class="muted small">${i === 0 ? 'Now' : 'From'}</span>${i === 0 ? '<span></span>' : monthIn(`sal-from-${i}`, x.from, 'From month')}<div class="money-in" data-sym="${esc(sym())}"><input class="input" id="sal-amt-${i}" inputmode="decimal" value="${esc(x.amt)}" placeholder="0" aria-label="Salary"></div>${i ? `<button class="icon-btn sm" data-act="sal-del" data-i="${i}" aria-label="Remove this change">${I.close}</button>` : '<span></span>'}</div>`).join('')}</div>
      <button class="linkbtn" data-act="sal-add">+ My salary changes on a date</button><span class="hint">e.g. a raise, a new job, or an internship ending. The forecast uses each amount from its month.</span></div>
    <label class="field"><span>Payday <span class="hint">optional · day of the month</span></span><input class="input" id="sal-day" inputmode="numeric" value="${esc(D.payDay)}" placeholder="e.g. 25" style="max-width:8rem"></label>
    <div class="field"><span>Expected extras</span>${(inc.extras || []).filter(x => !x.got && !x.gone).sort((a, b) => a.month < b.month ? -1 : 1).map(x => `<button class="cat-link" data-act="inc-extra" data-id="${esc(x.id)}"><span class="t"><b>${esc(x.name || 'Extra')} · ${money(x.amt)}</b><span>${esc(keyName(x.month))} · ${x.count === false ? 'not counted' : `${Math.round((x.share ?? .5) * 100)}% counted`}</span></span>${I.right}</button>`).join('') || '<p class="muted small">Bonus, side gigs, tuition, ang bao… add the ones you’re expecting.</p>'}<button class="btn ghost small" data-act="inc-extra-new" style="align-self:flex-start">+ Add an expected extra</button></div>
    <p class="small" id="sal-err" style="color:var(--over)" hidden></p>
    <button class="btn" data-act="sal-save">Save</button></div>`;
  openSheet('Salary & extras', body(), sheet => {
    const onIn = e => { const t = e.target, m = /^sal-(from|amt)-(\d+)$/.exec(t.id); if (m) D.salary[+m[2]][m[1]] = t.value || (m[1] === 'from' ? null : ''); if (t.id === 'sal-day') D.payDay = t.value; };
    sheet.addEventListener('input', onIn); sheet.addEventListener('change', onIn);
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'sal-add') { const last = D.salary[D.salary.length - 1]; D.salary.push({ from: last.from ? Money.keyAdd(last.from, 3) : Money.keyAdd(cur, 1), amt: last.amt }); $('.sheet-body').innerHTML = body(); }
      if (a === 'sal-del') { D.salary.splice(+b.dataset.i, 1); $('.sheet-body').innerHTML = body(); }
      if (a === 'inc-extra') openExtra(b.dataset.id, { onDone: openIncome });
      if (a === 'inc-extra-new') openExtra(null, { onDone: openIncome });
      if (a === 'sal-save') {
        const err = $('#sal-err'), fail = m => { err.textContent = m; err.hidden = false; };
        const list = D.salary.map((x, i) => ({ from: i === 0 ? null : x.from, amt: r2(parseMoney(x.amt)) }));
        if (list.slice(1).some(x => !keyOk(x.from))) return fail('Pick the month each change starts.');
        const froms = list.slice(1).map(x => x.from); if (new Set(froms).size !== froms.length) return fail('Two changes start in the same month.');
        const day = Math.round(parseMoney(D.payDay));
        inc.salary = list; inc.payDay = day >= 1 && day <= 31 ? day : null; s.pay = Money.salaryAt(inc, cur);
        saveSettings(); closeSheet(); toast('Salary saved. The forecast is updated.');
      }
    });
  });
}
function openExtra(id, opts = {}) {
  const s = S.settings, inc = s.income, x = id ? (inc.extras || []).find(e => e.id === id) : null, cur = curKey(), goals = plan().items.filter(c => c.goal || Money.isDebt(c));
  const incs = (s.incomeCats || []).filter(c => c.id !== 'salary');
  const D = x ? { name: x.name || '', cat: x.cat || '', month: x.month, amt: String(x.amt), count: x.count !== false, share: String(Math.round((x.share ?? .5) * 100)), goalPct: String(x.alloc && x.alloc.goalPct != null ? x.alloc.goalPct : s.extraGoalPct ?? 50), custom: !!(x.alloc && typeof x.alloc.goals === 'object'), goals: x.alloc && typeof x.alloc.goals === 'object' ? { ...x.alloc.goals } : {}, rest: (x.alloc && x.alloc.rest) || 'spend' }
    : { name: '', cat: (incs[0] || {}).id || '', month: opts.month || Money.keyAdd(cur, 1), amt: '', count: true, share: '50', goalPct: String(s.extraGoalPct ?? 50), custom: false, goals: {}, rest: 'spend' };
  const past = x && x.month < cur;
  const body = () => `<div class="form">
    ${past ? `<div class="banner">This was expected in <b>${esc(keyName(x.month))}</b>. Did it arrive?<div class="btn-row" style="margin-top:8px"><button class="btn small" data-act="ex-got">Yes, log it</button><button class="btn ghost small" data-act="ex-later">Move to ${esc(keyMonth(cur))}</button><button class="btn ghost small" data-act="ex-gone">It didn’t come</button></div></div>` : ''}
    <label class="field"><span>What is it?</span><input class="input" id="ex-name" value="${esc(D.name)}" placeholder="e.g. Year-end bonus, Tuition, Ang bao" autocomplete="off"></label>
    ${incs.length ? `<div class="chips" role="group" aria-label="Income category">${incs.map(c => `<button class="chip" data-act="ex-cat" data-v="${esc(c.id)}" aria-pressed="${D.cat === c.id}"><i class="dot c${c.color ?? 8}"></i>${esc(c.name)}</button>`).join('')}</div>` : ''}
    <div class="grid2"><label class="field"><span>Amount</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="ex-amt" inputmode="decimal" value="${esc(D.amt)}" placeholder="0"></div></label><label class="field"><span>Month</span>${monthIn('ex-month', D.month, 'Month')}</label></div>
    <div class="setting-row"><div class="t"><b>Count it in my forecast</b><span>Shows in the “with extras” lines. Goals are still planned on salary alone.</span></div><button class="switch" role="switch" aria-checked="${D.count}" data-act="ex-count" aria-label="Count it in my forecast"></button></div>
    ${D.count ? `<label class="field"><span>How much of it to count</span><div class="pct-in" style="max-width:8rem"><input class="input" id="ex-share" inputmode="decimal" value="${esc(D.share)}"></div><span class="hint">Counting half is a safe guess for money that isn’t certain.</span></label>` : ''}
    <div class="field"><span>When it arrives</span><div class="grid2" style="align-items:center"><div class="pct-in"><input class="input" id="ex-gp" inputmode="decimal" value="${esc(D.goalPct)}" aria-label="Percent to goals"></div><span class="small">to goals, the rest to <select class="input slim" id="ex-rest" aria-label="The rest goes to" style="display:inline-block;width:auto;min-height:36px;padding:4px 8px"><option value="spend" ${D.rest === 'spend' ? 'selected' : ''}>Spending</option><option value="save" ${D.rest === 'save' ? 'selected' : ''}>Savings</option></select></span></div>
      <div class="seg mini" role="group" aria-label="Split between goals"><button data-act="ex-custom" data-v="0" aria-pressed="${!D.custom}">By priority</button><button data-act="ex-custom" data-v="1" aria-pressed="${D.custom}">I’ll choose</button></div>
      ${D.custom ? goals.map(c => `<div class="goal-in"><span class="nm"><b><i class="dot" style="background:${goalColor(c)}"></i>${esc(c.name)}</b></span><div class="pct-in"><input class="input" data-exg="${esc(c.id)}" inputmode="decimal" value="${D.goals[c.id] || ''}" placeholder="0" aria-label="Percent of the goals part to ${esc(c.name)}"></div></div>`).join('') + `<span class="hint">Shares of the goals part. They’re scaled to 100%.</span>` : `<span class="hint">Fills your goals in order, top first. Anything over goes to savings.</span>`}</div>
    <p class="small" id="ex-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="ex-save">${x ? 'Save' : 'Add extra'}</button>${x ? '<button class="btn danger" data-act="ex-del">Delete</button>' : ''}${opts.onDone ? '<button class="btn ghost" data-act="ex-back">Back</button>' : ''}</div></div>`;
  const read = () => { const g = id => { const el = $('#' + id); return el ? el.value : null; }; D.name = g('ex-name') ?? D.name; D.amt = g('ex-amt') ?? D.amt; D.month = g('ex-month') ?? D.month; D.share = g('ex-share') ?? D.share; D.goalPct = g('ex-gp') ?? D.goalPct; D.rest = g('ex-rest') ?? D.rest; $$('[data-exg]').forEach(i => D.goals[i.dataset.exg] = r2(parseMoney(i.value))); };
  const repaint = () => { read(); $('.sheet-body').innerHTML = body(); };
  openSheet(x ? (x.name || 'Expected extra') : 'Expected extra', body(), sheet => {
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'ex-cat') { D.cat = b.dataset.v; $$('[data-act="ex-cat"]', sheet).forEach(y => y.setAttribute('aria-pressed', y === b)); }
      if (a === 'ex-count') { D.count = !D.count; repaint(); }
      if (a === 'ex-custom') { D.custom = b.dataset.v === '1'; repaint(); }
      if (a === 'ex-back') opts.onDone();
      if (a === 'ex-got') { closeSheet(); openIn(null, { src: 'other', cat: x.cat || (incs[0] || {}).id, amt: String(x.amt), note: x.name || '', extraId: x.id }); }
      if (a === 'ex-later') { x.month = cur; saveSettings(); toast(`Moved to ${keyMonth(cur)}`); opts.onDone ? opts.onDone() : closeSheet(); }
      if (a === 'ex-gone') { x.gone = true; saveSettings(); toast('Dropped. It no longer counts in your forecast.'); opts.onDone ? opts.onDone() : closeSheet(); }
      if (a === 'ex-del') armDanger(b, 'Tap again to delete', () => { inc.extras = inc.extras.filter(e => e.id !== x.id); saveSettings(); toast('Deleted'); opts.onDone ? opts.onDone() : closeSheet(); });
      if (a === 'ex-save') {
        read(); const err = $('#ex-err'), fail = m => { err.textContent = m; err.hidden = false; };
        const amt = r2(parseMoney(D.amt)); if (!(amt > 0)) return fail('Enter an amount above zero.'); if (!keyOk(D.month)) return fail('Pick the month you expect it.');
        const goalsSplit = {}; for (const [k, v] of Object.entries(D.goals)) if (+v > 0) goalsSplit[k] = +v;
        const v = { name: D.name.trim(), cat: D.cat, month: D.month, amt, count: D.count, share: Math.max(0, Math.min(100, parseMoney(D.share))) / 100, alloc: { goalPct: Math.max(0, Math.min(100, parseMoney(D.goalPct))), goals: D.custom && Object.keys(goalsSplit).length ? goalsSplit : 'priority', rest: D.rest } };
        inc.extras ||= []; if (x) Object.assign(x, v); else inc.extras.push({ id: newId('x'), ...v });
        saveSettings(); toast(x ? 'Saved' : `Added: ${money(amt)} in ${keyMonth(D.month)}`); opts.onDone ? opts.onDone() : closeSheet();
      }
    });
  });
}
/* one month in the forecast: its salary (override) and extras */
function openMonth(k) {
  const s = S.settings, inc = s.income, M = Money.monthOf(plan().run, k), MX = Money.monthOf(plan().runX, k), sched = (() => { const o = { ...inc, over: {} }; return Money.salaryAt(o, k); })();
  const ov = inc.over && inc.over[k] && inc.over[k].sal != null ? String(inc.over[k].sal) : '', ex = (inc.extras || []).filter(x => x.month === k && !x.gone);
  openSheet(keyName(k), `<div class="form">
    <label class="field"><span>Salary this month</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="mo-sal" inputmode="decimal" value="${esc(ov)}" placeholder="${esc(String(sched))}"></div><span class="hint">Leave blank to use your usual ${mw(sched)}. Type 0 for a month without pay.</span></label>
    <div class="field"><span>Extras this month</span>${ex.map(x => `<button class="cat-link" data-act="mo-extra" data-id="${esc(x.id)}"><span class="t"><b>${esc(x.name || 'Extra')} · ${money(x.amt)}</b><span>${x.got ? 'arrived' : x.count === false ? 'not counted' : `${Math.round((x.share ?? .5) * 100)}% counted`}</span></span>${I.right}</button>`).join('') || '<p class="muted small">None yet.</p>'}<button class="btn ghost small" data-act="mo-extra-new" style="align-self:flex-start">+ Add an extra</button></div>
    ${M ? `<div class="flow"><span class="muted">Forecast, salary only</span><span></span><span>Bills</span><span>${money(M.bills)}</span><span>Savings</span><span>${money(M.save)}</span><span>Goals</span><span>${money(sum(Object.values(M.goals)))}</span><span class="tot">Spending money</span><span class="tot">${money(M.spend)}</span>${MX && MX.inc.ext ? `<span>With extras</span><span>${money(MX.spend)} to spend</span>` : ''}</div>` : ''}
    <button class="btn" data-act="mo-save">Save</button></div>`, sheet => {
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'mo-extra') openExtra(b.dataset.id, { onDone: () => openMonth(k) });
      if (a === 'mo-extra-new') openExtra(null, { month: k, onDone: () => openMonth(k) });
      if (a === 'mo-save') { const raw = $('#mo-sal').value.trim(); inc.over ||= {}; if (raw === '') delete inc.over[k]; else inc.over[k] = { sal: r2(parseMoney(raw)) }; saveSettings(); closeSheet(); toast(raw === '' ? `${keyMonth(k)} uses your usual salary` : `${keyMonth(k)}: ${money(parseMoney(raw))} salary`); }
    });
  });
}

/* ===== setup: salary → savings % → spending floor & extras → goals ===== */
function openSetup(step = 1) {
  const s = S.settings, cur = curKey(), inc = s.income;
  const D = S.setupDraft || (S.setupDraft = {
    salary: Money.sortSalary(inc.salary).map(x => ({ from: x.from, amt: String(x.amt) })), payDay: inc.payDay ? String(inc.payDay) : '',
    savePct: String(s.savePct ?? 30), split: { ...Money.saveSplitOf(s) }, floor: String(s.spendFloor ?? r2(budgetNow().month)), goalPct: String(s.extraGoalPct ?? 50),
    emMonths: String((s.saveCats.find(c => c.kind === 'emergency') || {}).months || 3), emGoal: s.saveCats.some(c => c.kind === 'emergency' && c.goal) || s.saveCats.some(c => c.id === 'emergency'),
  });
  if (!D.salary.length) D.salary.push({ from: null, amt: '' });
  const pots = s.saveCats.filter(c => !c.goal && !Money.isDebt(c)), salNow = r2(parseMoney((D.salary[0] || {}).amt));
  const dots = `<div class="steps" aria-label="Step ${step} of 4">${[1, 2, 3, 4].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
  const steps = {
    1: () => `<h3 class="st-h">Your salary</h3><p class="muted small">Take-home pay a month. If it changes on a known date, add the change.</p>
      <div class="sal-list">${D.salary.map((x, i) => `<div class="sal-row"><span class="muted small">${i === 0 ? 'Now' : 'From'}</span>${i === 0 ? '<span></span>' : monthIn(`su-from-${i}`, x.from, 'From month')}<div class="money-in" data-sym="${esc(sym())}"><input class="input" id="su-amt-${i}" inputmode="decimal" value="${esc(x.amt)}" placeholder="0" aria-label="Salary"></div>${i ? `<button class="icon-btn sm" data-act="su-sal-del" data-i="${i}" aria-label="Remove">${I.close}</button>` : '<span></span>'}</div>`).join('')}</div>
      <button class="linkbtn" data-act="su-sal-add">+ It changes on a date</button>
      <label class="field"><span>Payday <span class="hint">optional · day of the month</span></span><input class="input" id="su-day" inputmode="numeric" value="${esc(D.payDay)}" placeholder="e.g. 25" style="max-width:8rem"></label>`,
    2: () => `<h3 class="st-h">Save first</h3><p class="muted small">This share of every pay goes to savings before goals and spending.</p>
      <div class="slider-row"><input type="range" id="su-pct" min="0" max="80" step="1" value="${esc(D.savePct)}" aria-label="Savings percent"><div class="pct-in" style="width:6rem"><input class="input" id="su-pct-n" inputmode="decimal" value="${esc(D.savePct)}" aria-label="Savings percent"></div></div>
      <p class="small" id="su-pct-hint">${salNow ? `${money(salNow * parseMoney(D.savePct) / 100)} of ${mw(salNow)}` : ''}</p>
      <div class="field"><span>Where it goes</span>${pots.map(c => `<div class="goal-in"><span class="nm"><b><i class="dot" style="background:${goalColor(c)}"></i>${esc(c.name)}</b></span><div class="pct-in"><input class="input" data-su-split="${esc(c.id)}" inputmode="decimal" value="${D.split[c.id] || ''}" placeholder="0" aria-label="Percent to ${esc(c.name)}"></div></div>`).join('')}<span class="hint">General savings gets all of it unless you change this.</span></div>`,
    3: () => `<h3 class="st-h">Spending &amp; extras</h3>
      <label class="field"><span>The least you want to have to spend each month</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="su-floor" inputmode="decimal" value="${esc(D.floor)}" placeholder="0"></div><span class="hint">Suggested goal amounts never leave you less than this.</span></label>
      <label class="field"><span>When a bonus or other extra arrives, how much goes to goals?</span><div class="pct-in" style="max-width:8rem"><input class="input" id="su-gp" inputmode="decimal" value="${esc(D.goalPct)}"></div><span class="hint">The rest is yours to spend. You can change it for each extra.</span></label>`,
    4: () => { const goals = priorityIds().map(saveCat).filter(c => c.goal);
      return `<h3 class="st-h">Your goals</h3><p class="muted small">Goals at the top get money first when a month is tight. Use the arrows to reorder.</p>
      ${goals.length ? `<div>${goals.map((c, i) => `<div class="setting-row"><div class="t"><b><i class="dot" style="background:${goalColor(c)};margin-right:8px"></i>${i + 1}. ${esc(c.name)}</b><span>${esc(KIND_NAME[c.kind] || 'Goal')} · ${esc(phaseText(c, true))}</span></div><div class="gc-ord"><button class="icon-btn sm" data-act="su-up" data-id="${esc(c.id)}" aria-label="Up" ${i ? '' : 'disabled'}>${I.chevUp}</button><button class="icon-btn sm" data-act="su-down" data-id="${esc(c.id)}" aria-label="Down" ${i < goals.length - 1 ? '' : 'disabled'}>${I.chevDown}</button></div></div>`).join('')}</div>` : '<p class="small">No goals yet. You can add them after this.</p>'}
      ${(() => { const pots2 = s.saveCats.filter(c => !c.goal && !Money.isDebt(c) && !['other', 'general', 'emergency'].includes(c.id)); return pots2.length ? `<div class="field"><span>Saving up in a category? Make it a goal</span><div class="chips" role="group" aria-label="Make a goal">${pots2.map(c => `<button class="chip" data-act="su-mkgoal" data-id="${esc(c.id)}"><i class="dot" style="background:${goalColor(c)}"></i>${esc(c.name)}</button>`).join('')}</div><span class="hint">Give it a target and a date, and the money already in it counts.</span></div>` : ''; })()}
      ${D.emGoal ? `<label class="field"><span>Emergency fund: how many months of expenses?</span><input class="input" id="su-em" inputmode="numeric" value="${esc(D.emMonths)}" style="max-width:8rem"><span class="hint">The target is worked out from your spending and bills.</span></label>` : `<div class="setting-row"><div class="t"><b>Add an emergency fund</b><span>A cushion of a few months’ expenses</span></div><button class="btn soft small" data-act="su-em-add">Add</button></div>`}`; },
  };
  const body = () => `<div class="form">${dots}${steps[step]()}<p class="small" id="su-err" style="color:var(--over)" hidden></p>
    <div class="btn-row">${step > 1 ? '<button class="btn ghost" data-act="su-back">Back</button>' : ''}<button class="btn" data-act="su-next">${step < 4 ? 'Next' : 'Finish'}</button></div></div>`;
  openSheet('Set up your plan', body(), sheet => {
    const onIn = e => {
      const t = e.target, m = /^su-(from|amt)-(\d+)$/.exec(t.id); if (m) D.salary[+m[2]][m[1]] = t.value || (m[1] === 'from' ? null : '');
      if (t.id === 'su-day') D.payDay = t.value; if (t.id === 'su-floor') D.floor = t.value; if (t.id === 'su-gp') D.goalPct = t.value; if (t.id === 'su-em') D.emMonths = t.value;
      if (t.id === 'su-pct' || t.id === 'su-pct-n') { D.savePct = t.value; const o = $(t.id === 'su-pct' ? '#su-pct-n' : '#su-pct'); if (o) o.value = t.value; const h = $('#su-pct-hint'); if (h && salNow) h.textContent = `${money(salNow * parseMoney(t.value) / 100)} of ${mw(salNow)}`; }
      if (t.dataset.suSplit) D.split[t.dataset.suSplit] = r2(parseMoney(t.value));
    };
    sheet.addEventListener('input', onIn); sheet.addEventListener('change', onIn);
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, err = $('#su-err'), fail = m => { err.textContent = m; err.hidden = false; };
      if (a === 'su-sal-add') { const last = D.salary[D.salary.length - 1]; D.salary.push({ from: last.from ? Money.keyAdd(last.from, 3) : Money.keyAdd(cur, 1), amt: last.amt }); openSetup(step); }
      if (a === 'su-sal-del') { D.salary.splice(+b.dataset.i, 1); openSetup(step); }
      if (a === 'su-up' || a === 'su-down') { movePriority(b.dataset.id, a === 'su-up' ? -1 : 1); openSetup(4); }
      if (a === 'su-mkgoal') openGoalEdit(b.dataset.id, { onSaved: () => openSetup(4), onDone: () => openSetup(4) });
      if (a === 'su-em-add') { closeSheet(); openGoalEdit(null, { type: 'emergency', onSaved: () => openSetup(4), onDone: () => openSetup(4) }); }
      if (a === 'su-back') openSetup(step - 1);
      if (a === 'su-next') {
        if (step === 1) { const list = D.salary.map((x, i) => ({ from: i ? x.from : null, amt: r2(parseMoney(x.amt)) })); if (!(list[0].amt >= 0) || list.slice(1).some(x => !keyOk(x.from))) return fail('Pick the month each change starts.'); }
        if (step < 4) return openSetup(step + 1);
        // finish: write everything
        inc.salary = D.salary.map((x, i) => ({ from: i ? x.from : null, amt: r2(parseMoney(x.amt)) }));
        const day = Math.round(parseMoney(D.payDay)); inc.payDay = day >= 1 && day <= 31 ? day : null; s.pay = Money.salaryAt(inc, cur);
        s.savePct = Math.max(0, Math.min(100, r2(parseMoney(D.savePct)))); const sp = {}; for (const [k, v] of Object.entries(D.split)) if (+v > 0) sp[k] = +v; if (Object.keys(sp).length) s.saveSplit = sp;
        s.spendFloor = Math.max(0, r2(parseMoney(D.floor))); s.extraGoalPct = Math.max(0, Math.min(100, r2(parseMoney(D.goalPct))));
        if (D.emGoal) {
          let em = s.saveCats.find(c => c.kind === 'emergency' && c.goal) || s.saveCats.find(c => c.id === 'emergency');
          if (em) { if (!em.goal) Object.assign(em, { goal: true, kind: 'emergency', planBy: 'amount', phases: [], autoTarget: !(+em.target > 0) }); em.months = Math.max(1, Math.round(parseMoney(D.emMonths)) || 3); if (!(+em.target > 0)) em.autoTarget = true;
            if (!(em.phases && em.phases.length)) { const res = Money.planByDate({ ...planCtx(), st: { ...s, priority: priorityIds() } }, em.id, Money.keyAdd(cur, 11)); em.phases = res.phases; em.planBy = 'phases'; } }
        }
        s.priority = priorityIds(); s.review = false; S.setupDraft = null;
        saveSettings(); closeSheet(); toast('Your plan is set. Home now shows what’s safe to spend.', '', 4500);
      }
    });
  });
}

/* ===== appearance ===== */
function appearanceCard() {
  const t = lsGet('spend-save:theme') || 'system';
  return `<section class="card"><div class="card-head"><h2>Appearance</h2></div><div class="seg" role="group" aria-label="Theme">${[['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button data-act="theme" data-v="${v}" aria-pressed="${t === v}">${l}</button>`).join('')}</div><p class="muted small">Saved on this device.</p></section>`;
}
function applyTheme() { const t = lsGet('spend-save:theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }

/* savings categories can have a monthly amount (a plan after goals) */
const monthlyField = (pre, D) => `<label class="field"><span>Put in each month <span class="hint">optional</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="${pre}-aside" inputmode="decimal" value="${esc(D.aside)}" placeholder="0"></div><span class="hint">Joins your monthly plan after your goals. Set it aside from Home with one tap.</span></label>`;
function applyMonthly(c, D) { const a = r2(parseMoney(D.aside)); delete c.aside; if (a > 0) { c.planBy = 'amount'; c.monthly = a; c.phases = [{ from: null, to: null, amt: a }]; } else if (!c.goal) { delete c.planBy; delete c.monthly; delete c.phases; } }

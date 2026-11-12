/* Engine tests: run by tests/engine_test.html (built by build.py). The page title ends up "PASS n" or "FAIL n of m". */
(() => {
const out = document.getElementById('out'), lines = []; let pass = 0, fail = 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function eq(name, got, want) { if (same(got, want)) { pass++; lines.push(`<pre class="ok">✓ ${name}</pre>`); } else { fail++; lines.push(`<pre class="bad">✗ ${name}\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}</pre>`); } }
function near(name, got, want, tol = 0.005) { eq(name, Math.abs(got - want) <= tol ? want : got, want); }
const M = Money;
const cat = (id, extra = {}) => ({ id, name: id, color: 0, start: 0, target: 0, ...extra });
const base = (extra = {}) => ({
  v: 5, monthStart: 1, savePct: 10, saveSplit: { general: 100 }, spendFloor: 100, extraGoalPct: 50, monthEnd: 'carry',
  income: { salary: [{ from: null, amt: 800 }, { from: '2027-02', amt: 3200 }], extras: [], over: {} },
  saveCats: [cat('other'), cat('general'),
    cat('emergency', { goal: true, kind: 'emergency', target: 10000, phases: [{ from: null, to: null, amt: 500 }] }),
    cat('travel', { goal: true, kind: 'travel', target: 5000, phases: [{ from: null, to: null, amt: 300 }] })],
  priority: ['emergency', 'travel'],
  subs: [{ id: 'rent', kind: 'bill', name: 'Rent', amount: 600, cycle: 'monthly', next: '2027-01-05', day: 5, from: 'spend' }],
  ...extra,
});
const ctxFor = (st, curKey, more = {}) => ({ st, curKey, months: 12, bal: {}, put: {}, spendLeft: 0, payLogged: false, payAmt: 0, owed: {}, target: {}, ...more });

try {
  // 1. salary with a dated change and a one-month override
  const inc = { salary: [{ from: null, amt: 800 }, { from: '2027-02', amt: 3200 }], over: { '2027-03': { sal: 0 } } };
  eq('salaryAt before the raise', M.salaryAt(inc, '2027-01'), 800);
  eq('salaryAt from the raise', M.salaryAt(inc, '2027-02'), 3200);
  eq('salaryAt with a month override', M.salaryAt(inc, '2027-03'), 0);
  eq('salaryAt after the override', M.salaryAt(inc, '2027-04'), 3200);

  // 2 + 3. the money order in a high and a low month
  const run = M.forecast(ctxFor(base(), '2027-01'));
  const jan = run.months[0], feb = run.months[1];
  eq('high month: bills, save, goals, spend', [feb.bills, feb.save, feb.goals.emergency, feb.goals.travel, feb.spend], [600, 320, 500, 300, 1480]);
  eq('low month: floor kept, goals cut by priority', [jan.bills, jan.save, jan.goals.emergency || 0, jan.goals.travel || 0, jan.short.emergency, jan.short.travel, jan.spend, jan.low], [600, 80, 20, 0, 480, 300, 100, false]);
  eq('balances roll forward', [feb.bal.general, feb.bal.emergency, feb.bal.travel], [400, 520, 300]);
  const runF = M.forecast(ctxFor(base({ spendFloor: 2500 }), '2027-01')), febF = runF.months[1];
  eq('a high floor leaves goals only the rest', [febF.goals.emergency || 0, febF.goals.travel || 0, febF.spend], [0, 0, 2280]);

  // 4 + 5. phases suggested from capacity
  const keys = M.keyList('2026-12', 7), cap = {}; keys.forEach((k, i) => cap[k] = i < 2 ? 100 : 1000);
  eq('suggestPhases follows the raise', M.suggestPhases(3000, keys, cap), { phases: [{ from: '2026-12', to: '2027-01', amt: 60 }, { from: '2027-02', to: '2027-06', amt: 580 }], ok: true, shortfall: 0 });
  eq('suggestPhases when it can’t fit', M.suggestPhases(3000, ['2026-12', '2027-01'], { '2026-12': 100, '2027-01': 100 }), { phases: [{ from: '2026-12', to: '2027-01', amt: 100 }], ok: false, shortfall: 2800 });

  // 6. by monthly amount → finish month
  const st6 = base({ income: { salary: [{ from: null, amt: 3000 }], extras: [], over: {} }, subs: [], savePct: 0,
    saveCats: [cat('other'), cat('general'), cat('phone', { goal: true, kind: 'big', target: 1200, phases: [{ from: null, to: null, amt: 150 }] })], priority: ['phone'] });
  eq('solveFinish at S$150 a month', M.solveFinish(ctxFor(st6, '2026-11', { bal: { phone: 250 }, put: { phone: 50 } }), 'phone', [{ from: null, to: null, amt: 150 }]), '2027-05');

  // 7. debt maths
  const d1 = M.simDebt(3000, 24, 100), d2 = M.simDebt(3000, 24, 200);
  eq('simDebt S$100/mo', [d1.months, d1.interest, d1.last], [47, 1627.3, 27.3]);
  eq('simDebt S$200/mo', [d2.months, d2.interest], [19, 602.34]);
  near('interest saved by paying more', d1.interest - d2.interest, 1024.96);
  eq('simDebt that never ends', !!M.simDebt(3000, 24, 60).never, true);
  eq('simDebt at 0%', [M.simDebt(1000, 0, 150).months, M.simDebt(1000, 0, 150).interest], [7, 0]);

  // 8. behind: catch up vs move the date
  const st8 = base({ income: { salary: [{ from: null, amt: 3000 }], extras: [], over: {} }, subs: [], savePct: 0,
    saveCats: [cat('other'), cat('general'), cat('trip', { goal: true, kind: 'travel', target: 1200, date: '2027-04-30', phases: [{ from: '2026-12', to: '2027-04', amt: 150 }] })], priority: ['trip'] });
  const ctx8 = ctxFor(st8, '2026-12', { bal: { trip: 300 } }), run8 = M.forecast(ctx8), g8 = st8.saveCats[2], s8 = M.goalStatus(g8, run8, ctx8);
  eq('status is behind by S$150', [s8.s, s8.short], ['behind', 150]);
  const opt = M.behindOptions(g8, ctx8, s8);
  eq('catch up adds S$30 a month', opt.catchUp.add, 30);
  eq('or move the date a month', [opt.move.fin, opt.move.date], ['2027-05', '2027-05-30']);
  const runAhead = M.forecast(ctxFor(st8, '2026-12', { bal: { trip: 600 } }));
  eq('ahead when it finishes a month early', M.goalStatus(g8, runAhead, ctxFor(st8, '2026-12', { bal: { trip: 600 } })).s, 'ahead');

  // 9. emergency fund target
  eq('emergency target from 5 months', M.emergencyTarget(3, [1000, 1200, 900, 1100, 1300], 1100), 3300);
  eq('emergency target with 1 month of history', M.emergencyTarget(3, [1000], 1100), 3200);

  // 10. safe to spend allowances
  eq('day allowance', M.allowance(630, 10, 1, 19), { allow: 33.68, left: 23.68 });
  eq('week allowance', M.allowance(630, 60, 7, 22), { allow: 219.55, left: 159.55 });
  eq('month allowance', M.allowance(630, 270, 30, 30), { allow: 900, left: 630 });

  // 11. payday split adds up exactly
  const w = M.waterfall(3200, [320, 500, 333.33]);
  eq('payday split', [w.got, w.left], [[320, 500, 333.33], 2046.67]);
  near('payday split sums to the pay', M.sum(w.got) + w.left, 3200);

  // 12. migrating v4 settings
  const v4 = { v: 4, pay: 800, budget: { per: 'month', amt: 300 }, saveCats: [cat('other'), cat('general'),
    cat('emergency', { goal: true, target: 3000, date: '2027-06-30' }), cat('shanghai', { name: 'Shanghai trip', goal: true, target: 2500, date: '2027-03-31', aside: { amt: 50, per: 'week' } })], subs: [] };
  eq('migrate runs once', M.migrateV5(v4), true);
  const sh = v4.saveCats[3], em = v4.saveCats[2];
  eq('aside becomes a monthly phase', [sh.kind, sh.planBy, sh.monthly, sh.phases], ['travel', 'amount', 216.67, [{ from: null, to: null, amt: 216.67 }]]);
  eq('dated goal waits for suggested phases', [em.kind, em.planBy, em.phases, em.months, em.autoTarget], ['emergency', 'date', null, 3, false]);
  eq('priority: emergency first', v4.priority, ['emergency', 'shanghai']);
  eq('v5 fields', [v4.v, v4.savePct, v4.saveSplit, v4.spendFloor, v4.horizon, v4.income.salary], [5, 30, { general: 100 }, 300, 6, [{ from: null, amt: 800 }]]);
  eq('migrate again does nothing', M.migrateV5(v4), false);

  // 13. plan month keys
  eq('planKey with month start 25', [M.keyOfDate('2026-11-12', 25), M.keyOfDate('2026-11-26', 25)], ['2026-11', '2026-12']);
  eq('periodOfKey with month start 25', M.periodOfKey('2026-12', 25), { start: '2026-11-25', end: '2026-12-24' });
  eq('periodOfKey with month start 1', M.periodOfKey('2027-02', 1), { start: '2027-02-01', end: '2027-02-28' });

  // extra: extras scenario — counted half, half of that to goals
  const stX = base({ income: { salary: [{ from: null, amt: 3200 }], extras: [{ id: 'x1', month: '2027-02', name: 'Bonus', amt: 1000, count: true, share: 0.5, alloc: { goalPct: 50, goals: 'priority', rest: 'spend' } }], over: {} } });
  const both = M.forecastBoth(ctxFor(stX, '2027-01')), fs = both.salary.months[1], fx = both.extras.months[1];
  eq('salary scenario ignores extras', [fs.inc.ext, fs.inc.extFull, fs.extra], [0, 1000, {}]);
  eq('extras scenario: 250 to goals, 250 to spend', [fx.inc.ext, fx.extra.emergency, fx.extra.spend, r2(fx.spend - fs.spend)], [500, 250, 250, 250]);

  // extra: debt inside the forecast
  const stD = base({ income: { salary: [{ from: null, amt: 3000 }], extras: [], over: {} }, subs: [], savePct: 0,
    saveCats: [cat('other'), cat('general'), cat('card', { goal: true, kind: 'debt', debt: { bal: 3000, apr: 24, min: 100, asOf: '2026-11-01' }, phases: [] })], priority: ['card'] });
  const fin0 = M.forecast({ ...ctxFor(stD, '2026-11'), months: 120 }).finish.card;
  const fin1 = M.solveFinish(ctxFor(stD, '2026-11'), 'card', [{ from: null, to: null, amt: 100 }]);
  eq('debt on minimums pays off in ~4 years', M.keyDiff('2026-11', fin0) >= 44 && M.keyDiff('2026-11', fin0) <= 48, true);
  eq('extra S$100 pays it off much sooner', M.keyDiff('2026-11', fin1) >= 17 && M.keyDiff('2026-11', fin1) <= 20, true);
  const pd = M.planByDate(ctxFor(stD, '2026-11'), 'card', '2027-10');
  eq('debt by date finds a level extra payment', pd.phases.length === 1 && M.solveFinish(ctxFor(stD, '2026-11'), 'card', pd.phases) <= '2027-10', true);

  // extra: what's owed now
  eq('debtOwed adds interest and takes payments', M.debtOwed({ bal: 1000, apr: 12, asOf: '2026-10-15' }, [{ d: '2026-11-20', amt: 100 }], '2026-12', 1), 919.1);

  // extra: phase checks and grouping
  eq('overlapping phases are flagged', M.checkPhases([{ from: '2027-01', to: '2027-03', amt: 100 }, { from: '2027-03', to: '2027-05', amt: 50 }]).map(e => e.i), [1]);
  eq('groupPhases keeps the end open', M.groupPhases(['2027-01', '2027-02', '2027-03'], [100, 100, 100], true), [{ from: '2027-01', to: null, amt: 100 }]);

  // extra: bills from a savings category reduce that pot, and daily bills over a long run are all counted
  const stB = base({ subs: [{ id: 'ins', kind: 'bill', name: 'Insurance', amount: 30, cycle: 'monthly', next: '2027-01-10', day: 10, from: 'general' }, { id: 'cf', kind: 'sub', name: 'Coffee', amount: 1, cycle: 'daily', next: '2027-01-01', from: 'spend' }] });
  const bk = M.billsByKey(stB, '2027-01', '2029-12');
  eq('bills by month', [bk['2027-01'].spend, bk['2027-01'].cats.general, bk['2029-12'].spend], [31, 30, 31]);
} catch (e) { fail++; lines.push(`<pre class="bad">✗ crashed: ${e && e.stack || e}</pre>`); }
function r2(n) { return Math.round((+n + Number.EPSILON) * 100) / 100; }
out.innerHTML = `<p class="${fail ? 'bad' : 'ok'}">${fail ? `${fail} failed, ${pass} passed` : `All ${pass} passed`}</p>` + lines.join('');
document.title = fail ? `FAIL ${fail} of ${pass + fail}` : `PASS ${pass}`;
})();

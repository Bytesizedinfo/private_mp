/* ---------- example data (outside claude.ai, or "Explore with example data"; never saved) ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function demoData() {
  const s = defaultSettings(); s.onboarded = true; s.review = false;
  S.settings = s;
  const cur = Money.planKey(periodAt(0), 1), alloc = gp => ({ goalPct: gp, goals: 'priority', rest: 'spend' });
  s.income = { salary: [{ from: null, amt: 800 }, { from: Money.keyAdd(cur, 3), amt: 3200 }], payDay: 1, over: {}, extras: [
    { id: 'x1', month: Money.keyAdd(cur, 2), name: 'Ang bao', cat: 'gifts', amt: 400, count: true, share: 0.5, alloc: alloc(50) },
    { id: 'x2', month: Money.keyAdd(cur, 5), name: 'Year-end bonus', cat: 'side', amt: 2000, count: true, share: 0.5, alloc: alloc(70) }] };
  Object.assign(s, { savePct: 15, saveSplit: { general: 100 }, spendFloor: 250, extraGoalPct: 50, horizon: 6 });
  const cat = id => s.saveCats.find(c => c.id === id);
  Object.assign(cat('emergency'), { start: 200, goal: true, kind: 'emergency', months: 6, autoTarget: true, planBy: 'amount', monthly: 60, phases: [{ from: null, to: null, amt: 60 }] });
  Object.assign(cat('shanghai'), { start: 300, target: 2500, goal: true, kind: 'travel', date: periodAt(6).end, planBy: 'date', phases: null });
  Object.assign(cat('invest'), { planBy: 'amount', monthly: 40, phases: [{ from: null, to: null, amt: 40 }] });
  s.saveCats.push({ id: 'card', name: 'Credit card', color: 1, start: 0, target: 0, goal: true, kind: 'debt', debt: { bal: 1250, apr: 26, min: 50, asOf: periodAt(-1).start, orig: 1600 }, planBy: 'amount', monthly: 100, phases: [{ from: null, to: null, amt: 50 }] });
  s.saveCats.push({ id: 'phone', name: 'New phone', color: 4, start: 0, target: 1200, goal: true, kind: 'big', date: periodAt(9).end, planBy: 'amount', monthly: 100, phases: [{ from: null, to: null, amt: 100 }] });
  s.priority = ['emergency', 'card', 'shanghai', 'phone', 'invest'];
  s.labels.find(l => l.id === 'food').plan = 160; s.labels.find(l => l.id === 'transport').plan = 50;
  s.incomeSplits = { side: { pct: { other: 50, spend: 25, shanghai: 25 } } };
  const spot = addDays(today(), 3), phone = addDays(today(), 6);
  s.subs = [
    { id: 's1', kind: 'sub', name: 'Spotify', amount: 10.98, cycle: 'monthly', next: spot, day: parts(spot)[2], label: 'subs', from: 'spend' },
    { id: 'b1', kind: 'bill', name: 'Phone plan', amount: 20, cycle: 'monthly', next: phone, day: parts(phone)[2], label: 'bills', from: 'spend' },
  ];
  const R = rng(5), months = {}; let n = 0;
  const push = t => { t.id = 'demo' + (n++).toString(36).padStart(5, '0'); (months[monthKey(t.d)] ||= { tx: [] }).tx.push(t); };
  const pick = a => a[Math.floor(R() * a.length)], amt = (lo, hi) => r2(lo + R() * (hi - lo));
  const food = ['Kopitiam', 'Chicken rice', 'Bubble tea', 'Toast Box', 'Mala', 'Ya Kun'];
  for (let off = -5; off <= 0; off++) {
    const p = periodAt(off), last = off === 0 ? today() : p.end;
    if (off < 0) push({ d: p.start, t: 'in', src: 'pay', cat: 'salary', amt: 800, spend: off === 0 ? 470 : 330, save: off === 0 ? { general: 120, emergency: 60, phone: 100, invest: 50 } : off >= -2 ? { general: 120, emergency: 100, phone: 100, shanghai: 100, invest: 50 } : { other: 470 }, note: '' });
    if (off < -2) { const sortDay = addDays(p.start, 2); push({ d: sortDay, t: 'move', amt: 250, from: 'other', to: 'emergency', note: '' }); push({ d: sortDay, t: 'move', amt: 150, from: 'other', to: 'shanghai', note: '' }); push({ d: sortDay, t: 'move', amt: 70, from: 'other', to: 'general', note: '' }); }
    if (off === -1) { push({ d: addDays(p.start, 12), t: 'in', src: 'other', cat: 'side', amt: 120, spend: 30, save: { other: 60, shanghai: 30 }, note: 'Tuition' }); push({ d: addDays(p.start, 19), t: 'out', amt: 100, label: 'bills', from: 'spend', note: 'Payment · Credit card', debt: 'card' }); }
    for (let d = p.start; d <= last; d = addDays(d, 1)) {
      if (R() < 0.45) push({ d, t: 'out', amt: amt(3.5, 9), label: 'food', from: 'spend', note: pick(food) });
      if (R() < 0.3) push({ d, t: 'out', amt: amt(1.2, 3.2), label: 'transport', from: 'spend', note: 'MRT/bus' });
      if (R() < 0.04) push({ d, t: 'out', amt: amt(8, 30), label: 'shopping', from: 'spend', note: pick(['Shopee', 'Daiso', 'Uniqlo']) });
      if (R() < 0.03) push({ d, t: 'out', amt: amt(10, 25), label: 'fun', from: 'spend', note: pick(['Movie', 'Karaoke']) });
      if (d < today() && parts(d)[2] === s.subs[0].day) push({ d, t: 'out', amt: 10.98, label: 'subs', from: 'spend', note: 'Spotify', bill: 's1' });
      if (d < today() && parts(d)[2] === s.subs[1].day) push({ d, t: 'out', amt: 20, label: 'bills', from: 'spend', note: 'Phone plan', bill: 'b1' });
    }
    if (off === -2) push({ d: addDays(p.start, 18), t: 'out', amt: 95, label: 'shopping', from: 'spend', note: 'New shoes' });
  }
  return { settings: s, months };
}

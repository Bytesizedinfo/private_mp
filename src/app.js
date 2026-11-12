
/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newId = (p = 't') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const stable = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const r2 = n => Math.round((+n + Number.EPSILON) * 100) / 100;
const sum = a => a.reduce((x, y) => x + (+y || 0), 0);
const parseMoney = v => { if (typeof v === 'number') return v; const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON = MONTHS.map(m => m.slice(0, 3));
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pad = n => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const parts = s => s.split('-').map(Number);
const toDate = s => { const [y, m, d] = parts(s); return new Date(y, m - 1, d); };
const fromDate = dt => ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
const today = () => fromDate(new Date());
const daysIn = (y, m) => new Date(y, m, 0).getDate();
const addDays = (s, n) => { const dt = toDate(s); dt.setDate(dt.getDate() + n); return fromDate(dt); };
const addMonths = (s, n) => { let [y, m, d] = parts(s); m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return ymd(y, m, Math.min(d, daysIn(y, m))); };
const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
const fmtD = s => { const [, m, d] = parts(s); return `${d} ${MON[m - 1]}`; };
const fmtDY = s => { const [y, m, d] = parts(s); return `${d} ${MON[m - 1]} ${y}`; };
const fmtDay = s => { const t = today(); if (s === t) return 'Today'; if (s === addDays(t, -1)) return 'Yesterday'; return `${DOW[toDate(s).getDay()]}, ${fmtD(s)}`; };
const monthKey = s => 'm-' + s.slice(0, 7);
const ordinal = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const nf2 = new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 });
const sym = () => (S.settings && S.settings.symbol) || 'S$';
function money(n, o = {}) { n = +n || 0; const neg = n < -0.004, a = Math.abs(n); return (neg ? '−' : (o.sign && a > 0.004 ? '+' : '')) + sym() + (o.dp === 0 ? nf0.format(Math.round(a)) : nf2.format(a)); }
const mw = (n, o = {}) => money(n, { ...o, dp: Math.abs(n % 1) < 0.005 ? 0 : 2 });
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

const I = {
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>',
  over: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.3v.1"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  chevUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  chevDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
};

/* ---------- state ---------- */
const S = {
  mode: 'loading', why: '', db: null, uid: null, settings: null, months: {}, tx: [], sweeps: [],
  view: 'home', offset: 0, bdOpen: lsGet('spend-save:bdOpen') === '1', planTab: 'spend', obHave: 0, savAll: false, homeBud: lsGet('spend-save:homeBud'), availPer: lsGet('spend-save:availPer'),
  ins: { kind: ['day', 'week', 'month', 'year', 'all', 'custom'].includes(lsGet('spend-save:insKind')) ? lsGet('spend-save:insKind') : 'month', off: 0, from: '', to: '' },
  f: { q: '', types: [], where: 'all', label: 'all', range: 'month', from: '', to: '', limit: 150 },
  labelPeriod: ['day', 'week', 'month'].includes(lsGet('spend-save:labelPeriod')) ? lsGet('spend-save:labelPeriod') : 'month',
  saveView: lsGet('spend-save:saveView') === 'month' ? 'month' : 'total',
  draft: null, slow: false, readOnly: false, pendingRender: false, local: false, noStore: false,
  rev: 0, plan: null, safeK: lsGet('spend-save:safeK'), fcTab: 'ahead', fcMonth: null, moreTab: 'activity', setupDraft: null,
};

/* Data model (stored in data/users/<id>/: "settings" and one "m-YYYY-MM" per month):
   in   { amt, src:'pay'|'other', spend, save:{catId:amt} }   money arriving
   out  { amt, label, from:'spend'|catId }                    spending, labelled
   move { amt, from, to }                                      'spend' or a savings subcategory at either end
   Each month's unspent Spending (or overspend) lands in Savings → Other on the first day of the next month.
   That is worked out from the entries, never stored, so editing an old expense updates it.
   An expense's label is optional ('' = Uncategorised). Money in is never split for you: pay and other money go
   wherever you pick. settings.budget { per:'week'|'month'|'year', amt } is the spending budget as typed;
   split.spend mirrors its monthly amount. */
function defaultSettings() {
  return {
    v: 5, symbol: 'S$', monthStart: 1, pay: 800, split: { spend: 200 }, budget: { per: 'month', amt: 200 }, incomeCats: defaultIncomeCats(),
    labels: [
      { id: 'food', name: 'Food & drinks', color: 0 }, { id: 'transport', name: 'Transport', color: 6 },
      { id: 'shopping', name: 'Shopping', color: 1 }, { id: 'fun', name: 'Fun & social', color: 4 },
      { id: 'personal', name: 'Personal care', color: 5 }, { id: 'subs', name: 'Subscriptions', color: 3 },
      { id: 'bills', name: 'Bills', color: 7 }, { id: 'other', name: 'Other', color: 8 },
    ],
    saveCats: [
      { id: 'other', name: 'Other', color: 6, start: 0, target: 0 },
      { id: 'shanghai', name: 'Shanghai trip', color: 2, start: 0, target: 0 },
      { id: 'emergency', name: 'Emergency fund', color: 0, start: 0, target: 0 },
      { id: 'general', name: 'General savings', color: 5, start: 0, target: 0 },
      { id: 'invest', name: 'Investments', color: 3, start: 0, target: 0 },
    ],
    subs: [], onboarded: false,
    income: { salary: [{ from: null, amt: 800 }], payDay: null, extras: [], over: {} }, savePct: 30, saveSplit: { general: 100 }, extraGoalPct: 50, spendFloor: 200, horizon: 6, priority: [], review: true,
  };
}
function defaultIncomeCats() { return [{ id: 'salary', name: 'Salary', color: 0 }, { id: 'side', name: 'Side income', color: 2 }, { id: 'family', name: 'Allowance / family', color: 4 }, { id: 'gifts', name: 'Gifts & ang bao', color: 1 }]; }
/* v2 adds a "Bills" spending category once; v3 adds income categories once. Deleting them later is respected. */
function migrate(s) {
  let changed = false;
  if ((s.v || 1) < 2) {
    if (!s.labels.some(l => l.id === 'bills')) { const i = s.labels.findIndex(l => l.id === 'other'); s.labels.splice(i < 0 ? s.labels.length : i, 0, { id: 'bills', name: 'Bills', color: 7 }); }
    s.v = 2; changed = true;
  }
  if (s.v < 3) { if (!Array.isArray(s.incomeCats)) s.incomeCats = defaultIncomeCats(); s.v = 3; changed = true; }
  // v4: the spending budget. Overwrite: stored settings are merged over defaults, which carry a placeholder budget.
  if (s.v < 4) { s.budget = { per: 'month', amt: +(s.split && s.split.spend) || 0 }; s.v = 4; changed = true; }
  if (s.v < 5) { Money.migrateV5(s); changed = true; } // v5: salary plan, savings %, goal phases and priorities
  return changed;
}
const NOINCOME = { id: '_other', name: 'Other income', color: 8 };
const incomeCat = t => { const id = t.cat || (t.src === 'pay' ? 'salary' : null); return (S.settings.incomeCats || []).find(c => c.id === id) || NOINCOME; };
const activeGoals = () => S.settings.saveCats.filter(c => c.goal && !c.done);
const doneGoals = () => S.settings.saveCats.filter(c => c.goal && c.done);
const NOLABEL = { id: '_none', name: 'Uncategorised', color: 8 };
const NOCAT = { id: '_gone', name: 'Removed category', color: 6, start: 0, target: 0 };
const label = id => S.settings.labels.find(l => l.id === id) || NOLABEL;
const saveCat = id => S.settings.saveCats.find(c => c.id === id) || NOCAT;
const whereName = id => id === 'spend' ? 'Spending' : saveCat(id).name;
const labelKnown = id => S.settings.labels.some(l => l.id === id);
function otherCat() { const s = S.settings; let o = s.saveCats.find(c => c.id === 'other'); if (!o) { o = { id: 'other', name: 'Other', color: 6, start: 0, target: 0 }; s.saveCats.unshift(o); } return o; }

/* Spending budget: one amount, shown per week, month and year (a week is 12/52 of a month). */
const BUD_PERS = ['week', 'month', 'year'];
function budgetFrom(per, a) { a = Math.max(0, +a || 0); const month = per === 'week' ? a * 52 / 12 : per === 'year' ? a / 12 : a, year = per === 'year' ? a : month * 12; return { week: per === 'week' ? a : month * 12 / 52, month, year, day: year / 365 }; }
function budgetNow(s = S.settings) { const b = s && s.budget && BUD_PERS.includes(s.budget.per) ? s.budget : { per: 'month', amt: +(s && s.split && s.split.spend) || 0 }; return budgetFrom(b.per, b.amt); }
function setBudget(per, amt) { const s = S.settings, a = r2(Math.max(0, +amt || 0)); s.budget = { per, amt: a }; s.split = { ...s.split, spend: r2(budgetFrom(per, a).month) }; }
const firstSorted = () => (S.settings.saveCats.find(c => c.id !== 'other') || S.settings.saveCats[0]).id;

function allTx() { const out = []; for (const k in S.months) for (const t of (S.months[k].tx || [])) out.push(t); out.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : (a.id < b.id ? 1 : -1)); return out; }

/* ---------- periods ---------- */
function periodLabel(start, end) { const s = S.settings?.monthStart || 1; if (s === 1) { const [y, m] = parts(start); return `${MONTHS[m - 1]} ${y}`; } return `${fmtD(start)} – ${fmtD(end)} ${parts(end)[0]}`; }
function shortLabel(p) { const s = S.settings?.monthStart || 1; const [, sm] = parts(p.start), [, em] = parts(p.end); return MON[(s <= 15 ? sm : em) - 1]; }
function mkPeriod(start) { const end = addDays(addMonths(start, 1), -1); return { start, end, days: diffDays(start, end) + 1, label: periodLabel(start, end) }; }
function periodFor(ds) { const s = S.settings?.monthStart || 1; let [y, m, d] = parts(ds); if (d < s) { m--; if (m < 1) { m = 12; y--; } } return mkPeriod(ymd(y, m, s)); }
function periodAt(off) { const p = periodFor(today()); return off ? mkPeriod(addMonths(p.start, off)) : p; }
const monthName = p => MONTHS[parts(p.start)[1] - 1];
const PER_LABEL = { day: 'a day', week: 'a week', month: 'a month', year: 'a year' };
const PER_NAME = { day: 'Today', week: 'Week', month: 'Month', year: 'Year' };
const weekStart = ds => addDays(ds, -((toDate(ds).getDay() + 6) % 7));
function rangeFor(kind, ds = today()) {
  if (kind === 'day') return { kind, start: ds, end: ds, days: 1 };
  if (kind === 'week') { const s = weekStart(ds); return { kind, start: s, end: addDays(s, 6), days: 7 }; }
  if (kind === 'year') { const y = parts(ds)[0], s = `${y}-01-01`, e = `${y}-12-31`; return { kind, start: s, end: e, days: diffDays(s, e) + 1, label: String(y) }; }
  const p = periodFor(ds); return { kind, start: p.start, end: p.end, days: p.days, label: p.label };
}
function shiftRange(r, n) { return r.kind === 'day' ? rangeFor('day', addDays(r.start, n)) : r.kind === 'week' ? rangeFor('week', addDays(r.start, 7 * n)) : r.kind === 'year' ? rangeFor('year', addMonths(r.start, 12 * n)) : rangeFor('month', addMonths(r.start, n)); }
const isNow = r => r.start <= today() && today() <= r.end;
function rangeLabel(r) { if (r.kind === 'day') return isNow(r) ? `Today, ${fmtD(r.start)}` : fmtDay(r.start); if (r.kind === 'week') return `${isNow(r) ? 'This week · ' : ''}${fmtD(r.start)} – ${fmtD(r.end)}`; if (r.kind === 'year') return `${isNow(r) ? 'This year · ' : ''}${r.label}`; return r.label; }
function periodWord(r) { if (isNow(r)) return r.kind === 'day' ? 'today' : r.kind === 'week' ? 'this week' : r.kind === 'year' ? 'this year' : 'this month'; return r.kind === 'day' ? `on ${fmtD(r.start)}` : r.kind === 'week' ? 'that week' : r.kind === 'year' ? `in ${r.label}` : 'that month'; }

/* ---------- money maths ---------- */
/* A money-in entry's Spending part can be meant for the next month (`for: 'YYYY-MM'`), e.g. a 26 Oct pay you live
   on in November. Its Spending then counts in that month; the money in and any savings still count on the date it came. */
const inSpendDay = t => t.for ? `${t.for}-${pad((S.settings && S.settings.monthStart) || 1)}` : t.d;
const forName = key => MONTHS[+key.slice(5, 7) - 1];
/* Month end: by default ('carry') whatever a month doesn't spend, or overspends, stays in Spending and carries into
   the next month; nothing moves to or from savings by itself. monthEnd 'savings' is the old way: leftovers go to
   Savings → Other and overspending comes out of it (the "sweep" lines). */
const carryOn = () => !S.settings || S.settings.monthEnd !== 'savings';
function spendMonth(p) {
  let added = 0, spent = 0, out = 0, carry = 0; const cr = carryOn();
  for (const t of S.tx) {
    const d = t.t === 'in' ? inSpendDay(t) : t.d;
    if (d > p.end) continue;
    const before = d < p.start; if (before && !cr) continue;
    let a = 0, s = 0, o = 0;
    if (t.t === 'in') a = +(t.spend || 0);
    else if (t.t === 'out' && t.from === 'spend') s = t.amt;
    else if (t.t === 'move' && !t.via) { if (t.to === 'spend') a = t.amt; if (t.from === 'spend') o = t.amt; } // a move with `via` is a record: its money-in entry already changed
    if (before) carry += a - s - o; else { added += a; spent += s; out += o; }
  }
  return { added: r2(added), spent: r2(spent), out: r2(out), carry: r2(carry), left: r2(carry + added - spent - out) };
}
function computeSweeps() {
  if (carryOn() || !S.tx.length) return [];
  const first = S.tx.reduce((m, t) => t.d < m ? t.d : m, '9999-12-31'), cur = periodAt(0), out = [];
  for (let p = periodFor(first); p.start < cur.start; p = mkPeriod(addMonths(p.start, 1))) {
    const m = spendMonth(p);
    if (Math.abs(m.left) > 0.004) out.push({ id: 'sweep-' + p.start, t: 'sweep', d: addDays(p.end, 1), amt: m.left, p });
  }
  return out;
}
function saveEffect(t, id) {
  if (t.t === 'in') return +(t.save?.[id] || 0);
  if (t.t === 'out') return t.from === id ? -t.amt : 0;
  if (t.t === 'move') return t.via ? 0 : (t.to === id ? t.amt : 0) - (t.from === id ? t.amt : 0);
  return 0;
}
function saveBal(id, until) {
  let b = +(saveCat(id).start || 0);
  for (const t of S.tx) if (!until || t.d <= until) b += saveEffect(t, id);
  if (id === 'other') for (const s of S.sweeps) if (!until || s.d <= until) b += s.amt;
  return r2(b);
}
function saveMonth(id, p) {
  let inn = 0, out = 0;
  for (const t of S.tx) { if (t.d < p.start || t.d > p.end) continue; const e = saveEffect(t, id); if (e > 0) inn += e; else out -= e; }
  if (id === 'other') for (const s of S.sweeps) if (s.d >= p.start && s.d <= p.end) { if (s.amt > 0) inn += s.amt; else out -= s.amt; }
  return { inn: r2(inn), out: r2(out), net: r2(inn - out) };
}
const totalSaved = until => r2(sum(S.settings.saveCats.map(c => saveBal(c.id, until))));
function stats(p) {
  const tx = S.tx.filter(t => t.d >= p.start && t.d <= p.end);
  let inn = 0, spent = 0, fromSave = 0; const byLabel = {};
  for (const t of tx) {
    if (t.t === 'in') inn += t.amt;
    if (t.t === 'out') { spent += t.amt; const k = labelKnown(t.label) ? t.label : NOLABEL.id; byLabel[k] = (byLabel[k] || 0) + t.amt; if (t.from !== 'spend') fromSave += t.amt; }
  }
  const flows = saveFlows(p);
  return { tx, inn: r2(inn), spent: r2(spent), fromSave: r2(fromSave), byLabel, flows, saved: flows.saved };
}
/* Where money in savings came from in a date range. Money you put into savings counts as "saved": from pay,
   other money in, or moved over from Spending. Spending left over at month end moves across by itself and
   isn't counted; moves between savings categories aren't either. Money taken out is reported separately. */
function saveFlows(p) {
  let pay = 0, otherIn = 0, fromSpend = 0, takenOut = 0;
  for (const t of S.tx) {
    if (t.d < p.start || t.d > p.end) continue;
    if (t.t === 'in') { const v = sum(Object.values(t.save || {})); if (t.src === 'pay') pay += v; else otherIn += v; }
    else if (t.t === 'move' && !t.via) { if (t.from === 'spend' && t.to !== 'spend') fromSpend += t.amt; else if (t.to === 'spend' && t.from !== 'spend') takenOut += t.amt; }
    else if (t.t === 'out' && t.from !== 'spend') takenOut += t.amt;
  }
  const leftover = sum(S.sweeps.filter(s => s.d >= p.start && s.d <= p.end).map(s => s.amt));
  return { pay: r2(pay), otherIn: r2(otherIn), fromSpend: r2(fromSpend), saved: r2(pay + otherIn + fromSpend), leftover: r2(leftover), takenOut: r2(takenOut) };
}
const payFor = p => S.tx.some(t => t.t === 'in' && t.src === 'pay' && inSpendDay(t) >= p.start && inSpendDay(t) <= p.end);
function labelSpent(id, r) { let s = 0; for (const t of S.tx) if (t.t === 'out' && t.label === id && t.d >= r.start && t.d <= r.end) s += t.amt; return r2(s); }
function labelSpentFromSpend(id, r) { let s = 0; for (const t of S.tx) if (t.t === 'out' && t.from === 'spend' && t.label === id && t.d >= r.start && t.d <= r.end) s += t.amt; return r2(s); }

/* Planned spending: what's still to come of each category's monthly plan. A bill still due in the same
   category already covers part of the plan, so only the rest is counted (no double counting). */
function plannedAhead(p, ahead) {
  const billBy = {};
  for (const o of ahead.list) { const lab = S.settings.labels.some(l => l.id === o.x.label) ? o.x.label : defaultBillLabel(o.x.kind); billBy[lab] = (billBy[lab] || 0) + o.x.amount; }
  const list = [];
  for (const l of S.settings.labels) { const plan = +l.plan || 0; if (!plan) continue; const spent = labelSpentFromSpend(l.id, p), left = r2(Math.max(0, plan - spent - (billBy[l.id] || 0))); list.push({ l, plan, spent, left }); }
  return { list, total: r2(sum(list.map(x => x.left))) };
}


/* ---------- persistence ----------
   Inside claude.ai: the viewer's private db subtree, which follows the account to any device.
   As a standalone website (built with data-standalone="1"): this browser's localStorage only. */
const STANDALONE = document.documentElement.dataset.standalone === '1';
const LKEY = 'spend-save:v1';
const dirty = new Set(), chains = {};
const canWrite = () => S.mode === 'live' && !S.readOnly && (S.local || (S.db && S.uid));
let localTimer = null;
function saveLocal() {
  localTimer = null;
  try { localStorage.setItem(LKEY, JSON.stringify({ v: 1, saved: new Date().toISOString(), settings: S.settings, months: S.months })); }
  catch (e) { toast('This browser didn’t save that change. Private browsing can block saving.', 'over', 6000); }
}
window.addEventListener('pagehide', () => { if (localTimer) { clearTimeout(localTimer); saveLocal(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && localTimer) { clearTimeout(localTimer); saveLocal(); } });
function persist(id) {
  if (!canWrite()) return;
  if (S.local) { clearTimeout(localTimer); localTimer = setTimeout(saveLocal, 150); return; }
  if (dirty.has(id)) return; dirty.add(id); chains[id] = (chains[id] || Promise.resolve()).then(() => writeDoc(id, 0));
}
async function writeDoc(id, attempt) {
  dirty.delete(id);
  const body = id === 'settings' ? S.settings : S.months[id], ref = S.db.doc(`data/users/${S.uid}/${id}`);
  try { if (!body || (id !== 'settings' && !(body.tx || []).length)) await ref.delete(); else await ref.set(clone(body)); }
  catch (e) {
    const code = e && e.code;
    if ((code === 'unavailable' || code === 'resource_exhausted') && attempt === 0) { await new Promise(r => setTimeout(r, 600 + Math.random() * 900)); if (!dirty.has(id)) return writeDoc(id, 1); return; }
    if (code === 'quota_exceeded') toast('Your saved data is full. Download a backup and delete old months to free space.', 'over', 6000);
    else if (code === 'invalid_argument') { S.readOnly = true; toast('This view can’t save changes. Open the page from your own claude.ai account.', 'over', 6000); }
    else if (code === 'revoked') toast('Saving stopped because access to this page changed.', 'over', 6000);
    else toast('That change didn’t save. Check your connection and try again.', 'over', 5000);
  }
}
const ensureMonth = k => (S.months[k] ||= { tx: [] });
function addTx(list) { const touched = new Set(); for (const t of list) { ensureMonth(monthKey(t.d)).tx.push(t); touched.add(monthKey(t.d)); } touched.forEach(persist); refresh(); }
function findTx(id) { for (const k in S.months) { const i = S.months[k].tx.findIndex(t => t.id === id); if (i >= 0) return { k, i, t: S.months[k].tx[i] }; } return null; }
function removeTx(ids) { const touched = new Set(); for (const id of ids) { const f = findTx(id); if (f) { S.months[f.k].tx.splice(f.i, 1); touched.add(f.k); } } touched.forEach(persist); refresh(); }
function replaceTx(id, next) { const f = findTx(id); if (!f) return addTx([next]); S.months[f.k].tx.splice(f.i, 1); ensureMonth(monthKey(next.d)).tx.push(next); persist(f.k); persist(monthKey(next.d)); refresh(); }
function saveSettings(rerender = true) { persist('settings'); if (rerender) refresh(); }
/* Moving money can change the money-in entry it came from: `portion` is how much of an entry sits in a place
   ('spend' or a savings category), and shiftIn moves part of it to another place, saving that entry's month.
   The move itself is then kept as a record-only line with `via` = the entry's id. */
const portion = (t, place) => place === 'spend' ? +(t.spend || 0) : +((t.save || {})[place] || 0);
function setPortion(t, place, v) { v = r2(v); if (place === 'spend') t.spend = Math.max(0, v); else { t.save = { ...(t.save || {}) }; if (v > 0.004) t.save[place] = v; else delete t.save[place]; } }
function shiftIn(id, from, to, amt) {
  const f = findTx(id); if (!f || f.t.t !== 'in' || portion(f.t, from) < amt - 0.004) return false;
  setPortion(f.t, from, portion(f.t, from) - amt); setPortion(f.t, to, portion(f.t, to) + amt); persist(f.k); return true;
}
/* money-in entries a move can come out of: dated on or before the move, with money in `from`; Spending money
   belongs to its month, so if Spending is either end only that month's entries count. Newest first. */
function viaChoices(V, existing) {
  const per = periodFor(V.d), spendSide = V.from === 'spend' || V.to === 'spend';
  return S.tx.filter(t => t.t === 'in' && t.d <= V.d && (!spendSide || (inSpendDay(t) >= per.start && inSpendDay(t) <= per.end)))
    .map(t => { let a = portion(t, V.from); if (existing && existing.via === t.id) a += (existing.from === V.from ? existing.amt : 0) - (existing.to === V.from ? existing.amt : 0); return { t, avail: r2(a) }; })
    .filter(x => x.avail > 0.004);
}
const inName = t => `${incomeCat(t).name}${t.note ? ` · ${t.note}` : ''} · ${fmtD(t.d)}`;

/* ---------- boot ---------- */
async function boot() {
  $('#top-date').textContent = `${DOW[new Date().getDay()]}, ${fmtD(today())}`;
  route(); renderView();
  if (STANDALONE) return startLocal();
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return startDemo('outside');
  let db = null, user = null;
  try { [db, user] = await Promise.all([c.use('db'), c.use('user')]); } catch (e) {}
  if (!db || !user) return startDemo('nodb');
  const id = await user.id();
  if (!id) return startDemo('signedout');
  S.db = db; S.uid = id;
  const timer = setTimeout(() => { S.slow = true; if (S.mode === 'loading') renderView(); else toast('This may be out of date. Still trying to reach your saved data.', 'warn', 5000); }, 10000);
  db.collection(`data/users/${id}`).onSnapshot(snap => {
    let changed = false;
    for (const d of snap.docs) {
      if (dirty.has(d.id)) continue;
      const inc = d.data();
      if (d.id === 'settings') { if (stable(inc) !== stable(S.settings)) { S.settings = Object.assign(defaultSettings(), clone(inc)); changed = true; } }
      else if (d.id.startsWith('m-')) { if (stable(inc) !== stable(S.months[d.id])) { S.months[d.id] = clone(inc); changed = true; } }
    }
    const present = new Set(snap.docs.map(d => d.id));
    for (const k of Object.keys(S.months)) if (!present.has(k) && !dirty.has(k)) { delete S.months[k]; changed = true; }
    if (!present.has('settings') && !dirty.has('settings') && S.mode === 'live') { S.settings = null; changed = true; }
    if (!snap.metadata.fromCache) { clearTimeout(timer); S.slow = false; }
    if (S.settings && S.settings.onboarded) { if (S.mode !== 'live') { S.mode = 'live'; changed = true; } if (migrate(S.settings)) { persist('settings'); changed = true; } if (changed) refresh(); }
    else if (!snap.metadata.fromCache || snap.size) { if (S.mode !== 'onboard' && S.why !== 'try') { S.mode = 'onboard'; S.draft = defaultSettings(); renderView(); } }
  }, err => {
    clearTimeout(timer);
    if (S.mode === 'live') toast('Live updates stopped. Reload the page to reconnect.', 'warn', 6000);
    else { S.mode = 'error'; S.why = err && err.code; renderView(); }
  });
}
function startLocal() {
  S.local = true; let data = null;
  try { localStorage.setItem(LKEY + ':test', '1'); localStorage.removeItem(LKEY + ':test'); data = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) { S.noStore = true; }
  S.months = (data && data.months) || {};
  if (data && data.settings && data.settings.onboarded) { S.settings = Object.assign(defaultSettings(), data.settings); S.mode = 'live'; if (migrate(S.settings)) persist('settings'); refresh(); }
  else { S.mode = 'onboard'; S.draft = defaultSettings(); renderView(); }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {}
}
const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function localBanners() {
  if (!S.local) return '';
  if (S.noStore) return `<div class="warnbox">${I.warn}<span>This browser is blocking saving, so changes will be lost when you close it. Turn off private browsing and open the page again.</span></div>`;
  if (isInstalled() || lsGet(LKEY + ':hide-install') === '1') return '';
  return `<div class="banner"><b>Add Spend &amp; Save to your Home Screen.</b> It opens like an app and keeps your data safe. iPhone: tap Share, then Add to Home Screen. Android: tap the menu, then Install app. <button class="linkbtn" data-act="hide-install">Got it</button></div>`;
}
function startDemo(why) { S.mode = 'demo'; S.why = why; const d = demoData(); S.settings = d.settings; S.months = d.months; refresh(); }


/* ---------- routing & render ---------- */
const VIEWS = ['home', 'goals', 'forecast', 'more'];
const TITLES = { home: 'Spend & Save', goals: 'Goals', forecast: 'Forecast', more: 'More' };
const ALIAS = { activity: ['more', 'activity'], plan: ['more', 'plan'], insights: ['forecast', 'past'] };
function route() {
  const h = location.hash.replace('#', '');
  if (ALIAS[h]) { const [v, sub] = ALIAS[h]; S.view = v; if (v === 'more') S.moreTab = sub; else S.fcTab = sub; return; }
  S.view = VIEWS.includes(h) ? h : 'home';
}
window.addEventListener('hashchange', () => { closeSheet(); route(); renderView(); window.scrollTo(0, 0); });
function isEditingMain() { const a = document.activeElement; return a && a.closest && a.closest('#view') && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName); }
function recompute() {
  S.tx = S.settings ? allTx() : []; S.sweeps = S.settings ? computeSweeps() : []; S.rev = (S.rev || 0) + 1;
  if (S.settings && S.settings.onboarded && ensurePhases()) { S.rev++; if (S.mode === 'live') persist('settings'); }
}
function refresh() { recompute(); if (isEditingMain()) { S.pendingRender = true; return; } renderView(); }
document.addEventListener('focusout', () => { if (S.pendingRender) setTimeout(() => { if (!isEditingMain() && S.pendingRender) { S.pendingRender = false; renderView(); } }, 0); });

function renderView() {
  document.body.dataset.mode = S.mode;
  const main = $('#view');
  if (S.mode === 'loading') { $('#top-title').textContent = 'Spend & Save'; main.innerHTML = `<div class="skel" aria-busy="true"><span class="eyebrow">Safe to spend</span><i class="big"></i><i style="width:80%"></i></div><div class="skel"><i style="width:40%"></i><i></i></div><p class="muted small" style="text-align:center">${S.slow ? 'Still connecting to your saved data. Check your connection; this page keeps trying.' : 'Opening…'}</p>`; return; }
  if (S.mode === 'error') { $('#top-title').textContent = 'Spend & Save'; main.innerHTML = `<div class="card"><h2 style="font:700 1.2rem var(--f-display)">Your saved data can’t be reached</h2><p class="muted">Reload the page to try again. If it keeps happening, check that you’re signed in to claude.ai.</p></div>`; return; }
  if (S.mode === 'onboard') { $('#top-title').textContent = 'Welcome'; main.innerHTML = viewOnboard(); return; }
  recompute();
  $('#top-title').textContent = TITLES[S.view];
  $$('.tab[data-view]').forEach(b => { if (b.dataset.view === S.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const fn = { home: viewHome, goals: viewGoals, forecast: viewForecast, more: viewMore }[S.view];
  const demo = S.mode === 'demo' ? `<div class="banner"><b>Example data.</b> ${S.why === 'try' ? 'Nothing here is saved. <button class="linkbtn" data-act="demo-exit">Back to my own</button>' : `${S.why === 'signedout' ? 'Sign in to claude.ai and reopen this page' : 'Open this page in claude.ai while signed in'} to use your own. Changes here aren’t saved.`}</div>` : '';
  main.innerHTML = (S.view === 'home' ? localBanners() : '') + demo + fn();
  if (S.view === 'more' && moreTab() === 'activity') renderActList();
}

/* ---------- Home: optional cards, each switched on in More → Settings (saved with your settings) ---------- */
const HOME_OPTS = [
  ['past', 'Past months & Spending details', 'Month arrows, plus what went into Spending, what you spent and what’s still to come.'],
  ['bills', 'All bills this month', 'Every bill due this month, not only the next 7 days.'],
  ['savDetail', 'Savings details', 'This month / Total switch, what went in and out, and Sort it now for Other.'],
  ['insOpen', 'Open everything in Past', 'Show every card in Forecast → Past without tapping More insights.'],
  ['actOpen', 'Show all filters in Activity', 'Show the Spending & savings and category filters without tapping More filters.'],
];
const homeOn = k => !!(S.settings && S.settings.home && S.settings.home[k]);
/* the original page's month arrows and Spending section; carries over between months and leaves room for set-asides */
function periodNav(p) {
  const cur = S.offset === 0, left = diffDays(today(), p.end) + 1;
  return `<div class="pnav"><button class="icon-btn" data-act="period" data-d="-1" aria-label="Previous month">${I.left}</button>
    <div class="pnav-label"><b>${esc(p.label)}</b><span>${cur ? `${left} day${left > 1 ? 's' : ''} left` : `Ended ${fmtD(p.end)}`}</span></div>
    <button class="icon-btn" data-act="period" data-d="1" aria-label="Next month" ${cur ? 'disabled' : ''}>${I.right}</button></div>`;
}
function pastCard() {
  const p = periodAt(S.offset), cur = S.offset === 0, m = spendMonth(p), avail = m.added + Math.max(0, m.carry), used = m.spent + m.out;
  const pct = avail > 0 ? Math.min(100, used / avail * 100) : (used > 0 ? 100 : 0), stt = m.left < -0.004 ? 'over' : (avail > 0 && used / avail >= 0.8 ? 'warn' : 'ok');
  const none = { list: [], total: 0 }, ahead = cur ? billsAhead(p) : none, planned = cur ? plannedAhead(p, ahead) : none, kept = cur ? asideLeft() : 0;
  const projected = r2(m.left - ahead.total - planned.total - kept), nextName = MONTHS[parts(addMonths(p.start, 1))[1] - 1], next1 = fmtD(addDays(p.end, 1));
  const bigNum = v => `<div class="hero-num ${v < -0.004 ? 'neg' : ''}"><span class="cur">${v < -0.004 ? '−' : ''}${esc(sym())}</span>${nf2.format(Math.abs(v))}</div>`;
  const note = carryOn()
    ? (cur ? (m.left >= 0 ? `Whatever’s left on ${fmtD(p.end)} carries into ${nextName}.` : `The ${money(-m.left)} over comes out of ${nextName}’s Spending.`) : (Math.abs(m.left) < 0.005 ? 'Nothing carried over.' : m.left > 0 ? `${money(m.left)} carried into ${nextName}.` : `${money(-m.left)} over carried into ${nextName}.`))
    : (cur ? (m.left >= 0 ? `Whatever’s left on ${fmtD(p.end)} goes to Savings → ${esc(otherCat().name)}.` : `At month end the ${money(-m.left)} comes out of Savings → ${esc(otherCat().name)}.`) : (Math.abs(m.left) < 0.005 ? 'Nothing carried over.' : m.left > 0 ? `${money(m.left)} went to Savings → ${esc(otherCat().name)} on ${next1}.` : `${money(-m.left)} came out of Savings → ${esc(otherCat().name)} on ${next1}.`));
  return `<section class="hero" aria-label="Spending by month">${periodNav(p)}
    <div class="hero-top"><span class="grp-name"><i class="dot rs"></i>Spending</span><button class="linkbtn" data-act="where-activity" data-id="spend">Activity</button></div>
    <span class="eyebrow">${cur ? 'Left in Spending now' : 'Left at month end'}</span>${bigNum(m.left)}
    ${cur && (ahead.list.length || planned.list.length || kept > 0.004) ? `<span class="eyebrow" style="margin-top:6px">After bills, plans &amp; set-asides</span>${bigNum(projected)}` : ''}
    <span class="bar ${stt}" role="img" aria-label="${Math.round(pct)}% of spending money used"><i style="width:${pct.toFixed(1)}%"></i></span>
    ${stt === 'over' ? `<span class="status over">${I.over}Spent ${money(used)} of ${money(avail)}</span>` : stt === 'warn' ? `<span class="status warn">${I.warn}${Math.round(pct)}% used · ${money(m.left)} left</span>` : `<span class="status">${money(m.spent)} spent of ${money(avail)}</span>`}
    <div class="flow">${Math.abs(m.carry) > 0.004 ? `<span>From earlier months</span><span${m.carry < 0 ? ' style="color:var(--over)"' : ''}>${m.carry > 0 ? '+' : '−'}${money(Math.abs(m.carry))}</span>` : ''}<span>Added this month</span><span>+${money(m.added)}</span><span>Spent</span><span>−${money(m.spent)}</span>${m.out ? `<span>Moved to savings</span><span>−${money(m.out)}</span>` : ''}<span class="tot">${m.left < 0 ? 'Over' : cur ? 'Left now' : 'Left'}</span><span class="tot"${m.left < 0 ? ' style="color:var(--over)"' : ''}>${money(m.left)}</span></div>
    ${cur && (ahead.list.length || planned.list.length || kept > 0.004) ? `<div class="flow"><span class="muted">Still to come this month</span><span></span>${ahead.list.map(o => `<span>${esc(o.x.name)} · ${o.d < today() ? 'overdue' : esc(fmtD(o.d))}</span><span>−${money(o.x.amount)}</span>`).join('')}${planned.list.map(x => `<span>${esc(x.l.name)} · ${x.left > 0.004 ? `${mw(x.left)} left of ${mw(x.plan)} planned` : `${mw(x.plan)} plan used up`}</span><span>−${money(x.left)}</span>`).join('')}${kept > 0.004 ? `<span>Set-asides for goals</span><span>−${money(kept)}</span>` : ''}<span class="tot">Projected</span><span class="tot"${projected < -0.004 ? ' style="color:var(--over)"' : ''}>${money(projected)}</span></div>` : ''}
    <p class="muted small">${note}</p>
  </section>`;
}
function billsCard(p) { // the original page's full bills card: due now, then the rest of this month
  const act = activeBills();
  if (!act.length) return `<section class="card"><div class="card-head"><h2>Bills & subscriptions</h2><button class="link" data-act="edit-bill">+ Add</button></div><p class="muted small">Add rent, your phone plan, insurance or Spotify, daily, weekly, monthly or yearly. You’ll see when each is due.</p></section>`;
  const t = today(), due = act.filter(x => x.next <= t).sort(byNext), soon = act.filter(x => x.next > t && x.next <= p.end).sort(byNext), later = act.filter(x => x.next > p.end).sort(byNext);
  let h = `<section class="card" aria-label="Bills and subscriptions"><div class="card-head"><h2>Bills & subscriptions</h2><button class="link" data-act="edit-bill">+ Add</button></div>`;
  if (due.length) h += `<div><span class="eyebrow" style="color:var(--warn)">Due now</span><div>${due.map(x => billRow(x, 'due')).join('')}</div></div>`;
  if (soon.length) h += `<div><span class="eyebrow">Coming up this month</span><div>${soon.map(x => billRow(x, 'view')).join('')}</div></div>`;
  if (!due.length && !soon.length) h += `<p class="muted small">Nothing else due this month.${later.length ? ` Next: ${esc(later[0].name)} on ${fmtD(later[0].next)}.` : ''}</p>`;
  return h + `<button class="linkbtn" data-act="plan-tab" data-tab="bills" style="align-self:flex-start">See all ${act.length}</button></section>`;
}
function savingsDetailCard(p) { // the original page's savings card: This month / Total, ins and outs, Sort it now
  const s = S.settings, v = S.saveView, cur = p.start === periodAt(0).start, until = cur ? today() : p.end;
  const rows = s.saveCats.map(c => ({ c, bal: saveBal(c.id, until), m: saveMonth(c.id, p) }));
  const total = r2(sum(rows.map(r => r.bal))), fl = saveFlows(p), other = rows.find(r => r.c.id === 'other'), when = cur ? 'this month' : `in ${monthName(p)}`;
  let h = `<section class="card" aria-label="Savings"><div class="card-head"><h2>Savings</h2><button class="link" data-act="savecat-edit">+ New category</button></div>
    <div class="sv-total"><b class="num">${mw(total)}</b><span class="d ${fl.saved > 0.004 ? 'add' : ''}">${fl.saved > 0.004 ? `+${mw(fl.saved)} saved ${when}` : `Nothing saved ${when}`}</span></div>
    ${fl.takenOut > 0.004 ? `<span class="status over">${I.warn}${mw(fl.takenOut)} taken out of savings ${when}</span>` : ''}
    <div class="seg mini" role="group" aria-label="Show savings as"><button data-act="save-view" data-v="month" aria-pressed="${v === 'month'}">${cur ? 'This month' : monthName(p)}</button><button data-act="save-view" data-v="total" aria-pressed="${v === 'total'}">Total</button></div><div>`;
  for (const r of rows) {
    const tgt = +r.c.target || 0; let val, cls = '', sub = '';
    if (v === 'total') { val = mw(r.bal); cls = r.bal < -0.004 ? 'neg' : ''; sub = r.c.id === 'other' ? (r.bal > 0.004 ? 'Not sorted yet' : 'Unsorted money lands here') : (r.m.net ? `${r.m.net > 0 ? '+' : ''}${mw(r.m.net)} ${when}` : ''); }
    else { val = `${r.m.net > 0.004 ? '+' : ''}${mw(r.m.net)}`; cls = r.m.net > 0.004 ? 'add' : r.m.net < -0.004 ? 'less' : ''; sub = r.m.inn || r.m.out ? `in ${mw(r.m.inn)} · out ${mw(r.m.out)} · now ${mw(r.bal)}` : `Nothing ${cur ? 'yet' : ''} · ${mw(r.bal)} in total`; }
    h += `<button class="sv-row" data-act="savecat" data-id="${esc(r.c.id)}"><i class="dot pc${r.c.color ?? 6}"></i><span class="nm">${esc(r.c.name)}${r.c.goal ? `<span class="tag">${r.c.done ? 'done' : 'goal'}</span>` : ''}</span><span class="val ${cls}">${val}</span>
      ${sub ? `<span class="sub">${esc(sub)}</span>` : ''}${v === 'total' && tgt ? `<span class="bar thin"><i style="width:${Math.max(0, Math.min(100, r.bal / tgt * 100)).toFixed(1)}%;background:var(--p${r.c.color})"></i></span><span class="sub">${Math.round(Math.max(0, Math.min(1, r.bal / tgt)) * 100)}% of ${mw(tgt)}</span>` : ''}</button>`;
  }
  h += '</div>';
  if (cur && other && other.bal > 0.004) h += `<div class="banner"><b>${money(other.bal)}</b> in ${esc(other.c.name)} isn’t sorted yet. <button class="linkbtn" data-act="sort-other">Sort it now</button></div>`;
  if (other && other.bal < -0.004) h += `<span class="status over">${I.over}${esc(other.c.name)} is below zero. Move money into it from another category.</span>`;
  return h + `<div class="btn-row"><button class="btn ghost small" data-act="move" style="flex:none">Move money</button></div></section>`;
}
function customiseCard() {
  return `<section class="card" aria-label="Customise Home"><div class="card-head"><h2>Customise Home</h2></div>
    <p class="muted small" style="margin-top:-6px">Home always shows what’s safe to spend, this month’s plan, your goals, all your money, spending by category and your latest entries. Switch on anything else you want to see.</p>
    <div>${HOME_OPTS.map(([k, name, desc]) => `<div class="setting-row"><div class="t"><b>${esc(name)}</b><span>${esc(desc)}</span></div><button class="switch" role="switch" aria-checked="${homeOn(k)}" aria-label="${esc(name)}" data-act="home-opt" data-k="${k}"></button></div>`).join('')}</div></section>`;
}
/* Horizontal bars: one row per item, all on one scale. Text stays in ink; the bar carries the colour, and each bar
   has a hover/tap tooltip with the exact figure. rows: [{ name, v, color, dot, note, tip, attrs }] */
function hbars(rows) {
  const max = Math.max(0.01, ...rows.map(r => Math.max(0, r.v)));
  return `<div class="hbars">${rows.map(r => `<div class="ibar-row"${r.attrs ? ' ' + r.attrs : ''} data-tip="${esc(r.tip || `${r.name}: ${money(r.v)}`)}"><span class="nm">${r.dot ? `<i class="dot" style="background:${r.color}"></i>` : ''}<span>${esc(r.name)}</span></span><span class="val"><b${r.over ? ' style="color:var(--over)"' : ''}>${money(r.v)}</b>${r.note ? ` · ${esc(r.note)}` : ''}</span><span class="bar"><i style="width:${(Math.max(0, r.v) / max * 100).toFixed(1)}%;background:${r.color}"></i></span></div>`).join('')}</div>`;
}
/* Home: this month's spending by category, biggest first (top 5) */
function catCard() { // spending by category, today / this week / this month (biggest first, top 5)
  const k = ['day', 'week', 'month'].includes(S.labelPeriod) ? S.labelPeriod : 'month', r = rangeFor(k), st = stats(r);
  const rows = Object.entries(st.byLabel).filter(([, v]) => v > 0.004).sort((a, b) => b[1] - a[1]);
  let h = `<section class="card" aria-label="Spent by category"><div class="card-head"><h2>Spent by category</h2><div class="seg mini range" role="group" aria-label="Show spending for" style="flex:none">${['day', 'week', 'month'].map(v => `<button data-act="label-period" data-v="${v}" aria-pressed="${k === v}">${PER_NAME[v]}</button>`).join('')}</div></div>
    <div class="result-sum"><span>${esc(rangeLabel(r))}</span><span class="num">${money(st.spent)} spent</span></div>`;
  if (!rows.length) return h + `<p class="muted small">Nothing spent ${periodWord(r)} yet. Tap + when you buy something.</p></section>`;
  h += hbars(rows.slice(0, 5).map(([id, v]) => {
    const l = id === NOLABEL.id ? NOLABEL : label(id), pc = Math.round(v / st.spent * 100);
    return { name: l.name, v: r2(v), color: `var(--c${l.color ?? 8})`, dot: true, note: `${pc}%`, tip: `${l.name}: ${money(v)} · ${pc}% of ${money(st.spent)} spent ${periodWord(r)}`, attrs: id !== NOLABEL.id ? `role="button" tabindex="0" data-act="label" data-id="${esc(id)}" data-k="${k}" style="cursor:pointer"` : '' };
  }));
  if (rows.length > 5) h += `<button class="linkbtn" data-act="cat-all" style="align-self:flex-start">See all ${rows.length} in Insights</button>`;
  return h + '</section>';
}
/* All your money now: what's left to spend + everything in savings, worked out from your entries. Always today. */
function balanceParts() {
  const p = periodAt(0), until = today();
  const spend = spendMonth(p).left, cats = S.settings.saveCats.map(c => ({ c, v: saveBal(c.id, until) })), saved = r2(sum(cats.map(x => x.v)));
  const start = r2(sum(S.settings.saveCats.map(c => +c.start || 0)));
  // money already here but set aside as next month's Spending still counts as yours
  const ahead = r2(sum(S.tx.filter(t => t.t === 'in' && t.d <= until && inSpendDay(t) > p.end).map(t => +t.spend || 0)));
  return { spend, cats, saved, start, ahead, total: r2(spend + saved + ahead) };
}
/* All your money, with its breakdown shown right below it (toggle) instead of in a pop-up. The breakdown: where all
   your money is, savings by category, what's available to spend and where this month's Spending went, what's to come. */
function balanceCard() {
  const b = balanceParts(), neg = v => v < -0.004 ? ' style="color:var(--over)"' : '', open = !!S.bdOpen;
  return `<section class="bal" aria-label="All your money">
    <button class="bal-toggle" data-act="balance" aria-expanded="${open}" aria-controls="bd" aria-label="All your money: ${esc(money(b.total))}. ${open ? 'Hide' : 'Show'} the breakdown.">
      <span class="hero-top" style="width:100%"><span class="eyebrow">All your money</span><span class="linkbtn">${open ? 'Hide breakdown ▴' : 'Breakdown ▾'}</span></span>
      <span class="hero-num ${b.total < -0.004 ? 'neg' : ''}" style="display:block"><span class="cur">${b.total < -0.004 ? '−' : ''}${esc(sym())}</span>${nf2.format(Math.abs(b.total))}</span>
      <span class="muted small">Savings <b class="num"${neg(b.saved)}>${money(b.saved)}</b> · Spending <b class="num"${neg(b.spend)}>${money(b.spend)}</b>${b.ahead > 0.004 ? ` · Next month <b class="num">${money(b.ahead)}</b>` : ''}</span>
    </button>
    ${open ? `<div class="bd-inline" id="bd">${breakdownHtml(b)}</div>` : ''}
  </section>`;
}
function breakdownHtml(b) {
  const neg = v => v < -0.004 ? ' style="color:var(--over)"' : '', oName = otherCat().name, s = safeNow();
  const cats = b.cats.filter(x => Math.abs(x.v) > 0.004).sort((x, y) => y.v - x.v);
  const debts = S.settings.saveCats.filter(c => Money.isDebt(c) && !c.done).map(c => ({ c, v: owedNow(c) })).filter(x => x.v > 0.004);
  return `<div class="flow" style="border-top:0;padding-top:0"><span><i class="dot rs" style="margin-right:8px"></i>Spending · left this month</span><span${neg(b.spend)}>${money(b.spend)}</span>${b.ahead > 0.004 ? `<span><i class="dot rs" style="margin-right:8px;opacity:.5"></i>Spending · for next month</span><span>${money(b.ahead)}</span>` : ''}<span><i class="dot" style="background:var(--r-save);margin-right:8px"></i>Savings</span><span${neg(b.saved)}>${money(b.saved)}</span><span class="tot">Total</span><span class="tot"${neg(b.total)}>${money(b.total)}</span></div>
    ${debts.length ? `<div class="flow"><span class="muted">Owed (not taken off above)</span><span></span>${debts.map(x => `<span>${esc(x.c.name)}</span><span style="color:var(--over)">−${money(x.v)}</span>`).join('')}<span class="tot">After debts</span><span class="tot">${money(r2(b.total - sum(debts.map(x => x.v))))}</span></div>` : ''}
    ${cats.length ? `<div class="sheet-sec"><span class="eyebrow">Savings by category</span>${hbars(cats.map(x => ({ name: x.c.name + (x.c.goal ? ' (goal)' : ''), v: x.v, color: goalColor(x.c), dot: true, over: x.v < -0.004, note: tgtOf(x.c) ? `of ${mw(tgtOf(x.c))}` : '' })))}</div>` : ''}
    <div class="sheet-sec" id="bd-avail"><span class="eyebrow">Safe to spend this month</span><div class="avail-num"><b class="num${s.can < -0.004 ? ' neg' : ''}">${money(s.can)}</b><span>after bills and set-asides still due</span></div><button class="linkbtn" data-act="safe-how" style="align-self:flex-start">How it’s worked out</button></div>
    <div class="field sheet-sec"><label for="bal-real">Is this all your money?</label>
      <span class="hint">If your bank accounts and cash add up to a different amount, type the real total. The difference goes into Savings → ${esc(oName)} as money you already had.</span>
      <div class="money-in" data-sym="${esc(sym())}"><input class="input" id="bal-real" inputmode="decimal" placeholder="${esc(b.total.toFixed(2))}" autocomplete="off"></div>
      <p class="small" id="bal-err" style="color:var(--over)" hidden></p>
      <div><button class="btn soft small" data-act="bal-set">Update my total</button></div></div>
    <div class="btn-row"><button class="btn ghost" data-act="sd-act">Spending activity</button><button class="btn ghost" data-act="sd-plan">Budget &amp; plan</button></div>`;
}
function showBreakdown(open, target) { // open/close the breakdown on Home (remembered on this device); optionally scroll to a part of it
  S.bdOpen = open; lsSet('spend-save:bdOpen', open ? '1' : '');
  const go = () => { if (target) { const el = $(target); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  if (S.view !== 'home') { location.hash = 'home'; setTimeout(go, 150); } else { renderView(); requestAnimationFrame(go); }
}
function balSet() {
  const raw = $('#bal-real').value, err = $('#bal-err');
  if (!raw.trim() || !isFinite(parseFloat(raw.replace(/[^0-9.\-]/g, '')))) { err.textContent = 'Type the total you have, for example 5200.'; err.hidden = false; return; }
  const want = r2(parseMoney(raw)), now = balanceParts().total, diff = r2(want - now);
  if (Math.abs(diff) < 0.005) { $('#bal-real').value = ''; toast('That’s already your total.'); return; }
  const o = otherCat(); o.start = r2((+o.start || 0) + diff); $('#bal-real').blur(); saveSettings();
  toast(diff > 0 ? `Added ${money(diff)} you already had to Savings → ${o.name}. All your money: ${money(want)}.` : `Took ${money(-diff)} off Savings → ${o.name}. All your money: ${money(want)}.`, '', 5000);
}
function txRow(t) {
  let ico, title, subt, amt, cls = '', act = 'edit-tx';
  if (t.t === 'out') { const l = label(t.label); ico = `<span class="tx-ico"><span class="dot c${l.color ?? 8}"></span></span>`; title = t.note || l.name; subt = `${t.note ? l.name + ' · ' : ''}${t.from === 'spend' ? 'Spending' : 'from ' + whereName(t.from)}${t.bill ? ' · recurring' : ''}${t.debt ? ' · debt payment' : ''}`; amt = '−' + money(t.amt); if (t.from !== 'spend') cls = 'fromsave'; }
  else if (t.t === 'in') { ico = `<span class="tx-ico inc">${I.up}</span>`; title = t.note || incomeCat(t).name; subt = [t.note ? incomeCat(t).name : '', t.spend ? `Spending ${mw(t.spend)}${t.for ? ` for ${forName(t.for)}` : ''}` : '', ...Object.entries(t.save || {}).filter(([, v]) => v > 0).map(([k, v]) => `${saveCat(k).name} ${mw(v)}`)].filter(Boolean).join(' · '); amt = '+' + money(t.amt); cls = 'inc'; }
  else if (t.t === 'move') {
    ico = `<span class="tx-ico mov">${I.move}</span>`; title = `${whereName(t.from)} → ${whereName(t.to)}`; amt = money(t.amt); cls = 'mov';
    if (t.via) { const f = findTx(t.via); subt = `${t.note ? t.note + ' · ' : ''}${f ? `Changed ${incomeCat(f.t).name}, ${fmtD(f.t.d)}` : 'Record only'}`; } // the money-in entry holds the change
    else subt = t.note || 'Moved';
  }
  else { ico = `<span class="tx-ico mov">${I.move}</span>`; title = t.amt >= 0 ? `${monthName(t.p)} leftover → Savings · Other` : `${monthName(t.p)} overspend ← Savings · Other`; subt = 'From that month’s spending · not counted as saved'; amt = money(Math.abs(t.amt)); cls = t.amt >= 0 ? 'mov' : 'fromsave'; act = 'sweep-info'; }
  return `<button class="tx" data-act="${act}" data-id="${esc(t.id)}">${ico}<span class="tx-main"><span class="tx-title">${esc(title)}</span><span class="tx-sub">${esc(subt)}</span></span><span class="tx-amt ${cls}">${esc(amt)}</span></button>`;
}
/* ---------- bills & subscriptions ----------
   Stored in settings.subs: { id, kind:'bill'|'sub', name, amount, cycle, next, day, label, from:'spend'|saveCatId }.
   Nothing is recorded until you tap Paid; then an `out` entry with `bill: id` is added and `next` moves on. */
const CYCLES = { daily: ['Daily', 'a day'], weekly: ['Weekly', 'a week'], monthly: ['Monthly', 'a month'], quarterly: ['Every 3 months', 'every 3 months'], yearly: ['Yearly', 'a year'] };
const activeBills = () => S.settings.subs.filter(x => x.active !== false);
const byNext = (a, b) => a.next < b.next ? -1 : a.next > b.next ? 1 : 0;
const billFrom = x => x.from && (x.from === 'spend' || S.settings.saveCats.some(c => c.id === x.from)) ? x.from : 'spend';
const defaultBillLabel = kind => { const L = S.settings.labels; const want = kind === 'bill' ? 'bills' : 'subs'; return L.some(l => l.id === want) ? want : (L.some(l => l.id === 'other') ? 'other' : (L[0]?.id || '')); };
function stepDate(x, d) {
  if (x.cycle === 'daily') return addDays(d, 1);
  if (x.cycle === 'weekly') return addDays(d, 7);
  const n = x.cycle === 'quarterly' ? 3 : x.cycle === 'yearly' ? 12 : 1, [y, m] = parts(d), [fy, fm] = parts(addMonths(ymd(y, m, 1), n));
  return ymd(fy, fm, Math.min(x.day || parts(d)[2], daysIn(fy, fm)));
}
function occurrences(x, until) { const out = []; let d = x.next; while (d && d <= until && out.length < 60) { out.push(d); d = stepDate(x, d); } return out; }
function billsAhead(p) { // unpaid Spending bills due by the end of this month, overdue ones included
  const list = []; for (const x of activeBills()) if (billFrom(x) === 'spend') for (const d of occurrences(x, p.end)) list.push({ x, d });
  list.sort((a, b) => a.d < b.d ? -1 : 1);
  return { list, total: r2(sum(list.map(o => o.x.amount))) };
}
const monthlyEq = x => x.cycle === 'yearly' ? x.amount / 12 : x.cycle === 'quarterly' ? x.amount / 3 : x.cycle === 'weekly' ? x.amount * 52 / 12 : x.cycle === 'daily' ? x.amount * 365 / 12 : +x.amount;
function billRow(x, mode) { // mode: 'due' (Paid + Skip), 'pay' (Paid), 'view' (no buttons)
  const n = diffDays(today(), x.next), from = billFrom(x);
  const d = n < 0 ? { txt: `Overdue since ${fmtD(x.next)}`, cls: 'late' } : n === 0 ? { txt: 'Due today', cls: 'soon' } : n <= 3 ? { txt: `Due in ${n} day${n === 1 ? '' : 's'} · ${fmtD(x.next)}`, cls: 'soon' } : { txt: `Next ${fmtD(x.next)}`, cls: '' };
  return `<div class="sub-row"><button class="nm" data-act="edit-bill" data-id="${esc(x.id)}">${esc(x.name)}</button>
    <div class="right"><span class="num small">${money(x.amount)}</span>${mode !== 'view' ? `<button class="btn soft small" data-act="pay-bill" data-id="${esc(x.id)}">Paid</button>` : ''}${mode === 'due' ? `<button class="btn ghost small" data-act="skip-bill" data-id="${esc(x.id)}">Skip</button>` : ''}</div>
    <span class="due ${d.cls}">${esc(d.txt)} · ${esc(CYCLES[x.cycle]?.[1] || '')}${from !== 'spend' ? ` · from ${esc(whereName(from))}` : ''}</span></div>`;
}
function payBill(id) {
  const s = S.settings, x = s.subs.find(v => v.id === id); if (!x) return;
  const t = today(), d = x.next <= t ? x.next : t, from = billFrom(x);
  const lab = s.labels.some(l => l.id === x.label) ? x.label : defaultBillLabel(x.kind);
  x.next = stepDate(x, x.next); persist('settings');
  addTx([{ id: newId(), d, t: 'out', amt: r2(x.amount), label: lab, from, note: x.name, bill: x.id }]);
  toast(`${x.name} ${money(x.amount)} recorded${from !== 'spend' ? ` from ${whereName(from)}` : ''}. Next due ${fmtD(x.next)}.`);
}
function skipBill(id) { const x = S.settings.subs.find(v => v.id === id); if (!x) return; x.next = stepDate(x, x.next); saveSettings(); toast(`${x.name} skipped. Next due ${fmtD(x.next)}.`); }

/* ---------- Activity ---------- */
function rangeOf(f) {
  if (f.range === 'month') { const p = periodAt(0); return [p.start, p.end]; }
  if (f.range === 'last') { const p = periodAt(-1); return [p.start, p.end]; }
  if (f.range === '3m') return [periodAt(-2).start, periodAt(0).end];
  if (f.range === 'custom') return [f.from || '0000-01-01', f.to || '9999-12-31'];
  return ['0000-01-01', '9999-12-31'];
}
/* Activity toggles: any mix can be on; an entry shows if it matches any of them (none on = everything). */
const TYPE_CHIPS = [['out', 'Spent'], ['in', 'Money in'], ['move', 'Moves'], ['save', 'Savings']];
function typeHit(k, t) {
  if (k === 'out') return t.t === 'out';
  if (k === 'in') return t.t === 'in';
  if (k === 'move') return t.t === 'move' || t.t === 'sweep';
  // savings: anything that put money into or took it out of savings
  return t.t === 'move' || t.t === 'sweep' || (t.t === 'in' && sum(Object.values(t.save || {})) > 0.004) || (t.t === 'out' && t.from !== 'spend');
}
function filtered() {
  const f = S.f, [a, b] = rangeOf(f), q = f.q.trim().toLowerCase();
  return [...S.tx, ...S.sweeps].filter(t => {
    if (t.d < a || t.d > b) return false;
    if (f.types.length && !f.types.some(k => typeHit(k, t))) return false;
    if (f.where !== 'all') {
      const w = f.where, hit = t.t === 'out' ? t.from === w : t.t === 'move' ? (t.from === w || t.to === w) : t.t === 'in' ? (w === 'spend' ? t.spend > 0 : (t.save?.[w] || 0) > 0) : w === 'other' || w === 'spend';
      if (!hit) return false;
    }
    if (f.label !== 'all' && !(t.t === 'out' && (f.label === NOLABEL.id ? !labelKnown(t.label) : t.label === f.label))) return false;
    if (q) { const hay = [t.note, t.t === 'out' ? label(t.label).name + ' ' + whereName(t.from) : '', t.t === 'move' ? whereName(t.from) + ' ' + whereName(t.to) : '', t.t === 'in' ? (t.src === 'pay' ? 'pay ' : 'money in ') + incomeCat(t).name : '', t.t === 'sweep' ? 'leftover overspend other' : '', Math.abs(t.amt).toFixed(2), fmtDY(t.d)].join(' ').toLowerCase(); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  }).sort((x, y) => x.d < y.d ? 1 : x.d > y.d ? -1 : 0);
}
function viewActivity() {
  const f = S.f, s = S.settings, opt = (v, l, c) => `<option value="${esc(v)}" ${c === v ? 'selected' : ''}>${esc(l)}</option>`;
  return `<section class="card filters" aria-label="Search and filter">
    <div class="search">${I.search}<input class="input" id="f-q" data-f="q" type="search" placeholder="Search notes, categories, amounts" value="${esc(f.q)}" autocomplete="off"></div>
    <div class="field"><span>Show <span class="hint" id="f-types-hint">${f.types.length ? 'any of these' : 'everything · turn on any mix'}</span></span><div class="chips" role="group" aria-label="Show these kinds of entries">${TYPE_CHIPS.map(([v, l]) => `<button class="chip" data-act="f-type" data-v="${v}" aria-pressed="${f.types.includes(v)}">${l}</button>`).join('')}</div></div>
    <select class="input slim" id="f-range" data-f="range" aria-label="Dates">${opt('month', 'This month', f.range)}${opt('last', 'Last month', f.range)}${opt('3m', 'Last 3 months', f.range)}${opt('all', 'All time', f.range)}${opt('custom', 'Custom dates', f.range)}</select>
    <details class="more mf" ${f.where !== 'all' || f.label !== 'all' || homeOn('actOpen') ? 'open' : ''}><summary>More filters</summary><div class="more-in">
      <select class="input slim" id="f-where" data-f="where" aria-label="Spending or savings">${opt('all', 'Spending & savings', f.where)}${opt('spend', 'Spending', f.where)}${s.saveCats.map(c => opt(c.id, 'Savings · ' + c.name, f.where)).join('')}</select>
      <select class="input slim" id="f-label" data-f="label" aria-label="Expense category">${opt('all', 'All expense categories', f.label)}${s.labels.map(l => opt(l.id, l.name, f.label)).join('')}${opt(NOLABEL.id, NOLABEL.name, f.label)}</select></div></details>
    ${f.range === 'custom' ? `<div class="filter-row"><label class="field"><span>From</span><input class="input" type="date" id="f-from" data-f="from" value="${esc(f.from)}"></label><label class="field"><span>To</span><input class="input" type="date" id="f-to" data-f="to" value="${esc(f.to)}"></label></div>` : ''}
    ${(f.q || f.types.length || f.where !== 'all' || f.label !== 'all' || f.range !== 'month') ? `<button class="linkbtn" data-act="f-clear">Clear filters</button>` : ''}
  </section><section class="card" id="act-list"></section>`;
}
function renderActList() {
  const el = $('#act-list'); if (!el) return;
  const list = filtered(), sp = sum(list.filter(t => t.t === 'out').map(t => t.amt)), inn = sum(list.filter(t => t.t === 'in').map(t => t.amt)), mv = sum(list.filter(t => t.t === 'move').map(t => t.amt));
  const sums = [sp ? `Spent ${money(sp)}` : '', inn ? `In ${money(inn)}` : '', mv ? `Moved ${money(mv)}` : ''].filter(Boolean).join(' · ');
  let h = `<div class="result-sum"><span>${list.length} item${list.length === 1 ? '' : 's'}</span><span class="num">${sums}</span></div>`;
  if (!list.length) { el.innerHTML = h + `<div class="empty"><b>No matches</b>Try another search or widen the dates.</div>`; return; }
  const dayTot = {}; for (const t of list) if (t.t === 'out') dayTot[t.d] = (dayTot[t.d] || 0) + t.amt;
  h += '<div class="txs">'; let day = null;
  for (const t of list.slice(0, S.f.limit)) { if (t.d !== day) { day = t.d; h += `<div class="day-head"><span>${esc(fmtDay(day))}</span><span class="num">${dayTot[day] ? '−' + money(dayTot[day]) : ''}</span></div>`; } h += txRow(t); }
  h += '</div>';
  if (list.length > S.f.limit) h += `<button class="btn ghost block" data-act="f-moreRows">Show more (${list.length - S.f.limit} left)</button>`;
  el.innerHTML = h;
}

/* ---------- Insights ---------- */
/* Insights for any range: a day, week, month (the app's month) or calendar year with arrows, all time, or custom dates. */
const INS_KINDS = ['day', 'week', 'month', 'year', 'all', 'custom'];
const INS_NAME = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', all: 'All', custom: 'Custom' };
const PREV_WORD = { day: 'yesterday', week: 'last week', month: 'last month', year: 'last year' };
const SAME_POINT = { week: 'this point last week', month: 'this point last month', year: 'this point last year' };
const FIXED = ['day', 'week', 'month', 'year'];
function deltaHtml(cur, prev, upGood, vs, none) {
  if (!prev && !cur) return '<span class="d">No change</span>';
  if (!prev) return `<span class="d">Nothing ${esc(none)}</span>`;
  const diff = cur - prev; if (Math.abs(diff) < 0.5) return `<span class="d">Same as ${esc(vs)}</span>`;
  const up = diff > 0, good = up === upGood;
  return `<span class="d ${up ? 'up' : 'down'}-${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${money(Math.abs(diff), { dp: 0 })} vs ${esc(vs)}</span>`;
}
const firstDate = () => S.tx.length ? S.tx[S.tx.length - 1].d : null; // S.tx is newest first
const lastDate = () => S.tx.length ? S.tx[0].d : null;
const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
function insRange() {
  const k = S.ins.kind, t = today();
  if (k === 'all') { const f = firstDate(), l = lastDate(); return { kind: k, start: f && f < t ? f : t, end: l && l > t ? l : t }; }
  if (k === 'custom') { let a = isDay(S.ins.from) ? S.ins.from : addDays(t, -29), b = isDay(S.ins.to) ? S.ins.to : t; if (a > b) [a, b] = [b, a]; return { kind: k, start: a, end: b }; }
  const r = rangeFor(k, t); return S.ins.off ? shiftRange(r, S.ins.off) : r;
}
function shortRange(r) {
  if (r.kind === 'all') return 'all time';
  if (r.kind === 'custom') return `${fmtD(r.start)} – ${fmtD(r.end)}`;
  if (isNow(r)) return periodWord(r);
  return r.kind === 'day' ? fmtD(r.start) : r.kind === 'week' ? `${fmtD(r.start)} – ${fmtD(r.end)}` : r.label;
}
function insNav(r) {
  if (r.kind === 'all') { const f = firstDate(); return `<div class="pnav" style="justify-content:center"><div class="pnav-label"><b>All time</b><span>${f ? `Since ${esc(fmtDY(f))}` : 'Nothing logged yet'}</span></div></div>`; }
  if (r.kind === 'custom') return `<div class="filter-row"><label class="field"><span>From</span><input class="input" type="date" id="ins-from" value="${esc(r.start)}"></label><label class="field"><span>To</span><input class="input" type="date" id="ins-to" value="${esc(r.end)}"></label></div>`;
  const cur = isNow(r), left = diffDays(today(), r.end) + 1;
  const sub = cur ? (r.kind === 'day' ? 'So far today' : `${left} day${left === 1 ? '' : 's'} left`) : r.kind === 'day' ? fmtDY(r.start) : `Ended ${fmtDY(r.end)}`;
  return `<div class="pnav"><button class="icon-btn" data-act="ins-step" data-d="-1" aria-label="Previous ${r.kind}">${I.left}</button>
    <div class="pnav-label"><b>${esc(rangeLabel(r))}</b><span>${esc(sub)}</span></div>
    <button class="icon-btn" data-act="ins-step" data-d="1" aria-label="Next ${r.kind}" ${cur ? 'disabled' : ''}>${I.right}</button></div>`;
}
function avgHtml(v, r) {
  const end = r.end < today() ? r.end : today(), D = Math.max(1, diffDays(r.start, end) + 1);
  if (D >= 60) return `<span class="d">About ${money(v / D * 365 / 12, { dp: 0 })} a month</span>`;
  if (D >= 14) return `<span class="d">About ${money(v / D * 7, { dp: 0 })} a week</span>`;
  return `<span class="d">About ${money(v / D)} a day</span>`;
}
const tm = v => Math.abs(v) >= 10000 ? money(v, { dp: 0 }) : mw(v);
/* chart columns: the last few days/weeks/months/years ending at the chosen one, or the custom/all-time span cut to fit */
const BUCKETS = { day: 14, week: 8, month: 6, year: 5 };
function insBuckets(r) {
  if (BUCKETS[r.kind]) { const n = BUCKETS[r.kind]; return { unit: r.kind, list: Array.from({ length: n }, (_, i) => ({ ...shiftRange(r, i - n + 1), cur: i === n - 1 })) }; }
  const D = diffDays(r.start, r.end) + 1, unit = D <= 31 ? 'day' : D <= 92 ? 'week' : D <= 1100 ? 'month' : 'year', list = [];
  for (let b = rangeFor(unit, r.start); b.start <= r.end && list.length < 60; b = shiftRange(b, 1)) list.push({ ...b, start: b.start < r.start ? r.start : b.start, end: b.end > r.end ? r.end : b.end, cur: true });
  return { unit, list };
}
const bLabel = b => b.kind === 'day' ? String(parts(b.start)[2]) : b.kind === 'week' ? fmtD(weekStart(b.start)) : b.kind === 'month' ? shortLabel(periodFor(b.start)) : String(parts(b.start)[0]);
const bName = b => b.kind === 'day' ? fmtDay(b.start) : b.kind === 'week' ? `${fmtD(b.start)} – ${fmtD(b.end)}` : b.kind === 'month' ? periodFor(b.start).label : String(parts(b.start)[0]);
function viewInsights() {
  const s = S.settings, r = insRange(), st = stats(r), fixed = FIXED.includes(r.kind), t0 = today();
  const balAt = r.end < t0 ? r.end : t0, nowBal = balAt === t0;
  let h = `<div class="seg range" role="group" aria-label="Show amounts for">${INS_KINDS.map(k => `<button data-act="ins-kind" data-v="${k}" aria-pressed="${r.kind === k}"${k === 'all' ? ' aria-label="All time"' : ''}>${INS_NAME[k]}</button>`).join('')}</div>` + insNav(r);
  let d1, d2, d3, prevSpent = 0, vs = '';
  const prevBy = {};
  if (fixed) {
    const pr = shiftRange(r, -1), sp = stats(pr), pw = PREV_WORD[r.kind];
    let early = sp.tx.filter(t => t.t === 'out'); vs = pw;
    if (isNow(r) && r.kind !== 'day') { const cut = addDays(pr.start, diffDays(r.start, t0)); early = early.filter(t => t.d <= cut); vs = SAME_POINT[r.kind]; }
    prevSpent = r2(sum(early.map(t => t.amt)));
    for (const t of early) { const k = labelKnown(t.label) ? t.label : NOLABEL.id; prevBy[k] = (prevBy[k] || 0) + t.amt; }
    d1 = deltaHtml(st.inn, sp.inn, true, pw, pw); d2 = deltaHtml(st.spent, prevSpent, false, vs, vs === pw ? pw : `by ${vs}`); d3 = deltaHtml(st.saved, sp.saved, true, pw, pw);
  } else { d1 = avgHtml(st.inn, r); d2 = avgHtml(st.spent, r); d3 = avgHtml(st.saved, r); }
  h += `<div class="tiles">
    <div class="tile"><span class="eyebrow">Money in</span><span class="v">${tm(st.inn)}</span>${d1}</div>
    <div class="tile"><span class="eyebrow">Spent</span><span class="v">${tm(st.spent)}</span>${d2}</div>
    <div class="tile"><span class="eyebrow">Saved</span><span class="v">${tm(st.saved)}</span>${d3}</div>
    <div class="tile"${nowBal ? ' role="button" tabindex="0" data-act="balance" style="cursor:pointer"' : ''}><span class="eyebrow">Total savings</span><span class="v">${tm(totalSaved(balAt))}</span><span class="d">${nowBal ? 'now · <span style="color:var(--accent)">see where</span>' : `on ${esc(fmtDY(balAt))}`}</span></div>
  </div>`;
  const { unit, list } = insBuckets(r), rows = list.map(b => ({ b, st: stats(b), at: b.end < t0 ? b.end : t0 }));
  const fl = st.flows, when = shortRange(r);
  let more = `<section class="card"><div class="card-head"><h2>Where savings came from</h2><span class="muted small">${esc(when)}</span></div>
    <div class="flow" style="border-top:0;padding-top:0"><span>From pay</span><span>+${money(fl.pay)}</span>${fl.otherIn ? `<span>Other money in</span><span>+${money(fl.otherIn)}</span>` : ''}${fl.fromSpend ? `<span>Moved from Spending</span><span>+${money(fl.fromSpend)}</span>` : ''}<span class="tot">Saved</span><span class="tot">${money(fl.saved)}</span></div>
    ${fl.leftover || fl.takenOut ? `<div class="flow"><span class="muted">Not counted as saving</span><span></span>${fl.leftover ? `<span>${fl.leftover > 0 ? 'Spending left over at month end' : 'Overspending taken from savings'}</span><span>${fl.leftover > 0 ? '+' : ''}${money(fl.leftover)}</span>` : ''}${fl.takenOut ? `<span>Taken out of savings</span><span>−${money(fl.takenOut)}</span>` : ''}</div>` : ''}
    <p class="muted small">Saved counts money put into savings from pay, other money in or Spending.</p></section>`;
  more += `<section class="card"><div class="card-head"><h2>Saved each ${unit}</h2></div>${colChart(rows.map(x => ({ v: x.st.saved, cur: x.b.cur, label: bLabel(x.b), tip: `${bName(x.b)}\nSaved ${money(x.st.saved)}\nTotal savings ${money(totalSaved(x.at))}` })), 0, '', 'var(--p0)')}
    <details class="tbl"><summary>Show each savings category</summary><div class="tbl-wrap"><table class="data"><thead><tr><th>${INS_NAME[unit]}</th>${s.saveCats.map(c => `<th>${esc(c.name)}</th>`).join('')}<th>Total</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(bLabel(x.b))}</td>${s.saveCats.map(c => `<td>${mw(saveBal(c.id, x.at))}</td>`).join('')}<td><b>${mw(totalSaved(x.at))}</b></td></tr>`).join('')}</tbody></table></div></details></section>`;
  const byInc = {}; for (const t of st.tx) if (t.t === 'in') { const c = incomeCat(t); (byInc[c.id] ||= { c, v: 0 }).v += t.amt; }
  const incRows = Object.values(byInc).sort((a, b) => b.v - a.v);
  if (incRows.length) more += `<section class="card"><div class="card-head"><h2>Money in by category</h2><span class="muted small num">${money(st.inn)}</span></div><div>${incRows.map(x => `<div class="ibar-row"><span class="nm"><i class="dot c${x.c.color ?? 8}"></i><span>${esc(x.c.name)}</span></span><span class="val"><b>${money(x.v)}</b> · ${Math.round(x.v / st.inn * 100)}%</span><span class="bar"><i style="width:${(x.v / incRows[0].v * 100).toFixed(1)}%;background:var(--p0)"></i></span></div>`).join('')}</div></section>`;
  const ref = r2(budgetNow()[unit] || 0);
  h += `<section class="card"><div class="card-head"><h2>Spent each ${unit}</h2></div>${colChart(rows.map(x => ({ v: x.st.spent, cur: x.b.cur, label: bLabel(x.b), tip: `${bName(x.b)}\nSpent ${money(x.st.spent)}${ref ? `\nBudget ${money(ref)}` : ''}` })), ref, ref ? `Budget ${mw(ref)} a ${unit}` : '')}</section>`;
  const labels = Object.entries(st.byLabel).sort((a, b) => b[1] - a[1]), lk = ['day', 'week', 'month'].includes(r.kind) ? r.kind : 'month';
  if (labels.length) h += `<section class="card"><div class="card-head"><h2>By category</h2><span class="muted small">${esc(when)}</span></div><div>${labels.map(([id, v]) => { const l = id === NOLABEL.id ? NOLABEL : label(id); return `<div class="ibar-row" ${l !== NOLABEL ? `role="button" tabindex="0" data-act="label" data-id="${esc(id)}" data-k="${lk}" style="cursor:pointer"` : ''}><span class="nm"><i class="dot c${l.color ?? 8}"></i><span>${esc(l.name)}</span></span><span class="val"><b>${money(v)}</b> · ${Math.round(v / st.spent * 100)}%</span><span class="bar"><i style="width:${(v / labels[0][1] * 100).toFixed(1)}%"></i></span></div>`; }).join('')}</div></section>`;
  if (fixed) {
    const moves = s.labels.map(l => ({ l, d: (st.byLabel[l.id] || 0) - (prevBy[l.id] || 0) })).filter(m => Math.abs(m.d) >= 1).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5);
    if (moves.length && prevSpent > 0) more += `<section class="card"><div class="card-head"><h2>Changes from ${esc(vs)}</h2></div><div class="movers">${moves.map(m => `<div><span><i class="dot c${m.l.color ?? 8}" style="margin-right:8px"></i>${esc(m.l.name)}</span><b class="num d ${m.d > 0 ? 'up-bad' : 'down-good'}">${m.d > 0 ? '▲ ' : '▼ '}${money(Math.abs(m.d))}</b></div>`).join('')}</div></section>`;
  }
  const big = st.tx.filter(t => t.t === 'out').sort((a, b) => b.amt - a.amt).slice(0, 5);
  if (big.length) more += `<section class="card"><div class="card-head"><h2>Biggest spends</h2><span class="muted small">${esc(when)}</span></div><div class="txs">${big.map(txRow).join('')}</div></section>`;
  h += `<details class="more"${homeOn('insOpen') ? ' open' : ''}><summary>More insights</summary><div class="more-in">${more}</div></details>`;
  if (!st.tx.length) h += `<div class="empty"><b>Nothing logged ${r.kind === 'custom' ? 'between these dates' : r.kind === 'all' ? 'yet' : periodWord(r)}</b>Tap + to add spending, money in or a move.</div>`;
  return h;
}
function niceMax(v) { if (v <= 0) return 100; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(x => n <= x) * p; }
const axisFmt = v => v >= 10000 ? nf0.format(v / 1000) + 'K' : nf0.format(v);
function colPath(x, base, w, h, r = 4) { if (h <= 0.5) return ''; r = Math.min(r, w / 2, h); const y = base - h; return `M${x},${base}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${base}Z`; }
function colChart(items, ref, refLabel, fill = 'var(--p1)') {
  const W = 340, H = 170, L = 40, R = 8, T = 16, B = 24, iw = W - L - R, ih = H - T - B;
  const ymax = niceMax(Math.max(1, ref || 0, ...items.map(x => x.v)) * 1.08);
  const Y = v => T + ih - v / ymax * ih, band = iw / items.length, bw = Math.min(22, band * 0.56), every = items.length > 10 ? 2 : 1;
  let g = '';
  for (const v of [0, ymax / 2, ymax]) g += `<line class="grid-l" x1="${L}" x2="${L + iw}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 3.5}" text-anchor="end">${axisFmt(v)}</text>`;
  items.forEach((x, i) => {
    const cx = L + band * i + band / 2, h = x.v / ymax * ih, over = ref && x.v > ref + 0.004;
    g += `<rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${ih}" data-tip="${esc(x.tip)}"/>`;
    g += `<path d="${colPath(cx - bw / 2, Y(0), bw, h)}" fill="${over ? 'var(--over)' : fill}" opacity="${x.cur ? 1 : .55}" pointer-events="none"/>`;
    if ((items.length - 1 - i) % every === 0) g += `<text class="ax" x="${cx}" y="${H - 7}" text-anchor="middle" ${x.cur ? 'style="fill:var(--ink);font-weight:700"' : ''}>${esc(x.label)}</text>`;
  });
  if (ref) g += `<line x1="${L}" x2="${L + iw}" y1="${Y(ref)}" y2="${Y(ref)}" stroke="var(--ink-2)" stroke-width="1.5" opacity=".7" pointer-events="none"/><text class="lbl" x="${L + 4}" y="${Y(ref) - 5}">${esc(refLabel)}</text>`;
  g += `<line class="base-l" x1="${L}" x2="${L + iw}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Chart">${g}</svg>`;
}

/* Budget rows: the same budget a week, a month and a year, each with what's spent from Spending so far and what's left. */
const BUD_NAME = { week: 'A week', month: 'A month', year: 'A year' };
const fmtIn = v => !(v > 0.004) ? '' : Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : v.toFixed(2);
function spentFromSpend(r) { let x = 0; for (const t of S.tx) if (t.t === 'out' && t.from === 'spend' && t.d >= r.start && t.d <= r.end) x += t.amt; return r2(x); }
function budStat(per, amt) {
  const r = rangeFor(per), spent = spentFromSpend(r), left = r2(amt - spent), days = diffDays(today(), r.end) + 1;
  if (!(amt > 0.004)) return `<p>${money(spent)} spent ${periodWord(r)}. Set an amount to see what’s left.</p>`;
  const pct = Math.min(100, spent / amt * 100), cls = left < -0.004 ? 'over' : spent / amt >= 0.8 ? 'warn' : '';
  return `<span class="bar thin ${cls}" role="img" aria-label="${Math.round(spent / amt * 100)}% of the budget ${periodWord(r)} used"><i style="width:${pct.toFixed(1)}%"></i></span>`
    + (left < -0.004 ? `<p class="over">${money(spent)} spent · ${money(-left)} over</p>`
      : `<p>${money(spent)} spent · <b>${money(left)} left</b>${days > 1 ? ` · about ${money(left / days)} a day for ${days} days` : ' for today'}</p>`);
}
function budgetRowsHtml() {
  const b = budgetNow();
  return BUD_PERS.map(per => { const r = rangeFor(per); return `<div class="bud-row"><span class="nm"><b>${BUD_NAME[per]}</b><span>${esc(rangeLabel(r))}</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="bud-${per}" data-budget="${per}" inputmode="decimal" value="${fmtIn(b[per])}" placeholder="0" aria-label="Budget ${BUD_NAME[per].toLowerCase()}"></div><div class="bud-stat" id="bud-${per}-stat">${budStat(per, b[per])}</div></div>`; }).join('');
}
function liveBudget(per, raw) { // while typing in one row, show the other two and every row's spent / left
  const am = budgetFrom(per, r2(parseMoney(raw)));
  for (const p of BUD_PERS) { if (p !== per) { const i = $(`#bud-${p}`); if (i && document.activeElement !== i) i.value = fmtIn(am[p]); } const st = $(`#bud-${p}-stat`); if (st) st.innerHTML = budStat(p, am[p]); }
}
function planBills() {
  const s = S.settings, act = activeBills(), mo = r2(sum(act.map(monthlyEq))), spendMo = r2(sum(act.filter(x => billFrom(x) === 'spend').map(monthlyEq)));
  const group = k => act.filter(x => (x.kind || 'sub') === k).sort(byNext);
  return `<section class="card"><div class="card-head"><h2>Bills & subscriptions</h2></div>
    ${act.length ? `<div class="grid2"><div><span class="eyebrow">Per month</span><div class="num" style="font-weight:700;font-size:1.15rem">${money(mo)}</div></div><div><span class="eyebrow">Per year</span><div class="num" style="font-weight:700;font-size:1.15rem">${money(mo * 12, { dp: 0 })}</div></div></div>
      ${+s.split.spend && spendMo ? `<p class="muted small">The ones paid from Spending take about ${Math.round(spendMo / s.split.spend * 100)}% of your ${mw(+s.split.spend)} monthly budget.</p>` : ''}`
      : `<p class="muted small">Add things you pay regularly: rent, your phone plan, insurance, Spotify. They show as due on Home, and Home shows what’s left after paying them. Nothing is recorded until you tap Paid.</p>`}
    <button class="btn" data-act="edit-bill">Add a bill or subscription</button></section>
  ${[['bill', 'Bills'], ['sub', 'Subscriptions']].map(([k, t]) => { const g = group(k); return g.length ? `<section class="card"><div class="card-head"><h2>${t}</h2><span class="muted small num">${money(sum(g.map(monthlyEq)))} a month</span></div><div>${g.map(x => billRow(x, x.next <= today() ? 'due' : 'pay')).join('')}</div></section>` : ''; }).join('')}`;
}
function planSpend() {
  const s = S.settings;
  return `<section class="card" aria-label="How much you can spend"><div class="card-head"><h2>How much you can spend</h2></div>
    <p class="muted small" style="margin-top:-6px">One budget, shown a week, a month and a year. Change any of them and the other two follow.</p>
    <div>${budgetRowsHtml()}</div>
    <p class="muted small">Counts what you spend from Spending, not from savings. Weeks run Monday to Sunday.</p></section>
  <section class="card"><div class="card-head"><h2>Month &amp; salary</h2><button class="link" data-act="income">Salary &amp; extras</button></div>
    <p class="small">Salary now: <b class="num">${money(Money.salaryAt(s.income, curKey()))}</b> a month${Money.sortSalary(s.income.salary).length > 1 ? ' · changes are planned' : ''}. Your savings % and goals are in the plan above.</p>
    <label class="field"><span>Month starts on the</span><select class="input" id="set-start" data-set="monthStart">${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}" ${s.monthStart === i + 1 ? 'selected' : ''}>${ordinal(i + 1)}</option>`).join('')}</select></label>
    <div class="field"><span>At the end of a month, leftover or overspent Spending</span><div class="seg" role="group" aria-label="At the end of a month"><button data-act="month-end" data-v="carry" aria-pressed="${carryOn()}">Stays in Spending</button><button data-act="month-end" data-v="savings" aria-pressed="${!carryOn()}">Moves to savings</button></div>
      <span class="hint">${carryOn() ? 'It carries into next month. Nothing moves to or from savings by itself.' : `Leftovers go to Savings → ${esc(otherCat().name)}, and overspending comes out of it.`}</span></div></section>
  <section class="card"><div class="card-head"><h2>Planned each month</h2><span class="muted small num" id="plan-total">${money(sum(s.labels.map(l => +l.plan || 0)))}</span></div>
    <p class="muted small" style="margin-top:-6px">What you expect to spend on each category out of your ${mw(r2(budgetNow().month))} monthly budget. Home uses it to project what’s left. It’s a plan, not a limit.</p>
    <div>${s.labels.map(l => `<div class="goal-in"><span class="nm"><b><i class="dot c${l.color ?? 8}"></i>${esc(l.name)}</b><span>${money(labelSpentFromSpend(l.id, periodAt(0)))} spent this month</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="plan-${esc(l.id)}" data-plan="${esc(l.id)}" inputmode="decimal" value="${+l.plan || ''}" placeholder="None" aria-label="Planned per month for ${esc(l.name)}"></div></div>`).join('')}</div>
    <div id="plan-check">${planCheckHtml()}</div></section>
  <section class="card"><div class="card-head"><h2>Bills & subscriptions</h2></div><p class="muted small">They have their own tab.</p><div><button class="btn ghost small" data-act="plan-tab" data-tab="bills">Open Bills</button></div></section>`;
}
/* Bills and plans together, per category taking whichever is larger so a bill inside a planned category isn't counted twice. */
function planCheckHtml() {
  const s = S.settings, spend = +s.split.spend || 0, billBy = {};
  for (const x of activeBills()) if (billFrom(x) === 'spend') { const lab = s.labels.some(l => l.id === x.label) ? x.label : defaultBillLabel(x.kind); billBy[lab] = (billBy[lab] || 0) + monthlyEq(x); }
  const ids = new Set([...Object.keys(billBy), ...s.labels.filter(l => +l.plan).map(l => l.id)]);
  const committed = r2(sum([...ids].map(id => Math.max(billBy[id] || 0, +(s.labels.find(l => l.id === id) || {}).plan || 0))));
  const free = r2(spend - committed);
  if (!committed) return '<p class="muted small">Nothing planned yet.</p>';
  return `<div class="split-show"><span>Bills and plans each month</span><span>${money(committed)}</span><span>${free >= 0 ? 'Not planned yet' : 'More than your budget'}</span><span style="${free < 0 ? 'color:var(--over)' : ''}">${money(Math.abs(free))}</span></div>${free < 0 ? `<p class="small" style="color:var(--over)">Your plans and bills come to ${money(-free)} more than your ${mw(spend)} monthly budget.</p>` : ''}`;
}
function planCats() {
  const s = S.settings, goals = s.saveCats.filter(c => c.goal), plain = s.saveCats.filter(c => !c.goal);
  return `<section class="card"><div class="card-head"><h2>Goals</h2><button class="link" data-act="go" data-view="goals">Open Goals</button></div>
    <p class="muted small" style="margin-top:-6px">${goals.filter(g => !g.done).length ? `${goals.filter(g => !g.done).length} open goal${goals.filter(g => !g.done).length === 1 ? '' : 's'}. Dates, monthly plans, priorities and timelines live in the Goals tab.` : 'Goals have their own tab: dates, monthly plans, priorities and timelines.'}</p>
    <button class="btn ghost" data-act="goal-edit">Add a goal</button></section>
  <section class="card"><div class="card-head"><h2>Savings categories</h2></div>
    <p class="muted small" style="margin-top:-6px">Optional. Each one holds its own money. Savings you don’t put in a category, and spending left over at month end, land in Other until you move them.</p>
    <div>${plain.map(c => `<button class="cat-link" data-act="savecat-edit" data-id="${esc(c.id)}"><span class="t"><b><i class="dot pc${c.color ?? 6}"></i>${esc(c.name)}</b><span>${money(saveBal(c.id))} saved${+c.target ? ` of ${mw(+c.target)}` : ''}${c.phases && c.phases.length ? ` · ${esc(phaseText(c, true))}` : ''}</span></span>${I.right}</button>`).join('')}</div>
    <button class="btn ghost" data-act="savecat-edit">Add a savings category</button></section>
  <section class="card"><div class="card-head"><h2>Expense categories</h2></div>
    <p class="muted small" style="margin-top:-6px">Optional. Pick one when you log spending to see where your money goes; without one it’s listed as Uncategorised. They don’t hold money: everything comes out of Spending. Set a planned amount to include it in Home’s projection.</p>
    <div>${s.labels.map(l => `<button class="cat-link" data-act="label-edit" data-id="${esc(l.id)}"><span class="t"><b><i class="dot c${l.color ?? 8}"></i>${esc(l.name)}</b><span>${money(labelSpent(l.id, rangeFor('month')))} spent this month${+l.plan ? ` · ${mw(+l.plan)} planned` : ''}</span></span>${I.right}</button>`).join('')}</div>
    <button class="btn ghost" data-act="label-edit">Add an expense category</button></section>
  <section class="card"><div class="card-head"><h2>Income categories</h2></div>
    <p class="muted small" style="margin-top:-6px">Where your money comes from. Pay is recorded as Salary.</p>
    <div>${(s.incomeCats || []).map(c => `<button class="cat-link" data-act="income-edit" data-id="${esc(c.id)}"><span class="t"><b><i class="dot c${c.color ?? 8}"></i>${esc(c.name)}</b><span>${money(sum(S.tx.filter(t => t.t === 'in' && incomeCat(t).id === c.id && t.d >= periodAt(0).start && t.d <= periodAt(0).end).map(t => t.amt)))} this month</span></span>${I.right}</button>`).join('')}</div>
    <button class="btn ghost" data-act="income-edit">Add an income category</button></section>`;
}
function planMore() {
  const s = S.settings;
  return appearanceCard() + customiseCard() + `<section class="card"><div class="card-head"><h2>Backup</h2></div>
    <div class="setting-row"><div class="t"><b>Export activity</b><span>CSV for Excel or Google Sheets</span></div><button class="btn ghost small" data-act="export-csv">Export</button></div>
    <div class="setting-row"><div class="t"><b>Download a backup</b><span>Everything, as a JSON file</span></div><button class="btn ghost small" data-act="export-json">Download</button></div>
    <div class="setting-row"><div class="t"><b>Restore from a backup</b><span>Replaces what’s here now</span></div><label class="btn ghost small" for="restore-file">Choose file</label><input type="file" id="restore-file" accept=".json,application/json" hidden></div></section>
  <section class="card"><div class="card-head"><h2>Settings</h2></div>
    <label class="field"><span>Currency symbol</span><input class="input" id="set-symbol" data-set="symbol" value="${esc(s.symbol)}" maxlength="4" style="max-width:8rem"></label>
    <p class="muted small">${S.mode === 'demo' ? 'This is example data, so nothing here is saved.' : S.local ? 'Saved in this browser, on this device only. Download a backup now and then. A backup from here also restores into the claude.ai version, and the other way round.' : 'Saved to your claude.ai account, so it’s the same on any device where you’re signed in. Private to you, even if you share this page.'}</p>
    <button class="btn danger" data-act="reset" style="align-self:flex-start">${S.mode === 'demo' ? 'Clear the example data' : 'Delete all my data'}</button></section>`;
}
function viewOnboard() {
  const d = S.draft;
  return `<section class="ob-hero"><span class="eyebrow">Spend &amp; Save</span><h2>Know what you can spend, save and put towards goals</h2><p class="muted">Start with what you have and your pay. Next you’ll set your savings %, any salary changes coming, and your goals.</p></section>
  <section class="card">
    <label class="field"><span>Money you have now <span class="hint">optional</span></span><div class="money-in" data-sym="S$"><input class="input" id="ob-have" data-draft="have" inputmode="decimal" value="${S.obHave || ''}" placeholder="0"></div><span class="hint">Your bank accounts and cash together. It starts in Savings → Other, and you can sort it into categories later.</span></label>
    <div class="grid2"><label class="field"><span>Monthly take-home pay</span><div class="money-in" data-sym="S$"><input class="input" id="ob-pay" data-draft="pay" inputmode="decimal" value="${d.pay || ''}"></div></label>
    <label class="field"><span>Budget a month</span><div class="money-in" data-sym="S$"><input class="input" id="ob-spend" data-draft="spend" inputmode="decimal" value="${d.split.spend || ''}"></div></label></div>
    <p class="muted small">Your budget is how much you plan to spend. Plan → Budget shows it a week, a month and a year.</p></section>
  <button class="btn block" data-act="ob-finish">Start</button>
  <div class="ob-restore"><p class="muted small">Already use Spend &amp; Save? Bring your data across from a backup file.</p><label class="btn ghost block" for="restore-file">Restore from a backup</label><input type="file" id="restore-file" accept=".json,application/json" hidden><button class="linkbtn" data-act="try-demo" style="align-self:center">Explore with example data first</button></div>`;
}

/* ---------- sheets ---------- */
function openSheet(title, body, onMount) {
  closeSheet(); const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-backdrop" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-grab"></div><div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="close-sheet" aria-label="Close">${I.close}</button></div><div class="sheet-body">${body}</div></div>`;
  root.hidden = false; document.body.classList.add('sheet-open'); requestAnimationFrame(() => root.classList.add('open'));
  if (onMount) onMount($('.sheet', root));
}
function closeSheet() { const root = $('#sheet-root'); if (root.hidden) return; root.classList.remove('open'); root.hidden = true; root.innerHTML = ''; document.body.classList.remove('sheet-open'); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
});
function armDanger(btn, text, fn) { if (btn.dataset.armed) { fn(); return; } const o = btn.textContent; btn.dataset.armed = '1'; btn.textContent = text; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = o; } }, 4000); }
const kindSeg = cur => `<div class="seg" role="group" aria-label="What happened"><button data-act="kind" data-v="out" aria-pressed="${cur === 'out'}">Spent</button><button data-act="kind" data-v="in" aria-pressed="${cur === 'in'}">Money in</button><button data-act="kind" data-v="move" aria-pressed="${cur === 'move'}">Move</button></div>`;
function switchKind(v, amt) { if (v === 'out') openSpend(null, { amt }); else if (v === 'in') openIn(null, { amt }); else openMove(null, { amt }); }
const spendLeftOn = (ds, existing) => { let l = spendMonth(periodFor(ds)).left; if (existing && existing.t === 'out' && existing.from === 'spend' && periodFor(existing.d).start === periodFor(ds).start) l += existing.amt; return r2(l); };

/* spending */
function openSpend(existing, preset = {}) {
  const s = S.settings;
  const T = existing ? Object.assign(clone(existing), preset) : Object.assign({ t: 'out', amt: '', label: '', note: '', d: today(), from: 'spend' }, preset);
  T.amt = T.amt === '' || T.amt == null ? '' : String(T.amt);
  let showSave = T.from !== 'spend';
  function hint(a) {
    if (T.from !== 'spend') { const c = saveCat(T.from); let b = saveBal(c.id); if (existing && existing.from === c.id) b += existing.amt; return `<span class="warnbox">${I.warn}<span>This takes money out of <b>Savings → ${esc(c.name)}</b>. It has ${money(b)}. You’ll be asked to confirm.</span></span>`; }
    const left = spendLeftOn(T.d, existing);
    if (a > 0 && a > left + 0.004) return `<span class="warnbox soft">${I.warn}<span>Spending has ${money(left)} left this month. This puts it ${money(a - left)} over. ${carryOn() ? 'It comes out of next month’s Spending.' : 'At month end that comes out of Savings → Other.'}</span></span>`;
    // for this month, also what's left a day after this spend (same sum as Home's "How much you can spend")
    const cur = periodAt(0), after = r2(left - (a > 0 ? a : 0)), days = diffDays(today(), cur.end) + 1;
    const perDay = T.d >= cur.start && T.d <= cur.end && after > 0.004 ? ` · about ${money(after / days)} a day for ${days} day${days === 1 ? '' : 's'}` : '';
    return `<span class="muted">Spending has ${money(left)} left${a > 0 ? `, ${money(left - a)} after this` : ''}${perDay}.</span>`;
  }
  const whereBtn = (id, sub) => `<button data-act="sp-from" data-v="${esc(id)}" aria-pressed="${T.from === id}"><b><i class="dot ${id === 'spend' ? 'rs' : 'pc' + (saveCat(id).color ?? 6)}"></i>${esc(id === 'spend' ? 'Spending' : saveCat(id).name)}</b><span>${esc(sub)}</span></button>`;
  const body = () => {
    const a = r2(parseMoney(T.amt));
    return `<div class="form">${existing ? '' : kindSeg('out')}
      <label class="amount-big"><span>${esc(sym())}</span><input id="sp-amt" inputmode="decimal" placeholder="0.00" value="${esc(T.amt)}" aria-label="Amount" autocomplete="off"></label>
      <div class="field"><span>Category <span class="hint">optional</span></span><div class="chips" role="group" aria-label="Category (optional)">${s.labels.map(l => `<button class="chip" data-act="sp-label" data-v="${esc(l.id)}" aria-pressed="${T.label === l.id}"><i class="dot c${l.color ?? 8}"></i>${esc(l.name)}</button>`).join('')}<button class="chip new" data-act="sp-newlabel">+ New category</button></div></div>
      <div class="field"><span>Paid from</span><div class="pick">${whereBtn('spend', `${money(spendLeftOn(T.d, existing))} left`)}${showSave ? s.saveCats.map(c => whereBtn(c.id, `${money(saveBal(c.id))} · savings`)).join('') : ''}</div>
        ${!showSave ? `<button class="linkbtn muted" data-act="sp-showsave">Pay from savings instead</button>` : ''}</div>
      <p class="small" id="sp-hint">${hint(a)}</p>
      <div class="grid2"><label class="field"><span>Date</span><input class="input" type="date" id="sp-date" value="${esc(T.d)}"></label><label class="field"><span>Note <span class="hint">optional</span></span><input class="input" id="sp-note" value="${esc(T.note)}" placeholder="e.g. Chicken rice" autocomplete="off"></label></div>
      <p class="small" id="sp-err" style="color:var(--over)" hidden></p>
      <div class="btn-row"><button class="btn ${T.from !== 'spend' ? 'danger' : ''}" data-act="sp-save">${T.from !== 'spend' ? `Take from ${esc(saveCat(T.from).name)}` : existing ? 'Save changes' : 'Add spending'}</button>${existing ? '<button class="btn danger" data-act="sp-del">Delete</button>' : ''}</div></div>`;
  };
  const paint = () => { $('.sheet-body').innerHTML = body(); };
  openSheet(existing ? 'Edit spending' : 'Add', body(), sheet => {
    if (!existing) setTimeout(() => { const a = $('#sp-amt'); if (a && matchMedia('(pointer:fine)').matches) a.focus(); }, 60);
    const onIn = e => { const id = e.target.id; if (id === 'sp-amt') T.amt = e.target.value; if (id === 'sp-date') T.d = e.target.value || today(); if (id === 'sp-note') T.note = e.target.value; if (id === 'sp-amt' || id === 'sp-date') $('#sp-hint').innerHTML = hint(r2(parseMoney(T.amt))); };
    sheet.addEventListener('input', onIn); sheet.addEventListener('change', onIn);
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'kind' && b.dataset.v !== 'out') switchKind(b.dataset.v, T.amt);
      if (a === 'sp-label') { T.label = T.label === b.dataset.v ? '' : b.dataset.v; $$('[data-act="sp-label"]', sheet).forEach(x => x.setAttribute('aria-pressed', x.dataset.v === T.label)); } // tap again to clear
      if (a === 'sp-newlabel') { const keep = { amt: T.amt, note: T.note, d: T.d, from: T.from }; openLabelEdit(null, { onSaved: nid => openSpend(existing, { ...keep, label: nid }), onDone: () => openSpend(existing, { ...keep, label: T.label }) }); }
      if (a === 'sp-from') { T.from = b.dataset.v; paint(); }
      if (a === 'sp-showsave') { showSave = true; paint(); }
      if (a === 'sp-del') armDanger(b, 'Tap again to delete', () => { removeTx([existing.id]); closeSheet(); toast('Deleted'); });
      if (a === 'sp-save') {
        const amt = r2(parseMoney(T.amt)), err = $('#sp-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!(amt > 0)) return fail('Enter an amount above zero.');
        const go = () => {
          const tx = { id: existing ? existing.id : newId(), d: T.d, t: 'out', amt, label: T.label || '', from: T.from, note: (T.note || '').trim() };
          existing ? replaceTx(existing.id, tx) : addTx([tx]); closeSheet();
          if (T.from !== 'spend') toast(`${money(amt)} taken from Savings → ${saveCat(T.from).name}. ${money(saveBal(T.from))} left there.`, 'warn', 4500);
          else { const left = spendMonth(periodFor(T.d)).left; if (left < 0) toast(`Spending is ${money(-left)} over this month`, 'over', 4500); else toast(`${money(left)} left to spend this month`); }
        };
        if (T.from !== 'spend' && !(existing && existing.from === T.from)) armDanger(b, `Tap again to take ${money(amt)} from ${saveCat(T.from).name}`, go); else go();
      }
    });
  });
}

/* money in. Pay and other money both go where you choose: Spending, Savings (a category is optional; none = Other)
   or split between them. Nothing is split for you. Other money can remember its last split per income category. */
function openIn(existing, preset = {}) {
  const s = S.settings, incs = s.incomeCats || [];
  const M = existing ? { src: existing.src, cat: incomeCat(existing).id, amt: String(existing.amt), d: existing.d, note: existing.note || '', dest: existing.spend > 0 ? 'spend' : (Object.keys(existing.save || {})[0] || 'other'), forNext: !!existing.for }
    : Object.assign({ src: 'pay', cat: '', amt: '', d: today(), note: '', dest: '', forNext: false, extraId: '' }, preset);
  if (M.amt == null) M.amt = '';
  const salNow = Money.salaryAt(s.income, curKey()); if (!existing && M.src === 'pay' && M.amt === '' && salNow > 0) M.amt = String(salNow);
  if (M.src === 'other' && (!M.cat || M.cat === 'salary' && !existing)) M.cat = (incs.find(c => c.id !== 'salary') || incs[0] || NOINCOME).id;
  /* splitting: parts are percentages (mode 'pct') or amounts (mode 'amt'), keyed by 'spend' or a savings category */
  const SP = { mode: 'pct', parts: {} };
  const splitDests = () => [['spend', 'Spending', 'this month', 'rs'], ...s.saveCats.filter(c => !c.done || +SP.parts[c.id] > 0).map(c => [c.id, c.id === 'other' ? `Savings → ${c.name}` : c.name, c.id === 'other' ? 'savings, sort later' : c.goal ? 'goal' : 'savings', 'pc' + (c.color ?? 6)])];
  function applyRemembered(cat) {
    M.planSplit = false;
    const r = s.incomeSplits && s.incomeSplits[cat], ok = k => k === 'spend' || s.saveCats.some(c => c.id === k && !c.done);
    const keys = r ? Object.keys(r.pct || {}).filter(k => ok(k) && +r.pct[k] > 0) : [];
    if (keys.length === 1) { M.dest = keys[0]; SP.parts = {}; }
    else if (keys.length > 1) { M.dest = 'split'; SP.mode = 'pct'; SP.parts = {}; for (const k of keys) SP.parts[k] = +r.pct[k]; }
    else { M.dest = 'other'; SP.parts = {}; }
  }
  if (existing) { const parts = { ...(existing.spend > 0 ? { spend: existing.spend } : {}), ...(existing.save || {}) }; if (Object.keys(parts).filter(k => +parts[k] > 0).length > 1) { M.dest = 'split'; SP.mode = 'amt'; SP.parts = parts; } }
  else if (M.src === 'other' && !('dest' in preset)) applyRemembered(M.cat);
  if (!existing && !('dest' in preset) && (M.src === 'pay' || M.extraId)) usePlan();
  const mainOf = d => M.planSplit && d === 'split' ? 'plan' : d === 'spend' || d === 'split' ? d : d ? 'save' : '';
  const destHtml = () => {
    const main = mainOf(M.dest), cats = s.saveCats.filter(c => c.id !== 'other' && !c.done), sel = main === 'save' && M.dest !== 'other' ? saveCat(M.dest) : null;
    let hint = '';
    if (main === 'save') { if (!sel) hint = `None picked: it goes to Savings → ${esc(otherCat().name)}, to sort later.`; else { hint = `Goes to ${esc(sel.name)} (${money(saveBal(sel.id))} there now)`; if (sel.goal && !sel.done) { const it = monthItems().find(x => x.id === sel.id); hint += it && it.due > 0.004 ? ` · needs ${money(it.due)} this month` : ''; } hint += '.'; } }
    return `<div class="field"><span>Where should it go?</span><div class="seg" role="group" aria-label="Where it goes"><button data-act="in-dest" data-v="plan" aria-pressed="${main === 'plan'}">${M.src === 'pay' ? 'My plan' : 'Goals + spend'}</button><button data-act="in-dest" data-v="spend" aria-pressed="${main === 'spend'}">Spending</button><button data-act="in-dest" data-v="other" aria-pressed="${main === 'save'}">Savings</button><button data-act="in-dest" data-v="split" aria-pressed="${main === 'split'}">Split it</button></div>
      ${main === 'spend' ? '<span class="hint">Adds to Spending for that month.</span>' : main === '' ? '<span class="hint">Pick Spending, Savings, or split it between them.</span>' : ''}</div>
      ${main === 'save' ? `<div class="field"><span>Savings category <span class="hint">optional</span></span><div class="chips" role="group" aria-label="Savings category (optional)">${cats.map(c => `<button class="chip" data-act="in-savecat" data-v="${esc(c.id)}" aria-pressed="${M.dest === c.id}"><i class="dot pc${c.color ?? 6}"></i>${esc(c.name)}${c.goal ? ' · goal' : ''}</button>`).join('')}${existing ? '' : '<button class="chip new" data-act="in-newcat">+ New</button>'}</div><span class="hint">${hint}</span></div>` : ''}
      ${main === 'plan' ? planHtml() : ''}${main === 'split' ? splitHtml() : ''}
      ${main === 'spend' || main === 'split' || main === 'plan' ? forHtml() : ''}`;
  };
  // which month the Spending part is for: the month it came in, or the next one (pay that lands late in a month)
  const forMonths = () => { const p = periodFor(M.d || today()); return [p, mkPeriod(addMonths(p.start, 1))]; };
  const forHtml = () => {
    const [p, n] = forMonths();
    return `<div class="field"><span>Spending money is for</span><div class="seg" role="group" aria-label="Spending money is for"><button data-act="in-for" data-v="0" aria-pressed="${!M.forNext}">${esc(monthName(p))}</button><button data-act="in-for" data-v="1" aria-pressed="${!!M.forNext}">${esc(monthName(n))}</button></div>
      <span class="hint">${M.forNext ? `Counts as ${esc(monthName(n))}’s Spending, starting ${esc(fmtD(n.start))}.` : `Counts as ${esc(monthName(p))}’s Spending. Pick ${esc(monthName(n))} if this is money you’ll live on next month.`}${['split', 'plan'].includes(mainOf(M.dest)) ? ' Applies to the Spending part.' : ''}</span></div>`;
  };
  const body = () => `<div class="form">${existing ? '' : kindSeg('in')}
    <div class="seg" role="group" aria-label="Kind of money"><button data-act="in-src" data-v="pay" aria-pressed="${M.src === 'pay'}">Pay</button><button data-act="in-src" data-v="other" aria-pressed="${M.src === 'other'}">Other money</button></div>
    <label class="amount-big"><span>${esc(sym())}</span><input id="in-amt" inputmode="decimal" placeholder="0.00" value="${esc(M.amt)}" aria-label="Amount" autocomplete="off"></label>
    ${M.src === 'pay' ? `<p class="muted small" style="margin-top:-6px">Recorded as Salary.</p>`
      : `<div class="field"><span>What kind of money?</span><div class="chips" role="group" aria-label="Income category">${incs.map(c => `<button class="chip" data-act="in-cat" data-v="${esc(c.id)}" aria-pressed="${M.cat === c.id}"><i class="dot c${c.color ?? 8}"></i>${esc(c.name)}</button>`).join('')}<button class="chip new" data-act="in-newinc">+ New</button></div></div>${expectedChips()}`}
    ${destHtml()}
    <div class="grid2"><label class="field"><span>Date</span><input class="input" type="date" id="in-date" value="${esc(M.d)}"></label><label class="field"><span>Note <span class="hint">optional</span></span><input class="input" id="in-note" value="${esc(M.note)}" placeholder="${M.src === 'pay' ? 'e.g. November pay' : 'e.g. Tuition, ang bao'}" autocomplete="off"></label></div>
    <p class="small" id="in-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="in-save">${existing ? 'Save changes' : M.src === 'pay' ? 'Log pay' : 'Add money'}</button>${existing ? '<button class="btn danger" data-act="in-del">Delete</button>' : ''}</div></div>`;
  function splitHtml() {
    return `<div class="field"><div class="card-head"><span>Split it</span><div class="seg mini" role="group" aria-label="Split by"><button data-act="sp-mode" data-v="pct" aria-pressed="${SP.mode === 'pct'}">%</button><button data-act="sp-mode" data-v="amt" aria-pressed="${SP.mode === 'amt'}">${esc(sym())}</button></div></div>
      <div>${splitDests().map(([id, name, sub, dot]) => `<div class="goal-in"><span class="nm"><b><i class="dot ${dot}"></i>${esc(name)}</b><span id="spx-${esc(id)}">${esc(sub)}</span></span><div class="${SP.mode === 'pct' ? 'pct-in' : 'money-in'}" ${SP.mode === 'amt' ? `data-sym="${esc(sym())}"` : ''}><input class="input" id="sp-${esc(id)}" data-split="${esc(id)}" inputmode="decimal" value="${SP.parts[id] ? SP.parts[id] : ''}" placeholder="0" aria-label="${SP.mode === 'pct' ? 'Percent' : 'Amount'} to ${esc(name)}"></div></div>`).join('')}</div>
      <p class="small" id="sp-sum"></p>${M.src === 'other' ? `<span class="hint">Remembered for ${esc((incs.find(c => c.id === M.cat) || NOINCOME).name)} next time.</span>` : ''}</div>`;
  }
  /* "My plan" for pay, "Goals + spend" for other money: the split filled in for you, every amount still editable */
  function usePlan() {
    const a = r2(parseMoney(M.amt)); M.dest = 'split'; M.planSplit = true; SP.mode = 'amt'; SP.touched = false; SP.parts = {};
    if (!(a > 0)) return;
    if (M.src === 'pay') { const pr = paydayRows(a, M.forNext); SP.parts.spend = pr.spend; for (const r of pr.rows.slice(1)) if (r.got > 0.004) SP.parts[r.key] = r2((SP.parts[r.key] || 0) + r.got); }
    else { const x = M.extraId ? ((s.income.extras || []).find(e => e.id === M.extraId) || {}) : {}; Object.assign(SP.parts, extraParts(a, x.alloc || {})); }
  }
  function planBarHtml() {
    const am = SP.parts, list = Object.keys(am).filter(k => +am[k] > 0).map(k => ({ name: k === 'spend' ? 'Spending' : saveCat(k).name, v: +am[k], color: k === 'spend' ? ROLE.spend : saveCat(k).goal || (saveCat(k).phases || []).length ? goalColor(saveCat(k)) : ROLE.save }));
    return segBar(list, { big: true }) + `<div class="plan-legend">${list.map(x => `<span><i class="key" style="background:${x.color}"></i>${esc(x.name)} <b class="num">${mw(x.v)}</b></span>`).join('')}</div>`;
  }
  function planHtml() {
    const a = r2(parseMoney(M.amt)), pr = M.src === 'pay' && a > 0 ? paydayRows(a, M.forNext) : null;
    return `<div class="banner">${M.src === 'pay' ? `Filled in from your plan: bills still due stay in Spending, ${esc(s.savePct)}% goes to savings, then your goals in priority order. The rest is spending money.` : `Filled in from your extras rule: ${esc(s.extraGoalPct ?? 50)}% to goals in priority order, the rest to Spending.`} Change any amount below.</div>
      ${pr && pr.short.length ? `<p class="status warn">${I.warn}Not enough for everything this month: ${esc(pr.short.map(r => r.name).join(', '))} get${pr.short.length === 1 ? 's' : ''} less.</p>` : ''}
      <div id="plan-bar">${planBarHtml()}</div>${splitHtml()}`;
  }
  function refreshPlanInputs() { $$('[data-split]').forEach(i => { const v = SP.parts[i.dataset.split]; i.value = v ? v : ''; }); const pb = $('#plan-bar'); if (pb) pb.innerHTML = planBarHtml(); }
  function expectedChips() { // other money: is this an extra you were expecting?
    const list = ((s.income && s.income.extras) || []).filter(x => !x.gone && (!x.got || x.id === M.extraId) && x.month <= Money.keyAdd(curKey(), 1));
    if (!list.length || existing) return '';
    return `<div class="field"><span>Is this one you were expecting? <span class="hint">optional</span></span><div class="chips" role="group" aria-label="Expected extras">${list.map(x => `<button class="chip" data-act="in-extra" data-v="${esc(x.id)}" aria-pressed="${M.extraId === x.id}">${esc(x.name || 'Extra')} · ${mw(x.amt)} · ${esc(keyShort(x.month))}</button>`).join('')}</div></div>`;
  }
  /* turn the split into exact amounts: percentages are scaled to the total in cents, any rounding remainder goes to the biggest part */
  function splitAmounts(total) {
    const keys = Object.keys(SP.parts).filter(k => +SP.parts[k] > 0), out = {};
    if (SP.mode === 'amt') { for (const k of keys) out[k] = r2(+SP.parts[k]); return out; }
    const pctSum = sum(keys.map(k => +SP.parts[k])); if (!pctSum) return out;
    const T = Math.round(total * 100); let used = 0, big = keys[0];
    for (const k of keys) { const c = Math.round(T * SP.parts[k] / pctSum); out[k] = c; used += c; if (+SP.parts[k] > +SP.parts[big]) big = k; }
    out[big] += T - used; for (const k of keys) out[k] = out[k] / 100;
    return out;
  }
  function splitState() {
    const a = r2(parseMoney(M.amt)), keys = Object.keys(SP.parts).filter(k => +SP.parts[k] > 0);
    if (SP.mode === 'pct') { const ps = r2(sum(keys.map(k => +SP.parts[k]))), left = r2(100 - ps); return { ok: keys.length > 0 && Math.abs(left) <= 0.1001, left, txt: Math.abs(left) <= 0.1001 ? (keys.length ? `All ${money(a)} is split ✓` : '') : left > 0 ? `${left}% (${money(a * left / 100)}) left to put somewhere` : `${-left}% too much. Take some off.` }; }
    const as = r2(sum(keys.map(k => +SP.parts[k]))), left = r2(a - as);
    return { ok: keys.length > 0 && Math.abs(left) < 0.005, left, txt: Math.abs(left) < 0.005 ? (keys.length ? `All ${money(a)} is split ✓` : '') : left > 0 ? `${money(left)} left to put somewhere` : `${money(-left)} more than came in. Take some off.` };
  }
  function refreshSplit() {
    const pb = $('#plan-bar'); if (pb) pb.innerHTML = planBarHtml(); const el = $('#sp-sum'); if (!el) return; const st = splitState();
    el.textContent = st.txt || 'Type how much goes where.'; el.style.color = st.ok ? 'var(--good)' : st.left < 0 ? 'var(--over)' : 'var(--muted)';
    if (SP.mode === 'pct') { const am = splitAmounts(r2(parseMoney(M.amt))); for (const [id, , sub] of splitDests()) { const x = $(`#spx-${id}`); if (x) x.textContent = +SP.parts[id] > 0 && st.ok ? `= ${money(am[id] || 0)}` : +SP.parts[id] > 0 ? `≈ ${money(parseMoney(M.amt) * SP.parts[id] / 100)}` : sub; } }
  }
  openSheet(existing ? 'Edit money in' : 'Add', body(), sheet => {
    const onIn = e => {
      const t = e.target;
      if (t.id === 'in-amt') { M.amt = t.value; if (M.planSplit && !SP.touched) { usePlan(); refreshPlanInputs(); } }
      if (t.dataset.split) { SP.parts[t.dataset.split] = t.value.trim() === '' ? '' : r2(parseMoney(t.value)); SP.touched = true; }
      if (t.id === 'in-date') { M.d = t.value || today(); if (e.type === 'change' && $('[data-act="in-for"]')) { repaint(); return; } } // month names follow the date
      if (t.id === 'in-note') M.note = t.value;
      refreshSplit();
    };
    sheet.addEventListener('input', onIn); sheet.addEventListener('change', onIn);
    refreshSplit();
    const repaint = () => { $('.sheet-body').innerHTML = body(); refreshSplit(); };
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'kind' && b.dataset.v !== 'in') switchKind(b.dataset.v, M.amt);
      if (a === 'in-src' && b.dataset.v !== M.src) {
        M.src = b.dataset.v;
        if (M.src === 'pay') { if (!M.amt && salNow > 0) M.amt = String(salNow); if (!existing) usePlan(); } // pay never starts pre-split
        else { if (!M.cat || M.cat === 'salary') M.cat = (incs.find(c => c.id !== 'salary') || incs[0] || NOINCOME).id; if (!existing) applyRemembered(M.cat); }
        repaint();
      }
      if (a === 'in-cat') { M.cat = b.dataset.v; if (!existing) applyRemembered(M.cat); repaint(); }
      if (a === 'in-extra') { const x = (s.income.extras || []).find(e => e.id === b.dataset.v); if (!x || M.extraId === x.id) M.extraId = ''; else { M.extraId = x.id; if (x.cat) M.cat = x.cat; if (!M.amt) M.amt = String(x.amt); if (!M.note && x.name) M.note = x.name; usePlan(); } repaint(); }
      if (a === 'in-newinc') { const keep = { src: 'other', amt: M.amt, d: M.d, note: M.note, dest: M.dest }; openIncomeCatEdit(null, { onSaved: nid => openIn(existing, { ...keep, cat: nid }), onDone: () => openIn(existing, { ...keep, cat: M.cat }) }); }
      if (a === 'in-dest') { const v = b.dataset.v; if (v === 'plan') { usePlan(); repaint(); return; } M.planSplit = false; if (!(v === 'other' && mainOf(M.dest) === 'save')) { M.dest = v; repaint(); } }
      if (a === 'in-savecat') { M.dest = M.dest === b.dataset.v ? 'other' : b.dataset.v; repaint(); } // tap again for no category
      if (a === 'in-for') { M.forNext = b.dataset.v === '1'; if (M.planSplit && !SP.touched) usePlan(); repaint(); }
      if (a === 'sp-mode' && b.dataset.v !== SP.mode) { // keep the same split when switching between % and amounts
        const a0 = r2(parseMoney(M.amt));
        if (b.dataset.v === 'amt') { const am = a0 > 0 ? splitAmounts(a0) : {}; SP.parts = {}; for (const k in am) SP.parts[k] = am[k]; }
        else { const np = {}; for (const k in SP.parts) if (+SP.parts[k] > 0 && a0 > 0) np[k] = r2(SP.parts[k] / a0 * 100); SP.parts = np; }
        SP.mode = b.dataset.v; repaint();
      }
      if (a === 'in-newcat') { const keep = { src: M.src, cat: M.cat, amt: M.amt, d: M.d, note: M.note }; openSaveCatEdit(null, { onSaved: nid => openIn(null, { ...keep, dest: nid }), onDone: () => openIn(null, { ...keep, dest: M.dest }) }); }
      if (a === 'in-del') { // moves that changed this entry are records of it, so they go with it
        const linked = S.tx.filter(t => t.t === 'move' && t.via === existing.id).map(t => t.id);
        armDanger(b, linked.length ? `Tap again (its ${linked.length === 1 ? 'move goes' : `${linked.length} moves go`} too)` : 'Tap again to delete', () => { removeTx([existing.id, ...linked]); closeSheet(); toast(linked.length ? `Deleted, with ${linked.length} move record${linked.length === 1 ? '' : 's'}` : 'Deleted'); });
      }
      if (a === 'in-save') {
        const amt = r2(parseMoney(M.amt)), err = $('#in-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!(amt > 0)) return fail('Enter an amount above zero.');
        if (!M.dest) return fail('Pick where this money goes: Spending, Savings, or split it.');
        let spend = 0, save = {};
        if (M.dest === 'split') {
          const st = splitState(); if (!st.ok) return fail(SP.mode === 'pct' ? `The split adds up to ${r2(100 - st.left)}%. It needs to come to 100%.` : `The split adds up to ${money(amt - st.left)} of ${money(amt)}.`);
          for (const [k, v] of Object.entries(splitAmounts(amt))) { if (!(v > 0)) continue; if (k === 'spend') spend = r2(v); else save[k] = r2(v); }
        } else if (M.dest === 'spend') spend = amt; else save = { [M.dest]: amt };
        if (M.src === 'other' && M.cat && !M.planSplit) { // remember this split (as percentages) for the next time this kind of money comes in
          const pct = {}; if (spend > 0) pct.spend = r2(spend / amt * 100); for (const [k, v] of Object.entries(save)) pct[k] = r2(v / amt * 100);
          s.incomeSplits = { ...(s.incomeSplits || {}), [M.cat]: { pct } }; persist('settings');
        }
        const forKey = M.forNext && spend > 0 ? addMonths(periodFor(M.d).start, 1).slice(0, 7) : null; // Spending meant for next month
        const tx = { id: existing ? existing.id : newId(), d: M.d, t: 'in', src: M.src, cat: M.src === 'pay' ? 'salary' : (M.cat || NOINCOME.id), amt, spend, save, note: (M.note || '').trim(), ...(forKey ? { for: forKey } : {}), ...(M.extraId ? { extra: M.extraId } : {}) };
        if (M.extraId) { const x = (s.income.extras || []).find(e => e.id === M.extraId); if (x) { x.got = tx.id; persist('settings'); } }
        existing ? replaceTx(existing.id, tx) : addTx([tx]); closeSheet();
        toast(`${money(amt)} in: ${[spend ? `Spending ${mw(spend)}${forKey ? ` for ${forName(forKey)}` : ''}` : '', ...Object.entries(save).map(([k, v]) => `${saveCat(k).name} ${mw(v)}`)].filter(Boolean).join(', ')}`, '', 4500);
      }
    });
  });
}

/* moves. A move can come out of a money-in entry you pick ("Take it from"): that entry's split changes and the
   move is kept as a record-only line (via = entry id). With "None" it's an ordinary move that changes balances. */
function openMove(existing, preset = {}) {
  const s = S.settings;
  // a new move saves money by default: Spending → Savings, with no category (Other)
  const V = existing ? { from: existing.from, to: existing.to, amt: String(existing.amt), d: existing.d, note: existing.note || '', via: existing.via || '', viaTouched: true }
    : Object.assign({ from: 'spend', to: 'other' }, { amt: '', d: today(), note: '', via: null, viaTouched: false }, preset);
  if (V.from === V.to) V.to = V.from === 'other' ? firstSorted() : 'other';
  if (V.amt == null) V.amt = '';
  let cs = [];
  const pickVia = () => { // keep the chosen entry if it still fits From/To/date; otherwise the newest entry with enough there
    cs = viaChoices(V, existing);
    if (V.viaTouched && (V.via === '' || cs.some(x => x.t.id === V.via))) return;
    const want = r2(parseMoney(V.amt)), fit = cs.find(x => !(want > 0) || x.avail >= want - 0.004);
    V.via = fit ? fit.t.id : (want > 0 ? '' : (cs[0] ? cs[0].t.id : ''));
  };
  pickVia();
  const opt = (v, id, l) => `<option value="${esc(id)}" ${v === id ? 'selected' : ''}>${esc(l)}</option>`;
  const opts = v => opt(v, 'spend', `Spending (${money(spendLeftOn(V.d, null))} left)`) + `<optgroup label="Savings">${s.saveCats.map(c => opt(v, c.id, `${c.name}${c.id === 'other' ? ' · no category' : ''} (${money(saveBal(c.id))})`)).join('')}</optgroup>`;
  const risky = () => V.from !== 'spend' && V.to === 'spend';
  const viaHint = () => V.via ? 'That money-in entry will show the new split. This move stays in Activity as a record.'
    : cs.length ? 'Saved as a separate move. Your money-in entries stay as they are.'
    : `None of your money-in entries${V.from === 'spend' || V.to === 'spend' ? ' this month' : ''} has money in ${esc(whereName(V.from))}, so this is saved as a separate move.`;
  const body = () => `<div class="form">${existing ? '' : kindSeg('move')}
    <label class="amount-big"><span>${esc(sym())}</span><input id="mv-amt" inputmode="decimal" placeholder="0.00" value="${esc(V.amt)}" aria-label="Amount"></label>
    <label class="field"><span>From</span><select class="input" id="mv-from">${opts(V.from)}</select></label>
    <label class="field"><span>To</span><select class="input" id="mv-to">${opts(V.to)}</select>${V.to === 'other' ? `<span class="hint">A savings category is optional. ${esc(otherCat().name)} holds savings you haven’t sorted yet.</span>` : ''}</label>
    <label class="field"><span>Take it from</span><select class="input" id="mv-via">${cs.map(x => opt(V.via, x.t.id, `${incomeCat(x.t).name} · ${fmtD(x.t.d)} · has ${money(x.avail)}`)).join('')}${opt(V.via, '', 'None: save as a separate move')}</select><span class="hint">${viaHint()}</span></label>
    ${existing ? '' : '<button class="linkbtn" data-act="mv-newcat" style="align-self:flex-start">+ New savings category</button>'}
    ${risky() ? `<span class="warnbox">${I.warn}<span>This moves savings into Spending. You’ll be asked to confirm.</span></span>` : ''}
    <div class="grid2"><label class="field"><span>Date</span><input class="input" type="date" id="mv-date" value="${esc(V.d)}"></label><label class="field"><span>Note <span class="hint">optional</span></span><input class="input" id="mv-note" value="${esc(V.note)}"></label></div>
    <p class="small" id="mv-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn ${risky() ? 'danger' : ''}" data-act="mv-save">${existing ? 'Save changes' : 'Move money'}</button>${existing ? '<button class="btn danger" data-act="mv-del">Delete</button>' : ''}</div></div>`;
  const repaint = () => { pickVia(); $('.sheet-body').innerHTML = body(); };
  openSheet(existing ? 'Edit move' : 'Add', body(), sheet => {
    const onIn = e => {
      const t = e.target;
      if (t.id === 'mv-amt') V.amt = t.value;
      if (t.id === 'mv-note') V.note = t.value;
      if (e.type !== 'change') return;
      if (t.id === 'mv-amt' && !V.viaTouched) { // re-pick an entry that holds enough, without redrawing the form
        const before = V.via; pickVia(); const sel = $('#mv-via');
        if (sel && V.via !== before) { sel.value = V.via; const h = sel.parentElement.querySelector('.hint'); if (h) h.innerHTML = viaHint(); }
      }
      if (t.id === 'mv-date') { V.d = t.value || today(); repaint(); }
      if (t.id === 'mv-from' || t.id === 'mv-to') { V[t.id.slice(3)] = t.value; repaint(); }
      if (t.id === 'mv-via') { V.via = t.value; V.viaTouched = true; repaint(); }
    };
    sheet.addEventListener('input', onIn); sheet.addEventListener('change', onIn);
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'kind' && b.dataset.v !== 'move') switchKind(b.dataset.v, V.amt);
      if (a === 'mv-newcat') { const keep = { from: V.from, amt: V.amt, d: V.d, note: V.note }; openSaveCatEdit(null, { onSaved: nid => openMove(null, { ...keep, to: nid }), onDone: () => openMove(null, { ...keep, to: V.to }) }); }
      if (a === 'mv-del') armDanger(b, 'Tap again to delete', () => {
        let msg = 'Deleted';
        if (existing.via) { const f = findTx(existing.via); if (f) msg = shiftIn(existing.via, existing.to, existing.from, existing.amt) ? `Deleted. ${incomeCat(f.t).name} on ${fmtD(f.t.d)} is back to how it was.` : 'Deleted. Its money-in entry has changed since, so that entry was left as it is.'; }
        removeTx([existing.id]); closeSheet(); toast(msg, '', 4500);
      });
      if (a === 'mv-save') {
        const amt = r2(parseMoney(V.amt)), err = $('#mv-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!(amt > 0)) return fail('Enter an amount above zero.');
        if (V.from === V.to) return fail('Pick two different places.');
        const old = existing && existing.via ? existing : null, oldEntry = old ? findTx(old.via) : null;
        if (oldEntry && portion(oldEntry.t, old.to) < old.amt - 0.004) return fail('This move’s money-in entry has changed since. Delete this move and add a new one.');
        let entry = null;
        if (V.via) {
          const c = viaChoices(V, existing).find(x => x.t.id === V.via);
          if (!c) return fail('Pick which money in this comes from, or None.');
          if (amt > c.avail + 0.004) return fail(`That entry has ${money(c.avail)} in ${whereName(V.from)}. Lower the amount or pick another entry.`);
          entry = c.t;
        }
        const go = () => {
          if (oldEntry) shiftIn(old.via, old.to, old.from, old.amt); // undo this move's earlier change first
          if (entry) shiftIn(entry.id, V.from, V.to, amt);
          const tx = { id: existing ? existing.id : newId(), d: V.d, t: 'move', amt, from: V.from, to: V.to, note: (V.note || '').trim(), ...(entry ? { via: entry.id } : {}) };
          existing ? replaceTx(existing.id, tx) : addTx([tx]); closeSheet();
          toast(`Moved ${money(amt)} from ${whereName(V.from)} to ${whereName(V.to)}${entry ? `. ${incomeCat(entry).name} on ${fmtD(entry.d)} now shows it` : ''}.`, '', 4500);
        };
        if (risky() && !existing) armDanger(b, `Tap again to move ${money(amt)} out of savings`, go); else go();
      }
    });
  });
}

/* one savings subcategory */
function openSaveCat(id) {
  const c = saveCat(id); if (c === NOCAT) return;
  const p = periodAt(0), bal = saveBal(id), m = saveMonth(id, p), tgt = +c.target || 0;
  const hist = []; for (let i = 5; i >= 0; i--) { const q = periodAt(-i), at = q.end < today() ? q.end : today(); hist.push({ v: Math.max(0, saveBal(id, at)), cur: i === 0, label: shortLabel(q), tip: `${q.label}\n${c.name}: ${money(saveBal(id, at))}` }); }
  openSheet(`Savings · ${c.name}`, `<div class="form">
    <div><span class="eyebrow">In ${esc(c.name)} now</span><div class="big" style="${bal < 0 ? 'color:var(--over)' : ''}"><span class="cur">${esc(sym())}</span>${nf2.format(Math.abs(bal))}</div></div>
    ${tgt ? `<span class="bar"><i style="width:${Math.max(0, Math.min(100, bal / tgt * 100)).toFixed(1)}%;background:var(--p${c.color})"></i></span><span class="muted small">${Math.round(Math.max(0, Math.min(1, bal / tgt)) * 100)}% of ${mw(tgt)} · ${money(Math.max(0, tgt - bal))} to go</span>` : ''}
    <div class="flow"><span>Start of ${esc(monthName(p))}</span><span>${money(r2(bal - m.net))}</span><span>Added this month</span><span>+${money(m.inn)}</span><span>Taken out this month</span><span>−${money(m.out)}</span><span class="tot">Now</span><span class="tot">${money(bal)}</span></div>
    ${id === 'other' ? '<p class="muted small">Pay’s savings and each month’s leftover spending land here until you move them.</p>' : ''}
    <div><div class="card-head" style="margin-bottom:6px"><h2 style="font-size:.9rem">End of each month</h2></div>${colChart(hist, 0, '', `var(--p${c.color ?? 6})`)}</div>
    <div class="btn-row"><button class="btn soft" data-act="sc-in">Move money in</button><button class="btn ghost" data-act="sc-out">Move money out</button></div>
    <div class="btn-row"><button class="btn ghost" data-act="sc-edit">Edit category</button><button class="btn ghost" data-act="sc-act">See activity</button></div>${id !== 'other' ? '<button class="btn soft" data-act="sc-goal">Make it a goal (target, date, monthly plan)</button>' : ''}</div>`, sheet => {
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'sc-in') openMove(null, { to: id, from: id === 'other' ? 'spend' : 'other' });
      if (b.dataset.act === 'sc-out') openMove(null, { from: id, to: id === 'other' ? firstSorted() : 'other' });
      if (b.dataset.act === 'sc-act') { closeSheet(); Object.assign(S.f, { where: id, types: [], label: 'all', q: '', range: 'all', limit: 150 }); location.hash = 'activity'; }
      if (b.dataset.act === 'sc-edit') openSaveCatEdit(id, { onDone: () => openSaveCat(id) });
      if (b.dataset.act === 'sc-goal') openGoalEdit(id, { onDone: () => openGoal(id) });
    });
  });
}

/* create or edit a savings category */
function openSaveCatEdit(id, opts = {}) {
  const s = S.settings, c = id ? s.saveCats.find(x => x.id === id) : null, used = new Set(s.saveCats.map(x => x.color));
  const D = c ? { name: c.name, color: c.color ?? 6, start: c.start ? String(c.start) : '', target: c.target ? String(c.target) : '', aside: c.monthly ? String(c.monthly) : c.aside ? String(Money.asideMonthly(c.aside)) : '', per: 'month' }
    : { name: '', color: [0, 1, 2, 3, 4, 5, 6].find(x => !used.has(x)) ?? 4, start: '', target: '', aside: '', per: 'week' };
  openSheet(c ? `Edit ${c.name}` : opts.aside ? 'Set aside for a goal' : 'New savings category', `<div class="form">
    <label class="field"><span>Name</span><input class="input" id="se-name" value="${esc(D.name)}" placeholder="${opts.aside ? 'e.g. Bubble tea, Concert, New phone' : 'e.g. New phone, Gifts, Course fees'}" autocomplete="off"></label>
    ${monthlyField('se', D)}
    <div class="field"><span>Colour</span><div class="swatches" role="group" aria-label="Colour">${[0, 1, 2, 3, 4, 5, 6].map(i => `<button class="swatch pc${i}" data-act="se-color" data-v="${i}" aria-pressed="${D.color === i}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
    <div class="grid2"><label class="field"><span>Already saved <span class="hint">optional</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="se-start" inputmode="decimal" value="${esc(D.start)}" placeholder="0"></div><span class="hint">Money you had before using this app</span></label>
      <label class="field"><span>Target <span class="hint">optional</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="se-target" inputmode="decimal" value="${esc(D.target)}" placeholder="None"></div></label></div>
    ${c ? `<p class="muted small">Now ${money(saveBal(c.id))}. To add more, move money in from Other or Spending.</p>` : '<p class="muted small">To fill it, move money in from Other or Spending, or pick it when money comes in.</p>'}
    <p class="small" id="se-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="se-save">${c ? 'Save' : 'Create category'}</button>${c && c.id !== 'other' ? '<button class="btn danger" data-act="se-del">Delete</button>' : ''}${opts.onDone ? '<button class="btn ghost" data-act="se-back">Back</button>' : ''}</div>
    ${c && c.id === 'other' ? '<p class="muted small">Other can’t be deleted: it’s where unsorted savings go.</p>' : ''}</div>`, sheet => {
    if (!c) setTimeout(() => { const i = $('#se-name'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 60);
    sheet.addEventListener('input', e => { const t = e.target; if (t.id === 'se-name') D.name = t.value; if (t.id === 'se-start') D.start = t.value; if (t.id === 'se-target') D.target = t.value; if (t.id === 'se-aside') D.aside = t.value; });
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'se-color') { D.color = +b.dataset.v; $$('[data-act="se-color"]', sheet).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (a === 'se-per') { D.per = b.dataset.v; $$('[data-act="se-per"]', sheet).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (a === 'se-back') opts.onDone();
      if (a === 'se-del') { const bal = saveBal(c.id); if (Math.abs(bal) > 0.004) { const err = $('#se-err'); err.textContent = `Move the ${money(bal)} in ${c.name} to another category first.`; err.hidden = false; return; } armDanger(b, 'Tap again to delete', () => { removeGoal(c.id); saveSettings(); closeSheet(); toast(`${c.name} deleted`); }); }
      if (a === 'se-save') {
        const name = D.name.trim(), err = $('#se-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!name) return fail('Give the category a name.');
        if (s.saveCats.some(x => x.id !== (c && c.id) && x.name.trim().toLowerCase() === name.toLowerCase())) return fail(`You already have a savings category called ${name}.`);
        const v = { name, color: D.color, start: r2(parseMoney(D.start)), target: r2(parseMoney(D.target)) };
        const nid = c ? c.id : newId('v');
        let tgt = c; if (c) Object.assign(c, v); else { tgt = { id: nid, ...v }; s.saveCats.push(tgt); }
        applyMonthly(tgt, D);
        saveSettings(); toast(c ? `${name} saved` : tgt.monthly ? `${name} created · ${mw(tgt.monthly)} a month` : `${name} created`);
        if (opts.onSaved) opts.onSaved(nid); else if (opts.onDone) opts.onDone(); else closeSheet();
      }
    });
  });
}


/* income categories */
function openIncomeCatEdit(id, opts = {}) {
  const s = S.settings; s.incomeCats ||= [];
  const c = id ? s.incomeCats.find(x => x.id === id) : null, used = new Set(s.incomeCats.map(x => x.color));
  const D = c ? { name: c.name, color: c.color ?? 8 } : { name: '', color: [0, 1, 2, 3, 4, 5, 6, 7, 8].find(x => !used.has(x)) ?? 8 };
  openSheet(c ? `Edit ${c.name}` : 'New income category', `<div class="form">
    <label class="field"><span>Name</span><input class="input" id="ie-name" value="${esc(D.name)}" placeholder="e.g. Freelance, Bonus, Refunds" autocomplete="off"></label>
    <div class="field"><span>Colour</span><div class="swatches" role="group" aria-label="Colour">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<button class="swatch c${i}" data-act="ie-color" data-v="${i}" aria-pressed="${D.color === i}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
    ${c && c.id === 'salary' ? '<p class="muted small">Pay is always recorded as this category, so it can be renamed but not deleted.</p>' : ''}
    <p class="small" id="ie-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="ie-save">${c ? 'Save' : 'Create category'}</button>${c && c.id !== 'salary' ? '<button class="btn danger" data-act="ie-del">Delete</button>' : ''}${opts.onDone ? '<button class="btn ghost" data-act="ie-back">Back</button>' : ''}</div></div>`, sheet => {
    if (!c) setTimeout(() => { const i = $('#ie-name'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 60);
    sheet.addEventListener('input', e => { if (e.target.id === 'ie-name') D.name = e.target.value; });
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'ie-color') { D.color = +b.dataset.v; $$('[data-act="ie-color"]', sheet).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (a === 'ie-back') opts.onDone();
      if (a === 'ie-del') { const inUse = S.tx.some(t => t.t === 'in' && t.cat === c.id); armDanger(b, inUse ? 'Tap again (past money in becomes Other income)' : 'Tap again to delete', () => { s.incomeCats = s.incomeCats.filter(x => x.id !== c.id); saveSettings(); closeSheet(); toast(`${c.name} deleted`); }); }
      if (a === 'ie-save') {
        const name = D.name.trim(), err = $('#ie-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!name) return fail('Give the category a name.');
        if (s.incomeCats.some(x => x.id !== (c && c.id) && x.name.trim().toLowerCase() === name.toLowerCase())) return fail(`You already have an income category called ${name}.`);
        const nid = c ? c.id : newId('i');
        if (c) Object.assign(c, { name, color: D.color }); else s.incomeCats.push({ id: nid, name, color: D.color });
        saveSettings(); toast(c ? `${name} saved` : `${name} created`);
        if (opts.onSaved) opts.onSaved(nid); else if (opts.onDone) opts.onDone(); else closeSheet();
      }
    });
  });
}

/* one spending category (stored as a "label") */
function openLabel(id, kind) {
  const l = S.settings.labels.find(x => x.id === id); if (!l) return;
  let k = kind || S.labelPeriod;
  const body = () => {
    const r = rangeFor(k), spent = labelSpent(id, r), n = k === 'day' ? 14 : k === 'week' ? 8 : 6;
    const hist = []; for (let i = n - 1; i >= 0; i--) { const rr = shiftRange(r, -i); hist.push({ r: rr, v: labelSpent(id, rr) }); }
    const first = S.tx.reduce((m, t) => t.t === 'out' && t.label === id && t.d < m ? t.d : m, '9999-12-31');
    const done = hist.slice(0, -1).filter(x => x.r.end >= first), avg = done.length ? sum(done.map(x => x.v)) / done.length : 0;
    const lab = rr => rr.kind === 'day' ? String(parts(rr.start)[2]) : rr.kind === 'week' ? fmtD(rr.start) : MON[parts(periodFor(rr.start).start)[1] - 1];
    const items = S.tx.filter(t => t.t === 'out' && t.label === id && t.d >= r.start && t.d <= r.end);
    const allOut = r2(sum(S.tx.filter(t => t.t === 'out' && t.d >= r.start && t.d <= r.end).map(t => t.amt)));
    return `<div class="form">
      <div class="seg" role="group" aria-label="Period">${['day', 'week', 'month'].map(v => `<button data-act="lb-k" data-v="${v}" aria-pressed="${k === v}">${PER_NAME[v]}</button>`).join('')}</div>
      <div><span class="eyebrow">${esc(rangeLabel(r))}</span><div class="big"><span class="cur">${esc(sym())}</span>${nf2.format(spent)}</div><span class="muted small">${allOut ? `${Math.round(spent / allOut * 100)}% of everything you spent ${periodWord(r)}` : `Nothing spent ${periodWord(r)}`}</span></div>
      <div><div class="card-head" style="margin-bottom:6px"><h2 style="font-size:.9rem">Last ${n} ${k === 'day' ? 'days' : k === 'week' ? 'weeks' : 'months'}</h2><span class="muted small">${done.length ? `average ${money(avg)} ${PER_LABEL[k]}` : ''}</span></div>${colChart(hist.map(x => ({ v: x.v, cur: x.r.start === r.start, label: lab(x.r), tip: `${rangeLabel(x.r)}\n${l.name}: ${money(x.v)}` })), 0, '')}</div>
      <div><div class="card-head" style="margin-bottom:4px"><h2 style="font-size:.9rem">${esc(rangeLabel(r))}</h2><span class="muted small">${items.length} item${items.length === 1 ? '' : 's'}</span></div>${items.length ? `<div class="txs">${items.slice(0, 12).map(txRow).join('')}</div>` : `<p class="muted small">Nothing spent ${periodWord(r)}.</p>`}</div>
      <div class="btn-row"><button class="btn ghost" data-act="lb-edit">Edit category</button><button class="btn ghost" data-act="lb-all">All ${esc(l.name)} spending</button></div></div>`;
  };
  openSheet(l.name, body(), sheet => {
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'lb-k') { k = b.dataset.v; $('.sheet-body').innerHTML = body(); }
      if (a === 'lb-edit') openLabelEdit(id, { onDone: () => openLabel(id, k) });
      if (a === 'lb-all') { closeSheet(); Object.assign(S.f, { label: id, types: ['out'], where: 'all', q: '', range: 'all', limit: 150 }); location.hash = 'activity'; }
      if (a === 'edit-tx') { const f = findTx(b.dataset.id); if (f) openSpend(f.t); }
    });
  });
}
function openLabelEdit(id, opts = {}) {
  const s = S.settings, l = id ? s.labels.find(x => x.id === id) : null, used = new Set(s.labels.map(x => x.color));
  const D = l ? { name: l.name, color: l.color ?? 8, plan: l.plan ? String(l.plan) : '' } : { name: '', color: [0, 1, 2, 3, 4, 5, 6, 7, 8].find(x => !used.has(x)) ?? 8, plan: '' };
  openSheet(l ? `Edit ${l.name}` : 'New expense category', `<div class="form">
    <label class="field"><span>Name</span><input class="input" id="le-name" value="${esc(D.name)}" placeholder="e.g. Bubble tea, Gifts, Grab" autocomplete="off"></label>
    <div class="field"><span>Colour</span><div class="swatches" role="group" aria-label="Colour">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<button class="swatch c${i}" data-act="le-color" data-v="${i}" aria-pressed="${D.color === i}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
    <label class="field"><span>Planned per month <span class="hint">optional</span></span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="le-plan" inputmode="decimal" value="${esc(D.plan)}" placeholder="None"></div><span class="hint">What you expect to spend on this from Spending each month. Used for Home’s projection.</span></label>
    <p class="small" id="le-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="le-save">${l ? 'Save' : 'Create category'}</button>${l ? '<button class="btn danger" data-act="le-del">Delete</button>' : ''}${opts.onDone ? '<button class="btn ghost" data-act="le-back">Back</button>' : ''}</div></div>`, sheet => {
    if (!l) setTimeout(() => { const i = $('#le-name'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 60);
    sheet.addEventListener('input', e => { if (e.target.id === 'le-name') D.name = e.target.value; if (e.target.id === 'le-plan') D.plan = e.target.value; });
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'le-color') { D.color = +b.dataset.v; $$('[data-act="le-color"]', sheet).forEach(x => x.setAttribute('aria-pressed', x === b)); }
      if (a === 'le-back') opts.onDone();
      if (a === 'le-del') { const inUse = S.tx.some(t => t.label === l.id); armDanger(b, inUse ? 'Tap again (past spending becomes Uncategorised)' : 'Tap again to delete', () => { s.labels = s.labels.filter(x => x.id !== l.id); saveSettings(); closeSheet(); toast(`${l.name} deleted`); }); }
      if (a === 'le-save') {
        const name = D.name.trim(), err = $('#le-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!name) return fail('Give the category a name.');
        if (s.labels.some(x => x.id !== (l && l.id) && x.name.trim().toLowerCase() === name.toLowerCase())) return fail(`You already have an expense category called ${name}.`);
        const nid = l ? l.id : newId('l');
        const plan = r2(parseMoney(D.plan));
        if (l) { Object.assign(l, { name, color: D.color }); if (plan > 0) l.plan = plan; else delete l.plan; } else s.labels.push({ id: nid, name, color: D.color, ...(plan > 0 ? { plan } : {}) });
        saveSettings(); toast(l ? `${name} saved` : `${name} created`);
        if (opts.onSaved) opts.onSaved(nid); else if (opts.onDone) opts.onDone(); else closeSheet();
      }
    });
  });
}

/* add or edit a bill or subscription */
function openBillEdit(id) {
  const s = S.settings, x = id ? s.subs.find(v => v.id === id) : null;
  const D = x ? { kind: x.kind || 'sub', name: x.name, amount: String(x.amount), cycle: x.cycle || 'monthly', next: x.next, label: s.labels.some(l => l.id === x.label) ? x.label : defaultBillLabel(x.kind || 'sub'), from: billFrom(x) }
    : { kind: 'bill', name: '', amount: '', cycle: 'monthly', next: addDays(today(), 1), label: defaultBillLabel('bill'), from: 'spend' };
  let labelTouched = !!x;
  const body = () => `<div class="form">
    <div class="seg" role="group" aria-label="Type"><button data-act="be-kind" data-v="bill" aria-pressed="${D.kind === 'bill'}">Bill</button><button data-act="be-kind" data-v="sub" aria-pressed="${D.kind === 'sub'}">Subscription</button></div>
    <label class="field"><span>Name</span><input class="input" id="be-name" value="${esc(D.name)}" placeholder="${D.kind === 'bill' ? 'e.g. Phone plan, Rent, Insurance' : 'e.g. Spotify, Netflix, iCloud'}" autocomplete="off"></label>
    <div class="grid2"><label class="field"><span>Amount</span><div class="money-in" data-sym="${esc(sym())}"><input class="input" id="be-amt" inputmode="decimal" value="${esc(D.amount)}" placeholder="0.00"></div></label>
      <label class="field"><span>How often</span><select class="input" id="be-cycle">${Object.entries(CYCLES).map(([k, v]) => `<option value="${k}" ${D.cycle === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label></div>
    <div class="grid2"><label class="field"><span>Next due</span><input class="input" type="date" id="be-next" value="${esc(D.next)}"></label>
      <label class="field"><span>Category</span><select class="input" id="be-label">${s.labels.map(l => `<option value="${esc(l.id)}" ${D.label === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label></div>
    <label class="field"><span>Paid from</span><select class="input" id="be-from"><option value="spend" ${D.from === 'spend' ? 'selected' : ''}>Spending</option>${s.saveCats.map(c => `<option value="${esc(c.id)}" ${D.from === c.id ? 'selected' : ''}>Savings · ${esc(c.name)}</option>`).join('')}</select>
      <span class="hint">${D.from === 'spend' ? 'Counts in “left after bills” on Home.' : 'Comes out of savings when you tap Paid, so it doesn’t affect your Spending.'}</span></label>
    <p class="muted small">It shows as due on its date. Nothing is recorded until you tap Paid.</p>
    <p class="small" id="be-err" style="color:var(--over)" hidden></p>
    <div class="btn-row"><button class="btn" data-act="be-save">${x ? 'Save' : D.kind === 'bill' ? 'Add bill' : 'Add subscription'}</button>${x ? '<button class="btn danger" data-act="be-del">Delete</button>' : ''}</div></div>`;
  const read = () => { D.name = $('#be-name').value; D.amount = $('#be-amt').value; D.cycle = $('#be-cycle').value; D.next = $('#be-next').value; D.label = $('#be-label').value; D.from = $('#be-from').value; };
  openSheet(x ? `Edit ${x.name}` : 'New bill or subscription', body(), sheet => {
    sheet.addEventListener('change', e => { if (e.target.id === 'be-label') labelTouched = true; if (e.target.id === 'be-from') { read(); $('.sheet-body').innerHTML = body(); } });
    sheet.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
      if (a === 'be-kind') { read(); D.kind = b.dataset.v; if (!labelTouched) D.label = defaultBillLabel(D.kind); $('.sheet-body').innerHTML = body(); }
      if (a === 'be-del') armDanger(b, 'Tap again to delete', () => { s.subs = s.subs.filter(v => v.id !== x.id); saveSettings(); closeSheet(); toast(`${x.name} deleted. Past payments stay in Activity.`); });
      if (a === 'be-save') {
        read();
        const name = D.name.trim(), amount = r2(parseMoney(D.amount)), err = $('#be-err'), fail = m => { err.textContent = m; err.hidden = false; };
        if (!name) return fail('Give it a name.');
        if (!(amount > 0)) return fail('Enter an amount above zero.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(D.next)) return fail('Pick the next due date.');
        const v = { id: x ? x.id : newId('b'), kind: D.kind, name, amount, cycle: D.cycle, next: D.next, day: parts(D.next)[2], label: D.label, from: D.from, active: true };
        if (x) Object.assign(x, v); else s.subs.push(v);
        saveSettings(); closeSheet(); toast(x ? `${name} saved` : `${name} added · next due ${fmtD(D.next)}`);
      }
    });
  });
}

/* ---------- export / restore ---------- */
async function offerFile(filename, text) {
  if (STANDALONE) { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: filename.endsWith('.json') ? 'application/json' : 'text/csv' })); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast(`Downloaded ${filename}`); return; } catch (e) {} }
  let dl = null; try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) {}
  if (dl) { try { const r = await dl.save({ filename, data: text }); if (r && r.status === 'saved') toast('File saved'); return; } catch (e) { if (e && e.code === 'declined') return; if (e && e.code === 'rate_limited') { toast('A save is already waiting for your answer.'); return; } } }
  openSheet('Copy your data', `<div class="form"><p class="muted small">Saving files isn’t available here. Copy this text and paste it into a file named <b>${esc(filename)}</b>.</p><textarea class="input" id="copy-box" rows="10" readonly style="font:12px/1.4 ui-monospace,monospace">${esc(text)}</textarea><button class="btn" data-act="copy-box">Copy</button></div>`);
}
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function exportCSV() {
  const rows = [['Date', 'Type', 'Amount', 'From', 'To or category', 'Note']];
  for (const t of [...S.tx, ...S.sweeps].sort((a, b) => a.d < b.d ? -1 : 1)) {
    if (t.t === 'out') rows.push([t.d, 'Spent', (-t.amt).toFixed(2), whereName(t.from), label(t.label).name, t.note]);
    else if (t.t === 'in') rows.push([t.d, `Money in · ${incomeCat(t).name}`, t.amt.toFixed(2), '', [t.spend ? `Spending ${t.spend}${t.for ? ` for ${forName(t.for)}` : ''}` : '', ...Object.entries(t.save || {}).map(([k, v]) => `${saveCat(k).name} ${v}`)].filter(Boolean).join('; '), t.note]);
    else if (t.t === 'move') { const f = t.via ? findTx(t.via) : null; rows.push([t.d, 'Move', t.amt.toFixed(2), whereName(t.from), whereName(t.to), [t.note, f ? `(changed money in of ${f.t.d}; already counted there)` : ''].filter(Boolean).join(' ')]); }
    else rows.push([t.d, t.amt >= 0 ? 'Leftover to savings' : 'Overspend from savings', Math.abs(t.amt).toFixed(2), t.amt >= 0 ? 'Spending' : 'Savings · Other', t.amt >= 0 ? 'Savings · Other' : 'Spending', `${monthName(t.p)} spending`]);
  }
  offerFile(`spend-save-${today()}.csv`, rows.map(r => r.map(csvCell).join(',')).join('\n'));
}
function exportJSON() { offerFile(`spend-save-backup-${today()}.json`, JSON.stringify({ app: 'spend-save', v: 1, exported: new Date().toISOString(), settings: S.settings, months: S.months }, null, 1)); }
async function restoreFrom(file) {
  let data; try { data = JSON.parse(await file.text()); } catch (e) { return toast('That file isn’t a Spend & Save backup.', 'over'); }
  if (!data || data.app !== 'spend-save' || !data.settings || typeof data.months !== 'object') return toast('That file isn’t a Spend & Save backup.', 'over');
  const n = sum(Object.values(data.months).map(m => (m.tx || []).length));
  openSheet('Restore backup', `<div class="form"><p>This replaces everything here with the backup from <b>${esc(fmtDY((data.exported || today()).slice(0, 10)))}</b>: ${n} entries.</p><div class="btn-row"><button class="btn" data-act="restore-go">Replace with backup</button><button class="btn ghost" data-act="close-sheet">Cancel</button></div></div>`, sheet => {
    sheet.addEventListener('click', e => {
      if (!e.target.closest('[data-act="restore-go"]')) return;
      const old = Object.keys(S.months);
      if (S.mode === 'onboard') S.mode = (S.db || S.local) ? 'live' : 'demo'; // restoring from the welcome screen: start the app with the backup
      S.settings = Object.assign(defaultSettings(), data.settings, { onboarded: true }); migrate(S.settings);
      S.months = {}; for (const [k, m] of Object.entries(data.months)) if (/^m-\d{4}-\d{2}$/.test(k) && Array.isArray(m.tx)) S.months[k] = { tx: m.tx };
      persist('settings'); new Set([...old, ...Object.keys(S.months)]).forEach(persist);
      closeSheet(); refresh(); toast('Backup restored');
    });
  });
}
function resetAll() {
  const old = Object.keys(S.months);
  if (S.local) { clearTimeout(localTimer); localTimer = null; try { localStorage.removeItem(LKEY); } catch (e) {} S.months = {}; S.settings = null; S.mode = 'onboard'; S.draft = defaultSettings(); renderView(); toast('All your data was deleted.'); return; }
  if (S.mode === 'demo') { S.settings = Object.assign(defaultSettings(), { onboarded: true }); S.months = {}; refresh(); toast('Example data cleared. Changes still aren’t saved here.'); return; }
  S.months = {}; old.forEach(persist); S.settings = null; dirty.delete('settings');
  S.db.doc(`data/users/${S.uid}/settings`).delete().catch(() => {});
  S.mode = 'onboard'; S.draft = defaultSettings(); renderView(); toast('All your data was deleted.');
}

/* ---------- toast & tooltip ---------- */
let toastTimer;
function toast(msg, level = '', ms = 3200) { const el = $('#toast'); el.textContent = msg; el.className = 'show ' + (level || ''); clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.className = level || ''; }, ms); }
const tip = $('#tip'); let tipEl = null;
function showTip(el) {
  tipEl = el; tip.textContent = el.dataset.tip; tip.hidden = false;
  const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = r.left + r.width / 2 - tw / 2; x = Math.max(8, Math.min(window.innerWidth - tw - 8, x)); let y = r.top - th - 8; if (y < 8) y = r.bottom + 8;
  tip.style.left = x + 'px'; tip.style.top = y + 'px'; $$('.hit.on').forEach(h => h.classList.remove('on')); if (el.classList.contains('hit')) el.classList.add('on');
}
function hideTip() { tip.hidden = true; tipEl = null; $$('.hit.on').forEach(h => h.classList.remove('on')); }
document.addEventListener('pointerover', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && e.pointerType === 'mouse') showTip(el); });
document.addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && e.target.closest && e.target.closest('[data-tip]')) hideTip(); });
document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el && e.pointerType !== 'mouse') { tipEl === el ? hideTip() : showTip(el); } else if (!el) hideTip(); });
window.addEventListener('scroll', hideTip, { passive: true });

/* ---------- global events ---------- */
const ACT = {
  go: el => { closeSheet(); location.hash = el.dataset.view; },
  add: () => openSpend(null),
  move: () => openMove(null),
  'close-sheet': () => closeSheet(),
  'log-pay': () => openIn(null, { src: 'pay' }),
  'sort-other': () => openMove(null, { from: 'other', to: firstSorted(), amt: String(saveBal('other')) }),
  'save-view': el => { S.saveView = el.dataset.v; lsSet('spend-save:saveView', S.saveView); renderView(); },
  savecat: el => (saveCat(el.dataset.id).goal ? openGoal : openSaveCat)(el.dataset.id),
  goal: el => openGoal(el.dataset.id),
  balance: () => showBreakdown(S.view === 'home' ? !S.bdOpen : true, S.view === 'home' ? null : '#bd'),
  'bal-set': () => balSet(),
  'sd-act': () => { Object.assign(S.f, { where: 'spend', types: [], label: 'all', q: '', range: 'month', limit: 150 }); location.hash = 'activity'; },
  'sd-plan': () => { S.planTab = 'spend'; if (S.view !== 'plan') location.hash = 'plan'; else renderView(); },
  'goal-edit': el => openGoalEdit(el.dataset.id),
  'income-edit': el => openIncomeCatEdit(el.dataset.id),
  label: el => openLabel(el.dataset.id, el.dataset.k),
  'label-edit': el => openLabelEdit(el.dataset.id),
  'label-period': el => { S.labelPeriod = el.dataset.v; lsSet('spend-save:labelPeriod', S.labelPeriod); renderView(); },
  'where-activity': el => { Object.assign(S.f, { where: el.dataset.id, types: [], label: 'all', q: '', range: 'month', limit: 150 }); location.hash = 'activity'; },
  'edit-tx': el => { const f = findTx(el.dataset.id); if (!f) return; const t = f.t; if (t.t === 'out') openSpend(t); else if (t.t === 'in') openIn(t); else openMove(t); },
  'sweep-info': () => toast('Worked out from that month’s spending. Edit the spending and this updates by itself.', '', 4500),
  'plan-tab': el => { S.planTab = el.dataset.tab; if (S.view !== 'plan') location.hash = 'plan'; else renderView(); },
  'f-type': el => { // toggle one kind on or off; the "Clear filters" link and hint are redrawn with the view
    const v = el.dataset.v, on = S.f.types.includes(v); S.f.types = on ? S.f.types.filter(x => x !== v) : [...S.f.types, v]; S.f.limit = 150;
    renderView();
  },
  'f-clear': () => { Object.assign(S.f, { q: '', types: [], where: 'all', label: 'all', range: 'month', from: '', to: '', limit: 150 }); renderView(); },
  'f-moreRows': () => { S.f.limit += 300; renderActList(); },
  'pay-bill': el => payBill(el.dataset.id),
  'skip-bill': el => skipBill(el.dataset.id),
  'edit-bill': el => openBillEdit(el.dataset.id),
  'savecat-edit': el => openSaveCatEdit(el.dataset.id),
  'export-csv': () => exportCSV(),
  'export-json': () => exportJSON(),
  'copy-box': () => { const t = $('#copy-box'); if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(() => toast('Copied'), () => { t.select(); toast('Select all and copy'); }); else { t.select(); toast('Select all and copy'); } },
  reset: el => armDanger(el, S.mode === 'demo' ? 'Tap again to clear' : 'Tap again to delete everything', resetAll),
  'hide-install': () => { lsSet(LKEY + ':hide-install', '1'); renderView(); },
  'spend-details': () => showBreakdown(true, '#bd-avail'),
  'cat-all': () => { const k = ['day', 'week', 'month'].includes(S.labelPeriod) ? S.labelPeriod : 'month'; S.ins = { ...S.ins, kind: k, off: 0 }; lsSet('spend-save:insKind', k); location.hash = 'insights'; },
  period: el => { S.offset = Math.min(0, S.offset + +el.dataset.d); renderView(); },
  'home-opt': el => { const k = el.dataset.k, on = !homeOn(k); S.settings.home = { ...(S.settings.home || {}), [k]: on }; if (k === 'past' && !on) S.offset = 0; saveSettings(); toast(`${HOME_OPTS.find(x => x[0] === k)[1]} ${on ? 'on' : 'off'}`); },
  'sav-all': () => { S.savAll = !S.savAll; renderView(); },
  'avail-per': el => { S.availPer = el.dataset.v; lsSet('spend-save:availPer', S.availPer); renderView(); },
  'aside-go': el => asideGo(el),
  'aside-new': () => openSaveCatEdit(null, { aside: true }),
  'month-end': el => { S.settings.monthEnd = el.dataset.v; saveSettings(); toast(el.dataset.v === 'savings' ? 'Leftovers and overspending now move to and from Savings → Other at month end.' : 'Leftovers and overspending now stay in Spending and carry into next month.', '', 4500); },
  'home-bud': el => { S.homeBud = el.dataset.v; lsSet('spend-save:homeBud', S.homeBud); renderView(); },
  'ins-kind': el => { S.ins.kind = el.dataset.v; S.ins.off = 0; lsSet('spend-save:insKind', S.ins.kind); renderView(); },
  'ins-step': el => { S.ins.off = Math.min(0, S.ins.off + +el.dataset.d); renderView(); },
  'ob-finish': () => { const d = S.draft; d.budget = { per: 'month', amt: r2(Math.max(0, +d.split.spend || 0)) }; const have = r2(S.obHave || 0), o = d.saveCats.find(c => c.id === 'other'); if (have && o) o.start = have; d.onboarded = true; d.income = { ...d.income, salary: [{ from: null, amt: r2(+d.pay || 0) }] }; d.spendFloor = d.budget.amt; S.settings = d; S.mode = (S.db || S.local) ? 'live' : 'demo'; persist('settings'); refresh(); window.scrollTo(0, 0); toast('Now set up your plan.'); setTimeout(() => openSetup(1), 350); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || (el.closest('.sheet-body') && !['close-sheet', 'copy-box', 'go'].includes(el.dataset.act))) return;
  const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f === 'q') { S.f.q = t.value; S.f.limit = 150; renderActList(); }
  if (S.mode === 'onboard' && S.draft) {
    if (t.dataset.draft === 'pay') S.draft.pay = r2(parseMoney(t.value));
    if (t.dataset.draft === 'spend') S.draft.split.spend = r2(parseMoney(t.value));
    if (t.dataset.draft === 'have') S.obHave = r2(parseMoney(t.value));
  }
  if (t.dataset.budget && S.settings) liveBudget(t.dataset.budget, t.value);
});
document.addEventListener('change', e => {
  const t = e.target, s = S.settings;
  if (t.id === 'restore-file' && t.files[0]) { restoreFrom(t.files[0]); t.value = ''; return; }
  if (t.id === 'ins-from' || t.id === 'ins-to') { S.ins[t.id === 'ins-from' ? 'from' : 'to'] = t.value; renderView(); return; }
  if (t.dataset.f && ['range', 'where', 'label', 'from', 'to'].includes(t.dataset.f)) { S.f[t.dataset.f] = t.value; S.f.limit = 150; if (t.dataset.f === 'range') renderView(); else renderActList(); return; }
  if (!s || S.mode === 'onboard') return;
  if (t.dataset.plan) {
    const l = s.labels.find(x => x.id === t.dataset.plan); if (!l) return;
    const v = r2(parseMoney(t.value)); if (v > 0) l.plan = v; else delete l.plan;
    saveSettings(false);
    const pc = $('#plan-check'); if (pc) pc.innerHTML = planCheckHtml(); const pt = $('#plan-total'); if (pt) pt.textContent = money(sum(s.labels.map(x => +x.plan || 0)));
    return;
  }
  if (t.dataset.budget) { // save the budget in whichever unit was typed; the other two follow
    setBudget(t.dataset.budget, parseMoney(t.value)); saveSettings(false); liveBudget(t.dataset.budget, t.value);
    const pc = $('#plan-check'); if (pc) pc.innerHTML = planCheckHtml(); return;
  }
  if (t.dataset.set) {
    const k = t.dataset.set, v = t.value;
    if (k === 'pay') s.pay = r2(Math.max(0, parseMoney(v)));
    else if (k === 'monthStart') { s.monthStart = +v; S.offset = 0; }
    else if (k === 'symbol') { s.symbol = v.trim() || 'S$'; $$('.money-in').forEach(m => m.dataset.sym = s.symbol); }
    saveSettings(k === 'monthStart'); return;
  }
});


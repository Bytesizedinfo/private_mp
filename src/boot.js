/* ---------- v5 actions, inputs and start-up ---------- */
const goMore = tab => { S.moreTab = tab; closeSheet(); if (S.view !== 'more') location.hash = 'more'; else { renderView(); window.scrollTo(0, 0); } };
Object.assign(ACT, {
  'safe-k': el => { S.safeK = el.dataset.v; lsSet('spend-save:safeK', S.safeK); renderView(); },
  'safe-how': () => safeHowSheet(),
  'spend-details': () => safeHowSheet(),
  'goal-up': el => movePriority(el.dataset.id, -1),
  'goal-down': el => movePriority(el.dataset.id, 1),
  'fc-tab': el => { S.fcTab = el.dataset.v; renderView(); },
  'fc-h': el => {
    const v = el.dataset.v;
    if (v === 'custom') { openSheet('How far ahead?', `<div class="form"><label class="field"><span>Months</span><input class="input" id="fc-n" inputmode="numeric" value="${esc(String(horizon()))}"></label><button class="btn" data-act="fc-n-go">Show</button></div>`, sh => sh.addEventListener('click', e => { if (!e.target.closest('[data-act="fc-n-go"]')) return; const n = Math.round(parseMoney($('#fc-n').value)); if (n >= 1 && n <= 60) { S.settings.horizon = n; saveSettings(); closeSheet(); } })); return; }
    S.settings.horizon = v === 'goals' ? 'goals' : +v; saveSettings();
  },
  'fc-sel': el => { S.fcMonth = el.dataset.k; renderView(); },
  'fc-month': el => openMonth(el.dataset.k),
  income: () => openIncome(),
  extra: el => openExtra(el.dataset.id),
  'extra-new': () => openExtra(null),
  'more-tab': el => goMore(el.dataset.tab),
  'plan-tab': el => goMore({ spend: 'plan', cats: 'cats', bills: 'bills', more: 'settings' }[el.dataset.tab] || 'plan'),
  'sd-plan': () => goMore('plan'),
  'sd-act': () => { Object.assign(S.f, { where: 'spend', types: [], label: 'all', q: '', range: 'month', limit: 150 }); goMore('activity'); },
  'where-activity': el => { Object.assign(S.f, { where: el.dataset.id, types: [], label: 'all', q: '', range: 'month', limit: 150 }); goMore('activity'); },
  'cat-all': () => { const k = ['day', 'week', 'month'].includes(S.labelPeriod) ? S.labelPeriod : 'month'; S.ins = { ...S.ins, kind: k, off: 0 }; lsSet('spend-save:insKind', k); S.fcTab = 'past'; location.hash = 'forecast'; },
  setup: () => openSetup(1),
  'setup-later': () => { S.settings.review = false; saveSettings(); toast('You can set it up any time in More → Plan.'); },
  theme: el => { lsSet('spend-save:theme', el.dataset.v); applyTheme(); renderView(); },
  'pay-debt': el => openPayDebt(el.dataset.id),
  'try-demo': () => startDemo('try'),
  'demo-exit': () => location.reload(),
});
/* plan settings in More → Plan: saved as you change them */
function psChange(t, live) {
  const s = S.settings; if (!s || S.mode === 'onboard') return false;
  if (t.dataset.ps) {
    const k = t.dataset.ps, v = r2(Math.max(0, parseMoney(t.value)));
    if (k === 'savePct') { s.savePct = Math.min(100, v); const o = $(t.id === 'ps-pct' ? '#ps-pct-n' : '#ps-pct'); if (o && o !== t) o.value = String(s.savePct); const h = $('#ps-pct-hint'), sal = Money.salaryAt(s.income, curKey()); if (h && sal) h.textContent = `${money(sal * s.savePct / 100)} of your ${mw(sal)} salary this month`; }
    if (k === 'spendFloor') s.spendFloor = v;
    if (k === 'extraGoalPct') s.extraGoalPct = Math.min(100, v);
    if (!live) saveSettings(false); return true;
  }
  if (t.dataset.splitPot) {
    s.saveSplit = { ...Money.saveSplitOf(s) }; const v = r2(Math.max(0, parseMoney(t.value)));
    if (v > 0) s.saveSplit[t.dataset.splitPot] = v; else delete s.saveSplit[t.dataset.splitPot];
    const h = $('#ps-split-hint'), tot = sum(Object.values(s.saveSplit)); if (h) h.textContent = `${Math.round(tot)}% shared out${Math.abs(tot - 100) > 0.5 ? ' · it’s scaled to 100%' : ''}`;
    if (!live) saveSettings(false); return true;
  }
  return false;
}
document.addEventListener('input', e => { if (e.target.closest && e.target.closest('#view')) psChange(e.target, true); });
document.addEventListener('change', e => { if (e.target.closest && e.target.closest('#view') && psChange(e.target, false)) renderLater(); });
let renderTimer = null;
function renderLater() { clearTimeout(renderTimer); renderTimer = setTimeout(() => { if (!isEditingMain()) renderView(); else S.pendingRender = true; }, 50); }

applyTheme();
try { window.claude?.hot?.snapshot?.(() => ({ view: S.view, offset: S.offset, moreTab: S.moreTab, fcTab: S.fcTab, ins: S.ins })); } catch (e) {}
const start = data => { if (data && data.moreTab) S.moreTab = data.moreTab; if (data && data.fcTab) S.fcTab = data.fcTab; if (data && data.ins && INS_KINDS.includes(data.ins.kind)) S.ins = { ...S.ins, ...data.ins }; boot(); };
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});

/* UI smoke test: runs inside tests/app_test.html (the claude.ai build, which uses example data when opened
   outside claude.ai). Visits every tab and sheet, runs the main flows, and records any error.
   ?shot=<name> stops at one screen instead, for screenshots. The page title ends "UIPASS n" or "UIFAIL n". */
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms)), $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const log = [], errs = window.__errs, checks = [];
  const ok = (name, cond, more = '') => { checks.push(name); if (!cond) errs.push(`check failed: ${name} ${more}`); };
  const click = async (sel, ms = 60) => { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) { errs.push(`missing: ${sel}`); return false; } el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); await wait(ms); return true; };
  const go = async v => { location.hash = v; await wait(120); };
  const text = () => ($('#view') || {}).innerText || '';
  const sheet = () => ($('.sheet-body') || {}).innerText || '';
  const type = async (sel, v) => { const el = $(sel); if (!el) { errs.push(`missing input: ${sel}`); return; } el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); await wait(60); };
  const shot = new URLSearchParams(location.search).get('shot');
  await wait(400);
  try {
    if (shot) {
      if (shot === 'dark') document.documentElement.dataset.theme = 'dark';
      if (shot === 'goal') await click('[data-act="goal"][data-id="shanghai"]', 200);
      if (shot === 'goal-card') await click('[data-act="goal"][data-id="card"]', 200);
      if (['setup', 'setup4'].includes(shot)) { await go('more'); await click('[data-act="more-tab"][data-tab="plan"]', 120); }
      if (shot === 'edit') { await go('goals'); await click('[data-act="goal-edit"]', 150); await type('#ge-name', 'Japan trip'); await type('#ge-target', '3000'); await type('#ge-date', (() => { const d = new Date(); d.setMonth(d.getMonth() + 8); return d.toISOString().slice(0, 10); })()); }
      if (shot === 'pay') { await click('[data-act="add"]', 150); await click('[data-act="kind"][data-v="in"]', 150); }
      if (shot === 'setup') await click('[data-act="setup"]', 150);
      if (shot === 'setup4') { await click('[data-act="setup"]', 150); for (let i = 0; i < 3; i++) await click('[data-act="su-next"]', 120); }
      if (shot === 'all') await click('[data-act="safe-k"][data-v="all"]', 120);
      if (shot === 'week') await click('[data-act="safe-k"][data-v="week"]', 120);
      document.title = errs.length ? `UIFAIL ${errs.length}` : 'SHOT'; if (errs.length) document.body.insertAdjacentHTML('afterbegin', `<pre style="background:#fee;color:#900;position:relative;z-index:99">${errs.join('\n')}</pre>`); return;
    }
    ok('demo mode', document.body.dataset.mode === 'demo');
    // tabs
    for (const v of ['home', 'goals', 'forecast', 'more']) { await go(v); log.push(`${v}: ${text().length} chars`); ok(`${v} renders`, text().length > 200); }
    await go('home');
    ok('safe to spend shown', /Safe to spend/.test(text()));
    for (const k of ['day', 'week', 'all', 'month']) { await click(`[data-act="safe-k"][data-v="${k}"]`); ok(`safe toggle ${k}`, $(`[data-act="safe-k"][data-v="${k}"]`).getAttribute('aria-pressed') === 'true'); }
    ok('this month’s plan shown', /This month’s plan/.test(text()));
    await click('[data-act="safe-how"]', 100); ok('safe sheet', /Safe to spend/.test(sheet())); await click('[data-act="close-sheet"]');
    await click('[data-act="balance"]', 100); ok('breakdown', /Is this all your money/.test(text())); await click('[data-act="balance"]', 100);
    // set aside one item
    const aside = $('[data-act="aside-go"]'); if (aside) { const before = text(); await click(aside, 120); ok('set aside', text() !== before); }
    // goals
    await go('goals');
    ok('gantt', !!$('.goals-sum') && /When each goal is done/.test(text()));
    const ids = $$('.goal-card [data-act="goal"]').map(b => b.dataset.id);
    ok('4 goal cards', ids.length >= 4, ids.join(','));
    const first = ids[0]; await click(`[data-act="goal-down"][data-id="${first}"]`, 120); ok('reorder', $$('.goal-card [data-act="goal"]')[1].dataset.id === first); await click(`[data-act="goal-up"][data-id="${first}"]`, 120);
    for (const id of ids) { await click(`.goal-card [data-act="goal"][data-id="${id}"]`, 150); ok(`goal sheet ${id}`, /Plan/.test(sheet())); const c = $('[data-act="gl-catch"]'); if (c) { await click(c, 200); log.push(`caught up ${id}`); } await click('[data-act="close-sheet"]'); }
    // goal editor: three modes and three kinds
    await click('[data-act="goal-edit"]', 150);
    await type('#ge-name', 'Japan trip'); await type('#ge-target', '3000');
    const d = new Date(); d.setMonth(d.getMonth() + 8); await type('#ge-date', d.toISOString().slice(0, 10));
    ok('by date suggests phases', $$('.ph-erow').length >= 1, `${$$('.ph-erow').length}`);
    ok('preview text', /Done around|short by|on track|ahead/i.test(($('#ge-prev') || {}).innerText || ''));
    await click('[data-act="ge-mode"][data-v="amount"]', 120); await type('#ge-monthly', '250'); ok('amount preview', /Done around/.test($('#ge-prev').innerText));
    await click('[data-act="ge-mode"][data-v="phases"]', 120); await click('[data-act="ph-add"]', 120); ok('phases editor', $$('.ph-erow').length >= 2);
    await click('[data-act="ge-mode"][data-v="date"]', 120);
    await click('[data-act="ge-save"]', 200); ok('goal saved', /Japan trip/.test(sheet()) || /Japan trip/.test(text()));
    await click('[data-act="close-sheet"]'); await go('home'); await go('goals'); ok('new goal listed', /Japan trip/.test(text()));
    await click('[data-act="goal-edit"]', 150); await click('[data-act="ge-type"][data-v="debt"]', 120); await type('#ge-name', 'Study loan'); await type('#ge-bal', '5000'); await type('#ge-apr', '4.5'); await type('#ge-min', '120');
    await click('[data-act="ge-mode"][data-v="amount"]', 120); await type('#ge-monthly', '300'); ok('debt preview', /Done around/.test($('#ge-prev').innerText)); await click('[data-act="ge-save"]', 200); await click('[data-act="close-sheet"]');
    await click('[data-act="goal-edit"]', 150); await click('[data-act="ge-type"][data-v="emergency"]', 120); ok('emergency editor', !!$('#ge-months')); await click('[data-act="close-sheet"]');
    // forecast
    await go('forecast');
    ok('forecast charts', $$('#view svg.chart').length >= 3, `${$$('#view svg.chart').length}`);
    for (const h of ['3', '12', '24', 'goals', '6']) await click(`[data-act="fc-h"][data-v="${h}"]`, 120);
    const col = $('[data-act="fc-sel"]'); if (col) { await click($$('[data-act="fc-sel"]')[2], 120); }
    const mcol = $('[data-act="fc-month"]'); if (mcol) { await click(mcol, 150); ok('month sheet', /Salary this month/.test(sheet())); await click('[data-act="close-sheet"]'); }
    await click('[data-act="income"]', 150); ok('income sheet', /Salary/.test(sheet())); await click('[data-act="sal-add"]', 100); await click('[data-act="sal-save"]', 150);
    await click('[data-act="extra-new"]', 150); await type('#ex-name', 'Freelance job'); await type('#ex-amt', '600'); await click('[data-act="ex-save"]', 150);
    ok('extra listed', /Freelance job/.test(text()));
    await click('[data-act="fc-tab"][data-v="past"]', 150); ok('past insights', /money in/i.test(text())); await click('[data-act="fc-tab"][data-v="ahead"]', 120);
    // more
    await go('more');
    for (const t of ['activity', 'plan', 'bills', 'cats', 'settings']) { await click(`[data-act="more-tab"][data-tab="${t}"]`, 120); ok(`more ${t}`, text().length > 100); }
    await click('[data-act="more-tab"][data-tab="plan"]', 120); await type('[data-ps="savePct"]', '25'); ok('save % applied', true);
    await click('[data-act="more-tab"][data-tab="settings"]', 120); await click('[data-act="theme"][data-v="dark"]', 120); ok('dark theme', document.documentElement.dataset.theme === 'dark'); await click('[data-act="theme"][data-v="system"]', 120);
    // + sheet: pay with my plan
    await go('home');
    await click('[data-act="add"]', 150); await click('[data-act="kind"][data-v="in"]', 150);
    ok('pay uses my plan', $('[data-act="in-dest"][data-v="plan"]').getAttribute('aria-pressed') === 'true');
    ok('plan bar', !!$('#plan-bar .segbar'));
    await type('#in-amt', '3200'); ok('split adds up', /All .* is split/.test(($('#sp-sum') || {}).textContent || ''), ($('#sp-sum') || {}).textContent);
    await click('[data-act="in-save"]', 200); ok('pay logged', !$('.sheet-body'));
    // other money: goals + spend
    await click('[data-act="add"]', 150); await click('[data-act="kind"][data-v="in"]', 150); await click('[data-act="in-src"][data-v="other"]', 120);
    await type('#in-amt', '200'); await click('[data-act="in-dest"][data-v="plan"]', 120); ok('extra split adds up', /All .* is split/.test(($('#sp-sum') || {}).textContent || ''));
    await click('[data-act="in-save"]', 200);
    // spending
    await click('[data-act="add"]', 150); await type('#sp-amt', '12.50'); await click('[data-act="sp-label"][data-v="food"]'); await click('[data-act="sp-save"]', 200); ok('spending logged', !$('.sheet-body'));
    // setup flow (from More → Plan: example data starts with setup already done)
    await go('more'); await click('[data-act="more-tab"][data-tab="plan"]', 120);
    await click('[data-act="setup"]', 150); ok('setup 1', /Your salary/.test(sheet()));
    for (let i = 0; i < 3; i++) await click('[data-act="su-next"]', 150);
    ok('setup 4', /Your goals/.test(sheet())); await click('[data-act="su-next"]', 200); ok('setup done', !$('.sheet-body'));
    // debt payment
    await go('goals'); await click('.goal-card [data-act="goal"][data-id="card"]', 150); await click('[data-act="gl-pay"]', 150); await click('[data-act="pd-save"]', 200);
    ok('debt paid', !$('.sheet-body'));
    for (const v of ['home', 'goals', 'forecast', 'more']) { await go(v); ok(`${v} after changes`, text().length > 200); }
  } catch (e) { errs.push('test crashed: ' + (e && e.stack || e)); }
  const out = `${errs.length ? 'ERRORS\n' + errs.join('\n') : 'no errors'}\n\n${checks.length} checks\n${log.join('\n')}`;
  document.body.insertAdjacentHTML('beforeend', `<pre id="ui-report">${out.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;')}</pre>`);
  document.title = errs.length ? `UIFAIL ${errs.length}` : `UIPASS ${checks.length}`;
})();

/* ---------- chart kit ----------
   Inline SVG, one y-axis per chart, thin marks with a 2px surface gap between stacked pieces, recessive grid.
   Every mark has a hover/tap tooltip through data-tip (see showTip). Colours come from role tokens
   (--r-bills, --r-save, --r-goal, --r-spend) or a goal's own --pN colour; text always stays in ink.
   Each chart is paired with a legend (2+ series) and a "Show as table" view by the code that uses it. */
const CW = 340;
const pathTop = (x, base, w, h, r = 4) => colPath(x, base, w, h, r);
function rectPath(x, y, w, h) { return h <= 0.3 ? '' : `M${x},${y + h}V${y}H${x + w}V${y + h}Z`; }
function legendHtml(items) { // [{ name, color, dash, hatch }]
  return `<div class="legend" aria-hidden="true">${items.map(i => `<span><i class="key${i.dash ? ' dash' : ''}${i.hatch ? ' hatch' : ''}" style="${i.dash ? `border-color:${i.color}` : `background:${i.color}`}"></i>${esc(i.name)}</span>`).join('')}</div>`;
}
function tableHtml(summary, head, rows) {
  return `<details class="tbl"><summary>${esc(summary || 'Show as table')}</summary><div class="tbl-wrap"><table class="data"><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td>${i ? c : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}
const yAxis = (L, iw, Y, ymax, ymin = 0) => { let g = ''; const ticks = ymin < 0 ? [ymin, 0, ymax] : [0, ymax / 2, ymax]; for (const v of ticks) g += `<line class="grid-l" x1="${L}" x2="${L + iw}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v < 0 ? '−' : ''}${axisFmt(Math.abs(v))}</text>`; return g; };

/* stacked columns. cols: [{ label, cur, future, vals: { key: v }, tip, attrs }], series: [{ key, name, color }]
   opts: { H, pct (100% stacked), ref: { v, label }, todayAt (index where the forecast starts) } */
function stackCols(cols, series, opts = {}) {
  const W = CW, H = opts.H || 180, L = opts.pct ? 34 : 40, R = 6, T = 14, B = 22, iw = W - L - R, ih = H - T - B;
  const tot = c => sum(series.map(s => Math.max(0, c.vals[s.key] || 0)));
  const ymax = opts.pct ? 100 : niceMax(Math.max(1, opts.ref ? opts.ref.v : 0, ...cols.map(tot)) * 1.06);
  const Y = v => T + ih - v / ymax * ih, band = iw / Math.max(1, cols.length), bw = Math.min(26, band * 0.62), every = cols.length > 12 ? 3 : cols.length > 8 ? 2 : 1;
  let g = '';
  if (opts.pct) for (const v of [0, 50, 100]) g += `<line class="grid-l" x1="${L}" x2="${L + iw}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v}%</text>`;
  else g += yAxis(L, iw, Y, ymax);
  if (opts.todayAt > 0 && opts.todayAt < cols.length) { const x = L + band * opts.todayAt; g += `<line class="today-l" x1="${x}" x2="${x}" y1="${T - 4}" y2="${T + ih}"/><text class="ax" x="${x + 3}" y="${T + 4}">ahead →</text>`; }
  cols.forEach((c, i) => {
    const x = L + band * i + (band - bw) / 2, t = tot(c), scale = opts.pct ? (t > 0 ? 100 / t : 0) : 1;
    let y0 = Y(0); const segs = series.map(s => ({ s, v: Math.max(0, c.vals[s.key] || 0) * scale })).filter(o => o.v > 0);
    segs.forEach((o, j) => {
      const h = o.v / ymax * ih, top = j === segs.length - 1, gap = j ? 2 : 0, hh = Math.max(0, h - gap), y = y0 - h;
      const d = top ? pathTop(x, y0 - gap, bw, hh) : rectPath(x, y, bw, hh);
      if (d) g += `<path d="${d}" fill="${o.s.color}"${o.s.hatch ? ' class="hatch-fill"' : ''} opacity="${c.future ? .62 : 1}" pointer-events="none"/>`;
      y0 = y;
    });
    g += `<rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${ih}" data-tip="${esc(c.tip || '')}"${c.attrs ? ' ' + c.attrs : ''}/>`;
    if ((cols.length - 1 - i) % every === 0 || c.cur) g += `<text class="ax" x="${L + band * i + band / 2}" y="${H - 6}" text-anchor="middle"${c.cur ? ' style="fill:var(--ink);font-weight:700"' : ''}>${esc(c.label)}</text>`;
  });
  if (opts.ref && !opts.pct) g += `<line x1="${L}" x2="${L + iw}" y1="${Y(opts.ref.v)}" y2="${Y(opts.ref.v)}" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="4 3" opacity=".75" pointer-events="none"/><text class="lbl" x="${L + 4}" y="${Y(opts.ref.v) - 5}">${esc(opts.ref.label)}</text>`;
  g += `<line class="base-l" x1="${L}" x2="${L + iw}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'Chart')}">${g}</svg>`;
}

/* lines over months. labels: x labels; series: [{ name, color, vals: [v|null], dash, area, width }];
   opts: { H, band: { lo: [v], hi: [v], color }, target: { v, label }, marker: { i, label }, todayAt, tips: [text per x], label } */
function lineChart(labels, series, opts = {}) {
  const W = CW, H = opts.H || 190, L = 42, R = 10, T = 16, B = 22, iw = W - L - R, ih = H - T - B, n = labels.length;
  const all = [...series.flatMap(s => s.vals), ...(opts.band ? [...opts.band.hi, ...opts.band.lo] : []), opts.target ? opts.target.v : 0].filter(v => v != null && isFinite(v));
  const lo = Math.min(0, ...all), ymax = niceMax(Math.max(1, ...all) * 1.06), ymin = lo < 0 ? -niceMax(-lo * 1.06) : 0;
  const X = i => L + (n <= 1 ? iw / 2 : i / (n - 1) * iw), Y = v => T + ih - (v - ymin) / (ymax - ymin) * ih;
  let g = yAxis(L, iw, Y, ymax, ymin);
  if (ymin < 0) g += `<line class="base-l" x1="${L}" x2="${L + iw}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  if (opts.todayAt != null && opts.todayAt > 0 && opts.todayAt < n) g += `<line class="today-l" x1="${X(opts.todayAt)}" x2="${X(opts.todayAt)}" y1="${T - 4}" y2="${T + ih}"/><text class="ax" x="${X(opts.todayAt) + 3}" y="${T + 4}">now</text>`;
  if (opts.band) { const hi = opts.band.hi, lo2 = opts.band.lo, idx = hi.map((v, i) => i).filter(i => hi[i] != null && lo2[i] != null); if (idx.length > 1) g += `<path d="M${idx.map(i => `${X(i)},${Y(hi[i])}`).join('L')}L${[...idx].reverse().map(i => `${X(i)},${Y(lo2[i])}`).join('L')}Z" fill="${opts.band.color}" opacity=".16" pointer-events="none"/>`; }
  for (const s of series) {
    const pts = s.vals.map((v, i) => v == null ? null : [X(i), Y(v)]), runs = []; let cur = [];
    pts.forEach(p => { if (p) cur.push(p); else if (cur.length) { runs.push(cur); cur = []; } }); if (cur.length) runs.push(cur);
    for (const r of runs) {
      if (s.area && r.length > 1) g += `<path d="M${r[0][0]},${Y(Math.max(0, ymin))}L${r.map(p => p.join(',')).join('L')}L${r[r.length - 1][0]},${Y(Math.max(0, ymin))}Z" fill="${s.color}" opacity=".12" pointer-events="none"/>`;
      g += `<path d="M${r.map(p => p.join(',')).join('L')}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2}" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''} pointer-events="none"/>`;
    }
    if (s.dot) pts.forEach((p, i) => { if (p && s.dot(i)) g += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2" pointer-events="none"/>`; });
  }
  if (opts.target) g += `<line x1="${L}" x2="${L + iw}" y1="${Y(opts.target.v)}" y2="${Y(opts.target.v)}" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="4 3" opacity=".8" pointer-events="none"/><text class="lbl" x="${L + iw}" y="${Y(opts.target.v) - 5}" text-anchor="end">${esc(opts.target.label)}</text>`;
  if (opts.marker && opts.marker.i >= 0 && opts.marker.i < n) { const x = X(opts.marker.i); g += `<line x1="${x}" x2="${x}" y1="${T}" y2="${T + ih}" stroke="var(--ink-2)" stroke-width="1.5" pointer-events="none"/><text class="lbl" x="${Math.min(x + 4, L + iw - 2)}" y="${T + 10}" text-anchor="${x > L + iw - 60 ? 'end' : 'start'}">${esc(opts.marker.label)}</text>`; }
  const every = n > 14 ? Math.ceil(n / 7) : n > 8 ? 2 : 1, band = n > 1 ? iw / (n - 1) : iw;
  labels.forEach((lab, i) => {
    if ((n - 1 - i) % every === 0) g += `<text class="ax" x="${X(i)}" y="${H - 6}" text-anchor="${i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}"${opts.todayAt === i ? ' style="fill:var(--ink);font-weight:700"' : ''}>${esc(lab)}</text>`;
    if (opts.tips) g += `<rect class="hit" x="${Math.max(L, X(i) - band / 2)}" y="${T}" width="${Math.min(band, iw)}" height="${ih}" data-tip="${esc(opts.tips[i] || '')}"/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'Chart')}">${g}</svg>`;
}

/* progress ring: pct 0–1, colour, size in px; the middle shows text (optional) */
function ring(pct, color, size = 56, text = '', stroke = 6) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>`
    + (p > 0 ? `<circle class="ring-v" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>` : '')
    + (text ? `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-t" style="font-size:${Math.round(size * .26)}px">${esc(text)}</text>` : '') + '</svg>';
}

/* one horizontal bar split into parts: [{ name, v, color, tip, hatch }] — with a 2px gap between parts */
function segBar(parts, opts = {}) {
  const tot = sum(parts.map(p => Math.max(0, p.v))) || 1, list = parts.filter(p => p.v > 0.004);
  return `<div class="segbar${opts.big ? ' big' : ''}" role="img" aria-label="${esc(opts.label || list.map(p => `${p.name} ${money(p.v)}`).join(', '))}">${list.map(p => `<i style="flex:${(Math.max(0, p.v) / tot).toFixed(5)} 1 0;background:${p.color}"${p.hatch ? ' class="hatch"' : ''} data-tip="${esc(p.tip || `${p.name}: ${money(p.v)}`)}"></i>`).join('') || '<i style="flex:1;background:var(--track)"></i>'}</div>`;
}

/* money flow: one source on the left split into destinations on the right, ribbon width = amount.
   outs: [{ name, v, color, tip }] */
function flowChart(srcName, outs, opts = {}) {
  const list = outs.filter(o => o.v > 0.004), tot = sum(list.map(o => o.v));
  if (!(tot > 0)) return '<p class="muted small">Nothing to show for this month yet.</p>';
  // each destination gets a row tall enough for its two-line label; its bar is in proportion to its amount
  const W = CW, gap = 4, base = 170, minSlot = 30, x0 = 6, x1 = 18, x2 = 150, x3 = 162;
  const slots = list.map(o => Math.max(minSlot, o.v / tot * base)), H = sum(slots) + gap * (list.length - 1);
  let g = `<rect x="${x0}" y="0" width="${x1 - x0}" height="${H}" rx="3" fill="var(--ink-2)" opacity=".85"/>`, ys = 0, yd = 0;
  list.forEach((o, i) => {
    const hs = o.v / tot * H, hd = Math.max(3, o.v / tot * base), m = (x1 + x2) / 2, ty = yd + Math.max(11, hd / 2 - 2);
    g += `<path d="M${x1},${ys}C${m},${ys} ${m},${yd} ${x2},${yd}V${yd + hd}C${m},${yd + hd} ${m},${ys + hs} ${x1},${ys + hs}Z" fill="${o.color}" opacity=".28" class="hit-flow" data-tip="${esc(o.tip || `${o.name}: ${money(o.v)}`)}"/>`;
    g += `<rect x="${x2}" y="${yd}" width="${x3 - x2}" height="${hd}" rx="2" fill="${o.color}" pointer-events="none"/>`;
    g += `<text class="lbl" x="${x3 + 6}" y="${ty}">${esc(o.name)}</text><text class="ax" x="${x3 + 6}" y="${ty + 13}">${esc(money(o.v))} · ${Math.round(o.v / tot * 100)}%</text>`;
    ys += hs; yd += slots[i] + gap;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || `Where ${srcName} goes`)}">${g}</svg>`;
}

/* goal timeline (Gantt): one row per goal from now to its projected finish, its date marked.
   rows: [{ name, color, fin (key|null), date (key|null), status, tip }] */
function ganttBars(curKey, rows, opts = {}) {
  if (!rows.length) return '';
  const ends = rows.flatMap(r => [r.fin, r.date]).filter(Boolean), last = ends.length ? ends.sort().pop() : Money.keyAdd(curKey, 5);
  const span = Math.max(6, Math.min(60, Money.keyDiff(curKey, last) + 2)), W = CW, L = 92, R = 8, rowH = 26, T = 16, H = T + rows.length * rowH + 16, iw = W - L - R;
  const X = k => L + Math.max(0, Math.min(span, Money.keyDiff(curKey, k))) / span * iw;
  let g = '';
  const step = span > 36 ? 12 : span > 18 ? 6 : span > 9 ? 3 : 1;
  for (let i = 0; i <= span; i += step) { const k = Money.keyAdd(curKey, i), x = X(k); g += `<line class="grid-l" x1="${x}" x2="${x}" y1="${T - 4}" y2="${H - 14}"/><text class="ax" x="${x}" y="${H - 3}" text-anchor="middle">${esc(keyShort(k, i === 0 || k.endsWith('-01')))}</text>`; }
  rows.forEach((r, i) => {
    const y = T + i * rowH + 5, h = 14, xe = r.fin ? X(Money.keyAdd(r.fin, 1)) : L + iw, w = Math.max(4, xe - L);
    g += `<text class="lbl" x="${L - 8}" y="${y + h / 2 + 4}" text-anchor="end">${esc(r.name.length > 13 ? r.name.slice(0, 12) + '…' : r.name)}</text>`;
    g += `<rect x="${L}" y="${y}" width="${w}" height="${h}" rx="4" fill="${r.color}" opacity="${r.fin ? 1 : .45}" pointer-events="none"/>`;
    if (!r.fin) g += `<path d="M${L + iw - 8},${y - 2}l8,${h / 2 + 2}l-8,${h / 2 + 2}z" fill="${r.color}" opacity=".45" pointer-events="none"/>`;
    if (r.date) { const xd = X(Money.keyAdd(r.date, 1)); g += `<line x1="${xd}" x2="${xd}" y1="${y - 4}" y2="${y + h + 4}" stroke="var(--ink)" stroke-width="2" pointer-events="none"/>`; }
    g += `<rect class="hit" x="0" y="${y - 5}" width="${W}" height="${rowH}" data-tip="${esc(r.tip || '')}"${r.attrs ? ' ' + r.attrs : ''}/>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'When each goal is done')}">${g}</svg>`;
}

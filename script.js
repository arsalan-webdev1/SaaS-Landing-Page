(() => {
  'use strict';

  /* ---------- Sample data (fictional) ---------- */
  const END_DATE = Date.UTC(2026, 8, 30); // Sep 30, 2026
  const DAY_MS = 86400000;
  const SESSIONS_PER_USER = 2.4; // sample assumption used to turn traffic shares into session counts

  const PERIODS = {
    7:  { days: 7,  label: 'last 7 days',  revenue: 11840, revenuePct: 6.8,  users: 3920,  usersPct: 4.2,  conv: 4.61, convPct: -1.3, aov: 84.10, aovPct: 2.9,
          traffic: [41, 27, 14, 11, 7], audience: { newPct: 58, devices: [44, 47, 9], duration: '3m 12s', pages: 3.9, bounce: 41.2 }, pageScale: 0.24 },
    30: { days: 30, label: 'last 30 days', revenue: 48294, revenuePct: 12.4, users: 12840, usersPct: 8.1,  conv: 4.82, convPct: 5.6,  aov: 86.40, aovPct: -2.1,
          traffic: [38, 24, 19, 11, 8], audience: { newPct: 54, devices: [46, 44, 10], duration: '3m 42s', pages: 4.3, bounce: 38.5 }, pageScale: 1 },
    90: { days: 90, label: 'last 90 days', revenue: 131760, revenuePct: 18.9, users: 31450, usersPct: 14.7, conv: 4.55, convPct: 3.2,  aov: 83.75, aovPct: 1.4,
          traffic: [36, 25, 18, 12, 9], audience: { newPct: 51, devices: [48, 42, 10], duration: '3m 58s', pages: 4.6, bounce: 36.9 }, pageScale: 2.8 }
  };

  const TRAFFIC_SOURCES = [
    { name: 'Organic search', color: '#5b4bff' },
    { name: 'Direct', color: '#2e90fa' },
    { name: 'Social media', color: '#12b3a8' },
    { name: 'Referral', color: '#f5a524' },
    { name: 'Email', color: '#e5484d' }
  ];
  const DEVICES = ['Desktop', 'Mobile', 'Tablet'];

  const TRANSACTIONS = [
    { customer: 'Maya Okafor',     id: 'TX-48201', date: '2026-09-30', amount: 129.00, status: 'completed' },
    { customer: 'Liam Hartmann',   id: 'TX-48197', date: '2026-09-29', amount: 64.50,  status: 'completed' },
    { customer: 'Sofia Ramirez',   id: 'TX-48190', date: '2026-09-29', amount: 212.80, status: 'pending' },
    { customer: 'Noah Bergström',  id: 'TX-48176', date: '2026-09-28', amount: 38.00,  status: 'refunded' },
    { customer: 'Aisha Rahman',    id: 'TX-48169', date: '2026-09-27', amount: 87.25,  status: 'completed' },
    { customer: 'Daniel Cho',      id: 'TX-48155', date: '2026-09-27', amount: 149.99, status: 'completed' },
    { customer: 'Priya Natarajan', id: 'TX-48142', date: '2026-09-26', amount: 56.40,  status: 'pending' },
    { customer: 'Lucas Moreau',    id: 'TX-48131', date: '2026-09-25', amount: 301.00, status: 'completed' },
    { customer: 'Emma Kowalski',   id: 'TX-48120', date: '2026-09-24', amount: 72.10,  status: 'refunded' },
    { customer: 'Omar Haddad',     id: 'TX-48108', date: '2026-09-23', amount: 118.60, status: 'completed' },
    { customer: 'Chloe Bennett',   id: 'TX-48094', date: '2026-09-22', amount: 45.90,  status: 'completed' },
    { customer: 'Mateo Silva',     id: 'TX-48083', date: '2026-09-21', amount: 189.00, status: 'pending' }
  ];

  const PAGES = [
    { path: '/pricing',                              views: 18420, visitors: 11260, conv: 6.8 },
    { path: '/features',                             views: 14310, visitors: 9480,  conv: 5.4 },
    { path: '/blog/small-business-analytics-guide',  views: 11870, visitors: 8910,  conv: 2.1 },
    { path: '/signup',                               views: 9640,  visitors: 6120,  conv: 11.9 },
    { path: '/docs/getting-started',                 views: 7220,  visitors: 4380,  conv: 3.3 }
  ];

  const NOTICES = [
    { text: 'Revenue passed your monthly goal.', time: '2 hours ago', unread: true },
    { text: 'Three transactions are waiting for review.', time: 'Yesterday', unread: true },
    { text: 'Your weekly summary is ready to export.', time: 'Monday', unread: false }
  ];

  const TITLES = { overview: 'Overview', analytics: 'Analytics', audience: 'Audience', reports: 'Reports', campaigns: 'Campaigns', settings: 'Settings', help: 'Help and support' };

  const KPIS = [
    { key: 'revenue', label: 'Total revenue',       icon: 'dollar', fmt: (v) => money(v) },
    { key: 'users',   label: 'Active users',        icon: 'users',  fmt: (v) => v.toLocaleString('en-US') },
    { key: 'conv',    label: 'Conversion rate',     icon: 'target', fmt: (v) => v.toFixed(2) + '%' },
    { key: 'aov',     label: 'Average order value', icon: 'tag',    fmt: (v) => money(v, 2) }
  ];

  const state = { period: '30', status: 'all', query: '', sort: 'date-desc', kpiValues: {} };
  const charts = { revenue: null, traffic: null };
  let revealDone = false;
  let observedCount = 0;

  function markRevealed(el) {
    if (el.classList.contains('is-visible')) return;
    el.classList.add('is-visible');
    if (!revealObserver) return;
    revealObserver.unobserve(el);
    observedCount -= 1;
    if (observedCount <= 0) revealObserver.disconnect(); // release the observer once every target has revealed
  }

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) markRevealed(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  // Observes every entrance target once. Later re-renders (period changes, filters) skip the entrance.
  function setupReveal() {
    const targets = $$('main .reveal-section');
    if (!revealObserver) {
      targets.forEach((el) => el.classList.add('is-visible'));
      revealDone = true;
      return;
    }
    let staggerIndex = 0;
    targets.forEach((el) => {
      if (el.classList.contains('is-visible')) return;
      const visible = el.getClientRects().length > 0; // skip sections hidden by the current view
      if (visible && el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.style.setProperty('--delay', `${Math.min(staggerIndex, 5) * 60}ms`);
        staggerIndex += 1;
      }
      revealObserver.observe(el);
      observedCount += 1;
    });
    revealDone = true;
  }

  /* ---------- Helpers ---------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const money = (n, digits = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const formatDate = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const formatIso = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Small seeded generator so the sample data is identical on every load.
  function seededRandom(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Builds a daily series with a gentle trend and weekend dip, scaled to hit `total`.
  function buildSeries(days, total, seed) {
    const random = seededRandom(seed);
    const raw = Array.from({ length: days }, (_, i) => {
      const weekday = new Date(END_DATE - (days - 1 - i) * DAY_MS).getUTCDay();
      const weekendDip = weekday === 0 || weekday === 6 ? 0.82 : 1;
      return (1 + (i / days) * 0.18 + 0.12 * Math.sin(i / 3) + (random() - 0.5) * 0.2) * weekendDip;
    });
    const scale = total / raw.reduce((a, b) => a + b, 0);
    return raw.map((v) => Math.round(v * scale));
  }

  const dataCache = {};
  function getData() {
    const key = state.period;
    if (!dataCache[key]) {
      const cfg = PERIODS[key];
      const days = cfg.days;
      dataCache[key] = {
        cfg,
        labels: Array.from({ length: days }, (_, i) => formatDate(END_DATE - (days - 1 - i) * DAY_MS)),
        current: buildSeries(days, cfg.revenue, days),
        previous: buildSeries(days, Math.round(cfg.revenue / (1 + cfg.revenuePct / 100)), days + 1),
        sparks: { users: buildSeries(days, 1000, days + 2), conv: buildSeries(days, 1000, days + 3), aov: buildSeries(days, 1000, days + 4) }
      };
    }
    return dataCache[key];
  }

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* ---------- KPI cards ---------- */
  function sparkline(values) {
    const max = Math.max(...values), min = Math.min(...values), span = max - min || 1;
    const points = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(1)},${(30 - ((v - min) / span) * 26).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline pathLength="1" points="${points}"/></svg>`;
  }

  function animateKpiValue(el, start, end, formatter, duration = 600) {
    if (!el) return;
    if (el._countRaf) { cancelAnimationFrame(el._countRaf); el._countRaf = 0; } // stop a stale run from a rapid re-render
    if (reducedMotion || !Number.isFinite(start) || !Number.isFinite(end) || start === end) {
      el.textContent = formatter(end);
      return;
    }

    const startTime = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatter(start + (end - start) * eased);
      el._countRaf = progress < 1 ? requestAnimationFrame(tick) : 0;
    };

    el._countRaf = requestAnimationFrame(tick);
  }

  function animateKpis() {
    const cards = [...document.querySelectorAll('.kpi')];
    cards.forEach((card) => {
      const key = card.dataset.kpi;
      const kpi = KPIS.find((item) => item.key === key);
      if (!kpi) return;
      const startValue = Number(card.dataset.startValue ?? card.dataset.value ?? 0);
      const endValue = Number(card.dataset.value ?? 0);
      const valueEl = card.querySelector('.kpi-value');
      if (!valueEl) return;
      animateKpiValue(valueEl, startValue, endValue, kpi.fmt);
      card.dataset.startValue = String(endValue);
    });
  }

  function renderKpis() {
    const data = getData();
    const previousValues = { ...state.kpiValues };
    const entranceClass = revealDone ? '' : ' reveal-section'; // entrance only on first paint
    $('#kpiGrid').innerHTML = KPIS.map((kpi) => {
      const value = data.cfg[kpi.key];
      const pct = data.cfg[kpi.key + 'Pct'];
      const previous = value / (1 + pct / 100);
      const up = pct >= 0;
      const spark = kpi.key === 'revenue' ? data.current : data.sparks[kpi.key];
      const previousValue = previousValues[kpi.key] ?? value;
      return `<article class="card kpi${entranceClass}" data-kpi="${kpi.key}" data-value="${value}" data-start-value="${previousValue}">
        <div class="kpi-top"><span class="kpi-icon"><svg class="i" aria-hidden="true"><use href="#i-${kpi.icon}"/></svg></span><h3>${kpi.label}</h3></div>
        <p class="kpi-value">${kpi.fmt(value)}</p>
        <p class="kpi-delta"><span class="delta ${up ? 'up' : 'down'}"><svg class="i" aria-hidden="true"><use href="#i-trend"/></svg>${up ? '+' : ''}${pct.toFixed(1)}%</span> vs ${kpi.fmt(previous)} in the previous period</p>
        ${sparkline(spark)}
      </article>`;
    }).join('');

    state.kpiValues = Object.fromEntries(KPIS.map((kpi) => [kpi.key, data.cfg[kpi.key]]));
    animateKpis();
  }

  /* ---------- Charts ---------- */
  function initCharts() {
    if (typeof Chart === 'undefined') {
      $('#revenueWrap').innerHTML = '<p class="empty">Charts could not load. Check your connection and refresh. The rest of the dashboard still works.</p>';
      $('.donut-wrap').hidden = true;
      return;
    }
    Chart.defaults.font.family = "'Manrope', system-ui, sans-serif";
    Chart.defaults.color = '#5f6682';
    Chart.defaults.animation = reducedMotion ? false : { duration: 850, easing: 'easeOutQuart' };

    charts.revenue = new Chart($('#revenueChart'), {
      type: 'line',
      data: { labels: [], datasets: [
        { label: 'Revenue', data: [], borderColor: '#5b4bff', backgroundColor: 'rgba(91, 75, 255, .08)', fill: true, borderWidth: 2.5, tension: 0.35, pointRadius: 0, pointHoverRadius: 5 },
        { label: 'Previous period', data: [], borderColor: '#9aa0b8', borderDash: [6, 4], borderWidth: 2, tension: 0.35, pointRadius: 0, pointHoverRadius: 4 }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: reducedMotion ? false : {
          duration: 850,
          easing: 'easeOutQuart',
          delay: (context) => {
            const total = context.chart.data.labels.length || 1;
            return Math.round((context.dataIndex / total) * 400); // proportional stagger, capped at 400 ms even for 90-day series
          }
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
          y: { beginAtZero: true, grid: { color: '#eceef6' }, border: { display: false }, ticks: { callback: (v) => (v >= 1000 ? '$' + v / 1000 + 'k' : '$' + v) } }
        }
      }
    });

    charts.traffic = new Chart($('#trafficChart'), {
      type: 'doughnut',
      data: { labels: TRAFFIC_SOURCES.map((s) => s.name), datasets: [{ data: [], backgroundColor: TRAFFIC_SOURCES.map((s) => s.color), borderWidth: 2, borderColor: '#fff', hoverOffset: 6, hoverBorderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        animation: reducedMotion ? false : { duration: 800, easing: 'easeOutCubic' },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` } } }
      }
    });
  }

  function renderRevenue() {
    const data = getData();
    $('#revSub').textContent = `Daily revenue for the ${data.cfg.label}`;
    $('#revTotal').textContent = money(data.cfg.revenue);
    if (!charts.revenue) return;
    charts.revenue.data.labels = data.labels;
    charts.revenue.data.datasets[0].data = data.current;
    charts.revenue.data.datasets[1].data = data.previous;
    charts.revenue.update();
    $('#revenueChart').setAttribute('aria-label', `Line chart of daily revenue for the ${data.cfg.label}, totalling ${money(data.cfg.revenue)}, compared with the previous period.`);
  }

  function renderTraffic() {
    const { traffic: values, users } = getData().cfg;
    const sessions = users * SESSIONS_PER_USER;
    $('#trafficLegend').innerHTML = TRAFFIC_SOURCES.map((s, i) =>
      `<li><i style="background:${s.color}"></i>${s.name}<span>${Math.round((sessions * values[i]) / 100).toLocaleString('en-US')}</span><b>${values[i]}%</b></li>`).join('');
    if (!charts.traffic) return;
    charts.traffic.data.datasets[0].data = values;
    charts.traffic.update();
    $('#trafficChart').setAttribute('aria-label', 'Traffic sources: ' + TRAFFIC_SOURCES.map((s, i) => `${s.name} ${values[i]}%`).join(', ') + '.');
  }

  /* ---------- Pages and audience ---------- */
  function renderPages() {
    const scale = getData().cfg.pageScale;
    const top = PAGES[0].views * scale;
    $('#pagesTable tbody').innerHTML = PAGES.map((p) => {
      const views = Math.round(p.views * scale);
      return `<tr><td><code>${esc(p.path)}</code></td>
        <td><div class="bar"><span>${views.toLocaleString('en-US')}</span><span class="track"><span class="fill" style="width:${((views / top) * 100).toFixed(0)}%"></span></span></div></td>
        <td class="num">${Math.round(p.visitors * scale).toLocaleString('en-US')}</td><td class="num">${p.conv.toFixed(1)}%</td></tr>`;
    }).join('');
  }

  function renderAudience() {
    const a = getData().cfg.audience;
    const returning = 100 - a.newPct;
    const devices = DEVICES.map((name, i) =>
      `<div class="dev-row"><span>${name}</span><span class="track"><span class="fill" style="width:${a.devices[i]}%"></span></span><b>${a.devices[i]}%</b></div>`).join('');
    $('#audienceBody').innerHTML = `
      <div class="aud-block"><h3>Visitor type</h3>
        <div class="split-bar" role="img" aria-label="${a.newPct}% new visitors, ${returning}% returning visitors"><span style="width:${a.newPct}%"></span><span></span></div>
        <div class="split-legend"><span>New <b>${a.newPct}%</b></span><span>Returning <b>${returning}%</b></span></div></div>
      <div class="aud-block"><h3>Devices</h3>${devices}</div>
      <div class="aud-block"><h3>Engagement</h3><div class="stats">
        <div><b>${a.duration}</b><small>Avg. session</small></div><div><b>${a.pages}</b><small>Pages per visit</small></div><div><b>${a.bounce}%</b><small>Bounce rate</small></div></div></div>`;
  }

  /* ---------- Transactions ---------- */
  function getVisibleTransactions() {
    const query = state.query.trim().toLowerCase();
    const [field, direction] = state.sort.split('-');
    const factor = direction === 'asc' ? 1 : -1;
    return TRANSACTIONS
      .filter((t) => (state.status === 'all' || t.status === state.status) &&
        (!query || t.customer.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)))
      .sort((a, b) => (field === 'amount' ? (a.amount - b.amount) * factor : (a.date.localeCompare(b.date) * factor || a.id.localeCompare(b.id))));
  }

  function renderTransactions() {
    const rows = getVisibleTransactions();
    $('#txCount').textContent = `Showing ${rows.length} of ${TRANSACTIONS.length} transactions`;
    $('#txTable tbody').innerHTML = rows.length
      ? rows.map((t) => `<tr><td data-label="Customer">${esc(t.customer)}</td><td data-label="Transaction ID">${esc(t.id)}</td>
          <td data-label="Date">${formatIso(t.date)}</td><td data-label="Amount" class="num">${money(t.amount, 2)}</td>
          <td data-label="Status"><span class="badge ${t.status}">${t.status[0].toUpperCase() + t.status.slice(1)}</span></td></tr>`).join('')
      : `<tr class="empty-row"><td colspan="5">No transactions match${state.query ? ` "${esc(state.query)}"` : ' this filter'}. Clear the search or choose another status.</td></tr>`;
  }

  /* ---------- CSV export ---------- */
  function toCsv(headers, rows) {
    const cell = (value) => {
      let text = String(value);
      if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text; // block spreadsheet formula injection
      return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    return [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  }

  function downloadFile(filename, content) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportTransactions() {
    const rows = getVisibleTransactions();
    if (!rows.length) { toast('Nothing to export. Clear the search or filter first.'); return; }
    const csv = toCsv(['Customer', 'Transaction ID', 'Date', 'Amount (USD)', 'Status'], rows.map((t) => [t.customer, t.id, t.date, t.amount.toFixed(2), t.status]));
    downloadFile(`pulseboard-transactions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported ${rows.length} transaction${rows.length === 1 ? '' : 's'} to CSV.`);
  }

  function generateReport() {
    const cfg = getData().cfg;
    const rows = KPIS.map((k) => [k.label, cfg[k.key], +(cfg[k.key] / (1 + cfg[k.key + 'Pct'] / 100)).toFixed(2), cfg[k.key + 'Pct']]);
    downloadFile(`pulseboard-report-${state.period}d.csv`, toCsv(['Metric', 'Current period', 'Previous period', 'Change (%)'], rows));
    toast(`Report for the ${cfg.label} downloaded.`);
  }

  /* ---------- Navigation ---------- */
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    $('#menuBtn').setAttribute('aria-expanded', String(open));
    $('#menuBtn').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }

  function showView(name) {
    if (!TITLES[name]) name = 'overview';
    $$('[data-views]').forEach((el) => { el.hidden = !el.dataset.views.split(' ').includes(name); });
    $$('.nav a, .nav-help').forEach((a) => (a.dataset.view === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $('#viewTitle').textContent = TITLES[name];
    setNav(false);
    closePopovers();
    if (charts.revenue) { charts.revenue.resize(); charts.traffic.resize(); }
    window.scrollTo(0, 0);
    return name;
  }

  /* ---------- Popovers ---------- */
  const popovers = [
    { button: $('#notifBtn'), panel: $('#notifPanel'), closeTimer: 0 },
    { button: $('#profileBtn'), panel: $('#profileMenu'), closeTimer: 0 }
  ];

  function showPopover(popover) {
    if (popover.closeTimer) { clearTimeout(popover.closeTimer); popover.closeTimer = 0; }
    popover.panel.classList.remove('is-closing');
    popover.panel.hidden = false;
    popover.button.setAttribute('aria-expanded', 'true');
  }

  // Animates the panel out, then hides it. Falls back to an instant hide for reduced motion or stale timers.
  function hidePopover(popover) {
    if (popover.panel.hidden || popover.panel.classList.contains('is-closing')) return;
    if (reducedMotion) {
      popover.panel.hidden = true;
      popover.button.setAttribute('aria-expanded', 'false');
      return;
    }
    popover.panel.classList.add('is-closing');
    const finish = () => {
      popover.panel.removeEventListener('animationend', onEnd);
      clearTimeout(popover.closeTimer);
      popover.closeTimer = 0;
      popover.panel.classList.remove('is-closing');
      popover.panel.hidden = true;
      popover.button.setAttribute('aria-expanded', 'false');
    };
    const onEnd = (event) => { if (event.target === popover.panel) finish(); };
    popover.panel.addEventListener('animationend', onEnd);
    popover.closeTimer = setTimeout(finish, 300);
  }

  function closePopovers(except) {
    popovers.forEach((p) => { if (p !== except) hidePopover(p); });
  }

  function renderNotices() {
    $('#noticeList').innerHTML = NOTICES.map((n) => `<li class="${n.unread ? 'unread' : ''}">${esc(n.text)}<small>${esc(n.time)}</small></li>`).join('');
    $('#notifDot').hidden = !NOTICES.some((n) => n.unread);
  }

  /* ---------- Period handling ---------- */
  function setPeriod(period) {
    state.period = period;
    $('#period').value = period;
    $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.period === period)));
    renderKpis();
    renderRevenue();
    renderTraffic();
    renderPages();
    renderAudience();
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    $('#period').addEventListener('change', (e) => setPeriod(e.target.value));
    $$('.seg button').forEach((b) => b.addEventListener('click', () => setPeriod(b.dataset.period)));

    $('#statusFilter').addEventListener('change', (e) => { state.status = e.target.value; renderTransactions(); });
    $('#sortBy').addEventListener('change', (e) => { state.sort = e.target.value; renderTransactions(); });
    $('#globalSearch').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderTransactions();
      const txSection = $('#txTitle').closest('section');
      if (state.query.trim() && txSection.hidden) { showView('reports'); history.replaceState(null, '', '#reports'); }
    });

    $('#menuBtn').addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
    $('#scrim').addEventListener('click', () => setNav(false));

    popovers.forEach((p) => p.button.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = p.panel.hidden || p.panel.classList.contains('is-closing');
      closePopovers(p);
      if (willOpen) showPopover(p); else hidePopover(p);
    }));
    $('#markRead').addEventListener('click', () => { NOTICES.forEach((n) => { n.unread = false; }); renderNotices(); toast('All notifications marked as read.'); });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.popover-host')) closePopovers();
      const viewTarget = e.target.closest('[data-view]');
      if (viewTarget) {
        e.preventDefault();
        const name = showView(viewTarget.dataset.view);
        history.replaceState(null, '', '#' + name);
        return;
      }
      const actionTarget = e.target.closest('[data-action]');
      if (!actionTarget) return;
      const actions = {
        export: exportTransactions,
        report: generateReport,
        billing: () => toast('Billing is a frontend demonstration. No account is connected.'),
        signout: () => toast('Demo only. There is no account to sign out of.')
      };
      closePopovers();
      if (actions[actionTarget.dataset.action]) actions[actionTarget.dataset.action]();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const open = popovers.find((p) => !p.panel.hidden);
      closePopovers();
      if (open) open.button.focus();
      if (document.body.classList.contains('nav-open')) { setNav(false); $('#menuBtn').focus(); }
    });

    window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
  }

  /* ---------- Init ---------- */
  initCharts();
  renderNotices();
  renderTransactions();
  setPeriod(state.period);
  bindEvents();
  setupReveal();
  showView(location.hash.slice(1));
})();

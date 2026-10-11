/* Рабочее пространство — интерактив для страниц кейсов.
   Без зависимостей. Mermaid подгружается только если на странице есть .mermaid.
   Компоненты описаны в .claude/skills/pm-case/references/components.md */
(function () {
  'use strict';

  var root = document.documentElement;
  var MERMAID_SRC = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';
  var THEME_KEY = 'case-theme';
  var I18N = {
    ru: {
      locale: 'ru-RU', total: 'Всего', empty: 'В этом представлении нет строк', series: 'Ряды на графике', chart: 'График',
      sum: 'Итого', light: 'Светлая тема', dark: 'Тёмная тема', stage: 'Этап', today: 'Сегодня', wk: 'нед.', d: 'дн.',
      monShort: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
      monFull: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
      st: { done: 'Готово', active: 'В работе', plan: 'Запланировано', risk: 'Есть риск', blocked: 'Заблокировано' },
      close: 'Закрыть', image: 'Изображение', lbHint: 'Клик — увеличить или уменьшить, Esc — закрыть'
    },
    uk: {
      locale: 'uk-UA', total: 'Усього', empty: 'У цьому поданні немає рядків', series: 'Ряди на графіку', chart: 'Графік',
      sum: 'Разом', light: 'Світла тема', dark: 'Темна тема', stage: 'Етап', today: 'Сьогодні', wk: 'тиж.', d: 'дн.',
      monShort: ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'],
      monFull: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'],
      st: { done: 'Готово', active: 'У роботі', plan: 'Заплановано', risk: 'Є ризик', blocked: 'Заблоковано' },
      close: 'Закрити', image: 'Зображення', lbHint: 'Клік — збільшити або зменшити, Esc — закрити'
    }
  };
  var T = I18N[(root.getAttribute('lang') || 'ru').slice(0, 2).toLowerCase()] || I18N.ru;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function color(name) { return (name && name.charAt(0) === '#') ? name : (css('--c-' + (name || 'gray')) || css('--c-gray')); }
  function nf(d) { return new Intl.NumberFormat(T.locale, { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function readJSON(el) {
    var s = el.querySelector('script[type="application/json"]');
    if (!s) return null;
    try { return JSON.parse(s.textContent); } catch (e) { console.error('Неверный JSON в компоненте', el, e); return null; }
  }
  function onResize(el, fn) {
    var raf = 0;
    if (window.ResizeObserver) new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(fn); }).observe(el);
    else window.addEventListener('resize', fn);
  }

  /* ---------- icons ---------- */
  var ICONS = {
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    warning: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    team: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3 6"/>',
    chart: '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    tag: '<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    status: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
    building: '<path d="M4 21V5l8-2v18M12 8h8v13M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M3 21h18"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    github: '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.doc) + '</svg>';
  }
  function initIcons() {
    $$('[data-icon]').forEach(function (el) { el.innerHTML = svg(el.getAttribute('data-icon')); });
  }

  /* ---------- theme ---------- */
  var themeListeners = [];
  function onTheme(fn) { themeListeners.push(fn); }
  function emitTheme() { themeListeners.forEach(function (fn) { fn(); }); }
  function isDark() {
    return root.getAttribute('data-theme') === 'dark';
  }
  function paintThemeButtons() {
    $$('[data-theme-toggle]').forEach(function (b) {
      var label = isDark() ? T.light : T.dark;
      b.innerHTML = svg(isDark() ? 'sun' : 'moon');
      b.setAttribute('aria-label', label);
      b.title = label;
    });
  }
  function initTheme() {
    try { var t = localStorage.getItem(THEME_KEY); if (t === 'dark' || t === 'light') root.setAttribute('data-theme', t); } catch (e) { /* хранилище недоступно */ }
    $$('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
        paintThemeButtons();
        emitTheme();
      });
    });
    paintThemeButtons();
  }

  /* ---------- table of contents ---------- */
  function slug(s) {
    return (s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60)) || 'section';
  }
  function headingText(h) {
    if (h.getAttribute('data-toc')) return h.getAttribute('data-toc');
    var c = h.cloneNode(true);
    $$('.eyebrow', c).forEach(function (x) { x.remove(); });
    return c.textContent.trim();
  }
  function initToc() {
    var heads = $$('.page-body > h2, .page-body > h3').filter(function (h) { return !h.closest('.callout, .board, figure'); });
    heads.forEach(function (h) {
      if (h.id) return;
      var id = slug(headingText(h)), n = 1, base = id;
      while (document.getElementById(id)) id = base + '-' + (++n);
      h.id = id;
    });
    $$('nav.toc').forEach(function (nav) {
      var deep = !nav.hasAttribute('data-depth') || nav.getAttribute('data-depth') !== '2';
      nav.innerHTML = heads.filter(function (h) { return deep || h.tagName === 'H2'; }).map(function (h) {
        return '<a class="lvl-' + h.tagName.charAt(1) + '" href="#' + encodeURIComponent(h.id) + '">' + esc(headingText(h)) + '</a>';
      }).join('');
    });

    // кнопки-ссылки на подразделы сразу под заголовком раздела
    $$('.chips[data-auto]').forEach(function (box) {
      var h2 = box.previousElementSibling;
      while (h2 && h2.tagName !== 'H2') h2 = h2.previousElementSibling;
      var html = '', el = box.nextElementSibling;
      while (el && el.tagName !== 'H2') {
        if (el.tagName === 'H3' && el.id) html += '<a href="#' + encodeURIComponent(el.id) + '">' + esc(headingText(el)) + '</a>';
        el = el.nextElementSibling;
      }
      box.innerHTML = html;
      if (!html) box.remove();
    });

    // подсветка текущего раздела в оглавлении
    if (!('IntersectionObserver' in window) || !heads.length) return;
    var links = $$('nav.toc a');
    var current = null;
    function mark(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) { a.setAttribute('aria-current', String(decodeURIComponent(a.getAttribute('href').slice(1)) === id)); });
    }
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var top = heads.filter(function (h) { return visible[h.id]; })[0];
      if (top) { mark(top.id); return; }
      var above = heads.filter(function (h) { return h.getBoundingClientRect().top < 80; });
      if (above.length) mark(above[above.length - 1].id);
    }, { rootMargin: '-60px 0px -70% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------- database tables ---------- */
  function cellValue(td) {
    if (!td) return '';
    if (td.hasAttribute('data-value')) {
      var dv = td.getAttribute('data-value'), n = parseFloat(dv);
      return isNaN(n) ? dv : n;
    }
    var t = td.textContent.trim();
    var c = t.replace(/\s/g, '').replace(/[%₽$€×]/g, '').replace('−', '-').replace(',', '.');
    if (/^[-+]?\d+(\.\d+)?$/.test(c)) return parseFloat(c);
    return t;
  }
  function initDb(db) {
    var table = $('table', db);
    if (!table || !table.tBodies.length) return;
    var tbody = table.tBodies[0];
    var rows = $$('tr', tbody);
    var ths = $$('thead th', table);
    var state = { col: -1, dir: 0, filter: null };

    // выравнивание вправо — только если числа видны в тексте; data-value влияет лишь на сортировку
    var numeric = ths.map(function (th, i) {
      var vals = rows.map(function (r) {
        var td = r.cells[i];
        if (!td) return '';
        var c = td.textContent.trim().replace(/\s/g, '').replace(/[%₽$€×]/g, '').replace('−', '-').replace(',', '.');
        return c === '' ? '' : (/^[-+]?\d+(\.\d+)?$/.test(c) ? 1 : 'x');
      }).filter(function (v) { return v !== ''; });
      return vals.length > 0 && vals.every(function (v) { return typeof v === 'number'; });
    });
    ths.forEach(function (th, i) {
      if (!numeric[i]) return;
      th.classList.add('num');
      rows.forEach(function (r) { if (r.cells[i]) r.cells[i].classList.add('num'); });
    });

    ths.forEach(function (th, i) {
      if (!th.hasAttribute('data-bars')) return;
      var vals = rows.map(function (r) { return cellValue(r.cells[i]); });
      var max = Math.max.apply(null, vals.filter(function (v) { return typeof v === 'number'; }).concat([0]));
      var col = th.getAttribute('data-bars');
      rows.forEach(function (r, k) {
        var v = vals[k];
        if (typeof v !== 'number' || !r.cells[i] || max <= 0) return;
        var b = document.createElement('span');
        b.className = 'bar';
        b.style.width = Math.max(3, Math.round(v / max * 64)) + 'px';
        if (col) b.style.background = color(col);
        r.cells[i].insertBefore(b, r.cells[i].firstChild);
      });
    });

    var sortable = !table.hasAttribute('data-nosort');
    ths.forEach(function (th, i) {
      var label = th.innerHTML;
      if (!sortable || th.hasAttribute('data-nosort')) { th.innerHTML = '<span>' + label + '</span>'; return; }
      th.innerHTML = '<button type="button">' + label + '</button>';
      var initial = th.getAttribute('aria-sort');
      if (initial === 'ascending' || initial === 'descending') { state.col = i; state.dir = initial === 'ascending' ? 1 : -1; }
      else th.setAttribute('aria-sort', 'none');
      th.firstChild.addEventListener('click', function () {
        if (state.col === i) state.dir = -state.dir;
        else { state.col = i; state.dir = numeric[i] ? -1 : 1; }
        render();
      });
    });

    function colIndex(name) {
      if (/^\d+$/.test(String(name))) return +name;
      var key = String(name).trim().toLowerCase(), idx = -1;
      ths.forEach(function (th, i) { if (th.textContent.trim().toLowerCase() === key) idx = i; });
      return idx;
    }
    var views = $$('.db-views button', db);
    function viewFilter(b) { return b.hasAttribute('data-col') ? { col: colIndex(b.getAttribute('data-col')), match: (b.getAttribute('data-match') || '').toLowerCase() } : null; }
    views.forEach(function (b) {
      if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false');
      if (b.getAttribute('aria-pressed') === 'true') state.filter = viewFilter(b);
      b.addEventListener('click', function () {
        views.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        state.filter = viewFilter(b);
        render();
      });
    });
    if (views.length && !views.some(function (b) { return b.getAttribute('aria-pressed') === 'true'; })) views[0].setAttribute('aria-pressed', 'true');

    var foot = $('.db-foot', db);
    var empty = document.createElement('div');
    empty.className = 'db-empty';
    empty.textContent = T.empty;
    empty.hidden = true;
    table.parentNode.insertBefore(empty, table.nextSibling);

    function render() {
      var list = rows.slice();
      if (state.filter && state.filter.col >= 0) {
        var f = state.filter;
        list = list.filter(function (r) { var c = r.cells[f.col]; return c && c.textContent.toLowerCase().indexOf(f.match) >= 0; });
      }
      if (state.col >= 0 && state.dir) {
        var i = state.col;
        list.sort(function (a, b) {
          var va = cellValue(a.cells[i]), vb = cellValue(b.cells[i]);
          if (va === '' && vb !== '') return 1;
          if (vb === '' && va !== '') return -1;
          var r = (typeof va === 'number' && typeof vb === 'number') ? va - vb : String(va).localeCompare(String(vb), 'ru');
          return r * state.dir;
        });
      }
      rows.forEach(function (r) { r.hidden = list.indexOf(r) < 0; });
      list.forEach(function (r) { tbody.appendChild(r); });
      ths.forEach(function (th, k) {
        if (!th.hasAttribute('aria-sort')) return;
        th.setAttribute('aria-sort', k === state.col && state.dir ? (state.dir > 0 ? 'ascending' : 'descending') : 'none');
      });
      if (foot) foot.textContent = T.total + ' ' + list.length;
      empty.hidden = list.length > 0;
    }
    render();
  }

  /* ---------- view switch (галерея / таблица) ---------- */
  function initViewSwitch(box) {
    var btns = $$('[data-view-btn]', box), panes = $$('[data-view]', box);
    function show(name) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view-btn') === name)); });
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-view') !== name; });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-view-btn')); }); });
    if (btns.length) show((btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0] || btns[0]).getAttribute('data-view-btn'));
  }

  /* ---------- boards ---------- */
  function initBoards() {
    $$('.board-col').forEach(function (col) {
      var c = $('.board-col-head .count', col);
      if (c) c.textContent = $$('.board-card', col).length;
    });
  }

  /* ---------- charts ---------- */
  function niceTicks(min, max, count) {
    if (max === min) max = min + 1;
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / count))), err = span / count / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 2.25) step *= 2.5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step, out = [];
    for (var v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function evenTicks(min, max, count) {
    // границы заданы явно: делим ровно, подбирая число интервалов с «круглым» шагом
    var options = count ? [count] : [4, 5, 3, 6, 2];
    for (var i = 0; i < options.length; i++) {
      var step = (max - min) / options[i];
      if (Math.abs(step * 100 - Math.round(step * 100)) < 1e-9 || count) {
        var out = [];
        for (var k = 0; k <= options[i]; k++) out.push(+(min + step * k).toFixed(10));
        return out;
      }
    }
    return niceTicks(min, max, 4);
  }
  function stepDecimals(t) {
    var step = t.length > 1 ? Math.abs(t[1] - t[0]) : 1;
    var s = String(+step.toFixed(10));
    return s.indexOf('.') < 0 ? 0 : s.split('.')[1].length;
  }
  function textW(s) { return String(s).length * 7; }

  function initChart(fig) {
    var spec = readJSON(fig);
    if (!spec || !spec.series || !spec.labels) return;
    var type = spec.type || fig.getAttribute('data-type') || 'line';
    var series = spec.series;
    var vis = series.map(function () { return true; });
    var dec = spec.decimals != null ? spec.decimals : 0;
    var unit = spec.unit || '';
    var fmt = function (v) { return nf(dec).format(v) + unit; };
    var tipLabels = spec.tipLabels || spec.labels;
    var cap = $('figcaption', fig);

    if (series.length > 1) {
      var legend = document.createElement('div');
      legend.className = 'chart-legend';
      legend.setAttribute('role', 'group');
      legend.setAttribute('aria-label', T.series);
      series.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-pressed', 'true');
        b.innerHTML = '<span class="sw"></span>' + esc(s.name);
        b.addEventListener('click', function () {
          if (vis[i] && vis.filter(Boolean).length === 1) return;
          vis[i] = !vis[i];
          b.setAttribute('aria-pressed', String(vis[i]));
          draw();
        });
        legend.appendChild(b);
      });
      fig.insertBefore(legend, cap);
    }
    var plot = document.createElement('div');
    plot.className = 'chart-plot';
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', spec.alt || ($('.chart-title', fig) ? $('.chart-title', fig).textContent : T.chart));
    fig.insertBefore(plot, cap);

    var geo = null, cur = -1, tip = null;

    function paintLegend() {
      $$('.chart-legend .sw', fig).forEach(function (sw, i) { sw.style.background = color(series[i].color); });
    }

    function draw() {
      paintLegend();
      var W = Math.max(280, Math.round(plot.clientWidth || 640));
      var C = { grid: css('--line'), axis: css('--line-strong'), text: css('--muted'), bg: css('--bg'), hover: css('--hover'), fg: css('--fg') };
      var s;
      if (type === 'hbar') s = drawH(W, C); else s = drawXY(W, C);
      plot.innerHTML = s;
      tip = document.createElement('div');
      tip.className = 'chart-tip';
      tip.hidden = true;
      plot.appendChild(tip);
      if (cur >= 0 && document.activeElement === plot) show(cur);
    }

    function drawXY(W, C) {
      var labels = spec.labels, n = labels.length;
      var H = spec.height || Math.round(Math.max(200, Math.min(320, W * 0.42)));
      var stacked = !!spec.stacked && type === 'bar';
      var maxV = 0, minV = 0;
      if (stacked) {
        for (var j = 0; j < n; j++) {
          var sum = 0;
          series.forEach(function (se, k) { if (vis[k]) sum += Math.max(0, +se.data[j] || 0); });
          maxV = Math.max(maxV, sum);
        }
      } else {
        series.forEach(function (se, k) {
          if (!vis[k]) return;
          se.data.forEach(function (v) { if (v == null) return; maxV = Math.max(maxV, v); minV = Math.min(minV, v); });
        });
      }
      (spec.refLines || []).forEach(function (r) { maxV = Math.max(maxV, r.value); });
      var lo = spec.yMin != null ? spec.yMin : Math.min(0, minV);
      var ticks = spec.yMax != null ? evenTicks(lo, spec.yMax, spec.yTicks) : niceTicks(lo, maxV, spec.yTicks || 4);
      var yMin = ticks[0], yMax = ticks[ticks.length - 1];
      var axisUnit = spec.axisUnit != null ? spec.axisUnit : unit;
      var tickNf = new Intl.NumberFormat(T.locale, { maximumFractionDigits: stepDecimals(ticks) });
      var tf = function (v) { return tickNf.format(v) + axisUnit; };
      var m = { t: 12, r: 10, b: 28, l: Math.max.apply(null, ticks.map(function (t) { return textW(tf(t)); })) + 14 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b, band = iw / n;
      var y = function (v) { return m.t + (1 - (v - yMin) / (yMax - yMin)) * ih; };
      var x = type === 'line'
        ? function (i) { return m.l + (n === 1 ? iw / 2 : i * iw / (n - 1)); }
        : function (i) { return m.l + band * (i + 0.5); };
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">';
      ticks.forEach(function (t) {
        s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="' + (t === 0 ? C.axis : C.grid) + '"/>';
        s += '<text x="' + (m.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end" font-size="12" fill="' + C.text + '">' + esc(tf(t)) + '</text>';
      });
      if (type !== 'line') s += '<rect class="band" y="' + m.t + '" width="' + band + '" height="' + ih + '" fill="' + C.hover + '" visibility="hidden"/>';
      var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 46))));
      labels.forEach(function (l, i) {
        if (i % every) return;
        var anchor = type === 'line' && i === 0 ? 'start' : (type === 'line' && i === n - 1 ? 'end' : 'middle');
        s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="' + anchor + '" font-size="12" fill="' + C.text + '">' + esc(l) + '</text>';
      });
      (spec.refLines || []).forEach(function (r) {
        var yy = y(r.value), col = r.color ? color(r.color) : C.text;
        s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + yy + '" y2="' + yy + '" stroke="' + col + '" stroke-dasharray="4 4"/>';
        if (r.label) s += '<text x="' + (W - m.r) + '" y="' + (yy - 6) + '" text-anchor="end" font-size="12" fill="' + col + '">' + esc(r.label) + '</text>';
      });
      if (type === 'line') {
        series.forEach(function (se, k) {
          if (!vis[k]) return;
          var col = color(se.color), d = '', pen = false;
          se.data.forEach(function (v, i) {
            if (v == null) { pen = false; return; }
            d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1);
            pen = true;
          });
          s += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (se.width || 2) + '" stroke-linejoin="round" stroke-linecap="round"' + (se.dashed ? ' stroke-dasharray="5 4"' : '') + '/>';
          if (n <= 16) se.data.forEach(function (v, i) { if (v != null) s += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="2.5" fill="' + col + '"/>'; });
        });
        s += '<line class="guide" y1="' + m.t + '" y2="' + (H - m.b) + '" stroke="' + C.axis + '" visibility="hidden"/>';
        series.forEach(function (se, k) { s += '<circle class="hdot" data-k="' + k + '" r="4.5" fill="' + color(se.color) + '" stroke="' + C.bg + '" stroke-width="2" visibility="hidden"/>'; });
      } else {
        var on = series.filter(function (se, k) { return vis[k]; }).length;
        var inner = band * 0.72;
        var bw = stacked ? Math.min(44, inner) : Math.min(34, inner / on);
        labels.forEach(function (l, i) {
          var base = 0, idx = 0;
          series.forEach(function (se, k) {
            if (!vis[k]) return;
            var v = +se.data[i] || 0, col = color(se.color);
            if (stacked) {
              var y0 = y(base), y1 = y(base + Math.max(0, v));
              s += '<rect x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, y0 - y1).toFixed(1) + '" fill="' + col + '" stroke="' + C.bg + '" stroke-width="1"/>';
              base += Math.max(0, v);
            } else {
              var xx = x(i) - (bw * on) / 2 + idx * bw;
              var top = y(Math.max(v, 0)), bottom = y(Math.min(v, 0));
              s += '<rect x="' + (xx + 1).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + Math.max(0, bottom - top).toFixed(1) + '" rx="2" fill="' + col + '"/>';
            }
            idx++;
          });
        });
      }
      s += '</svg>';
      geo = { kind: type, W: W, n: n, x: x, y: y, m: m, band: band, iw: iw, stacked: stacked };
      return s;
    }

    function drawH(W, C) {
      var labels = spec.labels, n = labels.length;
      var on = series.filter(function (se, k) { return vis[k]; });
      var k = on.length;
      var barH = k > 1 ? 12 : 18, rowH = k > 1 ? barH * k + 16 : 34;
      var H = n * rowH + 4;
      var maxV = spec.xMax || 0;
      on.forEach(function (se) { se.data.forEach(function (v) { if (v != null) maxV = Math.max(maxV, v); }); });
      if (maxV <= 0) maxV = 1;
      var longest = Math.max.apply(null, labels.map(textW));
      var labW = Math.min(Math.round(W * 0.42), longest + 14);
      var valW = Math.max.apply(null, on.map(function (se) { return Math.max.apply(null, se.data.map(function (v) { return textW(fmt(v || 0)); })); })) + 10;
      var iw = Math.max(40, W - labW - valW);
      var xv = function (v) { return labW + Math.max(0, v) / maxV * iw; };
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">';
      s += '<rect class="band" x="0" width="' + W + '" height="' + rowH + '" fill="' + C.hover + '" rx="3" visibility="hidden"/>';
      labels.forEach(function (l, i) {
        var top = i * rowH + 2, maxChars = Math.floor((labW - 14) / 7), txt = String(l);
        if (txt.length > maxChars) txt = txt.slice(0, Math.max(1, maxChars - 1)) + '…';
        s += '<text x="' + (labW - 10) + '" y="' + (top + rowH / 2 + 4) + '" text-anchor="end" font-size="13" fill="' + C.fg + '">' + esc(txt) + '</text>';
        var idx = 0;
        series.forEach(function (se, sk) {
          if (!vis[sk]) return;
          var v = se.data[i] || 0;
          var col = (spec.highlight != null && k === 1) ? (i === spec.highlight ? color(se.color) : css('--line-strong')) : color(se.color);
          var by = top + (rowH - barH * k) / 2 + idx * barH;
          s += '<rect x="' + labW + '" y="' + by.toFixed(1) + '" width="' + Math.max(1, xv(v) - labW).toFixed(1) + '" height="' + (barH - (k > 1 ? 2 : 0)) + '" rx="3" fill="' + col + '"/>';
          s += '<text x="' + (xv(v) + 6).toFixed(1) + '" y="' + (by + barH / 2 + 4).toFixed(1) + '" font-size="12" fill="' + C.text + '">' + esc(fmt(v)) + '</text>';
          idx++;
        });
      });
      s += '</svg>';
      geo = { kind: 'hbar', W: W, n: n, rowH: rowH, labW: labW, xv: xv };
      return s;
    }

    function show(i) {
      if (!geo || !tip) return;
      cur = i;
      var svgEl = plot.querySelector('svg'), sc = plot.clientWidth / geo.W;
      var vals = series.map(function (se, k) { return vis[k] && se.data[i] != null ? se.data[i] : null; });
      var shown = vals.filter(function (v) { return v != null; });
      var X, topY;
      if (geo.kind === 'hbar') {
        var b = svgEl.querySelector('.band');
        b.setAttribute('y', i * geo.rowH + 2);
        b.setAttribute('visibility', 'visible');
        X = geo.xv(Math.max.apply(null, shown.concat([0]))) - 20;
        topY = i * geo.rowH + 4;
      } else if (geo.kind === 'line') {
        X = geo.x(i);
        var g = svgEl.querySelector('.guide');
        g.setAttribute('x1', X); g.setAttribute('x2', X); g.setAttribute('visibility', 'visible');
        $$('.hdot', svgEl).forEach(function (d) {
          var k = +d.getAttribute('data-k');
          if (vals[k] == null) { d.setAttribute('visibility', 'hidden'); return; }
          d.setAttribute('cx', X); d.setAttribute('cy', geo.y(vals[k])); d.setAttribute('visibility', 'visible');
        });
        topY = geo.y(Math.max.apply(null, shown));
      } else {
        X = geo.x(i);
        var band = svgEl.querySelector('.band');
        band.setAttribute('x', geo.m.l + geo.band * i);
        band.setAttribute('visibility', 'visible');
        var peak = geo.stacked ? shown.reduce(function (a, v) { return a + Math.max(0, v); }, 0) : Math.max.apply(null, shown);
        topY = geo.y(peak);
      }
      var rows = series.map(function (se, k) {
        if (vals[k] == null) return '';
        return '<div class="row"><span class="sw" style="background:' + color(se.color) + '"></span>' + esc(se.name) + '<b>' + esc(fmt(vals[k])) + '</b></div>';
      }).join('');
      if (geo.stacked && shown.length > 1) rows += '<div class="row">' + T.sum + '<b>' + esc(fmt(shown.reduce(function (a, v) { return a + v; }, 0))) + '</b></div>';
      tip.innerHTML = '<div>' + esc(tipLabels[i]) + '</div>' + rows;
      tip.hidden = false;
      var tw = tip.offsetWidth, cw = plot.clientWidth;
      tip.style.left = clamp(X * sc, tw / 2, cw - tw / 2) + 'px';
      tip.style.top = Math.max(tip.offsetHeight + 10, topY * sc) + 'px';
    }
    function hide() {
      if (tip) tip.hidden = true;
      var svgEl = plot.querySelector('svg');
      if (!svgEl) return;
      $$('.guide, .hdot, .band', svgEl).forEach(function (el) { el.setAttribute('visibility', 'hidden'); });
    }
    plot.addEventListener('pointermove', function (e) {
      if (!geo) return;
      var r = plot.getBoundingClientRect(), sc = geo.W / r.width;
      var px = (e.clientX - r.left) * sc, py = (e.clientY - r.top) * sc, i;
      if (geo.kind === 'hbar') i = Math.floor((py - 2) / geo.rowH);
      else if (geo.kind === 'line') i = Math.round((px - geo.m.l) / (geo.iw / Math.max(1, geo.n - 1)));
      else i = Math.floor((px - geo.m.l) / geo.band);
      show(clamp(i, 0, geo.n - 1));
    });
    plot.addEventListener('pointerleave', hide);
    plot.addEventListener('focus', function () { show(cur < 0 ? geo.n - 1 : cur); });
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', function (e) {
      var back = geo.kind === 'hbar' ? 'ArrowUp' : 'ArrowLeft', fwd = geo.kind === 'hbar' ? 'ArrowDown' : 'ArrowRight';
      if (e.key === back) { e.preventDefault(); show(clamp(cur - 1, 0, geo.n - 1)); }
      if (e.key === fwd) { e.preventDefault(); show(clamp(cur + 1, 0, geo.n - 1)); }
    });

    draw();
    onResize(plot, draw);
    onTheme(draw);
  }

  /* ---------- timeline ---------- */
  var STATUSES = {
    done: { label: T.st.done, color: 'green' },
    active: { label: T.st.active, color: 'blue' },
    plan: { label: T.st.plan, color: 'gray' },
    risk: { label: T.st.risk, color: 'red' },
    blocked: { label: T.st.blocked, color: 'orange' }
  };
  var MON_SHORT = T.monShort;
  var MON_FULL = T.monFull;
  function pd(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function dayDiff(a, b) { return Math.round((b - a) / 864e5); }
  function dfmt(d) { return d.getDate() + ' ' + MON_SHORT[d.getMonth()]; }

  function initTimeline(el) {
    var spec = readJSON(el);
    if (!spec || !spec.items || !spec.items.length) return;
    var st = {};
    Object.keys(STATUSES).forEach(function (k) { st[k] = STATUSES[k]; });
    Object.keys(spec.statuses || {}).forEach(function (k) { st[k] = spec.statuses[k]; });
    var items = spec.items.map(function (it) {
      var o = {}; Object.keys(it).forEach(function (k) { o[k] = it[k]; });
      o.s = pd(it.start); o.e = pd(it.end); return o;
    });
    var start = spec.start ? pd(spec.start) : new Date(Math.min.apply(null, items.map(function (i) { return i.s; })));
    var end = spec.end ? pd(spec.end) : new Date(Math.max.apply(null, items.map(function (i) { return i.e; })));
    var total = dayDiff(start, end) + 1;
    var frac = function (d) { return clamp(dayDiff(start, d) / total, 0, 1); };
    var labelW = spec.labelWidth || 200;
    var col = function (f) { return 'calc(' + labelW + 'px + (100% - ' + labelW + 'px) * ' + f.toFixed(4) + ')'; };

    var ticks = [];
    if (total > 50) {
      var d = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      while (d <= end) {
        ticks.push({ d: new Date(d), label: MON_FULL[d.getMonth()] + (d.getMonth() === 0 ? ' ' + d.getFullYear() : '') });
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    } else {
      for (var w = 7; w < total; w += 7) { var dw = new Date(start); dw.setDate(dw.getDate() + w); ticks.push({ d: dw, label: dfmt(dw) }); }
    }

    var h = '<div class="tl-scroll"><div class="tl" style="--tl-label:' + labelW + 'px"><div class="tl-head"><div>' + esc(spec.label || T.stage) + '</div><div class="tl-scale">';
    ticks.forEach(function (t) { h += '<span style="left:' + (frac(t.d) * 100).toFixed(2) + '%">' + esc(t.label) + '</span>'; });
    h += '</div></div><div class="tl-body">';
    ticks.forEach(function (t) { h += '<div class="tl-grid" style="left:' + col(frac(t.d)) + '"></div>'; });
    items.forEach(function (it, i) {
      var s0 = frac(it.s), w = clamp((dayDiff(it.s, it.e) + 1) / total, 0.004, 1 - s0);
      var stc = (st[it.status] || st.plan).color;
      var c = it.color || stc;
      h += '<div class="tl-row"><div class="tl-label">' + esc(it.name) + '</div><div class="tl-track">' +
        '<button type="button" class="tl-bar" data-i="' + i + '" aria-pressed="false" style="left:' + (s0 * 100).toFixed(2) + '%;width:' + (w * 100).toFixed(2) + '%;--bar-color:' + color(c) + '" aria-label="' + esc(it.name + ', ' + dfmt(it.s) + ' – ' + dfmt(it.e) + ', ' + (st[it.status] || st.plan).label) + '">' + esc(it.short || it.name) + '</button></div></div>';
    });
    if (spec.today) {
      var td = spec.today === 'auto' ? new Date() : pd(spec.today);
      if (td >= start && td <= end) h += '<div class="tl-today" style="left:' + col(frac(td)) + '" title="' + T.today + '"></div>';
    }
    h += '</div></div></div>';
    var used = [];
    items.forEach(function (it) { var k = st[it.status] ? it.status : 'plan'; if (used.indexOf(k) < 0) used.push(k); });
    h += '<div class="tl-legend">' + used.map(function (k) { return '<span><i style="background:' + color(st[k].color) + '"></i>' + esc(st[k].label) + '</span>'; }).join('') +
      (spec.today ? '<span><i style="background:' + color('red') + ';width:2px"></i>' + T.today + '</span>' : '') + '</div>';
    h += '<div class="tl-detail" aria-live="polite"></div>';
    el.innerHTML = h;

    var detail = $('.tl-detail', el);
    var bars = $$('.tl-bar', el);
    function select(i) {
      bars.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-i') === i)); });
      var it = items[i], s = st[it.status] || st.plan, len = dayDiff(it.s, it.e) + 1;
      var dur = len >= 14 ? Math.round(len / 7) + ' ' + T.wk : len + ' ' + T.d;
      detail.innerHTML = '<div class="name">' + esc(it.name) + '</div><div class="meta"><span class="tag status" data-color="' + esc(s.color) + '">' + esc(s.label) + '</span><span>' +
        dfmt(it.s) + ' – ' + dfmt(it.e) + ', ' + dur + '</span>' + (it.owner ? '<span>' + esc(it.owner) + '</span>' : '') + '</div>' + (it.note ? '<div>' + esc(it.note) + '</div>' : '');
    }
    bars.forEach(function (b) {
      b.addEventListener('click', function () { select(+b.getAttribute('data-i')); });
      b.addEventListener('mouseenter', function () { select(+b.getAttribute('data-i')); });
    });
    var first = 0;
    items.some(function (it, i) { if (it.status === 'active' || it.status === 'risk') { first = i; return true; } return false; });
    select(first);
    onTheme(function () { bars.forEach(function (b) { var it = items[+b.getAttribute('data-i')]; b.style.setProperty('--bar-color', color(it.color || (st[it.status] || st.plan).color)); }); });
  }

  /* ---------- mermaid ---------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.mermaid) return resolve();
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function initMermaid() {
    var nodes = $$('.mermaid');
    if (!nodes.length) return;
    nodes.forEach(function (n) { if (!n.hasAttribute('data-src')) n.setAttribute('data-src', n.textContent); });
    function render() {
      var m = window.mermaid;
      if (!m) return;
      m.initialize({
        startOnLoad: false, theme: 'base', securityLevel: 'strict', fontFamily: css('--font'),
        flowchart: { curve: 'basis', htmlLabels: true },
        themeVariables: {
          fontFamily: css('--font'), fontSize: '14px', background: css('--surface'),
          primaryColor: css('--card'), primaryTextColor: css('--fg'), primaryBorderColor: css('--line-strong'),
          secondaryColor: css('--bg-blue'), tertiaryColor: css('--bg-gray'), lineColor: css('--muted'), textColor: css('--fg'),
          mainBkg: css('--card'), nodeBorder: css('--line-strong'), clusterBkg: css('--bg'), clusterBorder: css('--line-strong'),
          edgeLabelBackground: css('--surface'), titleColor: css('--fg'), actorBkg: css('--card'), actorBorder: css('--line-strong'),
          noteBkgColor: css('--bg-yellow'), noteTextColor: css('--fg'), noteBorderColor: css('--line-strong')
        }
      });
      nodes.forEach(function (n) { n.removeAttribute('data-processed'); n.textContent = n.getAttribute('data-src'); });
      m.run({ nodes: nodes }).catch(function (e) { console.error('Mermaid', e); });
    }
    loadScript(MERMAID_SRC).then(function () { render(); onTheme(render); }).catch(function () {
      nodes.forEach(function (n) { n.style.whiteSpace = 'pre-wrap'; n.style.textAlign = 'left'; });
    });
  }

  /* ---------- просмотр картинок поверх страницы ---------- */
  function initLightbox() {
    var links = $$('figure.image a[href]').filter(function (a) { return a.querySelector('img'); });
    if (!links.length) return;
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', T.image);
    dlg.innerHTML = '<div class="lb-frame"><img alt=""></div>' +
      '<button type="button" class="lb-close" aria-label="' + esc(T.close) + '" title="' + esc(T.close) + '">' + svg('x') + '</button>' +
      '<div class="lb-hint">' + esc(T.lbHint) + '</div>';
    document.body.appendChild(dlg);
    var frame = $('.lb-frame', dlg), img = $('img', frame);
    function close() {
      if (dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    }
    dlg.addEventListener('close', function () { img.removeAttribute('src'); frame.classList.remove('zoomed'); });
    function open(a) {
      var thumb = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = thumb.getAttribute('alt') || '';
      frame.classList.remove('zoomed');
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    links.forEach(function (a) {
      a.addEventListener('click', function (ev) {
        if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
        ev.preventDefault();
        open(a);
      });
    });
    img.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var r = img.getBoundingClientRect();
      var fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
      if (frame.classList.toggle('zoomed')) {
        frame.scrollLeft = fx * img.naturalWidth - frame.clientWidth / 2;
        frame.scrollTop = fy * img.naturalHeight - frame.clientHeight / 2;
      }
    });
    frame.addEventListener('click', function (ev) { if (ev.target === frame) close(); });
    $('.lb-close', dlg).addEventListener('click', close);
  }

  /* ---------- links ---------- */
  function initLinks() {
    $$('a[href^="http"]').forEach(function (a) {
      if (a.host !== location.host) { a.target = '_blank'; a.rel = 'noopener'; }
    });
  }

  function init() {
    initTheme();
    initIcons();
    initToc();
    $$('.db').forEach(initDb);
    $$('[data-views]').forEach(initViewSwitch);
    initBoards();
    $$('figure.chart').forEach(initChart);
    $$('.timeline').forEach(initTimeline);
    initMermaid();
    initLightbox();
    initLinks();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Faro Digital — medición anónima de eventos y fricción.
   Guarda eventos en Supabase (tabla public.events). No guarda nombres, teléfonos
   ni nada que identifique a la persona: solo un id aleatorio del navegador.
   Respeta "Do Not Track". Los envíos van en lotes para no hacer lenta la página. */
(() => {
  const SB_URL = 'https://blbcyrfrdmrnauxxcsrz.supabase.co';
  const SB_KEY = 'sb_publishable_jbPE3roXIHmnAsRSdRdaVQ_wuuNr8GL';
  if ( navigator.doNotTrack === '1' || window.doNotTrack === '1') { window.faroTrack = () => {}; window.faroLead = () => Promise.reject(new Error('off')); return; }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  let vid = localStorage.getItem('faro-vid'); if (!vid) { vid = uid(); localStorage.setItem('faro-vid', vid); }
  let sid = sessionStorage.getItem('faro-sid'); if (!sid) { sid = uid(); sessionStorage.setItem('faro-sid', sid); }
  const page = location.pathname.split('/').pop() || 'index.html';
  const device = matchMedia('(max-width:600px)').matches ? 'phone' : matchMedia('(max-width:1000px)').matches ? 'tablet' : 'desktop';
  const lang = () => localStorage.getItem('faro-lang') || 'es';
  const headers = {'apikey': SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'};

  let queue = [];
  const flush = (final) => {
    if (!queue.length) return;
    const body = JSON.stringify(queue.splice(0, 50));
    fetch(SB_URL + '/rest/v1/events', {method: 'POST', headers, body, keepalive: !!final}).catch(() => {});
  };
  setInterval(flush, 4000);
  const track = (name, data) => {
    queue.push({visitor_id: vid, session_id: sid, name: String(name).slice(0, 60), page, data: data || {}, referrer: document.referrer.slice(0, 200) || null, device, lang: lang(), vw: innerWidth, vh: innerHeight});
    if (queue.length >= 20) flush();
  };
  window.faroTrack = track;

  // pedidos de cotización: se guardan en public.leads
  window.faroLead = (lead) => fetch(SB_URL + '/rest/v1/leads', {method: 'POST', headers, body: JSON.stringify(Object.assign({visitor_id: vid, session_id: sid, page, lang: lang()}, lead))})
    .then(r => { if (!r.ok) throw new Error('lead ' + r.status); return true; });

  // ---- vista de página + origen ----
  const q = new URLSearchParams(location.search);
  const utm = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'].forEach(k => { if (q.get(k)) utm[k] = q.get(k).slice(0, 80); });
  track('page_view', Object.assign({title: document.title.slice(0, 80)}, utm));
  addEventListener('load', () => {
    const n = performance.getEntriesByType('navigation')[0];
    if (n) { const ms = Math.round(n.loadEventStart || n.domComplete); track('load_time', {ms}); if (ms > 4000) track('friction_slow_load', {ms}); }
  });

  // ---- profundidad de scroll y tiempo en la página ----
  let maxDepth = 0; const marks = [25, 50, 75, 100]; const hit = new Set();
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    const d = h > 0 ? Math.round(scrollY / h * 100) : 100; maxDepth = Math.max(maxDepth, d);
    marks.forEach(m => { if (d >= m && !hit.has(m)) { hit.add(m); track('scroll_depth', {pct: m}); } });
  }, {passive: true});
  const t0 = performance.now(); let hiddenAt = 0, hiddenTotal = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { hiddenAt = performance.now(); track('page_leave', {seconds: Math.round((performance.now() - t0 - hiddenTotal) / 1000), max_scroll: maxDepth}); flush(true); }
    else if (hiddenAt) { hiddenTotal += performance.now() - hiddenAt; hiddenAt = 0; }
  });
  addEventListener('pagehide', () => flush(true));

  // ---- secciones que la gente realmente ve ----
  const seen = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, key = el.id || el.className.split(' ')[0] + ':' + [...document.querySelectorAll('.' + el.className.split(' ')[0])].indexOf(el);
    if (seen.has(key)) return; seen.add(key); track('section_view', {section: key});
  }), {threshold: .5});
  document.querySelectorAll('main > section, main > .blocks, .panel, .block, .julio, .steps, .page-head').forEach(el => io.observe(el));

  // ---- clics, clics de rabia, clics muertos ----
  const label = el => (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const where = el => { const s = el.closest('section, header, footer, aside, .qm, .block, .panel'); return s ? (s.id || s.className.split(' ')[0]) : 'page'; };
  let recent = [];
  document.addEventListener('click', e => {
    const el = e.target.closest('a, button, input, select, textarea, label, summary, [role="button"], [role="tab"]');
    const now = performance.now();
    recent = recent.filter(c => now - c.t < 800); recent.push({t: now, x: e.clientX, y: e.clientY});
    const near = recent.filter(c => Math.abs(c.x - e.clientX) < 30 && Math.abs(c.y - e.clientY) < 30);
    if (near.length === 3) track('friction_rage_click', {target: el ? label(el) : (e.target.tagName || '').toLowerCase(), area: where(e.target), x: Math.round(e.clientX / innerWidth * 100), y: Math.round(e.clientY / innerHeight * 100)});
    if (!el) {
      // clic en algo que parece tocable pero no hace nada (imágenes, títulos, tarjetas)
      const t = e.target, cs = getComputedStyle(t);
      if (cs.cursor !== 'pointer' && /^(IMG|H1|H2|H3|P|SPAN|B|LI|DIV)$/.test(t.tagName)) track('friction_dead_click', {tag: t.tagName.toLowerCase(), text: label(t), area: where(t)});
      return;
    }
    const href = el.getAttribute && el.getAttribute('href') || '';
    const data = {target: label(el), area: where(el)};
    if (href) data.href = href.slice(0, 120);
    if (/^tel:/.test(href)) track('contact_call', data);
    else if (/wa\.me|whatsapp/.test(href)) track('contact_whatsapp', data);
    else if (/^mailto:/.test(href)) track('contact_email', data);
    else if (/^https?:/.test(href) && !href.includes(location.host)) track('outbound_click', data);
    track('click', data);
  }, true);

  // ---- formularios: campos que la gente empieza y abandona ----
  document.addEventListener('focusin', e => { if (e.target.matches('input, textarea, select')) track('field_focus', {field: e.target.id || e.target.name || e.target.type}); });

  // ---- errores de la página ----
  addEventListener('error', e => track('js_error', {msg: String(e.message || '').slice(0, 160), src: String(e.filename || '').split('/').pop(), line: e.lineno}));
  addEventListener('unhandledrejection', e => track('js_error', {msg: String(e.reason && e.reason.message || e.reason).slice(0, 160), kind: 'promise'}));
})();

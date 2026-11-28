/* Faro Digital — comportamiento compartido: idioma, menú, cajón móvil, fotos */
(() => {
  let lang = localStorage.getItem('faro-lang') || 'es';
  const tEls = [...document.querySelectorAll('[data-en]')];
  tEls.forEach(el => el.dataset.es = el.innerHTML);
  function applyLang(){
    document.documentElement.lang = lang;
    tEls.forEach(el => el.innerHTML = el.dataset[lang]);
    document.querySelectorAll('[data-lang-toggle]').forEach(b => b.textContent = lang === 'es' ? 'English' : 'Español');
    localStorage.setItem('faro-lang', lang);
  }
  // medición (assets/medir.js); si no está cargado, no hace nada
  const T_ = (name, data) => { if (window.faroTrack) window.faroTrack(name, data); };
  // Supabase para las cotizaciones (clave pública: solo permite guardar, no leer)
  const SB_URL = 'https://blbcyrfrdmrnauxxcsrz.supabase.co', SB_KEY = 'sb_publishable_jbPE3roXIHmnAsRSdRdaVQ_wuuNr8GL';
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const store = (s, k) => { try { let v = s.getItem(k); if (!v) { v = rid(); s.setItem(k, v); } return v; } catch (e) { return rid(); } };
  document.querySelectorAll('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => { lang = lang === 'es' ? 'en' : 'es'; applyLang(); T_('lang_change', {to: lang}); }));

  // menú: transparente sobre fotos oscuras (como Tesla), blanco sobre contenido claro
  const top = document.getElementById('top');
  const darkEls = [...document.querySelectorAll('.panel, .julio, .s-hero')];
  const onScroll = () => {
    const y = 40; // punto bajo el menú
    const overDark = darkEls.some(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    const solid = !overDark || document.body.classList.contains('open');
    top.classList.toggle('solid', solid);
    top.classList.toggle('glass', !solid && scrollY > 8); // al bajar sobre fondo oscuro: vidrio oscuro
  };
  addEventListener('scroll', onScroll, {passive:true}); addEventListener('resize', onScroll); onScroll();

  // marca la página actual en el menú
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.top nav a, .drawer a').forEach(a => { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });

  // cajón móvil
  const menu = document.querySelector('[data-menu]');
  if (menu) menu.addEventListener('click', () => { document.body.classList.add('open'); onScroll(); T_('menu_open'); });
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { document.body.classList.remove('open'); onScroll(); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') { document.body.classList.remove('open'); onScroll(); } });

  // fotos que se acomodan al entrar
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), {threshold:.25});
  document.querySelectorAll('.panel').forEach(p => io.observe(p));

  // foto de Julio: si todavía no existe, muestra sus iniciales
  document.querySelectorAll('img[data-fallback]').forEach(img => {
    const swap = () => { const m = document.createElement('div'); m.className = 'mono'; m.textContent = img.dataset.fallback; img.replaceWith(m); };
    if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap);
  });

  // hero de Julio: el círculo y la foto se mueven un poco con el mouse
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.julio').forEach(sec => {
      const ph = sec.querySelector('.photo');
      if (!ph) return;
      sec.addEventListener('pointermove', e => {
        const r = sec.getBoundingClientRect();
        ph.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 2);
        ph.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 2);
      });
      sec.addEventListener('pointerleave', () => { ph.style.setProperty('--mx', 0); ph.style.setProperty('--my', 0); });
    });
  }

  /* ---------- Julio: la información sale al tocar cada tarjeta ---------- */
  document.querySelectorAll('.julio .facts').forEach(group => {
    const info = group.closest('.info'), reveal = info.querySelector('.reveal');
    const btns = [...group.querySelectorAll('button')], panels = [...info.querySelectorAll('[data-panel]')];
    btns.forEach(b => b.addEventListener('click', () => {
      const was = b.getAttribute('aria-expanded') === 'true';
      btns.forEach(x => x.setAttribute('aria-expanded', 'false'));
      panels.forEach(p => p.classList.remove('on'));
      if (!was) { b.setAttribute('aria-expanded', 'true'); panels[+b.dataset.tab].classList.add('on'); reveal.classList.add('open'); T_('about_reveal', {tab: +b.dataset.tab}); }
      else reveal.classList.remove('open');
    }));
  });

  /* ---------- luz del faro: haz que gira, aura y partículas (canvas) ----------
     El haz sale de la lámpara de la foto, gira despacio y barre la página (también hacia abajo).
     Bordes suaves que se apagan con la distancia, un aura grande que respira
     y partículas de polvo que solo brillan cuando la luz pasa por ellas. */
  document.querySelectorAll('.beam').forEach(beam => {
    const panel = beam.closest('.panel'), img = panel.querySelector(':scope > img');
    beam.innerHTML = '';
    const cv = document.createElement('canvas');
    cv.className = 'beamfx'; cv.setAttribute('aria-hidden', 'true');
    panel.insertBefore(cv, beam);
    const ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, LX = 0, LY = 0, dots = [], visible = true;
    const place = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = panel.clientWidth; H = panel.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (img.naturalWidth) {
        const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), rw = img.naturalWidth * s, rh = img.naturalHeight * s;
        LX = (W - rw) / 2 + rw * +beam.dataset.x; LY = (H - rh) / 2 + rh * +beam.dataset.y;
      }
      const n = W < 700 ? 140 : 280;
      dots = Array.from({length: n}, () => ({x: Math.random() * W, y: Math.random() * H, r: .5 + Math.random() * 1.9, vx: .05 + Math.random() * .22, vy: (Math.random() - .5) * .12, ph: Math.random() * 6.28, tw: .6 + Math.random() * 1.6}));
    };
    if (img.complete) place(); else img.addEventListener('load', place);
    addEventListener('resize', place);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !reduce) requestAnimationFrame(draw); }).observe(panel);

    const PERIOD = 16000;                 // una vuelta cada 16 s, velocidad constante
    const HALF = .11;                    // medio ancho del haz (rad)
    const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };

    function cone(a, R, power){
      // muchas capas de cuña con poca opacidad = bordes suaves y naturales
      for (let k = 0; k < 9; k++) {
        const hw = HALF * (.18 + k * .14), al = power * .085 * (1 - k / 10);
        const g = ctx.createRadialGradient(LX, LY, 0, LX, LY, R);
        g.addColorStop(0, `rgba(255,246,224,${al * 1.6})`);
        g.addColorStop(.12, `rgba(255,238,206,${al})`);
        g.addColorStop(.45, `rgba(255,228,190,${al * .35})`);
        g.addColorStop(1, 'rgba(255,220,180,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(LX + Math.cos(a + Math.PI / 2) * 5, LY + Math.sin(a + Math.PI / 2) * 5);
        ctx.arc(LX, LY, R, a - hw, a + hw);
        ctx.lineTo(LX + Math.cos(a - Math.PI / 2) * 5, LY + Math.sin(a - Math.PI / 2) * 5);
        ctx.closePath(); ctx.fill();
      }
    }
    function glow(r, rgb, a){
      const g = ctx.createRadialGradient(LX, LY, 0, LX, LY, r);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.35, `rgba(${rgb},${a * .35})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(LX, LY, r, 0, Math.PI * 2); ctx.fill();
    }
    function draw(now){
      if (!W) { if (!reduce) requestAnimationFrame(draw); return; }
      const t = reduce ? 4000 : now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const a = (t % PERIOD) / PERIOD * Math.PI * 2 + 1.2;
      const flick = .93 + .05 * Math.sin(t / 310) + .02 * Math.sin(t / 97);   // la llama nunca es perfecta
      const R = Math.hypot(W, H) * 1.05;
      cone(a, R, flick);                   // haz principal
      cone(a + Math.PI, R, flick * .85);   // haz opuesto (lente de dos caras)
      // aura: halo grande que respira + núcleo blanco
      const breathe = .9 + .1 * Math.sin(t / 1400);
      glow(Math.min(W, H) * .75 * breathe, '255,210,150', .24 * flick);
      glow(240 * breathe, '255,224,176', .42 * flick);
      glow(90, '255,244,222', .8 * flick);
      glow(20, '255,255,250', .95);
      // partículas: polvo y brisa del mar; brillan cuando el haz o el aura las tocan
      for (const p of dots) {
        if (!reduce) { p.x += p.vx; p.y += p.vy + Math.sin(t / 2000 + p.ph) * .08; if (p.x > W + 5) p.x = -5; if (p.y < -5) p.y = H + 5; if (p.y > H + 5) p.y = -5; }
        const dx = p.x - LX, dy = p.y - LY, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
        const inBeam = Math.max(Math.exp(-Math.pow(angDiff(ang, a) / (HALF * 1.1), 2)), .85 * Math.exp(-Math.pow(angDiff(ang, a + Math.PI) / (HALF * 1.1), 2)));
        const lit = inBeam * Math.exp(-d / (R * .5)) + .9 * Math.exp(-d / 160);
        const tw = .65 + .35 * Math.sin(t / 900 * p.tw + p.ph);
        const al = Math.min(1, .03 + lit * .95) * tw;
        if (al < .02) continue;
        ctx.fillStyle = `rgba(255,240,215,${al.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + lit * .6), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      if (!reduce && visible) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  });

  /* ---------- pop-up de cotización: una pregunta a la vez ---------- */
  const T = {
    es:{step:'Paso', of:'de', q0:'¿Para quién es tu página?', h0:'Toca una opción.', church:'Iglesia', school:'Escuela', other:'Otro',
        q1:'¿Qué te gustaría tener?', h1:'Elige todo lo que quieras.', chips:['Sitio nuevo','Rediseño','Ofrendas en línea','Inscripciones','Transmisiones en vivo','Calendario de eventos','Cuidado mensual'],
        cont:'Continuar', q2:'¿Cómo te contactamos?', h2:'Solo dos datos y listo.', name:'Tu nombre', contact:'Tu número de teléfono', send:'Enviar', badName:'Escribe tu nombre.', badContact:'Escribe un número de teléfono válido (10 dígitos).', sending:'Enviando…', failed:'No se pudo enviar por aquí. Mándalo por WhatsApp con un toque:', viaWa:'Enviar por WhatsApp',
        thanks:'¡Gracias, {n}!', done:'Recibí tu solicitud. Te llamo en 1 o 2 días.', s0:'Para', s1:'Quiero', s2:'Teléfono', ok:'Listo', close:'Cerrar',
        msg:'Hola Julio, soy {n}. Quiero una página para: {t}. Me interesa: {c}. Mi contacto: {k}.'},
    en:{step:'Step', of:'of', q0:'Who is your website for?', h0:'Tap one option.', church:'Church', school:'School', other:'Other',
        q1:'What would you like to have?', h1:'Pick as many as you like.', chips:['New website','Redesign','Online giving','Enrollment','Live streams','Events calendar','Monthly care'],
        cont:'Continue', q2:'How do we reach you?', h2:'Just two details and done.', name:'Your name', contact:'Your phone number', send:'Send', badName:'Please enter your name.', badContact:'Please enter a valid phone number (10 digits).', sending:'Sending…', failed:'It could not be sent from here. Send it on WhatsApp with one tap:', viaWa:'Send on WhatsApp',
        thanks:'Thank you, {n}!', done:'I received your request. I will call you within 1–2 days.', s0:'For', s1:'Wants', s2:'Phone', ok:'Done', close:'Close',
        msg:'Hi Julio, I am {n}. I want a website for: {t}. I am interested in: {c}. My contact: {k}.'}
  };
  const ICON = {
    church:'<svg viewBox="0 0 24 24"><path d="M12 2v4M10 4h4M5 21V11l7-4 7 4v10M3 21h18M10 21v-4h4v4"/></svg>',
    school:'<svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.6 2.7 3 6 3s6-1.4 6-3v-5M22 9v6"/></svg>',
    other:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>'
  };
  let qm = null, st = {}, cur = 0;
  const buzz = () => { if (navigator.vibrate) navigator.vibrate(12); };
  function buildQuote(){
    const t = T[lang];
    qm = document.createElement('div');
    qm.className = 'qm'; qm.setAttribute('role', 'dialog'); qm.setAttribute('aria-modal', 'true'); qm.setAttribute('aria-label', t.q0);
    qm.innerHTML = `<div class="bg"></div><div class="card">
      <div class="bar"><i></i></div>
      <div class="head"><button class="back" type="button" aria-label="Atrás">←</button><small class="count"></small><button class="x" type="button" data-qclose aria-label="${t.close}">×</button></div>
      <section class="qstep" data-s="0"><h3>${t.q0}</h3><p class="hint">${t.h0}</p><div class="opts three">
        <button class="opt" type="button" data-v="${t.church}">${ICON.church}${t.church}</button>
        <button class="opt" type="button" data-v="${t.school}">${ICON.school}${t.school}</button>
        <button class="opt" type="button" data-v="${t.other}">${ICON.other}${t.other}</button></div></section>
      <section class="qstep" data-s="1"><h3>${t.q1}</h3><p class="hint">${t.h1}</p><div class="chips">${t.chips.map(c => `<button class="chip" type="button" data-v="${c}">${c}</button>`).join('')}</div>
        <button class="btn neon next" type="button" data-next disabled>${t.cont} →</button></section>
      <section class="qstep" data-s="2"><h3>${t.q2}</h3><p class="hint">${t.h2}</p>
        <label for="q-name">${t.name}</label><input id="q-name" autocomplete="name" enterkeyhint="next">
        <label for="q-contact">${t.contact}</label><input id="q-contact" type="tel" autocomplete="tel" inputmode="tel" placeholder="(239) 555-1234" enterkeyhint="send">
        <p class="err" role="status"></p><button class="btn neon next" type="button" data-send disabled><span class="lbl">${t.send} →</span><svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
        <a class="btn wa-send" hidden target="_blank" rel="noopener">${t.viaWa}</a></section>
      <div class="flood" aria-hidden="true"></div>
      <section class="qstep done" data-s="3"><div class="confetti"></div><div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3 class="ty"></h3><p class="hint">${t.done}</p><ul class="summary"></ul>
        <div class="sendrow"><button class="btn neon" type="button" data-qclose>${t.ok}</button></div></section>
    </div>`;
    document.body.appendChild(qm);
    const steps = [...qm.querySelectorAll('.qstep')], bar = qm.querySelector('.bar i'), count = qm.querySelector('.count'), back = qm.querySelector('.back');
    const nameI = qm.querySelector('#q-name'), contactI = qm.querySelector('#q-contact'), err = qm.querySelector('.err'), sendB = qm.querySelector('[data-send]');
    const validName = () => nameI.value.trim().length > 1;
    const validContact = () => contactI.value.replace(/\D/g, '').length >= 10;
    qm.show = (i, rev) => {
      cur = i;
      steps.forEach((s, j) => { s.classList.toggle('on', j === i); s.classList.toggle('rev', !!rev && j === i); });
      bar.style.width = [25, 55, 85, 100][i] + '%';
      count.textContent = i < 3 ? `${t.step} ${i + 1} ${t.of} 3` : '';
      back.hidden = i === 0 || i === 3;
      if (i === 2) setTimeout(() => (validName() ? contactI : nameI).focus(), 350);
      if (i < 3) T_(rev ? 'quote_back' : 'quote_step', {step: i + 1});
    };
    // paso 1: tocar avanza solo
    qm.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => {
      qm.querySelectorAll('.opt').forEach(x => x.classList.remove('sel')); o.classList.add('sel'); st.type = o.dataset.v; buzz(); T_('quote_option', {type: o.dataset.v});
      setTimeout(() => qm.show(1), 320);
    }));
    // paso 2: elegir varias
    const nextB = qm.querySelector('[data-next]');
    qm.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      c.classList.toggle('sel'); buzz(); T_('quote_chip', {chip: c.dataset.v, on: c.classList.contains('sel')});
      st.wants = [...qm.querySelectorAll('.chip.sel')].map(x => x.dataset.v);
      nextB.disabled = !st.wants.length;
    }));
    nextB.addEventListener('click', () => qm.show(2));
    // paso 3: dos datos, validación en vivo
    const check = () => { nameI.classList.toggle('ok', validName()); contactI.classList.toggle('ok', validContact()); sendB.disabled = !(validName() && validContact()); err.textContent = ''; };
    nameI.addEventListener('input', check); contactI.addEventListener('input', check);
    nameI.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); contactI.focus(); } });
    contactI.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendB.click(); } });
    sendB.addEventListener('click', () => {
      if (!validName()) { err.textContent = t.badName; nameI.focus(); T_('quote_error', {field: 'name'}); return; }
      if (!validContact()) { err.textContent = t.badContact; contactI.focus(); T_('quote_error', {field: 'phone'}); return; }
      const n = nameI.value.trim(), k = contactI.value.trim();
      const msg = t.msg.replace('{n}', n).replace('{t}', st.type).replace('{c}', st.wants.join(', ')).replace('{k}', k);
      // se guarda en Supabase (tabla leads) y además llega al correo de Faro Digital.
      // No depende de la medición: aunque un bloqueador o "Do Not Track" la apaguen, la cotización sale.
      if (sendB.classList.contains('sending')) return;
      const reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const waBtn = qm.querySelector('.wa-send'); waBtn.hidden = true;
      sendB.classList.remove('shake'); sendB.classList.add('sending'); sendB.setAttribute('aria-label', t.sending); buzz();
      const toDb = fetch(SB_URL + '/rest/v1/leads', {method: 'POST', headers: {'apikey': SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        body: JSON.stringify({visitor_id: store(localStorage, 'faro-vid'), session_id: store(sessionStorage, 'faro-sid'), page: here, lang, name: n, phone: k, org_type: st.type, wants: st.wants})})
        .then(r => { if (!r.ok) throw new Error('lead ' + r.status); return true; });
      const toMail = fetch('https://formsubmit.co/ajax/info@farodigitalfl.com', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({_subject: 'Nueva cotización – ' + n, _template: 'table', _captcha: 'false', Nombre: n, 'Teléfono': k, Tipo: st.type, Quiere: st.wants.join(', '), Idioma: lang, Mensaje: msg})
      }).then(r => r.json()).then(d => { if (!(d && (d.success === true || d.success === 'true'))) throw new Error(d && d.message); return true; });
      const wait = ms => new Promise(r => setTimeout(r, reduceM ? 0 : ms));
      // el círculo gira al menos un momento, para que se sienta el envío
      Promise.all([Promise.allSettled([toDb, toMail]), wait(900)]).then(async ([[db, mail]]) => {
        const ok = db.status === 'fulfilled' || mail.status === 'fulfilled';
        if (!ok) {
          T_('quote_fail', {db: db.status, mail: mail.status});
          sendB.classList.remove('sending'); sendB.removeAttribute('aria-label'); void sendB.offsetWidth; sendB.classList.add('shake');
          if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
          err.textContent = t.failed; waBtn.href = 'https://wa.me/17868057734?text=' + encodeURIComponent(msg); waBtn.hidden = false;
          return;
        }
        T_('quote_sent', {db: db.status, mail: mail.status, wants: st.wants.length});
        qm.querySelector('.ty').textContent = t.thanks.replace('{n}', n.split(' ')[0]);
        qm.querySelector('.summary').innerHTML = `<li><b>${t.s0}:</b> ${esc(st.type)}</li><li><b>${t.s1}:</b> ${esc(st.wants.join(', '))}</li><li><b>${t.s2}:</b> ${esc(k)}</li>`;
        // 1) el círculo se vuelve ✓ con un golpe
        sendB.classList.add('success'); if (navigator.vibrate) navigator.vibrate([18, 50, 28]);
        await wait(650);
        // 2) una ola naranja sale del botón y llena la tarjeta
        const card = qm.querySelector('.card'), flood = qm.querySelector('.flood');
        const cb = card.getBoundingClientRect(), bb = sendB.getBoundingClientRect();
        flood.style.top = card.scrollTop + 'px'; flood.style.height = card.clientHeight + 'px';
        flood.style.setProperty('--x', (bb.left + bb.width / 2 - cb.left) + 'px');
        flood.style.setProperty('--y', (bb.top + bb.height / 2 - cb.top) + 'px');
        flood.classList.remove('out'); flood.classList.add('in');
        await wait(520);
        // 3) cambia a la pantalla de gracias y la ola se retira hacia arriba
        card.scrollTop = 0; flood.style.top = '0px';
        qm.show(3); buzz();
        flood.classList.add('out');
        await wait(120); confetti();
        setTimeout(() => { flood.classList.remove('in', 'out'); sendB.classList.remove('sending', 'success'); sendB.removeAttribute('aria-label'); }, 700);
      });
    });
    const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
    back.addEventListener('click', () => qm.show(Math.max(0, cur - 1), true));
    qm.querySelectorAll('[data-qclose]').forEach(b => b.addEventListener('click', closeQuote));
    function confetti(){
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // estallido desde el ✓: cada papelito sale en su dirección y luego cae con gravedad
      const box = qm.querySelector('.confetti'); box.innerHTML = '';
      const chk = qm.querySelector('.done .check'), bx = box.getBoundingClientRect(), cr = chk.getBoundingClientRect();
      const ox = cr.left + cr.width / 2 - bx.left, oy = cr.top + cr.height / 2 - bx.top;
      const colors = ['#FF5E00', '#171A20', '#FFB37A', '#FF5E00', '#C24600'];
      for (let i = 0; i < 70; i++) {
        const c = document.createElement('i'), a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 190;
        c.style.left = ox + 'px'; c.style.top = oy + 'px'; c.style.background = colors[i % colors.length];
        if (i % 3 === 0) { c.style.width = c.style.height = '9px'; c.style.borderRadius = '50%'; }
        c.style.setProperty('--dx', Math.cos(a) * v + 'px'); c.style.setProperty('--dy', Math.sin(a) * v * .8 - 40 + 'px');
        c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg'); c.style.animationDelay = Math.random() * .08 + 's';
        box.appendChild(c);
      }
    }
  }
  function openQuote(preset){
    if (qm && qm.dataset.lang !== lang) { qm.remove(); qm = null; }
    // si cerró a medias, al volver sigue donde iba
    if (qm && cur !== 3) { T_('quote_open', {resumed: true, step: cur + 1}); document.documentElement.style.overflow = 'hidden'; requestAnimationFrame(() => qm.classList.add('open')); return; }
    T_('quote_open', {resumed: false, preset: preset || null});
    if (!qm) { buildQuote(); qm.dataset.lang = lang; }
    st = {wants: []};
    qm.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
    qm.querySelectorAll('input').forEach(i => { i.value = ''; i.classList.remove('ok'); });
    qm.querySelector('[data-next]').disabled = true; qm.querySelector('[data-send]').disabled = true;
    if (preset) { const o = [...qm.querySelectorAll('.opt')][preset === 'church' ? 0 : 1]; o.classList.add('sel'); st.type = o.dataset.v; qm.show(1); }
    else qm.show(0);
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => qm.classList.add('open'));
    setTimeout(() => (qm.querySelector('.qstep.on .opt, .qstep.on .chip') || qm).focus(), 400);
  }
  function closeQuote(){ if (!qm) return; T_(cur < 3 ? 'quote_close' : 'quote_done_close', {step: cur + 1}); qm.classList.remove('open'); document.documentElement.style.overflow = ''; }
  // todos los botones "Cotizar" abren el pop-up (la página de contacto queda como respaldo)
  const preset = /iglesias/.test(here) ? 'church' : /escuelas/.test(here) ? 'school' : null;
  document.querySelectorAll('a.btn[href="contacto.html"], a.pill[href="contacto.html"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.body.classList.remove('open'); onScroll(); openQuote(preset); }));
  document.querySelectorAll('[data-quote]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openQuote(preset); }));

  if (lang !== 'es') applyLang();
})();

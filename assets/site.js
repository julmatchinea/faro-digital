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
  document.querySelectorAll('[data-lang-toggle]').forEach(b => b.addEventListener('click', () => { lang = lang === 'es' ? 'en' : 'es'; applyLang(); }));

  // menú: transparente sobre fotos oscuras (como Tesla), blanco sobre contenido claro
  const top = document.getElementById('top');
  const darkEls = [...document.querySelectorAll('.panel, .julio')];
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
  if (menu) menu.addEventListener('click', () => { document.body.classList.add('open'); onScroll(); });
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
      if (!was) { b.setAttribute('aria-expanded', 'true'); panels[+b.dataset.tab].classList.add('on'); reveal.classList.add('open'); }
      else reveal.classList.remove('open');
    }));
  });

  /* ---------- luz del faro: se coloca sobre la lámpara de la foto ---------- */
  document.querySelectorAll('.beam').forEach(beam => {
    const panel = beam.closest('.panel'), img = panel.querySelector(':scope > img');
    const place = () => {
      if (!img.naturalWidth) return;
      const W = panel.clientWidth, H = panel.clientHeight, s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const rw = img.naturalWidth * s, rh = img.naturalHeight * s;
      beam.style.setProperty('--lx', ((W - rw) / 2 + rw * +beam.dataset.x) + 'px');
      beam.style.setProperty('--ly', ((H - rh) / 2 + rh * +beam.dataset.y) + 'px');
    };
    if (img.complete) place(); else img.addEventListener('load', place);
    addEventListener('resize', place);
  });

  /* ---------- pop-up de cotización: una pregunta a la vez ---------- */
  const T = {
    es:{step:'Paso', of:'de', q0:'¿Para quién es tu página?', h0:'Toca una opción.', church:'Iglesia', school:'Escuela', other:'Otro',
        q1:'¿Qué te gustaría tener?', h1:'Elige todo lo que quieras.', chips:['Sitio nuevo','Rediseño','Ofrendas en línea','Inscripciones','Transmisiones en vivo','Calendario de eventos','Cuidado mensual'],
        cont:'Continuar', q2:'¿Cómo te contactamos?', h2:'Solo dos datos y listo.', name:'Tu nombre', contact:'Tu WhatsApp o email', send:'Enviar', badName:'Escribe tu nombre.', badContact:'Escribe un teléfono o un email válido.',
        thanks:'¡Gracias, {n}!', done:'Tu mensaje está listo en WhatsApp. Solo toca enviar y te respondo en 1 o 2 días.', s0:'Para', s1:'Quiero', s2:'Contacto', wa:'Abrir WhatsApp otra vez', mail:'Prefiero enviarlo por email', close:'Cerrar',
        msg:'Hola Julio, soy {n}. Quiero una página para: {t}. Me interesa: {c}. Mi contacto: {k}.'},
    en:{step:'Step', of:'of', q0:'Who is your website for?', h0:'Tap one option.', church:'Church', school:'School', other:'Other',
        q1:'What would you like to have?', h1:'Pick as many as you like.', chips:['New website','Redesign','Online giving','Enrollment','Live streams','Events calendar','Monthly care'],
        cont:'Continue', q2:'How do we reach you?', h2:'Just two details and done.', name:'Your name', contact:'Your WhatsApp or email', send:'Send', badName:'Please enter your name.', badContact:'Please enter a valid phone or email.',
        thanks:'Thank you, {n}!', done:'Your message is ready in WhatsApp. Just tap send and I will reply within 1–2 days.', s0:'For', s1:'Wants', s2:'Contact', wa:'Open WhatsApp again', mail:'I prefer email', close:'Close',
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
    qm.innerHTML = `<div class="bg" data-qclose></div><div class="card">
      <div class="bar"><i></i></div>
      <div class="head"><button class="back" type="button" aria-label="Atrás">←</button><small class="count"></small><button class="x" type="button" data-qclose aria-label="${t.close}">×</button></div>
      <section class="step" data-s="0"><h3>${t.q0}</h3><p class="hint">${t.h0}</p><div class="opts three">
        <button class="opt" type="button" data-v="${t.church}">${ICON.church}${t.church}</button>
        <button class="opt" type="button" data-v="${t.school}">${ICON.school}${t.school}</button>
        <button class="opt" type="button" data-v="${t.other}">${ICON.other}${t.other}</button></div></section>
      <section class="step" data-s="1"><h3>${t.q1}</h3><p class="hint">${t.h1}</p><div class="chips">${t.chips.map(c => `<button class="chip" type="button" data-v="${c}">${c}</button>`).join('')}</div>
        <button class="btn neon next" type="button" data-next disabled>${t.cont} →</button></section>
      <section class="step" data-s="2"><h3>${t.q2}</h3><p class="hint">${t.h2}</p>
        <label for="q-name">${t.name}</label><input id="q-name" autocomplete="name" enterkeyhint="next">
        <label for="q-contact">${t.contact}</label><input id="q-contact" autocomplete="tel" inputmode="email" enterkeyhint="send">
        <p class="err" role="status"></p><button class="btn neon next" type="button" data-send disabled>${t.send} →</button></section>
      <section class="step done" data-s="3"><div class="confetti"></div><div class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3 class="ty"></h3><p class="hint">${t.done}</p><ul class="summary"></ul>
        <div class="sendrow"><a class="btn neon" data-wa target="_blank" rel="noopener">${t.wa}</a><a class="btn dark" data-mail>${t.mail}</a></div></section>
    </div>`;
    document.body.appendChild(qm);
    const steps = [...qm.querySelectorAll('.step')], bar = qm.querySelector('.bar i'), count = qm.querySelector('.count'), back = qm.querySelector('.back');
    const nameI = qm.querySelector('#q-name'), contactI = qm.querySelector('#q-contact'), err = qm.querySelector('.err'), sendB = qm.querySelector('[data-send]');
    const validName = () => nameI.value.trim().length > 1;
    const validContact = () => /^\S+@\S+\.\S+$/.test(contactI.value.trim()) || contactI.value.replace(/\D/g, '').length >= 10;
    qm.show = (i, rev) => {
      cur = i;
      steps.forEach((s, j) => { s.classList.toggle('on', j === i); s.classList.toggle('rev', !!rev && j === i); });
      bar.style.width = [25, 55, 85, 100][i] + '%';
      count.textContent = i < 3 ? `${t.step} ${i + 1} ${t.of} 3` : '';
      back.hidden = i === 0 || i === 3;
      if (i === 2) setTimeout(() => (validName() ? contactI : nameI).focus(), 350);
    };
    // paso 1: tocar avanza solo
    qm.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => {
      qm.querySelectorAll('.opt').forEach(x => x.classList.remove('sel')); o.classList.add('sel'); st.type = o.dataset.v; buzz();
      setTimeout(() => qm.show(1), 320);
    }));
    // paso 2: elegir varias
    const nextB = qm.querySelector('[data-next]');
    qm.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      c.classList.toggle('sel'); buzz();
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
      if (!validName()) { err.textContent = t.badName; nameI.focus(); return; }
      if (!validContact()) { err.textContent = t.badContact; contactI.focus(); return; }
      const n = nameI.value.trim(), k = contactI.value.trim();
      const msg = t.msg.replace('{n}', n).replace('{t}', st.type).replace('{c}', st.wants.join(', ')).replace('{k}', k);
      const wa = 'https://wa.me/17868057734?text=' + encodeURIComponent(msg);
      qm.querySelector('.ty').textContent = t.thanks.replace('{n}', n.split(' ')[0]);
      qm.querySelector('.summary').innerHTML = `<li><b>${t.s0}:</b> ${st.type}</li><li><b>${t.s1}:</b> ${st.wants.join(', ')}</li><li><b>${t.s2}:</b> ${k.replace(/</g, '&lt;')}</li>`;
      qm.querySelector('[data-wa]').href = wa;
      qm.querySelector('[data-mail]').href = 'mailto:info@farodigitalfl.com?subject=' + encodeURIComponent('Cotización – ' + n) + '&body=' + encodeURIComponent(msg);
      window.open(wa, '_blank', 'noopener');
      qm.show(3); buzz(); confetti();
    });
    back.addEventListener('click', () => qm.show(Math.max(0, cur - 1), true));
    qm.querySelectorAll('[data-qclose]').forEach(b => b.addEventListener('click', closeQuote));
    function confetti(){
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const box = qm.querySelector('.confetti'); box.innerHTML = '';
      const colors = ['#FF5E00', '#171A20', '#FFB37A', '#25D366'];
      for (let i = 0; i < 40; i++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + '%'; c.style.background = colors[i % colors.length]; c.style.animationDelay = Math.random() * .35 + 's'; c.style.transform = `rotate(${Math.random() * 180}deg)`; box.appendChild(c); }
    }
  }
  function openQuote(preset){
    if (qm && qm.dataset.lang !== lang) { qm.remove(); qm = null; }
    if (!qm) { buildQuote(); qm.dataset.lang = lang; }
    st = {wants: []};
    qm.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
    qm.querySelectorAll('input').forEach(i => { i.value = ''; i.classList.remove('ok'); });
    qm.querySelector('[data-next]').disabled = true; qm.querySelector('[data-send]').disabled = true;
    if (preset) { const o = [...qm.querySelectorAll('.opt')][preset === 'church' ? 0 : 1]; o.classList.add('sel'); st.type = o.dataset.v; qm.show(1); }
    else qm.show(0);
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => qm.classList.add('open'));
    setTimeout(() => (qm.querySelector('.step.on .opt, .step.on .chip') || qm).focus(), 400);
  }
  function closeQuote(){ if (!qm) return; qm.classList.remove('open'); document.documentElement.style.overflow = ''; }
  addEventListener('keydown', e => { if (e.key === 'Escape') closeQuote(); });
  // todos los botones "Cotizar" abren el pop-up (la página de contacto queda como respaldo)
  const preset = /iglesias/.test(here) ? 'church' : /escuelas/.test(here) ? 'school' : null;
  document.querySelectorAll('a.btn[href="contacto.html"], a.pill[href="contacto.html"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.body.classList.remove('open'); onScroll(); openQuote(preset); }));
  document.querySelectorAll('[data-quote]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openQuote(preset); }));

  if (lang !== 'es') applyLang();
})();

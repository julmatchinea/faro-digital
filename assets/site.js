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
    top.classList.toggle('solid', !overDark || document.body.classList.contains('open'));
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

  if (lang !== 'es') applyLang();
})();

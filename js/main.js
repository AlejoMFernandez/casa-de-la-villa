// LA VILLA · demo — intro, el reloj, entradas, arcos, del fuego a la mesa, carta, eventos.
import { initKit } from '../kit/kit.js?v=1';
import { franjas, ahoraEn, fechaDeNum, horaVisible } from '../kit/core/turnos.js';

const d = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WA = '5491133017042';
const momento = d.dataset.momento;
const escritorio = () => window.matchMedia('(min-width: 901px)').matches;

/* ---------------------------------------------------------------
   INTRO: espera fuentes + foto del hero (máx. 2,6 s) y abre el arco
---------------------------------------------------------------- */
const heroImg = $('#heroImg');
function heroEntra() { d.classList.add('hero-entra'); }

if (d.classList.contains('con-intro')) {
  const t0 = performance.now();
  const listo = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }),
  ]);
  const tope = new Promise((r) => setTimeout(r, 2600));
  Promise.race([listo, tope]).then(() => {
    const falta = Math.max(0, 1750 - (performance.now() - t0));
    setTimeout(() => {
      d.classList.add('intro-abre');
      setTimeout(heroEntra, 520);
      setTimeout(() => { d.classList.add('intro-listo'); d.style.overflow = ''; }, 1100);
    }, falta);
  });
} else {
  d.classList.add('intro-listo');
  requestAnimationFrame(heroEntra);
}

/* ---------------------------------------------------------------
   EL RELOJ: piezas que cambian de día
---------------------------------------------------------------- */
if (momento === 'dia') {
  $$('[data-src-dia]').forEach((img) => { img.src = img.dataset.srcDia; img.alt = 'Una mesa junto al vitral, de día'; });
}

/* ---------------------------------------------------------------
   BARRA SUPERIOR + MENÚ
---------------------------------------------------------------- */
const top = $('#top');
const menu = $('#menu');
const burger = $('.top__burger');
function abrirMenu(abrir) {
  menu.hidden = !abrir;
  d.classList.toggle('menu-abierto', abrir);
  burger.setAttribute('aria-expanded', String(abrir));
  burger.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  document.body.style.overflow = abrir ? 'hidden' : '';
  if (abrir) top.classList.add('solida'); else onScroll();
}
burger.addEventListener('click', () => abrirMenu(menu.hidden));
menu.addEventListener('click', (e) => { if (e.target.closest('a, button')) abrirMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) abrirMenu(false); });

/* ---------------------------------------------------------------
   ENTRADAS AL HACER SCROLL
---------------------------------------------------------------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -4% 0px' });
$$('.rv, .rv-foto').forEach((el) => io.observe(el));

/* ---------------------------------------------------------------
   SCROLL: barra sólida, parallax de los arcos, pista del fuego
---------------------------------------------------------------- */
const arcos = $$('.arcos .arco__marco');
const fuego = $('#fuego');
const pista = $('.fuego__pista');
let tick = false, vh = innerHeight, fuegoTop = 0, fuegoRango = 0, pistaRango = 0;

function medirFuego() {
  vh = innerHeight;
  if (!escritorio()) { fuego.style.height = ''; pista.style.transform = ''; return; }
  pistaRango = Math.max(0, pista.scrollWidth - innerWidth);
  fuego.style.height = `${pistaRango + vh}px`;
  fuegoTop = fuego.getBoundingClientRect().top + scrollY;
  fuegoRango = pistaRango;
}

function frame() {
  tick = false;
  const y = scrollY;
  if (menu.hidden) top.classList.toggle('solida', y > 40);
  d.classList.toggle('paso-hero', y > vh * 0.85);
  // arcos: la foto se mueve un poco más lento que la página
  for (const m of arcos) {
    const r = m.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
    m.style.setProperty('--py', `${(p * -38).toFixed(1)}px`);
  }
  // del fuego a la mesa: el scroll vertical mueve la pista de costado
  if (fuegoRango > 0) {
    const p = Math.min(1, Math.max(0, (y - fuegoTop) / fuegoRango));
    pista.style.transform = `translate3d(${(-p * pistaRango).toFixed(1)}px,0,0)`;
  }
}
function onScroll() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { medirFuego(); onScroll(); }, { passive: true });
addEventListener('load', () => { medirFuego(); onScroll(); });
medirFuego(); onScroll();

/* ---------------------------------------------------------------
   EVENTOS → WhatsApp con todo cargado
---------------------------------------------------------------- */
$('#evForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget, msg = $('.ev-form__msg', f);
  const v = Object.fromEntries(new FormData(f));
  if (!v.nombre.trim() || !v.personas) {
    msg.textContent = 'Contanos tu nombre y cuántas personas serían.'; msg.hidden = false; return;
  }
  msg.hidden = true;
  const fecha = v.fecha ? new Date(v.fecha + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'a definir';
  const texto = `Hola La Villa! Quiero consultar por un evento.\n• ${v.tipo}\n• Fecha: ${fecha}\n• Personas: ${v.personas}\n• Nombre: ${v.nombre.trim()}${v.nota.trim() ? `\n• ${v.nota.trim()}` : ''}`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
});

/* ---------------------------------------------------------------
   VISOR DE FOTO (carta en el celu)
---------------------------------------------------------------- */
const visor = $('#visor');
let visorPrev = null;
function abrirVisor(src, titulo) {
  visorPrev = document.activeElement;
  $('img', visor).src = src; $('img', visor).alt = titulo; $('figcaption', visor).textContent = titulo;
  visor.hidden = false; document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => { visor.classList.add('abierto'); $('.visor__x', visor).focus(); }));
}
function cerrarVisor() {
  if (visor.hidden) return;
  visor.classList.remove('abierto'); document.body.style.overflow = '';
  setTimeout(() => { visor.hidden = true; }, 320);
  visorPrev?.focus?.({ preventScroll: true });
}
visor.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar]')) cerrarVisor(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarVisor(); });

/* ---------------------------------------------------------------
   CARTA: páginas → índice → una sección por vez + foto en el arco
---------------------------------------------------------------- */
const PAGINAS = {
  cocina: ['para-picar', 'entrantes', 'brasas', 'principales', 'ensaladas', 'kids'],
  dulce: ['postres'],
  barra: ['bebidas', 'cervezas', 'cafeteria'],
};
const LISTAS_CORTAS = ['bebidas', 'cervezas', 'cafeteria', 'kids'];
const NOTAS = {
  brasas: 'Los cortes vienen con chimichurri, salsa criolla y una guarnición: vegetales asados, papas rústicas, papas fritas, ensalada de hojas verdes y cherry o de rúcula y parmesano.',
  'para-picar': 'Para compartir al centro de la mesa.',
};
const FOTO_PAGINA = { barra: ['img/casa-barra.webp', 'La barra'], cocina: ['img/fuego-mesa.webp', 'De la cocina'], dulce: ['img/fuego-emplatado.webp', 'Para terminar'] };

const carta = $('#carta');
const indice = $('.carta__indice', carta);
const fotoBox = $('.carta__foto', carta);
const [imgA, imgB] = $$('.carta__arco img', carta);
let catActual = null, grupos = [], fotoActual = '';

const paginaDe = (cat) => Object.keys(PAGINAS).find((p) => PAGINAS[p].includes(cat)) || 'cocina';

function mostrarFoto(src, titulo) {
  if (!src || src === fotoActual) { if (titulo != null) $('figcaption', fotoBox).textContent = titulo; return; }
  fotoActual = src;
  const sig = imgA.classList.contains('on') ? imgB : imgA, ant = sig === imgA ? imgB : imgA;
  sig.onload = () => { sig.classList.add('on'); ant.classList.remove('on'); };
  sig.src = src;
  if (sig.complete && sig.naturalWidth) sig.onload();
  $('figcaption', fotoBox).textContent = titulo || '';
}

function fotoPorDefecto(cat) {
  const panel = $(`.kit-carta__panel .plato[data-cat="${cat}"]`, carta)?.closest('.kit-carta__panel');
  const conFoto = panel && $('.plato[data-photo]', panel);
  if (conFoto) return mostrarFoto(conFoto.dataset.photo, $('.plato__nombre', conFoto).firstChild.textContent.trim());
  const [src, t] = FOTO_PAGINA[paginaDe(cat)];
  mostrarFoto(src, t);
}

function pintarIndice() {
  const pag = paginaDe(catActual);
  const enPagina = grupos.filter((g) => paginaDe(g.id) === pag);
  indice.innerHTML = enPagina.map((g) => `<button type="button" data-cat="${esc(g.id)}" class="${g.id === catActual ? 'is-on' : ''}" aria-current="${g.id === catActual}">${esc(g.nombre)}</button>`).join('');
  $$('.carta__paginas button', carta).forEach((b) => { const on = b.dataset.pagina === pag; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); b.hidden = !grupos.some((g) => paginaDe(g.id) === b.dataset.pagina); });
  const on = $('.is-on', indice);
  if (on && !escritorio()) indice.scrollTo({ left: on.offsetLeft - 20, behavior: 'smooth' });
}

function elegir(cat, { foco = false } = {}) {
  const g = grupos.find((x) => x.id === cat) || grupos[0];
  if (!g) return;
  catActual = g.id;
  const tab = $(`.kit-tab[data-cat="${CSS.escape(g.id)}"]`, carta);
  if (tab && !tab.classList.contains('is-on')) tab.click();
  const panel = g.panel;
  panel.classList.toggle('dos-col', LISTAS_CORTAS.includes(g.id));
  $('.carta__seccion', carta).textContent = g.nombre;
  const n = $$('.plato', panel).length;
  $('.carta__cuenta', carta).textContent = `${n} ${n === 1 ? 'opción' : 'opciones'}`;
  const nota = $('.carta__nota', carta);
  nota.textContent = NOTAS[g.id] || ''; nota.hidden = !NOTAS[g.id];
  const i = grupos.indexOf(g);
  const ant = grupos[i - 1], sig = grupos[i + 1];
  const [bAnt, bSig] = $$('.carta__nav', carta);
  bAnt.textContent = ant ? `← ${ant.nombre}` : ''; bSig.textContent = sig ? `${sig.nombre} →` : '';
  pintarIndice();
  fotoPorDefecto(g.id);
  if (foco) {
    const y = carta.querySelector('.carta__cuerpo').getBoundingClientRect().top + scrollY - (escritorio() ? 110 : 140);
    if (Math.abs(scrollY - y) > 260) scrollTo({ top: y, behavior: 'smooth' });
  }
}

document.addEventListener('kit:carta', (e) => {
  if (!carta.contains(e.detail.el)) return;
  const nombres = Object.fromEntries((e.detail.categorias || []).map((c) => [c.id, c.nombre]));
  grupos = $$('.kit-carta__panel', e.detail.el).map((panel) => {
    const cat = $('.kit-item', panel)?.dataset.cat;
    return cat ? { id: cat, nombre: nombres[cat] || $(`.kit-tab[data-cat="${CSS.escape(cat)}"]`, carta)?.textContent || 'Otros', panel } : null;
  }).filter(Boolean);
  const visible = grupos.find((g) => !g.panel.hidden);
  elegir(grupos.some((g) => g.id === catActual) ? catActual : visible?.id);
});

carta.addEventListener('click', (e) => {
  const pag = e.target.closest('[data-pagina]');
  if (pag) { const g = grupos.find((x) => paginaDe(x.id) === pag.dataset.pagina); if (g) elegir(g.id); return; }
  const ind = e.target.closest('.carta__indice [data-cat]');
  if (ind) { elegir(ind.dataset.cat); return; }
  const nav = e.target.closest('[data-ir]');
  if (nav && nav.textContent) { const i = grupos.findIndex((g) => g.id === catActual) + Number(nav.dataset.ir); if (grupos[i]) elegir(grupos[i].id, { foco: true }); return; }
  const ver = e.target.closest('[data-ver]');
  if (ver) { const p = ver.closest('.plato'); abrirVisor(p.dataset.photo, $('.plato__nombre', p).firstChild.textContent.trim()); }
});

// la lámpara: al pasar por un plato con foto, se enciende en el arco
let hoverRaf = 0, hoverEl = null;
carta.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch') return;
  const p = e.target.closest('.plato');
  if (!p || p === hoverEl) return;
  hoverEl = p;
  cancelAnimationFrame(hoverRaf);
  hoverRaf = requestAnimationFrame(() => {
    $$('.plato.is-foco', carta).forEach((x) => x.classList.remove('is-foco'));
    if (p.dataset.photo) {
      p.classList.add('is-foco');
      fotoBox.classList.add('encendida');
      mostrarFoto(p.dataset.photo, $('.plato__nombre', p).firstChild.textContent.trim());
    }
  });
});
$('.carta__lista', carta).addEventListener('pointerleave', () => { hoverEl = null; fotoBox.classList.remove('encendida'); $$('.plato.is-foco', carta).forEach((x) => x.classList.remove('is-foco')); });

/* ---------------------------------------------------------------
   KIT: carta con ABM + reservas + panel
---------------------------------------------------------------- */
const kit = await initKit({
  config: 'cliente.json',
  carta: {
    itemClass: 'plato',
    etiquetas: { casa: { label: 'De la casa' }, veggie: { label: 'Sin carne' } },
    template: (p, ctx) => {
      const precio = ctx.money(p.precio) ?? 'Consultar';
      const tags = (p.etiquetas || []).map((t) => ctx.etiquetaHTML(t)).join('');
      return `
        <div class="plato__txt">
          <h4 class="plato__nombre">${esc(p.nombre)}${p.foto ? '<span class="punto" title="Tiene foto"></span>' : ''}${tags}</h4>
          ${p.descripcion ? `<p class="plato__desc">${esc(p.descripcion)}</p>` : ''}
        </div>
        <div class="plato__lado">
          <span class="plato__precio">${esc(precio)}</span>
          ${p.disponible === false ? '<span class="plato__sin">Sin stock hoy</span>' : ''}
          ${p.foto ? '<button type="button" class="plato__ver" data-ver>Ver foto</button>' : ''}
        </div>`;
    },
  },
});

/* estado del local en el hero (con los horarios de cliente.json) */
(function estado() {
  const el = $('#estado'), txt = $('.estado__txt', el);
  const H = kit.config.horarios, tz = kit.tz;
  const est = kit.abierto();
  const servicio = (hhmm) => (Number(hhmm.split(':')[0]) < 17 ? 'almuerzo' : 'cena');
  if (est.abierto) {
    const ahora = ahoraEn(tz);
    const fr = franjas(H, ahora.fecha).find(([a, b]) => ahora.min >= a && ahora.min < b);
    txt.textContent = `Abierto ahora · ${fr && fr[0] < 17 * 60 ? 'almuerzo' : 'cena'} hasta las ${est.cierra} h`;
    el.classList.add('abierto');
    return;
  }
  if (est.abre) { txt.textContent = `Hoy · ${servicio(est.abre)} desde las ${est.abre} h`; return; }
  const ahora = ahoraEn(tz);
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  for (let k = 1; k <= 7; k++) {
    const f = fechaDeNum(ahora.dia + k), fr = franjas(H, f)[0];
    if (fr) {
      const dia = k === 1 ? 'mañana' : `el ${DIAS[new Date(f + 'T12:00Z').getUTCDay()]}`;
      txt.textContent = `Hoy cerrado · volvemos ${dia} a las ${horaVisible(fr[0])} h`;
      return;
    }
  }
})();

const anio = $('#anio'); if (anio) anio.textContent = new Date().getFullYear();

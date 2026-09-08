/* ══════════════════════════════════════════════════════════════════════════
   ui.js — piezas de interfaz compartidas
   Prefijo de variables de este fichero: ui*
   Scope global compartido: no declares nombres que ya existan en otro fichero.

   Contiene: mensajes de estado, botón de copiar superpuesto, navegación entre
   secciones, panel de sección activa y el plegado de los paneles en móvil.
   ══════════════════════════════════════════════════════════════════════════ */

// ── Mensajes de estado ────────────────────────────────────────────────────
// kind pinta el color: 'info' (naranja) | 'ok' (verde) | 'bad' (rojo) | 'busy'
function uiStatus(el, key, vars, kind = 'info') {
  if (!el) return;
  el.className = 'status status-' + kind;
  i18nSet(el, key, vars);
}

function uiClearStatus(el) {
  if (!el) return;
  el.className = 'status';
  delete el.dataset.i18n;
  delete el.dataset.i18nVars;
  el.textContent = '';
}

// Los errores de AI llevan clave de diccionario; los del navegador, no.
function uiStatusError(el, err) {
  if (err && err.i18n) uiStatus(el, err.i18n, err.vars, 'bad');
  else uiStatus(el, 'st.error', { msg: (err && err.message) || String(err) }, 'bad');
}

// Callback de progreso listo para pasar a AI.get*(): pct null = sin dato aún.
function uiProgress(el) {
  return pct => {
    if (pct === null) uiStatus(el, 'st.downloading', null, 'busy');
    else uiStatus(el, 'st.downloadingPct', { pct }, 'busy');
  };
}

// ── Botón de copiar superpuesto ───────────────────────────────────────────
// Envuelve el textarea y le pega un botón en la esquina inferior derecha.
// Solo para textareas de SALIDA: en los que escribe el usuario no aporta nada.
function uiAttachCopy(textarea, statusEl) {
  if (!textarea) return;

  const wrap = document.createElement('div');
  wrap.className = 'ta-wrap';
  textarea.parentNode.insertBefore(wrap, textarea);
  wrap.appendChild(textarea);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-btn';
  btn.dataset.i18nTitle = 'aria.copy';
  btn.title = t('aria.copy');
  btn.setAttribute('aria-label', btn.title);
  btn.textContent = '📋';
  wrap.appendChild(btn);

  let timer = null;
  btn.addEventListener('click', async () => {
    if (!textarea.value) return;
    try {
      await navigator.clipboard.writeText(textarea.value);
      btn.textContent = '✓';
      btn.classList.add('copied');
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.textContent = '📋';
        btn.classList.remove('copied');
      }, 2000);
    } catch {
      uiStatus(statusEl, 'st.copyFailed', null, 'bad');
    }
  });
}

// ── Navegación y panel de sección activa ──────────────────────────────────
const UI_SECTION_DESC = {
  'sec-speech':    'info.speech.desc',
  'sec-detect':    'info.detect.desc',
  'sec-summary':   'info.summary.desc',
  'sec-translate': 'info.translate.desc',
};

const UI_SECTION_NAME = {
  'sec-speech':    'nav.speech',
  'sec-detect':    'nav.detect',
  'sec-summary':   'nav.summary',
  'sec-translate': 'nav.translate',
};

function uiShowSection(targetId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.querySelectorAll('#nav button').forEach(b => {
    b.classList.remove('nav-active');
    b.setAttribute('aria-selected', 'false');
  });

  const sec = document.getElementById(targetId);
  if (sec) sec.classList.add('visible');

  const btn = document.querySelector('#nav button[data-target="' + targetId + '"]');
  if (btn) {
    btn.classList.add('nav-active');
    btn.setAttribute('aria-selected', 'true');
  }

  i18nSet(document.getElementById('sectionInfoName'), UI_SECTION_NAME[targetId] || 'info.title');
  i18nSet(document.getElementById('sectionInfoDesc'), UI_SECTION_DESC[targetId] || 'info.title');

  window.scrollTo(0, 0);
}

function uiInitNav() {
  document.querySelectorAll('#nav button').forEach(btn => {
    btn.addEventListener('click', () => uiShowSection(btn.dataset.target));
  });

  // En móvil y tablet los paneles no son fijos y se pueden plegar.
  const panels = document.getElementById('panels');
  const toggle = document.getElementById('panelsToggle');
  if (panels && toggle) {
    toggle.addEventListener('click', () => {
      panels.classList.toggle('collapsed');
      toggle.setAttribute('aria-expanded', String(!panels.classList.contains('collapsed')));
    });
  }
}

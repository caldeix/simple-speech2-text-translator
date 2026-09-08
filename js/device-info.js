/* ══════════════════════════════════════════════════════════════════════════
   device-info.js — panel DEVICE INFO, permiso de micrófono e idioma de la UI
   Prefijo de variables de este fichero: dv*
   Scope global compartido: no declares nombres que ya existan en otro fichero.
   ══════════════════════════════════════════════════════════════════════════ */

let dvMicEl = null;

function dvSet(el, key, vars, kind) {
  if (!el) return;
  el.className = 'chk chk-' + kind;
  i18nSet(el, key, vars);
}

// ── Micrófono ─────────────────────────────────────────────────────────────
// Llamada desde tres sitios: la consulta inicial, el resultado de pedir el
// permiso y el onstart del reconocedor (speech.js). La Permissions API no
// siempre notifica el cambio, así que no se depende solo de su evento.
function dvPaintMic(state) {
  if (!dvMicEl) return;
  if (state === 'granted')      dvSet(dvMicEl, 'dv.micGranted', null, 'ok');
  else if (state === 'denied')  dvSet(dvMicEl, 'dv.micDenied', null, 'bad');
  else if (state === 'prompt')  dvSet(dvMicEl, 'dv.micPrompt', null, 'warn');
  else                          dvSet(dvMicEl, 'dv.micUnknown', null, 'warn');
}

async function dvQueryMic() {
  try {
    const perm = await navigator.permissions.query({ name: 'microphone' });
    dvPaintMic(perm.state);
    perm.onchange = () => dvPaintMic(perm.state);   // se relee el estado actual
    return perm.state;
  } catch {
    dvPaintMic('unknown');
    return 'unknown';
  }
}

// Se pide una sola vez al entrar. Los tracks se sueltan en cuanto se concede,
// para no dejar el indicador de micrófono encendido en la pestaña.
//
// Nota: en un origen http(s) el permiso queda concedido de forma permanente y
// esto ocurre una única vez en la vida. Abriendo el fichero como file://,
// Chrome no puede persistir el permiso y volverá a preguntar en cada carga.
async function dvRequestMicOnce() {
  const state = await dvQueryMic();
  if (state === 'granted' || state === 'denied') return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(tr => tr.stop());
    dvPaintMic('granted');
  } catch {
    // Denegado o descartado: se repinta el estado real y, si fue un descarte,
    // el primer clic en Grabar volverá a pedirlo.
    dvQueryMic();
  }
}

// ── Panel ─────────────────────────────────────────────────────────────────
function dvInit() {
  dvMicEl = document.getElementById('info-mic');

  // Versión de Chrome
  const match = navigator.userAgent.match(/Chrome\/(\d+)/);
  const version = match ? parseInt(match[1], 10) : null;
  const chromeEl = document.getElementById('info-chrome');
  if (!version)                   dvSet(chromeEl, 'dv.notChrome', null, 'warn');
  else if (version >= CHROME_MIN) dvSet(chromeEl, 'dv.chromeOk', { v: version }, 'ok');
  else                            dvSet(chromeEl, 'dv.chromeOld', { v: version, min: CHROME_MIN }, 'bad');

  // Disponibilidad de las tres APIs. Solo comprueba que el objeto exista, no
  // que el modelo esté descargado.
  [
    { id: 'info-translator', ok: typeof Translator !== 'undefined',       api: 'Translator API' },
    { id: 'info-detector',   ok: typeof LanguageDetector !== 'undefined', api: 'LanguageDetector API' },
    { id: 'info-summarizer', ok: typeof Summarizer !== 'undefined',       api: 'Summarizer API' },
  ].forEach(({ id, ok, api }) => {
    dvSet(document.getElementById(id), ok ? 'dv.apiOk' : 'dv.apiNo', { api }, ok ? 'ok' : 'bad');
  });

  // Idioma de la interfaz
  const uiLangSel = document.getElementById('uiLang');
  lgFillUiSelect(uiLangSel, i18nGetLang());
  uiLangSel.addEventListener('change', () => i18nApply(uiLangSel.value));
}

/* ══════════════════════════════════════════════════════════════════════════
   speech.js — Sección 1: voz → texto → traducción en tiempo real
   Prefijo de variables de este fichero: sp*
   Scope global compartido: no declares nombres que ya existan en otro fichero.
   ══════════════════════════════════════════════════════════════════════════ */

let spBtnRecord, spBtnClear, spTranscriptTA, spTranslationTA, spStatusEl,
    spTranslateStatus, spLangFrom, spLangTo, spChkTranslate, spTranslationBlock;

// Errores del reconocedor tras los que reintentar es inútil: si no se cortan,
// el auto-reinicio de onend entra en bucle start → error → end → start.
const SP_FATAL_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'];

// Espera tras dejar de teclear antes de traducir el texto escrito a mano.
const SP_MANUAL_DELAY = 600;

let spRecognition = null;
let spIsRecording = false;         // intención del usuario, no estado del micro

// El texto vive en dos mitades: lo consolidado de sesiones anteriores y lo que
// la sesión actual va produciendo, que se RECALCULA en cada evento.
let spBaseText = '';
let spSessionFinal = '';
let spSessionInterim = '';
let spSessionSent = 0;             // nº de frases cerradas ya enviadas a traducir

let spFinalTranslation = '';
let spTranslator = null;
let spTranslatorReady = Promise.resolve(null);   // resuelve cuando el modelo está listo
let spInterimTimer = null;
let spManualTimer = null;
let spLastInterimWords = 0;

let spInterimSeq = null;           // sequencers (se crean en spInit)
let spManualSeq = null;
let spFinalQueue = Promise.resolve();
let spPendingFinals = 0;

function spVisibleText() {
  return spBaseText + spSessionFinal + spSessionInterim;
}

// ── Reconocedor ───────────────────────────────────────────────────────────
function spBuild() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    uiStatus(spStatusEl, 'st.srUnsupported', null, 'bad');
    return null;
  }

  const r = new SR();
  r.continuous = true;
  r.interimResults = true;
  r.lang = spLangFrom.value;

  r.onstart = () => {
    uiStatus(spStatusEl, 'st.recording', null, 'busy');
    // Si el micro ha arrancado, el permiso está concedido de facto: el panel
    // se actualiza aquí porque el evento de la Permissions API no siempre llega.
    if (typeof dvPaintMic === 'function') dvPaintMic('granted');
  };

  r.onend = () => {
    // Al terminar la sesión hay que consolidar lo que Chrome va a descartar.
    spCommitSession();
    // Chrome corta el reconocimiento por su cuenta cada ~1 min: se reenciende.
    // `spRecognition === r` evita que una instancia ya sustituida se resucite
    // y acabe escuchando en paralelo con la nueva.
    if (spIsRecording && spRecognition === r) {
      try { r.start(); } catch {}
    } else if (!spIsRecording) {
      uiStatus(spStatusEl, 'st.stopped', null, 'info');
    }
  };

  r.onerror = (e) => {
    uiStatus(spStatusEl, 'st.error', { msg: e.error }, 'bad');
    if (SP_FATAL_ERRORS.includes(e.error)) spStop();
  };

  r.onresult = (event) => {
    // `event.results` es acumulativo dentro de una sesión, y Chrome —sobre todo
    // en Android— puede reenviar resultados ya vistos con resultIndex 0. Por eso
    // NO se acumula con +=: se recalcula el texto de la sesión completo en cada
    // evento. Es idempotente, así que un reenvío no puede duplicar frases.
    let fin = '', interim = '', nFinal = 0;
    for (let i = 0; i < event.results.length; i++) {
      const txt = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        fin += txt.trim() + ' ';
        nFinal = i + 1;
      } else {
        interim += txt;
      }
    }

    spSessionFinal = fin;
    spSessionInterim = interim;
    spTranscriptTA.value = spVisibleText();
    stSet('transcript', spTranscriptTA.value);

    // A traducir van solo las frases cerradas que no se hubieran enviado ya en
    // esta sesión: llevar la cuenta, y no el texto, es lo que evita duplicados.
    if (nFinal > spSessionSent) {
      for (let i = spSessionSent; i < nFinal; i++) {
        if (!event.results[i].isFinal) continue;
        if (spChkTranslate.checked) spQueueFinal(event.results[i][0].transcript.trim());
      }
      spSessionSent = nFinal;
      spLastInterimWords = 0;
      clearTimeout(spInterimTimer);
      spInterimSeq.invalidate();      // lo provisional en vuelo ya no vale
    }

    if (interim && spChkTranslate.checked) spScheduleInterim(interim);
  };

  return r;
}

// Cuando una sesión termina, Chrome DESCARTA el texto provisional que no llegó
// a cerrarse (ocurre con el corte de ~1 min y con las pausas largas). Se
// consolida aquí para que no desaparezca de la pantalla, y se manda a traducir
// porque nadie más lo va a hacer.
function spCommitSession() {
  const pending = spSessionInterim.trim();
  const add = spSessionFinal + (pending ? pending + ' ' : '');

  if (add) {
    const sep = spBaseText && !/\s$/.test(spBaseText) ? ' ' : '';
    spBaseText += sep + add;
    stSet('transcript', spBaseText);
  }
  if (pending && spChkTranslate.checked) spQueueFinal(pending);

  spResetSession();
}

function spStart() {
  // El traductor se prepara EN PARALELO: descargar el modelo puede tardar y el
  // micrófono no debe esperar. Las frases dictadas mientras carga se traducen
  // igualmente, porque la cola espera a spTranslatorReady.
  if (spChkTranslate.checked) spInitTranslator();
  const r = spBuild();
  if (!r) return;

  clearTimeout(spManualTimer);
  spManualSeq.invalidate();     // una traducción de texto escrito ya no interesa

  spRecognition = r;
  spIsRecording = true;
  spSetLocked(true);
  i18nSet(spBtnRecord, 'btn.stop');
  spBtnRecord.classList.add('active');

  try {
    r.start();
  } catch (e) {
    uiStatusError(spStatusEl, e);
    spStop();
  }
}

function spStop() {
  spIsRecording = false;

  if (spRecognition) {
    // Se consolida antes de desconectar: con los handlers a null onend ya no
    // llegará, y el provisional pendiente se perdería.
    spCommitSession();
    // Los handlers se desconectan ANTES de stop(): stop() no es inmediato y su
    // onend llegaría después, reenviándonos al auto-reinicio.
    spRecognition.onend = null;
    spRecognition.onresult = null;
    spRecognition.onerror = null;
    spRecognition.onstart = null;
    try { spRecognition.stop(); } catch {}
    spRecognition = null;
  }

  clearTimeout(spInterimTimer);
  spInterimSeq.invalidate();
  spSetLocked(false);
  i18nSet(spBtnRecord, 'btn.record');
  spBtnRecord.classList.remove('active');
  uiStatus(spStatusEl, 'st.stopped', null, 'info');
}

// Los pares de idioma y la traducción en vivo se eligen ANTES de hablar:
// mientras se graba quedan bloqueados.
function spSetLocked(locked) {
  spLangFrom.disabled = locked;
  spLangTo.disabled = locked;
  spChkTranslate.disabled = locked;
}

// ── Traducción ────────────────────────────────────────────────────────────
function spInitTranslator() {
  spTranslator = null;
  const from = spLangFrom.value.split('-')[0];
  const to = spLangTo.value;

  if (from === to) {
    uiStatus(spTranslateStatus, 'st.sameLangNoop', null, 'info');
    spTranslatorReady = Promise.resolve(null);
    return spTranslatorReady;
  }

  spTranslatorReady = AI.getTranslator(from, to, uiProgress(spTranslateStatus))
    .then(inst => {
      spTranslator = inst;
      uiStatus(spTranslateStatus, 'st.translatorReady', { from, to }, 'ok');
      return inst;
    })
    .catch(e => {
      uiStatusError(spTranslateStatus, e);
      return null;
    });

  return spTranslatorReady;
}

function spRender(tail) {
  spTranslationTA.value = spFinalTranslation + (tail || '');
}

// Las frases cerradas se traducen EN COLA: si se lanzasen en paralelo, una
// frase corta pedida después podría volver antes y colocarse en el sitio
// equivocado.
function spQueueFinal(phrase) {
  if (!phrase) return;
  spPendingFinals++;
  spFinalQueue = spFinalQueue
    .then(async () => {
      const translator = await spTranslatorReady;
      if (!translator) return;
      spFinalTranslation += (await translator.translate(phrase)) + ' ';
      spRender();
      stSet('translation', spFinalTranslation);
    })
    // Un fallo puntual se avisa en el status y NO borra lo ya traducido.
    .catch(e => uiStatusError(spTranslateStatus, e))
    .then(() => { spPendingFinals--; });
}

function spScheduleInterim(interim) {
  const words = interim.trim().split(/\s+/).length;
  // Tres frenos: mínimo de palabras, palabras nuevas desde la última
  // traducción, y debounce. Chrome dispara onresult varias veces por segundo.
  if (words < 3 || words - spLastInterimWords < 2) return;
  spLastInterimWords = words;

  clearTimeout(spInterimTimer);
  const token = spInterimSeq.next();
  spInterimTimer = setTimeout(async () => {
    if (!spTranslator || !spInterimSeq.isCurrent(token)) return;
    try {
      const translated = await spTranslator.translate(interim);
      // Al volver puede haber llegado una frase final o un provisional más
      // nuevo: entonces este texto está caducado y pintarlo duplicaría.
      if (spInterimSeq.isCurrent(token) && spPendingFinals === 0) spRender(translated);
    } catch {}
  }, 200);
}

// ── Traducción del texto escrito a mano ───────────────────────────────────
// La regla es "lo que haya en la caja se traduce", venga de la voz o del
// teclado. Al editar hay que retraducir el texto ENTERO: una palabra cambiada
// en medio invalida la frase que la contiene, así que la traducción construida
// frase a frase ya no sirve.
function spScheduleManual() {
  clearTimeout(spManualTimer);
  spManualTimer = setTimeout(spTranslateManual, SP_MANUAL_DELAY);
}

async function spTranslateManual() {
  if (spIsRecording || !spChkTranslate.checked) return;

  const text = spTranscriptTA.value.trim();
  const token = spManualSeq.next();

  if (!text) {
    spFinalTranslation = '';
    spRender();
    stRemove('translation');
    return;
  }

  const from = spLangFrom.value.split('-')[0];
  const to = spLangTo.value;
  if (from === to) {
    uiStatus(spTranslateStatus, 'st.sameLangNoop', null, 'info');
    return;
  }

  // Puede no haberse pulsado Grabar nunca en esta sesión: el traductor se crea
  // aquí, y si falta el modelo se descarga mostrando el porcentaje.
  if (!spTranslator) spInitTranslator();

  const translator = await spTranslatorReady;
  if (!translator || !spManualSeq.isCurrent(token)) return;

  uiStatus(spTranslateStatus, 'st.translating', null, 'busy');
  try {
    const out = await translator.translate(text);
    if (!spManualSeq.isCurrent(token)) return;
    spFinalTranslation = out + ' ';
    spRender();
    stSet('translation', spFinalTranslation);
    uiStatus(spTranslateStatus, 'st.translated', { from, to }, 'ok');
  } catch (e) {
    if (!spManualSeq.isCurrent(token)) return;
    uiStatusError(spTranslateStatus, e);
  }
}

// ── Limpieza ──────────────────────────────────────────────────────────────
function spResetSession() {
  spSessionFinal = '';
  spSessionInterim = '';
  spSessionSent = 0;
  spLastInterimWords = 0;
}

function spClearAll() {
  clearTimeout(spInterimTimer);
  clearTimeout(spManualTimer);
  spInterimSeq.invalidate();
  spManualSeq.invalidate();
  spResetSession();
  spBaseText = '';
  spFinalTranslation = '';
  spTranscriptTA.value = '';
  spTranslationTA.value = '';
  stRemove('transcript');
  stRemove('translation');
}

function spClearTranslation() {
  clearTimeout(spManualTimer);
  spInterimSeq.invalidate();
  spManualSeq.invalidate();
  spFinalTranslation = '';
  spTranslationTA.value = '';
  stRemove('translation');
}

// ── Init ──────────────────────────────────────────────────────────────────
function spInit() {
  spBtnRecord       = document.getElementById('btnRecord');
  spBtnClear        = document.getElementById('btnClear');
  spTranscriptTA    = document.getElementById('transcript');
  spTranslationTA   = document.getElementById('translation');
  spStatusEl        = document.getElementById('speechStatus');
  spTranslateStatus = document.getElementById('translateStatus');
  spLangFrom        = document.getElementById('langFrom');
  spLangTo          = document.getElementById('langTo');
  spChkTranslate    = document.getElementById('chkTranslate');
  spTranslationBlock= document.getElementById('translationBlock');

  spInterimSeq = AI.sequencer();
  spManualSeq  = AI.sequencer();

  // Selectores desde la lista única de idiomas, con lo último elegido.
  lgFillSelect(spLangFrom, 'speech', stGet('langFrom', 'es-ES'));
  lgFillSelect(spLangTo, 'code', stGet('langTo', 'en'));
  spChkTranslate.checked = stGet('realtime', true);
  spTranslationBlock.classList.toggle('hidden', !spChkTranslate.checked);

  // Sesión anterior: la transcripción no se pierde por una recarga.
  spBaseText = stGet('transcript', '') || '';
  spFinalTranslation = stGet('translation', '') || '';
  spTranscriptTA.value = spBaseText;
  spTranslationTA.value = spFinalTranslation;
  if (spBaseText || spFinalTranslation) uiStatus(spStatusEl, 'st.restored', null, 'info');
  else uiStatus(spStatusEl, 'st.ready', null, 'info');

  spBtnRecord.addEventListener('click', () => {
    if (spIsRecording) spStop();
    else spStart();
  });

  spBtnClear.addEventListener('click', spClearAll);

  // Con la grabación parada el usuario puede corregir a mano: su texto pasa a
  // ser la nueva base, y se retraduce tras la pausa al teclear.
  spTranscriptTA.addEventListener('input', () => {
    if (spIsRecording) return;
    spResetSession();
    spBaseText = spTranscriptTA.value;
    stSet('transcript', spBaseText);
    spScheduleManual();
  });

  spTranslationTA.addEventListener('input', () => {
    if (spIsRecording) return;
    spFinalTranslation = spTranslationTA.value;
    stSet('translation', spFinalTranslation);
  });

  // Cambiar el idioma ORIGEN invalida lo dictado: lo que venga será otro idioma.
  spLangFrom.addEventListener('change', () => {
    stSet('langFrom', spLangFrom.value);
    const hadText = spBaseText || spFinalTranslation;
    spClearAll();
    spTranslator = null;
    spTranslatorReady = Promise.resolve(null);
    if (hadText) uiStatus(spStatusEl, 'st.clearedSource', null, 'info');
  });

  // Cambiar el idioma DESTINO solo invalida la traducción: la transcripción
  // sigue siendo válida en su idioma.
  spLangTo.addEventListener('change', () => {
    stSet('langTo', spLangTo.value);
    const hadText = spFinalTranslation;
    spClearTranslation();
    spTranslator = null;
    spTranslatorReady = Promise.resolve(null);
    if (hadText) uiStatus(spTranslateStatus, 'st.clearedTarget', null, 'info');
    else uiClearStatus(spTranslateStatus);
  });

  // Oculta el bloque pero CONSERVA el texto: un clic no debe destruir trabajo.
  spChkTranslate.addEventListener('change', () => {
    stSet('realtime', spChkTranslate.checked);
    spTranslationBlock.classList.toggle('hidden', !spChkTranslate.checked);
    if (!spChkTranslate.checked) {
      clearTimeout(spInterimTimer);
      clearTimeout(spManualTimer);
      spInterimSeq.invalidate();
      spManualSeq.invalidate();
    }
  });
}

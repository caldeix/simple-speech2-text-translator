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

let spRecognition = null;
let spIsRecording = false;         // intención del usuario, no estado del micro
let spFinalText = '';
let spFinalTranslation = '';
let spTranslator = null;
let spTranslatorReady = Promise.resolve(null);   // resuelve cuando el modelo está listo
let spInterimTimer = null;
let spLastInterimWords = 0;

let spInterimSeq = null;           // sequencer de provisionales (se crea en spInit)
let spFinalQueue = Promise.resolve();
let spPendingFinals = 0;

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
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const txt = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        spAppendFinal(txt.trim());
        spLastInterimWords = 0;
        clearTimeout(spInterimTimer);
        spInterimSeq.invalidate();      // lo provisional en vuelo ya no vale
        if (spChkTranslate.checked) spQueueFinal(txt.trim());
      } else {
        interim += txt;
      }
    }
    spTranscriptTA.value = spFinalText + interim;
    if (interim && spChkTranslate.checked) spScheduleInterim(interim);
  };

  return r;
}

function spAppendFinal(phrase) {
  if (!phrase) return;
  const sep = spFinalText && !/\s$/.test(spFinalText) ? ' ' : '';
  spFinalText += sep + phrase + ' ';
  stSet('transcript', spFinalText);
}

function spStart() {
  // El traductor se prepara EN PARALELO: descargar el modelo puede tardar y el
  // micrófono no debe esperar. Las frases dictadas mientras carga se traducen
  // igualmente, porque la cola espera a spTranslatorReady.
  if (spChkTranslate.checked) spInitTranslator();
  const r = spBuild();
  if (!r) return;

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
  spLastInterimWords = 0;
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

// ── Limpieza ──────────────────────────────────────────────────────────────
function spClearAll() {
  clearTimeout(spInterimTimer);
  spInterimSeq.invalidate();
  spLastInterimWords = 0;
  spFinalText = '';
  spFinalTranslation = '';
  spTranscriptTA.value = '';
  spTranslationTA.value = '';
  stRemove('transcript');
  stRemove('translation');
}

function spClearTranslation() {
  spInterimSeq.invalidate();
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

  // Selectores desde la lista única de idiomas, con lo último elegido.
  lgFillSelect(spLangFrom, 'speech', stGet('langFrom', 'es-ES'));
  lgFillSelect(spLangTo, 'code', stGet('langTo', 'en'));
  spChkTranslate.checked = stGet('realtime', true);
  spTranslationBlock.classList.toggle('hidden', !spChkTranslate.checked);

  // Sesión anterior: la transcripción no se pierde por una recarga.
  spFinalText = stGet('transcript', '') || '';
  spFinalTranslation = stGet('translation', '') || '';
  spTranscriptTA.value = spFinalText;
  spTranslationTA.value = spFinalTranslation;
  if (spFinalText || spFinalTranslation) uiStatus(spStatusEl, 'st.restored', null, 'info');
  else uiStatus(spStatusEl, 'st.ready', null, 'info');

  spBtnRecord.addEventListener('click', () => {
    if (spIsRecording) spStop();
    else spStart();
  });

  spBtnClear.addEventListener('click', spClearAll);

  // Con la grabación parada el usuario puede corregir a mano: su texto pasa a
  // ser la nueva base para que el siguiente resultado no lo pise.
  spTranscriptTA.addEventListener('input', () => {
    if (spIsRecording) return;
    spFinalText = spTranscriptTA.value;
    stSet('transcript', spFinalText);
  });
  spTranslationTA.addEventListener('input', () => {
    if (spIsRecording) return;
    spFinalTranslation = spTranslationTA.value;
    stSet('translation', spFinalTranslation);
  });

  // Cambiar el idioma ORIGEN invalida lo dictado: lo que venga será otro idioma.
  spLangFrom.addEventListener('change', () => {
    stSet('langFrom', spLangFrom.value);
    const hadText = spFinalText || spFinalTranslation;
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
      spInterimSeq.invalidate();
    }
  });
}

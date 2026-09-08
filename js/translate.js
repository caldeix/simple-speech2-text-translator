/* ══════════════════════════════════════════════════════════════════════════
   translate.js — Sección 4: traductor de texto
   Prefijo de variables de este fichero: tr*
   Scope global compartido: no declares nombres que ya existan en otro fichero.
   ══════════════════════════════════════════════════════════════════════════ */

let trBtn, trInput, trOutput, trStatus, trResultWrap, trFrom, trTo;
let trSeq = null;

async function trRun() {
  const text = trInput.value.trim();
  if (!text) {
    uiStatus(trStatus, 'st.needText', null, 'bad');
    return;
  }

  const from = trFrom.value;
  const to = trTo.value;
  if (from === to) {
    trOutput.value = text;
    trResultWrap.classList.remove('hidden');
    uiStatus(trStatus, 'st.sameLang', null, 'info');
    return;
  }

  const token = trSeq.next();
  uiStatus(trStatus, 'st.startingTranslator', null, 'busy');
  trResultWrap.classList.add('hidden');
  trOutput.value = '';

  try {
    // Instantáneo si este par ya está en la caché de AI.
    const translator = await AI.getTranslator(from, to, uiProgress(trStatus));
    if (!trSeq.isCurrent(token)) return;

    uiStatus(trStatus, 'st.translating', null, 'busy');
    const translated = await translator.translate(text);
    if (!trSeq.isCurrent(token)) return;

    trOutput.value = translated;
    trResultWrap.classList.remove('hidden');
    uiStatus(trStatus, 'st.translated', { from, to }, 'ok');
  } catch (e) {
    if (!trSeq.isCurrent(token)) return;
    uiStatusError(trStatus, e);
  }
}

function trInit() {
  trBtn        = document.getElementById('btnTranslate');
  trInput      = document.getElementById('trInput');
  trOutput     = document.getElementById('trOutput');
  trStatus     = document.getElementById('trStatus');
  trResultWrap = document.getElementById('trResultWrap');
  trFrom       = document.getElementById('trFromLang');
  trTo         = document.getElementById('trToLang');

  trSeq = AI.sequencer();

  lgFillSelect(trFrom, 'code', stGet('trFrom', 'es'));
  lgFillSelect(trTo, 'code', stGet('trTo', 'en'));

  trFrom.addEventListener('change', () => stSet('trFrom', trFrom.value));
  trTo.addEventListener('change', () => stSet('trTo', trTo.value));
  trBtn.addEventListener('click', trRun);
}

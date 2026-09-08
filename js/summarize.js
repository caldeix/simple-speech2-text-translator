/* ══════════════════════════════════════════════════════════════════════════
   summarize.js — Sección 3: resumidor
   Prefijo de variables de este fichero: sm*
   Scope global compartido: no declares nombres que ya existan en otro fichero.
   ══════════════════════════════════════════════════════════════════════════ */

let smBtn, smInput, smOutput, smStatus, smResultWrap, smType, smLength;

// El formato lo fija el código: 'markdown' no cambia el resultado de forma
// visible en un <textarea>, que no renderiza nada.
const SM_FORMAT = 'plain-text';
let smSeq = null;

async function smRun() {
  const text = smInput.value.trim();
  if (!text) {
    uiStatus(smStatus, 'st.needText', null, 'bad');
    return;
  }

  const token = smSeq.next();     // clics repetidos: solo cuenta el último
  uiStatus(smStatus, 'st.summarizing', null, 'busy');
  smResultWrap.classList.add('hidden');
  smOutput.value = '';

  try {
    const summarizer = await AI.getSummarizer({
      type: smType.value,
      format: SM_FORMAT,
      length: smLength.value,
      // Sin esta instrucción el modelo tiende a responder siempre en inglés.
      sharedContext: 'Respond in the same language as the input text. Do not translate.',
    }, uiProgress(smStatus));
    if (!smSeq.isCurrent(token)) return;

    // El modelo ya está listo: se recupera el mensaje de trabajo, que el aviso
    // de descarga puede haber sobrescrito.
    uiStatus(smStatus, 'st.summarizing', null, 'busy');
    const result = await summarizer.summarize(text);
    if (!smSeq.isCurrent(token)) return;

    smOutput.value = result;
    smResultWrap.classList.remove('hidden');
    uiStatus(smStatus, 'st.summarized', null, 'ok');
  } catch (e) {
    if (!smSeq.isCurrent(token)) return;
    uiStatusError(smStatus, e);
  }
}

function smInit() {
  smBtn        = document.getElementById('btnSummarize');
  smInput      = document.getElementById('summaryInput');
  smOutput     = document.getElementById('summaryOutput');
  smStatus     = document.getElementById('summaryStatus');
  smResultWrap = document.getElementById('summaryResultWrap');
  smType       = document.getElementById('summaryType');
  smLength     = document.getElementById('summaryLength');

  smSeq = AI.sequencer();
  smBtn.addEventListener('click', smRun);
}

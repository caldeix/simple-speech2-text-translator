/* ══════════════════════════════════════════════════════════════════════════
   detect.js — Sección 2: detección de idioma
   Prefijo de variables de este fichero: dt*
   Scope global compartido: no declares nombres que ya existan en otro fichero.
   ══════════════════════════════════════════════════════════════════════════ */

let dtBtn, dtInput, dtStatus, dtResult, dtTbody;
let dtSeq = null;

// Nombres legibles de los códigos BCP-47, en el idioma actual de la interfaz.
const dtDisplayNames = new Map();
function dtLangName(code) {
  if (!code || code === 'und') return t('lang.unknown');
  const loc = i18nGetLang();
  if (!dtDisplayNames.has(loc)) {
    try { dtDisplayNames.set(loc, new Intl.DisplayNames([loc], { type: 'language' })); }
    catch { dtDisplayNames.set(loc, null); }
  }
  const dn = dtDisplayNames.get(loc);
  try { return (dn && dn.of(code)) || code; } catch { return code; }
}

function dtCell(row, text, cls) {
  const td = document.createElement('td');
  if (cls) td.className = cls;
  td.textContent = text;
  row.appendChild(td);
  return td;
}

async function dtRun() {
  const text = dtInput.value.trim();
  if (!text) {
    uiStatus(dtStatus, 'st.needText', null, 'bad');
    return;
  }

  const token = dtSeq.next();     // dos clics seguidos: solo pinta el último
  uiStatus(dtStatus, 'st.detecting', null, 'busy');
  dtResult.classList.add('hidden');
  dtTbody.innerHTML = '';

  try {
    const detector = await AI.getDetector(uiProgress(dtStatus));
    if (!dtSeq.isCurrent(token)) return;

    // El modelo ya está listo: se recupera el mensaje de trabajo, que el aviso
    // de descarga puede haber sobrescrito.
    uiStatus(dtStatus, 'st.detecting', null, 'busy');
    const results = await detector.detect(text);
    if (!dtSeq.isCurrent(token)) return;

    if (!results || results.length === 0) {
      throw Object.assign(new Error(t('err.noResults')), { i18n: 'err.noResults' });
    }

    // Distintas versiones de la API usan nombres de campo distintos.
    const rows = results
      .map(r => ({
        lang: r.detectedLanguage ?? r.language ?? r.languageCode ?? '?',
        confidence: typeof r.confidence === 'number' ? r.confidence : (r.score ?? 0),
      }))
      .filter(r => r.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence);

    if (rows.length === 0) {
      throw Object.assign(new Error(t('err.noConfidence')), { i18n: 'err.noConfidence' });
    }

    rows.forEach((r, i) => {
      const pct = (r.confidence * 100).toFixed(1);
      const top = i === 0;
      const tr = document.createElement('tr');
      if (top) tr.className = 'top-row';

      dtCell(tr, dtLangName(r.lang));
      dtCell(tr, r.lang, 'muted');
      dtCell(tr, pct + '%', top ? 'strong-cell' : '');

      const barCell = dtCell(tr, '');
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill' + (top ? ' bar-top' : '');
      fill.style.width = pct + '%';
      track.appendChild(fill);
      barCell.appendChild(track);

      dtTbody.appendChild(tr);
    });

    dtResult.classList.remove('hidden');
    uiStatus(dtStatus, 'st.detected', { n: rows.length }, 'ok');
  } catch (e) {
    if (!dtSeq.isCurrent(token)) return;
    uiStatusError(dtStatus, e);
  }
}

function dtInit() {
  dtBtn    = document.getElementById('btnDetect');
  dtInput  = document.getElementById('detectInput');
  dtStatus = document.getElementById('detectStatus');
  dtResult = document.getElementById('detectResult');
  dtTbody  = document.getElementById('detectTbody');

  dtSeq = AI.sequencer();
  dtBtn.addEventListener('click', dtRun);
}

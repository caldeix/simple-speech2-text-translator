/* ══════════════════════════════════════════════════════════════════════════
   languages.js — lista única de idiomas
   Prefijo de variables de este fichero: lg*
   Los cuatro <select> de la app se generan desde aquí, así que las listas
   nunca pueden descuadrarse entre secciones.
   ══════════════════════════════════════════════════════════════════════════ */

// code   → código de idioma para las APIs de traducción/detección ('es')
// speech → BCP-47 completo que necesita el reconocedor de voz ('es-ES')
// label  → nombre en su propio idioma (convención en selectores de idioma:
//          NO se traduce nunca)
const LANGS = [
  { code: 'es', speech: 'es-ES', label: 'Español',   flag: '🇪🇸' },
  { code: 'en', speech: 'en-US', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', speech: 'fr-FR', label: 'Français',  flag: '🇫🇷' },
  { code: 'de', speech: 'de-DE', label: 'Deutsch',   flag: '🇩🇪' },
  { code: 'it', speech: 'it-IT', label: 'Italiano',  flag: '🇮🇹' },
  { code: 'pt', speech: 'pt-PT', label: 'Português', flag: '🇵🇹' },
  { code: 'zh', speech: 'zh-CN', label: '中文',       flag: '🇨🇳' },
  { code: 'ja', speech: 'ja-JP', label: '日本語',     flag: '🇯🇵' },
];

// Idiomas con traducción de interfaz escrita a mano (ver i18n.js).
const LG_UI_CODES = ['es', 'en', 'fr', 'de', 'it', 'pt'];

// kind: 'speech' → value = 'es-ES' | 'code' → value = 'es'
function lgFillSelect(select, kind, selected) {
  select.innerHTML = '';
  LANGS.forEach(l => {
    const opt = document.createElement('option');
    opt.value = kind === 'speech' ? l.speech : l.code;
    opt.textContent = l.label;
    if (opt.value === selected) opt.selected = true;
    select.appendChild(opt);
  });
}

function lgFillUiSelect(select, selected) {
  select.innerHTML = '';
  LANGS.filter(l => LG_UI_CODES.includes(l.code)).forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = `${l.flag} ${l.code.toUpperCase()} — ${l.label}`;
    if (l.code === selected) opt.selected = true;
    select.appendChild(opt);
  });
}

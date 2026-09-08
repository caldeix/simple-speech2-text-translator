/* ══════════════════════════════════════════════════════════════════════════
   ai.js — capa común sobre las APIs de IA integradas en Chrome
   Prefijo de variables de este fichero: AI, CHROME_MIN
   Scope global compartido: no declares nombres que ya existan en otro fichero.

   Las tres APIs (Translator, LanguageDetector, Summarizer) comparten la misma
   coreografía: availability() → create() → esperar a .ready → usar. Aquí se
   encapsula una sola vez, con caché e informe de progreso de descarga.
   ══════════════════════════════════════════════════════════════════════════ */

const CHROME_MIN = 138;

const AI = (function () {
  const translators = new Map();   // "es→en"      → Promise<Translator>
  const summarizers = new Map();   // JSON(opts)   → Promise<Summarizer>
  let detectorPromise = null;

  // Error con clave de diccionario, para poder mostrarlo en el idioma de la UI.
  function aiError(key, vars) {
    return Object.assign(new Error(t(key, vars)), { i18n: key, vars });
  }

  // availability() → 'available' | 'downloadable' | 'downloading' | 'unavailable'
  // 'downloadable' es el caso normal la primera vez: el modelo no está en disco.
  const needsDownload = avail => avail === 'downloadable' || avail === 'downloading';

  // Progreso de descarga. El evento reporta 'loaded' de 0 a 1 (algunas
  // versiones traen loaded/total), así que se normaliza a 0-100.
  function monitorOpt(onProgress) {
    if (!onProgress) return {};
    return {
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          const ratio = e.total ? e.loaded / e.total : e.loaded;
          const pct = Math.max(0, Math.min(100, Math.round((ratio || 0) * 100)));
          onProgress(pct);
        });
      },
    };
  }

  // create() puede devolver el objeto antes de terminar la descarga, así que
  // se espera siempre a .ready cuando la implementación lo expone.
  async function whenReady(instance) {
    try { if (instance && instance.ready) await instance.ready; } catch {}
    return instance;
  }

  // Se cachea la PROMESA, no el objeto: dos llamadas simultáneas al mismo par
  // comparten un único create(). Un fallo se borra para poder reintentar.
  function cached(map, key, factory) {
    if (!map.has(key)) {
      const p = factory();
      p.catch(() => map.delete(key));
      map.set(key, p);
    }
    return map.get(key);
  }

  return {
    needsDownload,

    // onProgress(pct|null): null = arranca la descarga sin porcentaje aún.
    getTranslator(from, to, onProgress) {
      if (typeof Translator === 'undefined') {
        return Promise.reject(aiError('err.noApi', { api: 'Translator API', min: CHROME_MIN }));
      }
      return cached(translators, from + '→' + to, async () => {
        const avail = await Translator.availability({ sourceLanguage: from, targetLanguage: to });
        if (avail === 'unavailable') throw aiError('err.pairUnsupported', { from, to });
        if (needsDownload(avail) && onProgress) onProgress(null);
        const inst = await Translator.create({
          sourceLanguage: from,
          targetLanguage: to,
          ...monitorOpt(onProgress),
        });
        return whenReady(inst);
      });
    },

    getSummarizer(opts, onProgress) {
      if (typeof Summarizer === 'undefined') {
        return Promise.reject(aiError('err.noApi', { api: 'Summarizer API', min: CHROME_MIN }));
      }
      return cached(summarizers, JSON.stringify(opts), async () => {
        // availability() solo entiende los parámetros del modelo, no sharedContext.
        const { type, format, length } = opts;
        let avail = 'available';
        try { avail = await Summarizer.availability({ type, format, length }); } catch {}
        if (avail === 'unavailable') throw aiError('err.modelUnavailable');
        if (needsDownload(avail) && onProgress) onProgress(null);
        return whenReady(await Summarizer.create({ ...opts, ...monitorOpt(onProgress) }));
      });
    },

    getDetector(onProgress) {
      if (typeof LanguageDetector === 'undefined') {
        return Promise.reject(aiError('err.noApi', { api: 'LanguageDetector API', min: CHROME_MIN }));
      }
      if (!detectorPromise) {
        detectorPromise = (async () => {
          let avail = 'available';
          try { avail = await LanguageDetector.availability(); } catch {}
          if (avail === 'unavailable') throw aiError('err.modelUnavailable');
          if (needsDownload(avail) && onProgress) onProgress(null);
          return whenReady(await LanguageDetector.create({ ...monitorOpt(onProgress) }));
        })();
        detectorPromise.catch(() => { detectorPromise = null; });
      }
      return detectorPromise;
    },

    // Token de generación: una operación asíncrona no se puede cancelar, así
    // que al volver se comprueba si su resultado sigue siendo el vigente.
    sequencer() {
      let current = 0;
      return {
        next:       () => ++current,
        isCurrent:  n  => n === current,
        invalidate: () => { current++; },
      };
    },
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   i18n.js — diccionario de interfaz y cambio de idioma
   Prefijo de variables de este fichero: i18n*
   Scope global compartido: no declares nombres que ya existan en otro fichero.

   Cómo funciona
   ─────────────
   El HTML lleva el español escrito y, además, la clave del diccionario:

     <label data-i18n="lbl.transcript">Transcripción</label>
     <textarea data-i18n-ph="ph.transcript" placeholder="..."></textarea>
     <button data-i18n-title="aria.copy">📋</button>

   i18nApply(lang) recorre esos atributos y reescribe texto, placeholder y
   title/aria-label. Los mensajes DINÁMICOS (estados y errores) se escriben con
   i18nSet(el, clave, vars), que guarda la clave y sus variables en el propio
   elemento: así, al cambiar de idioma, i18nApply los repinta solos sin que
   nadie tenga que acordarse de refrescarlos.
   ══════════════════════════════════════════════════════════════════════════ */

const I18N = {
  es: {
    'nav.speech': 'Voz → Texto → Traducción',
    'nav.detect': 'Detectar idioma',
    'nav.summary': 'Resumidor',
    'nav.translate': 'Traducción',

    'lbl.langFrom': 'Idioma origen (voz)',
    'lbl.langTo': 'Idioma destino (traducción)',
    'lbl.transcript': 'Transcripción',
    'lbl.translation': 'Traducción en tiempo real',
    'chk.realtime': 'Traducción en tiempo real',
    'ph.transcript': 'El texto aparecerá aquí mientras hablas...',
    'ph.translation': 'La traducción aparecerá aquí...',
    'btn.record': '▶ Grabar',
    'btn.stop': '⏹ Detener',
    'btn.clear': '🗑 Limpiar',

    'lbl.detectInput': 'Pega o escribe un texto para detectar su idioma',
    'ph.detectInput': 'Escribe aquí el texto a analizar...',
    'btn.detect': '🔎 Detectar idioma',
    'lbl.detectResults': 'Resultados de detección',
    'th.language': 'Idioma',
    'th.code': 'Código',
    'th.confidence': 'Confianza',
    'th.bar': 'Barra',
    'lang.unknown': 'No lo sé',

    'lbl.summaryType': 'Tipo de resumen',
    'lbl.summaryLength': 'Longitud',
    'opt.tldr': 'Lo esencial',
    'opt.keyPoints': 'Puntos clave',
    'opt.teaser': 'Gancho',
    'opt.headline': 'Titular',
    'opt.short': 'Corto',
    'opt.medium': 'Medio',
    'opt.long': 'Largo',
    'lbl.summaryInput': 'Texto a resumir',
    'ph.summaryInput': 'Pega aquí el texto que quieres resumir...',
    'btn.summarize': '✨ Resumir',
    'lbl.result': 'Resultado',

    'lbl.trFrom': 'Idioma origen',
    'lbl.trTo': 'Idioma destino',
    'lbl.trInput': 'Texto a traducir',
    'ph.trInput': 'Escribe o pega aquí el texto...',
    'btn.translate': '🌐 Traducir',

    'st.ready': 'Listo.',
    'st.recording': '🔴 Grabando...',
    'st.stopped': 'Detenido.',
    'st.error': '⚠ {msg}',
    'st.srUnsupported': '❌ Reconocimiento de voz no soportado.',
    'st.clearedSource': 'Transcripción y traducción limpiadas al cambiar el idioma origen.',
    'st.clearedTarget': 'Traducción limpiada al cambiar el idioma destino.',
    'st.detecting': '⏳ Detectando...',
    'st.detected': '✅ {n} idioma(s) detectado(s).',
    'st.summarizing': '⏳ Resumiendo...',
    'st.summarized': '✅ Listo.',
    'st.startingTranslator': '⏳ Iniciando traductor...',
    'st.translating': '⏳ Traduciendo...',
    'st.translated': '✅ Listo ({from} → {to})',
    'st.sameLang': '(mismo idioma)',
    'st.sameLangNoop': '(mismo idioma: no se traduce)',
    'st.translatorReady': '✅ Traductor listo ({from} → {to})',
    'st.downloading': '⬇ Descargando modelo...',
    'st.downloadingPct': '⬇ Descargando modelo... {pct}%',
    'st.needText': '⚠ Escribe o pega algún texto primero.',
    'st.copyFailed': '⚠ No se pudo copiar al portapapeles.',
    'st.restored': 'Sesión anterior restaurada.',

    'err.noApi': '{api} no disponible. Necesitas Chrome {min}+.',
    'err.pairUnsupported': 'Par {from}→{to} no soportado por la API nativa.',
    'err.modelUnavailable': 'El modelo no está disponible en este dispositivo.',
    'err.noResults': 'No se obtuvieron resultados.',
    'err.noConfidence': 'Ningún idioma con confianza medible.',

    'dv.title': 'DEVICE INFO',
    'dv.notChrome': '⚠ No es Chrome',
    'dv.chromeOk': '✅ Chrome {v}',
    'dv.chromeOld': '❌ Chrome {v} (necesitas {min}+)',
    'dv.micGranted': '✅ Micrófono: permiso concedido',
    'dv.micDenied': '❌ Micrófono: permiso denegado',
    'dv.micPrompt': '⚠ Micrófono: pendiente de permiso',
    'dv.micUnknown': '⚠ Micrófono: estado desconocido',
    'dv.apiOk': '✅ {api}',
    'dv.apiNo': '❌ {api} no disponible',
    'dv.uiLang': 'IDIOMA INTERFAZ',

    'info.title': 'SECCIÓN ACTIVA',
    'info.speech.desc': 'Dicta y el texto aparece transcrito y traducido al momento. ⚠ El reconocimiento de voz de Chrome envía el audio a los servidores de Google; la traducción sí se hace en tu dispositivo.',
    'info.detect.desc': 'Analiza un texto y lista los idiomas candidatos con su porcentaje de confianza. Todo ocurre en tu dispositivo.',
    'info.summary.desc': 'Resume un texto con el tipo y la longitud que elijas. El modelo corre en tu dispositivo.',
    'info.translate.desc': 'Traduce un texto entre dos idiomas. El modelo corre en tu dispositivo.',

    'aria.copy': 'Copiar al portapapeles',
    'panel.toggle': 'ℹ Información',
  },

  en: {
    'nav.speech': 'Voice → Text → Translation',
    'nav.detect': 'Detect language',
    'nav.summary': 'Summarizer',
    'nav.translate': 'Translation',

    'lbl.langFrom': 'Source language (voice)',
    'lbl.langTo': 'Target language (translation)',
    'lbl.transcript': 'Transcript',
    'lbl.translation': 'Real-time translation',
    'chk.realtime': 'Real-time translation',
    'ph.transcript': 'Text will appear here as you speak...',
    'ph.translation': 'The translation will appear here...',
    'btn.record': '▶ Record',
    'btn.stop': '⏹ Stop',
    'btn.clear': '🗑 Clear',

    'lbl.detectInput': 'Paste or type a text to detect its language',
    'ph.detectInput': 'Type the text to analyse here...',
    'btn.detect': '🔎 Detect language',
    'lbl.detectResults': 'Detection results',
    'th.language': 'Language',
    'th.code': 'Code',
    'th.confidence': 'Confidence',
    'th.bar': 'Bar',
    'lang.unknown': 'Unknown',

    'lbl.summaryType': 'Summary type',
    'lbl.summaryLength': 'Length',
    'opt.tldr': 'TL;DR',
    'opt.keyPoints': 'Key points',
    'opt.teaser': 'Teaser',
    'opt.headline': 'Headline',
    'opt.short': 'Short',
    'opt.medium': 'Medium',
    'opt.long': 'Long',
    'lbl.summaryInput': 'Text to summarise',
    'ph.summaryInput': 'Paste the text you want to summarise here...',
    'btn.summarize': '✨ Summarise',
    'lbl.result': 'Result',

    'lbl.trFrom': 'Source language',
    'lbl.trTo': 'Target language',
    'lbl.trInput': 'Text to translate',
    'ph.trInput': 'Type or paste the text here...',
    'btn.translate': '🌐 Translate',

    'st.ready': 'Ready.',
    'st.recording': '🔴 Recording...',
    'st.stopped': 'Stopped.',
    'st.error': '⚠ {msg}',
    'st.srUnsupported': '❌ Speech recognition is not supported.',
    'st.clearedSource': 'Transcript and translation cleared after changing the source language.',
    'st.clearedTarget': 'Translation cleared after changing the target language.',
    'st.detecting': '⏳ Detecting...',
    'st.detected': '✅ {n} language(s) detected.',
    'st.summarizing': '⏳ Summarising...',
    'st.summarized': '✅ Done.',
    'st.startingTranslator': '⏳ Starting translator...',
    'st.translating': '⏳ Translating...',
    'st.translated': '✅ Done ({from} → {to})',
    'st.sameLang': '(same language)',
    'st.sameLangNoop': '(same language: nothing to translate)',
    'st.translatorReady': '✅ Translator ready ({from} → {to})',
    'st.downloading': '⬇ Downloading model...',
    'st.downloadingPct': '⬇ Downloading model... {pct}%',
    'st.needText': '⚠ Type or paste some text first.',
    'st.copyFailed': '⚠ Could not copy to the clipboard.',
    'st.restored': 'Previous session restored.',

    'err.noApi': '{api} is not available. You need Chrome {min}+.',
    'err.pairUnsupported': 'The {from}→{to} pair is not supported by the native API.',
    'err.modelUnavailable': 'The model is not available on this device.',
    'err.noResults': 'No results were returned.',
    'err.noConfidence': 'No language with measurable confidence.',

    'dv.title': 'DEVICE INFO',
    'dv.notChrome': '⚠ Not Chrome',
    'dv.chromeOk': '✅ Chrome {v}',
    'dv.chromeOld': '❌ Chrome {v} (you need {min}+)',
    'dv.micGranted': '✅ Microphone: permission granted',
    'dv.micDenied': '❌ Microphone: permission denied',
    'dv.micPrompt': '⚠ Microphone: awaiting permission',
    'dv.micUnknown': '⚠ Microphone: unknown state',
    'dv.apiOk': '✅ {api}',
    'dv.apiNo': '❌ {api} not available',
    'dv.uiLang': 'INTERFACE LANGUAGE',

    'info.title': 'ACTIVE SECTION',
    'info.speech.desc': 'Dictate and see the text transcribed and translated as you speak. ⚠ Chrome speech recognition sends the audio to Google servers; the translation does run on your device.',
    'info.detect.desc': 'Analyses a text and lists the candidate languages with their confidence score. Everything runs on your device.',
    'info.summary.desc': 'Summarises a text with the type and length you choose. The model runs on your device.',
    'info.translate.desc': 'Translates a text between two languages. The model runs on your device.',

    'aria.copy': 'Copy to clipboard',
    'panel.toggle': 'ℹ Information',
  },

  fr: {
    'nav.speech': 'Voix → Texte → Traduction',
    'nav.detect': 'Détecter la langue',
    'nav.summary': 'Résumé',
    'nav.translate': 'Traduction',

    'lbl.langFrom': 'Langue source (voix)',
    'lbl.langTo': 'Langue cible (traduction)',
    'lbl.transcript': 'Transcription',
    'lbl.translation': 'Traduction en temps réel',
    'chk.realtime': 'Traduction en temps réel',
    'ph.transcript': 'Le texte apparaîtra ici pendant que vous parlez...',
    'ph.translation': 'La traduction apparaîtra ici...',
    'btn.record': '▶ Enregistrer',
    'btn.stop': '⏹ Arrêter',
    'btn.clear': '🗑 Effacer',

    'lbl.detectInput': 'Collez ou saisissez un texte pour détecter sa langue',
    'ph.detectInput': 'Saisissez ici le texte à analyser...',
    'btn.detect': '🔎 Détecter la langue',
    'lbl.detectResults': 'Résultats de la détection',
    'th.language': 'Langue',
    'th.code': 'Code',
    'th.confidence': 'Confiance',
    'th.bar': 'Barre',
    'lang.unknown': 'Inconnue',

    'lbl.summaryType': 'Type de résumé',
    'lbl.summaryLength': 'Longueur',
    'opt.tldr': "L'essentiel",
    'opt.keyPoints': 'Points clés',
    'opt.teaser': 'Accroche',
    'opt.headline': 'Titre',
    'opt.short': 'Court',
    'opt.medium': 'Moyen',
    'opt.long': 'Long',
    'lbl.summaryInput': 'Texte à résumer',
    'ph.summaryInput': 'Collez ici le texte que vous voulez résumer...',
    'btn.summarize': '✨ Résumer',
    'lbl.result': 'Résultat',

    'lbl.trFrom': 'Langue source',
    'lbl.trTo': 'Langue cible',
    'lbl.trInput': 'Texte à traduire',
    'ph.trInput': 'Saisissez ou collez le texte ici...',
    'btn.translate': '🌐 Traduire',

    'st.ready': 'Prêt.',
    'st.recording': '🔴 Enregistrement...',
    'st.stopped': 'Arrêté.',
    'st.error': '⚠ {msg}',
    'st.srUnsupported': '❌ Reconnaissance vocale non prise en charge.',
    'st.clearedSource': 'Transcription et traduction effacées après le changement de langue source.',
    'st.clearedTarget': 'Traduction effacée après le changement de langue cible.',
    'st.detecting': '⏳ Détection...',
    'st.detected': '✅ {n} langue(s) détectée(s).',
    'st.summarizing': '⏳ Résumé en cours...',
    'st.summarized': '✅ Terminé.',
    'st.startingTranslator': '⏳ Démarrage du traducteur...',
    'st.translating': '⏳ Traduction...',
    'st.translated': '✅ Terminé ({from} → {to})',
    'st.sameLang': '(même langue)',
    'st.sameLangNoop': '(même langue : rien à traduire)',
    'st.translatorReady': '✅ Traducteur prêt ({from} → {to})',
    'st.downloading': '⬇ Téléchargement du modèle...',
    'st.downloadingPct': '⬇ Téléchargement du modèle... {pct} %',
    'st.needText': '⚠ Saisissez ou collez d\'abord un texte.',
    'st.copyFailed': '⚠ Impossible de copier dans le presse-papiers.',
    'st.restored': 'Session précédente restaurée.',

    'err.noApi': '{api} non disponible. Chrome {min}+ est nécessaire.',
    'err.pairUnsupported': 'La paire {from}→{to} n\'est pas prise en charge par l\'API native.',
    'err.modelUnavailable': 'Le modèle n\'est pas disponible sur cet appareil.',
    'err.noResults': 'Aucun résultat obtenu.',
    'err.noConfidence': 'Aucune langue avec une confiance mesurable.',

    'dv.title': 'INFOS APPAREIL',
    'dv.notChrome': '⚠ Ce n\'est pas Chrome',
    'dv.chromeOk': '✅ Chrome {v}',
    'dv.chromeOld': '❌ Chrome {v} (Chrome {min}+ nécessaire)',
    'dv.micGranted': '✅ Microphone : autorisation accordée',
    'dv.micDenied': '❌ Microphone : autorisation refusée',
    'dv.micPrompt': '⚠ Microphone : autorisation en attente',
    'dv.micUnknown': '⚠ Microphone : état inconnu',
    'dv.apiOk': '✅ {api}',
    'dv.apiNo': '❌ {api} non disponible',
    'dv.uiLang': 'LANGUE DE L\'INTERFACE',

    'info.title': 'SECTION ACTIVE',
    'info.speech.desc': 'Dictez et voyez le texte transcrit et traduit en direct. ⚠ La reconnaissance vocale de Chrome envoie l\'audio aux serveurs de Google ; la traduction, elle, se fait sur votre appareil.',
    'info.detect.desc': 'Analyse un texte et liste les langues candidates avec leur score de confiance. Tout se passe sur votre appareil.',
    'info.summary.desc': 'Résume un texte selon le type et la longueur choisis. Le modèle tourne sur votre appareil.',
    'info.translate.desc': 'Traduit un texte entre deux langues. Le modèle tourne sur votre appareil.',

    'aria.copy': 'Copier dans le presse-papiers',
    'panel.toggle': 'ℹ Informations',
  },

  de: {
    'nav.speech': 'Sprache → Text → Übersetzung',
    'nav.detect': 'Sprache erkennen',
    'nav.summary': 'Zusammenfassung',
    'nav.translate': 'Übersetzung',

    'lbl.langFrom': 'Ausgangssprache (Stimme)',
    'lbl.langTo': 'Zielsprache (Übersetzung)',
    'lbl.transcript': 'Transkription',
    'lbl.translation': 'Echtzeit-Übersetzung',
    'chk.realtime': 'Echtzeit-Übersetzung',
    'ph.transcript': 'Der Text erscheint hier, während du sprichst...',
    'ph.translation': 'Die Übersetzung erscheint hier...',
    'btn.record': '▶ Aufnehmen',
    'btn.stop': '⏹ Stoppen',
    'btn.clear': '🗑 Löschen',

    'lbl.detectInput': 'Text einfügen oder schreiben, um die Sprache zu erkennen',
    'ph.detectInput': 'Schreibe hier den zu analysierenden Text...',
    'btn.detect': '🔎 Sprache erkennen',
    'lbl.detectResults': 'Erkennungsergebnisse',
    'th.language': 'Sprache',
    'th.code': 'Code',
    'th.confidence': 'Konfidenz',
    'th.bar': 'Balken',
    'lang.unknown': 'Unbekannt',

    'lbl.summaryType': 'Art der Zusammenfassung',
    'lbl.summaryLength': 'Länge',
    'opt.tldr': 'Das Wesentliche',
    'opt.keyPoints': 'Kernpunkte',
    'opt.teaser': 'Teaser',
    'opt.headline': 'Schlagzeile',
    'opt.short': 'Kurz',
    'opt.medium': 'Mittel',
    'opt.long': 'Lang',
    'lbl.summaryInput': 'Zu zusammenfassender Text',
    'ph.summaryInput': 'Füge hier den Text ein, den du zusammenfassen willst...',
    'btn.summarize': '✨ Zusammenfassen',
    'lbl.result': 'Ergebnis',

    'lbl.trFrom': 'Ausgangssprache',
    'lbl.trTo': 'Zielsprache',
    'lbl.trInput': 'Zu übersetzender Text',
    'ph.trInput': 'Schreibe oder füge hier den Text ein...',
    'btn.translate': '🌐 Übersetzen',

    'st.ready': 'Bereit.',
    'st.recording': '🔴 Aufnahme...',
    'st.stopped': 'Gestoppt.',
    'st.error': '⚠ {msg}',
    'st.srUnsupported': '❌ Spracherkennung nicht unterstützt.',
    'st.clearedSource': 'Transkription und Übersetzung nach Wechsel der Ausgangssprache gelöscht.',
    'st.clearedTarget': 'Übersetzung nach Wechsel der Zielsprache gelöscht.',
    'st.detecting': '⏳ Erkennung...',
    'st.detected': '✅ {n} Sprache(n) erkannt.',
    'st.summarizing': '⏳ Zusammenfassen...',
    'st.summarized': '✅ Fertig.',
    'st.startingTranslator': '⏳ Übersetzer wird gestartet...',
    'st.translating': '⏳ Übersetzen...',
    'st.translated': '✅ Fertig ({from} → {to})',
    'st.sameLang': '(gleiche Sprache)',
    'st.sameLangNoop': '(gleiche Sprache: nichts zu übersetzen)',
    'st.translatorReady': '✅ Übersetzer bereit ({from} → {to})',
    'st.downloading': '⬇ Modell wird geladen...',
    'st.downloadingPct': '⬇ Modell wird geladen... {pct} %',
    'st.needText': '⚠ Schreibe oder füge zuerst einen Text ein.',
    'st.copyFailed': '⚠ Kopieren in die Zwischenablage fehlgeschlagen.',
    'st.restored': 'Vorherige Sitzung wiederhergestellt.',

    'err.noApi': '{api} nicht verfügbar. Du brauchst Chrome {min}+.',
    'err.pairUnsupported': 'Das Paar {from}→{to} wird von der native API nicht unterstützt.',
    'err.modelUnavailable': 'Das Modell ist auf diesem Gerät nicht verfügbar.',
    'err.noResults': 'Keine Ergebnisse erhalten.',
    'err.noConfidence': 'Keine Sprache mit messbarer Konfidenz.',

    'dv.title': 'GERÄTEINFO',
    'dv.notChrome': '⚠ Kein Chrome',
    'dv.chromeOk': '✅ Chrome {v}',
    'dv.chromeOld': '❌ Chrome {v} (du brauchst {min}+)',
    'dv.micGranted': '✅ Mikrofon: Zugriff erlaubt',
    'dv.micDenied': '❌ Mikrofon: Zugriff verweigert',
    'dv.micPrompt': '⚠ Mikrofon: Zugriff ausstehend',
    'dv.micUnknown': '⚠ Mikrofon: Status unbekannt',
    'dv.apiOk': '✅ {api}',
    'dv.apiNo': '❌ {api} nicht verfügbar',
    'dv.uiLang': 'SPRACHE DER OBERFLÄCHE',

    'info.title': 'AKTIVER BEREICH',
    'info.speech.desc': 'Diktiere und sieh den Text sofort transkribiert und übersetzt. ⚠ Die Spracherkennung von Chrome sendet das Audio an Google-Server; die Übersetzung läuft dagegen auf deinem Gerät.',
    'info.detect.desc': 'Analysiert einen Text und listet die möglichen Sprachen mit ihrer Konfidenz auf. Alles läuft auf deinem Gerät.',
    'info.summary.desc': 'Fasst einen Text in der gewählten Art und Länge zusammen. Das Modell läuft auf deinem Gerät.',
    'info.translate.desc': 'Übersetzt einen Text zwischen zwei Sprachen. Das Modell läuft auf deinem Gerät.',

    'aria.copy': 'In die Zwischenablage kopieren',
    'panel.toggle': 'ℹ Informationen',
  },

  it: {
    'nav.speech': 'Voce → Testo → Traduzione',
    'nav.detect': 'Rileva lingua',
    'nav.summary': 'Riassunto',
    'nav.translate': 'Traduzione',

    'lbl.langFrom': 'Lingua di origine (voce)',
    'lbl.langTo': 'Lingua di destinazione (traduzione)',
    'lbl.transcript': 'Trascrizione',
    'lbl.translation': 'Traduzione in tempo reale',
    'chk.realtime': 'Traduzione in tempo reale',
    'ph.transcript': 'Il testo apparirà qui mentre parli...',
    'ph.translation': 'La traduzione apparirà qui...',
    'btn.record': '▶ Registra',
    'btn.stop': '⏹ Ferma',
    'btn.clear': '🗑 Pulisci',

    'lbl.detectInput': 'Incolla o scrivi un testo per rilevarne la lingua',
    'ph.detectInput': 'Scrivi qui il testo da analizzare...',
    'btn.detect': '🔎 Rileva lingua',
    'lbl.detectResults': 'Risultati del rilevamento',
    'th.language': 'Lingua',
    'th.code': 'Codice',
    'th.confidence': 'Confidenza',
    'th.bar': 'Barra',
    'lang.unknown': 'Non lo so',

    'lbl.summaryType': 'Tipo di riassunto',
    'lbl.summaryLength': 'Lunghezza',
    'opt.tldr': "L'essenziale",
    'opt.keyPoints': 'Punti chiave',
    'opt.teaser': 'Anticipazione',
    'opt.headline': 'Titolo',
    'opt.short': 'Corto',
    'opt.medium': 'Medio',
    'opt.long': 'Lungo',
    'lbl.summaryInput': 'Testo da riassumere',
    'ph.summaryInput': 'Incolla qui il testo che vuoi riassumere...',
    'btn.summarize': '✨ Riassumi',
    'lbl.result': 'Risultato',

    'lbl.trFrom': 'Lingua di origine',
    'lbl.trTo': 'Lingua di destinazione',
    'lbl.trInput': 'Testo da tradurre',
    'ph.trInput': 'Scrivi o incolla qui il testo...',
    'btn.translate': '🌐 Traduci',

    'st.ready': 'Pronto.',
    'st.recording': '🔴 Registrazione...',
    'st.stopped': 'Fermato.',
    'st.error': '⚠ {msg}',
    'st.srUnsupported': '❌ Riconoscimento vocale non supportato.',
    'st.clearedSource': 'Trascrizione e traduzione cancellate dopo il cambio di lingua di origine.',
    'st.clearedTarget': 'Traduzione cancellata dopo il cambio di lingua di destinazione.',
    'st.detecting': '⏳ Rilevamento...',
    'st.detected': '✅ {n} lingua/e rilevata/e.',
    'st.summarizing': '⏳ Riassunto in corso...',
    'st.summarized': '✅ Fatto.',
    'st.startingTranslator': '⏳ Avvio del traduttore...',
    'st.translating': '⏳ Traduzione...',
    'st.translated': '✅ Fatto ({from} → {to})',
    'st.sameLang': '(stessa lingua)',
    'st.sameLangNoop': '(stessa lingua: niente da tradurre)',
    'st.translatorReady': '✅ Traduttore pronto ({from} → {to})',
    'st.downloading': '⬇ Download del modello...',
    'st.downloadingPct': '⬇ Download del modello... {pct}%',
    'st.needText': '⚠ Scrivi o incolla prima un testo.',
    'st.copyFailed': '⚠ Impossibile copiare negli appunti.',
    'st.restored': 'Sessione precedente ripristinata.',

    'err.noApi': '{api} non disponibile. Serve Chrome {min}+.',
    'err.pairUnsupported': 'La coppia {from}→{to} non è supportata dall\'API nativa.',
    'err.modelUnavailable': 'Il modello non è disponibile su questo dispositivo.',
    'err.noResults': 'Nessun risultato ottenuto.',
    'err.noConfidence': 'Nessuna lingua con confidenza misurabile.',

    'dv.title': 'INFO DISPOSITIVO',
    'dv.notChrome': '⚠ Non è Chrome',
    'dv.chromeOk': '✅ Chrome {v}',
    'dv.chromeOld': '❌ Chrome {v} (serve {min}+)',
    'dv.micGranted': '✅ Microfono: permesso concesso',
    'dv.micDenied': '❌ Microfono: permesso negato',
    'dv.micPrompt': '⚠ Microfono: permesso in attesa',
    'dv.micUnknown': '⚠ Microfono: stato sconosciuto',
    'dv.apiOk': '✅ {api}',
    'dv.apiNo': '❌ {api} non disponibile',
    'dv.uiLang': 'LINGUA INTERFACCIA',

    'info.title': 'SEZIONE ATTIVA',
    'info.speech.desc': 'Dettando, il testo appare trascritto e tradotto all\'istante. ⚠ Il riconoscimento vocale di Chrome invia l\'audio ai server di Google; la traduzione invece avviene sul tuo dispositivo.',
    'info.detect.desc': 'Analizza un testo ed elenca le lingue candidate con la loro confidenza. Tutto avviene sul tuo dispositivo.',
    'info.summary.desc': 'Riassume un testo con il tipo e la lunghezza che scegli. Il modello gira sul tuo dispositivo.',
    'info.translate.desc': 'Traduce un testo tra due lingue. Il modello gira sul tuo dispositivo.',

    'aria.copy': 'Copia negli appunti',
    'panel.toggle': 'ℹ Informazioni',
  },

  pt: {
    'nav.speech': 'Voz → Texto → Tradução',
    'nav.detect': 'Detetar idioma',
    'nav.summary': 'Resumidor',
    'nav.translate': 'Tradução',

    'lbl.langFrom': 'Idioma de origem (voz)',
    'lbl.langTo': 'Idioma de destino (tradução)',
    'lbl.transcript': 'Transcrição',
    'lbl.translation': 'Tradução em tempo real',
    'chk.realtime': 'Tradução em tempo real',
    'ph.transcript': 'O texto aparecerá aqui enquanto falas...',
    'ph.translation': 'A tradução aparecerá aqui...',
    'btn.record': '▶ Gravar',
    'btn.stop': '⏹ Parar',
    'btn.clear': '🗑 Limpar',

    'lbl.detectInput': 'Cola ou escreve um texto para detetar o idioma',
    'ph.detectInput': 'Escreve aqui o texto a analisar...',
    'btn.detect': '🔎 Detetar idioma',
    'lbl.detectResults': 'Resultados da deteção',
    'th.language': 'Idioma',
    'th.code': 'Código',
    'th.confidence': 'Confiança',
    'th.bar': 'Barra',
    'lang.unknown': 'Não sei',

    'lbl.summaryType': 'Tipo de resumo',
    'lbl.summaryLength': 'Comprimento',
    'opt.tldr': 'O essencial',
    'opt.keyPoints': 'Pontos-chave',
    'opt.teaser': 'Chamada',
    'opt.headline': 'Título',
    'opt.short': 'Curto',
    'opt.medium': 'Médio',
    'opt.long': 'Longo',
    'lbl.summaryInput': 'Texto a resumir',
    'ph.summaryInput': 'Cola aqui o texto que queres resumir...',
    'btn.summarize': '✨ Resumir',
    'lbl.result': 'Resultado',

    'lbl.trFrom': 'Idioma de origem',
    'lbl.trTo': 'Idioma de destino',
    'lbl.trInput': 'Texto a traduzir',
    'ph.trInput': 'Escreve ou cola aqui o texto...',
    'btn.translate': '🌐 Traduzir',

    'st.ready': 'Pronto.',
    'st.recording': '🔴 A gravar...',
    'st.stopped': 'Parado.',
    'st.error': '⚠ {msg}',
    'st.srUnsupported': '❌ Reconhecimento de voz não suportado.',
    'st.clearedSource': 'Transcrição e tradução limpas após mudar o idioma de origem.',
    'st.clearedTarget': 'Tradução limpa após mudar o idioma de destino.',
    'st.detecting': '⏳ A detetar...',
    'st.detected': '✅ {n} idioma(s) detetado(s).',
    'st.summarizing': '⏳ A resumir...',
    'st.summarized': '✅ Pronto.',
    'st.startingTranslator': '⏳ A iniciar o tradutor...',
    'st.translating': '⏳ A traduzir...',
    'st.translated': '✅ Pronto ({from} → {to})',
    'st.sameLang': '(mesmo idioma)',
    'st.sameLangNoop': '(mesmo idioma: nada a traduzir)',
    'st.translatorReady': '✅ Tradutor pronto ({from} → {to})',
    'st.downloading': '⬇ A descarregar o modelo...',
    'st.downloadingPct': '⬇ A descarregar o modelo... {pct}%',
    'st.needText': '⚠ Escreve ou cola primeiro algum texto.',
    'st.copyFailed': '⚠ Não foi possível copiar para a área de transferência.',
    'st.restored': 'Sessão anterior restaurada.',

    'err.noApi': '{api} não disponível. Precisas de Chrome {min}+.',
    'err.pairUnsupported': 'O par {from}→{to} não é suportado pela API nativa.',
    'err.modelUnavailable': 'O modelo não está disponível neste dispositivo.',
    'err.noResults': 'Não foram obtidos resultados.',
    'err.noConfidence': 'Nenhum idioma com confiança mensurável.',

    'dv.title': 'INFO DO DISPOSITIVO',
    'dv.notChrome': '⚠ Não é Chrome',
    'dv.chromeOk': '✅ Chrome {v}',
    'dv.chromeOld': '❌ Chrome {v} (precisas de {min}+)',
    'dv.micGranted': '✅ Microfone: permissão concedida',
    'dv.micDenied': '❌ Microfone: permissão negada',
    'dv.micPrompt': '⚠ Microfone: permissão pendente',
    'dv.micUnknown': '⚠ Microfone: estado desconhecido',
    'dv.apiOk': '✅ {api}',
    'dv.apiNo': '❌ {api} não disponível',
    'dv.uiLang': 'IDIOMA DA INTERFACE',

    'info.title': 'SECÇÃO ATIVA',
    'info.speech.desc': 'Dita e vê o texto transcrito e traduzido na hora. ⚠ O reconhecimento de voz do Chrome envia o áudio para os servidores da Google; a tradução essa sim corre no teu dispositivo.',
    'info.detect.desc': 'Analisa um texto e lista os idiomas candidatos com a sua confiança. Tudo corre no teu dispositivo.',
    'info.summary.desc': 'Resume um texto com o tipo e o comprimento que escolheres. O modelo corre no teu dispositivo.',
    'info.translate.desc': 'Traduz um texto entre dois idiomas. O modelo corre no teu dispositivo.',

    'aria.copy': 'Copiar para a área de transferência',
    'panel.toggle': 'ℹ Informação',
  },
};

let i18nLang = 'es';

// Devuelve la cadena traducida, sustituyendo {huecos} por sus valores.
// Si falta la clave en el idioma actual, cae a español y, en último caso,
// devuelve la propia clave (así un olvido se ve en pantalla en vez de dejar
// un hueco en blanco).
function t(key, vars) {
  const dict = I18N[i18nLang] || I18N.es;
  let s = dict[key] ?? I18N.es[key] ?? key;
  if (vars) {
    for (const k in vars) s = s.replaceAll('{' + k + '}', vars[k]);
  }
  return s;
}

// Escribe un texto traducible en un elemento y deja la clave anotada en el
// propio DOM, para que i18nApply pueda repintarlo al cambiar de idioma.
function i18nSet(el, key, vars) {
  if (!el) return;
  el.dataset.i18n = key;
  if (vars) el.dataset.i18nVars = JSON.stringify(vars);
  else delete el.dataset.i18nVars;
  el.textContent = t(key, vars);
}

function i18nVarsOf(el) {
  try {
    return el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : null;
  } catch {
    return null;
  }
}

function i18nApply(lang) {
  i18nLang = I18N[lang] ? lang : 'es';
  document.documentElement.lang = i18nLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n, i18nVarsOf(el));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const s = t(el.dataset.i18nTitle);
    el.title = s;
    el.setAttribute('aria-label', s);
  });

  stSet('uiLang', i18nLang);
}

function i18nGetLang() {
  return i18nLang;
}

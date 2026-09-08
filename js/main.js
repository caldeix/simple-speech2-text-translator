/* ══════════════════════════════════════════════════════════════════════════
   main.js — arranque
   Prefijo de variables de este fichero: app*
   Scope global compartido: no declares nombres que ya existan en otro fichero.

   Todos los scripts se cargan con `defer` desde el <head>: se ejecutan en
   orden y con el DOM ya construido, así que aquí solo hay que orquestar.
   ══════════════════════════════════════════════════════════════════════════ */

(function appInit() {
  // 1. Idioma de la interfaz antes que nada, para que ningún texto parpadee.
  i18nApply(stGet('uiLang', 'es'));

  // 2. Secciones.
  spInit();
  dtInit();
  smInit();
  trInit();
  dvInit();

  // 3. Botón de copiar en los textareas de SALIDA (en los de entrada no aporta).
  uiAttachCopy(document.getElementById('transcript'), document.getElementById('speechStatus'));
  uiAttachCopy(document.getElementById('translation'), document.getElementById('translateStatus'));
  uiAttachCopy(document.getElementById('summaryOutput'), document.getElementById('summaryStatus'));
  uiAttachCopy(document.getElementById('trOutput'), document.getElementById('trStatus'));

  // 4. Navegación y panel de sección activa.
  uiInitNav();
  uiShowSection('sec-speech');

  // 5. Permiso de micrófono: una sola vez al entrar.
  dvRequestMicOnce();
})();

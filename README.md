<div align="center">

# 🎙 Speech → Transcribe → Translate

**Dicta, transcribe y traduce en tiempo real — sin servidores, sin registro, sin claves de API.**

![Version](https://img.shields.io/badge/version-1.1.0-44AAFF)
![HTML5](https://img.shields.io/badge/HTML5-vanilla-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript&logoColor=black)
![Chrome](https://img.shields.io/badge/Chrome-138%2B-4285F4?logo=googlechrome&logoColor=white)
![Dependencies](https://img.shields.io/badge/dependencies-0-3FB950)
![License](https://img.shields.io/github/license/caldeix/simple-speech2-text-translator)
![Last Commit](https://img.shields.io/github/last-commit/caldeix/simple-speech2-text-translator)

<br/>

> Sin build, sin dependencias. Los modelos de IA corren dentro de tu navegador.

**[→ Abrir la aplicación](https://caldeix.github.io/simple-speech2-text-translator/)**

</div>

---

Cuatro herramientas de lenguaje sobre las **APIs de IA integradas en Chrome**: dictado con transcripción y traducción en vivo, detección de idioma, resumidor y traductor de texto. Interfaz en 6 idiomas.

**Requisitos:** Chrome 138+ (antes no existen `Translator`, `LanguageDetector` ni `Summarizer`), permiso de micrófono para la sección de voz, e internet la primera vez para que Chrome descargue los modelos. Después funciona offline. El panel *DEVICE INFO* muestra qué está disponible.

> El reconocimiento de voz (`webkitSpeechRecognition`) **no es local**: Chrome envía el audio a sus servidores. Las otras tres APIs sí corren en el dispositivo.

---

## Estructura

```
index.html          ← marcado, con el español escrito y las claves de i18n
favicon.svg
css/styles.css      ← variables → base → componentes → paneles → responsive
js/
  store.js          ← localStorage (preferencias y sesión)
  languages.js      ← lista única de idiomas
  i18n.js           ← diccionario de 6 idiomas y cambio de idioma
  ai.js             ← capa común sobre las APIs de Chrome
  ui.js             ← estados, botón de copiar, navegación, paneles
  speech.js         ← sección 1
  detect.js         ← sección 2
  summarize.js      ← sección 3
  translate.js      ← sección 4
  device-info.js    ← panel de entorno y permiso de micrófono
  main.js           ← arranque
```

### Cómo se cargan

Todos los scripts van en el `<head>` como **scripts clásicos con `defer`**:

```html
<script defer src="js/store.js"></script>
<script defer src="js/languages.js"></script>
...
```

`defer` da tres cosas a la vez: se ejecutan **en el orden declarado**, con el **DOM ya construido**, y **funcionan abriendo el fichero con doble clic** (los ES modules se bloquearían por CORS en `file://`).

La contrapartida es que **comparten un único scope global**. Dos `const` con el mismo nombre en ficheros distintos tiran la página entera con un `SyntaxError`, no solo su fichero. Por eso cada fichero **prefija sus nombres con dos letras**: `sp*` en speech.js, `dt*` en detect.js, `sm*` en summarize.js, `tr*` en translate.js, `dv*` en device-info.js, `ui*`, `st*`, `lg*`, `i18n*`.

`main.js` orquesta el arranque en cinco pasos: idioma de la interfaz → `init()` de cada sección → botones de copiar → navegación → permiso de micrófono.

---

## Módulo `AI`

Las tres APIs de Chrome comparten la misma coreografía: `availability()` → `create()` → esperar a `.ready` → usar.

```js
AI.getTranslator(from, to, onProgress)  // → Promise<Translator>
AI.getSummarizer(opts, onProgress)      // → Promise<Summarizer>
AI.getDetector(onProgress)              // → Promise<LanguageDetector>
AI.sequencer()                          // → { next, isCurrent, invalidate }
```

**`availability()` devuelve cuatro valores:** `available` (listo), `downloadable` (existe pero no está en disco — el caso normal la primera vez), `downloading` (bajando ahora) y `unavailable` (no existe aquí). Los dos intermedios activan el aviso de descarga, y siempre se espera a `.ready` porque `create()` puede devolver el objeto antes de terminar.

**Progreso de descarga:** se pasa `monitor` a `create()` y se escucha `downloadprogress`. El callback recibe `null` al empezar (aún sin dato) y luego 0–100. El `monitor` se engancha **solo si `availability()` dijo que falta descargar**: con el modelo ya en disco Chrome dispara igualmente un `downloadprogress` con valor 1, y anunciar "descargando 100%" en cada uso sería desinformar.

**Se cachea la promesa, no el objeto.** Si dos partes de la página piden `es→en` a la vez comparten un único `create()`; un `p.catch(() => map.delete(key))` evita que un fallo se quede cacheado. Efecto: el segundo uso del mismo par es instantáneo, y la caché es compartida entre secciones.

**`sequencer()`** es un contador de turnos:

```js
const token = seq.next();
const res = await algoLento();
if (!seq.isCurrent(token)) return;   // ya se pidió otra cosa → descartar
```

Existe porque una operación asíncrona no se puede cancelar: una vez lanzada va a volver, y lo único posible es comprobar al volver si su resultado sigue siendo el vigente.

---

## Internacionalización

El HTML lleva el español escrito **y** la clave del diccionario. Si el JS falla, la página sigue leyéndose en español:

```html
<label data-i18n="lbl.transcript">Transcripción</label>
<textarea data-i18n-ph="ph.transcript" placeholder="..."></textarea>
<button data-i18n-title="aria.copy">📋</button>
```

`i18nApply(lang)` recorre esos tres atributos y reescribe texto, `placeholder` y `title`/`aria-label`, actualiza `<html lang>` y guarda la elección.

Los mensajes **dinámicos** (estados, errores, progreso) se escriben con `i18nSet(el, clave, vars)`, que deja la clave y sus variables anotadas en el propio elemento:

```js
i18nSet(el, 'st.translated', { from: 'es', to: 'ja' });
// data-i18n="st.translated" data-i18n-vars='{"from":"es","to":"ja"}'
```

Así `i18nApply` los repinta solos al cambiar de idioma, sin que ningún módulo tenga que acordarse de refrescar sus mensajes. Los errores del módulo `AI` viajan con su clave (`err.i18n` + `err.vars`), de modo que también se traducen.

Los `<option>` de idiomas **no** se traducen: "Español / English / 中文" van en su propio idioma, que es la convención en cualquier selector de idiomas.

---

## Flujo 1 — Voz → texto → traducción

La única sección con estado que evoluciona en el tiempo.

```js
spRecognition       // instancia ACTIVA de SpeechRecognition (o null)
spIsRecording       // intención del usuario, no estado real del micro
spBaseText          // texto consolidado de sesiones anteriores
spSessionFinal      // frases cerradas de la sesión actual (se recalcula)
spSessionInterim    // provisional de la sesión actual (se recalcula)
spSessionSent       // nº de frases cerradas ya enviadas a traducir
spFinalTranslation  // traducción confirmada
spTranslator        // instancia lista (o null si aún carga)
spTranslatorReady   // promesa: resuelve cuando el modelo está listo
spInterimSeq        // sequencer de provisionales
spManualSeq         // sequencer del texto escrito a mano
spFinalQueue        // cola de frases cerradas
spPendingFinals     // frases cerradas traduciéndose ahora
```

Separar `spIsRecording` (intención) de `spRecognition` (objeto real) importa: el reconocedor puede estar parado mientras el usuario sigue queriendo grabar, justo entre un corte y su reinicio automático.

El texto vive en **dos mitades**: `spBaseText`, que solo crece, y las dos variables de sesión, que se **recalculan enteras** en cada evento. Lo que se ve en pantalla es la suma de las tres (`spVisibleText()`).

### Arranque

```
clic ▶ Grabar → spStart()
  ├─ spInitTranslator()   SIN await: descargar el modelo puede tardar y el
  │                       micrófono no debe esperar
  ├─ spBuild()            crea el SpeechRecognition y engancha handlers
  ├─ spSetLocked(true)    bloquea los selectores y el checkbox
  └─ r.start()
```

Las frases dictadas mientras el modelo carga **no se pierden**: la cola de traducción hace `await spTranslatorReady` antes de traducir, así que se procesan en cuanto el traductor está disponible y en el orden correcto.

`spInitTranslator()` recorta `es-ES` → `es`: el reconocedor usa BCP-47 completo y el traductor solo el código de idioma.

### Ciclo de vida del reconocedor

Tres peculiaridades de `SpeechRecognition` en Chrome condicionan el diseño:

- **se apaga solo** cada ~60 s aunque sigas hablando;
- **`stop()` no es inmediato**: la parada se completa después y entonces dispara `onend`;
- **`onerror` no implica parada**: `onend` llega igualmente a continuación.

Por lo primero hace falta auto-reinicio; por lo otro, acotarlo:

```js
r.onend = () => {
  if (spIsRecording && spRecognition === r) {   // solo si sigue siendo el activo
    try { r.start(); } catch {}
  }
};
```

`spRecognition === r` impide que una instancia ya sustituida se resucite y acabe escuchando en paralelo con la nueva. `spStop()` refuerza lo mismo poniendo `onend`, `onresult`, `onerror` y `onstart` a `null` **antes** de llamar a `stop()`.

Y hay errores tras los que reintentar no sirve de nada:

```js
const SP_FATAL_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'];
```

Ante uno de ellos se llama a `spStop()`. Los demás (`no-speech`, `network`, `aborted`) se reintentan por el camino normal.

### `onresult`: por qué se recalcula en vez de acumular

Cada resultado es de uno de dos tipos: **`isFinal === true`** es una frase cerrada que ya no cambia, y **`isFinal === false`** es provisional, que Chrome va corrigiendo mientras hablas.

Lo importante es cómo se juntan. `event.results` es **acumulativo dentro de una sesión**, y Chrome puede **reenviar resultados ya vistos** — en Android lo hace constantemente, con `resultIndex` a 0. Acumulando con `+=` desde `resultIndex`, cada reenvío sumaría otra vez la misma frase y una sola frase dictada aparecería repetida en pantalla.

Por eso el handler **ignora `resultIndex`** y reconstruye el texto de la sesión recorriendo `event.results` completo:

```js
let fin = '', interim = '', nFinal = 0;
for (let i = 0; i < event.results.length; i++) {
  const txt = event.results[i][0].transcript;
  if (event.results[i].isFinal) { fin += txt.trim() + ' '; nFinal = i + 1; }
  else interim += txt;
}
spSessionFinal = fin;
spSessionInterim = interim;
```

Es idempotente: por muchas veces que llegue lo mismo, el resultado no cambia. Y para traducir sin duplicar se lleva la **cuenta** de frases ya enviadas (`spSessionSent`), no el texto.

### Consolidar al terminar la sesión

Cuando una sesión termina —el corte de ~1 min, o una pausa larga— Chrome **descarta el provisional que no llegó a cerrarse**. Sin hacer nada, el usuario ve desaparecer de golpe todo lo que estaba a medias en cuanto la sesión nueva repinta el textarea.

`spCommitSession()`, llamada desde `onend` y desde `spStop()`, vuelca las frases cerradas **y el provisional pendiente** a `spBaseText`, y manda ese provisional a la cola de traducción porque nadie más lo va a hacer. El precio es que un corte a mitad de palabra queda tal cual en la transcripción, que es preferible a un agujero.

### Las dos rutas de traducción

```
frase cerrada  →  COLA (spFinalQueue)        se acumula, el orden importa
provisional    →  ÚLTIMO GANA (spInterimSeq)  se sustituye, solo vale lo reciente
```

**Frases cerradas.** Cadena de promesas donde cada frase espera a la anterior:

```js
spFinalQueue = spFinalQueue.then(async () => {
  const translator = await spTranslatorReady;
  if (!translator) return;
  spFinalTranslation += (await translator.translate(phrase)) + ' ';
  spRender();
}).catch(...).then(() => { spPendingFinals--; });
```

Sin la cola, una frase corta pedida después puede volver antes que una larga pedida antes y colocarse en el sitio equivocado. El `.catch()` va dentro de la cadena: un fallo se muestra en el status sin romper la cola ni tocar el texto ya traducido.

**Provisionales.** Chrome dispara `onresult` varias veces por segundo, así que hay tres frenos antes de traducir: mínimo 3 palabras, al menos 2 palabras nuevas desde la última traducción, y debounce de 200 ms. Al volver se comprueba que el token siga vigente y que `spPendingFinals === 0` (si hay frases cerradas en proceso, pintar el provisional daría un parpadeo con texto incompleto). Se pinta como `spFinalTranslation + translated`, **sin acumular**: es una cola temporal que se sobrescribe.

### Controles

| Acción | Qué hace |
|---|---|
| **⏹ Detener** | Desengancha handlers, para, cancela el timer, invalida provisionales, desbloquea los controles |
| **🗑 Limpiar** | Vacía textareas, estado y `localStorage` |
| **Idioma origen** | Limpia transcripción y traducción: lo que se dicte ahora es otro idioma |
| **Idioma destino** | Limpia solo la traducción; la transcripción sigue siendo válida en su idioma |
| **Checkbox** | Oculta el bloque **conservando** el texto |
| **Editar la transcripción** | Con la grabación parada, el texto del usuario pasa a ser la nueva base y se retraduce |

Los dos selectores y el checkbox quedan **deshabilitados mientras se graba**: son decisiones que se toman antes de hablar.

### Traducir el texto escrito a mano

La regla es "lo que haya en la caja se traduce", venga de la voz o del teclado. Al editar la transcripción con la grabación parada, 600 ms después de dejar de teclear (`SP_MANUAL_DELAY`) se traduce el texto **entero** y se sustituye la traducción.

Entero, y no solo lo editado, porque una palabra cambiada en medio invalida la frase que la contiene: la traducción construida frase a frase ya no sirve. Lleva su propio `spManualSeq`, así que si sigues escribiendo el resultado anterior se descarta en vez de pisar el nuevo, y si nunca se pulsó Grabar el traductor se crea en ese momento.

---

## Flujo 2 — Detección de idioma

```
clic 🔎 → token = dtSeq.next()
       → await AI.getDetector()
       → await detector.detect(text)
       → normaliza → filtra confianza > 0 → ordena desc
       → una fila por idioma, la primera destacada
```

La API ha cambiado de nombres entre versiones de Chrome, así que se aceptan las tres variantes:

```js
lang: r.detectedLanguage ?? r.language ?? r.languageCode ?? '?',
confidence: typeof r.confidence === 'number' ? r.confidence : (r.score ?? 0)
```

Los nombres legibles salen de `Intl.DisplayNames` construido con el idioma actual de la interfaz y cacheado por idioma; el código `und` (*undetermined*) se muestra como "No lo sé". Las filas se montan con `createElement` + `textContent`, no con `innerHTML`.

---

## Flujo 3 — Resumidor

```
clic ✨ → token = smSeq.next()
       → await AI.getSummarizer({ type, length, format: 'plain-text', sharedContext })
       → await summarizer.summarize(text)
```

`type` (`tldr`, `key-points`, `teaser`, `headline`) y `length` (`short`, `medium`, `long`) son parámetros del modelo, elegibles desde la interfaz. `sharedContext` es una instrucción en lenguaje natural — *"Respond in the same language as the input text. Do not translate."* — sin la cual el modelo tiende a responder siempre en inglés.

`format` está **fijo a `plain-text`** y no se ofrece en la interfaz. La API acepta también `markdown`, pero es una indicación para el modelo y no un post-procesado: con `tldr`, `teaser` o `headline` no hay nada que marcar y el resultado sale idéntico, y además el resumen se muestra en un `<textarea>`, que no renderiza markdown. Un selector incapaz de cambiar nada visible es peor que no tenerlo.

La caché usa `JSON.stringify(opts)` como clave: cada combinación tiene su instancia. `availability()` recibe solo `{ type, format, length }`, porque `sharedContext` no forma parte de la identidad del modelo.

---

## Flujo 4 — Traducción de texto

```
clic 🌐 → mismo idioma? → devuelve el texto tal cual
       → token = trSeq.next()
       → await AI.getTranslator(from, to)   instantáneo si está en caché
       → await translator.translate(text)
```

Se comprueba el token **dos veces**, una por cada punto de espera: el usuario puede volver a pulsar durante cualquiera de los dos.

---

## Navegación, paneles y permiso de micrófono

**Navegación:** las cuatro secciones están siempre en el DOM y solo una lleva la clase `.visible`. Sin router ni hash: `uiShowSection(id)` la mueve, marca el botón con `.nav-active` y actualiza el panel de sección activa. El vínculo botón↔sección es el atributo `data-target`.

**Paneles:** *DEVICE INFO* (versión de Chrome, estado del micrófono, disponibilidad de las tres APIs, idioma de la interfaz) y *SECCIÓN ACTIVA* (qué hace la sección y dónde se procesa). En escritorio flotan abajo a la izquierda; por debajo de 1024px dejan de ser fijos —taparían el contenido— y pasan a un bloque plegable al final de la página.

**Botón de copiar:** `uiAttachCopy(textarea)` envuelve el textarea en un contenedor `position: relative` y le superpone un botón en la esquina inferior derecha, que al pulsar cambia a `✓` durante 2 s. Solo en los textareas de **salida**; en los de entrada no aporta nada. Esa esquina está libre porque los textareas llevan `resize: none` y su altura la marca la pantalla.

**Permiso de micrófono:** se pide **una sola vez al entrar**, y solo si `permissions.query` devuelve `prompt` — si ya está concedido o denegado no se molesta al usuario. Los tracks se sueltan en cuanto se concede, para no dejar el indicador de micrófono encendido en la pestaña. El panel repinta el estado desde tres fuentes: `perm.onchange`, el resultado de `getUserMedia` y el `onstart` del reconocedor, porque el evento de la Permissions API no siempre llega.

---

## Los dos patrones de concurrencia

| | **Cola** | **Último gana** |
|---|---|---|
| Cuándo | Importa el orden y no se puede perder nada | Solo importa el resultado más reciente |
| Cómo | `q = q.then(...)` | `AI.sequencer()` + `if (!isCurrent) return` |
| Aquí | Traducción de frases cerradas | Provisionales, clics de botón, idioma de interfaz |

Regla práctica: **¿el resultado se acumula o se sustituye?** Si se acumula (`+=`), cola. Si se sustituye (`=`), último gana.

---

## Desarrollo local

Doble clic en `index.html` funciona, pero Chrome **no persiste el permiso de micrófono** en `file://` (cada documento local es un origen opaco), así que volverá a preguntar en cada carga. Servido por http, el permiso se concede una vez y para siempre:

```bash
npx serve .
```

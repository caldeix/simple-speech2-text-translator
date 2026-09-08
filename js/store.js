/* ══════════════════════════════════════════════════════════════════════════
   store.js — preferencias y sesión en localStorage
   Prefijo de variables de este fichero: st*
   Scope global compartido: no declares nombres que ya existan en otro fichero.
   ══════════════════════════════════════════════════════════════════════════ */

const ST_PREFIX = 'sptr.';

// localStorage puede lanzar (modo incógnito, cuota llena, permisos): nunca
// debe tumbar la app, así que todo va envuelto en try/catch.
function stGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(ST_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function stSet(key, value) {
  try {
    localStorage.setItem(ST_PREFIX + key, JSON.stringify(value));
  } catch {}
}

function stRemove(key) {
  try {
    localStorage.removeItem(ST_PREFIX + key);
  } catch {}
}

// Configuración y utilidades de movimiento compartidas.
// Las duraciones y curvas de CSS viven en index.css (@theme: --ease-*); aquí
// están las equivalentes para las animaciones que se calculan en JavaScript.

export const MOTION = {
  countDuration: 1600, // ms que tarda un contador en llegar a su valor
  countStagger: 140, // ms entre contadores de un mismo bloque
}

// Luz de las tarjetas interactivas: el espectro de la marca (cian → azul → violeta).
export const CARD_TINTS = ['#5ef2ff', '#4c74ff', '#a07bff']

export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

const matches = (query) => typeof window !== 'undefined' && window.matchMedia(query).matches

export const prefersReducedMotion = () => matches('(prefers-reduced-motion: reduce)')

// Un único IntersectionObserver para todo lo que se activa una sola vez al
// entrar en pantalla (reveal, contadores…). Dispara un poco antes de que el
// elemento llegue al centro para que nada aparezca tarde.
const callbacks = new WeakMap()
let observer = null

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const callback = callbacks.get(entry.target)
        observer.unobserve(entry.target)
        callbacks.delete(entry.target)
        callback?.(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  )
  return observer
}

// Llama a `callback` la primera vez que `el` entra en pantalla. Devuelve una
// función para cancelar la observación (limpieza de efectos).
export function observeOnce(el, callback) {
  if (!('IntersectionObserver' in window)) {
    callback(el)
    return () => {}
  }
  callbacks.set(el, callback)
  getObserver().observe(el)
  return () => {
    callbacks.delete(el)
    observer?.unobserve(el)
  }
}

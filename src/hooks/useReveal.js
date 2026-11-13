import { useEffect } from 'react'
import { observeOnce } from '../lib/motion'

// Todos los elementos con [data-reveal] reciben .is-visible la primera vez que
// entran en pantalla y dejan de observarse (la animación no se repite al
// subir y bajar). Si el JS falla, el CSS los muestra igualmente a los 2.5 s.
export function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]:not(.is-visible)')
    const stops = [...elements].map((el) => observeOnce(el, (target) => target.classList.add('is-visible')))
    return () => stops.forEach((stop) => stop())
  }, [])
}

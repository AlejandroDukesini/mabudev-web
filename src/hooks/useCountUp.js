import { useEffect, useRef, useState } from 'react'
import { easeOutExpo, observeOnce, prefersReducedMotion } from '../lib/motion'
import { isLiteMode } from '../lib/device'

// Anima un número hasta `target`. El primer render (y el HTML prerenderizado)
// ya muestra el valor final; en el navegador vuelve a 0 y cuenta hasta él la
// primera vez que `ref` entra en pantalla. Después, cada cambio de `target`
// anima desde el valor actual. Con movimiento reducido salta al valor final.
export function useCountUp(target, ref, duration = 1400) {
  const [value, setValue] = useState(target)
  const [armed, setArmed] = useState(false)
  const current = useRef(target)
  const started = useRef(false)
  const waiting = useRef(false)

  // Antes de verse: se pone a 0 y se espera a que el bloque entre en pantalla.
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || isLiteMode()) return
    waiting.current = true
    current.current = 0
    setValue(0)
    const stop = observeOnce(el, () => {
      waiting.current = false
      started.current = true
      setArmed(true)
    })
    return () => {
      waiting.current = false
      stop()
    }
  }, [ref])

  useEffect(() => {
    if (!started.current) {
      // Sin animación de entrada (movimiento reducido, modo ligero): valor directo.
      // Si aún espera a verse, se queda en 0 y contará hasta el dato vigente.
      if (!waiting.current) {
        current.current = target
        setValue(target)
      }
      return
    }
    const from = current.current
    const reduced = prefersReducedMotion()
    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const progress = reduced ? 1 : Math.min((now - start) / duration, 1)
      current.current = from + (target - from) * easeOutExpo(progress)
      setValue(progress === 1 ? target : current.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, armed])

  return value
}

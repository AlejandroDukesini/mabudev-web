import { useEffect, useRef } from 'react'
import { MOTION, easeOutExpo, observeOnce, prefersReducedMotion } from '../../lib/motion'
import { isLiteMode } from '../../lib/device'

// Números de un texto: «4 000» (miles con espacio) o «299.79» / «821» (punto
// decimal). Así se respeta el formato con el que están escritos los datos.
const NUMBER = /\d{1,3}(?:[  ]\d{3})+|\d+(?:\.\d+)?/g

function parse(text) {
  const parts = []
  let last = 0
  for (const match of text.matchAll(NUMBER)) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const raw = match[0]
    const group = raw.match(/[  ]/)?.[0] ?? ''
    const plain = raw.replace(/[  ]/g, '')
    parts.push({ raw, value: Number(plain), decimals: plain.split('.')[1]?.length ?? 0, group })
    last = match.index + raw.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function format(value, decimals, group) {
  const fixed = value.toFixed(decimals)
  if (!group) return fixed
  const [int, dec] = fixed.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  return dec ? `${grouped}.${dec}` : grouped
}

// Texto cuyas cifras cuentan desde 0 hasta su valor real la primera vez que
// entra en pantalla. El HTML prerenderizado y los lectores de pantalla siempre
// reciben el texto final; la animación escribe directamente en el DOM (sin
// re-renderizar React en cada frame). Cada cifra reserva el ancho de su valor
// final, así el texto no salta mientras cuenta.
export function CountUpText({ text, className = '' }) {
  const ref = useRef(null)
  const parts = parse(text)

  useEffect(() => {
    const root = ref.current
    const slots = [...root.querySelectorAll('[data-count]')]
    if (!slots.length || prefersReducedMotion() || isLiteMode()) return

    const data = slots.map((slot) => ({
      slot,
      value: Number(slot.dataset.count),
      decimals: Number(slot.dataset.decimals),
      group: slot.dataset.group,
      raw: slot.textContent,
    }))
    data.forEach((item) => (item.slot.textContent = format(0, item.decimals, item.group)))

    let frame = 0
    const stop = observeOnce(root, () => {
      const start = performance.now()
      const tick = (now) => {
        let running = false
        data.forEach((item, index) => {
          const t = Math.max(0, (now - start - index * MOTION.countStagger) / MOTION.countDuration)
          if (t < 1) running = true
          // El último frame escribe el texto original: termina exactamente en el dato.
          item.slot.textContent = t >= 1 ? item.raw : format(item.value * easeOutExpo(t), item.decimals, item.group)
        })
        frame = running ? requestAnimationFrame(tick) : 0
      }
      frame = requestAnimationFrame(tick)
    })

    return () => {
      stop()
      cancelAnimationFrame(frame)
      data.forEach((item) => (item.slot.textContent = item.raw))
    }
  }, [text])

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((part, index) =>
          typeof part === 'string' ? (
            part
          ) : (
            <span key={index} className="count-slot">
              <span className="invisible">{part.raw}</span>
              <span data-count={part.value} data-decimals={part.decimals} data-group={part.group}>
                {part.raw}
              </span>
            </span>
          ),
        )}
      </span>
    </span>
  )
}

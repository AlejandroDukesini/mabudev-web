// Divide un texto en caracteres o palabras para animarlos de forma escalonada
// (.split-unit, con --i como índice). Las piezas se ocultan a los lectores de
// pantalla: el elemento que lo contiene debe llevar el texto completo en
// aria-label. El texto plano (HTML/SEO) sigue siendo el original.
export function SplitText({ text, by = 'char', offset = 0, className = '' }) {
  const units = by === 'char' ? [...text] : text.split(' ')

  return (
    <span aria-hidden="true" className={className}>
      {units.map((unit, index) => (
        <span key={index}>
          <span className="split-unit" style={{ '--i': index + offset }}>
            {unit}
          </span>
          {by === 'word' && index < units.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  )
}

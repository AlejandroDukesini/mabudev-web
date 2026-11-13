import { trackPointer } from '../../lib/device'

// Tarjeta interactiva de Servicios y Precios. El contenedor exterior recibe
// la posición del cursor (--mx/--my) y la entrada por scroll; dentro hay dos
// capas hermanas:
//   · .glow-card-aura → luz difuminada del color `tint` DETRÁS de la tarjeta,
//     que sigue ligeramente al cursor y aparece/desaparece con suavidad.
//   · .glow-card-body → la tarjeta (con .spotlight: luz y borde bajo el cursor),
//     que crece un poco y proyecta una sombra teñida.
// Los elementos con .glow-shift se desplazan unos píxeles en el hover.
// Todo se resuelve en CSS (index.css · «Tarjetas interactivas»): sin estado de React.
export function GlowCard({ as: Tag = 'li', tint = '#4c74ff', className = '', bodyClassName = '', style, children, ...props }) {
  return (
    <Tag
      data-reveal
      onPointerMove={trackPointer}
      className={`glow-card ${className}`}
      style={{ '--tint': tint, ...style }}
      {...props}
    >
      <span aria-hidden="true" className="glow-card-aura" />
      <div className={`glow-card-body card spotlight ${bodyClassName}`}>{children}</div>
    </Tag>
  )
}

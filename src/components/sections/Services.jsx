import { Bot, Boxes, Check, Gauge, LayoutTemplate, ShoppingBag, WifiOff } from 'lucide-react'
import { FEATURED_PROJECTS } from '../../data/projects'
import { SERVICES } from '../../data/services'
import { CARD_TINTS } from '../../lib/motion'
import { GlowCard } from '../ui/GlowCard'
import { SectionHeading } from '../ui/SectionHeading'

const ICONS = { layout: LayoutTemplate, shop: ShoppingBag, system: Boxes, offline: WifiOff, ai: Bot, gauge: Gauge }
const PROJECT_TITLES = Object.fromEntries(FEATURED_PROJECTS.map((project) => [project.id, project.title]))

export function Services() {
  return (
    <section id="servicios" aria-labelledby="services-title" className="py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          id="services-title"
          index="03"
          eyebrow="Qué puedo hacer por ti"
          title={
            <>
              Desde la primera pantalla hasta la <span className="text-display text-chrome">base de datos.</span>
            </>
          }
          description="Cada servicio está respaldado por un proyecto publicado que puedes revisar. Nada de capacidades en el aire."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => {
            const Icon = ICONS[service.icon]
            return (
              <GlowCard
                key={service.title}
                tint={CARD_TINTS[index % CARD_TINTS.length]}
                className="group"
                bodyClassName="p-6 sm:p-7"
                style={{ '--delay': `${(index % 3) * 90}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="glow-card-icon grid size-11 place-items-center rounded-xl border border-line bg-gradient-to-br from-accent/15 to-violet/10 text-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[0.65rem] text-subtle transition-colors duration-500 group-hover:text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="glow-shift mt-6 text-lg font-semibold">{service.title}</h3>
                <p className="glow-shift mt-2 text-sm leading-relaxed text-muted" style={{ '--s': 1 }}>
                  {service.description}
                </p>

                <ul className="glow-shift mt-5 space-y-2" style={{ '--s': 2 }}>
                  {service.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm text-fg/85">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <p className="font-mono text-[0.65rem] tracking-wider text-subtle uppercase">Evidencia</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {service.evidence.map((id) => (
                      <li key={id}>
                        <a
                          href={`#proyecto-${id}`}
                          className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs text-muted transition-[color,border-color,translate] duration-300 hover:-translate-y-px hover:border-accent/50 hover:text-accent"
                        >
                          {PROJECT_TITLES[id]}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlowCard>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

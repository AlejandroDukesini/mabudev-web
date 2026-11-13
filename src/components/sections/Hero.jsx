import { useEffect, useRef } from 'react'
import { SITE, STACK } from '../../data/site'
import { usePointerField } from '../../hooks/usePointerField'
import { ArrowIcon, Button } from '../ui/Button'
import { LiquidMetal } from '../ui/LiquidMetal'
import { SplitText } from '../ui/SplitText'

const CREDENTIALS = [
  { title: 'Full stack', detail: 'React · Kotlin · Python' },
  { title: 'Ing. de Sistemas', detail: 'Universidad del Quindío' },
  { title: 'Métricas abiertas', detail: 'Reproducibles en GitHub' },
]

const d = (seconds) => ({ '--d': `${seconds}s` })
const depth = (px) => ({ '--depth': px })

const TITLE = 'Software que se mide, no que se promete.'

// Capas de profundidad del hero (px que se desplaza cada una con el cursor;
// el signo indica si va con el cursor o en contra):
//   fondo  → halos de luz (34, -22, 48) y rejilla en perspectiva (fija)
//   medio  → metal líquido (-16), elementos flotantes (±18…44)
//   frente → título (-10, con inclinación 3D) y credenciales (14)
// Textos, botones y párrafo no se mueven: deben poder leerse y pulsarse.

export function Hero() {
  const sectionRef = useRef(null)
  usePointerField(sectionRef)
  usePauseWhenHidden(sectionRef)

  return (
    <section
      id="inicio"
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="hero relative isolate flex min-h-[100svh] flex-col overflow-clip pt-24 sm:pt-28"
    >
      <HeroBackdrop />

      {/* Elemento protagonista: metal líquido con anillos de medición. */}
      <div
        aria-hidden="true"
        className="intro-orb pointer-events-none absolute top-16 -right-[26vw] -z-10 aspect-square w-[88vw] opacity-70 sm:top-10 sm:-right-[24vw] sm:w-[86vw] sm:opacity-100 lg:top-1/2 lg:-right-[5vw] lg:w-[min(52vw,50rem)] lg:-translate-y-[60%]"
      >
        <div className="hero-exit-orb absolute inset-0">
          <div className="depth absolute inset-0" style={depth(-16)}>
            <HeroRings />
            <LiquidMetal className="inset-[9%]" />
          </div>
        </div>
      </div>

      {/* Después del metal en el DOM: los flotantes quedan por delante (primer plano). */}
      <HeroFloaters />

      <div className="hero-exit container-page relative flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-6">
          <p className="intro-kicker inline-flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.18em] text-muted uppercase sm:text-xs">
            <span className="animate-pulse-dot size-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span>
              <span className="text-fg">{SITE.brand}</span> — {SITE.role}
            </span>
          </p>
          <p className="intro-kicker hidden font-mono text-xs tracking-[0.18em] text-subtle uppercase md:block">
            {SITE.name} · {SITE.location}
          </p>
        </div>

        {/* Entrada por caracteres («Software») y por palabras (segunda línea). */}
        <h1
          id="hero-title"
          aria-label={TITLE}
          className="hero-title hero-tilt mt-10 sm:mt-14 lg:mt-16"
          style={{ textShadow: '0 2px 40px rgb(4 5 10 / 0.55)', ...depth(-10) }}
        >
          <span className="intro-line is-split block overflow-hidden pb-[0.06em]" style={d(0.3)}>
            <SplitText text="Software" />
          </span>
          <span className="intro-line is-split block overflow-hidden pb-[0.12em] sm:pl-[0.9em]" style={{ ...d(0.62), '--step': '0.09s' }}>
            <SplitText text="que se" by="word" />{' '}
            <span aria-hidden="true" className="split-unit text-display text-chrome" style={{ '--i': 2 }}>
              mide,
            </span>
          </span>
          <span className="intro-line mt-3 block overflow-hidden text-[max(1.05rem,0.24em)] leading-tight font-medium tracking-[-0.02em] text-muted sm:mt-1 sm:pl-[3.9em] sm:text-[0.2em]">
            <span style={d(0.95)}>
              <span aria-hidden="true">no que se </span>
              <span aria-hidden="true" className="relative inline-block">
                promete.
                <span aria-hidden="true" className="hero-strike intro-strike" />
              </span>
            </span>
          </span>
        </h1>

        <div className="mt-auto grid gap-10 pt-12 pb-10 lg:grid-cols-12 lg:items-end lg:gap-8 lg:pb-14">
          <div className="lg:col-span-6 xl:col-span-5">
            <p className="intro-fade max-w-xl text-lg leading-relaxed text-muted sm:text-xl" style={d(1)}>
              Diseño y desarrollo landing pages, tiendas en línea y sistemas a medida para negocios que necesitan algo
              más que una web bonita: <span className="text-fg">rápida, segura y fácil de mantener</span> — con
              métricas reales que lo demuestran.
            </p>
            <div className="intro-fade mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={d(1.12)}>
              <Button href="#proyectos" magnetic>
                Explorar proyectos <ArrowIcon />
              </Button>
              <Button href="#contacto" variant="secondary">
                Cuéntame tu proyecto
              </Button>
            </div>
          </div>

          <div className="depth hidden lg:col-span-4 lg:col-start-9 lg:block" style={depth(14)}>
            <ul
              aria-label="Credenciales"
              className="intro-fade rounded-2xl border border-line bg-bg/55 px-5 py-1 backdrop-blur-md"
              style={d(1.25)}
            >
              {CREDENTIALS.map((item, index) => (
                <li key={item.title} className="flex items-baseline gap-4 border-b border-line py-3 text-sm last:border-b-0">
                  <span className="font-mono text-[0.65rem] text-subtle">0{index + 1}</span>
                  <span className="text-fg">{item.title}</span>
                  <span className="ml-auto text-right text-muted">{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Credenciales compactas en móvil y tableta. */}
          <ul aria-label="Credenciales" className="intro-fade grid gap-x-6 gap-y-3 text-sm text-muted sm:grid-cols-3 lg:hidden" style={d(1.2)}>
            {CREDENTIALS.map((item) => (
              <li key={item.title} className="border-l border-line-strong pl-3">
                <span className="block text-fg">{item.title}</span>
                {item.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <StackMarquee />
    </section>
  )
}

// Pausa las animaciones infinitas del hero (anillos, flotantes, marquesina)
// mientras no está en pantalla: no gastan batería cuando nadie las ve.
function usePauseWhenHidden(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      el.toggleAttribute('data-paused', !entry.isIntersecting)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}

// Elementos flotantes: código y geometría de la identidad (medición, precisión).
// Cada uno flota en bucle (CSS: translate/rotate) y además se desplaza con el
// cursor según su --depth (CSS: transform), sin que una animación pise a la otra.
// En móvil solo quedan tres y se mueven por sí solos (no hay cursor).
const FLOATERS = [
  { kind: 'code', label: '</>', depth: 40, pos: 'top-[17%] right-[12%] lg:top-[20%] lg:right-[40%]', fx: 8, fy: -16, fr: -4, dur: 9 },
  { kind: 'code', label: '{ }', depth: -34, pos: 'top-[32%] right-[4%] lg:top-auto lg:bottom-[26%] lg:right-[5%]', fx: -10, fy: -12, fr: 5, dur: 11, delay: -3 },
  { kind: 'diamond', depth: -22, pos: 'top-[29%] right-[24%] lg:top-[13%] lg:right-[30%]', fx: 10, fy: 10, fr: 45, dur: 12, delay: -6 },
  { kind: 'code', label: '=>', depth: 28, pos: 'top-[30%] right-[6%]', fx: -6, fy: 12, fr: 3, dur: 10, delay: -2, desktop: true },
  { kind: 'ring', depth: 24, pos: 'bottom-[22%] right-[46%]', fx: 6, fy: 14, fr: 0, dur: 13, delay: -5, desktop: true },
  { kind: 'cross', depth: 44, pos: 'top-[64%] right-[24%]', fx: -8, fy: -10, fr: 90, dur: 14, delay: -4, desktop: true },
  { kind: 'dots', depth: -18, pos: 'top-[38%] right-[48%]', fx: 6, fy: -8, fr: 0, dur: 15, delay: -8, desktop: true },
]

function HeroFloaters() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {FLOATERS.map((item, index) => (
        <div
          key={index}
          className={`floater depth absolute ${item.pos} ${item.desktop ? 'hidden lg:block' : ''}`}
          style={{
            '--depth': item.depth,
            '--fx': `${item.fx}px`,
            '--fy': `${item.fy}px`,
            '--fr': `${item.fr}deg`,
            '--dur': `${item.dur}s`,
            '--delay': `${item.delay ?? 0}s`,
            '--in': `${1.3 + index * 0.08}s`,
          }}
        >
          <Floater item={item} />
        </div>
      ))}
    </div>
  )
}

function Floater({ item }) {
  if (item.kind === 'code') {
    return (
      <span className="block rounded-lg border border-line-strong bg-surface/70 px-2.5 py-1.5 font-mono text-xs text-accent/85 shadow-[0_10px_30px_-12px_rgb(76_116_255/0.6)]">
        {item.label}
      </span>
    )
  }
  if (item.kind === 'ring') {
    return <span className="block size-16 rounded-full border border-violet/40 shadow-[0_0_24px_-6px_rgb(160_123_255/0.6)]" />
  }
  if (item.kind === 'diamond') {
    return <span className="block size-3 border border-cyan/60 bg-cyan/10" />
  }
  if (item.kind === 'cross') {
    return (
      <svg viewBox="0 0 16 16" className="size-4 text-blue/80" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 1v14M1 8h14" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 30 30" className="size-8 text-fg/25" fill="currentColor">
      {[5, 15, 25].flatMap((x) => [5, 15, 25].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />))}
    </svg>
  )
}

function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="intro-bg absolute inset-0 -z-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,#0b1230_0%,transparent_60%)]" />
      <div className="absolute top-[-12%] right-[-6%] h-[44rem] w-[44rem] max-w-[120vw]">
        <div
          className="hero-halo hero-glow depth inset-0 bg-[radial-gradient(closest-side,rgb(76_116_255/0.32),transparent)]"
          style={depth(34)}
        />
      </div>
      <div className="absolute top-[38%] right-[22%] h-[30rem] w-[30rem] max-w-[90vw]">
        <div
          className="hero-halo hero-glow depth inset-0 bg-[radial-gradient(closest-side,rgb(160_123_255/0.22),transparent)]"
          style={depth(-22)}
        />
      </div>
      <div className="absolute bottom-[-18%] left-[-12%] h-[38rem] w-[38rem] max-w-[110vw]">
        <div
          className="hero-halo hero-glow depth inset-0 bg-[radial-gradient(closest-side,rgb(94_242_255/0.12),transparent)]"
          style={depth(48)}
        />
      </div>
      <div className="hero-floor" />
      <div className="hero-light" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
    </div>
  )
}

// Anillos de medición alrededor del metal: guiño al método build → measure → iterate.
function HeroRings() {
  const ticks = Array.from({ length: 72 }, (_, i) => i)
  return (
    <svg viewBox="0 0 400 400" className="hero-rings" fill="none">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ef2ff" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#4c74ff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#a07bff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="196" stroke="rgb(190 205 255 / 0.07)" />
      <g className="spin">
        <circle cx="200" cy="200" r="182" stroke="url(#ring-grad)" strokeDasharray="1 7" />
        <path d="M200 18 A182 182 0 0 1 382 200" stroke="url(#ring-grad)" strokeWidth="1.2" />
        <circle cx="382" cy="200" r="2.5" fill="#5ef2ff" />
      </g>
      <g className="spin-rev">
        {ticks.map((i) => (
          <line
            key={i}
            x1="200"
            y1={i % 6 === 0 ? 30 : 34}
            x2="200"
            y2="38"
            stroke="rgb(190 205 255 / 0.22)"
            transform={`rotate(${i * 5} 200 200)`}
          />
        ))}
      </g>
      <text className="hidden lg:inline" x="200" y="392" textAnchor="middle" fill="rgb(190 205 255 / 0.35)" fontFamily="ui-monospace, monospace" fontSize="7" letterSpacing="2">
        BUILD → MEASURE → ITERATE
      </text>
    </svg>
  )
}

function StackMarquee() {
  const items = STACK.map((tech) => (
    <li key={tech} className="flex shrink-0 items-center gap-10 font-mono text-xs tracking-wider whitespace-nowrap text-muted uppercase">
      {tech}
      <span className="size-1 rounded-full bg-gradient-to-r from-cyan to-violet" aria-hidden="true" />
    </li>
  ))

  return (
    <div className="intro-fade relative border-y border-line bg-bg/40 py-5 backdrop-blur-sm" style={d(1.4)}>
      <p className="sr-only">Tecnologías que uso en proyectos reales:</p>
      <div className="marquee overflow-hidden">
        <div className="marquee-track flex w-max gap-10">
          <ul className="flex gap-10" aria-label="Tecnologías">
            {items}
          </ul>
          <ul className="flex gap-10" aria-hidden="true">
            {items}
          </ul>
        </div>
      </div>
    </div>
  )
}

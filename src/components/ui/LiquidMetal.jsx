import { useEffect, useRef } from 'react'
import { isLiteMode } from '../../lib/device'

// Metal líquido iridiscente en WebGL puro (un único fragment shader, sin
// librerías). La figura es un campo de metaballs; sobre él:
//   · Deriva orgánica: deformación de dominio con frecuencias no múltiplos
//     entre sí y gotas que orbitan y "respiran" a ritmos distintos → la forma
//     nunca repite un ciclo evidente.
//   · Superficie: ondulaciones internas que solo afectan a las normales, por
//     lo que los reflejos se mueven por dentro de la figura.
//   · Interacción: ondas que nacen en la trayectoria del cursor (o del dedo) y
//     se propagan por la superficie, hundimiento bajo el cursor, atracción
//     de la superficie hacia él y luz que lo sigue. Todo se desvanece de forma
//     gradual al alejarse.
//   · Material: reflejo de un estudio procedural + película iridiscente
//     cian/azul/violeta en los bordes, que cambian con la deformación.
//
// Coste controlado: resolución interna reducida, 30 fps en equipos modestos y
// con movimiento reducido, pausa fuera de pantalla y con la pestaña oculta.
// Sin WebGL se queda la gota CSS animada de .metal-fallback.

const RIPPLES = 10

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define RIPPLES ${RIPPLES}

uniform vec2 uRes;
uniform float uTime;      // reloj de la deriva orgánica (velocidad variable)
uniform float uClock;     // reloj real, para la edad de las ondas
uniform vec3 uPointer;    // xy: cursor en el espacio de la figura · z: cercanía (0..1)
uniform vec2 uDrag;       // posición retrasada del cursor (la superficie "llega tarde")
uniform vec4 uRipples[RIPPLES]; // xy: origen · z: instante · w: fuerza
uniform float uIntro;

const vec3 CYAN = vec3(0.37, 0.95, 1.0);
const vec3 BLUE = vec3(0.30, 0.45, 1.0);
const vec3 VIOLET = vec3(0.63, 0.48, 1.0);
const float THRESHOLD = 0.42;

vec3 spectrum(float x) {
  x = fract(x);
  vec3 c = mix(CYAN, BLUE, smoothstep(0.0, 0.33, x));
  c = mix(c, VIOLET, smoothstep(0.33, 0.66, x));
  return mix(c, CYAN, smoothstep(0.66, 1.0, x));
}

float ball(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  return exp(-dot(d, d) / (r * r));
}

// Deformación del dominio: tres capas de ondas con frecuencias y fases
// distintas (no comparten periodo), así la silueta fluye sin bucle visible.
vec2 warp(vec2 p, float t) {
  return p + 0.034 * vec2(
    sin(p.y * 5.3 + t * 1.31) + 0.5 * sin(p.y * 9.7 - t * 0.83 + 1.3) + 0.3 * sin((p.x + p.y) * 13.1 + t * 1.93),
    cos(p.x * 4.7 - t * 1.13) + 0.5 * cos(p.x * 8.9 + t * 0.97 + 2.1) + 0.3 * cos((p.x - p.y) * 12.3 - t * 1.71)
  );
}

// Forma de la figura (campo escalar; la superficie es f = THRESHOLD).
float shape(vec2 p) {
  float t = uTime * 0.3;
  vec2 q = warp(p, t);
  float grow = 0.55 + 0.45 * uIntro;
  float f = ball(q, vec2(0.025 * sin(t * 0.61), 0.02 * cos(t * 0.47)), 0.36 * grow * (1.0 + 0.04 * sin(t * 1.7)));
  f += ball(q, vec2(cos(t * 0.9) * 0.3, sin(t * 1.15) * 0.22), 0.2 * grow * (1.0 + 0.12 * sin(t * 1.31 + 1.0)));
  f += ball(q, vec2(sin(t * 0.7 + 1.0) * 0.27, cos(t * 0.83 + 2.0) * 0.3), 0.17 * grow);
  f += ball(q, vec2(cos(t * 0.6 + 4.0) * 0.34, sin(t * 0.5 + 1.0) * 0.18), 0.13 * grow * (1.0 + 0.15 * sin(t * 0.77)));
  f += ball(q, vec2(sin(t * 0.37 + 2.4) * 0.33, sin(t * 0.73 + 5.0) * 0.26), 0.1 * grow * (0.85 + 0.25 * sin(t * 0.91)));
  // Atracción: cerca del cursor la superficie se estira hacia él (con retraso).
  f += uPointer.z * 0.5 * ball(q, uDrag * 0.85, 0.12 * grow);
  return f;
}

// Relieve de la superficie: ondas del cursor + hundimiento bajo él +
// ondulación interna. Modifica las normales (reflejos) y un poco la silueta.
float relief(vec2 p) {
  float h = 0.0;
  for (int i = 0; i < RIPPLES; i++) {
    vec4 r = uRipples[i];
    float age = uClock - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 3.2) continue;
    float x = distance(p, r.xy) - age * 0.42;  // frente de onda que avanza
    h += r.w * sin(x * 42.0) * exp(-x * x * 90.0) * exp(-age * 1.6);
  }
  h *= 0.045;
  h -= uPointer.z * 0.05 * ball(p, uPointer.xy, 0.075);
  float t = uTime;
  h += 0.006 * (sin(dot(p, vec2(9.0, 4.0)) + t * 1.3)
              + 0.7 * sin(dot(p, vec2(-5.0, 11.0)) - t * 0.9)
              + 0.4 * sin(dot(p, vec2(13.0, -7.0)) + t * 1.7));
  return h;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float t = uTime;

  float f0 = shape(p);
  // El relieve (con el bucle de ondas) solo se calcula cerca de la superficie.
  float h0 = f0 > 0.2 ? relief(p) : 0.0;
  float f = f0 + 0.4 * h0;
  float mask = smoothstep(THRESHOLD - 0.02, THRESHOLD + 0.02, f);
  float glowA = smoothstep(0.04, THRESHOLD, f) * (1.0 - mask);

  vec3 col = vec3(0.0);
  if (mask > 0.0) {
    float e = 0.004;
    vec2 gF = vec2(shape(p + vec2(e, 0.0)) - f0, shape(p + vec2(0.0, e)) - f0) / e;
    vec2 gH = vec2(relief(p + vec2(e, 0.0)) - h0, relief(p + vec2(0.0, e)) - h0) / e;
    // Más inclinación cerca del borde para que se lea como un volumen.
    float rim = 1.0 - smoothstep(THRESHOLD, THRESHOLD + 0.45, f);
    vec2 slope = gF * (0.32 + rim * 0.9) + gH * 1.6;
    // Tope suave de la pendiente: evita puntos negros en los pliegues entre gotas.
    slope *= min(1.0, 6.0 / max(length(slope), 1e-4));
    vec3 n = normalize(vec3(-slope, 1.0));
    vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
    // El entorno reflejado gira levemente hacia el cursor.
    r.xy += uPointer.xy * 0.22 * uPointer.z;

    // Estudio procedural: horizonte claro arriba, bandas de luz que se mueven.
    float horizon = smoothstep(-0.35, 0.75, r.y + 0.12 * sin(r.x * 3.0 + t * 0.4));
    float bands = pow(0.5 + 0.5 * sin(r.x * 5.5 + r.y * 3.0 + t * 0.35), 8.0);
    float floorRef = smoothstep(0.1, -0.7, r.y) * 0.25;
    vec3 chrome = mix(vec3(0.015, 0.02, 0.05), vec3(0.86, 0.9, 1.0), horizon * 0.62 + bands * 0.55);
    chrome += floorRef * BLUE;

    // Película iridiscente: se desplaza con la deformación (las ondas dejan anillos de color).
    float fres = pow(1.0 - n.z, 1.6);
    vec3 film = spectrum(fres * 1.4 + r.x * 0.35 + r.y * 0.2 + t * 0.03 + h0 * 6.0);
    col = chrome * mix(vec3(1.0), film, 0.35 + 0.45 * fres) + film * fres * 0.45;

    // Luz: en reposo orbita despacio; con el cursor cerca, se va hacia él.
    vec2 idleLight = vec2(0.35 * cos(t * 0.21), 0.45 + 0.15 * sin(t * 0.27));
    vec2 lp = mix(idleLight, uPointer.xy * 1.1, uPointer.z);
    vec3 L = normalize(vec3(lp - p * 0.4, 0.85));
    vec3 hv = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, hv), 0.0), 70.0);
    col += spec * (0.5 + 0.8 * uPointer.z) * vec3(0.92, 0.97, 1.0);
    // Brillo interior tenue: sensación de material translúcido.
    col += film * (1.0 - fres) * 0.06;
    col += film * pow(rim, 3.0) * 0.35;
    col *= mask;
  }

  // Halo iridiscente alrededor del metal.
  float halo = 0.28 + 0.25 * uPointer.z;
  vec3 glow = spectrum(atan(p.y, p.x) / 6.2831 + t * 0.04) * glowA * halo;
  float alpha = mask + glowA * halo * (1.0 - mask);
  // Desvanecido en los bordes del canvas: ni el halo ni una gota se cortan en seco.
  vec2 uv = gl_FragCoord.xy / uRes;
  float edge = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x) *
               smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.86, uv.y);
  gl_FragColor = vec4(col + glow, alpha) * edge;
}
`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[LiquidMetal]', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

export function LiquidMetal({ className = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    if (!vs || !fs) return
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    // Un triángulo que cubre todo el viewport (se crea una vez, no por frame).
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = {
      res: gl.getUniformLocation(program, 'uRes'),
      time: gl.getUniformLocation(program, 'uTime'),
      clock: gl.getUniformLocation(program, 'uClock'),
      pointer: gl.getUniformLocation(program, 'uPointer'),
      drag: gl.getUniformLocation(program, 'uDrag'),
      ripples: gl.getUniformLocation(program, 'uRipples'),
      intro: gl.getUniformLocation(program, 'uIntro'),
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const lite = isLiteMode()
    // Resolución interna: el metal es suave, no necesita la densidad completa.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (lite ? 0.42 : coarse ? 0.55 : 0.75)
    // Equipos modestos y movimiento reducido: 30 fps bastan para un movimiento lento.
    const minFrameMs = lite || reduced ? 33 : 0
    // Movimiento reducido: la sustancia sigue viva pero muy despacio y sin
    // reaccionar al cursor (sin ondas ni atracción).
    const idleSpeed = reduced ? 0.3 : 1
    const interactive = !reduced

    let width = 0
    let height = 0
    const resize = () => {
      width = Math.max(1, Math.round(wrap.clientWidth * scale))
      height = Math.max(1, Math.round(wrap.clientHeight * scale))
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    resize()

    // ── Estado del puntero (en coordenadas de la figura: centro 0, radio ≈ 0.4)
    const ripples = new Float32Array(RIPPLES * 4)
    let rippleIndex = 0
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, dx: 0, dy: 0, energy: 0, target: 0 }
    let lastSpawn = { x: 9, y: 9, at: 0 }
    const start = performance.now()
    let clock = 0
    let idleTime = 12 // empieza en un instante con una forma agradable

    const toLocal = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const unit = Math.min(rect.width, rect.height) || 1
      return {
        x: (clientX - rect.left - rect.width / 2) / unit,
        y: -(clientY - rect.top - rect.height / 2) / unit,
      }
    }

    // Una onda nueva cada vez que el cursor recorre cierta distancia sobre la
    // figura; su fuerza depende de lo rápido que se mueve.
    const spawn = (x, y, strength) => {
      const moved = Math.hypot(x - lastSpawn.x, y - lastSpawn.y)
      if (moved < 0.035 || clock - lastSpawn.at < 0.045) return
      const radius = Math.hypot(x, y)
      if (radius > 0.75) return
      const force = Math.min(Math.max(moved * 7, 0.3), 1) * strength * (1 - smoothstep(0.45, 0.75, radius) * 0.7)
      ripples.set([x, y, clock, force], rippleIndex * 4)
      rippleIndex = (rippleIndex + 1) % RIPPLES
      lastSpawn = { x, y, at: clock }
    }

    const track = (clientX, clientY, strength) => {
      const { x, y } = toLocal(clientX, clientY)
      pointer.tx = x
      pointer.ty = y
      // Cercanía: empieza a reaccionar al acercarse y es máxima sobre la figura.
      pointer.target = (1 - smoothstep(0.3, 1.0, Math.hypot(x, y))) * strength
      spawn(x, y, strength)
      wake()
    }
    const release = () => {
      pointer.target = 0
    }

    // Ratón y lápiz: pointer events. Táctil: touch events pasivos, que siguen
    // llegando mientras el dedo desplaza la página (nunca se bloquea el scroll).
    const host = wrap.closest('section') ?? window
    const onPointerMove = (event) => {
      if (event.pointerType === 'touch') return
      track(event.clientX, event.clientY, 1)
    }
    const onTouch = (event) => {
      const touch = event.touches[0]
      if (touch) track(touch.clientX, touch.clientY, 0.6)
    }

    // ── Bucle de render
    let frame = 0
    let visible = true
    let first = true
    let last = start
    let lastDraw = 0

    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      clock = (now - start) / 1000

      // Interpolación exponencial: independiente de los fps, sin saltos.
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 14))
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 14))
      pointer.dx += (pointer.tx - pointer.dx) * (1 - Math.exp(-dt * 3.5))
      pointer.dy += (pointer.ty - pointer.dy) * (1 - Math.exp(-dt * 3.5))
      pointer.energy += (pointer.target - pointer.energy) * (1 - Math.exp(-dt * (pointer.target > pointer.energy ? 4 : 1.6)))
      // Cuando el cursor la agita, la sustancia fluye un poco más deprisa.
      idleTime += dt * idleSpeed * (1 + 0.5 * pointer.energy)

      const intro = reduced ? 1 : Math.min(clock / 2.2, 1)
      gl.uniform2f(u.res, width, height)
      gl.uniform1f(u.time, idleTime)
      gl.uniform1f(u.clock, clock)
      gl.uniform3f(u.pointer, pointer.x, pointer.y, pointer.energy)
      gl.uniform2f(u.drag, pointer.dx, pointer.dy)
      gl.uniform4fv(u.ripples, ripples)
      gl.uniform1f(u.intro, 1 - (1 - intro) ** 3)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (first) {
        first = false
        wrap.dataset.gl = 'ready'
      }
    }

    const loop = (now) => {
      if (now - lastDraw >= minFrameMs) {
        lastDraw = now
        draw(now)
      }
      frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }
    function wake() {
      if (!frame && visible && !document.hidden) {
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      wake()
    })
    io.observe(wrap)
    const ro = new ResizeObserver(() => {
      resize()
      if (!frame) draw(performance.now())
    })
    ro.observe(wrap)
    document.addEventListener('visibilitychange', wake)

    if (interactive) {
      host.addEventListener('pointermove', onPointerMove, { passive: true })
      host.addEventListener('pointerleave', release)
      host.addEventListener('touchstart', onTouch, { passive: true })
      host.addEventListener('touchmove', onTouch, { passive: true })
      host.addEventListener('touchend', release)
      host.addEventListener('touchcancel', release)
    }

    const onLost = (event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      frame = 0
      delete wrap.dataset.gl
    }
    canvas.addEventListener('webglcontextlost', onLost)

    wake()

    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', wake)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', release)
      host.removeEventListener('touchstart', onTouch)
      host.removeEventListener('touchmove', onTouch)
      host.removeEventListener('touchend', release)
      host.removeEventListener('touchcancel', release)
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      delete wrap.dataset.gl
    }
  }, [])

  return (
    <div ref={wrapRef} className={`metal ${className}`} aria-hidden="true">
      <div className="metal-fallback" />
      <canvas ref={canvasRef} />
    </div>
  )
}

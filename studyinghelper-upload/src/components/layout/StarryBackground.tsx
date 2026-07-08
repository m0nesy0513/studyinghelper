import { useEffect, useRef } from 'react'

export default function StarryBackground(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: -999, y: -999 })
  const tickRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let layers: ReturnType<typeof mkStars>[] = []

    function makeTex(size: number, r: number, g: number, b: number) {
      const s = size * 8, h = s / 2
      const off = document.createElement('canvas')
      off.width = off.height = s
      const o = off.getContext('2d')!
      const gr = o.createRadialGradient(h, h, 0, h, h, h)
      gr.addColorStop(0, 'rgba(255,255,255,1)')
      gr.addColorStop(0.03, 'rgba(255,255,255,0.95)')
      gr.addColorStop(0.08, `rgba(${r},${g},${b},0.7)`)
      gr.addColorStop(0.2, `rgba(${r},${g},${b},0.35)`)
      gr.addColorStop(0.45, `rgba(${r},${g},${b},0.06)`)
      gr.addColorStop(1, 'transparent')
      o.fillStyle = gr
      o.fillRect(0, 0, s, s)
      return off
    }
    const texWarm = makeTex(3.5, 255, 235, 210)
    const texWhite = makeTex(4.5, 235, 230, 255)
    const texBlue = makeTex(4, 210, 220, 255)

    function mkStars(count: number, zLo: number, zHi: number) {
      const arr: {
        x: number; y: number; z: number
        tex: HTMLCanvasElement; scale: number; baseAlpha: number
        twSp: number; twPh: number; vx: number; vy: number; spd: number
      }[] = []
      for (let i = 0; i < count; i++) {
        const z = zLo + Math.random() * (zHi - zLo)
        const tex = Math.random() < 0.6 ? texWhite : (Math.random() < 0.5 ? texBlue : texWarm)
        const angle = Math.random() * Math.PI * 2
        const spd = (0.02 + z * 0.35) * 0.0005
        arr.push({
          x: Math.random(), y: Math.random(), z, tex, spd,
          scale: 0.4 + z * 0.6,
          baseAlpha: 0.6 + z * 0.4,
          twSp: 0.5 + Math.random() * 3,
          twPh: Math.random() * Math.PI * 2,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
        })
      }
      return arr
    }

    function resize() { canvas!.width = W = innerWidth; canvas!.height = H = innerHeight }
    resize()
    window.addEventListener('resize', resize)

    // 252 颗星，4 层景深
    layers = [
      mkStars(90, 0, 0.25),
      mkStars(80, 0.25, 0.55),
      mkStars(45, 0.55, 0.8),
      mkStars(12, 0.8, 1),
    ]

    function onMouseMove(e: MouseEvent) { mouseRef.current = { x: e.clientX, y: e.clientY } }
    function onMouseLeave() { mouseRef.current = { x: -999, y: -999 } }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      const mx = mouseRef.current.x, my = mouseRef.current.y
      const tick = tickRef.current

      // 银河带
      const gg = ctx!.createLinearGradient(0, H * 0.3, W, H * 0.7)
      gg.addColorStop(0, 'rgba(40,25,65,0.5)')
      gg.addColorStop(0.4, 'rgba(55,35,90,0.7)')
      gg.addColorStop(0.6, 'rgba(35,20,65,0.55)')
      gg.addColorStop(1, 'rgba(18,12,32,0.3)')
      ctx!.fillStyle = gg; ctx!.fillRect(0, 0, W, H)

      const allStars: typeof layers[0] = []

      for (let l = 0; l < layers.length; l++) {
        for (let i = 0; i < layers[l].length; i++) {
          const s = layers[l][i]
          const sx = s.x * W, sy = s.y * H
          const tw = 1 + Math.sin(tick * s.twSp + s.twPh) * 0.25
          const alpha = Math.min(1, s.baseAlpha * tw)
          if (alpha < 0.02) continue
          const ts = s.tex.width * s.scale * 0.4
          ctx!.globalAlpha = alpha
          ctx!.drawImage(s.tex, sx - ts / 2, sy - ts / 2, ts, ts)
          ctx!.globalAlpha = 1
          if (l >= 1) allStars.push(s)
        }
      }

      // 星间连线
      for (let i = 0; i < allStars.length; i++) {
        for (let j = i + 1; j < allStars.length; j++) {
          const a = allStars[i], b = allStars[j]
          const dx = a.x * W - b.x * W, dy = a.y * H - b.y * H
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < W * 0.1) {
            const alpha = (1 - dist / (W * 0.1)) * 0.06
            ctx!.strokeStyle = `rgba(139,92,246,${alpha.toFixed(3)})`
            ctx!.lineWidth = 0.4
            ctx!.beginPath(); ctx!.moveTo(a.x * W, a.y * H); ctx!.lineTo(b.x * W, b.y * H); ctx!.stroke()
          }
        }
      }

      // 鼠标连线
      if (mx > 0 && my > 0) {
        for (let i = 0; i < allStars.length; i++) {
          const a = allStars[i], ax = a.x * W, ay = a.y * H
          const dx = ax - mx, dy = ay - my, dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.45
            ctx!.strokeStyle = `rgba(180,150,250,${alpha.toFixed(3)})`
            ctx!.lineWidth = 0.8
            ctx!.beginPath(); ctx!.moveTo(ax, ay); ctx!.lineTo(mx, my); ctx!.stroke()
          }
        }
        const lg = ctx!.createRadialGradient(mx, my, 0, mx, my, 180)
        lg.addColorStop(0, 'rgba(160,120,240,0.07)')
        lg.addColorStop(0.5, 'rgba(139,92,246,0.02)')
        lg.addColorStop(1, 'transparent')
        ctx!.fillStyle = lg; ctx!.fillRect(mx - 180, my - 180, 360, 360)
      }

      // 漂移
      if (!prefersReduced) {
        for (let l = 0; l < layers.length; l++) {
          for (let i = 0; i < layers[l].length; i++) {
            const s = layers[l][i]
            s.x += s.vx; s.y += s.vy
            if (mx > 0) {
              const dx = (mx / W) - s.x, dy = (my / H) - s.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < 0.15) {
                const force = (0.15 - dist) / 0.15 * 0.00008 * (1 + s.z)
                s.x += dx / dist * force; s.y += dy / dist * force
              }
            }
            if (s.x < 0) s.x += 1; if (s.x > 1) s.x -= 1
            if (s.y < 0) s.y += 1; if (s.y > 1) s.y -= 1
            s.vx += (Math.random() - 0.5) * 0.000002
            s.vy += (Math.random() - 0.5) * 0.000002
            const vel = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
            if (vel > s.spd * 2) { s.vx *= s.spd / vel; s.vy *= s.spd / vel }
          }
        }
      }

      tickRef.current += 0.016
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

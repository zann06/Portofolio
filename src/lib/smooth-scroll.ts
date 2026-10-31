import Lenis from "lenis"

// Buttery inertial scrolling via Lenis, initialized once from App. All in-app
// anchor navigation is routed through scrollToSection/scrollToTop so jumps use
// the same easing as wheel scrolling. Disabled entirely when the visitor
// prefers reduced motion — native scrolling is kept in that case.

let lenis: Lenis | null = null

export function initSmoothScroll(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {}
  }

  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 })
  let raf = 0
  const loop = (time: number) => {
    lenis?.raf(time)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return () => {
    cancelAnimationFrame(raf)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToSection(selector: string) {
  const el = document.querySelector(selector)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el as HTMLElement, { offset: -64, duration: 1.2 })
  } else {
    el.scrollIntoView({ behavior: "smooth" })
  }
}

export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.2 })
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}

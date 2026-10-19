import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../public/landing-scroll.js', import.meta.url), 'utf8')

function classList() {
  const set = new Set<string>()
  return {
    set,
    add: (c: string) => { set.add(c) },
    remove: (c: string) => { set.delete(c) },
    contains: (c: string) => set.has(c),
  }
}

function harness(reduced = false, withIO = true) {
  const html = { classList: classList() }
  const els = [0, 1, 2].map(() => ({ classList: classList() }))
  const listeners: Record<string, () => void> = {}
  const observers: any[] = []
  class FakeIO {
    cb: (e: any[]) => void
    observed = new Set<any>()
    disconnected = false
    constructor(cb: (e: any[]) => void) { this.cb = cb; observers.push(this) }
    observe(el: any) { this.observed.add(el) }
    unobserve(el: any) { this.observed.delete(el) }
    disconnect() { this.disconnected = true; this.observed.clear() }
    fire(el: any) { this.cb([{ target: el, isIntersecting: true }]) }
  }
  const win: any = {
    scrollY: 0,
    HUSH_SCROLL_MANUAL: true,
    matchMedia: () => ({ matches: reduced }),
    requestAnimationFrame: (f: () => void) => { f(); return 1 },
    addEventListener: (t: string, f: () => void) => { listeners[t] = f },
    removeEventListener: (t: string) => { delete listeners[t] },
    document: { documentElement: html, querySelectorAll: () => els },
  }
  if (withIO) win.IntersectionObserver = FakeIO
  runInNewContext(source, { window: win })
  const ctl = win.HushScroll.init({ window: win })
  return { win, html, els, listeners, observers, ctl }
}

test('adds and removes the scrolled class past the threshold', () => {
  const h = harness()
  assert.equal(h.html.classList.contains('hf-scrolled'), false)
  h.win.scrollY = 200; h.listeners.scroll()
  assert.equal(h.html.classList.contains('hf-scrolled'), true)
  h.win.scrollY = 0; h.listeners.scroll()
  assert.equal(h.html.classList.contains('hf-scrolled'), false)
})

test('reveals elements once and disconnects when all are seen', () => {
  const h = harness()
  assert.equal(h.html.classList.contains('hf-js'), true)
  const io = h.observers[0]
  assert.equal(io.observed.size, 3)
  io.fire(h.els[0])
  assert.equal(h.els[0].classList.contains('is-in'), true)
  assert.equal(h.els[1].classList.contains('is-in'), false)
  assert.equal(io.disconnected, false)
  io.fire(h.els[1]); io.fire(h.els[2])
  assert.equal(io.disconnected, true)
})

test('reduced motion shows everything without hiding or observing', () => {
  const h = harness(true)
  assert.equal(h.observers.length, 0)
  assert.equal(h.html.classList.contains('hf-js'), false)
  assert.ok(h.els.every((e) => e.classList.contains('is-in')))
  h.win.scrollY = 50; h.listeners.scroll()
  assert.equal(h.html.classList.contains('hf-scrolled'), true)
})

test('missing IntersectionObserver leaves content visible and destroy unbinds', () => {
  const h = harness(false, false)
  assert.ok(h.els.every((e) => e.classList.contains('is-in')))
  h.ctl.destroy()
  assert.equal(h.listeners.scroll, undefined)
})

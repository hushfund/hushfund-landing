import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
const pages = ['mechanism', 'privacy', 'risks']

test('Product and Learn links open the corresponding app feature', () => {
  const html = read('../index.html')
  const links = {
    App: '/app',
    Deposit: '/app/deposit',
    Withdraw: '/app/withdraw',
    Borrow: '/app/borrow',
    Docs: '/docs',
    Guide: '/docs?guide=1',
    FAQ: '/docs#faq',
  }
  for (const [label, path] of Object.entries(links))
    assert.ok(html.includes(`href="https://hushfund.app${path}">${label}</a>`), label)
})

test('landing Information footer links to local pages', () => {
  const html = read('../index.html')
  assert.ok(html.includes('<a class="nl" href="./mechanism.html">Mechanism</a>'))
  assert.ok(html.includes('href="./privacy.html">Privacy limits</a>'))
  assert.ok(html.includes('href="./risks.html">Risks</a>'))
  assert.ok(!html.includes('>Documentation</a>'))
  assert.ok(!html.includes('docs#privacy') && !html.includes('docs#risks'))
})

test('information pages are standalone with relative assets and canonical URLs', () => {
  for (const p of pages) {
    const html = read('../public/' + p + '.html')
    assert.ok(html.includes('rel="canonical" href="https://hushfund.eth.limo/' + p + '.html"'))
    for (const href of ['./', './favicon.svg', './information.css', './information.js', './mechanism.html', './privacy.html', './risks.html', 'https://hushfund.app', 'https://hushfund.app/docs', 'https://x.com/Hushfund_', 'https://github.com/hushfund'])
      assert.ok(html.includes('"' + href + '"'), p + ' missing ' + href)
    assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/)
    assert.doesNotMatch(html, /audited/i)
    assert.doesNotMatch(html, /[\u{1F300}-\u{1FAFF}]/u)
  }
  const map = read('../public/sitemap.xml')
  for (const p of pages) assert.ok(map.includes('https://hushfund.eth.limo/' + p + '.html'))
})

test('pages carry critical caveats', () => {
  const m = read('../public/mechanism.html')
  for (const s of ['10<span>', '50<span>', '100<span>', '1000<span>', 'Ethereum Mainnet', 'nullifier', 'Merkle', 'Aave', 'Morpho', 'not guaranteed', '70%', 'locked', 'retired permanently', 'per-wallet quota', '100 bps'])
    assert.ok(m.includes(s), 'mechanism ' + s)
  const p = read('../public/privacy.html')
  for (const s of ['Deposits are public', 'recipient', 'Anonymity set', 'not provide perfect or guaranteed anonymity', 'RPC', 'relayer', 'IP addresses', 'cannot be reset', 'external wallet'])
    assert.ok(p.includes(s), 'privacy ' + s)
  const r = read('../public/risks.html')
  for (const s of ['circuits', 'illiquidity', 'freeze', 'peg', 'cannot reset', 'sponsorship', 'does not allow pausing withdrawals', '1%', '2 days'])
    assert.ok(r.toLowerCase().includes(s.toLowerCase()), 'risks ' + s)
})

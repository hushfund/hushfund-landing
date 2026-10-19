import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../public/landing-mainnet.js', import.meta.url), 'utf8')

test('ENS landing uses its own metadata and absolute app/documentation links', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes('rel="canonical" href="https://hushfund.eth.limo/"'))
  assert.ok(html.includes('content="https://hushfund.eth.limo/og-image.jpg"'))
  assert.ok(html.includes("var API_BASE = '%MODE%' === 'development' ? '/api' : 'https://hushfund.app/api'"))
  assert.ok(html.includes("var HUSHFUND_APP_URL = 'https://hushfund.app'"))
  assert.ok(html.includes('href="https://hushfund.app/docs"'))
  assert.ok(html.includes('href="https://x.com/Hushfund_"'))
  assert.doesNotMatch(html, /href="\/(?:app|docs)/)
})

async function harness(initialFailure = false) {
  const keys = ['tvl', 'deposits', 'anon-1000', 'fee', 'apy-aave', 'apy-morpho', 'gas']
  const nodes = Object.fromEntries(keys.map(key => [key, { textContent: '—', setAttribute() {}, removeAttribute() {} }]))
  let failed = initialFailure
  let poll = () => {}
  const requests: string[] = []
  runInNewContext(source, {
    document: {
      hidden: false,
      querySelectorAll(selector: string) { return [nodes[selector.match(/"([^"]+)"/)![1]]] },
      addEventListener() {},
    },
    window: { AbortController }, AbortController, setTimeout, clearTimeout,
    setInterval(fn: () => void) { poll = fn; return 1 }, clearInterval() {},
    fetch: async (path: string) => {
      requests.push(path)
      if (failed) throw new Error('Unavailable')
      const data = path.includes('/stats/all')
        ? { totalAssets: '1735', asOfBlock: 26221857, vaults: [
          { address: '0x10', denomination: '10000000', deposits: 2, feeBps: '5' },
          { address: '0x1000', denomination: '1000000000', deposits: 0, feeBps: '5' },
        ] }
        : path.includes('/apy')
          ? { status: 'insufficient_history', message: 'Not enough Mainnet history' }
          : { maxFeePerGas: '10000000', fee: '0' }
      return { ok: true, json: async () => data }
    },
  })
  const settle = () => new Promise<void>(resolve => setImmediate(resolve))
  await settle()
  return { nodes, requests, async refreshFailure() { failed = true; poll(); await settle() } }
}

test('landing uses exact micro-USDC, real deposits/fee and unavailable APY without a formatting crash', async () => {
  const { nodes, requests } = await harness()
  assert.equal(nodes.tvl.textContent, '$0.001735')
  assert.equal(nodes.deposits.textContent, '2')
  assert.equal(nodes['anon-1000'].textContent, '0 DEPOSITS')
  assert.equal(nodes.fee.textContent, '0.05')
  assert.equal(nodes['apy-aave'].textContent, '—')
  assert.equal(nodes['apy-morpho'].textContent, '—')
  assert.match(nodes.gas.textContent, /0\.010 gwei/)
  assert.ok(requests.every(path => path.startsWith('/api/')))
})

test('failed refresh preserves values but explicitly marks TVL, deposits and fee stale', async () => {
  const state = await harness()
  await state.refreshFailure()
  assert.equal(state.nodes.tvl.textContent, '$0.001735 (stale)')
  assert.equal(state.nodes.deposits.textContent, '2 (stale)')
  assert.equal(state.nodes.fee.textContent, '0.05 (stale)')
})

test('initial API failure does not invent zero balances or claim unavailable values are cached data', async () => {
  const state = await harness(true)
  assert.equal(state.nodes.tvl.textContent, 'Unavailable')
  await state.refreshFailure()
  assert.equal(state.nodes.tvl.textContent, 'Unavailable')
  assert.equal(state.nodes.deposits.textContent, 'Unavailable')
})

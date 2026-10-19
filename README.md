<img src="brand/hushfund-logo.svg" alt="Hushfund" width="64" />

# hushfund-landing

**Hushfund — Your money, hushed.**

Hushfund marketing website and mechanism, privacy and risk pages for ENS/IPFS hosting.

## Local development

This is the original static Hushfund landing, not the financial application.
Requires Node.js 22.18+ and npm.

```sh
npm ci
npm test
npm run dev
npm run build
npm run preview
```

The site needs only Vite as development tooling; no workspace, React scaffold,
hosting-provider plugins or private backend is bundled. A local Vite proxy forwards read-only
API calls under `/api` to port 3007 when a separately configured backend is running.
Unavailable network data must remain unavailable, not be replaced with invented values.

### ENS / IPFS deployment

Upload the **contents** of `dist/` as an IPFS directory, with `index.html` at
the directory root. Preserve `public` assets copied into the output, relative
links and the three `.html` information pages. Do not upload a ZIP as the site.
Set the ENS contenthash to `ipfs://YOUR_DIRECTORY_CID` through your own wallet.
Do not copy an old contenthash from documentation.

Canonical origin is https://hushfund.eth.limo; application CTAs point to
https://hushfund.app and app documentation points to https://hushfund.app/docs.
Production live-data reads use https://hushfund.app/api and depend on that
service's read-only CORS policy. No signing credentials belong in this repository.

Primary pages: `/`, `/mechanism.html`, `/privacy.html`, `/risks.html`.
Scroll blur/reveal effects respect reduced-motion preferences.

A default Pinata gateway may restrict rendering HTML; this is separate from
whether the directory is pinned. Test the final ENS gateway and assets.


## Scope and safety

Ethereum Mainnet (chain ID 1) only. Supported fixed deposits: 10, 50, 100 and
1,000 USDC; arbitrary/custom amounts are not supported. Yield is variable.
Gas sponsorship depends on service availability and limits. Zero-knowledge
proofs do not eliminate public timing, amount, network or recipient metadata.
No claim of guaranteed anonymity, guaranteed returns or independent security
certification is made.

This is a source distribution, not a production environment or permission to
spend funds. Local tests may use mocks; those are fixtures, not deployed
protocols. Never use production keys or real user notes in tests.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md),
[OPERATIONS.md](OPERATIONS.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Hushfund-authored code is MIT licensed unless a file states otherwise.
Existing third-party copyright and license notices remain authoritative.
Hushfund names, logos and domains identify the original project; the code
license does not grant endorsement or trademark rights. Forks must identify
themselves and must not impersonate the official service.


## Official links

- Website: https://hushfund.eth.limo
- Application: https://hushfund.app
- App documentation: https://hushfund.app/docs
- Mechanism: https://hushfund.eth.limo/mechanism.html
- Privacy limits: https://hushfund.eth.limo/privacy.html
- Risks: https://hushfund.eth.limo/risks.html
- X: https://x.com/Hushfund_
- GitHub: https://github.com/hushfund
- Contact: hello@husfund.app

## Repository family

- [hushfund-contracts](https://github.com/hushfund/hushfund-contracts) — Ethereum Mainnet USDC vault contracts, Noir circuits, verifiers and protocol tests.
- [hushfund-app](https://github.com/hushfund/hushfund-app) — Hushfund web app for private USDC notes, yield, withdrawals, borrowing and repayment.
- [hushfund-backend](https://github.com/hushfund/hushfund-backend) — Hushfund API and gas-sponsoring relayer with persistent transaction state and Openfort integration.
- [hushfund-landing](https://github.com/hushfund/hushfund-landing) — Hushfund marketing website and mechanism, privacy and risk pages for ENS/IPFS hosting.


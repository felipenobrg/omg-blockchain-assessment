# Blockchain, Smart Contracts, and Web3 Assessment Project

This repository is a multi-track assessment project for candidates applying to roles in blockchain engineering, smart contract engineering, and full-stack Web3 development.

It combines:
- a layered Express backend for a simplified blockchain
- a React-based explorer for interacting with the chain
- a Solidity smart contract example for assessment and deployment discussion
- a persistence layer so the chain can survive restarts

---

## What’s Included

### Backend
- Express API with routes for chain, transactions, mining, balance, stats, and wallets
- Blockchain domain model with block hashing, transaction validation, and mining logic
- Persistence layer that saves blockchain state to a JSON file
- Centralized middleware for error handling, logging, validation, and rate limiting

### Frontend
- React dashboard to view blockchain state and mine blocks
- Client-side wallet generation and transaction signing via the Web Crypto API — the private key
  never leaves the browser
- Transaction form for creating new signed pending transactions
- A live view of pending transactions waiting to be mined, separate from confirmed blocks
- Polling-based refresh for near-real-time updates

### Smart Contracts
- Solidity contract example in [contracts/AssessmentToken.sol](contracts/AssessmentToken.sol)
- Deployment script in [scripts/deploy-contract.js](scripts/deploy-contract.js)

---

## Project Structure

```text
blockchain-hometask/
├── .github/workflows/   # CI (GitHub Actions)
├── config/
├── contracts/           # Solidity contract
├── controllers/
├── middleware/
├── models/               # domain: Block, Transaction, Blockchain
├── public/                # React static assets
├── routes/
├── scripts/               # contract deployment script
├── services/               # persistence
├── src/                     # React app
├── test/                     # Hardhat/Chai contract tests
├── tests/                     # Node test runner: unit + http integration tests
├── utils/                       # shared backend helpers (validation, logging, responses)
├── .env.example
├── hardhat.config.js
├── package.json
├── server.js
└── README.md
```

---

## Architecture

Layered backend, each layer with one job:

```
routes/       → define endpoints, wire middleware, no business logic
controllers/  → orchestrate a request: validate input, call the model/service, shape the response
models/       → domain behavior (Block, Transaction, Blockchain — hashing, PoW, signature
                validation, balance calculation), no Express dependency
services/     → cross-cutting concerns outside the domain (persistence to disk)
middleware/   → cross-cutting concerns outside the domain (CORS, rate limiting, error handling,
                logging, request validation)
```

Example request flow — `POST /api/mine`:

```
Client → routes/mining.routes.js (writeLimiter) → controllers/mining.controller.js
  → models/index.js (blockchain singleton) → models/blockchain.js#minePendingTransactions
    → Block#mineBlock (proof-of-work loop)
  → services/persistence.service.js#save (writes blockchain.json)
  → response
```

The frontend mirrors this separation: `src/api/` is the only layer that talks to the backend
(components never call `fetch`/`axios` directly), `src/hooks/` owns data-fetching and polling,
`src/utils/wallet.js` owns all browser-side cryptography, and `src/components/` are presentation
only.

### How block hashing, proof-of-work, and chain validation work

- **Hashing**: `Block#calculateHash` and `Transaction#calculateHash` are `sha256` digests of the
  block/transaction's own fields — any change to the content changes the hash.
- **Proof-of-work**: `Block#mineBlock` increments a `nonce` and recomputes the hash until it
  starts with `difficulty` leading zero hex characters (`Block#satisfiesDifficulty`).
- **Chain validation**: `Blockchain#isChainValid` walks the chain checking, per block: every
  transaction's signature verifies, the stored hash matches a fresh recomputation of the content,
  `previousHash` matches the prior block's hash, and the hash actually satisfies the configured
  difficulty (not just "looks right").
- **Pending vs. confirmed transactions**: `POST /api/transactions` only adds a transaction to
  `blockchain.pendingTransactions` (the mempool) — it does not touch the chain. A transaction only
  becomes confirmed (permanent, part of `blockchain.chain`) once `POST /api/mine` bundles the
  current mempool into a new block and mines it; the mempool is then cleared. The frontend's
  "Pending Transactions" panel and "Blockchain" panel reflect exactly this split.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

All variables have sane defaults, so `.env` is optional unless you need to change a port, point
persistence somewhere else, or disable demo data. See [.env.example](.env.example) for the full
list (`NODE_ENV`, `PORT`, `CORS_ORIGIN`, `BLOCKCHAIN_DIFFICULTY`, `BLOCKCHAIN_MINING_REWARD`,
`INITIAL_MINER_ADDRESS`, `SEED_DEMO_DATA`, `BLOCKCHAIN_STATE_PATH`, `REACT_APP_API_URL`).

### Run the app

```bash
# Terminal 1
npm start

# Terminal 2
npm run dev
```

The React app uses the proxy in [src/setupProxy.js](src/setupProxy.js) so browser requests to /api are forwarded to the backend.

---

## API Overview

All API responses follow this pattern:

```json
{ "success": true, "message": "...", ... }
```

### Core endpoints

| Method | Path | Description |
|---|---|---|
| GET | /api/chain | Return the blockchain (optionally paginated, see below) |
| GET | /api/chain/valid | Return whether the chain is valid |
| POST | /api/transactions | Add a signed, pending transaction |
| GET | /api/transactions/pending | View transactions waiting to be mined |
| GET | /api/transactions/all | View confirmed transactions (optionally paginated, see below) |
| POST | /api/mine | Mine the pending transactions |
| GET | /api/balance/:address | Get an address balance |
| GET | /api/stats | View chain and mining statistics |
| POST | /api/wallets | Generate a wallet-like key pair (server-side, kept for compatibility only) |
| GET | /api/wallets/:address | View a balance for a wallet address |
| GET | /health | Health check (no rate limit) |

`GET /api/chain` and `GET /api/transactions/all` accept optional `?limit=&offset=` query
params. Without them, both return everything (unchanged, backward-compatible default). The
response's `length`/`count` field always reflects the true total, regardless of pagination —
only the returned array is sliced.

---

## Smart Contract Notes

The Solidity contract in [contracts/AssessmentToken.sol](contracts/AssessmentToken.sol) is a simple ERC-20-style token example. It demonstrates:
- token supply initialization
- balance tracking
- transfer, approval, and `transferFrom` flows, with zero-address guards
- a `burn` function that destroys tokens from the caller's own balance and reduces total supply
- `Transfer`/`Approval` events, including a `Transfer` from `address(0)` on mint and to
  `address(0)` on burn (the ERC-20 convention)

It is intended as an assessment artifact — no owner, no minting after deployment, no
pause/upgrade mechanism, by design (see [Known Limitations](#known-limitations)).

### Compiling, testing, and deploying

```bash
npx hardhat compile        # compiles contracts/AssessmentToken.sol
npm run test:contracts     # runs test/AssessmentToken.test.js
npx hardhat run scripts/deploy-contract.js   # deploys to Hardhat's ephemeral local network
```

`scripts/deploy-contract.js` deploys with an initial supply of 1,000,000 tokens and logs the
deployed address. To deploy to a real network, add a network config to
[hardhat.config.js](hardhat.config.js) and pass `--network <name>` to the `hardhat run` command.

---

## Testing

Backend unit and HTTP integration tests live in [tests/](tests). Smart contract tests live in
[test/AssessmentToken.test.js](test/AssessmentToken.test.js) and run under Hardhat/Mocha. React
component tests live alongside their components in `src/components/*.test.js` and run under
Jest + React Testing Library (via `react-scripts test`). The three suites use different test
runners, so they're run separately.

Run:

```bash
npm test              # backend: unit + http integration tests
npm run test:contracts   # smart contract tests
npm run test:frontend    # React component tests
```

### Continuous Integration

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs `npm ci`, `npm test`, `npm run
test:contracts`, `npm run test:frontend`, and `npx hardhat compile` on every push/PR to `main`.
The workflow itself has been validated locally end-to-end (including a clean `rm -rf node_modules
&& npm ci`) — all steps pass. It is not currently showing a green run on GitHub because the
repository owner's
GitHub account is account-locked for an unrelated billing issue, which blocks Actions from
starting a job at all (not a failure in the workflow or the code). The file is kept in the repo
as the intended CI configuration.

---

## Design Decisions & Trade-offs

### Signing curve: P-256 instead of secp256k1

Wallets and transaction signatures use the **P-256** elliptic curve, not the `secp256k1` curve
used by Bitcoin/Ethereum. This is deliberate: wallet key generation and transaction signing
happen entirely **client-side** in the browser via the native Web Crypto API
([src/utils/wallet.js](src/utils/wallet.js)), so the private key never leaves the browser or
touches the server. Web Crypto's ECDSA implementation only supports P-256/P-384/P-521 — no
browser supports `secp256k1` natively — so P-256 was the only curve that allowed real
client-side signing without pulling in a third-party elliptic-curve library. The backend signs
and verifies with `sha256` digest and `ieee-p1363` signature encoding to match exactly what
`window.crypto.subtle` produces.

### Why a transaction's timestamp must be supplied by the client

A signed transaction's hash includes its `timestamp`. If the server generated its own timestamp
when reconstructing the transaction from the request body, it would never match the timestamp
the client actually signed, and every signature verification would fail. `Transaction` accepts
an explicit `timestamp`, and the API requires one whenever a `signature` is present.

### Balance/double-spend checks are mempool-aware

`addTransaction` rejects a transaction if its amount exceeds the sender's confirmed balance minus
whatever that same address already has pending — otherwise an address could submit multiple
transactions in a row that each individually looked affordable but collectively overspent before
a block was mined.

### `POST /api/wallets` (server-side key generation) is kept for compatibility only

The frontend no longer calls it — `WalletPanel` generates keys in the browser. The endpoint stays
in the backend since removing an existing API contract wasn't asked for, but generating a private
key server-side and returning it over HTTP is not a pattern worth building on.

### Persistence is a flat JSON file, made crash-safe instead of switching to a database

The real risk with a JSON file isn't the format — it's that `fs.writeFile` overwrites the file
in place, so a crash mid-write (power loss, `kill -9`, an unhandled exception) can leave a
truncated, corrupted file behind and lose the whole chain. `persistence.service.js#save` now
writes the new state to a temp file first, then `fs.rename`s it over the real file — `rename` is
atomic on the same filesystem, so the state file on disk is always either the old complete state
or the new complete state, never a partial write. That's the actual robustness gap this format
had; swapping JSON for SQLite/a real database would add schema design and an object-relational
mapping layer without fixing anything this doesn't already fix, so it was deliberately left out
as disproportionate complexity for this project's scope.

---

## Known Limitations

- The blockchain is still a simplified educational implementation, not a production-grade distributed ledger.
- There is no authentication/authorization on any endpoint — anyone who can reach the API can mine blocks or check any address's balance.
- The smart contract is intentionally simple for assessment purposes.
- Persistence is a single JSON file (crash-safe via atomic writes, see Trade-offs above) rather
  than a real database — fine for this project's scale, not meant to scale beyond it.

---

## License

One More Game

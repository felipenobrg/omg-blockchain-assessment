# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and review the settings. The defaults work out of the box — you only need to
change them if your ports 3000 or 3002 are already in use.

## 3. Run the Application

Open **two** terminal windows in the project folder:

**Terminal 1 — React dev server (port 3000)**
```bash
npm start
```

**Terminal 2 — API server (port 3002, auto-reloads on save)**
```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

The React app automatically proxies all `/api/*` requests to the API server, so you do not
need to change any URLs.

---

## Production Build

To build the React app and serve everything from a single server on port 3002:

```bash
npm run serve
```

---

## Verify Everything Is Working

After both servers start you should see:

- **Terminal 1:** `webpack compiled successfully`
- **Terminal 2:** `[INFO ] Server : http://localhost:3002`
- **Browser:** The blockchain UI shows the genesis block and demo transactions

---

## Quick Tour

| Action | How |
|---|---|
| View the blockchain | Blocks appear automatically on the right panel |
| Create a wallet | Click **Create Wallet** — generates a key pair locally in your browser |
| Mine a block | Click **Mine Block** in the Stats panel — rewards your active wallet |
| Create a transaction | Once you have a wallet with a balance, fill in the recipient and amount and click **Add Transaction** — it's signed with your wallet's private key before being sent |
| Check API health | Open `http://localhost:3002/health` |
| Auto-refresh | The UI refreshes every 5 seconds automatically |

A brand-new wallet starts with a balance of 0 — mine at least one block with that wallet active
before trying to send a transaction from it, otherwise it will be rejected for insufficient
balance.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | React development server |
| `npm run dev` | API server with nodemon (auto-reload) |
| `npm run server` | API server without auto-reload |
| `npm run build` | Build React for production |
| `npm run serve` | Build + start production server |
| `npm test` | Backend unit + HTTP integration tests |
| `npm run test:contracts` | Smart contract tests (Hardhat/Chai) |
| `npm run lint` | Lint the React app |

---

## Fonts (Optional)

The UI supports custom fonts from `public/fonts/`. If no font files are present, the app
falls back to system fonts — the application works fully without them.

To add custom fonts, place `.woff2` / `.woff` files in `public/fonts/` following the naming
convention in `public/index.html`.

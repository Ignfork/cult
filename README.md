# Launch On Cult ($CULT)

Static site, flat file structure — drop every file at the repo root and deploy on Vercel or GitHub Pages. No build step.

## Files
index.html · cults.html · cult.html · launch.html · how.html · faq.html · ledger.html · me.html · style.css · app.js · scene.js · logo.png · mark.png · favicon.png · og.png · vercel.json

## Configure (top of app.js)
- `X_URL` — your X account (empty = X links hidden)
- `PAYOUT_WALLET` — the wallet that receives 100% of pump.fun creator fees
- `API_BASE` — your payout-desk backend. Empty = every page shows its real empty state (all zeros, no simulated data).

## Backend endpoints the site expects (when API_BASE is set)
- `GET /stats` → `{ paid_sol, cults, wearing, sects }`
- `GET /cults?kind=all|cults|sects&sort=mcap|holders|wearing|paid|newest` → `[{ name, ticker, mint, image, mcap_usd, holders, wearing_pct, paid_sol, born, parent }]`
- `GET /cults/:mint` → cult + `{ about, look, sects[], holders_list:[{wallet, share, held_seconds, wear_pf, wear_x, multiplier, paid_sol}], gallery:[{image}] }`
- `POST /cults/:mint/gallery` (multipart `image`, `wallet`) → adds a dressed-up picture after a one-time check
- `GET /ledger?type=all|fee|payout|wearing` → `{ totals:{collected,paid,network,waiting}, rows:[{ when, type: fee|payout|wearing|launch, what, amount, unit, sig }] }`
- `GET /me/:wallet` → `{ bags:[{ name, ticker, mint, image, held_seconds, mark, paid_sol }] }`
- `GET /auth/x?wallet=` → X sign-in that links the wallet for the X mark bonus
- `POST /launch` (multipart `image`, `data` JSON) → `{ tx: base64 VersionedTransaction partially signed by the mint keypair, mint }`. The backend uploads metadata to IPFS and builds the pump.fun create (+ optional first buy, + fee sharing set to 100% for PAYOUT_WALLET and locked). The founder's wallet signs and sends.

Cult pages use `cult.html?mint=<MINT>` (a `#<MINT>` hash also works).

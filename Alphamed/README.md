# AlphaMedicol

Mobile-first healthcare portal (React + TypeScript + Vite + MUI) with a built-in
AlphaMedicol Points -> LBG Coins conversion journey. The whole app renders inside a
simulated phone shell and runs on **port 5174** alongside the Unified Rewards portal.

## Run

```bash
npm install
npm run dev        # http://localhost:5174
```

Build / preview:

```bash
npm run build
npm run preview    # serves dist on :5174
```

## Routes

| Path                   | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `/`                    | Deep-link entry (`?customerName=&customerEmail=&customerPhone=`) -> dashboard |
| `/login`               | Sign-in (react-hook-form)                                      |
| `/forgot-password`     | Reset flow                                                     |
| `/signup`              | Registration                                                   |
| `/dashboard`           | Main portal (hero, services grid, appointments, drawer, bottom nav) |
| `/lbg-rewards/convert` | Convert points (**1 point = 5 LBG Coins**)                     |
| `/lbg-rewards/success` | Animated transfer confirmation                                 |

## Identity & state

- `localStorage`: `am_customer_name`, `am_customer_email`, `am_customer_phone`
- Complex data travels via React Router `state` between dashboard -> convert -> success.

## Services layer

`src/services/lbgRewardsApi.ts` — three promise-based functions that first try the real
backend (`VITE_LBG_API_BASE_URL`, default `http://localhost:8000`) and gracefully fall back
to a local simulation when it is unreachable:

- `checkLbgUnifiedAccountByEmail(email)`
- `fetchLinkedCustomerSummaryByEmail(email)`
- `transferAlphaMedicolPointsToLbg({ customerEmail, pointsToTransfer })`

Demo error paths: set `localStorage.am_simulate_error = '1'` to force failures
(e.g. the red "Internal server error" state on the convert screen). Clear the key to restore.

## Deep-link from Unified Rewards

The partner card for AlphaMedical in the ILRP app opens:

```
http://localhost:5174/?customerName=<name>&customerEmail=<email>&customerPhone=<phone>
```

which lands directly on the dashboard, already signed in.

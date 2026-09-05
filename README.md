# LBG-Rewards-portal — Personalized Rewards (ILRP-app)

Vite + React + TypeScript rewards portal with a server-driven UI (SDUI) personalization
stack replicated from `SDUI/rewards-intelligence-pov`:

- **`intelligence-layer/`** — FastAPI service (port **8001**) exposing 8 customer personas
  (`customer_001`–`customer_008`) and classifying each into a behavioural persona
  (e.g. `INSTANT_GRATIFICATION`, `LONG_TERM_PLANNER`, `CHURN_RISK`, …).
- **`middleware/`** — QUEST-UI multi-agent committee middleware (port **8002**). A LangGraph
  pipeline (Question → Understand → Evaluate → Structure → Translate → Refine) driven by
  Gemini composes a validated, personalized component layout per persona. Every decision is
  written to `middleware/explainability/<date>/<correlationId>/`.
- **`src/`** — the portal. Login offers the intelligence-layer personas; the rewards portal
  keeps the header (LBG coins hero + Locate Points / Redeem Points) anchored for everyone,
  while everything below it is rendered from the personalized SDUI payload. If the
  middleware is unreachable it falls back to the original static layout.

## Run

1. Backend services:

   ```bash
   docker compose up --build          # ports 8001 + 8002
   # or natively:
   pip install -r intelligence-layer/requirements.txt
   pip install -r middleware/requirements.txt
   uvicorn app.main:app --port 8001   # from intelligence-layer/
   INTELLIGENCE_SERVICE_URL=http://localhost:8001 uvicorn app.main:app --port 8002  # from middleware/
   ```

   The middleware reads `GEMINI_API_KEY` from `middleware/.env`.
   docker compose exec postgres psql -U ilrp -d ilrp

2. Frontend:

   ```bash
   npm install
   npm run dev                        # http://localhost:5173
   ```

   Optional env overrides (`.env`): `VITE_INTELLIGENCE_API_URL`, `VITE_MIDDLEWARE_API_URL`,
   `VITE_API_BASE_URL`.

## Personas

On the login screen pick any "Demo persona" (served by `GET :8001/intelligence/customers`).
Each signs into a wallet derived from that profile; the dashboard then asks
`POST :8002/sdui/generate` for a personalized screen, e.g.:

| Customer | Persona | Typical composition |
|---|---|---|
| customer_003 | LONG_TERM_PLANNER | goal cards ×3 + ADD_GOAL_CARD, FUTURE_VALUE_CARD, PROJECTION_CHART |
| customer_005 | GAMIFICATION_MOTIVATED | STREAK_CARD, CHALLENGE_CARD, LEADERBOARD, BADGE_CARD |
| customer_004 | CHURN_RISK | EXPIRING_POINTS_ALERT, REENGAGEMENT_BANNER, QUICK_WIN_CARD |

The full catalog lives in `middleware/catalog/component_catalog.py` (61 component types)
and is mirrored in `src/renderer/componentRegistry.tsx`; every registered component is
available to every persona.

## Component library

Beyond the original 31 SDUI components, the catalog includes 30 personalization-first
components, all mirrored as React cards in `src/components/rewards-intelligence/`:

| Group | Components |
|---|---|
| Educational | LEARNING_PATH_CARD, DAILY_MONEY_TIP_CARD, POINTS_ACADEMY_BADGE_CARD, MYTH_OR_FACT_CARD, SAVINGS_CALCULATOR_CARD (Recharts area chart), COACH_TIP_CARD, HOW_POINTS_WORK_CARD |
| Goal rewards & automation | GOAL_TEMPLATE_GALLERY, MILESTONE_REWARD_LADDER, GOAL_STREAK_CARD, GOAL_MATCH_BOOST_CARD, SHARED_GOAL_CARD, GOAL_AT_RISK_CARD, AUTO_RULES_CARD, GOAL_COMPLETE_CELEBRATION |
| Money-smart | BEST_VALUE_REDEEM_CARD, SAVINGS_TRANSFER_CARD, TRAVEL_FUND_CARD |
| Analytics | EARN_BREAKDOWN_CARD (donut), MONTH_OVER_MONTH_CARD (bars), POINTS_HEALTH_SCORE (radial gauge) — all Recharts |
| Social & community | PEER_INSIGHT_CARD, COMMUNITY_CHALLENGE_CARD |
| Lifecycle | MILESTONE_ANNIVERSARY_CARD, BIRTHDAY_REWARD_CARD |
| Discovery | NEW_BRAND_SPOTLIGHT_CARD, LOCAL_DEALS_CARD |
| Control & giving | PREFERENCES_CARD, GIFT_DONATE_CARD, REFERRAL_CARD |

Generation guardrails (middleware Stage S prompt): at most one educational and one
analytics component per screen; celebration/birthday/anniversary components only appear
when the customer profile genuinely supports them.



I want to pay my insurance using LBG coins , while ensuring 70 pounds cashback on the  payment ,no conversion fee,and minimum 10:1 conversion rate of coins to GBP.

I do not want to use my LBG coins for my insurance payment right now but i would want you to monitor for better LBG coin redemption offers for next 2 weeks .

I want to pay my insurance using LBG coins , while ensuring maximum value .
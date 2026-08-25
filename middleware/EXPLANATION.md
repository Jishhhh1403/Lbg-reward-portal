# QUEST-UI Middleware — Agent Architecture Explanation

> This document explains the multi-agent committee that powers the QUEST-UI Orchestrator Middleware (`middleware/`): what each agent does, how they collaborate across the QUEST+R pipeline, what they produce, and how everything is compiled into a Server-Driven UI (SDUI) JSON payload consumed by the front-end renderer.

---

## Table of Contents

1. [What is this middleware?](#1-what-is-this-middleware)
2. [High-level architecture](#2-high-level-architecture)
3. [Request lifecycle (end-to-end flow)](#3-request-lifecycle-end-to-end-flow)
4. [The 12 agents and their roles](#4-the-12-agents-and-their-roles)
5. [How agents work together — the QUEST+R pipeline](#5-how-agents-work-together--the-questr-pipeline)
6. [Stage-by-stage deep dive](#6-stage-by-stage-deep-dive)
7. [Communication between agents (AgentMessages)](#7-communication-between-agents-agentmessages)
8. [Shared state (QuestUIState)](#8-shared-state-questuistate)
9. [Guardians, veto power and hard gates](#9-guardians-veto-power-and-hard-gates)
10. [Supporting services (non-agentic infrastructure)](#10-supporting-services-non-agentic-infrastructure)
11. [The SDUI JSON format](#11-the-sdui-json-format)
12. [Full example SDUI output](#12-full-example-sdui-output)
13. [Fallback behaviour](#13-fallback-behaviour)
14. [Explainability and audit trail](#14-explainability-and-audit-trail)
15. [Non-negotiable design principles](#15-non-negotiable-design-principles)

---

## 1. What is this middleware?

This middleware is a **governed multi-agent committee** that generates personalized **Server-Driven UI** screens for a banking rewards application. Instead of the frontend deciding what cards to show, the backend:

1. Receives a personalization request (customer reference, journey, channel, consent, session context).
2. Pulls verified behavioural analysis from the separate **Intelligence Layer** service.
3. Runs a 6-stage agentic pipeline (**QUEST+R**) where specialized agents deliberate.
4. Compiles the approved UI decision into an executable **SDUI JSON** document.
5. Returns it to the app, which simply renders the component list.

It is exposed as a FastAPI service (`app/main.py`, version `2.0.0`) with two main endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /sdui/generate` | Full personalization pipeline → `FinalResponse` containing SDUI |
| `GET /experience/customer/{id}` | Convenience wrapper that returns `{screen, validation, trace}` |
| `GET /health` | Health check + agent roster |

---

## 2. High-level architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Frontend Renderer                           │
│        (receives SDUI JSON, renders components in a grid)          │
└──────────────────────────────▲─────────────────────────────────────┘
                               │ SDUI JSON
┌──────────────────────────────┴─────────────────────────────────────┐
│                  QUEST-UI Middleware (FastAPI :8000)                │
│                                                                     │
│  ┌──────────────────────── OrchestrationService ────────────────┐  │
│  │                                                               │  │
│  │   IntelligenceClient ──► Card Rule Engine ──► LangGraph       │  │
│  │   (persona, signals)     (deterministic     QUEST+R graph     │  │
│  │                           composition      (6 stages,         │  │
│  │                            directives)       12 agents)        │  │
│  │                                                               │  │
│  │   LLM Router: Gemini primary ──► Groq failover                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ExplainabilityWriter ──► explainability/YYYY/MM/DD/<corr-id>/      │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ GET /intelligence/customer/{id}
┌──────────────────────────────▼─────────────────────────────────────┐
│              Intelligence Layer service (:8001)                     │
│    (persona detection, motivation, signals, recommendations,       │
│     customer profile: points, tier, goals, streaks, expiries)      │
└─────────────────────────────────────────────────────────────────────┘
```

### Folder map

```
middleware/
├── app/main.py                     # FastAPI entrypoint (/sdui/generate, /experience, /health)
├── agents/                         # The 12 committee members (canonical role definitions)
│   ├── base.py                     # BaseAgent: LLM calls, JSON parsing, message creation
│   ├── orchestrator.py             # Committee chair
│   ├── consent_guardian.py         # Data-permission gatekeeper (VETO)
│   ├── journey_intent.py           # Journey/intent classifier
│   ├── context_analyst.py          # Factual customer-context builder
│   ├── reward_psychology.py        # rewardInteractionProfile builder
│   ├── accessibility.py            # Cognitive load / WCAG evaluator
│   ├── personalization_synth.py    # Weighted-scorecard judge
│   ├── risk_guardian.py            # Fairness/conduct guardian (VETO)
│   ├── component_planner.py        # Candidate composition designer
│   ├── constitution_guardian.py    # UI Constitution enforcer (VETO)
│   ├── sdui_compiler.py            # Plan → executable SDUI JSON
│   └── red_team.py                 # Adversarial challenger
├── workflow/graph.py               # LangGraph QUEST+R pipeline (the actual runtime)
├── schemas/
│   ├── state.py                    # QuestUIState — shared blackboard
│   ├── agent_message.py            # AgentMessage schema
│   ├── sdui.py                     # SDUIScreen / SDUIComponent / SDUIAction models
│   └── request_response.py         # API request/response contracts
├── services/
│   ├── orchestration_service.py    # Wires everything together per request
│   ├── intelligence_client.py      # HTTP client to Intelligence Layer
│   ├── card_rule_engine.py         # Deterministic composition rules (R1–R5 stacks, suppressions)
│   ├── llm_router.py               # Gemini→Groq failover
│   └── experience_service.py
├── catalog/component_catalog.py    # Registered component types + prop schemas + persona guides
├── validators/sdui_validator.py    # VALID_COMPONENT_TYPES registry + SDUI validation
├── transformers/composer.py        # Post-processing: accent tokens, span hints, enrichment
├── guardrails/guardrails.py
└── explainability/writer.py        # Audit record writer
```

---

## 3. Request lifecycle (end-to-end flow)

When `POST /sdui/generate` fires, `OrchestrationService.generate_sdui()` runs these steps:

```
Request ─► ① Intelligence fetch ─► ② Card Rule Engine ─► ③ Build state ─►
④ Run QUEST+R LangGraph (Q→U→E→S→T→R, fallback short-circuit at any stage) ─►
⑤ Compile reconciliation + card-rule enforcement ─► ⑥ Validation summary ─►
⑦ Explainability record ─► ⑧ FinalResponse {status, decisionId, sdui, ...}
```

1. **Intelligence fetch** — `IntelligenceClient.get_customer_intelligence()` calls the Intelligence Layer (`INTELLIGENCE_SERVICE_URL`, default `localhost:8001`). It returns the customer's detected **persona** (e.g. `GOAL_ORIENTED_SAVER`, `MIXED_PROFILE`), **motivation**, behavioural **signals**, **recommendations**, and concrete profile data (name, points, tier, goals with progress, streak days, leaderboard rank, expiring points, rewards history). On failure it degrades gracefully to `{"available": false}` and the committee proceeds without it.

2. **Card Rule Engine** — `evaluate_rules(intelligence_data)` deterministically matches conduct/composition rules (R1 value-certainty, R2 payment-utility, R3 educational-competence, R4 interoperability, R5 preview-guaranteed). Each matching rule contributes an **ordered mandatory component stack**, possible **banned types** and **suppression flags** (e.g. `suppress_leaderboard`, `suppress_countdowns`), plus plain-language sanitisation flags. These become *binding directives* injected into Stage S and *deterministically enforced* after Stage T.

3. **State construction** — all request fields (consent envelope, declared preferences, accessibility preferences, session context, correlation IDs) plus intelligence and card rules are packed into `QuestUIState`.

4. **Graph execution** — up to 3 attempts with exponential back-off on rate limits. If the Groq failover provider served the run, reason code `GEMINI_QUOTA_GROQ_FAILOVER` is appended.

5. **Reconciliation** — after Stage T, missing planned components are re-inserted, envelope fields (`decisionId`, timestamps, sorted priorities) are filled deterministically, and card-rule enforcement guarantees the mandatory stack order and bans.

6–8. **Response** — status is `PERSONALIZED` or `FALLBACK`; an explainability record is written under `explainability/YYYY/MM/DD/<correlation-id>/`.

---

## 4. The 12 agents and their roles

Every agent extends `BaseAgent` (`agents/base.py`), which gives them:
- `_call_llm(system_prompt, user_content)` — one structured LLM call
- `_json_parse_with_retry()` — tolerant JSON extraction (brace-slicing, truncation salvage)
- `_create_message()` — standardised `AgentMessage` envelopes addressed to the orchestrator

Agents fall into three functional groups:

### 🧠 Analysts — build understanding (no veto power)

| Agent | File | Stage(s) | Role |
|---|---|---|---|
| **Context Analyst** | `agents/context_analyst.py` | U | Builds the factual customer-context summary. Strictly separates three evidence tiers: **observedFacts** (with source + timestamp), **declaredPreferences** (confidence 1.0), and **inferredProperties** (each requires confidence, `evidenceRefs`, inference method and expiry). Forbidden from using missing data as negative evidence or converting correlation into causation. |
| **Journey & Intent Agent** | `agents/journey_intent.py` | Q, U | Classifies the customer's current journey (`rewards-overview`, redemption flows…), intent and journey phase (`discovery | evaluation | redemption | post-redemption`) with a confidence score. Core doctrine: **current intent beats historical segmentation**; never assume intent from a single data point. |
| **Reward Psychology Specialist** | `agents/reward_psychology.py` | U | Produces the `rewardInteractionProfile` — a *temporary, purpose-bound interpretation* of reward behaviour (never called a "personality"). Uses Self-Determination Theory constructs only: **autonomy, competence, relatedness**. Every attribute carries value/confidence/evidence/method/created/expiry/permitted-purpose. Low-confidence attributes force low-risk personalization only. No clinical or sensitive psychological labels. |

### ⚖️ Guardians — enforce governance (VETO authority)

| Agent | File | Stage(s) | Role |
|---|---|---|---|
| **Orchestrator** (chair) | `agents/orchestrator.py` | Q, R | Chair of the committee. Frames the task in Q (the Task Charter) and makes the final call in R. Owns the 10 non-negotiable design principles. Fails the Q quality gate → immediate fallback. |
| **Consent Guardian** | `agents/consent_guardian.py` | Q, U | Decides **which data may be used** for this purpose and session. Validates the consent envelope and purpose-of-use; classifies every signal as DECLARED / OBSERVED / DERIVED / INFERRED with retention class and expiry; strips prohibited attributes (race, religion, health, biometrics, pregnancy, precise age, etc.). Missing consent ⇒ no behavioural personalization. **VETO** halts the pipeline. |
| **Risk Guardian** (Risk, Fairness & Conduct) | `agents/risk_guardian.py` | E | Scores five risks LOW/MEDIUM/HIGH: **manipulation, dark patterns, discrimination, vulnerability, suitability**. Blocks coercive nudging, artificial scarcity and exploitation of vulnerable customers; insists declared preferences outrank weak inferred signals. **VETO** halts the pipeline. |
| **UI Constitution Guardian** | `agents/constitution_guardian.py` | S | Protects the bank's identity and legal surface: anchored components stay intact and in position, bank/reward-coin logos untouched, regulated/legal text never rewritten, only approved design tokens, registry constraints respected. Evaluates every candidate PASS/VETO. **VETO** halts the pipeline. |
| **Accessibility & Cognitive Load Agent** | `agents/accessibility.py` | U, S, E | Computes `cognitiveLoadScore` (must be < 70), recommends component caps, readability level and navigation complexity. Enforces WCAG 2.1 AA, screen-reader compatibility, contrast and touch targets; customers with accessibility preferences get simplified layouts. Validates hierarchy in S. |

### 🛠️ Builders & Challengers — produce and stress-test artefacts

| Agent | File | Stage(s) | Role |
|---|---|---|---|
| **Personalization Synthesiser** | `agents/personalization_synth.py` | E | Judges candidate strategies on an 8-criterion weighted scorecard (below) and votes for a winner. Cannot override a guardian veto. Records disagreements, uncertainties and rejections explicitly. |
| **Component Planner** | `agents/component_planner.py` | S | Queries the Component Store (registered types + prop schemas + persona guides) and drafts ≥ 2 fully-populated candidate compositions using **only registered component types**. Declares content refs, data bindings, analytics refs, assumptions and risks per candidate. |
| **SDUI Compiler & Validator** | `agents/sdui_compiler.py` | T | Mechanical translator: converts the approved plan into executable SDUI JSON (final **and** neutral fallback), adds schema/policy versions, decision id, timestamps. Explicitly forbidden from inventing components or rewriting approved copy. Deliberation never leaks into the front-end payload. |
| **Red-Team Challenger** | `agents/red_team.py` | R | Adversarial reviewer applying a 13-item checklist (unsupported assumptions, weak evidence, inappropriate urgency, dark patterns, loss of choice, excessive personalization, discriminatory proxies, component overload, accessibility degradation, bad data bindings, stale decisions, renderer failure risk, missing fallback). Must raise at least one substantive challenge or explicitly declare none found. Recommends RELEASE/HOLD. |

#### Personalization scorecard (Stage E weights)

| Criterion | Weight |
|---|---|
| Customer goal relevance | 25 % |
| Expected customer utility | 20 % |
| Reward-profile alignment | 15 % |
| Accessibility & cognitive fit | 15 % |
| Evidence confidence | 10 % |
| Brand & design consistency | 5 % |
| Useful novelty | 5 % |
| Operational feasibility | 5 % |

A hard-gate failure can never be rescued by a high weighted total.

---

## 5. How agents work together — the QUEST+R pipeline

The name **QUEST+R** is the operating sequence. Each letter is one stage, one LangGraph node, one LLM invocation in which the stage's whole roster deliberates as a simulated committee (`workflow/graph.py`, `STAGE_ROSTERS`):

| Stage | Name | Participating agents | Output written to state |
|---|---|---|---|
| **Q** | QUESTION | orchestrator, consent-guardian, journey-intent | `task_charter`, consent verdict, `journeyAnalysis` |
| **U** | UNDERSTAND | context-analyst, journey-intent, reward-psychology, accessibility, consent-guardian | `customer_context`, `reward_interaction_profile`, `accessibilityAnalysis`, `permittedSignals` |
| **E** | EVALUATE | personalization-synth, risk-guardian, accessibility | `evaluations` (scorecard + risk assessment) |
| **S** | STRUCTURE | component-planner, constitution-guardian, accessibility | `candidate_compositions`, constitution check, `ui_decision_plan`, `selected_candidate` |
| **T** | TRANSLATE | sdui-compiler | `final_sdui`, `fallback_sdui`, `compiled_sdui` |
| **R** | REFINE | red-team, orchestrator | `release_check` (RELEASE/HOLD) |

### Flow diagram

```
        Request + Intelligence + Card Rules
                      │
                      ▼
              ┌──────────────┐   charter fails quality gate /
              │  Q QUESTION  │   consent veto ──────────┐
              └──────┬───────┘                          │
                     ▼                                  │
              ┌──────────────┐                          │
              │ U UNDERSTAND │  consent veto ───────────┤
              └──────┬───────┘                          ▼
                     ▼                           ┌───────────┐
              ┌──────────────┐                   │ FALLBACK  │
              │  E EVALUATE  │  risk veto ──────►│  node     │
              └──────┬───────┘                   │ (neutral  │
                     ▼                           │  screen)  │
              ┌──────────────┐                   └─────┬─────┘
              │ S STRUCTURE  │  constitution veto ────┤
              └──────┬───────┘                        │
                     ▼                                │
              ┌──────────────┐                        │
              │ T TRANSLATE  │  compile failure ──────┤
              └──────┬───────┘                        │
                     ▼                                │
              ┌──────────────┐  critical red-team    │
              │  R REFINE    │  HOLD ────────────────┤
              └──────┬───────┘                       │
                     │ RELEASE                       │
                     ▼                               ▼
                  ┌──────────────── END ────────────────┐
                  │  FinalResponse: PERSONALIZED or     │
                  │  FALLBACK (+ SDUI JSON)             │
                  └─────────────────────────────────────┘
```

Every inter-stage edge is conditional: if the state carries `fallback_triggered = True`, control jumps straight to the **fallback node**, which emits a minimal guaranteed screen instead of personalized content.

---

## 6. Stage-by-stage deep dive

### Stage Q — QUESTION *(frame the task)*

**Input:** request metadata, consent envelope, purpose of use, intelligence summary.
**Output:** the **Task Charter** — the contract every later stage must obey.

```json
{
  "taskCharter": {
    "charterId": "charter-e41389bd",
    "realCustomerObjective": "grow savings knowledge while making steady progress toward first-home deposit",
    "permittedBusinessObjective": "increase engagement and redemption within consented scope",
    "journey": "rewards-overview",
    "channel": "mobile",
    "successCriteria": ["clarity of value", "progress visibility"],
    "availableEvidence": ["intelligence signals..."],
    "prohibitedUses": ["no urgency pressure", "no protected-attribute targeting"],
    "mandatoryComponents": ["POINTS_BALANCE", "<persona-primary components>"],
    "allowedPersonalizationScope": "component selection, ordering, copy",
    "latencyBudgetMs": 5000,
    "fallbackConditions": ["consent invalid", "LLM unavailable"]
  },
  "consentCheck": { "consentValid": true, "purposeValid": true, "veto": false },
  "journeyAnalysis": {
    "identifiedJourney": "rewards-overview",
    "currentIntent": "review progress toward goals",
    "intentConfidence": 0.85,
    "journeyPhase": "evaluation"
  }
}
```

If the charter's `qualityGate.passed` is false, or the consent check vetoes, the run falls back immediately.

### Stage U — UNDERSTAND *(build the factual picture)*

Five analysts work in parallel conceptually; their combined output:

- **customerContext** — observedFacts / declaredPreferences / inferredProperties (evidence-linked, expirable).
- **rewardInteractionProfile** — motivational attributes (e.g. `motivation: IMMEDIATE_VALUE`), methodology, `temporaryInterpretation: true`.
- **accessibilityAnalysis** — cognitive load score, recommended max components, readability level, navigation complexity.
- **permittedSignals** — every signal classified (DECLARED/OBSERVED/DERIVED/INFERRED) with allowedPurpose, retentionClass, expiresAt; removed signals listed with reasons.

Grounding rule: the profile's `motivation` **must match** the Intelligence Layer's motivation unless contradicting evidence exists, citing intelligence signals as `evidenceRefs`.

### Stage E — EVALUATE *(compete strategies, gate on risk)*

At least two candidate strategies are scored against the weighted scorecard above. All **hard gates** must pass: consent & purpose limitation, privacy, UI Constitution, component availability/content approval, accessibility minimums, conduct/fairness, jurisdictional policy, schema compatibility. The Risk Guardian's assessment (`manipulationRisk`, `darkPatternRisk`, `discriminatoryRisk`, `vulnerabilityRisk`, `suitabilityRisk` + optional veto) runs here. A veto ⇒ `E_RISK_VETO` ⇒ fallback.

### Stage S — STRUCTURE *(compose real screens)*

The heaviest creative stage. The prompt embeds the **Component Store** (registered component types with prop schemas) and **Persona Composition Guides** (primary / secondary / supporting component lists per persona). Binding composition requirements:

1. **Richness** — 12–17 components per candidate (relaxed only when accessibility demands it).
2. **Anchor** — `POINTS_BALANCE` first, priority 1, always `span: full`.
3. **Persona breadth** — ≥ 4 components from the persona's PRIMARY list, ≥ 3 from SECONDARY, ≥ 2 from SUPPORTING. Persona affinity guides but never whitelists: any registered type is available to any persona.
4. **Category coverage** — beyond persona picks, span ≥ 4 functional categories (goals, projections, gamification, instant-gratification, risk-protection, education, social proof, analytics, utility).
5. **Multi-goal rule** — one `GOAL_PROGRESS_CARD` (or `LONG_TERM_GOAL_CARD`) per goal with real names/numbers, then exactly one `ADD_GOAL_CARD`.
6. **Mixed-persona rules** — `MIXED_PROFILE` blends goal + long-term + ≥ 2 gamification cards; `PLANNER_AT_RISK_MIX` pairs genuine expiring-points protection with long-horizon reassurance; `INSTANT_AT_RISK_MIX` leads with the real expiry situation followed by instantly redeemable value.
7. **Real data** — every prop populated from the customer's actual profile (name, points, tier, goal numbers, streaks…). Placeholders like `"Customer Name"` or zeros are failures.
8. **Tier-fit rewards** — carousel/redeem items may not cost more than ~2× the customer's balance.
9. **Priorities** — unique and strictly ascending.
10. **Layout** — every prop carries `layout.span: "full" | "half"`; consecutive half-span cards pair two-per-row.
11. **Two distinct strategies** — e.g. one persona-pure, one blending a secondary motive.
12. **Variety caps** — ≤ 1 educational card, ≤ 1 analytics card, celebration/milestone/birthday cards only on genuine triggers, ≤ 1 utility garnish.

The Constitution Guardian evaluates each candidate (anchored components, bank identity, tokens, constraints); Accessibility re-checks density/hierarchy. Any veto ⇒ `S_CONSTITUTION_VETO` ⇒ fallback. The winning candidate becomes the **UI Decision Plan** (`selected_candidate`).

**Card-rule directives** (if the engine matched rules) are appended as binding text here: mandatory ordered stack right after POINTS_BALANCE, hard suppressions, banned types, preview-mode and guaranteed-baseline behaviours, plain-English-only copy.

### Stage T — TRANSLATE *(plan → executable SDUI)*

The compiler converts the plan verbatim — no new decisions, no dropped or merged components — producing:

```json
{ "finalSdui": {...}, "fallbackSdui": {...}, "validationResults": {...} }
```

Deterministic post-processing then guarantees correctness regardless of LLM behaviour:
- If compilation produced nothing, the planned components are wrapped directly in a generated envelope.
- Planned-but-missing components (unique types) are re-appended.
- Envelope fields (`schemaVersion`, `decisionId`, `correlationId`, `createdAt`, `expiresAt`, `metadata`) are filled deterministically; components sorted by priority.
- **Card Rule Engine enforcement**: banned types removed, mandatory stack synthesised (using real intelligence values via `_synth_stack_component`) and inserted in exact order after POINTS_BALANCE, priorities renumbered 1..n, technical jargon sanitised when required.

### Stage R — REFINE *(red-team and release)*

The Red-Team Challenger applies its 13-item checklist to the compiled SDUI, selected candidate, fallback and recent messages, returning `releaseDecision: RELEASE | HOLD`, severity-tagged challenges and unresolved counts. The Orchestrator co-signs the release decision. Critical unresolved issues ⇒ `fallback_triggered` with `R_REDTEAM_HOLD`. Otherwise the response ships as `PERSONALIZED`.

---

## 7. Communication between agents (AgentMessages)

Agents never talk freely; they post structured messages onto the shared blackboard (`all_messages`), always addressed to the orchestrator (`schemas/agent_message.py`, `BaseAgent._create_message`):

```json
{
  "messageId": "msg-a1b2c3d4e5f6",
  "sequence": 7,
  "timestamp": "2026-08-24T10:32:11.123456+00:00",
  "stage": "E",
  "round": "governance-challenge",
  "fromAgent": "risk-guardian",
  "toAgents": ["orchestrator"],
  "messageType": "VETO",
  "summary": "Risk assessment: VETO",
  "claims": [
    { "claimId": "risk-claim-7", "statement": "Risk assessment failed...", "confidence": 0.9 }
  ],
  "recommendedActions": [],
  "objections": [],
  "candidateRefs": [],
  "policyRefs": ["conduct-policy", "fairness-policy", "anti-dark-patterns"],
  "modelVersion": "gemini-3.5-flash-lite",
  "promptTemplateVersion": "2.0"
}
```

**Message types and who emits them**

| Type | Meaning | Typical emitters |
|---|---|---|
| `OBSERVATION` | Neutral analytical finding | context-analyst, journey-intent, accessibility |
| `PROPOSAL` | Artefact offered for review | orchestrator (charter), reward-psychology, component-planner, sdui-compiler |
| `VOTE` | Scorecard preference | personalization-synth |
| `APPROVAL` | Gate passed | guardians on success |
| `CHALLENGE` | Adversarial objection | red-team |
| `VETO` | Hard block — triggers fallback | consent-guardian, risk-guardian, constitution-guardian |

Each stage also appends a full **transcript entry** to `llm_transcript`: turn id, stage, participating agents, duration, model, the raw conversation and whether parsing succeeded. Together these feed the explainability records.

---

## 8. Shared state (QuestUIState)

`schemas/state.py` defines the blackboard threaded through every node. Key fields:

| Field | Set by | Consumed by |
|---|---|---|
| `consent_envelope`, `purpose_of_use` | request | Consent Guardian (Q, U) |
| `intelligence_data` | IntelligenceClient | every stage (grounding + real prop values) |
| `card_rules` | Card Rule Engine | Stage S directives, Stage T enforcement |
| `task_charter` | Q | U, E, S |
| `customer_context`, `permitted_evidence` | U | E, S |
| `reward_interaction_profile` | U (Reward Psychology) | E, S |
| `candidate_compositions` | S | E, R |
| `evaluations` | E (Personalization Synthesiser) | S (slimmed verdicts) |
| `selected_candidate`, `ui_decision_plan` | S | T |
| `final_sdui`, `fallback_sdui`, `compiled_sdui` | T | R, response |
| `release_check` | R | response validation summary |
| `all_messages`, `llm_transcript`, `message_sequence` | all stages | audit trail |
| `stages_completed`, `stage_failure`, `fallback_triggered`, `reason_codes` | control fields | routing + diagnostics |

Reducer notes: `reason_codes`, `candidate_compositions`, `all_messages`, `llm_transcript` use LangGraph's `add` reducer (append semantics); everything else overwrites.

---

## 9. Guardians, veto power and hard gates

Three agents hold explicit **VETO authority**, forming the governance spine:

| Guardian | Veto stage | Reason code on veto |
|---|---|---|
| Consent Guardian | Q or U | `<STAGE>_CONSENT_VETO` |
| Risk Guardian | E | `E_RISK_VETO` |
| Constitution Guardian | S | `S_CONSTITUTION_VETO` |

Additionally the **Red-Team Challenger** (R) can trigger a hold (`R_REDTEAM_HOLD`) when critical/high findings remain unresolved, and the **Orchestrator** can fail the charter quality gate (`Q_GATE_FAILED`).

Any veto sets `fallback_triggered = True`; the conditional edge routes to the fallback node and the response is marked `FALLBACK` with the corresponding reason codes. This means **a candidate failing governance loses regardless of how well it scores** — the core safety invariant of the system.

---

## 10. Supporting services (non-agentic infrastructure)

These components are *not* agents — they're deterministic services around the committee:

- **`services/intelligence_client.py`** — HTTP client (5 s timeout) fetching persona/motivation/signals/profile from the Intelligence Layer; graceful degradation on failure.
- **`services/card_rule_engine.py`** — deterministic rule evaluation from intelligence motive scores and conduct signals. Rules R1–R5 define mandatory ordered stacks; suppression flags ban specific component types (leaderboards, streaks, countdowns, spend-more messaging, public recognition); `SANITISATION_MAP` replaces technical jargon (crypto/blockchain/ledger…) with plain English; conduct interlocks and GBP-value expression enforced post-compilation.
- **`services/llm_router.py`** — builds the chat model with automatic **Gemini → Groq** failover; quota exhaustion transparently switches providers.
- **`catalog/component_catalog.py`** — registry of 70+ component types with prop schemas, default spans and per-persona composition guides; rendered into Stage S prompts (full and compact variants).
- **`validators/sdui_validator.py`** — canonical `VALID_COMPONENT_TYPES` set used to verify every emitted component type is registered; also checks screen size limits.
- **`transformers/composer.py`** — post-generation enrichment: persona accent tokens, span defaults, insight/education/automation component classification for the renderer.
- **`guardrails/guardrails.py`**, **`explainability/writer.py`** — additional safety filters and audit persistence.

---

## 11. The SDUI JSON format

The wire format the frontend renders (defined in `schemas/sdui.py`, produced in `workflow/graph.py:_build_sdui_envelope`):

| Field | Description |
|---|---|
| `schemaVersion` | SDUI schema version (`"1.0"`) |
| `decisionId` | Unique id of the UI decision (`decision-<correlationId>`), links to the explainability record |
| `correlationId` | Traces the request end-to-end |
| `createdAt` / `expiresAt` | ISO-8601 validity window (default 1 hour) |
| `customerRef` | Pseudonymized customer reference (raw identifiers excluded) |
| `components[]` | Ordered list — rendered top-to-bottom / grid-paired |
| `components[].priority` | Unique, ascending render order |
| `components[].type` | Must be in `VALID_COMPONENT_TYPES` (validator-enforced) |
| `components[].props` | Fully populated, real customer data; includes `layout.span` hint |
| `components[].actions[]` | Declarative actions (`{type, payload}`) the renderer binds to events |
| `metadata` | Schema, policy and componentRegistry versions for compatibility checks |

Renderer layout convention: `span: "full"` occupies an entire row; consecutive `span: "half"` cards pair two-per-row in a 2-column grid. `POINTS_BALANCE` is always the full-width hero.

---

## 12. Full example SDUI output

Real production-shaped example (persona: education/goal blend, customer with Gold tier and a home-deposit learning goal):

```json
{
  "schemaVersion": "1.0",
  "decisionId": "decision-e41389bd",
  "correlationId": "e41389bd",
  "createdAt": "2026-08-24T10:32:14.512000+00:00",
  "expiresAt": "2026-08-24T11:32:14.512000+00:00",
  "customerRef": "customer_011",
  "components": [
    {
      "id": "comp-points-balance",
      "type": "POINTS_BALANCE",
      "version": "1.0",
      "priority": 1,
      "props": {
        "points": 3900,
        "tier": "Gold",
        "name": "Sophie Williams",
        "layout": { "span": "full" }
      },
      "actions": []
    },
    {
      "id": "comp-goal-progress",
      "type": "GOAL_PROGRESS_CARD",
      "version": "1.0",
      "priority": 2,
      "props": {
        "goalName": "First Home Savings Knowledge",
        "current": 1250,
        "target": 2000,
        "percentage": 63,
        "remaining": 750,
        "motivationalMessage": "You are making steady progress toward your homeownership learning goals.",
        "layout": { "span": "half" }
      },
      "actions": []
    },
    {
      "id": "comp-learning-mission",
      "type": "LEARNING_MISSION_CARD",
      "version": "1.0",
      "priority": 3,
      "props": {
        "title": "Rewards Academy",
        "missionName": "Advanced Property Deposit Strategies",
        "description": "Master the financial principles behind building a solid house deposit.",
        "modulesDone": 3,
        "modulesTotal": 5,
        "pointsOnCompletion": 300,
        "layout": { "span": "full" }
      },
      "actions": []
    },
    {
      "id": "comp-tangible-value",
      "type": "TANGIBLE_VALUE_CARD",
      "version": "1.0",
      "priority": 4,
      "props": {
        "cashValue": "£39.00",
        "pointsEquivalent": 3900,
        "breakdown": [{ "label": "Available balance", "value": "£39.00" }],
        "layout": { "span": "full" }
      },
      "actions": []
    },
    {
      "id": "comp-add-goal",
      "type": "ADD_GOAL_CARD",
      "version": "1.0",
      "priority": 5,
      "props": {
        "title": "Add a new goal",
        "description": "Set another goal and track it here.",
        "layout": { "span": "half" }
      },
      "actions": [
        { "type": "NAVIGATE", "payload": { "target": "/goals/new" } }
      ]
    },
    {
      "id": "comp-streak",
      "type": "STREAK_CARD",
      "version": "1.0",
      "priority": 6,
      "props": {
        "streakDays": 12,
        "activity": "weekly money check-ins",
        "layout": { "span": "half" }
      },
      "actions": []
    },
    {
      "id": "comp-rewards-insight",
      "type": "REWARDS_INSIGHT_CARD",
      "version": "1.0",
      "priority": 7,
      "props": {
        "growthTip": "Your balance is worth more than you think — see its cash value.",
        "expiringPoints": 0,
        "layout": { "span": "full" }
      },
      "actions": []
    }
  ],
  "metadata": {
    "schemaVersion": "1.0",
    "policyVersions": ["1.0"],
    "componentRegistryVersion": "1.0"
  }
}
```

*(Production screens typically contain 12–17 components following the richness rules from Stage S; the sample above is trimmed for readability. A companion `fallbackSdui` with a neutral POINTS_BALANCE screen is always generated alongside.)*

---

## 13. Fallback behaviour

Fallback is a **first-class outcome**, not an error path. It triggers on:

- Charter quality gate failure (`Q_GATE_FAILED`)
- Any guardian veto (consent / risk / constitution)
- Graph exception after retries (rate-limit back-off ×3, provider errors)
- Red-team HOLD with unresolved critical issues
- Empty/unparseable Stage T output

In every case the customer receives the **neutral guaranteed screen** — typically just `POINTS_BALANCE` (+ header) with zeroed props — so the app always has something valid to render. The response carries:

```json
{
  "status": "FALLBACK",
  "fallbackApplied": true,
  "reasonCodes": ["E_RISK_VETO"],
  "confidence": 0.0,
  "validationSummary": { "uiConstitution": "PASS", "consent": "PASS", "...": "..." }
}
```

---

## 14. Explainability and audit trail

Every run persists a complete audit bundle under `middleware/explainability/YYYY/MM/DD/<correlation-id>/` via `ExplainabilityWriter`:

| File | Contents |
|---|---|
| `manifest.json` | Record index and metadata |
| `request-snapshot.json` | Exact inbound request |
| `permitted-evidence.json` | Consent verdict + permitted/removed signals |
| `policy-decisions.json` | Guardian verdicts and card-rule matches |
| `candidate-evaluations.json` | Scorecards and risk assessments |
| `ui-decision-plan.json` | Selected candidate and strategy |
| `final-sdui.json` / `fallback-sdui.json` | Compiled outputs |
| `validation-results.json` | Registry/schema/accessibility checks |
| `agent-conversation.json` / `agent-ai-conversation.json` | Structured agent messages + raw LLM transcripts |
| `audit-summary.json` | Roll-up for review |

The response's `explainabilityRecordRef` points at the bundle, giving full traceability for compliance reviews ("why did this customer see this screen?").

---

## 15. Non-negotiable design principles

Enforced across all agents and restated in every stage prompt:

1. Agents may select/configure **approved components only** — never invent types, props, tokens, events or content refs.
2. Never create, modify or replace official **bank logos** or **reward coin logos**.
3. Never rewrite **regulated, legal, security or mandatory bank text**.
4. Never remove or demote **anchored components** (`POINTS_BALANCE` stays first).
5. Use only customer data allowed by the **Consent and Purpose Policy**.
6. Never infer or use **protected/sensitive attributes**.
7. No **manipulative urgency, dark patterns, hidden choices, artificial scarcity** or coercive mechanisms — countdowns must reflect genuine expiry data.
8. Treat the rewardInteractionProfile as **temporary and purpose-bound**, never a permanent psychological label.
9. **Declared preferences beat inferred signals** when they conflict.
10. **A candidate failing any hard governance gate must be rejected regardless of its personalization score.**

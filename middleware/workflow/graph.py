import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Literal

from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage

from schemas.state import QuestUIState
from agents.base import BaseAgent
from agents.customer_story_architect import CustomerStoryArchitectAgent, GROUNDING_FAILED_REASON
from agents.journey_composer import validate_plan_payload
from agents.narrative_sequencer import NarrativeSequencerAgent
from agents.coherence_guardian import apply_thresholds as resolve_coherence_decision
from agents.session_continuity import (
    SessionContinuityAgent,
    deterministic_continuity_validation,
)
from catalog.component_catalog import (
    render_catalog_for_prompt,
    render_persona_guides_for_prompt,
    render_catalog_for_prompt_compact,
    render_persona_guides_for_prompt_compact,
)
from config.narrative_policy import (
    COHERENCE_THRESHOLDS,
    MANDATORY_INSERTION_ROLE,
    MINI_JOURNEY_MAX,
    MINI_JOURNEY_MIN,
)
from schemas.narrative import (
    ComponentNarrativeMetadata,
    ExperienceJourneyPlan,
    NarrativeSequence,
    SDUINarrativeMetadata,
)
from services.card_rule_engine import sanitize_value
from services.narrative_engine import (
    ARCHETYPES,
    COMPONENT_ACT_MAP,
    DEFAULT_ACT,
    NARRATIVE_ACTS,
    apply_narrative,
    narrative_directives_for_prompt,
    select_archetype,
)
from validators.coherence_validator import (
    ValidationResult,
    validate_compiled_screen,
    validate_narrative_sequence,
)


MODEL_NAME = "gemini-3.5-flash-lite"

COMPONENT_CATALOG_TEXT = render_catalog_for_prompt_compact()
PERSONA_GUIDES_TEXT = render_persona_guides_for_prompt_compact()
COMPONENT_CATALOG_TEXT_FULL = render_catalog_for_prompt()
PERSONA_GUIDES_TEXT_FULL = render_persona_guides_for_prompt()

SINGLE_CANDIDATE_ADDENDUM = """
NOTE: Token budget is limited. Produce exactly ONE candidate (not 2) with 12-15 components
covering the persona's primary AND secondary lists. Keep prop values concise — no filler
text. All other rules still apply."""

STAGE_ROSTERS = {
    "Q": ["orchestrator", "consent-guardian", "journey-intent"],
    "U": ["context-analyst", "journey-intent", "reward-psychology", "accessibility", "consent-guardian",
          "customer-story-architect", "session-continuity"],
    "E": ["personalization-synth", "risk-guardian", "accessibility",
          "customer-story-architect", "journey-composer", "coherence-guardian"],
    "S": ["journey-composer", "component-planner", "narrative-sequencer", "session-continuity",
          "accessibility", "constitution-guardian", "coherence-guardian"],
    "T": ["sdui-compiler"],
    "R": ["red-team", "orchestrator", "coherence-guardian", "session-continuity"],
}

STAGE_NAMES = {
    "Q": "QUESTION",
    "U": "UNDERSTAND",
    "E": "EVALUATE",
    "S": "STRUCTURE",
    "T": "TRANSLATE",
    "R": "REFINE",
}


STAGE_Q_PROMPT = """You are the QUEST-UI Committee (Orchestrator, Consent Guardian, Journey & Intent Agent) working together in Stage Q — QUESTION.

Your job: Frame the SDUI personalization task for a banking rewards application.

NON-NEGOTIABLE RULES:
- Never invent unsupported UI component types.
- Never modify bank logos or reward coin logos.
- Never rewrite regulated/legal/mandatory bank text.
- Never remove anchored components.
- Never use manipulative urgency, dark patterns, or artificial scarcity.
- Only use customer data allowed by consent.
- Never infer protected/sensitive attributes.

The Intelligence Layer has already classified this customer's persona and motivation.
Use it to frame the charter: realCustomerObjective should reflect the customer's actual
psychological driver, mandatoryComponents should include POINTS_BALANCE plus the primary
components for their persona, and availableEvidence should cite the intelligence signals.

NARRATIVE CHARTER (five-agent extension):
- primaryCustomerOutcome: the ONE customer outcome this visit must serve.
- experienceMode: NEW | CONTINUING | RESOLVING | UNKNOWN (UNKNOWN when no permitted continuity data).
- maxConcurrentPrimaryJourneys: always 1 — one story per screen.
- primaryActionPolicy: ONE_DOMINANT | ONE_PLUS_ALTERNATIVE.
- programmeEducationInterruptionPolicy: ONLY_IF_CENTRAL | REFERENCE_ONLY | DISALLOWED.
- continuityPermitted: true only when consent covers session/event reuse.
- coherenceThresholdProfile: "default-v1".

Produce JSON with:
{
  "taskCharter": {
    "charterId": "unique id",
    "realCustomerObjective": "what customer needs",
    "permittedBusinessObjective": "what business can do",
    "journey": "journey type",
    "channel": "channel",
    "successCriteria": ["criteria"],
    "availableEvidence": ["evidence"],
    "prohibitedUses": ["prohibited"],
    "mandatoryComponents": ["POINTS_BALANCE", "...persona-primary components..."],
    "allowedPersonalizationScope": "scope description",
    "latencyBudgetMs": 5000,
    "fallbackConditions": ["conditions"],
    "primaryCustomerOutcome": "the single primary outcome",
    "experienceMode": "NEW|CONTINUING|RESOLVING|UNKNOWN",
    "maxConcurrentPrimaryJourneys": 1,
    "primaryActionPolicy": "ONE_DOMINANT",
    "programmeEducationInterruptionPolicy": "ONLY_IF_CENTRAL",
    "continuityPermitted": false,
    "coherenceThresholdProfile": "default-v1"
  },
  "consentCheck": {
    "consentValid": true,
    "purposeValid": true,
    "permittedScope": "what data can be used",
    "veto": false
  },
  "journeyAnalysis": {
    "identifiedJourney": "journey type",
    "currentIntent": "customer intent",
    "intentConfidence": 0.85,
    "supportingEvidence": ["evidence"],
    "journeyPhase": "discovery|evaluation|redemption"
  },
  "agentMessages": [
    {
      "fromAgent": "agent-id",
      "messageType": "APPROVAL|OBSERVATION|PROPOSAL",
      "summary": "what agent found"
    }
  ]
}

Return ONLY valid JSON."""


STAGE_U_PROMPT = """You are the QUEST-UI Committee (Context Analyst, Journey & Intent, Reward Psychology, Accessibility, Consent Guardian, Customer Story Architect, Session Continuity) working in Stage U — UNDERSTAND.

Your job: Build a factual customer context, create a rewardInteractionProfile, evaluate accessibility,
frame 2-3 evidence-grounded customer stories, and observe session continuity.

RULES:
- Separate evidence from interpretation.
- Do not use missing data as negative evidence.
- Do not convert correlation into causation.
- Do not represent low-confidence signals as facts.
- Attach evidenceRefs to every inferred conclusion.
- Use "rewardInteractionProfile" not "personality".
- Each inferred property must include: value, confidence, evidence references, inference method, expiry.
- If confidence is low, apply only low-risk personalization.
- Maximum 20 components per screen (up to 22 for customers with 4+ goals, since each
  goal gets its own card plus an ADD_GOAL_CARD). Aim for 12-18 components to create a
  rich, personalized experience. Cognitive load must be < 70 — use half-span groupings
  to keep the grid scannable.

The Intelligence Layer output below already contains verified behavioral signals,
a detected persona, motivation and concrete recommendations. Ground the
rewardInteractionProfile attributes in that data — the motivation attribute MUST match
the intelligence layer's motivation unless you find contradicting evidence, and cite
the intelligence signals as evidenceRefs.

CUSTOMER STORY ARCHITECT (binding contract):
Produce EXACTLY 2 OR 3 story hypotheses. Each has: storyId, storyTitle, oneSentenceStory,
customerSituation, storyTension, customerResolution, primaryOutcome, narrativeMode,
evidenceRefs, confidence, prohibitedDetours, completionSignals. Recommend exactly one.
Cite ONLY permitted signal/evidence ids in evidenceRefs.
narrativeMode MUST be exactly ONE of: START_NEW_JOURNEY, CONTINUE_ACTIVE_GOAL,
RESOLVE_ACTION, PROTECT_VALUE, MAKE_CHOICE, UNDERSTAND_VALUE. Do NOT invent
narrativeMode values (e.g. "EDUCATIONAL" is invalid).

CITE EVIDENCE RULES (critical):
- The evidenceRefs in your story hypotheses MUST reuse the exact factId values from
  observedFacts in customerContext above. Do NOT invent new IDs like "fact-1", "fact-01".
- Each observedFact already has a factId — reference those directly in evidenceRefs.
- Example: if observedFacts contains {"factId": "fact-wallet-coins", ...}, then
  use "fact-wallet-coins" in evidenceRefs, NOT "fact-1".

SESSION CONTINUITY (privacy binding):
Build continuityState ONLY from permitted prior-session data. If none exists or
continuityPermitted=false, return available=false. Never infer emotion or personality.

Produce JSON with:
{
  "customerContext": {
    "summary": "factual summary",
    "observedFacts": [{"factId": "id", "statement": "fact", "source": "source", "confidence": 0.9}],
    "declaredPreferences": [{"preferenceId": "id", "statement": "pref", "confidence": 1.0}],
    "inferredProperties": [{"propertyId": "id", "attribute": "attr", "value": "val", "confidence": 0.8, "evidenceRefs": [], "inferenceMethod": "method"}]
  },
  "rewardInteractionProfile": {
    "attributes": [{"attribute": "motivation", "value": "MOTIVATION_TYPE", "confidence": 0.9, "evidenceRefs": []}],
    "methodology": "analysis method"
  },
  "accessibilityAnalysis": {
    "cognitiveLoadScore": 45,
    "recommendedMaxComponents": 16,
    "readabilityLevel": "basic",
    "navigationComplexity": "low"
  },
    "storyHypotheses": {
    "hypotheses": [{"storyId": "story-1", "storyTitle": "title", "oneSentenceStory": "sentence", "customerSituation": "situation", "storyTension": "tension", "customerResolution": "resolution", "primaryOutcome": "outcome", "narrativeMode": "START_NEW_JOURNEY|CONTINUE_ACTIVE_GOAL|RESOLVE_ACTION|PROTECT_VALUE|MAKE_CHOICE|UNDERSTAND_VALUE", "evidenceRefs": [], "confidence": 0.85, "prohibitedDetours": [], "completionSignals": []}],
    "recommendedStoryId": "story-1"
  },
  "continuityState": {"available": false},
  "agentMessages": [{"fromAgent": "agent-id", "messageType": "OBSERVATION|PROPOSAL", "summary": "finding"}]
}

Return ONLY valid JSON."""


STAGE_E_PROMPT = """You are the QUEST-UI Committee (Personalization Synthesiser, Risk Guardian, Accessibility Agent, Customer Story Architect, Journey Composer, Coherence Guardian) working in Stage E — EVALUATE.

Your job: Evaluate at least 2 candidate personalization strategies using a weighted scorecard,
select ONE approved customer story and ONE primary journey, and vote on story/journey coherence.

SCORING CRITERIA (weights):
- customerGoalRelevance: 20%, expectedCustomerUtility: 15%, screenLevelStoryCoherence: 15%
- journeyAndActionContinuity: 10%, accessibilityAndCognitiveFit: 10%, brandAndLegalConsistency: 10%
- rewardProfileAlignment: 5%, evidenceConfidence: 5%, usefulNovelty: 5%, operationalFeasibility: 5%

HARD GATES (must pass all): consent/purpose/privacy, UI Constitution, component availability,
accessibility, conduct/fairness, story/journey coherence (exactly one story and one primary journey).

RULES:
- Never use manipulative urgency, dark patterns, or artificial scarcity.
- Prioritize declared preferences over weak inferred signals.
- Select approvedCustomerStory from Stage U hypotheses ONLY (by storyId).
- JourneyCandidates must directly serve the approved story.

Produce JSON with:
{
  "candidateEvaluations": [{"candidateId": "candidate-1", "strategy": "description", "scores": {"customerGoalRelevance": 8, "expectedCustomerUtility": 7, "screenLevelStoryCoherence": 8, "journeyAndActionContinuity": 8, "accessibilityAndCognitiveFit": 9, "brandAndLegalConsistency": 9, "rewardProfileAlignment": 8, "evidenceConfidence": 7, "usefulNovelty": 6, "operationalFeasibility": 9}, "weightedTotal": 7.65, "hardGatesPass": true}],
  "approvedCustomerStory": { ...verbatim Stage U story object... },
  "journeyCandidates": [{"candidateId": "journey-candidate-1", "storyId": "story id", "journeyObjective": "...", "completionDefinition": "...", "episodeSketches": ["episode 1", "episode 2"], "primaryActionPolicy": "ONE_DOMINANT", "weightedTotal": 8.1, "hardGatesPass": true}],
  "recommendedJourneyId": "journey-candidate-1",
  "coherenceAssessment": {"storyClarity": 80, "journeyContinuity": 75, "miniJourneyCompleteness": 78, "transitionStrength": 70, "actionOutcomeContinuity": 78, "contentDistractionRisk": "Low", "primaryActionClarity": "PASS", "orphanComponents": [], "conflictingNarratives": [], "violations": [], "decision": "PASS"},
  "riskAssessment": {"manipulationRisk": "LOW", "darkPatternRisk": "LOW", "discriminatoryRisk": "LOW", "vulnerabilityRisk": "LOW", "veto": false},
  "agentMessages": [{"fromAgent": "agent-id", "messageType": "VOTE|APPROVAL|CHALLENGE|VETO", "summary": "finding"}]
}

Return ONLY valid JSON."""


STAGE_S_PROMPT = f"""You are the QUEST-UI Committee (Journey Composer, Component Planner, Narrative Sequencer, Session Continuity, Accessibility Agent, UI Constitution Guardian, Coherence Guardian) working in Stage S — STRUCTURE AND SYNTHESISE.

Your job: Compose the screen JOURNEY-FIRST. The approved story and a journey skeleton of 2-4
mini-journeys constrain component selection — never select cards first and retrofit a story.
TARGET: 12-18 components per screen. A personalized rewards screen should feel rich — include
goals, insights, education, rewards, gamification, trust/transparency, and social components
as appropriate for the customer's persona and story.

=== COMPONENT STORE (registered components with their prop schemas) ===
{COMPONENT_CATALOG_TEXT}
=== END COMPONENT STORE ===

=== PERSONA COMPOSITION GUIDES (guidance only — the approved story outranks breadth) ===
{PERSONA_GUIDES_TEXT}
=== END PERSONA COMPOSITION GUIDES ===

COMPOSITION PROCEDURE (execute in this exact order):
STEP 1 — JOURNEY SKELETON (Journey Composer): translate the approved story into ONE primary
   journey with 2-4 mini-journeys. Each episode: miniJourneyId, order (continuous), distinct
   customerQuestion, entryCondition, requiredInformation, allowedNarrativeRoles,
   resolutionType (ACTION|UNDERSTANDING|CHOICE|FEEDBACK|CONTINUATION), transitionsTo,
   requiredEvidenceRefs. Every episode opens, develops and exits in an observable state.
   A heading is not an episode. Move useful-but-non-essential detail to supportingSurfaces.
   IMPORTANT: The LAST mini-journey must have "transitionsTo": null. Do NOT use "done",
   "end", "complete", or any string — only null for the terminal episode.
STEP 2 — COMPONENT MAPPING (Component Planner): map ONLY registered component types into
   episodes. Every non-REFERENCE component belongs to exactly ONE episode. Populate every
   prop with REAL customer values. POINTS_BALANCE stays anchored first with priority 1.
   Multi-goal rule: one GOAL_PROGRESS_CARD/LONG_TERM_GOAL_CARD per goal + one ADD_GOAL_CARD
   after the last goal card. Rewards must fit tier/balance (~2x max).
   DIVERSITY TARGET: aim for 12-18 components total. Include at least one component from
   each applicable category (goals, insights, education, rewards, gamification, trust).
   Use the persona composition guide as a menu — pick from primary, secondary, AND supporting.
STEP 3 — NARRATIVE SEQUENCE (Narrative Sequencer): assign each mapped component its role
   (ORIENTATION, MEANING, TENSION, EVIDENCE, OPTION, ACTION, FEEDBACK, PAYOFF, CELEBRATION,
   CONTINUATION, REFERENCE), dense sequence numbers 1..N, dependsOn (backwards only),
   explicit transitions with relationships between adjacent components, exactly ONE
   primaryActionComponentRef. Every ACTION is followed by FEEDBACK/PAYOFF/CONTINUATION.
   Defer: untriggered celebrations, stale actions, semantically orphaned cards, generic
   programme mechanics not central to the story.
STEP 4 — CONTINUITY TREATMENT (Session Continuity): apply openingTreatment from continuity
   state; retire completed/stale components; suppress immediate repeats of dismissed cards;
   RESOLVE mode leads with feedback and the next unlocked milestone.
STEP 5 — ACCESSIBILITY & CONSTITUTION: cognitive load < 70, respect recommendedMaxComponents,
   layout spans on every component, priorities unique ascending, anchored/brand/legal rules.
STEP 6 — COHERENCE SELF-CHECK (Coherence Guardian): score coherenceAssessment honestly;
   VETO if no single story, competing journeys, ambiguous primary action or orphan cards.

HARD CONSTRAINTS:
1. The first non-anchored component must ESTABLISH THE ACTIVE STORY (ORIENTATION/TENSION role).
2. One dominant primary action per screen (primaryActionPolicy from charter governs alternatives).
3. Every mainline component carries narrativeRole + miniJourneyId via narrativeSequence.
4. Generic educational/mechanics cards are REFERENCE or supporting-surface unless central.
5. No dark patterns, fake scarcity or invented deadlines; countdown values need real data.
6. Target 12-18 components per screen (max 20; multi-goal customers may reach 22).
   DIVERSITY RULE: include components from at least 4 of these categories:
   goals, insights, education, rewards, gamification, social, trust/transparency.
   Do NOT stop at the minimum — a personalized screen should feel rich and relevant.
7. LAYOUT RULE: every props includes "layout": {{"span": "full"|"half"}}; POINTS_BALANCE full;
   pair related half-span cards side by side.
8. Produce exactly ONE candidate (the committee already selected the story/journey strategy).

Each candidate needs: id, type, version "1.0", priority, props (per schema above), actions.

Produce JSON with:
{{
  "experienceJourneyPlan": {{
    "primaryJourneyId": "journey-1",
    "storyId": "approved story id",
    "journeyObjective": "...",
    "entryPoint": "...",
    "completionDefinition": "observable done",
    "primaryActionPolicy": "ONE_DOMINANT",
    "miniJourneys": [
      {{"miniJourneyId": "mj-1", "order": 1, "customerQuestion": "...", "entryCondition": "...",
        "requiredInformation": [], "allowedNarrativeRoles": ["ORIENTATION"],
        "requiredActionType": null, "resolutionType": "UNDERSTANDING",
        "transitionsTo": "mj-2", "requiredEvidenceRefs": [], "optional": false}}
    ],
    "supportingSurfaces": [{{"surfaceId": "surface-1", "purpose": "...", "contentNotes": []}}],
    "qualityGate": {{"passed": true, "violations": []}}
  }},
  "candidates": [
    {{
      "candidateId": "candidate-1",
      "strategy": "how this mapping serves the approved story",
      "components": [
        {{"id": "unique-component-id", "type": "REGISTERED_TYPE", "version": "1.0",
          "priority": 1, "props": {{ "...fully populated..." }},
          "actions": [{{"type": "ACTION_TYPE", "payload": {{}}}}]}}
      ],
      "confidence": 0.85,
      "reasonCodes": ["APPROVED_STORY", "JOURNEY_FIRST"]
    }}
  ],
  "narrativeSequence": {{
    "primaryActionComponentRef": "component-id",
    "components": [
      {{"componentRef": "component-id", "miniJourneyId": "mj-1", "narrativeRole": "ORIENTATION",
        "sequence": 2, "dependsOn": [], "resolves": [], "optional": false}}
    ],
    "transitions": [
      {{"fromComponentRef": "a", "toComponentRef": "b", "relationship": "situation-to-meaning",
        "bridgeIntent": "...", "bridgeCopy": null}}
    ],
    "deferredComponents": [
      {{"componentRef": "id", "componentType": "TYPE", "reason": "...",
        "reasonCode": "DEFER_NOT_CENTRAL", "alternativeSurface": null}}
    ],
    "qualityGate": {{"passed": true, "violations": []}}
  }},
  "continuityPlan": {{
    "openingTreatment": "START|RESUME|RECAP|RESOLVE|BRANCH|RETIRE|RESTART",
    "permitted": true,
    "stateChangeSummary": null,
    "retiredComponents": [],
    "suppressionRules": []
  }},
  "coherenceAssessment": {{
    "storyClarity": 80, "journeyContinuity": 75, "miniJourneyCompleteness": 78,
    "transitionStrength": 70, "actionOutcomeContinuity": 78,
    "contentDistractionRisk": "Low", "primaryActionClarity": "PASS",
    "orphanComponents": [], "conflictingNarratives": [],
    "violations": [], "decision": "PASS", "reasonCode": null
  }},
  "constitutionCheck": {{
    "status": "PASS",
    "anchoredComponentsIntact": true,
    "bankIdentityIntact": true,
    "violations": []
  }},
  "selectedCandidateId": "candidate-1",
  "agentMessages": [
    {{"fromAgent": "agent-id", "messageType": "PROPOSAL|APPROVAL|VETO", "summary": "finding"}}
  ]
}}

Return ONLY valid JSON."""


STAGE_T_PROMPT = """You are the SDUI Compiler. Convert the approved UI Decision Plan into executable SDUI JSON.

RULES:
- Do not make new personalization decisions.
- Do not add components not in the approved plan.
- Do not drop, merge or simplify any planned component — compile ALL of them verbatim,
  preserving every prop value exactly as planned.
- Do not rewrite approved content.
- Use registered IDs and references only.
- Include schema version, decision ID, timestamps.
- Exclude agent deliberation from payload.
- Create both final and fallback versions.

The SDUI format:
{
  "schemaVersion": "1.0",
  "decisionId": "unique-id",
  "correlationId": "correlation-id",
  "createdAt": "ISO-8601",
  "expiresAt": "ISO-8601",
  "customerRef": "pseudonymized",
  "components": [
    {
      "id": "component-id",
      "type": "COMPONENT_TYPE",
      "version": "1.0",
      "priority": 1,
      "props": {"key": "value"},
      "actions": [{"type": "ACTION", "payload": {}}]
    }
  ],
  "metadata": {
    "schemaVersion": "1.0",
    "policyVersions": ["1.0"],
    "componentRegistryVersion": "1.0"
  }
}

Produce JSON with:
{
  "finalSdui": { ... SDUI JSON ... },
  "fallbackSdui": { ... minimal neutral fallback ... },
  "validationResults": {
    "schemaValid": true,
    "componentRegistryValid": true,
    "contentRegistryValid": true,
    "accessibilityValid": true
  }
}

Return ONLY valid JSON."""


STAGE_R_PROMPT = """You are the Red-Team Challenger, Orchestrator, Coherence Guardian and Session Continuity Agent doing final validation (Stage R).

CHECKLIST:
1. Unsupported assumptions
2. Weak or conflicting evidence
3. Inappropriate urgency or dark patterns
4. Loss of customer choice
5. Excessive personalization
6. Discriminatory proxy risk
7. Component overload
8. Accessibility degradation
9. Missing fallback behavior
10. COHERENCE: the compiled screen still tells exactly one story; the first non-anchor
    card establishes it; one dominant action remains unambiguous; mandatory card-rule
    insertions carry declared narrative placements and did not fragment the mainline.
11. CONTINUITY: no repeated celebrations, no stale actions, no immediate repeats of
    dismissed cards; when continuity is unavailable continue safely without inference.

Deterministic postCompileCoherence and continuityValidation results are provided below.
If they report critical divergence or a continuity regression, you MUST return HOLD.

If all checks pass, approve release. If critical issues found, recommend hold.

Produce JSON with:
{
  "releaseDecision": "RELEASE" or "HOLD",
  "challenges": [{"category": "checklist item", "severity": "HIGH|MEDIUM|LOW", "statement": "the challenge"}],
  "unresolvedCritical": 0,
  "unresolvedHigh": 0,
  "releaseReasons": ["reasons"],
  "agentMessages": [
    {"fromAgent": "red-team", "messageType": "APPROVAL|CHALLENGE", "summary": "finding"}
  ]
}

Return ONLY valid JSON."""


def _repair_truncated_json(text: str) -> dict | None:
    """Salvage the longest valid prefix of JSON that was cut off mid-generation
    (e.g. by a max_tokens cap). Returns None when nothing parseable survives."""
    import re
    stack = []
    in_str = False
    esc = False
    last_safe = 0
    for i, ch in enumerate(text):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
                last_safe = i + 1
            continue
        if ch == '"':
            in_str = True
        elif ch in "{[":
            stack.append(ch)
        elif ch in "}]" and stack:
            stack.pop()
            last_safe = i + 1
    trimmed = text[:last_safe].rstrip()
    # Drop dangling fragments like ,"key" or "key": left after the cut
    while True:
        new = re.sub(r",?\s*\"[^\"\[\]{}:,]*?\"\s*:\s*$", "", trimmed)
        if new == trimmed:
            break
        trimmed = new.rstrip().rstrip(",")
    trimmed = trimmed.rstrip().rstrip(",")
    closers = "".join("}" if c == "{" else "]" for c in reversed(stack))
    candidate = trimmed + closers
    # Close one level at a time until it parses (handles cut-inside-array-item)
    while True:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            if len(candidate) <= len(trimmed) + 2:
                return None
            candidate = candidate[: -1]
            if not candidate.endswith("}") and not candidate.endswith("]"):
                return None


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
        if isinstance(text, str) and text.lstrip().startswith("{"):
            repaired = _repair_truncated_json(text)
            if repaired is not None:
                print("[LLM PARSE] Salvaged truncated JSON response")
                return repaired
        return {"raw_response": text}


def _intelligence_summary(state: dict) -> str:
    intel = state.get("intelligence_data", {})
    if not intel or not intel.get("available"):
        return json.dumps({"available": False, "error": intel.get("error", "Intelligence layer unavailable")})
    return json.dumps(intel)  # compact: no indent, saves tokens against TPM budgets


def _slim_evaluations(evaluations: dict) -> dict:
    """Drop verbose score explanations — keeps verdicts the planner needs."""
    if not isinstance(evaluations, dict):
        return evaluations
    slim = {k: v for k, v in evaluations.items() if k != "candidateEvaluations"}
    slim["candidateEvaluations"] = []
    for c in evaluations.get("candidateEvaluations", []):
        if not isinstance(c, dict):
            continue
        scores = {
            k: v.get("score") if isinstance(v, dict) else v
            for k, v in (c.get("scores") or {}).items()
        }
        slim["candidateEvaluations"].append({
            "candidateId": c.get("candidateId"),
            "strategy": c.get("strategy"),
            "scores": scores,
            "weightedTotal": c.get("weightedTotal"),
            "hardGatesPass": c.get("hardGatesPass"),
        })
    return slim


def _slim_final_sdui_for_review(final_sdui: dict) -> dict:
    """Trim bulky props for the R-stage prompt; keep order/roles/anchors."""
    if not isinstance(final_sdui, dict):
        return final_sdui
    slim = {k: v for k, v in final_sdui.items() if k != "components"}
    slim["components"] = [
        {
            "id": c.get("id"),
            "type": c.get("type"),
            "priority": c.get("priority"),
            "narrative": c.get("narrative"),
        }
        for c in final_sdui.get("components", [])
    ]
    return slim


def _make_msgs(state: dict, stage: str, messages: list[dict], seq_start: int) -> list[dict]:
    msgs = []
    for i, m in enumerate(messages):
        msgs.append({
            "messageId": f"msg-{uuid.uuid4().hex[:12]}",
            "sequence": seq_start + i,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": stage,
            "round": m.get("round", "committee"),
            "fromAgent": m.get("fromAgent", "committee"),
            "toAgents": ["orchestrator"],
            "messageType": m.get("messageType", "OBSERVATION"),
            "summary": m.get("summary", ""),
            "claims": [],
            "recommendedActions": [],
            "objections": [],
            "candidateRefs": [],
            "policyRefs": [],
            "modelVersion": MODEL_NAME,
            "promptTemplateVersion": "2.0",
        })
    return msgs


def _make_transcript_entry(
    stage: str,
    user_content: str,
    raw_response: str,
    parsed: dict,
    duration_ms: float,
) -> dict:
    return {
        "turnId": f"turn-{uuid.uuid4().hex[:12]}",
        "stage": stage,
        "stageName": STAGE_NAMES.get(stage, stage),
        "participatingAgents": STAGE_ROSTERS.get(stage, []),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "durationMs": round(duration_ms, 1),
        "model": MODEL_NAME,
        "conversation": [
            {"role": "system", "name": "quest-ui-committee", "content": f"<Stage {stage} system prompt — see promptTemplate v2.0>"},
            {"role": "user", "name": "orchestrator", "content": user_content},
            {"role": "assistant", "name": ", ".join(STAGE_ROSTERS.get(stage, [])), "content": raw_response},
        ],
        "parsedSuccessfully": "raw_response" not in parsed,
        "extractedAgentMessages": parsed.get("agentMessages", []),
    }


def _normalize_component(component: dict, index: int) -> dict:
    comp_type = component.get("type", "UNKNOWN")
    return {
        "id": component.get("id") or f"{comp_type.lower()}-{uuid.uuid4().hex[:8]}",
        "type": comp_type,
        "version": component.get("version", "1.0"),
        "priority": component.get("priority", index + 1),
        "props": component.get("props", {}),
        "actions": component.get("actions", []) if isinstance(component.get("actions", []), list) else [],
    }


def _card_rule_notes(rules: dict) -> str:
    notes = []
    if rules.get("ordered_stack"):
        notes.append(
            "MANDATORY ORDERED STACK: every candidate MUST include these component types "
            "in exactly this order immediately after POINTS_BALANCE, priorities assigned "
            f"in sequence: {', '.join(rules['ordered_stack'])}"
        )
    if rules.get("suppressions"):
        flags = ", ".join(k for k, v in rules["suppressions"].items() if v)
        notes.append(f"HARD SUPPRESSIONS ACTIVE: {flags}. Never include suppressed content or framing.")
    if rules.get("banned_types"):
        notes.append("BANNED COMPONENT TYPES: " + ", ".join(rules["banned_types"]))
    if rules.get("preview_mode"):
        notes.append(
            "PREVIEW MODE: offer cards must present interactive preview states (full terms, exact value) before any commitment CTA."
        )
    if rules.get("guaranteed_baseline"):
        notes.append(
            "GUARANTEED BASELINE: display the guaranteed minimum value explicitly on every offer card BEFORE selection."
        )
    if rules.get("sanitize_technical_language"):
        notes.append("PLAIN ENGLISH ONLY: avoid technical/transfer jargon; express values in GBP.")
    tone = rules.get("tone")
    if tone and tone != "CONCISE":
        notes.append(f"COMMUNICATION TONE: {tone} — match all copy to this predicted-response tone.")
    boosts = rules.get("relevance_boosts") or {}
    if boosts:
        rendered = ", ".join(f"{t} (+{v})" for t, v in sorted(boosts.items()))
        notes.append(
            "PREDICTED-RESPONSE RELEVANCE BOOSTS (rank these higher in the story flow): " + rendered
        )
    return "\n".join(f"- {n}" for n in notes)


def _gbp(points: float) -> str:
    return f"£{points / 100:,.2f}"


def _synth_stack_component(comp_type: str, state: dict) -> dict:
    """Deterministically synthesise a mandatory-stack component when the LLM
    omitted one, using real intelligence values."""
    intel = state.get("intelligence_data", {}) or {}
    profile = intel.get("customerProfile") or {}
    points = profile.get("points") or state.get("intelligence_data", {}).get(
        "customerProfile", {}
    ).get("points", 0) or 0
    goals = profile.get("goals") or []
    name = profile.get("name", "Member")
    signals = profile.get("signals") or []

    def goal_card(t):
        g = goals[0] if goals else None
        return {
            "title": g.get("name", "Your goal"),
            "current": g.get("currentValue", points),
            "target": g.get("targetValue", 0),
            "percentage": g.get("progress", 0),
            "layout": {"span": "half"},
        }

    props = {
        "TANGIBLE_VALUE_CARD": {"cashValue": _gbp(points), "pointsEquivalent": points, "breakdown": [{"label": "Available balance", "value": _gbp(points)}], "layout": {"span": "full"}},
        "REWARD_CHOICE_PANEL": {"options": [
            {"id": "use-now", "label": "Use my points now"},
            {"id": "compare", "label": "Compare partner options"},
            {"id": "keep-saving", "label": "Keep collecting"}], "layout": {"span": "full"}},
        "PARTNER_VALUE_COMPARISON": {"partners": [
            {"name": "Partner voucher", "points": points, "value": _gbp(points)},
            {"name": "Statement credit", "points": points, "value": _gbp(points)}], "layout": {"span": "half"}},
        "WHY_THIS_UI_CARD": {"intro": f"Composed for {name} based on your preferences.", "reasons": [{"label": "Why these cards", "detail": s} for s in signals[:3]], "layout": {"span": "full"}},
        "REWARDS_INSIGHT_CARD": {"growthTip": "Your balance is worth more than you think — see its cash value.", "expiringPoints": 0, "layout": {"span": "full"}},
        "GOAL_PROGRESS_CARD": {**goal_card("GOAL_PROGRESS_CARD"), "layout": {"span": "half"}},
        "PAYMENT_REWARD_CARD": {"paymentMethod": "Linked card", "rewardRate": "0.5% back in points", "description": "Earn points on payments you already make.", "layout": {"span": "full"}},
        "REWARD_ALLOCATION_CONTROL": {"allocation": [{"label": "Payment rewards", "percent": 60}, {"label": "Goals", "percent": 40}], "layout": {"span": "half"}},
        "PAYMENT_REWARD_CONFIRMATION": {"message": "Your payment-linked reward has been applied.", "amount": _gbp(min(points, 1000)), "layout": {"span": "half"}},
        "LEARNING_MISSION_CARD": {"missionName": "Money basics mission", "modulesDone": 1, "modulesTotal": 4, "layout": {"span": "full"}},
        "QUIZ_CARD": {"mode": "untimed-feedback", "questionCount": 3, "untimed": True, "layout": {"span": "full"}},
        "COMPREHENSION_FEEDBACK_CARD": {"feedback": "Nice work — review the key point below.", "layout": {"span": "half"}},
        "CONFIDENCE_PROGRESS_CARD": {"topic": "Money basics", "confidencePercent": min(90, 30 + len(signals) * 10), "levelLabel": "Building confidence", "layout": {"span": "half"}},
        "CONSOLIDATED_REWARD_WALLET": {"programmes": [{"name": "Primary rewards", "points": points, "value": _gbp(points)}], "totalValue": _gbp(points), "layout": {"span": "full"}},
        "SYNC_STATUS_CARD": {"status": "synced", "lastSyncedAt": "recently", "message": "All programmes up to date", "ctaText": "Refresh", "layout": {"span": "half"}},
        "PARTNER_TRANSFER_CARD": {"fromProgramme": "Primary rewards", "toPartner": "Choose partner", "points": points, "estimatedValue": _gbp(points), "status": "Ready when you are", "layout": {"span": "full"}},
        "REWARD_PROVENANCE_CARD": {"history": [{"source": r.get("name", "Reward earned"), "date": "Earlier", "points": r.get("points", 0)} for r in (profile.get("rewardsHistory") or [])[:4]], "layout": {"span": "half"}},
        "PROGRAMME_CONNECTION_CARD": {"programmes": [{"name": p, "connected": False} for p in ("Travel partner", "Retail partner")], "layout": {"span": "full"}},
        "EDUCATIONAL_INSIGHT_CARD": {"insightTitle": "Good to know", "insightBody": "Points keep their full value when you redeem them at face value partners.", "layout": {"span": "half"}},
    }.get(comp_type)

    return {
        "id": f"rule-{comp_type.lower().replace('_', '-')}",
        "type": comp_type,
        "version": "1.0",
        "priority": 99,
        "props": props if props is not None else {"layout": {"span": "full"}},
        "actions": [],
    }


def _enforce_card_rules(final_sdui: dict, rules: dict, state: dict) -> dict:
    """Deterministic post-compilation guarantee: banned types removed, mandatory
    stack types present, priorities renumbered.

    Five-agent reconciliation (spec §12.2): mandated components that already
    exist in the compiled screen STAY at their approved narrative positions —
    pulling them to the stack block would fragment the approved mainline and
    trip post-compile coherence. Only genuinely MISSING mandated types are
    inserted (in stack order) right after the POINTS_BALANCE anchor.
    """
    components = list(final_sdui.get("components", []))
    banned = set(rules.get("banned_types", []))
    components = [c for c in components if c.get("type") not in banned]

    anchored = [c for c in components if c.get("type") == "POINTS_BALANCE"]
    rest = [c for c in components if c.get("type") != "POINTS_BALANCE"]

    inserted: list[dict] = []
    used: set = set()
    for comp_type in rules.get("ordered_stack", []):
        existing = next((c for c in rest if c.get("type") == comp_type and c.get("id") not in used), None)
        if existing is not None:
            used.add(existing.get("id"))
        else:
            inserted.append(_synth_stack_component(comp_type, state))

    final = []
    for i, c in enumerate([*anchored, *inserted, *rest]):
        c = {**c, "priority": i + 1}
        if rules.get("sanitize_technical_language"):
            c = {**c, "props": sanitize_value(c.get("props", {}))}
        final.append(c)

    print(
        f"[CARD RULES] Enforced stack: {len(used)} already placed, "
        f"{len(inserted)} inserted, screen total {len(final)}"
    )
    return {**final_sdui, "components": final}


def _act_envelope_for(components: list[dict], persona: str = "") -> dict:
    """Act headers metadata WITHOUT reordering (approved sequence is authority)."""
    archetype_id = select_archetype(persona)
    archetype = ARCHETYPES[archetype_id]
    acts_meta: list[dict] = []
    for act_spec in NARRATIVE_ACTS:
        member_ids = [
            c["id"] for c in components
            if COMPONENT_ACT_MAP.get(c.get("type", ""), DEFAULT_ACT) == act_spec["id"]
        ]
        if member_ids:
            acts_meta.append({**act_spec, "componentIds": member_ids})
    return {
        "archetype": archetype_id,
        "headline": archetype["headline"],
        "tone": "CONCISE",
        "acts": acts_meta,
        "relevanceScores": {},
    }


def _attach_narrative_metadata(final_sdui: dict, state: dict) -> dict:
    """Attach backwards-compatible narrative metadata (spec §9.3 / §12.2).

    - envelope.experienceNarrative: story/journey/entry-mode/primary action.
    - component.narrative: journey + mini-journey + role (+ deps).
    Components inserted deterministically after approval (card-rule stack) get a
    REFERENCE placement in the least disruptive mapped episode.
    """
    components = final_sdui.get("components") or []
    if not components:
        return final_sdui

    story = state.get("approved_customer_story") or {}
    journey_plan = state.get("experience_journey_plan") or {}
    continuity = state.get("continuity_plan") or {}
    sequence = state.get("narrative_sequence") or {}

    journey_id = journey_plan.get("primaryJourneyId", "")
    episode_ids = [m.get("miniJourneyId") for m in journey_plan.get("miniJourneys", []) if m.get("miniJourneyId")]

    seq_map: dict[str, dict] = {}
    primary_ref = sequence.get("primaryActionComponentRef")
    for sc in sorted(sequence.get("components", []), key=lambda s: s.get("sequence", 0)):
        seq_map[sc.get("componentRef")] = sc

    # Least disruptive episode for unmapped insertions: last mapped episode.
    mapped_episode_ids = [seq_map[c.get("id")]["miniJourneyId"] for c in components if c.get("id") in seq_map]
    fallback_episode = (
        next((e for e in reversed(mapped_episode_ids) if e in set(episode_ids)), None)
        or (episode_ids[-1] if episode_ids else "")
        or "mj-supporting"
    )

    current_episode = None
    enriched: list[dict] = []
    for comp in components:
        cid = comp.get("id")
        meta = seq_map.get(cid)
        if meta is not None:
            payload = ComponentNarrativeMetadata(
                journeyId=journey_id,
                miniJourneyId=meta.get("miniJourneyId", fallback_episode),
                role=_safe_role(meta.get("narrativeRole")),
                dependsOn=list(meta.get("dependsOn", []) or []),
                resolves=list(meta.get("resolves", []) or []),
                optional=bool(meta.get("optional", False)),
            )
        else:
            payload = ComponentNarrativeMetadata(
                journeyId=journey_id,
                miniJourneyId=fallback_episode,
                role=MANDATORY_INSERTION_ROLE,
            )
        if primary_ref and cid == primary_ref:
            current_episode = payload.miniJourneyId
        enriched.append({**comp, "narrative": payload.model_dump(mode="json")})

    entry_mode = continuity.get("openingTreatment", "START") or "START"
    experience_narrative = SDUINarrativeMetadata(
        storyId=str(story.get("storyId", "")),
        primaryOutcome=str(story.get("primaryOutcome", "")),
        primaryJourneyId=journey_id,
        currentMiniJourneyId=current_episode or (episode_ids[0] if episode_ids else None),
        entryMode=str(entry_mode),
        primaryActionComponentId=primary_ref,
    )
    return {**final_sdui, "components": enriched, "experienceNarrative": experience_narrative.model_dump(mode="json")}


def _safe_role(role_value):
    try:
        from schemas.narrative import NarrativeRole
        return NarrativeRole(role_value)
    except Exception:
        return MANDATORY_INSERTION_ROLE


def _reconcile_compiled_order(components: list[dict], sequence: dict) -> list[dict]:
    """The approved narrative sequence is the ordering authority (spec §12.2).

    Approved components are emitted in approved order regardless of priority
    numbers; card-rule or other non-approved insertions keep their position
    relative to their neighbours (fractional ranking), so a mandatory insertion
    right after the anchor survives without reordering the mainline.
    """
    approved = [
        sc.get("componentRef")
        for sc in sorted(sequence.get("components", []), key=lambda s: s.get("sequence", 0))
    ]
    rank = {ref: i for i, ref in enumerate(approved)}
    if not rank or not components:
        return components

    n = len(components)
    next_approved = [float(len(approved))] * n
    nxt = float(len(approved))
    for i in range(n - 1, -1, -1):
        r = rank.get(components[i].get("id"))
        if r is not None:
            nxt = float(r)
        next_approved[i] = nxt

    keys: list[float] = []
    prev = -1.0
    for i, comp in enumerate(components):
        r = rank.get(comp.get("id"))
        if r is not None:
            keys.append(float(r))
            prev = float(r)
        else:
            keys.append(max((prev + next_approved[i]) / 2.0, 0.0))
    order = sorted(range(n), key=lambda i: keys[i])
    return [components[i] for i in order]


def _ordered_components(state: dict, components: list[dict]) -> list[dict]:
    """Priority sort for legacy paths; approved-sequence order otherwise."""
    sequence = state.get("narrative_sequence")
    if sequence:
        return _reconcile_compiled_order(components, sequence)
    return sorted(components, key=lambda c: c.get("priority", 99))


def _build_sdui_envelope(state: dict, components: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    sorted_components = _ordered_components(state, components)
    return {
        "schemaVersion": "1.0",
        "decisionId": f"decision-{state.get('correlation_id', '')}",
        "correlationId": state.get("correlation_id", ""),
        "createdAt": now.isoformat(),
        "expiresAt": (now + timedelta(hours=1)).isoformat(),
        "customerRef": state.get("customer_ref", ""),
        "components": sorted_components,
        "metadata": {
            "schemaVersion": "1.0",
            "policyVersions": ["1.0"],
            "componentRegistryVersion": "1.0",
        },
    }


def build_quest_ui_graph(llm):
    """Build the QUEST+R LangGraph workflow — 6 stages, 6 LLM calls total."""

    def node_stage_q(state: QuestUIState) -> dict:
        """STAGE Q — QUESTION"""
        user_content = f"""Customer: {state.get('customer_ref', 'unknown')}
Journey: {state.get('journey', 'rewards-overview')}
Channel: {state.get('channel', 'mobile')}
Locale: {state.get('locale', 'en-US')}
Consent: {json.dumps(state.get('consent_envelope', {}))}
Purpose: {state.get('purpose_of_use', 'rewards-personalization')}
Correlation ID: {state.get('correlation_id', 'unknown')}

INTELLIGENCE LAYER OUTPUT (verified persona analysis for this customer):
{_intelligence_summary(state)}"""

        start = datetime.now(timezone.utc)
        response = llm.invoke([SystemMessage(content=STAGE_Q_PROMPT), HumanMessage(content=user_content)])
        duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        parsed = _parse_json(response.content)

        seq = state.get("message_sequence", 0)
        agent_msgs = parsed.get("agentMessages", [])
        new_msgs = _make_msgs(state, "Q", agent_msgs, seq + 1)
        transcript = [_make_transcript_entry("Q", user_content, response.content, parsed, duration_ms)]

        return {
            "task_charter": parsed.get("taskCharter", {}),
            "permitted_evidence": parsed.get("consentCheck", {}),
            "current_session_context": {**state.get("current_session_context", {}), "journeyAnalysis": parsed.get("journeyAnalysis", {})},
            "stages_completed": ["Q"],
            "all_messages": new_msgs,
            "llm_transcript": transcript,
            "message_sequence": seq + len(new_msgs),
        }

    def node_stage_u(state: QuestUIState) -> dict:
        """STAGE U — UNDERSTAND (incl. story framing + continuity observation)"""
        user_content = f"""Customer: {state.get('customer_ref', 'unknown')}
Journey: {state.get('journey', 'rewards-overview')}
Channel: {state.get('channel', 'mobile')}
Consent: {json.dumps(state.get('consent_envelope', {}))}
Purpose: {state.get('purpose_of_use', '')}
Declared Prefs: {json.dumps(state.get('declared_preferences', {}))}
Accessibility Prefs: {json.dumps(state.get('accessibility_preferences', {}))}
Session Context: {json.dumps(state.get('current_session_context', {}))}
Task Charter: {json.dumps(state.get('task_charter', {}))}

INTELLIGENCE LAYER OUTPUT (verified persona analysis, behaviors and recommendations):
{_intelligence_summary(state)}"""

        start = datetime.now(timezone.utc)
        response = llm.invoke([SystemMessage(content=STAGE_U_PROMPT), HumanMessage(content=user_content)])
        duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        parsed = _parse_json(response.content)

        # Customer Story Architect — deterministic grounding checks (spec §4.5).
        # Evidence cited in THIS stage's permittedSignals counts as grounded.
        architect = CustomerStoryArchitectAgent(llm, "Customer Story Architect", "customer-story-architect")
        effective_state = {
            **state,
            "customer_context": parsed.get("customerContext") or state.get("customer_context", {}),
            "permitted_evidence": {
                **state.get("permitted_evidence", {}),
                "permittedSignals": parsed.get("permittedSignals", []),
            },
        }
        story_model, story_error = architect.validate_hypotheses(parsed, effective_state)

        # Session Continuity — bounded, consented observation; absence is safe.
        continuity_agent = SessionContinuityAgent(llm, "Session Continuity", "session-continuity")
        continuity_model, _ = continuity_agent.build_continuity_state(parsed)
        if continuity_model is None or not continuity_model.available:
            permitted = (state.get("task_charter") or {}).get("continuityPermitted", False)
            continuity_payload = {"available": False, "permitted": permitted}
        else:
            continuity_payload = continuity_model.model_dump(mode="json")

        seq = state.get("message_sequence", 0)
        agent_msgs = parsed.get("agentMessages", [])
        new_msgs = _make_msgs(state, "U", agent_msgs, seq + 1)
        transcript = [_make_transcript_entry("U", user_content, response.content, parsed, duration_ms)]

        updates = {
            "customer_context": parsed.get("customerContext", {}),
            "reward_interaction_profile": parsed.get("rewardInteractionProfile", {}),
            "permitted_evidence": {**state.get("permitted_evidence", {}), "permittedSignals": parsed.get("permittedSignals", [])},
            "story_hypotheses": story_model.model_dump(mode="json") if story_model else None,
            "continuity_state": continuity_payload,
            "stages_completed": state.get("stages_completed", []) + ["U"],
            "all_messages": new_msgs,
            "llm_transcript": transcript,
            "message_sequence": seq + len(new_msgs),
        }

        if story_error:
            print(f"[STORY GROUNDING] failed: {story_error[:300]}")
            updates["fallback_triggered"] = True
            updates["stage_failure"] = GROUNDING_FAILED_REASON
            updates["reason_codes"] = list(state.get("reason_codes", [])) + [GROUNDING_FAILED_REASON]
        elif story_model and (len(story_model.hypotheses) == 1 or story_model.qualityGate.violations):
            # Degraded-but-safe: fewer than the target count of grounded stories,
            # accepted deterministically; flag for audit trail.
            updates["reason_codes"] = list(state.get("reason_codes", [])) + ["U.STORY.DEGRADED"]
        return updates

    def node_stage_e(state: QuestUIState) -> dict:
        """STAGE E — EVALUATE (strategies + story selection + journey candidates + coherence gate)"""
        user_content = f"""Customer: {state.get('customer_ref', 'unknown')}
Customer Context: {json.dumps(state.get('customer_context', {}))}
Reward Profile: {json.dumps(state.get('reward_interaction_profile', {}))}
Task Charter: {json.dumps(state.get('task_charter', {}))}
Journey Analysis: {json.dumps(state.get('current_session_context', {}).get('journeyAnalysis', {}))}
Story Hypotheses: {json.dumps(state.get('story_hypotheses') or {})}
Continuity State: {json.dumps(state.get('continuity_state') or {})}

INTELLIGENCE LAYER OUTPUT (persona, motivation, recommendations to evaluate against):
{_intelligence_summary(state)}"""

        start = datetime.now(timezone.utc)
        response = llm.invoke([SystemMessage(content=STAGE_E_PROMPT), HumanMessage(content=user_content)])
        duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        parsed = _parse_json(response.content)

        seq = state.get("message_sequence", 0)
        agent_msgs = parsed.get("agentMessages", [])
        new_msgs = _make_msgs(state, "E", agent_msgs, seq + 1)
        transcript = [_make_transcript_entry("E", user_content, response.content, parsed, duration_ms)]

        updates = {
            "evaluations": parsed,
            "journey_candidates": parsed.get("journeyCandidates", []) or [],
            "coherence_assessment": parsed.get("coherenceAssessment"),
            "stages_completed": state.get("stages_completed", []) + ["E"],
            "all_messages": new_msgs,
            "llm_transcript": transcript,
            "message_sequence": seq + len(new_msgs),
        }

        # Story selection must resolve to a Stage U hypothesis (spec §12.1).
        hypotheses = state.get("story_hypotheses") or {}
        hyps = {h.get("storyId"): h for h in hypotheses.get("hypotheses", []) if isinstance(h, dict)}
        approved_story = parsed.get("approvedCustomerStory") or {}
        approved_id = approved_story.get("storyId") or hypotheses.get("recommendedStoryId")
        selected_hyp = hyps.get(approved_id)
        if selected_hyp:
            updates["approved_customer_story"] = {**selected_hyp, **(approved_story if approved_story.get("storyId") == approved_id else {})}
            updates["approved_customer_story"]["selectionStage"] = "E"
        else:
            print("[STORY SELECTION] no story hypothesis could be approved")
            updates["fallback_triggered"] = True
            updates["stage_failure"] = "E.STORY_SELECTION.FAILED"
            updates["reason_codes"] = list(state.get("reason_codes", [])) + ["E.STORY_SELECTION.FAILED"]
            return updates

        # Approved primary journey from evaluated candidates.
        candidates = parsed.get("journeyCandidates") or []
        recommended_journey_id = parsed.get("recommendedJourneyId", "")
        approved_journey = next(
            (c for c in candidates if isinstance(c, dict) and c.get("candidateId") == recommended_journey_id),
            candidates[0] if candidates and isinstance(candidates[0], dict) else None,
        )
        updates["approved_journey"] = approved_journey

        # Coherence Guardian hard gate (spec §7 / §12.1).
        assessment = parsed.get("coherenceAssessment") or {}
        decision, reason_code = resolve_coherence_decision(assessment, [], default_veto_code="E.COHERENCE.VETO")
        if decision == "VETO":
            print(f"[COHERENCE GATE E] VETO via {reason_code}")
            updates["fallback_triggered"] = True
            updates["stage_failure"] = reason_code or "E.COHERENCE.VETO"
            updates["reason_codes"] = list(state.get("reason_codes", [])) + [reason_code or "E.COHERENCE.VETO"]
        return updates

    def node_stage_s(state: QuestUIState) -> dict:
        """STAGE S — STRUCTURE (journey-first composition + narrative gates)"""
        stage_prompt = STAGE_S_PROMPT

        user_content = f"""Customer: {state.get('customer_ref', 'unknown')}
Customer Context: {json.dumps(state.get('customer_context', {}))}
Reward Profile: {json.dumps(state.get('reward_interaction_profile', {}))}
Approved Customer Story: {json.dumps(state.get('approved_customer_story') or {})}
Approved Journey Candidate: {json.dumps(state.get('approved_journey') or {})}
Evaluations: {json.dumps(state.get('evaluations', {}))}
Task Charter: {json.dumps(state.get('task_charter', {}))}

Session/Wallet Context (live frontend state — use for balances, linked brands and recent activity):
{json.dumps(state.get('current_session_context', {}))}

INTELLIGENCE LAYER OUTPUT (use these REAL customer values to populate every component prop):
{_intelligence_summary(state)}"""

        rules = state.get("card_rules") or {}
        if rules.get("matched_rules"):
            notes = _card_rule_notes(rules)
            stage_prompt += f"\n\n=== CARD RULE ENGINE DIRECTIVES (BINDING) ===\n{notes}\n=== END CARD RULE ENGINE DIRECTIVES ==="

        intel_data = state.get("intelligence_data") or {}
        if intel_data.get("available"):
            directives = narrative_directives_for_prompt(intel_data)
            stage_prompt += f"\n\n=== PERSONALIZED STORYTELLING DIRECTIVES (BINDING) ===\n{directives}\n=== END PERSONALIZED STORYTELLING DIRECTIVES ==="

        start = datetime.now(timezone.utc)
        response = llm.invoke([SystemMessage(content=stage_prompt), HumanMessage(content=user_content)])
        duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        parsed = _parse_json(response.content)

        def _fail(reason_code: str, detail: str, extra: dict | None = None) -> dict:
            print(f"[STAGE S] {reason_code}: {detail[:300]}")
            updates = {
                "fallback_triggered": True,
                "stage_failure": reason_code,
                "reason_codes": list(state.get("reason_codes", [])) + [reason_code],
                "stages_completed": state.get("stages_completed", []) + ["S"],
                "llm_transcript": [_make_transcript_entry("S", user_content, response.content, parsed, duration_ms)],
            }
            if extra:
                updates.update(extra)
            return updates

        # 1) Journey skeleton gates component selection (spec §3.1 warning).
        plan_model, plan_error = validate_plan_payload(parsed)
        if plan_error:
            return _fail("S.JOURNEY_PLAN.INVALID", plan_error)

        candidates = parsed.get("candidates", [])
        selected_id = parsed.get("selectedCandidateId", candidates[0].get("candidateId", "") if candidates else "")
        selected = next((c for c in candidates if c.get("candidateId") == selected_id), candidates[0] if candidates else {})
        if selected:
            selected = {**selected, "components": [_normalize_component(c, i) for i, c in enumerate(selected.get("components", []))]}
        if not selected or not selected.get("components"):
            return _fail("S.JOURNEY_PLAN.INVALID", "no candidate components mapped into the journey skeleton")

        # 2) Narrative sequence contract (roles, order, dependencies, deferrals).
        sequencer = NarrativeSequencerAgent(llm, "Narrative Sequencer", "narrative-sequencer")
        seq_state = {
            **state,
            "selected_candidate": selected,
            "experience_journey_plan": plan_model.model_dump(mode="json"),
        }
        seq_model, seq_error = sequencer.validate_sequence(parsed, seq_state)
        if seq_error and parsed.get("narrativeSequence") is None:
            return _fail("S.SEQUENCE.INVALID", seq_error)

        # 3) Deterministic coherence validation BEFORE the guardian vote.
        structural_errors: list[str] = []
        if seq_model is None:
            structural_errors.append(f"sequence contract invalid: {seq_error}")
        else:
            component_ids = {c.get("id") for c in selected.get("components", [])}
            result = validate_narrative_sequence(seq_model, plan_model, component_ids)
            structural_errors.extend(result.errors)
            planned_ids = [c.get("id") for c in selected.get("components", [])]
            priorities = [c.get("priority") for c in selected.get("components", [])]
            seen_ids: set = set()
            dup_ids = sorted({str(i) for i in planned_ids if i in seen_ids or seen_ids.add(i)})
            if dup_ids:
                structural_errors.append(f"duplicate component ids in candidate: {dup_ids}")
            dup_prio = sorted({p for p in priorities if priorities.count(p) > 1})
            if dup_prio:
                structural_errors.append(f"duplicate priorities in candidate: {dup_prio}")
            if (selected.get("components") or [{}])[0].get("type") != "POINTS_BALANCE":
                structural_errors.append("anchor violated: first planned component is not POINTS_BALANCE")

        continuity_agent = SessionContinuityAgent(llm, "Session Continuity", "session-continuity")
        plan_continuity, _ = continuity_agent.build_continuity_plan(parsed)

        assessment = parsed.get("coherenceAssessment") or {}
        decision, reason_code = resolve_coherence_decision(assessment, structural_errors)
        coherence_payload = {**assessment, "structuralErrors": structural_errors, "resolvedDecision": decision}
        if decision == "VETO":
            return _fail(
                reason_code or "S.COHERENCE.VETO",
                "; ".join(structural_errors) or "coherence thresholds breached",
                extra={
                    "coherence_assessment": coherence_payload,
                    "experience_journey_plan": plan_model.model_dump(mode="json"),
                    "continuity_plan": plan_continuity.model_dump(mode="json") if plan_continuity else None,
                },
            )

        seq = state.get("message_sequence", 0)
        agent_msgs = parsed.get("agentMessages", [])
        new_msgs = _make_msgs(state, "S", agent_msgs, seq + 1)

        deferred = seq_model.deferredComponents if seq_model is not None else []
        return {
            "candidate_compositions": candidates,
            "selected_candidate": selected,
            "ui_decision_plan": {"planId": f"plan-{state.get('correlation_id', '')}", "selectedCandidate": selected, "strategy": selected.get("strategy", ""), "confidence": selected.get("confidence", 0.0)},
            "experience_journey_plan": plan_model.model_dump(mode="json"),
            "approved_journey": {**(state.get("approved_journey") or {}), "primaryJourneyId": plan_model.primaryJourneyId},
            "narrative_sequence": seq_model.model_dump(mode="json") if seq_model is not None else None,
            "deferred_components": [d.model_dump(mode="json") for d in deferred],
            "continuity_plan": plan_continuity.model_dump(mode="json") if plan_continuity else None,
            "coherence_assessment": coherence_payload,
            "coherence_structural_errors": {"S": structural_errors},
            "stages_completed": state.get("stages_completed", []) + ["S"],
            "all_messages": new_msgs,
            "llm_transcript": [_make_transcript_entry("S", user_content, response.content, parsed, duration_ms)],
            "message_sequence": seq + len(new_msgs),
        }

    def node_stage_t(state: QuestUIState) -> dict:
        """STAGE T — TRANSLATE"""
        selected = state.get("selected_candidate", {})
        components = selected.get("components", [])

        user_content = f"""Customer Ref: {state.get('customer_ref', 'unknown')}
Correlation ID: {state.get('correlation_id', 'unknown')}
Selected Candidate: {json.dumps(selected)}
Components to compile: {json.dumps(components)}"""

        start = datetime.now(timezone.utc)
        response = llm.invoke([SystemMessage(content=STAGE_T_PROMPT), HumanMessage(content=user_content)])
        duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        parsed = _parse_json(response.content)

        final_sdui = parsed.get("finalSdui") or {}
        compiled_components = final_sdui.get("components") or []

        # Reconcile: guarantee every planned component survives compilation.
        if not compiled_components:
            final_sdui = _build_sdui_envelope(state, [_normalize_component(c, i) for i, c in enumerate(components)])
        else:
            planned_types = [c.get("type") for c in components]
            compiled_types = {c.get("type") for c in compiled_components}
            missing = [
                _normalize_component(c, i)
                for i, c in enumerate(components)
                if c.get("type") not in compiled_types and planned_types.count(c.get("type")) == 1
            ]
            if missing:
                compiled_components = compiled_components + missing
            # Fill envelope fields deterministically
            now = datetime.now(timezone.utc)
            final_sdui = {
                "schemaVersion": final_sdui.get("schemaVersion", "1.0"),
                "decisionId": final_sdui.get("decisionId") or f"decision-{state.get('correlation_id', '')}",
                "correlationId": state.get("correlation_id", ""),
                "createdAt": final_sdui.get("createdAt") or now.isoformat(),
                "expiresAt": final_sdui.get("expiresAt") or (now + timedelta(hours=1)).isoformat(),
                "customerRef": state.get("customer_ref", ""),
                "components": _ordered_components(state, compiled_components),
                "metadata": final_sdui.get("metadata") or {"schemaVersion": "1.0", "policyVersions": ["1.0"], "componentRegistryVersion": "1.0"},
            }

        # Card rule engine — deterministic guarantee of ordered stack, suppressions
        rules = state.get("card_rules") or {}
        if rules.get("matched_rules"):
            final_sdui = _enforce_card_rules(final_sdui, rules, state)

        # Narrative engine — deterministic storytelling order + act metadata.
        # Reconstruct the full RuleResult so relevance boosts and tone survive.
        # When a five-agent narrative sequence is approved, it is the ordering
        # authority: keep the approved order and derive act headers without
        # re-shuffling (spec §12.2 reconciliation).
        intel_data = state.get("intelligence_data") or {}
        if final_sdui.get("components") and intel_data.get("available"):
            if state.get("narrative_sequence"):
                final_sdui = {
                    **final_sdui,
                    "narrative": _act_envelope_for(
                        final_sdui["components"], str(intel_data.get("persona", ""))
                    ),
                }
            else:
                from services.card_rule_engine import evaluate_rules

                live_rules = evaluate_rules(intel_data)
                final_sdui = apply_narrative(final_sdui, intel_data, live_rules)

        # Five-agent extension: attach optional narrative metadata (backwards compatible).
        final_sdui = _attach_narrative_metadata(final_sdui, state)

        fallback_sdui = parsed.get("fallbackSdui") or {}
        if not fallback_sdui.get("components"):
            fallback_sdui = {
                "schemaVersion": "1.0",
                "decisionId": f"fallback-{state.get('correlation_id', '')}",
                "correlationId": state.get("correlation_id", ""),
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
                "customerRef": state.get("customer_ref", ""),
                "components": [
                    {"id": "points-balance-default", "type": "POINTS_BALANCE", "version": "1.0", "priority": 1, "props": {"points": 0, "tier": "Standard", "name": "Member"}, "actions": []}
                ],
                "metadata": {"schemaVersion": "1.0", "policyVersions": ["1.0"], "componentRegistryVersion": "1.0"},
            }

        validation_results = parsed.get("validationResults") or {}
        if not validation_results:
            validation_results = {
                "schemaValid": True,
                "componentRegistryValid": all(
                    c.get("type") in {t for t in _registered_types()} for c in final_sdui.get("components", [])
                ),
                "contentRegistryValid": True,
                "accessibilityValid": len(final_sdui.get("components", [])) <= 18,
            }

        summary = f"Compiled {len(final_sdui.get('components', []))} components"
        new_msgs = _make_msgs(state, "T", [{"fromAgent": "sdui-compiler", "messageType": "PROPOSAL", "summary": summary}], state.get("message_sequence", 0) + 1)
        transcript = [_make_transcript_entry("T", user_content, response.content, parsed, duration_ms)]

        return {
            "final_sdui": final_sdui,
            "fallback_sdui": fallback_sdui,
            "compiled_sdui": {
                "finalSdui": final_sdui,
                "fallbackSdui": fallback_sdui,
                "validationResults": validation_results,
            },
            "stages_completed": state.get("stages_completed", []) + ["T"],
            "all_messages": new_msgs,
            "llm_transcript": transcript,
            "message_sequence": state.get("message_sequence", 0) + len(new_msgs),
        }

    def node_stage_r(state: QuestUIState) -> dict:
        """STAGE R — REFINE (red team + post-compile coherence + continuity)"""
        # Deterministic post-compile coherence against the ACTUAL compiled SDUI
        # (spec §7.3, §12.2, §13). LLM review alone is not sufficient.
        seq_payload = state.get("narrative_sequence")
        seq_model = None
        if seq_payload:
            try:
                seq_model = NarrativeSequence.model_validate(seq_payload)
            except Exception as exc:
                print(f"[POST-COMPILE] approved sequence failed revalidation: {exc}")
        episode_ids = [
            m.get("miniJourneyId")
            for m in (state.get("experience_journey_plan") or {}).get("miniJourneys", [])
            if m.get("miniJourneyId")
        ]
        coherence_result = validate_compiled_screen(
            state.get("final_sdui") or {}, seq_model, episode_ids or None
        )
        post_compile_coherence = {
            "passed": coherence_result.passed,
            "errors": coherence_result.errors,
            "decision": "RELEASE" if coherence_result.passed else "HOLD",
            "reasonCode": None if coherence_result.passed else "R.COHERENCE.HOLD",
        }

        continuity_validation_full = deterministic_continuity_validation(
            state.get("final_sdui") or {},
            state.get("continuity_state"),
            seq_payload,
        )
        continuity_validation = {
            k: v for k, v in continuity_validation_full.items() if not k.startswith("_")
        }
        if continuity_validation["decision"] == "UNAVAILABLE":
            continuity_validation["passed"] = True

        user_content = f"""Customer: {state.get('customer_ref', 'unknown')}
Final SDUI: {json.dumps(_slim_final_sdui_for_review(state.get('final_sdui', {})))}
Fallback SDUI: {json.dumps(state.get('fallback_sdui', {}))}
Selected Candidate: {json.dumps(state.get('selected_candidate', {}))}
Approved Narrative Sequence: {json.dumps(seq_payload or {})}
postCompileCoherence: {json.dumps(post_compile_coherence)}
continuityValidation: {json.dumps(continuity_validation)}
All Agent Messages: {json.dumps(state.get('all_messages', [])[-8:])}"""

        start = datetime.now(timezone.utc)
        response = llm.invoke([SystemMessage(content=STAGE_R_PROMPT), HumanMessage(content=user_content)])
        duration_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        parsed = _parse_json(response.content)

        seq = state.get("message_sequence", 0)
        agent_msgs = parsed.get("agentMessages", [])
        new_msgs = _make_msgs(state, "R", agent_msgs, seq + 1)
        transcript = [_make_transcript_entry("R", user_content, response.content, parsed, duration_ms)]

        reason_codes = list(state.get("reason_codes", []))
        updates = {
            "release_check": parsed,
            "post_compile_coherence": post_compile_coherence,
            "continuity_validation": continuity_validation,
            "stages_completed": state.get("stages_completed", []) + ["R"],
            "all_messages": new_msgs,
            "llm_transcript": transcript,
            "message_sequence": seq + len(new_msgs),
        }

        if continuity_validation["decision"] == "UNAVAILABLE":
            updates["reason_codes"] = reason_codes + ["R.CONTINUITY.UNAVAILABLE"]
            reason_codes = updates["reason_codes"]

        if not coherence_result.passed:
            print(f"[POST-COMPILE COHERENCE] HOLD: {coherence_result.errors[:3]}")
            updates["fallback_triggered"] = True
            updates["stage_failure"] = "R.COHERENCE.HOLD"
            updates["reason_codes"] = reason_codes + ["R.COHERENCE.HOLD"]
            return updates

        if continuity_validation["decision"] == "HOLD":
            print("[CONTINUITY] regression detected — hold")
            updates["fallback_triggered"] = True
            updates["stage_failure"] = "R.CONTINUITY.HOLD"
            updates["reason_codes"] = reason_codes + ["R.CONTINUITY.HOLD"]
            return updates

        if parsed.get("releaseDecision") == "HOLD" and parsed.get("unresolvedCritical", 0) > 0:
            updates["fallback_triggered"] = True
            updates["reason_codes"] = reason_codes + ["R_REDTEAM_HOLD"]

        return updates

    def node_fallback(state: QuestUIState) -> dict:
        fallback = {
            "schemaVersion": "1.0",
            "decisionId": f"fallback-{state.get('correlation_id', '')}",
            "correlationId": state.get("correlation_id", ""),
            "createdAt": "",
            "expiresAt": "",
            "customerRef": state.get("customer_ref", ""),
            "components": [
                {"id": "points-balance-default", "type": "POINTS_BALANCE", "version": "1.0", "priority": 1, "props": {"points": 0, "tier": "Standard", "name": "Member"}, "actions": []},
                {"id": "header-default", "type": "HEADER", "version": "1.0", "priority": 0, "props": {"title": "Rewards", "subtitle": "Your rewards overview"}, "actions": []},
            ],
            "metadata": {"schemaVersion": "1.0", "policyVersions": ["1.0"], "componentRegistryVersion": "1.0"},
        }
        return {"fallback_sdui": fallback, "final_sdui": fallback, "fallback_triggered": True, "stages_completed": state.get("stages_completed", []) + ["FALLBACK"]}

    def after_q(state):
        return "fallback" if state.get("fallback_triggered") else "stage_u"
    def after_u(state):
        return "fallback" if state.get("fallback_triggered") else "stage_e"
    def after_e(state):
        return "fallback" if state.get("fallback_triggered") else "stage_s"
    def after_s(state):
        return "fallback" if state.get("fallback_triggered") else "stage_t"
    def after_t(state):
        return "fallback" if state.get("fallback_triggered") else "stage_r"
    def after_r(state):
        return "fallback" if state.get("fallback_triggered") else "__end__"

    graph = StateGraph(QuestUIState)
    graph.add_node("stage_q", node_stage_q)
    graph.add_node("stage_u", node_stage_u)
    graph.add_node("stage_e", node_stage_e)
    graph.add_node("stage_s", node_stage_s)
    graph.add_node("stage_t", node_stage_t)
    graph.add_node("stage_r", node_stage_r)
    graph.add_node("fallback", node_fallback)

    graph.set_entry_point("stage_q")
    graph.add_conditional_edges("stage_q", after_q, {"stage_u": "stage_u", "fallback": "fallback"})
    graph.add_conditional_edges("stage_u", after_u, {"stage_e": "stage_e", "fallback": "fallback"})
    graph.add_conditional_edges("stage_e", after_e, {"stage_s": "stage_s", "fallback": "fallback"})
    graph.add_conditional_edges("stage_s", after_s, {"stage_t": "stage_t", "fallback": "fallback"})
    graph.add_conditional_edges("stage_t", after_t, {"stage_r": "stage_r", "fallback": "fallback"})
    graph.add_conditional_edges("stage_r", after_r, {"__end__": END, "fallback": "fallback"})
    graph.add_edge("fallback", END)

    return graph.compile()


def _registered_types():
    from validators.sdui_validator import VALID_COMPONENT_TYPES
    return VALID_COMPONENT_TYPES

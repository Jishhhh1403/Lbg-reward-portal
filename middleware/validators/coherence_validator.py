"""Deterministic coherence validator (spec §13).

Structural invariants cannot be left to LLM review. These checks run:
  1. In Stage S — on the approved journey plan + narrative sequence + mapped
     components, BEFORE the Coherence Guardian votes.
  2. In Stage R — on the actual compiled SDUI, to detect divergence introduced
     by mechanical compilation and card-rule enforcement.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterable, Optional

from schemas.narrative import (
    ExperienceJourneyPlan,
    NarrativeRole,
    NarrativeSequence,
)

ANCHOR_COMPONENT_TYPE = "POINTS_BALANCE"

ACTION_ROLES = {NarrativeRole.ACTION}
CONSEQUENCE_ROLES = {
    NarrativeRole.FEEDBACK,
    NarrativeRole.PAYOFF,
    NarrativeRole.CONTINUATION,
}


@dataclass
class ValidationResult:
    passed: bool = True
    errors: list[str] = field(default_factory=list)

    def fail(self, message: str) -> None:
        self.passed = False
        self.errors.append(message)


def assert_unique(ids: Iterable[Any], errors: list[str]) -> None:
    """Every component/priority id must be unique."""
    seen: set = set()
    duplicates: set = set()
    for item in ids:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    if duplicates:
        errors.append(f"duplicate ids or priorities: {sorted(map(str, duplicates))}")


def assert_component_refs_resolve(
    dependencies: Iterable[str],
    known_refs: set,
    errors: list[str],
) -> None:
    """dependsOn / resolves / transitions must point at known component refs."""
    for ref in dependencies:
        if ref not in known_refs:
            errors.append(f"unresolved component reference: {ref}")


def assert_no_orphans(
    screen: list[dict],
    sequence: Optional[NarrativeSequence],
    errors: list[str],
) -> None:
    """Every non-REFERENCE mainline component must belong to exactly one
    mini-journey via the narrative sequence."""
    if sequence is None:
        errors.append("no narrative sequence attached to screen")
        return
    sequenced_refs = {sc.componentRef for sc in sequence.components}
    for comp in screen:
        comp_id = comp.get("id", "")
        role = _role_for(comp_id, sequence)
        if comp_id not in sequenced_refs and role != NarrativeRole.REFERENCE:
            errors.append(f"orphan component (not in narrative sequence): {comp_id}")


def assert_anchor_preserved(screen: list[dict], anchor_type: str, errors: list[str]) -> None:
    """POINTS_BALANCE remains the constitutionally anchored first component."""
    if not screen:
        errors.append("screen has no components; anchor missing")
        return
    if screen[0].get("type") != anchor_type:
        found = screen[0].get("type", "UNKNOWN")
        errors.append(
            f"anchor violated: first component is {found}, expected {anchor_type}"
        )


def _role_for(component_ref: str, sequence: NarrativeSequence) -> Optional[NarrativeRole]:
    for sc in sequence.components:
        if sc.componentRef == component_ref:
            return sc.narrativeRole
    return None


def validate_journey_plan(plan: ExperienceJourneyPlan, mini_max: int, mini_min: int = 2) -> ValidationResult:
    """Schema-adjacent quality gate for the composed journey skeleton."""
    result = ValidationResult()
    episodes = plan.ordered_episodes()
    if len(episodes) < mini_min:
        result.fail(f"journey plan needs at least {mini_min} mini-journeys, got {len(episodes)}")
    if len(episodes) > mini_max:
        result.fail(f"journey plan exceeds cap of {mini_min}-{mini_max} mini-journeys ({len(episodes)})")
    ids = [m.miniJourneyId for m in episodes]
    errs: list[str] = []
    assert_unique(ids, errs)
    for e in errs:
        result.fail(e)
    orders = [m.order for m in episodes]
    if orders and sorted(orders) != list(range(min(orders), min(orders) + len(orders))):
        result.fail(f"mini-journey orders are not continuous: {orders}")
    known_ids = set(ids)
    for m in episodes:
        if not m.customerQuestion.strip():
            result.fail(f"mini-journey {m.miniJourneyId} has no customer question")
        if not m.entryCondition.strip():
            result.fail(f"mini-journey {m.miniJourneyId} has no entry condition")
        if m.transitionsTo and m.transitionsTo not in known_ids:
            # Tolerate terminal-style transitions the LLM may emit ("done", "end", etc.)
            # that the MiniJourney schema validator didn't catch (e.g. nested dict path).
            _terminal = {"done", "end", "none", "complete", "finish", "exit", "stop"}
            if m.transitionsTo.strip().lower() not in _terminal:
                result.fail(
                    f"mini-journey {m.miniJourneyId} transitionsTo unknown episode {m.transitionsTo}"
                )
    return result


# Invented role names seen in the wild -> safe canonical mapping. Anything
# unmapped falls back to REFERENCE (optional, can never be the dominant action).
_ROLE_SYNONYMS: dict[str, str] = {
    "SNAPSHOT": "ORIENTATION",
    "SUMMARY": "EVIDENCE",
    "TIP": "EVIDENCE",
    "HIGHLIGHT": "EVIDENCE",
    "REWARD": "PAYOFF",
    "PROGRESS": "ORIENTATION",
}


def repair_roles_in_payload(seq_payload: dict) -> tuple[dict, list[str]]:
    """Repair invented narrativeRole strings in a RAW sequence payload BEFORE
    pydantic parsing (the enum would otherwise reject the whole sequence).

    Ladder per component: exact value -> case-insensitive -> known synonym ->
    REFERENCE fallback. REFERENCE is safe by construction: optional, never the
    dominant action, exempt from ACTION-consequence chains.
    """
    notes: list[str] = []
    valid = {r.value for r in NarrativeRole}
    comps = seq_payload.get("components")
    if not isinstance(comps, list):
        return seq_payload, notes
    for i, c in enumerate(comps):
        if not isinstance(c, dict):
            continue
        raw = str(c.get("narrativeRole", "")).strip()
        if raw in valid:
            continue
        upper = raw.upper()
        if upper in valid:  # case-insensitive exact match
            notes.append(
                f"components[{i}] ({c.get('componentRef', '?')}): "
                f"normalised narrativeRole '{raw}' -> {upper}"
            )
            c["narrativeRole"] = upper
            continue
        target = _ROLE_SYNONYMS.get(upper, "REFERENCE")
        notes.append(
            f"components[{i}] ({c.get('componentRef', '?')}): "
            f"repaired narrativeRole '{raw}' -> {target}"
        )
        c["narrativeRole"] = target
    return seq_payload, notes


def sanitize_narrative_sequence(
    sequence: NarrativeSequence,
    journey_plan: Optional[ExperienceJourneyPlan] = None,
    component_type_map: Optional[dict[str, str]] = None,
) -> tuple[NarrativeSequence, list[str]]:
    """Deterministically repair `resolves` entries after parsing.

    Live models cite the mini-journey customer question text instead of its id;
    exact normalised question matches are rewritten to the episode id, anything
    still unresolvable is dropped. `dependsOn` is never touched — structurally
    load-bearing.

    Also repairs ACTION-role assignments on components that are inherently
    reference/trust cards (e.g. REWARDS_INSIGHT_CARD) and have no consequence
    follower — these would otherwise always trigger a sequence-contract veto.
    """
    notes: list[str] = []
    episode_ids: set = set()
    question_to_episode: dict[str, str] = {}
    if journey_plan:
        for m in journey_plan.miniJourneys:
            episode_ids.add(m.miniJourneyId)
            q = " ".join(m.customerQuestion.lower().split()).rstrip("?").strip()
            if q:
                question_to_episode[q] = m.miniJourneyId

    refs = {sc.componentRef for sc in sequence.components}
    rebuilt: list = []
    for sc in sequence.components:
        cleaned: list[str] = []
        for entry in sc.resolves:
            if entry in refs or entry in episode_ids:
                cleaned.append(entry)
                continue
            norm = " ".join(entry.lower().split()).rstrip("?").strip()
            target = question_to_episode.get(norm)
            if target:
                notes.append(f"rewrote resolves '{entry[:60]}' -> {target}")
                cleaned.append(target)
            else:
                notes.append(f"dropped unresolvable resolves entry '{entry[:60]}'")
        if cleaned != list(sc.resolves):
            sc = sc.model_copy(update={"resolves": cleaned})
        rebuilt.append(sc)

    # --- Repair ACTION roles that would always trigger a veto ---
    # The sequence contract requires every non-optional ACTION to have a
    # FEEDBACK/PAYOFF/CONTINUATION follower.  When the LLM mis-assigns ACTION
    # to a component that (a) is a known non-actionable type (TRUST-act cards)
    # or (b) has no consequence follower at all, the sequence always vetoes.
    # Deterministically downgrade these to EVIDENCE which is safe, non-actionable
    # and exempt from the consequence rule.
    _NON_ACTIONABLE_TYPES: set[str] = {
        "REWARDS_INSIGHT_CARD",
        "EDUCATIONAL_INSIGHT_CARD",
        "WHY_THIS_UI_CARD",
        "REWARD_PROVENANCE_CARD",
        "SYNC_STATUS_CARD",
        "PROGRAMME_CONNECTION_CARD",
        "PREFERENCES_CARD",
        "AUTO_RULES_CARD",
        "REWARD_ALLOCATION_CONTROL",
        "GIFT_DONATE_CARD",
        "BRAND_EXPLORER_CARD",
        "PARTNER_VALUE_COMPARISON",
        "REWARD_CHOICE_PANEL",
        "CONSOLIDATED_REWARD_WALLET",
    }
    ordered = sorted(rebuilt, key=lambda s: s.sequence)
    consequence_roles = {NarrativeRole.FEEDBACK, NarrativeRole.PAYOFF, NarrativeRole.CONTINUATION}
    primary_ref = sequence.primaryActionComponentRef
    for i, sc in enumerate(ordered):
        if sc.narrativeRole != NarrativeRole.ACTION:
            continue
        # Look up the real component type from the provided map.
        real_type = (component_type_map or {}).get(sc.componentRef, "")
        is_non_actionable = real_type in _NON_ACTIONABLE_TYPES
        # Check if there is a consequence follower in the same mini-journey
        has_consequence = any(
            n.narrativeRole in consequence_roles
            for n in ordered[i + 1:]
            if n.miniJourneyId == sc.miniJourneyId and not n.optional
        )
        # Repair if: (a) known non-actionable type, OR
        # (b) any ACTION without a consequence follower — the validator would
        #     reject it anyway, so repair proactively to avoid veto.
        # Never repair the primary action — if it has no consequence, that is
        # a genuine structural error that should veto.
        if sc.componentRef == primary_ref:
            continue
        if is_non_actionable or not has_consequence:
            repaired_role = NarrativeRole.REFERENCE if is_non_actionable else NarrativeRole.EVIDENCE
            rebuilt[i] = sc.model_copy(update={"narrativeRole": repaired_role})
            notes.append(
                f"repaired ACTION on {sc.componentRef} (type={real_type or '?'}) "
                f"-> {repaired_role.value} "
                f"({'non-actionable type' if is_non_actionable else 'no consequence follower'})"
            )

    payload = sequence.model_dump()
    payload["components"] = [c.model_dump() for c in rebuilt]
    return sequence.__class__(**payload), notes


def sanitize_sequence(
    seq_payload: dict,
    journey_plan: Optional[ExperienceJourneyPlan],
    parse_model_fn,
) -> tuple[Optional[NarrativeSequence], Optional[str], list[str]]:
    """One-stop pipeline used by the sequencer agent: repair roles in the raw
    payload, parse, rewrite resolves, ready for contract validation."""
    seq_payload, notes = repair_roles_in_payload(seq_payload)
    model, error = parse_model_fn(NarrativeSequence, seq_payload)
    if error:
        return None, error, notes
    model, more_notes = sanitize_narrative_sequence(model, journey_plan)
    return model, None, notes + more_notes


def validate_narrative_sequence(
    sequence: NarrativeSequence,
    journey_plan: Optional[ExperienceJourneyPlan] = None,
    component_ids: Optional[set] = None,
) -> ValidationResult:
    """Sequencing contract checks (spec §6.4 / §13.1)."""
    result = ValidationResult()
    seq_nums = [sc.sequence for sc in sequence.components]
    errs: list[str] = []
    assert_unique(seq_nums, errs)
    for e in errs:
        result.fail(e)
    if sorted(seq_nums) != list(range(1, len(seq_nums) + 1)):
        result.fail(f"sequence numbers are not a dense 1..N ordering: {sorted(seq_nums)}")

    refs = {sc.componentRef for sc in sequence.components}
    if component_ids is not None:
        unknown = refs - set(component_ids)
        for r in sorted(unknown):
            result.fail(f"sequence references unknown component: {r}")

    # dependsOn is strict component-graph wiring; resolves answers a customer
    # question and may target either a component ref or an episode id.
    resolve_targets: set = set(journey_plan.episode_ids()) if journey_plan else set()
    dep_refs: list[str] = []
    resolve_refs: list[str] = []
    for sc in sequence.components:
        dep_refs.extend(sc.dependsOn)
        resolve_refs.extend(sc.resolves)
    errs = []
    assert_component_refs_resolve(dep_refs, refs, errs)
    assert_component_refs_resolve(resolve_refs, refs | resolve_targets, errs)
    for e in errs:
        result.fail(e)

    # Exactly one dominant primary action.
    action_refs = [sc.componentRef for sc in sequence.components if sc.narrativeRole == NarrativeRole.ACTION]
    primary = sequence.primaryActionComponentRef
    if primary not in refs:
        result.fail(f"primaryActionComponentRef {primary} is not part of the sequence")
    elif len(action_refs) > 1 and primary not in action_refs:
        result.fail("primary action ref does not match any ACTION-role component")

    # Dependencies point backwards in rendered order.
    order_index = {sc.componentRef: sc.sequence for sc in sequence.components}
    for sc in sequence.components:
        for dep in sc.dependsOn:
            if dep in order_index and order_index[dep] >= sc.sequence:
                result.fail(
                    f"dependency {dep} does not precede {sc.componentRef} in rendered sequence"
                )

    # Every ACTION must be followed by FEEDBACK/PAYOFF/CONTINUATION.
    ordered = sorted(sequence.components, key=lambda s: s.sequence)
    for i, sc in enumerate(ordered):
        if sc.narrativeRole != NarrativeRole.ACTION or sc.optional:
            continue
        follower = next((n for n in ordered[i + 1:] if not n.optional), None)
        same_episode_followers = [
            n for n in ordered[i + 1:]
            if n.miniJourneyId == sc.miniJourneyId and not n.optional
        ]
        ok = (
            (follower and follower.narrativeRole in CONSEQUENCE_ROLES)
            or bool([n for n in same_episode_followers if n.narrativeRole in CONSEQUENCE_ROLES])
        )
        if not ok:
            result.fail(
                f"ACTION {sc.componentRef} has no FEEDBACK/PAYOFF/CONTINUATION consequence"
            )

    # REFERENCE content can never be the dominant action.
    if _role_for(primary, sequence) == NarrativeRole.REFERENCE:
        result.fail("REFERENCE component designated as primary action")

    # Deferred components must be absent from the mainline.
    deferred = {d.componentRef for d in sequence.deferredComponents}
    overlap = deferred & refs
    for r in sorted(overlap):
        result.fail(f"deferred component also present in mainline: {r}")

    # Non-reference components belong to exactly one mini-journey.
    episode_ids = set(journey_plan.episode_ids()) if journey_plan else None
    membership: dict[str, int] = {}
    for sc in sequence.components:
        if sc.narrativeRole == NarrativeRole.REFERENCE:
            continue
        membership[sc.componentRef] = membership.get(sc.componentRef, 0) + 1
    for ref, count in membership.items():
        if count > 1:
            result.fail(f"component {ref} assigned to multiple mini-journeys")
    if episode_ids is not None:
        for sc in sequence.components:
            if sc.miniJourneyId not in episode_ids:
                result.fail(
                    f"component {sc.componentRef} references unknown mini-journey {sc.miniJourneyId}"
                )
    return result


def validate_compiled_screen(
    final_sdui: dict,
    sequence: Optional[NarrativeSequence],
    approved_episode_ids: Optional[list[str]] = None,
) -> ValidationResult:
    """Post-compile coherence: did deterministic compilation break the story?"""
    result = ValidationResult()
    components: list[dict] = final_sdui.get("components", [])
    errors: list[str] = []
    ids = [c.get("id") for c in components]
    priorities = [c.get("priority") for c in components]
    assert_unique(ids, errors)
    assert_unique(priorities, errors)
    assert_anchor_preserved(components, ANCHOR_COMPONENT_TYPE, errors)
    for e in errors:
        result.fail(e)

    if sequence is None:
        result.fail("approved narrative sequence missing from state")
        return result

    compiled_ids = [c.get("id") for c in components]
    deferred = {d.componentRef for d in sequence.deferredComponents}
    for ref in sorted(deferred):
        if ref in compiled_ids:
            result.fail(f"deferred component leaked into compiled screen: {ref}")

    approved_order = [sc.componentRef for sc in sorted(sequence.components, key=lambda s: s.sequence)]
    compiled_approved_order = [cid for cid in compiled_ids if cid in set(approved_order)]
    if compiled_approved_order != approved_order:
        diverged_at = next(
            (
                i
                for i, (a, b) in enumerate(zip(approved_order, compiled_approved_order))
                if a != b
            ),
            min(len(approved_order), len(compiled_approved_order)),
        )
        result.fail(
            "compiled order diverges from approved narrative sequence "
            f"(first mismatch at position {diverged_at}: approved={approved_order[diverged_at:diverged_at+1]}, "
            f"compiled={compiled_approved_order[diverged_at:diverged_at+1]})"
        )

    if approved_episode_ids:
        for c in components:
            meta = c.get("narrative") or (c.get("props", {}) or {}).get("narrative", {})
            mj = meta.get("miniJourneyId") if isinstance(meta, dict) else None
            if mj and mj not in set(approved_episode_ids):
                result.fail(
                    f"compiled component {c.get('id')} references unknown mini-journey {mj}"
                )
    return result


def assess_coherence_metrics(
    validation: ValidationResult,
    assessment_dict: dict,
    thresholds: dict,
    default_veto_code: str = "S.COHERENCE.VETO",
) -> tuple[str, Optional[str]]:
    """Combine the guardian's scored assessment with hard structural facts.

    Returns (decision, reasonCode). Structural failures force VETO regardless
    of scores; threshold breaches per §7.4 also veto.
    """
    if not validation.passed:
        return "VETO", default_veto_code
    metric_failures = [
        f"{metric}:{score}<{thresholds[metric]}"
        for metric, score in (
            ("storyClarity", assessment_dict.get("storyClarity")),
            ("journeyContinuity", assessment_dict.get("journeyContinuity")),
            ("miniJourneyCompleteness", assessment_dict.get("miniJourneyCompleteness")),
            ("transitionStrength", assessment_dict.get("transitionStrength")),
            ("actionOutcomeContinuity", assessment_dict.get("actionOutcomeContinuity")),
        )
        if isinstance(score, (int, float)) and score < thresholds.get(metric, 0)
    ]
    if metric_failures:
        return "VETO", default_veto_code
    if assessment_dict.get("contentDistractionRisk") == "High":
        return "VETO", default_veto_code
    if assessment_dict.get("primaryActionClarity") == "FAIL":
        return "VETO", default_veto_code
    if assessment_dict.get("orphanComponents"):
        return "VETO", default_veto_code
    declared_decision = assessment_dict.get("decision", "PASS")
    if declared_decision == "VETO":
        return "VETO", assessment_dict.get("reasonCode") or default_veto_code
    return declared_decision, assessment_dict.get("reasonCode")

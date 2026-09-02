import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from schemas.objective import (
    ObjectiveGenerateRequest,
    ObjectiveStage,
    ObjectiveWallet,
    BrandBalance,
)
from services.objective_service import ObjectiveService, _hard_fact_constraints


@pytest.fixture
def service():
    svc = ObjectiveService()
    svc._mock_mode = True
    return svc


@pytest.fixture
def wallet():
    return ObjectiveWallet(
        totalPoints=5000,
        tier="Gold",
        lbgCoins=5000,
        brandsConnected=2,
        pointsByBrand=[
            BrandBalance(brandName="Cavendish Online", points=2000),
            BrandBalance(brandName="Alpha Medical", points=3200),
        ],
    )


def _make_req(wallet, stage, plan=None, tool_request=None):
    return ObjectiveGenerateRequest(
        customerReference="cust_1",
        objectiveText="I want to redeem my points for the best value",
        stage=stage,
        selectedPlan=plan,
        toolRequest=tool_request,
        wallet=wallet,
    )


@pytest.mark.asyncio
async def test_summary_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.SUMMARY))
    assert res["status"] == "PERSONALIZED"
    assert res["screen"]["summary"]


@pytest.mark.asyncio
async def test_constraints_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.CONSTRAINTS))
    assert res["status"] == "PERSONALIZED"
    assert len(res["screen"]["constraints"]) == 3


@pytest.mark.asyncio
async def test_constraints_stage_is_generic_and_brand_free(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.CONSTRAINTS))
    joined = " ".join(c["text"] for c in res["screen"]["constraints"]).lower()
    assert "cavendish" not in joined
    assert "alpha medical" not in joined
    assert "insurance" in joined


@pytest.mark.asyncio
async def test_opportunities_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.OPPORTUNITIES))
    assert res["status"] == "PERSONALIZED"
    assert len(res["screen"]["opportunities"]) >= 1
    assert res["screen"]["opportunities"][0]["partner"]


@pytest.mark.asyncio
async def test_strategies_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.STRATEGIES))
    assert res["status"] == "PERSONALIZED"
    assert len(res["screen"]["strategies"]) >= 1


@pytest.mark.asyncio
async def test_strategies_adapt_to_coplan_tool_request(service, wallet):
    res = await service.generate(
        _make_req(wallet, ObjectiveStage.STRATEGIES, tool_request="Compare both plans side by side on ease and value.")
    )
    assert res["status"] == "PERSONALIZED"
    strategies = res["screen"]["strategies"]
    assert len(strategies) == 2
    titles = [s["title"] for s in strategies]
    assert "Simplicity Plan" in titles
    assert "Maximum Value Plan" in titles
    assert any("Compare both plans" in (s["description"] or "") for s in strategies)


@pytest.mark.asyncio
async def test_evidence_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.EVIDENCE, plan="simplicity"))
    assert res["status"] == "PERSONALIZED"
    assert res["screen"]["evidence"]["summary"]
    assert len(res["screen"]["evidence"]["factors"]) >= 1


@pytest.mark.asyncio
async def test_evidence_differs_per_plan(service, wallet):
    simplicity = await service.generate(_make_req(wallet, ObjectiveStage.EVIDENCE, plan="simplicity"))
    max_redeem = await service.generate(_make_req(wallet, ObjectiveStage.EVIDENCE, plan="max-redeem"))
    sim = simplicity["screen"]["evidence"]["summary"]
    mx = max_redeem["screen"]["evidence"]["summary"]
    assert sim != mx
    assert "simple" in sim.lower() and "current LBG coins" in sim
    assert "maximum value plan" in mx.lower() and "convert existing rewards points" in mx.lower()


@pytest.mark.asyncio
async def test_execution_max_redeem_yields_three_steps(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.EXECUTION, plan="max-redeem"))
    assert res["status"] == "PERSONALIZED"
    assert len(res["screen"]["executionSteps"]) == 3


@pytest.mark.asyncio
async def test_execution_simplicity_yields_two_steps(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.EXECUTION, plan="simplicity"))
    assert res["status"] == "PERSONALIZED"
    assert len(res["screen"]["executionSteps"]) == 2


def test_hard_fact_constraints_are_objective_specific():
    facts = _hard_fact_constraints("Pay for my insurance using LBG coins while maximising the value")
    texts = [c.text.lower() for c in facts]
    assert len(facts) == 3
    assert any("insurance premium using available lbg coins" in t for t in texts)
    assert not any("keep it simple" in t for t in texts)


@pytest.mark.asyncio
async def test_constraints_guard_replaces_generic_filler(service, wallet):
    # Simulate an LLM returning a loose generic constraint that is not tied to
    # the objective; the guard must drop it and anchor on the objective's facts.
    svc = ObjectiveService()
    req = ObjectiveGenerateRequest(
        customerReference="cust_1",
        objectiveText="Pay for my insurance using LBG coins while maximising the value",
        stage=ObjectiveStage.CONSTRAINTS,
        selectedPlan=None,
        wallet=wallet,
    )
    content = {
        "constraints": [
            {"id": "c1", "text": "Pay the insurance premium using available LBG coins", "applied": True},
            {"id": "c2", "text": "Maximise the value gained from the rewards balance", "applied": True},
            {"id": "c3", "text": "Keep the redemption process simple and straight forward", "applied": True},
        ]
    }
    screen = svc._build_screen(req, content)
    texts = [c.text.lower() for c in screen.constraints]
    assert len(screen.constraints) == 3
    assert not any("keep the redemption process simple" in t for t in texts)
    assert any("connected brand points" in t for t in texts)

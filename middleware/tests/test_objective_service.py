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
from services.objective_service import ObjectiveService


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


def _make_req(wallet, stage, plan=None):
    return ObjectiveGenerateRequest(
        customerReference="cust_1",
        objectiveText="I want to redeem my points for the best value",
        stage=stage,
        selectedPlan=plan,
        wallet=wallet,
    )


@pytest.mark.asyncio
async def test_summary_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.SUMMARY))
    assert res["status"] == "PERSONALIZED"
    assert res["components"]
    types = {c["type"] for c in res["components"]}
    assert "OBJECTIVE_SUMMARY_CARD" in types


@pytest.mark.asyncio
async def test_constraints_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.CONSTRAINTS))
    assert res["status"] == "PERSONALIZED"
    assert res["components"]
    types = {c["type"] for c in res["components"]}
    assert "OBJECTIVE_CONSTRAINTS" in types


@pytest.mark.asyncio
async def test_opportunities_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.OPPORTUNITIES))
    assert res["status"] == "PERSONALIZED"
    assert res["components"]
    types = {c["type"] for c in res["components"]}
    assert "OBJECTIVE_OPPORTUNITIES" in types


@pytest.mark.asyncio
async def test_strategies_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.STRATEGIES))
    assert res["status"] == "PERSONALIZED"
    assert res["components"]
    types = {c["type"] for c in res["components"]}
    assert "OBJECTIVE_STRATEGIES" in types


@pytest.mark.asyncio
async def test_evidence_stage(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.EVIDENCE, plan="simplicity"))
    assert res["status"] == "PERSONALIZED"
    evidence_comp = next(c for c in res["components"] if c["type"] == "OBJECTIVE_EVIDENCE")
    assert evidence_comp["props"]["summary"]
    assert len(evidence_comp["props"]["factors"]) >= 1


@pytest.mark.asyncio
async def test_execution_max_redeem_yields_two_steps(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.EXECUTION, plan="max-redeem"))
    assert res["status"] == "PERSONALIZED"
    steps_comp = next(c for c in res["components"] if c["type"] == "OBJECTIVE_EXECUTION_STEPS")
    assert len(steps_comp["props"]["items"]) == 2


@pytest.mark.asyncio
async def test_execution_simplicity_yields_one_step(service, wallet):
    res = await service.generate(_make_req(wallet, ObjectiveStage.EXECUTION, plan="simplicity"))
    assert res["status"] == "PERSONALIZED"
    steps_comp = next(c for c in res["components"] if c["type"] == "OBJECTIVE_EXECUTION_STEPS")
    assert len(steps_comp["props"]["items"]) == 1

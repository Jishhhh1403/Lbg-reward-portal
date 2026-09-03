"""Partner reward offers data store and filtering service.

Contains dummy partner reward offers for different objectives and provides
filtering logic to shortlist/reject offers based on applied constraints.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from schemas.objective import RewardOpportunity


@dataclass
class PartnerOffer:
    """Internal representation of a partner reward offer with constraint metadata."""
    id: str
    title: str
    description: str
    partner: str
    estimated_value: str
    cashback: Optional[str] = None
    conversion_rate: Optional[str] = None
    transaction_fee: Optional[str] = None
    offer_type: Optional[str] = None
    tags: list[str] = field(default_factory=list)

    def to_opportunity(self) -> RewardOpportunity:
        return RewardOpportunity(
            id=self.id,
            title=self.title,
            description=self.description,
            partner=self.partner,
            estimatedValue=self.estimated_value,
            constraints=self.tags,
            cashback=self.cashback,
            conversionRate=self.conversion_rate,
            transactionFee=self.transaction_fee,
            offerType=self.offer_type,
        )


# ---------------------------------------------------------------------------
# Partner reward offers catalog
# ---------------------------------------------------------------------------

PARTNER_OFFERS: dict[str, list[PartnerOffer]] = {
    "insurance_coins_fixed": [
        # Shortlisted offers (meet the fixed constraints)
        PartnerOffer(
            id="opp-1",
            title="Cavendish Insurance Cashback",
            description="Pay your insurance premium with LBG coins and receive £70 cashback. No conversion fee with a 10:1 coin-to-GBP rate.",
            partner="Cavendish Online",
            estimated_value="£70 cashback",
            cashback="£70",
            conversion_rate="10:1",
            transaction_fee="£0",
            offer_type="insurance_payment",
            tags=["cashback_70", "no_fee", "rate_10_1", "insurance"],
        ),
        PartnerOffer(
            id="opp-2",
            title="Alpha Medical Points Boost",
            description="Convert Alpha Medical points to LBG coins at 10:1 rate, then pay insurance with £70 cashback reward.",
            partner="Alpha Medical",
            estimated_value="£85 total",
            cashback="£70",
            conversion_rate="10:1",
            transaction_fee="£0",
            offer_type="points_conversion",
            tags=["cashback_70", "no_fee", "rate_10_1", "insurance", "conversion"],
        ),
        PartnerOffer(
            id="opp-3",
            title="LBG Direct Insurance Payment",
            description="Use your LBG coin balance directly for insurance payment. £70 cashback applied automatically.",
            partner="LBG Coins",
            estimated_value="£70 cashback",
            cashback="£70",
            conversion_rate="10:1",
            transaction_fee="£0",
            offer_type="direct_payment",
            tags=["cashback_70", "no_fee", "rate_10_1", "insurance"],
        ),
        PartnerOffer(
            id="opp-4",
            title="Cavendish Premium Rewards",
            description="Premium insurance payment route with guaranteed £70 cashback and zero fees.",
            partner="Cavendish Online",
            estimated_value="£75 value",
            cashback="£70",
            conversion_rate="10:1",
            transaction_fee="£0",
            offer_type="insurance_payment",
            tags=["cashback_70", "no_fee", "rate_10_1", "insurance", "premium"],
        ),
        # Rejected offers (do NOT meet the fixed constraints)
        # opp-5: only £50 cashback — rejected under strict (needs £70), but
        # shortlisted once the cashback constraint is relaxed to £50+.
        PartnerOffer(
            id="opp-5",
            title="Cavendish Standard Cashback",
            description="Standard insurance payment with £50 cashback. 12:1 conversion rate, no fee.",
            partner="Cavendish Online",
            estimated_value="£50 cashback",
            cashback="£50",
            conversion_rate="12:1",
            transaction_fee="£0",
            offer_type="insurance_payment",
            tags=["cashback_50", "no_fee", "rate_12_1", "insurance"],
        ),
        PartnerOffer(
            id="opp-6",
            title="Alpha Medical Basic Conversion",
            description="Convert points at 12:1 rate with a £3 transaction fee. Only £45 cashback.",
            partner="Alpha Medical",
            estimated_value="£45 cashback",
            cashback="£45",
            conversion_rate="12:1",
            transaction_fee="£3",
            offer_type="points_conversion",
            tags=["cashback_45", "has_fee", "rate_12_1", "insurance", "conversion"],
        ),
        PartnerOffer(
            id="opp-7",
            title="Weekend Dining Deal",
            description="Use 1,500 points for a weekend dining experience. Not applicable to insurance payments.",
            partner="Cavendish Online",
            estimated_value="£15",
            cashback=None,
            conversion_rate=None,
            transaction_fee=None,
            offer_type="dining",
            tags=["dining", "no_insurance"],
        ),
        PartnerOffer(
            id="opp-8",
            title="Cavendish Travel Voucher",
            description="Redeem points for travel vouchers. 20:1 conversion rate, £1 fee applies.",
            partner="Cavendish Online",
            estimated_value="£25",
            cashback=None,
            conversion_rate="20:1",
            transaction_fee="£1",
            offer_type="travel",
            tags=["travel", "has_fee", "rate_20_1", "no_insurance"],
        ),
        PartnerOffer(
            id="opp-9",
            title="Low Cashback Insurance",
            description="Insurance payment with only £30 cashback and 8:1 conversion rate.",
            partner="LBG Coins",
            estimated_value="£30 cashback",
            cashback="£30",
            conversion_rate="8:1",
            transaction_fee="£0",
            offer_type="insurance_payment",
            tags=["cashback_30", "no_fee", "rate_8_1", "insurance"],
        ),
    ],
    "insurance_coins_maxvalue": [
        # Offers for the "maximise value" objective
        PartnerOffer(
            id="opp-10",
            title="Maximum Value Bundle",
            description="Convert all partner points to LBG coins for the highest combined insurance payment value.",
            partner="Cavendish Online",
            estimated_value="£120 total",
            cashback="£50",
            conversion_rate="8:1",
            transaction_fee="£0",
            offer_type="bundle",
            tags=["max_value", "no_fee", "insurance", "bundle"],
        ),
        PartnerOffer(
            id="opp-11",
            title="Alpha Medical Premium Conversion",
            description="Convert Alpha Medical points at the best available rate for maximum LBG coin value.",
            partner="Alpha Medical",
            estimated_value="£95 value",
            cashback="£40",
            conversion_rate="7:1",
            transaction_fee="£0",
            offer_type="points_conversion",
            tags=["max_value", "no_fee", "insurance", "conversion"],
        ),
        PartnerOffer(
            id="opp-12",
            title="Multi-Brand Consolidation",
            description="Consolidate points from all connected brands for the maximum insurance payment.",
            partner="LBG Coins",
            estimated_value="£110 total",
            cashback="£45",
            conversion_rate="9:1",
            transaction_fee="£0",
            offer_type="consolidation",
            tags=["max_value", "no_fee", "insurance", "consolidation"],
        ),
        PartnerOffer(
            id="opp-13",
            title="Cavendish Loyalty Bonus",
            description="Loyalty cardholders get enhanced conversion rates and bonus cashback on insurance.",
            partner="Cavendish Online",
            estimated_value="£105 value",
            cashback="£55",
            conversion_rate="8:1",
            transaction_fee="£0",
            offer_type="loyalty",
            tags=["max_value", "no_fee", "insurance", "loyalty"],
        ),
        # Rejected for max-value
        PartnerOffer(
            id="opp-14",
            title="Standard Insurance Payment",
            description="Basic insurance payment with standard rates. No bonus conversion.",
            partner="Cavendish Online",
            estimated_value="£40",
            cashback="£20",
            conversion_rate="15:1",
            transaction_fee="£5",
            offer_type="insurance_payment",
            tags=["low_value", "has_fee", "insurance"],
        ),
        PartnerOffer(
            id="opp-15",
            title="Dining Rewards",
            description="Weekend dining experience with your points. Not for insurance.",
            partner="Cavendish Online",
            estimated_value="£15",
            cashback=None,
            conversion_rate=None,
            transaction_fee=None,
            offer_type="dining",
            tags=["dining", "no_insurance"],
        ),
        PartnerOffer(
            id="opp-16",
            title="Low-Value Cashback",
            description="Small cashback offer with poor conversion rate.",
            partner="LBG Coins",
            estimated_value="£25",
            cashback="£15",
            conversion_rate="20:1",
            transaction_fee="£2",
            offer_type="insurance_payment",
            tags=["low_value", "has_fee", "insurance", "rate_20_1"],
        ),
    ],
}


# ---------------------------------------------------------------------------
# Constraint matching rules
# ---------------------------------------------------------------------------

import re


def _extract_amount(text: str) -> int:
    """Pull the first integer out of a constraint text (e.g. 'cashback 70' -> 70)."""
    m = re.search(r"(\d+)", text or "")
    return int(m.group(1)) if m else -1


def _matches_cashback(offer: PartnerOffer, constraint_value: str) -> bool:
    """Check if offer meets the cashback constraint (e.g. '70' / 'cashback 70' means >= £70)."""
    if not offer.cashback:
        return False
    required = _extract_amount(constraint_value)
    actual = _extract_amount(offer.cashback)
    return required >= 0 and actual >= required


def _matches_conversion_rate(offer: PartnerOffer, constraint_value: str) -> bool:
    """Check if offer meets the conversion rate constraint (e.g. '10:1'/'rate 10:1' means <= 10:1)."""
    if not offer.conversion_rate:
        return False
    required = _extract_amount(constraint_value)
    actual = _extract_amount(offer.conversion_rate)
    return required >= 0 and actual <= required


def _matches_no_fee(offer: PartnerOffer) -> bool:
    """Check if offer has no transaction fee."""
    if not offer.transaction_fee:
        return True
    return _extract_amount(offer.transaction_fee) == 0


def _matches_insurance(offer: PartnerOffer) -> bool:
    """Check if offer is applicable to insurance payments."""
    return "insurance" in offer.tags


CONSTRAINT_PARSERS = {
    "cashback": _matches_cashback,
    "conversion_rate": _matches_conversion_rate,
    "no_fee": lambda o, _: _matches_no_fee(o),
    "insurance": lambda o, _: _matches_insurance(o),
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_offers_for_objective(objective_text: str) -> list[PartnerOffer]:
    """Return the partner offers catalog for the given objective."""
    lean = (objective_text or "").lower()
    if any(kw in lean for kw in ("insurance", "premium", "pay")):
        if any(kw in lean for kw in ("maxi", "best value", "maximum value", "max value")):
            return PARTNER_OFFERS.get("insurance_coins_maxvalue", [])
        return PARTNER_OFFERS.get("insurance_coins_fixed", [])
    return PARTNER_OFFERS.get("insurance_coins_fixed", [])


def filter_offers(
    offers: list[PartnerOffer],
    applied_constraints: list[str],
) -> tuple[list[RewardOpportunity], list[RewardOpportunity]]:
    """Filter offers against applied constraints.

    Returns (shortlisted, rejected) where shortlisted offers meet ALL
    applied constraints and rejected offers fail at least one.
    """
    shortlisted: list[RewardOpportunity] = []
    rejected: list[RewardOpportunity] = []

    for offer in offers:
        meets_all = True
        for constraint in applied_constraints:
            constraint_lower = constraint.lower()
            matched = False
            for keyword, checker in CONSTRAINT_PARSERS.items():
                if keyword in constraint_lower:
                    if not checker(offer, constraint_lower):
                        meets_all = False
                    matched = True
                    break
            if not matched:
                pass
            if not meets_all:
                break

        if meets_all:
            shortlisted.append(offer.to_opportunity())
        else:
            rejected.append(offer.to_opportunity())

    return shortlisted, rejected


def get_filtered_opportunities(
    objective_text: str,
    applied_constraints: list[str],
) -> tuple[list[RewardOpportunity], list[RewardOpportunity]]:
    """Convenience: get offers for objective, filter by constraints, return (shortlisted, rejected)."""
    offers = get_offers_for_objective(objective_text)
    return filter_offers(offers, applied_constraints)

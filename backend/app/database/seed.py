from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base, engine, async_session
from app.models import (
    Brand,
    BrandPointsLedger,
    Customer,
    CustomerBehavior,
    CustomerGoal,
    CustomerPersonalityProfile,
    CustomerRewardsHistory,
    CustomerSignal,
    Reward,
    RewardStatus,
    TransactionCurrency,
    TransactionType,
    Wallet,
    WalletTransaction,
)


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations=260_000)
    return f"{salt.hex()}${dk.hex()}"


def _days_ago(days: int, hour: int = 12) -> datetime:
    d = datetime.now(timezone.utc) - timedelta(days=days)
    return d.replace(hour=hour, minute=0, second=0, microsecond=0)


SEED_BRANDS = [
    {"id": "brd_alphamedicol", "name": "AlphaMedicol", "category": "Health", "logo_text": "AM", "color": "#0e7490", "min_redeem": 600, "redirect_url": "http://localhost:5174"},
    {"id": "brd_rinkoff", "name": "Rinkoff Bakery", "category": "Dining", "logo_text": "RB", "color": "#b45309", "min_redeem": 500},
    {"id": "brd_broadway", "name": "Broadway Market", "category": "Shopping", "logo_text": "BM", "color": "#4d7c0f", "min_redeem": 500},
    {"id": "brd_bankofscotland", "name": "Bank of Scotland", "category": "Banking", "logo_text": "BS", "color": "#1e40af", "min_redeem": 500},
    {"id": "brd_amc", "name": "AMC", "category": "Banking", "logo_text": "AM", "color": "#0369a1", "min_redeem": 500},
    {"id": "brd_blackhorse", "name": "Black Horse", "category": "Banking", "logo_text": "BH", "color": "#065f46", "min_redeem": 500},
    {"id": "brd_birmingham", "name": "Birmingham", "category": "Banking", "logo_text": "BI", "color": "#7c2d12", "min_redeem": 500},
    {"id": "brd_cavendish", "name": "Cavendish Online", "category": "Banking", "logo_text": "CO", "color": "#4338ca", "min_redeem": 500, "redirect_url": "http://localhost:5175"},
    {"id": "brd_embark", "name": "Embark", "category": "Insurance", "logo_text": "EM", "color": "#9d174d", "min_redeem": 500},
    {"id": "brd_hgp", "name": "HGP", "category": "Insurance", "logo_text": "HG", "color": "#a16207", "min_redeem": 500},
    {"id": "brd_ldc", "name": "LDC", "category": "Insurance", "logo_text": "LD", "color": "#155e75", "min_redeem": 500},
    {"id": "brd_lexautolease", "name": "Lex Autolease", "category": "Insurance", "logo_text": "LA", "color": "#374151", "min_redeem": 500},
    {"id": "brd_lloydswealth", "name": "Lloyds Wealth", "category": "Banking", "logo_text": "LW", "color": "#006a4d", "min_redeem": 500},
    {"id": "brd_lloydsliving", "name": "Lloyds Living", "category": "Insurance", "logo_text": "LL", "color": "#045a42", "min_redeem": 500},
    {"id": "brd_scottishwidows", "name": "Scottish Widows", "category": "Insurance", "logo_text": "SW", "color": "#701a75", "min_redeem": 500},
    {"id": "brd_mbna", "name": "MBNA", "category": "Banking", "logo_text": "MB", "color": "#1d4ed8", "min_redeem": 500},
]

DEMO_CONNECTED_BRANDS = [
    ("brd_alphamedicol", "AlphaMedicol", "Health", 2100.0, "#0e7490", "AM"),
    ("brd_rinkoff", "Rinkoff Bakery", "Dining", 1750.0, "#b45309", "RB"),
    ("brd_broadway", "Broadway Market", "Shopping", 1300.0, "#4d7c0f", "BM"),
    ("brd_bankofscotland", "Bank of Scotland", "Banking", 2600.0, "#1e40af", "BS"),
    ("brd_amc", "AMC", "Banking", 1450.0, "#0369a1", "AM"),
    ("brd_blackhorse", "Black Horse", "Banking", 1900.0, "#065f46", "BH"),
    ("brd_birmingham", "Birmingham", "Banking", 900.0, "#7c2d12", "BI"),
    ("brd_cavendish", "Cavendish Online", "Banking", 1150.0, "#4338ca", "CO"),
    ("brd_embark", "Embark", "Insurance", 1600.0, "#9d174d", "EM"),
    ("brd_hgp", "HGP", "Insurance", 750.0, "#a16207", "HG"),
    ("brd_ldc", "LDC", "Insurance", 2200.0, "#155e75", "LD"),
    ("brd_lexautolease", "Lex Autolease", "Insurance", 2800.0, "#374151", "LA"),
    ("brd_lloydswealth", "Lloyds Wealth", "Banking", 2400.0, "#006a4d", "LW"),
    ("brd_lloydsliving", "Lloyds Living", "Insurance", 1350.0, "#045a42", "LL"),
    ("brd_scottishwidows", "Scottish Widows", "Insurance", 3100.0, "#701a75", "SW"),
    ("brd_mbna", "MBNA", "Banking", 2050.0, "#1d4ed8", "MB"),
]

DEMO_TRANSACTIONS = [
    ("EARN", "Points earned from AlphaMedicol", 320.0, "BRAND_POINT", _days_ago(0, 13)),
    ("CONVERT", "Converted partner points to LBG coins", 850.0, "LBG_COIN", _days_ago(1)),
    ("REDEEM", "Redeemed coins with AlphaMedicol", -450.0, "LBG_COIN", _days_ago(3)),
    ("EARN", "Points earned from Rinkoff Bakery", 540.0, "BRAND_POINT", _days_ago(5)),
    ("EARN", "Points earned from Broadway Market", 1250.0, "BRAND_POINT", _days_ago(8)),
    ("CONVERT", "Converted partner points to LBG coins", 600.0, "LBG_COIN", _days_ago(11)),
    ("REDEEM", "Redeemed coins with Rinkoff Bakery", -900.0, "LBG_COIN", _days_ago(14)),
    ("EARN", "Points earned from LDC", 210.0, "BRAND_POINT", _days_ago(18)),
]

PERSONA_CUSTOMERS = [
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000001"),
        "name": "Alex Rivera",
        "email": "alex@example.com",
        "phone": "07700900201",
        "tier": "Gold",
        "points": 4250,
        "engagement_score": 0.82,
        "behaviors": {
            "avg_redemption_time_hours": 2.3,
            "immediate_redemption_rate": 0.89,
            "goal_completion_rate": 0.12,
            "days_since_last_activity": 1,
            "monthly_active_days": 24,
            "average_session_duration_minutes": 8,
            "notification_open_rate": 0.45,
            "redemption_frequency": "HIGH",
            "preferred_reward_type": "INSTANT",
        },
        "signals": [
            "frequent immediate redemptions",
            "high notification engagement",
            "short time between earning and redeeming",
            "responds to flash offers",
            "session duration suggests quick interactions",
        ],
        "rewards_history": [
            {"name": "Coffee Voucher", "points": 200, "claimed_2_hours_after_earning": True},
            {"name": "Fast Food Discount", "points": 500, "claimed_immediately": True},
            {"name": "Movie Ticket", "points": 1000, "claimed_same_day": True},
        ],
        "goals": [],
        "personality": {
            "value_explainer_view_count": 1,
            "cash_equivalent_uses": 2,
            "partner_comparisons": 0,
            "probabilities": {"instant_rewards": 0.92, "goal_linked_reward": 0.10, "tangible_value_explainer": 0.25, "partner_conversion": 0.08, "value_explainer": 0.20},
            "motive_scores": {"value_explainer": 0.22, "autonomy_preference": 0.70, "progress_orientation": 0.15, "payment_utility": 0.25, "portability_preference": 0.12, "curiosity_response": 0.40},
            "predicted_responses": {"tangible_value_explainer": 0.28, "customer_choice_panel": 0.62, "partner_value_comparison": 0.10, "gamification_choice": 0.75},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000002"),
        "name": "Sarah Chen",
        "email": "sarah@example.com",
        "phone": "07700900202",
        "tier": "Platinum",
        "points": 6820,
        "engagement_score": 0.91,
        "behaviors": {
            "avg_redemption_time_hours": 168,
            "immediate_redemption_rate": 0.15,
            "goal_completion_rate": 0.78,
            "days_since_last_activity": 2,
            "monthly_active_days": 20,
            "average_session_duration_minutes": 12,
            "notification_open_rate": 0.62,
            "redemption_frequency": "MEDIUM",
            "preferred_reward_type": "GOAL_LINKED",
        },
        "signals": [
            "frequent goal-linked redemptions",
            "consistent monthly accumulation",
            "high goal completion behavior",
            "checks progress regularly",
            "saves points for larger rewards",
        ],
        "rewards_history": [
            {"name": "Flight Discount", "points": 5000, "saved_for": "Japan Trip"},
            {"name": "Hotel Voucher", "points": 3000, "saved_for": "Japan Trip"},
        ],
        "goals": [
            {"name": "Japan Vacation", "target_value": 2500, "current_value": 1680, "progress": 67},
            {"name": "New Phone", "target_value": 1200, "current_value": 890, "progress": 74},
            {"name": "Emergency Fund", "target_value": 3000, "current_value": 1350, "progress": 45},
        ],
        "personality": {
            "value_explainer_view_count": 5,
            "cash_equivalent_uses": 4,
            "partner_comparisons": 3,
            "probabilities": {"instant_rewards": 0.12, "goal_linked_reward": 0.90, "tangible_value_explainer": 0.60, "partner_conversion": 0.35, "value_explainer": 0.58},
            "motive_scores": {"value_explainer": 0.55, "autonomy_preference": 0.60, "progress_orientation": 0.92, "payment_utility": 0.30, "portability_preference": 0.25, "curiosity_response": 0.48},
            "predicted_responses": {"tangible_value_explainer": 0.62, "customer_choice_panel": 0.66, "partner_value_comparison": 0.40, "gamification_choice": 0.35},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000003"),
        "name": "David Park",
        "email": "david@example.com",
        "phone": "07700900203",
        "tier": "Diamond",
        "points": 28400,
        "engagement_score": 0.76,
        "behaviors": {
            "avg_redemption_time_hours": 2160,
            "immediate_redemption_rate": 0.03,
            "goal_completion_rate": 0.92,
            "days_since_last_activity": 5,
            "monthly_active_days": 15,
            "average_session_duration_minutes": 18,
            "notification_open_rate": 0.38,
            "redemption_frequency": "LOW",
            "preferred_reward_type": "LONG_TERM",
        },
        "signals": [
            "long-term accumulation pattern",
            "rarely redeems for small rewards",
            "interested in investment-like rewards",
            "reads educational content",
            "values future projections",
        ],
        "rewards_history": [
            {"name": "Retirement Bonus", "points": 15000, "saved_for": "Retirement Fund"},
        ],
        "goals": [
            {"name": "Retirement Fund", "target_value": 100000, "current_value": 28400, "progress": 28},
            {"name": "Children Education Fund", "target_value": 50000, "current_value": 20500, "progress": 41},
            {"name": "Dream Home Deposit", "target_value": 75000, "current_value": 11250, "progress": 15},
        ],
        "personality": {
            "value_explainer_view_count": 8,
            "cash_equivalent_uses": 1,
            "partner_comparisons": 2,
            "probabilities": {"instant_rewards": 0.03, "goal_linked_reward": 0.85, "tangible_value_explainer": 0.80, "partner_conversion": 0.20, "value_explainer": 0.82},
            "motive_scores": {"value_explainer": 0.80, "autonomy_preference": 0.75, "progress_orientation": 0.88, "payment_utility": 0.15, "portability_preference": 0.30, "curiosity_response": 0.78},
            "predicted_responses": {"tangible_value_explainer": 0.82, "customer_choice_panel": 0.55, "partner_value_comparison": 0.25, "gamification_choice": 0.10},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000004"),
        "name": "Jessica Martinez",
        "email": "jessica@example.com",
        "phone": "07700900204",
        "tier": "Silver",
        "points": 1850,
        "engagement_score": 0.23,
        "behaviors": {
            "avg_redemption_time_hours": 720,
            "immediate_redemption_rate": 0.08,
            "goal_completion_rate": 0.0,
            "days_since_last_activity": 45,
            "monthly_active_days": 3,
            "average_session_duration_minutes": 2,
            "notification_open_rate": 0.05,
            "redemption_frequency": "VERY_LOW",
            "preferred_reward_type": "NONE",
        },
        "signals": [
            "declining engagement over 60 days",
            "unused expiring points",
            "stopped opening notifications",
            "has not logged in for 45 days",
            "multiple unused rewards",
            "points expiring soon",
        ],
        "rewards_history": [
            {"name": "Retail Discount", "points": 300, "never_claimed": True},
        ],
        "goals": [],
        "personality": {
            "value_explainer_view_count": 0,
            "cash_equivalent_uses": 0,
            "partner_comparisons": 0,
            "probabilities": {"instant_rewards": 0.20, "goal_linked_reward": 0.05, "tangible_value_explainer": 0.30, "partner_conversion": 0.10, "value_explainer": 0.28},
            "motive_scores": {"value_explainer": 0.25, "autonomy_preference": 0.50, "progress_orientation": 0.08, "payment_utility": 0.35, "portability_preference": 0.20, "curiosity_response": 0.12},
            "predicted_responses": {"tangible_value_explainer": 0.32, "customer_choice_panel": 0.25, "partner_value_comparison": 0.12, "gamification_choice": 0.08},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000005"),
        "name": "Marcus Johnson",
        "email": "marcus@example.com",
        "phone": "07700900205",
        "tier": "Gold",
        "points": 8750,
        "engagement_score": 0.95,
        "behaviors": {
            "avg_redemption_time_hours": 48,
            "immediate_redemption_rate": 0.45,
            "goal_completion_rate": 0.35,
            "days_since_last_activity": 0,
            "monthly_active_days": 28,
            "average_session_duration_minutes": 15,
            "notification_open_rate": 0.78,
            "redemption_frequency": "HIGH",
            "preferred_reward_type": "CHALLENGE",
        },
        "signals": [
            "completes challenges regularly",
            "checks leaderboard daily",
            "longest active streak in program",
            "participates in community events",
            "earns badges frequently",
            "shares achievements socially",
        ],
        "rewards_history": [
            {"name": "Challenge Winner Bonus", "points": 2000},
            {"name": "Streak Reward", "points": 500},
            {"name": "Community Badge", "points": 300},
        ],
        "goals": [],
        "personality": {
            "value_explainer_view_count": 2,
            "cash_equivalent_uses": 3,
            "partner_comparisons": 1,
            "probabilities": {"instant_rewards": 0.55, "goal_linked_reward": 0.40, "tangible_value_explainer": 0.20, "partner_conversion": 0.15, "value_explainer": 0.22},
            "motive_scores": {"value_explainer": 0.20, "autonomy_preference": 0.40, "progress_orientation": 0.85, "payment_utility": 0.20, "portability_preference": 0.10, "curiosity_response": 0.60},
            "predicted_responses": {"tangible_value_explainer": 0.22, "customer_choice_panel": 0.50, "partner_value_comparison": 0.15, "gamification_choice": 0.95},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000006"),
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "phone": "07700900206",
        "tier": "Platinum",
        "points": 15400,
        "engagement_score": 0.88,
        "behaviors": {
            "avg_redemption_time_hours": 96,
            "immediate_redemption_rate": 0.38,
            "goal_completion_rate": 0.71,
            "days_since_last_activity": 1,
            "monthly_active_days": 26,
            "average_session_duration_minutes": 14,
            "notification_open_rate": 0.74,
            "redemption_frequency": "MEDIUM",
            "preferred_reward_type": "MIXED",
        },
        "signals": [
            "balances instant fun with long-term saving",
            "maintains multiple active goals across time horizons",
            "completes challenges while accumulating toward goals",
            "active streak combined with steady goal contributions",
            "checks leaderboard and goal progress in same sessions",
            "earns badges frequently without redeeming them immediately",
            "responds to both challenge invites and milestone celebrations",
        ],
        "rewards_history": [
            {"name": "Challenge Winner Bonus", "points": 1500, "claimed_same_week": True},
            {"name": "Flight Discount", "points": 4000, "saved_for": "Bali Trip"},
            {"name": "Milestone Bonus", "points": 2000, "saved_for": "Retirement Fund"},
        ],
        "goals": [
            {"name": "Bali Trip", "target_value": 4000, "current_value": 2900, "progress": 72},
            {"name": "New Laptop", "target_value": 2500, "current_value": 1500, "progress": 60},
            {"name": "Retirement Fund", "target_value": 80000, "current_value": 15400, "progress": 19},
            {"name": "Home Deposit", "target_value": 50000, "current_value": 11000, "progress": 22},
        ],
        "personality": {
            "value_explainer_view_count": 4,
            "cash_equivalent_uses": 4,
            "partner_comparisons": 3,
            "probabilities": {"instant_rewards": 0.45, "goal_linked_reward": 0.75, "tangible_value_explainer": 0.55, "partner_conversion": 0.30, "value_explainer": 0.52},
            "motive_scores": {"value_explainer": 0.50, "autonomy_preference": 0.65, "progress_orientation": 0.80, "payment_utility": 0.35, "portability_preference": 0.30, "curiosity_response": 0.68},
            "predicted_responses": {"tangible_value_explainer": 0.56, "customer_choice_panel": 0.78, "partner_value_comparison": 0.35, "gamification_choice": 0.72},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000007"),
        "name": "Elena Vasquez",
        "email": "elena@example.com",
        "phone": "07700900207",
        "tier": "Diamond",
        "points": 24500,
        "engagement_score": 0.28,
        "behaviors": {
            "avg_redemption_time_hours": 1560,
            "immediate_redemption_rate": 0.05,
            "goal_completion_rate": 0.64,
            "days_since_last_activity": 34,
            "monthly_active_days": 4,
            "average_session_duration_minutes": 11,
            "notification_open_rate": 0.07,
            "redemption_frequency": "VERY_LOW",
            "preferred_reward_type": "LONG_TERM",
        },
        "signals": [
            "strong long-term accumulation history now stalled",
            "retirement fund contributions untouched for over a month",
            "large points balance sitting idle above 20k",
            "stopped opening notifications after years of steady saving",
            "significant points expiring while saving toward long-horizon goals",
            "historically responded well to projected-value and educational content",
            "declining logins threaten an otherwise disciplined savings journey",
        ],
        "rewards_history": [
            {"name": "Retirement Bonus", "points": 12000, "saved_for": "Retirement Fund"},
            {"name": "Education Contribution", "points": 5000, "saved_for": "Children Education Fund"},
            {"name": "Cashback Voucher", "points": 400, "expired_unused": True},
        ],
        "goals": [
            {"name": "Retirement Fund", "target_value": 100000, "current_value": 24500, "progress": 25},
            {"name": "Children Education Fund", "target_value": 50000, "current_value": 18500, "progress": 37},
            {"name": "Dream Home Deposit", "target_value": 75000, "current_value": 9000, "progress": 12},
        ],
        "personality": {
            "value_explainer_view_count": 6,
            "cash_equivalent_uses": 1,
            "partner_comparisons": 2,
            "probabilities": {"instant_rewards": 0.04, "goal_linked_reward": 0.72, "tangible_value_explainer": 0.78, "partner_conversion": 0.18, "value_explainer": 0.76},
            "motive_scores": {"value_explainer": 0.74, "autonomy_preference": 0.70, "progress_orientation": 0.70, "payment_utility": 0.18, "portability_preference": 0.28, "curiosity_response": 0.55},
            "predicted_responses": {"tangible_value_explainer": 0.80, "customer_choice_panel": 0.45, "partner_value_comparison": 0.22, "gamification_choice": 0.06},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000008"),
        "name": "Ryan Okafor",
        "email": "ryan@example.com",
        "phone": "07700900208",
        "tier": "Gold",
        "points": 3600,
        "engagement_score": 0.26,
        "behaviors": {
            "avg_redemption_time_hours": 6,
            "immediate_redemption_rate": 0.85,
            "goal_completion_rate": 0.10,
            "days_since_last_activity": 41,
            "monthly_active_days": 2,
            "average_session_duration_minutes": 3,
            "notification_open_rate": 0.06,
            "redemption_frequency": "VERY_LOW",
            "preferred_reward_type": "INSTANT",
        },
        "signals": [
            "historically redeemed points within hours of earning",
            "responds strongly to flash offers and instant vouchers",
            "inactive for over a month after months of daily visits",
            "1,500 points expiring within a week",
            "stopped opening notifications",
            "small instant rewards drove past engagement spikes",
        ],
        "rewards_history": [
            {"name": "Coffee Voucher", "points": 200, "claimed_immediately": True},
            {"name": "Flash Deal Snack Box", "points": 350, "claimed_same_hour": True},
            {"name": "Retail Discount", "points": 300, "never_claimed": True},
        ],
        "goals": [],
        "personality": {
            "value_explainer_view_count": 1,
            "cash_equivalent_uses": 1,
            "partner_comparisons": 0,
            "probabilities": {"instant_rewards": 0.88, "goal_linked_reward": 0.08, "tangible_value_explainer": 0.22, "partner_conversion": 0.06, "value_explainer": 0.18},
            "motive_scores": {"value_explainer": 0.18, "autonomy_preference": 0.65, "progress_orientation": 0.12, "payment_utility": 0.28, "portability_preference": 0.10, "curiosity_response": 0.45},
            "predicted_responses": {"tangible_value_explainer": 0.25, "customer_choice_panel": 0.55, "partner_value_comparison": 0.08, "gamification_choice": 0.80},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000009"),
        "name": "Maya Thompson",
        "email": "maya@example.com",
        "phone": "07700900209",
        "tier": "Gold",
        "points": 5600,
        "engagement_score": 0.71,
        "behaviors": {
            "avg_redemption_time_hours": 72,
            "immediate_redemption_rate": 0.22,
            "goal_completion_rate": 0.41,
            "days_since_last_activity": 2,
            "monthly_active_days": 17,
            "average_session_duration_minutes": 11,
            "notification_open_rate": 0.52,
            "redemption_frequency": "MEDIUM",
            "preferred_reward_type": "VALUE_CLARITY",
        },
        "signals": [
            "repeatedly asks what points are worth in pounds before redeeming",
            "abandons redemptions when value is unclear",
            "compares partner rates across visits before committing",
            "prefers exact monetary equivalents over point abstractions",
            "responds poorly to countdown or urgency framing",
        ],
        "rewards_history": [
            {"name": "Supermarket Voucher", "points": 1500, "checked_gbp_value_first": True},
        ],
        "goals": [],
        "personality": {
            "value_explainer_view_count": 12,
            "cash_equivalent_uses": 5,
            "partner_comparisons": 11,
            "probabilities": {"instant_rewards": 0.15, "goal_linked_reward": 0.42, "tangible_value_explainer": 0.93, "partner_conversion": 0.48, "value_explainer": 0.95},
            "motive_scores": {"value_explainer": 0.94, "autonomy_preference": 0.58, "progress_orientation": 0.35, "payment_utility": 0.32, "portability_preference": 0.40, "curiosity_response": 0.44},
            "predicted_responses": {"tangible_value_explainer": 0.92, "customer_choice_panel": 0.86, "partner_value_comparison": 0.88, "gamification_choice": 0.08},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000010"),
        "name": "Daniel Brooks",
        "email": "daniel@example.com",
        "phone": "07700900210",
        "tier": "Platinum",
        "points": 7300,
        "engagement_score": 0.84,
        "behaviors": {
            "avg_redemption_time_hours": 24,
            "immediate_redemption_rate": 0.48,
            "goal_completion_rate": 0.58,
            "days_since_last_activity": 1,
            "monthly_active_days": 21,
            "average_session_duration_minutes": 7,
            "notification_open_rate": 0.66,
            "redemption_frequency": "HIGH",
            "preferred_reward_type": "PAYMENT_LINKED",
        },
        "signals": [
            "redeems almost exclusively as statement credits on linked card",
            "checks cashback earned alongside balance every visit",
            "sets allocation of earned points to automatic payment rewards",
            "uninterested in vouchers or experiences, wants money off bills",
            "values predictable, guaranteed reward rates",
        ],
        "rewards_history": [
            {"name": "Statement Credit", "points": 2500, "applied_to_card": True},
            {"name": "Statement Credit", "points": 1800, "applied_to_card": True},
        ],
        "goals": [
            {"name": "Holiday Spending Money", "target_value": 1200, "current_value": 640, "progress": 53},
        ],
        "personality": {
            "value_explainer_view_count": 2,
            "cash_equivalent_uses": 14,
            "partner_comparisons": 2,
            "probabilities": {"instant_rewards": 0.35, "goal_linked_reward": 0.55, "tangible_value_explainer": 0.70, "partner_conversion": 0.25, "value_explainer": 0.66},
            "motive_scores": {"value_explainer": 0.60, "autonomy_preference": 0.72, "progress_orientation": 0.55, "payment_utility": 0.95, "portability_preference": 0.20, "curiosity_response": 0.30},
            "predicted_responses": {"tangible_value_explainer": 0.72, "customer_choice_panel": 0.60, "partner_value_comparison": 0.28, "gamification_choice": 0.18},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000011"),
        "name": "Sophie Williams",
        "email": "sophie@example.com",
        "phone": "07700900211",
        "tier": "Gold",
        "points": 3900,
        "engagement_score": 0.79,
        "behaviors": {
            "avg_redemption_time_hours": 120,
            "immediate_redemption_rate": 0.12,
            "goal_completion_rate": 0.62,
            "days_since_last_activity": 1,
            "monthly_active_days": 19,
            "average_session_duration_minutes": 16,
            "notification_open_rate": 0.71,
            "redemption_frequency": "MEDIUM",
            "preferred_reward_type": "EDUCATIONAL",
        },
        "signals": [
            "completes every financial literacy module to 100%",
            "retakes quizzes until concepts are fully understood",
            "spends longest session time on educational content",
            "motivated by mastering topics rather than winning them",
            "avoids timed challenges and public rankings",
        ],
        "rewards_history": [
            {"name": "Academy Module Bonus", "points": 300, "earned_via_course": True},
        ],
        "goals": [
            {"name": "First Home Savings Knowledge", "target_value": 2000, "current_value": 1250, "progress": 63},
        ],
        "personality": {
            "value_explainer_view_count": 9,
            "cash_equivalent_uses": 1,
            "partner_comparisons": 1,
            "probabilities": {"instant_rewards": 0.08, "goal_linked_reward": 0.60, "tangible_value_explainer": 0.75, "partner_conversion": 0.12, "value_explainer": 0.80},
            "motive_scores": {"value_explainer": 0.78, "autonomy_preference": 0.50, "progress_orientation": 0.82, "payment_utility": 0.12, "portability_preference": 0.15, "curiosity_response": 0.94},
            "predicted_responses": {"tangible_value_explainer": 0.74, "customer_choice_panel": 0.50, "partner_value_comparison": 0.18, "gamification_choice": 0.55},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000012"),
        "name": "Leo Morgan",
        "email": "leo@example.com",
        "phone": "07700900212",
        "tier": "Platinum",
        "points": 11200,
        "engagement_score": 0.74,
        "behaviors": {
            "avg_redemption_time_hours": 240,
            "immediate_redemption_rate": 0.15,
            "goal_completion_rate": 0.55,
            "days_since_last_activity": 3,
            "monthly_active_days": 16,
            "average_session_duration_minutes": 13,
            "notification_open_rate": 0.49,
            "redemption_frequency": "MEDIUM",
            "preferred_reward_type": "PORTABLE",
        },
        "signals": [
            "holds reward balances across three partner programmes",
            "frequently asks about moving points between programmes",
            "wants one combined view of all earned rewards",
            "prefers simple plain-English explanations of transfers",
            "put off by technical jargon and complex terms",
        ],
        "rewards_history": [
            {"name": "Partner Transfer Bonus", "points": 1000, "transferred_to_partner": True},
        ],
        "goals": [
            {"name": "Family Holiday Fund", "target_value": 3000, "current_value": 1750, "progress": 58},
        ],
        "personality": {
            "value_explainer_view_count": 4,
            "cash_equivalent_uses": 2,
            "partner_comparisons": 13,
            "probabilities": {"instant_rewards": 0.10, "goal_linked_reward": 0.48, "tangible_value_explainer": 0.68, "partner_conversion": 0.90, "value_explainer": 0.62},
            "motive_scores": {"value_explainer": 0.58, "autonomy_preference": 0.62, "progress_orientation": 0.45, "payment_utility": 0.25, "portability_preference": 0.93, "curiosity_response": 0.40},
            "predicted_responses": {"tangible_value_explainer": 0.66, "customer_choice_panel": 0.58, "partner_value_comparison": 0.91, "gamification_choice": 0.12},
        },
    },
    {
        "id": uuid.UUID("10000000-0000-0000-0000-000000000013"),
        "name": "Amelia Carter",
        "email": "amelia@example.com",
        "phone": "07700900213",
        "tier": "Gold",
        "points": 6450,
        "engagement_score": 0.68,
        "behaviors": {
            "avg_redemption_time_hours": 96,
            "immediate_redemption_rate": 0.20,
            "goal_completion_rate": 0.47,
            "days_since_last_activity": 2,
            "monthly_active_days": 14,
            "average_session_duration_minutes": 9,
            "notification_open_rate": 0.44,
            "redemption_frequency": "MEDIUM",
            "preferred_reward_type": "PREVIEW",
        },
        "signals": [
            "always previews a reward before committing points",
            "abandons flows that hide the final value until after selection",
            "gravitates to offers labelled guaranteed or fixed value",
            "reads full terms before redeeming anything",
            "dislikes surprise deductions or variable conversion rates",
        ],
        "rewards_history": [
            {"name": "Guaranteed Value Voucher", "points": 2000, "previewed_first": True},
        ],
        "goals": [],
        "personality": {
            "value_explainer_view_count": 7,
            "cash_equivalent_uses": 4,
            "partner_comparisons": 5,
            "probabilities": {"instant_rewards": 0.12, "goal_linked_reward": 0.45, "tangible_value_explainer": 0.88, "partner_conversion": 0.38, "value_explainer": 0.85},
            "motive_scores": {"value_explainer": 0.86, "autonomy_preference": 0.55, "progress_orientation": 0.40, "payment_utility": 0.30, "portability_preference": 0.35, "curiosity_response": 0.38},
            "predicted_responses": {"tangible_value_explainer": 0.89, "customer_choice_panel": 0.82, "partner_value_comparison": 0.55, "gamification_choice": 0.10},
        },
    },
]


async def seed_database() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for b in SEED_BRANDS:
            brand = Brand(
                id=b["id"],
                name=b["name"],
                category=b["category"],
                logo_text=b["logo_text"],
                color=b["color"],
                min_redeem=b["min_redeem"],
                redirect_url=b.get("redirect_url"),
            )
            session.add(brand)

        demo_customer_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        demo_customer = Customer(
            id=demo_customer_id,
            name="Alex Morgan",
            email="alex.morgan@demo.com",
            phone="07700900123",
            password_hash=_hash_password("demo1234"),
            tier="Gold",
        )
        session.add(demo_customer)

        wallet = Wallet(
            id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
            customer_id=demo_customer_id,
            lbg_coin_balance=12480.0,
        )
        session.add(wallet)

        for brand_id, brand_name, category, points, color, logo_text in DEMO_CONNECTED_BRANDS:
            bpl = BrandPointsLedger(customer_id=demo_customer_id, brand_id=brand_id, available_points=points)
            session.add(bpl)
            reward = Reward(
                customer_id=demo_customer_id,
                brand_id=brand_id,
                status=RewardStatus.EARNED,
                points=points,
                description=f"Earned at {brand_name}",
            )
            session.add(reward)

        # Seeded touchpoint used by the AlphaMedicol deep-link when the signed-in
        # email is passed through; persists a starter AlphaMedicol balance so the
        # convert journey always has points available.
        am_email = "ltc.cto.iet@gmail.com"
        am_customer = await session.scalar(
            select(Customer.id).where(Customer.email == am_email)
        )
        if am_customer is None:
            am_id = uuid.uuid4()
            session.add(Customer(
                id=am_id,
                name="LTC Cto",
                email=am_email,
                phone="0732472259",
                password_hash=_hash_password("demo1234"),
                tier="Silver",
            ))
            session.add(Wallet(customer_id=am_id, lbg_coin_balance=1500.0))
            session.add(BrandPointsLedger(
                customer_id=am_id,
                brand_id="brd_alphamedicol",
                available_points=2000.0,
            ))

        for tx_type, desc, amount, currency, created_at in DEMO_TRANSACTIONS:
            tx = WalletTransaction(
                wallet_id=wallet.id,
                type=TransactionType(tx_type),
                description=desc,
                amount=amount,
                currency=TransactionCurrency(currency),
                created_at=created_at,
            )
            session.add(tx)

        for p in PERSONA_CUSTOMERS:
            customer = Customer(
                id=p["id"],
                name=p["name"],
                email=p["email"],
                phone=p["phone"],
                password_hash=_hash_password("demo1234"),
                tier=p["tier"],
            )
            session.add(customer)

            cust_wallet = Wallet(customer_id=p["id"], lbg_coin_balance=float(p["points"]))
            session.add(cust_wallet)

            behavior = p["behaviors"]
            cb = CustomerBehavior(
                customer_id=p["id"],
                avg_redemption_time_hours=behavior["avg_redemption_time_hours"],
                immediate_redemption_rate=behavior["immediate_redemption_rate"],
                goal_completion_rate=behavior["goal_completion_rate"],
                days_since_last_activity=behavior["days_since_last_activity"],
                monthly_active_days=behavior["monthly_active_days"],
                average_session_duration_minutes=behavior["average_session_duration_minutes"],
                notification_open_rate=behavior["notification_open_rate"],
                redemption_frequency=behavior["redemption_frequency"],
                preferred_reward_type=behavior["preferred_reward_type"],
            )
            session.add(cb)

            for signal in p["signals"]:
                session.add(CustomerSignal(customer_id=p["id"], signal_text=signal))

            for goal in p["goals"]:
                session.add(CustomerGoal(
                    customer_id=p["id"],
                    name=goal["name"],
                    target_value=goal["target_value"],
                    current_value=goal["current_value"],
                    progress=goal["progress"],
                ))

            for rh in p["rewards_history"]:
                extra = {k: v for k, v in rh.items() if k not in ("name", "points")}
                session.add(CustomerRewardsHistory(
                    customer_id=p["id"],
                    name=rh["name"],
                    points=rh["points"],
                    extra_data=json.dumps(extra) if extra else None,
                ))

            personality = p["personality"]
            session.add(CustomerPersonalityProfile(
                customer_id=p["id"],
                engagement_score=p["engagement_score"],
                value_explainer_view_count=personality["value_explainer_view_count"],
                cash_equivalent_uses=personality["cash_equivalent_uses"],
                partner_comparisons=personality["partner_comparisons"],
                probabilities=json.dumps(personality["probabilities"]),
                motive_scores=json.dumps(personality["motive_scores"]),
                predicted_responses=json.dumps(personality["predicted_responses"]),
            ))

            brand_ids = [b["id"] for b in SEED_BRANDS]
            import random
            random.seed(hash(p["email"]))
            connected_brands = random.sample(brand_ids, min(6, len(brand_ids)))
            points_per_brand = p["points"] // max(len(connected_brands), 1)
            remainder = p["points"] - points_per_brand * len(connected_brands)

            for i, bid in enumerate(connected_brands):
                pts = points_per_brand + (remainder if i == 0 else 0)
                session.add(BrandPointsLedger(customer_id=p["id"], brand_id=bid, available_points=float(pts)))
                session.add(Reward(
                    customer_id=p["id"],
                    brand_id=bid,
                    status=RewardStatus.EARNED,
                    points=float(pts),
                    description=f"Earned at {bid}",
                ))

        await session.commit()

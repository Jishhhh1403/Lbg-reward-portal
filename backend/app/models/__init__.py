from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


class TierName(str, enum.Enum):
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"
    DIAMOND = "Diamond"


class RewardStatus(str, enum.Enum):
    EARNED = "EARNED"
    CONVERTED = "CONVERTED"
    REDEEMED = "REDEEMED"


class TransactionType(str, enum.Enum):
    EARN = "EARN"
    REDEEM = "REDEEM"
    CONVERT = "CONVERT"


class TransactionCurrency(str, enum.Enum):
    LBG_COIN = "LBG_COIN"
    BRAND_POINT = "BRAND_POINT"


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    tier: Mapped[TierName] = mapped_column(Enum(TierName), default=TierName.GOLD, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    wallet: Mapped[Wallet | None] = relationship("Wallet", back_populates="customer", uselist=False)
    rewards: Mapped[list[Reward]] = relationship("Reward", back_populates="customer")
    brand_points: Mapped[list[BrandPointsLedger]] = relationship("BrandPointsLedger", back_populates="customer")


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, unique=True)
    lbg_coin_balance: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer: Mapped[Customer] = relationship("Customer", back_populates="wallet")
    transactions: Mapped[list[WalletTransaction]] = relationship("WalletTransaction", back_populates="wallet")


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    logo_text: Mapped[str] = mapped_column(String(10), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    min_redeem: Mapped[int] = mapped_column(default=500)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    redirect_url: Mapped[str | None] = mapped_column(String(512), nullable=True)


class BrandPointsLedger(Base):
    __tablename__ = "brand_points_ledger"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    brand_id: Mapped[str] = mapped_column(String(50), ForeignKey("brands.id"), nullable=False)
    available_points: Mapped[float] = mapped_column(Float, default=0.0)
    reserved_points: Mapped[float] = mapped_column(Float, default=0.0)
    redeemed_points: Mapped[float] = mapped_column(Float, default=0.0)

    customer: Mapped[Customer] = relationship("Customer", back_populates="brand_points")
    brand: Mapped[Brand] = relationship("Brand")


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    brand_id: Mapped[str] = mapped_column(String(50), ForeignKey("brands.id"), nullable=False)
    status: Mapped[RewardStatus] = mapped_column(Enum(RewardStatus), default=RewardStatus.EARNED)
    points: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer: Mapped[Customer] = relationship("Customer", back_populates="rewards")
    brand: Mapped[Brand] = relationship("Brand")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[TransactionCurrency] = mapped_column(Enum(TransactionCurrency), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    wallet: Mapped[Wallet] = relationship("Wallet", back_populates="transactions")


class CustomerBehavior(Base):
    __tablename__ = "customer_behaviors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, unique=True)
    avg_redemption_time_hours: Mapped[float] = mapped_column(Float, default=0.0)
    immediate_redemption_rate: Mapped[float] = mapped_column(Float, default=0.0)
    goal_completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    days_since_last_activity: Mapped[int] = mapped_column(default=0)
    monthly_active_days: Mapped[int] = mapped_column(default=0)
    average_session_duration_minutes: Mapped[int] = mapped_column(default=0)
    notification_open_rate: Mapped[float] = mapped_column(Float, default=0.0)
    redemption_frequency: Mapped[str] = mapped_column(String(20), default="LOW")
    preferred_reward_type: Mapped[str] = mapped_column(String(50), default="NONE")


class CustomerGoal(Base):
    __tablename__ = "customer_goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)
    progress: Mapped[int] = mapped_column(default=0)


class CustomerSignal(Base):
    __tablename__ = "customer_signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    signal_text: Mapped[str] = mapped_column(Text, nullable=False)


class CustomerRewardsHistory(Base):
    __tablename__ = "customer_rewards_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    points: Mapped[float] = mapped_column(Float, nullable=False)
    extra_data: Mapped[str | None] = mapped_column(Text, nullable=True)


class CustomerPersonalityProfile(Base):
    __tablename__ = "customer_personality_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, unique=True)
    engagement_score: Mapped[float] = mapped_column(Float, default=0.0)
    value_explainer_view_count: Mapped[int] = mapped_column(default=0)
    cash_equivalent_uses: Mapped[int] = mapped_column(default=0)
    partner_comparisons: Mapped[int] = mapped_column(default=0)
    probabilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    motive_scores: Mapped[str | None] = mapped_column(Text, nullable=True)
    predicted_responses: Mapped[str | None] = mapped_column(Text, nullable=True)

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Reward, RewardStatus, Wallet, WalletTransaction, TransactionType, TransactionCurrency
from app.repositories.reward_repository import RewardRepository
from app.repositories.wallet_repository import WalletRepository


class ConversionService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.reward_repo = RewardRepository(db)
        self.wallet_repo = WalletRepository(db)

    async def convert_reward(self, reward_id: uuid.UUID) -> dict:
        result = await self.db.execute(select(Reward).where(Reward.id == reward_id))
        reward = result.scalar_one_or_none()
        if not reward:
            raise ValueError("Reward not found")

        if reward.status != RewardStatus.EARNED:
            raise ValueError(f"Reward status is {reward.status}, expected EARNED")

        reward.status = RewardStatus.CONVERTED

        wallet = await self.wallet_repo.get_by_customer_id(reward.customer_id)
        if not wallet:
            raise ValueError("Wallet not found")

        wallet.lbg_coin_balance += reward.points

        tx = WalletTransaction(
            wallet_id=wallet.id,
            type=TransactionType.CONVERT,
            description="Converted reward points to LBG coins",
            amount=reward.points,
            currency=TransactionCurrency.LBG_COIN,
        )
        self.db.add(tx)

        await self.db.commit()
        return {"converted": True, "points_added": reward.points}

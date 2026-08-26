from fastapi import APIRouter

from app.api.v1 import brands, conversions, customers, rewards, wallets

router = APIRouter(prefix="/api/v1")

router.include_router(customers.router, prefix="/customers", tags=["customers"])
router.include_router(brands.router, prefix="/brands", tags=["brands"])
router.include_router(rewards.router, prefix="/rewards", tags=["rewards"])
router.include_router(wallets.router, prefix="/wallet", tags=["wallets"])
router.include_router(conversions.router, prefix="/convert", tags=["conversions"])

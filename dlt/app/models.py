from pydantic import BaseModel, Field


class MintRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID to mint tokens for")
    to_address: str = Field(..., description="Blockchain wallet address")
    amount: int = Field(..., gt=0, description="Amount of LBG tokens to mint (in wei)")


class BurnRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID to burn tokens for")
    from_address: str = Field(..., description="Blockchain wallet address")
    amount: int = Field(..., gt=0, description="Amount of LBG tokens to burn (in wei)")


class TransferRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID initiating transfer")
    from_address: str = Field(..., description="Sender wallet address")
    to_address: str = Field(..., description="Recipient wallet address")
    amount: int = Field(..., gt=0, description="Amount of LBG tokens to transfer (in wei)")


class AuditLogRequest(BaseModel):
    customer_id: str
    operation: str
    amount: int
    from_address: str | None = None
    to_address: str | None = None
    tx_hash: str | None = None
    block_number: int | None = None
    block_timestamp: str | None = None
    gas_used: int | None = None
    gas_price_gwei: float | None = None
    network: str = "besu-local"
    status: str = "CONFIRMED"
    error_message: str | None = None
    metadata: dict | None = None

import os


class Settings:
    besu_rpc_url: str = os.getenv("BESU_RPC_URL", "http://besu:8545")
    chain_id: int = int(os.getenv("BESU_CHAIN_ID", "1337"))
    bank_private_key: str = os.getenv(
        "BANK_PRIVATE_KEY",
        "0x88f831dd823062ca9ce204f7fe2e4db1c62934f42e8956fcc6dc962fa736dc8b",
    )
    bank_onchain_address: str = os.getenv(
        "BANK_ONCHAIN_ADDRESS", "0xA64dFE27e652ee3A38f42888C2d570E39CA479E7"
    )
    contract_address_file: str = os.getenv(
        "CONTRACT_ADDRESS_FILE", "/app/deployed/contract_address.txt"
    )
    contracts_dir: str = os.getenv("CONTRACTS_DIR", "/app/contracts")

    db_host: str = os.getenv("DB_HOST", "postgres")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_user: str = os.getenv("DB_USER", "ilrp")
    db_password: str = os.getenv("DB_PASSWORD", "ilrp_dev_2024")
    db_name: str = os.getenv("DB_NAME", "ilrp")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()

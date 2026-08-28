import logging
import os
from typing import Any

from web3 import Web3

logger = logging.getLogger(__name__)

BESU_RPC_URL = os.getenv("BESU_RPC_URL", "http://localhost:8545")
BESU_CHAIN_ID = int(os.getenv("BESU_CHAIN_ID", "1337"))
LBGCOIN_CONTRACT_ADDRESS = os.getenv("LBGCOIN_CONTRACT_ADDRESS", "0x0000000000000000000000000000000000000000")

LBGCOIN_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
        ],
        "name": "mint",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "amount", "type": "uint256"},
        ],
        "name": "burn",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
]


class BesuClient:
    """Client for Hyperledger Besu LBG coin smart contract interactions."""

    def __init__(self):
        self._w3: Web3 | None = None
        self._contract = None
        self._connected = False

    def _connect(self) -> bool:
        try:
            self._w3 = Web3(Web3.HTTPProvider(BESU_RPC_URL))
            self._connected = self._w3.is_connected()
            if self._connected and LBGCOIN_CONTRACT_ADDRESS != "0x0000000000000000000000000000000000000000":
                self._contract = self._w3.eth.contract(
                    address=Web3.to_checksum_address(LBGCOIN_CONTRACT_ADDRESS),
                    abi=LBGCOIN_ABI,
                )
            logger.info("[BESU] Connected to %s (chain=%d, connected=%s)", BESU_RPC_URL, BESU_CHAIN_ID, self._connected)
            return self._connected
        except Exception as e:
            logger.warning("[BESU] Connection failed: %s", e)
            self._connected = False
            return False

    @property
    def is_connected(self) -> bool:
        if not self._connected:
            return self._connect()
        return self._connected

    @property
    def account(self) -> str:
        if not self._w3:
            self._connect()
        if self._w3 and self._w3.eth.accounts:
            return self._w3.eth.accounts[0]
        return "0x0000000000000000000000000000000000000000"

    def mint(self, to_address: str, amount_wei: int) -> dict[str, Any]:
        """Mint LBG coins to a customer wallet address.
        
        Args:
            to_address: Recipient wallet address
            amount_wei: Amount in wei (1 LBG = 10^18 wei)
        
        Returns:
            dict with tx_hash, block_number, gas_used, status
        """
        if not self.is_connected:
            return self._simulate_mint(to_address, amount_wei)

        try:
            checksum_addr = Web3.to_checksum_address(to_address)
            tx = self._contract.functions.mint(
                checksum_addr, amount_wei
            ).transact({
                "from": self.account,
                "chainId": BESU_CHAIN_ID,
            })
            receipt = self._w3.eth.wait_for_transaction_receipt(tx)
            return {
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "status": "CONFIRMED" if receipt.status == 1 else "FAILED",
            }
        except Exception as e:
            logger.error("[BESU] Mint failed: %s", e)
            return {
                "tx_hash": None,
                "block_number": None,
                "gas_used": None,
                "status": "FAILED",
                "error": str(e),
            }

    def burn(self, from_address: str, amount_wei: int) -> dict[str, Any]:
        """Burn LBG coins from a customer wallet address.
        
        Args:
            from_address: Wallet address to burn from
            amount_wei: Amount in wei
        
        Returns:
            dict with tx_hash, block_number, gas_used, status
        """
        if not self.is_connected:
            return self._simulate_burn(from_address, amount_wei)

        try:
            checksum_addr = Web3.to_checksum_address(from_address)
            tx = self._contract.functions.burn(
                checksum_addr, amount_wei
            ).transact({
                "from": self.account,
                "chainId": BESU_CHAIN_ID,
            })
            receipt = self._w3.eth.wait_for_transaction_receipt(tx)
            return {
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "status": "CONFIRMED" if receipt.status == 1 else "FAILED",
            }
        except Exception as e:
            logger.error("[BESU] Burn failed: %s", e)
            return {
                "tx_hash": None,
                "block_number": None,
                "gas_used": None,
                "status": "FAILED",
                "error": str(e),
            }

    def transfer(self, from_address: str, to_address: str, amount_wei: int) -> dict[str, Any]:
        """Transfer LBG coins between wallet addresses.
        
        Args:
            from_address: Sender wallet address
            to_address: Recipient wallet address
            amount_wei: Amount in wei
        
        Returns:
            dict with tx_hash, block_number, gas_used, status
        """
        if not self.is_connected:
            return self._simulate_transfer(from_address, to_address, amount_wei)

        try:
            from_addr = Web3.to_checksum_address(from_address)
            to_addr = Web3.to_checksum_address(to_address)
            tx = self._contract.functions.transfer(
                from_addr, to_addr, amount_wei
            ).transact({
                "from": self.account,
                "chainId": BESU_CHAIN_ID,
            })
            receipt = self._w3.eth.wait_for_transaction_receipt(tx)
            return {
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "status": "CONFIRMED" if receipt.status == 1 else "FAILED",
            }
        except Exception as e:
            logger.error("[BESU] Transfer failed: %s", e)
            return {
                "tx_hash": None,
                "block_number": None,
                "gas_used": None,
                "status": "FAILED",
                "error": str(e),
            }

    def get_balance(self, address: str) -> int:
        """Get LBG coin balance for an address (in wei)."""
        if not self.is_connected or not self._contract:
            return 0
        try:
            checksum_addr = Web3.to_checksum_address(address)
            return self._contract.functions.balanceOf(checksum_addr).call()
        except Exception as e:
            logger.error("[BESU] Balance check failed: %s", e)
            return 0

    def get_total_supply(self) -> int:
        """Get total LBG coin supply (in wei)."""
        if not self.is_connected or not self._contract:
            return 0
        try:
            return self._contract.functions.totalSupply().call()
        except Exception as e:
            logger.error("[BESU] Total supply check failed: %s", e)
            return 0

    def get_network_info(self) -> dict[str, Any]:
        """Get Besu network information."""
        if not self.is_connected:
            self._connect()
        info = {
            "rpc_url": BESU_RPC_URL,
            "chain_id": BESU_CHAIN_ID,
            "connected": self._connected,
            "contract_address": LBGCOIN_CONTRACT_ADDRESS,
            "contract_deployed": LBGCOIN_CONTRACT_ADDRESS != "0x0000000000000000000000000000000000000000",
            "operator_account": self.account if self._connected else None,
        }
        if self._connected and self._w3:
            try:
                info["block_number"] = self._w3.eth.block_number
                info["peer_count"] = self._w3.net.peer_count
            except Exception:
                pass
        return info

    def _simulate_mint(self, to_address: str, amount_wei: int) -> dict[str, Any]:
        """Simulate a mint when Besu is not connected (dev mode)."""
        import hashlib
        import time
        seed = f"mint:{to_address}:{amount_wei}:{time.time()}"
        tx_hash = hashlib.sha256(seed.encode()).hexdigest()[:64]
        return {
            "tx_hash": tx_hash,
            "block_number": 0,
            "gas_used": 0,
            "status": "SIMULATED",
            "network": "besu-simulated",
        }

    def _simulate_burn(self, from_address: str, amount_wei: int) -> dict[str, Any]:
        """Simulate a burn when Besu is not connected (dev mode)."""
        import hashlib
        import time
        seed = f"burn:{from_address}:{amount_wei}:{time.time()}"
        tx_hash = hashlib.sha256(seed.encode()).hexdigest()[:64]
        return {
            "tx_hash": tx_hash,
            "block_number": 0,
            "gas_used": 0,
            "status": "SIMULATED",
            "network": "besu-simulated",
        }

    def _simulate_transfer(self, from_address: str, to_address: str, amount_wei: int) -> dict[str, Any]:
        """Simulate a transfer when Besu is not connected (dev mode)."""
        import hashlib
        import time
        seed = f"transfer:{from_address}:{to_address}:{amount_wei}:{time.time()}"
        tx_hash = hashlib.sha256(seed.encode()).hexdigest()[:64]
        return {
            "tx_hash": tx_hash,
            "block_number": 0,
            "gas_used": 0,
            "status": "SIMULATED",
            "network": "besu-simulated",
        }


besu_client = BesuClient()

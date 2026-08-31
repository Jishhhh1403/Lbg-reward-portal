from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from eth_account import Account
from web3 import Web3
from web3.contract import Contract
from web3.middleware import ExtraDataToPOAMiddleware
from web3.types import TxReceipt

from app.config import settings

logger = logging.getLogger(__name__)


def _load_artifact() -> tuple[list[dict[str, Any]], str]:
    artifact_paths = (
        Path(settings.contracts_dir) / "build" / "LBGCoin.json",
        Path("/app/contracts/build/LBGCoin.json"),
    )
    for path in artifact_paths:
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            return data["abi"], data["bin"]
    raise RuntimeError(
        "Missing contract artifact contracts/build/LBGCoin.json. "
        "Run: python scripts/compile_contract.py"
    )


class BesuClient:
    def __init__(self) -> None:
        self.w3 = Web3(Web3.HTTPProvider(settings.besu_rpc_url))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.bank_account = Account.from_key(settings.bank_private_key)
        self.bank_address = Web3.to_checksum_address(self.bank_account.address)
        self._contract: Contract | None = None
        self._abi, self._bytecode = _load_artifact()
        self._nonce_counter = 0

    @property
    def connected(self) -> bool:
        return self.w3.is_connected()

    def _get_nonce(self, address: str) -> int:
        nonce = self.w3.eth.get_transaction_count(address, "pending")
        if nonce <= self._nonce_counter:
            nonce = self._nonce_counter + 1
        self._nonce_counter = nonce
        return nonce

    def _fee_fields(self) -> dict[str, int]:
        base = int(self.w3.eth.gas_price)
        priority = max(1, base // 10)
        return {
            "maxPriorityFeePerGas": priority,
            "maxFeePerGas": base + priority,
        }

    def load_or_deploy_contract(self) -> str:
        path = Path(settings.contract_address_file)
        if path.exists():
            address = path.read_text().strip()
            try:
                checksum = Web3.to_checksum_address(address)
                code = self.w3.eth.get_code(checksum)
                if code and code != b"":
                    self._bind_contract(address)
                    return address
            except Exception:
                pass
        return self.deploy_contract()

    def _bind_contract(self, address: str) -> None:
        checksum = Web3.to_checksum_address(address)
        self._contract = self.w3.eth.contract(address=checksum, abi=self._abi)

    @property
    def contract(self) -> Contract:
        if self._contract is None:
            raise RuntimeError("Contract not loaded - deploy first")
        return self._contract

    def deploy_contract(self) -> str:
        ContractFactory = self.w3.eth.contract(abi=self._abi, bytecode=self._bytecode)
        tx = ContractFactory.constructor(self.bank_address).build_transaction(
            {
                "from": self.bank_address,
                "nonce": self._get_nonce(self.bank_address),
                "gas": 15_000_000,
                "chainId": settings.chain_id,
                **self._fee_fields(),
            }
        )
        signed = self.bank_account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt["status"] != 1:
            raise RuntimeError(
                f"Contract deployment failed: tx={tx_hash.hex()} gasUsed={receipt['gasUsed']}"
            )
        address = receipt["contractAddress"]
        self._save_and_bind(address)
        return address

    def _save_and_bind(self, address: str) -> None:
        out = Path(settings.contract_address_file)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(address)
        self._bind_contract(address)
        logger.info("[BESU] Deployed LBGCoin at %s", address)

    def _send_tx(self, fn) -> TxReceipt:
        tx = fn.build_transaction(
            {
                "from": self.bank_address,
                "nonce": self._get_nonce(self.bank_address),
                "gas": 500_000,
                "chainId": settings.chain_id,
                **self._fee_fields(),
            }
        )
        signed = self.bank_account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt["status"] != 1:
            raise RuntimeError(
                f"TX failed: tx={tx_hash.hex()} gasUsed={receipt['gasUsed']}"
            )
        return receipt

    def mint(self, to_address: str, amount: int) -> dict[str, Any]:
        if not self.connected or not self._contract:
            return self._simulate("mint", to_address=to_address, amount=amount)
        try:
            checksum = Web3.to_checksum_address(to_address)
            receipt = self._send_tx(self.contract.functions.mint(checksum, amount))
            return self._receipt_to_dict(receipt)
        except Exception as e:
            logger.error("[BESU] Mint failed: %s", e)
            return {"tx_hash": None, "block_number": None, "gas_used": None, "status": "FAILED", "error": str(e)}

    def burn(self, from_address: str, amount: int) -> dict[str, Any]:
        if not self.connected or not self._contract:
            return self._simulate("burn", from_address=from_address, amount=amount)
        try:
            checksum = Web3.to_checksum_address(from_address)
            receipt = self._send_tx(self.contract.functions.burn(checksum, amount))
            return self._receipt_to_dict(receipt)
        except Exception as e:
            logger.error("[BESU] Burn failed: %s", e)
            return {"tx_hash": None, "block_number": None, "gas_used": None, "status": "FAILED", "error": str(e)}

    def transfer(self, from_address: str, to_address: str, amount: int) -> dict[str, Any]:
        if not self.connected or not self._contract:
            return self._simulate("transfer", from_address=from_address, to_address=to_address, amount=amount)
        try:
            from_addr = Web3.to_checksum_address(from_address)
            to_addr = Web3.to_checksum_address(to_address)
            receipt = self._send_tx(self.contract.functions.transferFromAny(from_addr, to_addr, amount))
            return self._receipt_to_dict(receipt)
        except Exception as e:
            logger.error("[BESU] Transfer failed: %s", e)
            return {"tx_hash": None, "block_number": None, "gas_used": None, "status": "FAILED", "error": str(e)}

    def get_balance(self, address: str) -> int:
        if not self.connected or not self._contract:
            return 0
        try:
            checksum = Web3.to_checksum_address(address)
            return int(self.contract.functions.balanceOf(checksum).call())
        except Exception as e:
            logger.error("[BESU] Balance check failed: %s", e)
            return 0

    def get_total_supply(self) -> int:
        if not self.connected or not self._contract:
            return 0
        try:
            return int(self.contract.functions.totalSupply().call())
        except Exception as e:
            logger.error("[BESU] Total supply check failed: %s", e)
            return 0

    def get_network_info(self) -> dict[str, Any]:
        if not self.connected:
            try:
                self.w3 = Web3(Web3.HTTPProvider(settings.besu_rpc_url))
                self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
            except Exception:
                pass
        info = {
            "rpc_url": settings.besu_rpc_url,
            "chain_id": settings.chain_id,
            "connected": self.connected,
            "contract_address": None,
            "bank_address": self.bank_address,
        }
        if self._contract:
            info["contract_address"] = self._contract.address
        if self.connected:
            try:
                info["block_number"] = self.w3.eth.block_number
                info["peer_count"] = self.w3.net.peer_count
            except Exception:
                pass
        return info

    def grant_role(self, role_bytes32: bytes, account: str) -> TxReceipt:
        checksum = Web3.to_checksum_address(account)
        return self._send_tx(self.contract.functions.grantRole(role_bytes32, checksum))

    def has_role(self, role_bytes32: bytes, account: str) -> bool:
        checksum = Web3.to_checksum_address(account)
        return bool(self.contract.functions.hasRole(role_bytes32, checksum).call())

    def parse_receipt_logs(self, receipt: TxReceipt) -> list[dict[str, Any]]:
        logs: list[dict[str, Any]] = []
        for log in receipt["logs"]:
            try:
                decoded = self.contract.events.Transfer().process_log(log)
                logs.append({"event": "Transfer", "args": dict(decoded["args"])})
            except Exception:
                pass
            try:
                decoded = self.contract.events.Mint().process_log(log)
                logs.append({"event": "Mint", "args": dict(decoded["args"])})
            except Exception:
                pass
            try:
                decoded = self.contract.events.Burn().process_log(log)
                logs.append({"event": "Burn", "args": dict(decoded["args"])})
            except Exception:
                pass
        return logs

    def _receipt_to_dict(self, receipt: TxReceipt) -> dict[str, Any]:
        return {
            "tx_hash": receipt["transactionHash"].hex(),
            "block_number": receipt["blockNumber"],
            "gas_used": receipt["gasUsed"],
            "status": "CONFIRMED" if receipt["status"] == 1 else "FAILED",
            "chain_id": settings.chain_id,
            "event_logs": self.parse_receipt_logs(receipt),
        }

    def _simulate(self, op: str, **kwargs) -> dict[str, Any]:
        import hashlib
        import time
        seed = f"{op}:{json.dumps(kwargs, sort_keys=True)}:{time.time()}"
        tx_hash = hashlib.sha256(seed.encode()).hexdigest()[:64]
        return {
            "tx_hash": tx_hash,
            "block_number": 0,
            "gas_used": 0,
            "status": "SIMULATED",
            "network": "besu-simulated",
        }


besu_client = BesuClient()

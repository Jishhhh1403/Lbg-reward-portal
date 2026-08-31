"""
Deploy the LBGCoin smart contract (if not already deployed) and grant permissions.
"""

import sys

from app.blockchain.client import BesuClient

MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
BURNER_ROLE = "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848"
PAUSER_ROLE = "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a"


def main() -> None:
    client = BesuClient()
    if not client.connected:
        print("WARNING: Besu not connected, continuing without on-chain deployment", file=sys.stderr)
        return

    try:
        address = client.load_or_deploy_contract()
    except Exception as exc:
        print(f"WARNING: Contract deploy failed, continuing with simulation mode: {exc}", file=sys.stderr)
        return
    bank_address = client.bank_address

    roles = {
        "MINTER_ROLE": bytes.fromhex(MINTER_ROLE[2:]),
        "BURNER_ROLE": bytes.fromhex(BURNER_ROLE[2:]),
        "PAUSER_ROLE": bytes.fromhex(PAUSER_ROLE[2:]),
    }
    for role_name, role_bytes in roles.items():
        if not client.has_role(role_bytes, bank_address):
            receipt = client.grant_role(role_bytes, bank_address)
            print(f"Granted {role_name} to {bank_address} in tx={receipt['transactionHash'].hex()}")
        else:
            print(f"{role_name} already granted to {bank_address}")

    print(f"LBGCoin at {address}")


if __name__ == "__main__":
    main()

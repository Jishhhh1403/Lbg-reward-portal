from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mock_provider import MockIntelligenceProvider
from personas.customer_data import CUSTOMER_DATA

app = FastAPI(title="Intelligence Layer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

provider = MockIntelligenceProvider()


@app.get("/intelligence/customer/{customer_id}")
async def get_customer_intelligence(customer_id: str):
    try:
        result = provider.get_customer_intelligence(customer_id)
        return result.model_dump(by_alias=True)
    except ValueError as e:
        return {"error": str(e)}, 404


@app.get("/intelligence/customers")
async def list_customers():
    customers = []
    for cid, data in CUSTOMER_DATA.items():
        customers.append({
            "id": cid,
            "name": data["name"],
            "tier": data["tier"],
            "points": data["points"],
        })
    return customers


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "intelligence-layer"}

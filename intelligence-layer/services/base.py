from abc import ABC, abstractmethod
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.intelligence import IntelligenceResponse


class IntelligenceProvider(ABC):
    @abstractmethod
    def get_customer_intelligence(self, customer_id: str) -> IntelligenceResponse:
        pass

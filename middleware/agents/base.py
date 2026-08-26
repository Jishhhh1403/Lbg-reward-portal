import json
import uuid
from datetime import datetime, timezone
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage


class BaseAgent:
    def __init__(self, llm: BaseChatModel, name: str, agent_id: str):
        self.llm = llm
        self.name = name
        self.agent_id = agent_id

    def _call_llm(self, system_prompt: str, user_content: str) -> str:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_content),
        ]
        response = self.llm.invoke(messages)
        return response.content

    def _json_parse_with_retry(self, text: str) -> dict[str, Any]:
        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            if isinstance(text, dict):
                return text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                try:
                    return json.loads(text[start:end])
                except json.JSONDecodeError:
                    pass
            return {"raw_response": text, "parse_error": True}

    def _create_message(
        self,
        state: dict,
        stage: str,
        round_name: str,
        message_type: str,
        summary: str,
        claims: list[dict] | None = None,
        recommended_actions: list[str] | None = None,
        objections: list[str] | None = None,
        candidate_refs: list[str] | None = None,
        policy_refs: list[str] | None = None,
    ) -> dict:
        seq = state.get("message_sequence", 0) + 1
        return {
            "messageId": f"msg-{uuid.uuid4().hex[:12]}",
            "sequence": seq,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": stage,
            "round": round_name,
            "fromAgent": self.agent_id,
            "toAgents": ["orchestrator"],
            "messageType": message_type,
            "summary": summary,
            "claims": claims or [],
            "recommendedActions": recommended_actions or [],
            "objections": objections or [],
            "candidateRefs": candidate_refs or [],
            "policyRefs": policy_refs or [],
            "modelVersion": "gemini-3.5-flash-lite",
            "promptTemplateVersion": "1.0",
        }

    def _append_msg(self, state: dict, msg: dict) -> dict:
        return {
            "all_messages": [msg],
            "message_sequence": msg["sequence"],
        }

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class SDUIAction(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class SDUIComponent(BaseModel):
    id: str
    type: str
    version: str = "1.0"
    priority: int
    props: dict[str, Any] = Field(default_factory=dict)
    actions: list[SDUIAction] = Field(default_factory=list)
    # Optional narrative metadata (five-agent extension). Old renderers ignore it.
    narrative: Optional[dict[str, Any]] = None


class SDUIScreen(BaseModel):
    schema_version: str = Field(default="1.0", alias="schemaVersion")
    experience_id: str = Field(alias="experienceId")
    customer_id: str = Field(alias="customerId")
    persona: str
    components: list[SDUIComponent]
    narrative: Optional[dict] = None
    experience_narrative: Optional[dict[str, Any]] = Field(
        default=None, alias="experienceNarrative"
    )

    class Config:
        populate_by_name = True


class ExperienceTrace(BaseModel):
    customer_id: str = Field(alias="customerId")
    intelligence_output: dict
    experience_strategy: str
    component_count: int
    validation_status: str
    sdui_response: dict

    class Config:
        populate_by_name = True

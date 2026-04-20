from typing import Literal

from pydantic import BaseModel, Field


Recommendation = Literal["Approve", "Revise", "Reject", "Pilot"]


class DecisionPayload(BaseModel):
    title: str
    description: str
    department: str
    industry: str
    timeHorizon: Literal[30, 90, 365]
    stakeholdersAffected: str
    budgetImpact: float = Field(ge=0)
    urgency: Literal["low", "medium", "high", "critical"]
    complianceSensitivity: Literal["low", "medium", "high"]
    currentPainPoint: str


class AnalyzeRequest(BaseModel):
    decision: DecisionPayload
    historicalDecisionCount: int = 0


class BoardroomViewpoint(BaseModel):
    role: Literal["CFO", "COO", "CHRO", "Compliance Head"]
    stance: str
    concern: str


class AnalysisResult(BaseModel):
    recommendation: Recommendation
    riskScore: int
    trustScore: int
    complianceScore: int
    roiScore: int
    humanImpactScore: int
    bestCase: str
    likelyCase: str
    worstCase: str
    hiddenRisks: list[str]
    silentPatterns: list[str]
    saferAlternative: str
    rolloutPlan: list[str]
    executiveSummary: str
    boardroomDebate: list[BoardroomViewpoint]


class WhatIfRequest(BaseModel):
    scenario: str
    department: str | None = None
    baselineCost: float = 1_000_000
    baselineRisk: float = 50


class WhatIfResult(BaseModel):
    costSaved: int
    riskDelta: int
    slaImpact: str
    customerImpact: str
    recommendation: str


class InsightsRequest(BaseModel):
    records: list[dict] = Field(default_factory=list)
    csvText: str | None = None


class InsightsResult(BaseModel):
    rowsAnalyzed: int
    columnsAnalyzed: int
    frictionSignals: list[str]
    silentPatterns: list[str]
    dataQualityScore: int


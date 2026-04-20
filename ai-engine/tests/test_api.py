from fastapi.testclient import TestClient

from src.app import app
from src.schemas.analysis import AnalysisResult, WhatIfResult


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["service"] == "surevision-ai-engine"
    assert response.json()["provider"] == "gemini"


def test_analyze_endpoint_returns_expected_shape(monkeypatch):
    class FakeProvider:
        def analyze(self, decision, historical_count=0):
            return AnalysisResult(
                recommendation="Pilot",
                riskScore=63,
                trustScore=74,
                complianceScore=68,
                roiScore=77,
                humanImpactScore=61,
                bestCase="Controls improve with staged rollout.",
                likelyCase="The pilot reduces rework with moderate oversight.",
                worstCase="Poor governance creates avoidable exceptions.",
                hiddenRisks=["A", "B", "C"],
                silentPatterns=["X", "Y", "Z"],
                saferAlternative="Run a limited pilot.",
                rolloutPlan=["Phase 1", "Phase 2", "Phase 3"],
                executiveSummary="Proceed as a pilot.",
                boardroomDebate=[
                    {"role": "CFO", "stance": "Support", "concern": "Savings attribution"},
                    {"role": "COO", "stance": "Pilot", "concern": "Operational drift"},
                    {"role": "CHRO", "stance": "Manage", "concern": "Change readiness"},
                    {"role": "Compliance Head", "stance": "Guardrails", "concern": "Control ownership"},
                ],
            )

    monkeypatch.setattr("src.routes.ai.get_provider", lambda api_key=None: FakeProvider())

    response = client.post(
        "/ai/analyze",
        json={
            "decision": {
                "title": "Centralize KYC refresh operations",
                "description": "Improve compliance throughput and visibility.",
                "department": "Compliance",
                "industry": "Banking",
                "timeHorizon": 365,
                "stakeholdersAffected": "Compliance, Operations",
                "budgetImpact": 500000,
                "urgency": "high",
                "complianceSensitivity": "high",
                "currentPainPoint": "exception backlog",
            },
            "historicalDecisionCount": 3,
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["recommendation"] in {"Approve", "Revise", "Reject", "Pilot"}
    assert "riskScore" in body
    assert len(body["boardroomDebate"]) == 4


def test_whatif_endpoint_returns_scenario_projection(monkeypatch):
    class FakeProvider:
        def what_if(self, request_payload):
            return WhatIfResult(
                costSaved=99000,
                riskDelta=9,
                slaImpact="SLA impact is manageable.",
                customerImpact="Customer impact is low.",
                recommendation="Pilot the change with checkpoints.",
            )

    monkeypatch.setattr("src.routes.ai.get_provider", lambda api_key=None: FakeProvider())

    response = client.post(
        "/ai/whatif",
        json={
            "scenario": "If vendor Y is replaced",
            "baselineCost": 900000,
            "baselineRisk": 52,
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["costSaved"] == 99000
    assert body["riskDelta"] == 9


def test_analyze_endpoint_surfaces_missing_key_errors(monkeypatch):
    monkeypatch.setattr(
        "src.routes.ai.get_provider",
        lambda api_key=None: (_ for _ in ()).throw(ValueError("Gemini API key is not configured.")),
    )

    response = client.post(
        "/ai/analyze",
        json={
            "decision": {
                "title": "Centralize KYC refresh operations",
                "description": "Improve compliance throughput and visibility.",
                "department": "Compliance",
                "industry": "Banking",
                "timeHorizon": 365,
                "stakeholdersAffected": "Compliance, Operations",
                "budgetImpact": 500000,
                "urgency": "high",
                "complianceSensitivity": "high",
                "currentPainPoint": "exception backlog",
            },
            "historicalDecisionCount": 3,
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Gemini API key is not configured."


def test_insights_endpoint_detects_friction_from_csv():
    response = client.post(
        "/ai/insights",
        json={
            "csvText": "vendor,exception_reason,age_days,amount\nA,Missing doc,12,500\nA,Missing doc,12,500\nB,,40,12500"
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["rowsAnalyzed"] == 3
    assert body["columnsAnalyzed"] == 4
    assert body["dataQualityScore"] < 100
    assert any("duplicate rows" in signal.lower() for signal in body["frictionSignals"])

from __future__ import annotations

import json
from json import JSONDecodeError
from urllib import error, request

from src.core.config import settings
from src.schemas.analysis import AnalysisResult, DecisionPayload, WhatIfRequest, WhatIfResult


class GeminiProvider:
    name = "gemini"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    def analyze(self, decision: DecisionPayload, historical_count: int = 0) -> AnalysisResult:
        prompt = {
            "task": "Analyze an enterprise decision and return only one JSON object.",
            "product": "SureVision AI",
            "decision": decision.model_dump(),
            "historicalDecisionCount": historical_count,
            "requirements": [
                "Use executive and operational reasoning grounded in the provided decision only.",
                "Return the exact keys required by the schema and no markdown.",
                "riskScore, trustScore, complianceScore, roiScore, and humanImpactScore must be integers from 0 to 100.",
                "recommendation must be one of Approve, Revise, Reject, Pilot.",
                "boardroomDebate must include CFO, COO, CHRO, and Compliance Head.",
                "hiddenRisks, silentPatterns, and rolloutPlan must each contain 3 to 5 concise items.",
            ],
            "schema": {
                "recommendation": "Approve | Revise | Reject | Pilot",
                "riskScore": 0,
                "trustScore": 0,
                "complianceScore": 0,
                "roiScore": 0,
                "humanImpactScore": 0,
                "bestCase": "",
                "likelyCase": "",
                "worstCase": "",
                "hiddenRisks": [""],
                "silentPatterns": [""],
                "saferAlternative": "",
                "rolloutPlan": [""],
                "executiveSummary": "",
                "boardroomDebate": [
                    {"role": "CFO", "stance": "", "concern": ""},
                    {"role": "COO", "stance": "", "concern": ""},
                    {"role": "CHRO", "stance": "", "concern": ""},
                    {"role": "Compliance Head", "stance": "", "concern": ""},
                ],
            },
        }

        payload = self._generate_json(prompt)
        return AnalysisResult.model_validate(payload)

    def what_if(self, request_payload: WhatIfRequest) -> WhatIfResult:
        prompt = {
            "task": "Evaluate the operational what-if scenario and return only one JSON object.",
            "scenario": request_payload.model_dump(),
            "requirements": [
                "Use realistic enterprise operations assumptions.",
                "costSaved must be an integer in the same currency unit as baselineCost.",
                "riskDelta must be an integer where negative means lower risk.",
                "Return exactly the keys in the schema and no markdown.",
            ],
            "schema": {
                "costSaved": 0,
                "riskDelta": 0,
                "slaImpact": "",
                "customerImpact": "",
                "recommendation": "",
            },
        }

        payload = self._generate_json(prompt)
        return WhatIfResult.model_validate(payload)

    def _generate_json(self, prompt: dict) -> dict:
        body = {
            "contents": [{"parts": [{"text": json.dumps(prompt)}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }

        endpoint = (
            f"https://generativelanguage.googleapis.com/"
            f"{settings.gemini_api_version}/models/{settings.gemini_model}:generateContent"
        )
        req = request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=settings.request_timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(detail or f"Gemini request failed with status {exc.code}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Gemini request failed: {exc.reason}") from exc

        return self._extract_json(payload)

    def _extract_json(self, payload: dict) -> dict:
        try:
            text = payload["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("Gemini response did not contain JSON output") from exc

        try:
            return json.loads(text)
        except JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start : end + 1])
            raise RuntimeError("Gemini response was not valid JSON")

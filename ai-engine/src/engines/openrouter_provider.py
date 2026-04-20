from __future__ import annotations

import json
from json import JSONDecodeError
from urllib import error, request

from src.core.config import settings
from src.schemas.analysis import AnalysisResult, DecisionPayload, WhatIfRequest, WhatIfResult


class OpenRouterProvider:
    name = "openrouter"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.model = settings.openrouter_model

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
                "riskScore": 0, "trustScore": 0, "complianceScore": 0, "roiScore": 0, "humanImpactScore": 0,
                "bestCase": "", "likelyCase": "", "worstCase": "",
                "hiddenRisks": [""], "silentPatterns": [""],
                "saferAlternative": "", "rolloutPlan": [""], "executiveSummary": "",
                "boardroomDebate": [
                    {"role": "CFO", "stance": "", "concern": ""},
                    {"role": "COO", "stance": "", "concern": ""},
                    {"role": "CHRO", "stance": "", "concern": ""},
                    {"role": "Compliance Head", "stance": "", "concern": ""},
                ],
            },
        }

        payload = self._chat(json.dumps(prompt))
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
                "costSaved": 0, "riskDelta": 0,
                "slaImpact": "", "customerImpact": "", "recommendation": "",
            },
        }

        payload = self._chat(json.dumps(prompt))
        return WhatIfResult.model_validate(payload)

    def _chat(self, user_message: str) -> dict:
        body = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are SureVision AI, an enterprise decision intelligence engine. "
                               "You MUST respond with ONLY valid JSON matching the requested schema. "
                               "No markdown, no explanation, no code fences — just the JSON object.",
                },
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.2,
            "max_tokens": 1500,
        }

        req = request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://surevision.ai",
                "X-Title": "SureVision AI",
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=settings.request_timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(detail or f"OpenRouter request failed with status {exc.code}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"OpenRouter request failed: {exc.reason}") from exc

        return self._extract_json(payload)

    def _extract_json(self, payload: dict) -> dict:
        try:
            text = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("OpenRouter response did not contain expected content") from exc

        # Strip markdown fences if present
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        try:
            return json.loads(text)
        except JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start : end + 1])
            raise RuntimeError(f"OpenRouter response was not valid JSON: {text[:200]}")

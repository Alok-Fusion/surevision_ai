import pytest

from src.engines.gemini_provider import GeminiProvider


@pytest.fixture
def provider():
    return GeminiProvider("test-key")


def test_extract_json_reads_candidate_text(provider):
    payload = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": '{"recommendation":"Pilot","riskScore":61,"trustScore":73,"complianceScore":69,"roiScore":75,"humanImpactScore":64,"bestCase":"A","likelyCase":"B","worstCase":"C","hiddenRisks":["1","2","3"],"silentPatterns":["4","5","6"],"saferAlternative":"D","rolloutPlan":["7","8","9"],"executiveSummary":"E","boardroomDebate":[{"role":"CFO","stance":"Support","concern":"Control"},{"role":"COO","stance":"Pilot","concern":"Ops"},{"role":"CHRO","stance":"Manage","concern":"People"},{"role":"Compliance Head","stance":"Guard","concern":"Policy"}]}'
                        }
                    ]
                }
            }
        ]
    }

    result = provider._extract_json(payload)

    assert result["recommendation"] == "Pilot"
    assert result["riskScore"] == 61


def test_extract_json_handles_wrapped_json(provider):
    payload = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": '```json\n{"costSaved":1000,"riskDelta":-2,"slaImpact":"A","customerImpact":"B","recommendation":"C"}\n```'
                        }
                    ]
                }
            }
        ]
    }

    result = provider._extract_json(payload)

    assert result["costSaved"] == 1000
    assert result["riskDelta"] == -2


def test_extract_json_raises_on_missing_payload(provider):
    with pytest.raises(RuntimeError):
        provider._extract_json({})

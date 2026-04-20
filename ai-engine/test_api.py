import urllib.request
import json
import time

API_KEY = "sk-or-v1-020" # wait, I don't have the user's actual API key.

# Instead of hitting OpenRouter directly, I will hit the Python AI Engine locally.
req = urllib.request.Request(
    "http://localhost:8000/ai/analyze",
    data=json.dumps({
        "decision": {
            "title": "test",
            "description": "test",
            "department": "test",
            "industry": "test",
            "timeHorizon": 30,
            "stakeholdersAffected": "test",
            "budgetImpact": 100,
            "urgency": "low",
            "complianceSensitivity": "low",
            "currentPainPoint": "test"
        },
        "historicalDecisionCount": 0
    }).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    print("Sending request to local AI Engine on port 8000...")
    start = time.time()
    with urllib.request.urlopen(req, timeout=150) as response:
        data = response.read().decode("utf-8")
        print(f"Success in {time.time() - start:.2f}s: {data}")
except Exception as e:
    import traceback
    traceback.print_exc()

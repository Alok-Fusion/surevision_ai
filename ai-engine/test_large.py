import urllib.request
import json
import time

API_KEY = "sk-or-v1-020"

# Create a huge 40,000 char description
huge_desc = "This is a test sentence that is repeated to create a massive description. " * 500

req = urllib.request.Request(
    "http://localhost:8000/ai/analyze",
    data=json.dumps({
        "decision": {
            "title": "Massive Document Processing Test",
            "description": huge_desc,
            "department": "IT",
            "industry": "Tech",
            "timeHorizon": 30,
            "stakeholdersAffected": "Everyone",
            "budgetImpact": 100000,
            "urgency": "high",
            "complianceSensitivity": "high",
            "currentPainPoint": "We need to test large document processing"
        },
        "historicalDecisionCount": 5
    }).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    print(f"Sending massive request ({len(huge_desc)} chars) to local AI Engine on port 8000...")
    start = time.time()
    with urllib.request.urlopen(req, timeout=150) as response:
        data = response.read().decode("utf-8")
        print(f"Success in {time.time() - start:.2f}s!")
except Exception as e:
    import traceback
    traceback.print_exc()

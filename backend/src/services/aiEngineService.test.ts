import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeDecision, runWhatIf } from "./aiEngineService";

vi.mock("axios");

const decision = {
  title: "Automate invoice exception routing",
  description: "Reduce rework in accounts payable.",
  department: "Finance",
  industry: "Banking",
  timeHorizon: 90,
  stakeholdersAffected: "Finance Ops",
  budgetImpact: 250000,
  urgency: "high",
  complianceSensitivity: "medium",
  currentPainPoint: "manual rework"
};

describe("aiEngineService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the remote AI analysis when the engine succeeds", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        recommendation: "Approve",
        riskScore: 41
      }
    } as never);

    const result = await analyzeDecision(decision as never, 3, "gemini-key-1234");

    expect(result).toEqual({
      recommendation: "Approve",
      riskScore: 41
    });
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/ai/analyze"),
      expect.any(Object),
      expect.objectContaining({
        headers: { "x-surevision-gemini-key": "gemini-key-1234" }
      })
    );
  });

  it("throws a descriptive error when the engine returns an application error", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce({
      response: {
        status: 503,
        data: { detail: "Gemini API key is not configured." }
      },
      message: "Service unavailable",
      isAxiosError: true
    });

    await expect(analyzeDecision(decision as never, 0)).rejects.toThrow("Gemini API key is not configured.");
  });

  it("throws a simulation error when the what-if engine is unavailable", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce({
      response: {
        status: 502,
        data: { detail: "Gemini request failed." }
      },
      message: "Bad gateway",
      isAxiosError: true
    });

    await expect(runWhatIf({ scenario: "If process X is automated" })).rejects.toThrow("Gemini request failed.");
  });
});

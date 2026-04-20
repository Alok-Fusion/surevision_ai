import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";

describe("api helper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("adds the auth token and parses JSON responses", async () => {
    window.localStorage.setItem("surevision.accessToken", "live-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));

    await expect(api.get<{ ok: boolean }>("/dashboard")).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:5000/api/dashboard");
    expect(init?.method).toBe("GET");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer live-token");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("returns blobs for export responses and skips JSON content headers for form data", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["demo"], { type: "text/plain" }), "demo.txt");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("decision,score", { status: 200, headers: { "content-type": "text/csv" } }));

    const result = await api.post<Blob>("/upload", formData, { auth: false });

    expect(result.type).toBe("text/csv");
    await expect(result.text()).resolves.toBe("decision,score");
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBeNull();
    expect(headers.get("content-type")).toBeNull();
  });
});

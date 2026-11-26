import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson } from "@/lib/postJson";

const fetchMock = vi.fn();

describe("postJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("JSON を POST して、レスポンスの JSON を返す", async () => {
    vi.stubGlobal("fetch", fetchMock.mockResolvedValue(Response.json({ isOk: true })));

    expect(await postJson("/api/x", { a: 1 })).toEqual({ isOk: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"a":1}',
    });
  });

  it("エラーのステータスでも本文の JSON を返す", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock.mockResolvedValue(Response.json({ isOk: false, reason: "rate_limited" }, { status: 429 })),
    );

    expect(await postJson("/api/x", {})).toEqual({ isOk: false, reason: "rate_limited" });
  });

  it("本文が JSON でなければ null を返す", async () => {
    vi.stubGlobal("fetch", fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 })));

    expect(await postJson("/api/x", {})).toBeNull();
  });

  it("通信できなければ例外を投げる", async () => {
    vi.stubGlobal("fetch", fetchMock.mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(postJson("/api/x", {})).rejects.toThrow("Failed to fetch");
  });
});

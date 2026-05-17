import { describe, expect, it } from "vitest";
import { GitHubApiError } from "./github";

describe("GitHubApiError", () => {
  it("stores status and resetAt", () => {
    const reset = new Date("2024-01-01T00:00:00Z");
    const err = new GitHubApiError("Rate limited", 403, reset);
    expect(err.status).toBe(403);
    expect(err.resetAt).toEqual(reset);
    expect(err.message).toBe("Rate limited");
    expect(err.name).toBe("GitHubApiError");
  });

  it("works without resetAt", () => {
    const err = new GitHubApiError("Not found", 404);
    expect(err.status).toBe(404);
    expect(err.resetAt).toBeUndefined();
  });
});

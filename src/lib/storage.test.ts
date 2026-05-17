import { describe, expect, it } from "vitest";
import { parseStoredRepos } from "./storage";

describe("parseStoredRepos", () => {
  it("returns an empty array for null input", () => {
    expect(parseStoredRepos(null)).toEqual([]);
  });

  it("returns an empty array for corrupt JSON", () => {
    expect(parseStoredRepos("{bad json")).toEqual([]);
  });

  it("returns an empty array for non-array JSON", () => {
    expect(parseStoredRepos('{"not": "array"}')).toEqual([]);
  });

  it("returns parsed array for valid JSON", () => {
    const repos = [{ id: 1, name: "test", savedAt: 123 }];
    expect(parseStoredRepos(JSON.stringify(repos))).toEqual(repos);
  });
});

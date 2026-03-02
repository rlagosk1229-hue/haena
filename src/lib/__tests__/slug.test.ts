import { describe, it, expect } from "vitest";
import { generateSlug } from "../slug";

describe("generateSlug", () => {
  it("converts title to URL-safe slug", () => {
    const slug = generateSlug("Hello World");
    expect(slug).toMatch(/^hello-world-[a-z0-9]+$/);
  });

  it("handles Korean title", () => {
    const slug = generateSlug("오늘의 일기");
    // Korean gets encoded, plus unique suffix
    expect(slug).toMatch(/-[a-z0-9]+$/);
    expect(slug.length).toBeGreaterThan(3);
  });

  it("strips special characters", () => {
    const slug = generateSlug("Hello! @World #2024");
    expect(slug).not.toMatch(/[!@#]/);
  });

  it("generates unique slugs for same title", () => {
    const slug1 = generateSlug("Same Title");
    const slug2 = generateSlug("Same Title");
    expect(slug1).not.toBe(slug2);
  });

  it("throws on empty title", () => {
    expect(() => generateSlug("")).toThrow("제목이 필요합니다");
  });

  it("throws on whitespace-only title", () => {
    expect(() => generateSlug("   ")).toThrow("제목이 필요합니다");
  });
});

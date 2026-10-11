import { describe, expect, it } from "vitest";
import {
  createOrganizationSchema,
  organizationSlugSchema,
} from "../src/validation.js";

describe("organizationSlugSchema", () => {
  it("accepts lowercase slugs and normalizes case", () => {
    expect(organizationSlugSchema.safeParse("miso-catering-1").success).toBe(true);
    expect(organizationSlugSchema.parse("Miso")).toBe("miso");
  });

  it("rejects empty, long, and malformed slugs", () => {
    expect(organizationSlugSchema.safeParse("").success).toBe(false);
    expect(organizationSlugSchema.safeParse("x".repeat(65)).success).toBe(false);
    expect(organizationSlugSchema.safeParse("-lead").success).toBe(false);
    expect(organizationSlugSchema.safeParse("trail-").success).toBe(false);
    expect(organizationSlugSchema.safeParse("two words").success).toBe(false);
    expect(organizationSlugSchema.safeParse("under_score").success).toBe(false);
  });
});

describe("createOrganizationSchema", () => {
  it("trims the name and rejects blanks", () => {
    expect(createOrganizationSchema.safeParse({ name: "  Miso  ", slug: "miso" }).success).toBe(true);
    expect(createOrganizationSchema.safeParse({ name: "   ", slug: "miso" }).success).toBe(false);
    expect(createOrganizationSchema.safeParse({ name: "x".repeat(121), slug: "miso" }).success).toBe(false);
  });
});

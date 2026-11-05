import { describe, expect, it } from "vitest";
import {
  PRODUCT_CATALOGUE,
  PRODUCT_CATEGORIES,
  getProduct,
  getRelatedProducts,
} from "../src/data/product-catalogue";

describe("public product catalogue", () => {
  it("includes the eight initial offerings with unique detail routes", () => {
    const slugs = PRODUCT_CATALOGUE.map(product => product.slug);

    expect(PRODUCT_CATALOGUE).toHaveLength(8);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "free-professional-business-website",
        "lead-response",
        "whatsapp-ai-agent",
        "social-dm-agent",
        "booking-system",
        "customer-follow-up",
        "ai-receptionist",
        "winlerros",
      ])
    );
  });

  it("provides complete product detail content and real internal conversion routes", () => {
    for (const product of PRODUCT_CATALOGUE) {
      expect(product.name).toBeTruthy();
      expect(product.shortDescription).toBeTruthy();
      expect(product.customerProblem).toBeTruthy();
      expect(product.features.length).toBeGreaterThan(0);
      expect(product.workflow.length).toBeGreaterThan(0);
      expect(product.benefits.length).toBeGreaterThan(0);
      expect(product.requirements.length).toBeGreaterThan(0);
      expect(product.integrations.length).toBeGreaterThan(0);
      expect(product.availability).toBeTruthy();
      expect(product.pricing).toBeNull();
      expect(product.cta.href).toMatch(/^\/(get-started|signup)$/);
      expect(product.relatedProducts.length).toBeGreaterThan(0);
      expect(getRelatedProducts(product).length).toBe(product.relatedProducts.length);
    }
  });

  it("defines all requested catalogue categories and resolves products by slug", () => {
    expect(Object.keys(PRODUCT_CATEGORIES)).toEqual([
      "websites",
      "business-automation",
      "ai-agents",
      "business-operations",
      "platform",
    ]);
    expect(getProduct("whatsapp-ai-agent")?.name).toBe("WhatsApp AI Agent");
    expect(getProduct("missing-product")).toBeUndefined();
  });
});

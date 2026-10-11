/**
 * @winlerr/workspace — input validation (zod). Mirrors the SQL CHECK
 * constraints in 20261012000000 so invalid input fails before any query.
 */
import { z } from "zod";

export const organizationNameSchema = z
  .string()
  .trim()
  .min(1, "invalid-name")
  .max(120, "invalid-name");

export const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "invalid-slug")
  .max(64, "invalid-slug")
  .regex(/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/, "invalid-slug");

export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

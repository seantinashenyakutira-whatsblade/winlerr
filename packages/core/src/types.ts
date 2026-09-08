export const productKeys = [
  "lead-response",
  "crm-lite",
  "booking",
  "social-agent",
  "website-system",
] as const;

export type ProductKey = (typeof productKeys)[number];
export type ProductStatus = "planned" | "requested" | "scoping" | "active" | "paused" | "retired";
export type RequestStatus = "submitted" | "triaged" | "scoping" | "approved" | "in_progress" | "delivered" | "declined";
export type LeadStatus = "new" | "needs_reply" | "qualified" | "waiting" | "replied" | "closed";
export type LeadSource = "website" | "referral" | "manual" | "email" | "whatsapp";

export interface ProductDefinition {
  key: ProductKey;
  name: string;
  shortDescription: string;
  availability: "mvp" | "planned" | "architecture_ready" | "demonstrable";
}

export interface ProductInstance {
  id: string;
  organizationId: string;
  productKey: ProductKey;
  status: ProductStatus;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  id: string;
  organizationId?: string;
  requesterEmail: string;
  productKey: ProductKey;
  brief: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  source: LeadSource;
  intent?: ProductKey;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeadEvent {
  id: string;
  leadId: string;
  organizationId: string;
  type: "created" | "status_changed" | "note_added" | "response_drafted" | "response_sent";
  actorUserId?: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface LeadResponse {
  id: string;
  leadId: string;
  organizationId: string;
  body: string;
  channel: "internal_draft" | "email" | "whatsapp";
  status: "draft" | "sent" | "failed";
  createdAt: string;
}

export function isProductKey(value: string): value is ProductKey {
  return productKeys.includes(value as ProductKey);
}

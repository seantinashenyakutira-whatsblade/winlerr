export type ProductCategory =
  "websites" | "business-automation" | "ai-agents" | "business-operations" | "platform";

export const PRODUCT_CATEGORIES: Record<ProductCategory, string> = {
  websites: "Websites",
  "business-automation": "Business automation systems",
  "ai-agents": "AI agents",
  "business-operations": "Business operations",
  platform: "WinlerrOS platform",
};

export interface ProductCatalogueEntry {
  slug: string;
  name: string;
  category: ProductCategory[];
  shortDescription: string;
  customerProblem: string;
  features: string[];
  workflow: string[];
  benefits: string[];
  requirements: string[];
  integrations: string[];
  availability: string;
  /** Populated only from the approved Systems Lab catalogue specification. */
  pricing: string | null;
  cta: { label: string; href: string };
  relatedProducts: string[];
}

/**
 * Public-facing product facts live here so catalogue cards, system pages, and
 * product detail pages use the same source. Availability and pricing are
 * intentionally conservative until Systems Lab approves the catalogue contract.
 */
export const PRODUCT_CATALOGUE: ProductCatalogueEntry[] = [
  {
    slug: "free-professional-business-website",
    name: "Free Professional Business Website",
    category: ["websites"],
    shortDescription: "A clear, professional online home for your business.",
    customerProblem:
      "Customers need a trusted place to understand what you offer and how to reach you, even when you are busy.",
    features: [
      "A mobile-friendly page introducing your business",
      "Clear service information and contact paths",
      "A foundation that can connect with Winlerr systems",
    ],
    workflow: [
      "Share your business details, services, and preferred contact channels.",
      "Review the proposed page and provide any corrections.",
      "Discuss publication and any next steps with the Winlerr team.",
    ],
    benefits: [
      "Give customers a consistent place to learn about your business",
      "Make it easier to find your contact details on a phone",
      "Create a starting point for future customer workflows",
    ],
    requirements: [
      "Business name, location, and service details",
      "A working phone number or other preferred contact method",
      "Business photos and branding, if available",
    ],
    integrations: ["Contact channels are agreed during setup."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Request a website", href: "/get-started" },
    relatedProducts: ["lead-response", "winlerros"],
  },
  {
    slug: "lead-response",
    name: "Lead Response",
    category: ["business-automation"],
    shortDescription: "A clearer way to capture, acknowledge, and organize new enquiries.",
    customerProblem:
      "Enquiries can arrive through several channels while the team is busy, making it hard to respond consistently or spot the next action.",
    features: [
      "A shared view of incoming enquiries",
      "Configurable acknowledgement and qualification steps",
      "Lead details organized for a human follow-up",
    ],
    workflow: [
      "A customer makes contact through an agreed channel.",
      "The enquiry is captured and acknowledged according to the agreed workflow.",
      "Relevant details are organized for your team to review and follow up.",
    ],
    benefits: [
      "Make incoming enquiries easier to track",
      "Give your team a more consistent first-response process",
      "Keep the next follow-up visible",
    ],
    requirements: [
      "Your current enquiry channels and response process",
      "The information your team needs to qualify an enquiry",
      "A named team member for hand-offs",
    ],
    integrations: ["Website forms, WhatsApp, and social channels are discussed during discovery."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Discuss Lead Response", href: "/get-started" },
    relatedProducts: ["whatsapp-ai-agent", "customer-follow-up"],
  },
  {
    slug: "whatsapp-ai-agent",
    name: "WhatsApp AI Agent",
    category: ["ai-agents"],
    shortDescription:
      "An assistant concept for handling common customer conversations on WhatsApp.",
    customerProblem:
      "Repeated questions and busy periods can make it difficult to keep up with customer messages.",
    features: [
      "Answers shaped around approved business information",
      "A path for passing complex conversations to a person",
      "Conversation goals agreed with your team",
    ],
    workflow: [
      "A customer starts a conversation on an agreed WhatsApp channel.",
      "The assistant responds using information approved by your business.",
      "A team member takes over when the conversation needs a person.",
    ],
    benefits: [
      "Reduce repetitive manual replies",
      "Give customers a consistent first point of contact",
      "Keep human support available for nuanced requests",
    ],
    requirements: [
      "A suitable WhatsApp Business setup",
      "Approved answers, policies, and escalation rules",
      "A team member responsible for hand-offs",
    ],
    integrations: ["WhatsApp Business; setup and eligibility are confirmed during discovery."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Discuss a WhatsApp agent", href: "/get-started" },
    relatedProducts: ["lead-response", "booking-system"],
  },
  {
    slug: "social-dm-agent",
    name: "Social DM Agent",
    category: ["ai-agents"],
    shortDescription:
      "A proposed assistant for organizing and responding to social inbox enquiries.",
    customerProblem:
      "Questions in social inboxes can be missed or answered late when a business receives messages across multiple pages.",
    features: [
      "Responses based on information approved by your business",
      "A route for handing conversations to your team",
      "Enquiry details organized around your sales process",
    ],
    workflow: [
      "A customer messages an eligible social inbox.",
      "The assistant uses approved product and business information to respond.",
      "A person reviews or takes over conversations that need attention.",
    ],
    benefits: [
      "Make social enquiries easier to manage",
      "Keep answers aligned with your current business information",
      "Help your team see which conversations need a reply",
    ],
    requirements: [
      "Business-managed social pages and inbox access",
      "Current product, service, and policy information",
      "Clear rules for human review and escalation",
    ],
    integrations: ["Eligible Meta inbox connections are confirmed during discovery."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Discuss social inbox support", href: "/get-started" },
    relatedProducts: ["whatsapp-ai-agent", "lead-response"],
  },
  {
    slug: "booking-system",
    name: "Booking System",
    category: ["business-automation"],
    shortDescription:
      "A booking workflow concept for services with appointments or scheduled sessions.",
    customerProblem:
      "Arranging appointments over messages can take time and make availability harder to keep consistent.",
    features: [
      "Service and appointment details organized in one flow",
      "Availability rules defined with your team",
      "A confirmation and reminder workflow scoped to your needs",
    ],
    workflow: [
      "A customer chooses a service and requests an available time.",
      "The booking follows the availability and approval rules agreed with your business.",
      "The customer and team receive the agreed booking details.",
    ],
    benefits: [
      "Make appointment requests easier for customers",
      "Keep scheduling rules clear for your team",
      "Reduce manual coordination where the workflow allows",
    ],
    requirements: [
      "A list of services and their durations",
      "Working hours, availability, and booking rules",
      "A person responsible for schedule changes and exceptions",
    ],
    integrations: ["Website and messaging connections are scoped during discovery."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Discuss booking needs", href: "/get-started" },
    relatedProducts: ["whatsapp-ai-agent", "customer-follow-up"],
  },
  {
    slug: "customer-follow-up",
    name: "Customer Follow-up",
    category: ["business-automation"],
    shortDescription: "A structured way to keep agreed follow-ups visible to your team.",
    customerProblem:
      "Quotes, promised callbacks, and repeat-service reminders can slip through when they depend on memory.",
    features: [
      "Follow-up steps defined around your customer process",
      "Clear ownership for reminders and responses",
      "A human hand-off when a customer replies",
    ],
    workflow: [
      "Your team records a quote, request, or agreed next step.",
      "The workflow prompts a follow-up at a time agreed with your business.",
      "A customer reply is routed according to your team’s process.",
    ],
    benefits: [
      "Make follow-up commitments easier to see",
      "Support a more consistent customer experience",
      "Help your team reconnect with customers at the right time",
    ],
    requirements: [
      "Your follow-up policy and preferred timing",
      "Customer contact details collected with appropriate consent",
      "A named owner for replies and opt-out requests",
    ],
    integrations: ["Contact and messaging connections are confirmed during discovery."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Discuss customer follow-up", href: "/get-started" },
    relatedProducts: ["lead-response", "booking-system"],
  },
  {
    slug: "ai-receptionist",
    name: "AI Receptionist",
    category: ["ai-agents", "business-operations"],
    shortDescription:
      "A proposed digital front-desk workflow for common enquiries and message taking.",
    customerProblem:
      "When staff are occupied or away, customers may not know where to direct a question or callback request.",
    features: [
      "A greeting and response scope agreed with your business",
      "Structured capture of callback details",
      "A clear path for questions that need a staff member",
    ],
    workflow: [
      "A customer contacts a channel selected during setup.",
      "The assistant responds to approved questions or records a message.",
      "The request is passed to the right person for follow-up.",
    ],
    benefits: [
      "Give customers a clear first point of contact",
      "Collect callback details in a consistent format",
      "Help staff see which enquiries need attention",
    ],
    requirements: [
      "Approved business information and response boundaries",
      "Contact details your team needs for a callback",
      "Named staff contacts and escalation rules",
    ],
    integrations: ["Supported messaging channels are confirmed during discovery."],
    availability: "Availability to confirm",
    pricing: null,
    cta: { label: "Discuss an AI receptionist", href: "/get-started" },
    relatedProducts: ["lead-response", "whatsapp-ai-agent"],
  },
  {
    slug: "winlerros",
    name: "WinlerrOS",
    category: ["platform", "business-operations"],
    shortDescription: "A workspace concept for bringing everyday business activity into one place.",
    customerProblem:
      "Customer details, conversations, and operational tasks can become difficult to follow when they live in separate places.",
    features: [
      "A business workspace and onboarding path",
      "A product preview of customer and operations views",
      "A foundation designed to grow with connected Winlerr systems",
    ],
    workflow: [
      "Create an account through the WinlerrOS signup flow.",
      "Add business context during workspace setup.",
      "Review the available workspace tools and current access with Winlerr.",
    ],
    benefits: [
      "Give business information a more organized home",
      "Create a clearer view of work that needs attention",
      "Explore a connected operating experience as it becomes available",
    ],
    requirements: [
      "A valid email address for account creation",
      "Business details for workspace setup",
      "Current account access and module availability confirmed with Winlerr",
    ],
    integrations: ["Connected systems and modules depend on current account availability."],
    availability: "Account access and modules to confirm",
    pricing: null,
    cta: { label: "Create a WinlerrOS account", href: "/signup" },
    relatedProducts: ["lead-response", "free-professional-business-website"],
  },
];

export function getProduct(slug: string): ProductCatalogueEntry | undefined {
  return PRODUCT_CATALOGUE.find(product => product.slug === slug);
}

export function getRelatedProducts(product: ProductCatalogueEntry): ProductCatalogueEntry[] {
  return product.relatedProducts
    .map(slug => getProduct(slug))
    .filter((related): related is ProductCatalogueEntry => related !== undefined);
}

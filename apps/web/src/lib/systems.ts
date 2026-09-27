export interface SystemPair {
  name: string;
  detail: string;
  slug: string;
}

export interface SystemDetail {
  slug: string;
  name: string;
  tagline: string;
  hero: string;
  who: string[];
  steps: string[];
  get: string[];
  pairs: SystemPair[];
  cta: string;
}

/**
 * Editorial copy for the six /systems detail pages.
 *
 * Kept in a data module (like `lib/docs.ts`) so the list page and the detail
 * page read from one source and cannot drift apart.
 */
export const SYSTEM_DETAILS: SystemDetail[] = [
  {
    slug: "lead-response",
    name: "Lead Response",
    tagline: "Answer every enquiry before the lead goes cold.",
    hero: "Lead Response captures every message from your website, WhatsApp, and social inboxes. Built for busy owners who cannot monitor phones all day. It replaces slow replies and lost sales with instant qualification.",
    who: [
      "Contractors and trade businesses",
      "Real estate and property agents",
      "Professional services firms",
      "Event planners and caterers",
    ],
    steps: [
      "A customer sends an enquiry through your website, WhatsApp, or social inbox.",
      "The system sends an immediate confirmation so the lead knows you received it.",
      "It asks a few simple questions to understand their budget and timeline.",
      "You receive an alert with the qualified details to close the sale.",
    ],
    get: [
      "Instant reply across web forms, WhatsApp, and social DMs",
      "Smart qualification questions tailored to your service",
      "Direct notifications sent straight to your phone",
      "Contact details organized for quick follow-up",
      "Zero unanswered customer enquiries day or night",
    ],
    pairs: [
      {
        name: "WhatsApp AI Agent",
        detail: "Takes over the conversation once the enquiry is captured.",
        slug: "whatsapp-ai-agent",
      },
      {
        name: "Customer Follow-up",
        detail: "Checks back with qualified leads who did not buy right away.",
        slug: "customer-follow-up",
      },
    ],
    cta: "See how Lead Response works for your business at winlerr.vip/get-started.",
  },
  {
    slug: "whatsapp-ai-agent",
    name: "WhatsApp AI Agent",
    tagline: "An AI assistant living inside your business WhatsApp.",
    hero: "This assistant sits inside your WhatsApp business account to answer common questions and take bookings around the clock. Made for companies getting flooded with repetitive texts. It replaces manual typing with instant replies.",
    who: [
      "Restaurants and food delivery spots",
      "Hair salons, barbershops, and spas",
      "Retail shops and boutiques",
      "Medical and dental clinics",
    ],
    steps: [
      "A customer texts your business WhatsApp with a question or request.",
      "The agent answers menu, service, or location details in natural language.",
      "It guides the customer to complete an order, booking, or enquiry.",
      "Complex questions get routed directly to you or your staff.",
    ],
    get: [
      "24/7 automated replies directly inside WhatsApp",
      "Accurate answers to common questions about your business",
      "Automated appointment and reservation handling",
      "Smooth handoff to a human team member when needed",
      "Natural Zambian tone matching how your customers chat",
    ],
    pairs: [
      {
        name: "Booking System",
        detail: "Confirms slots directly within the WhatsApp chat.",
        slug: "booking-system",
      },
      {
        name: "Customer Follow-up",
        detail: "Re-engages past chat inquiries with timely reminders.",
        slug: "customer-follow-up",
      },
    ],
    cta: "Test the live WhatsApp AI Agent demo on winlerr.vip today.",
  },
  {
    slug: "social-dm-agent",
    name: "Social DM Agent",
    tagline: "Turn Facebook and Instagram DMs into paying customers.",
    hero: "Social DM Agent manages your Facebook and Instagram inboxes without delay. Built for retail brands and creators who receive constant price checks and stock questions. It replaces unread message requests with quick sales conversations.",
    who: [
      "Clothing boutiques and fashion brands",
      "Electronics and phone retailers",
      "Bakeries and custom cake bakers",
      "Furniture and home decor stores",
    ],
    steps: [
      "A buyer comments on a post or sends a DM asking about price or availability.",
      "The agent shares product details, available sizes, and ordering steps.",
      "It directs ready buyers to your checkout or sends them to your WhatsApp.",
      "You get alerted when an order is ready for payment or collection.",
    ],
    get: [
      "Fast responses to Instagram and Facebook messages",
      "Automatic sharing of product pricing and stock details",
      "Clear guidance directing social browsers into WhatsApp",
      "Lead capture from post comments and direct messages",
      "Coverage during evening hours when social browsing peaks",
    ],
    pairs: [
      {
        name: "WhatsApp AI Agent",
        detail: "Closes sales once social shoppers move to WhatsApp.",
        slug: "whatsapp-ai-agent",
      },
      {
        name: "Lead Response",
        detail: "Keeps track of customer details across every platform.",
        slug: "lead-response",
      },
    ],
    cta: "Automate your Instagram and Facebook inboxes at winlerr.vip/get-started.",
  },
  {
    slug: "booking-system",
    name: "Booking System",
    tagline: "Online bookings without the back-and-forth messages.",
    hero: "The Booking System allows clients to choose services and reserve open dates directly. Perfect for service businesses tired of comparing calendars over WhatsApp. It replaces double bookings and missed appointments with automated scheduling.",
    who: [
      "Beauty salons and barbershops",
      "Private tutors and training centers",
      "Vehicle repair workshops and detailers",
      "Photography and video studios",
    ],
    steps: [
      "Your client views available services and open time slots on your site.",
      "They select a date and enter their name and phone number.",
      "The system sends an instant confirmation with booking details.",
      "Automated reminders go out before the appointment to prevent no-shows.",
    ],
    get: [
      "Clean booking calendar visible on mobile and desktop",
      "Automated appointment confirmations sent immediately",
      "Scheduled reminders to cut down on missed appointments",
      "Buffer times between slots to prevent scheduling clashes",
      "Custom service menus with exact durations displayed",
    ],
    pairs: [
      {
        name: "WhatsApp AI Agent",
        detail: "Lets customers book directly while chatting.",
        slug: "whatsapp-ai-agent",
      },
      {
        name: "Customer Follow-up",
        detail: "Invites clients back when it is time for their next visit.",
        slug: "customer-follow-up",
      },
    ],
    cta: "Add automated booking to your business website at winlerr.vip/get-started.",
  },
  {
    slug: "customer-follow-up",
    name: "Customer Follow-up",
    tagline: "Automatic follow-ups that turn past quotes into sales.",
    hero: "Customer Follow-up sends timely check-ins to leads who requested quotes and past clients due for another visit. Built for busy teams who forget to follow up manually. It replaces abandoned conversations with consistent repeat business.",
    who: [
      "Building contractors and trade services",
      "Car dealerships and rental agencies",
      "Insurance and financial advisors",
      "Wholesale suppliers and distributors",
    ],
    steps: [
      "The system notes when a quote or service has been delivered to a client.",
      "It sends a polite check-in after a few days to answer questions.",
      "If no reply comes back, it sends a final gentle nudge.",
      "When the client replies, the conversation is handed right to you.",
    ],
    get: [
      "Automated check-ins on pending quotes and proposals",
      "Post-purchase follow-ups to encourage repeat orders",
      "Reminder messages for recurring service renewals",
      "Gentle pacing that feels natural and never pushy",
      "Quick handoff the moment a customer expresses interest",
    ],
    pairs: [
      {
        name: "Lead Response",
        detail: "Nurtures incoming enquiries that do not convert immediately.",
        slug: "lead-response",
      },
      {
        name: "Booking System",
        detail: "Reminds clients to rebook their next regular appointment.",
        slug: "booking-system",
      },
    ],
    cta: "Stop losing sales to forgotten follow-ups at winlerr.vip/get-started.",
  },
  {
    slug: "ai-receptionist",
    name: "AI Receptionist",
    tagline: "A digital front desk that covers your business 24/7.",
    hero: "The AI Receptionist greets inbound chats after hours, answers everyday questions, and records detailed messages. Built for companies that receive enquiries outside work hours. It replaces unread DMs and missed chats with real answers.",
    who: [
      "Legal, accounting, and consulting firms",
      "Logistics and freight transport companies",
      "Private clinics and healthcare practices",
      "Real estate management offices",
    ],
    steps: [
      "A potential client reaches out after hours or during a busy workday.",
      "The receptionist greets them and answers basic business questions.",
      "It collects their contact information and the purpose of their enquiry.",
      "You receive a structured summary and callback request the next morning.",
    ],
    get: [
      "Complete coverage outside standard operating hours",
      "Clear answers to common questions about services and terms",
      "Structured message taking with verified phone numbers",
      "Scheduled callback requests delivered to your inbox",
      "Professional greeting reflecting your business standards",
    ],
    pairs: [
      {
        name: "Lead Response",
        detail: "Qualifies daytime enquiries while receptionist handles nights.",
        slug: "lead-response",
      },
      {
        name: "WhatsApp AI Agent",
        detail: "Handles conversational queries across WhatsApp channels.",
        slug: "whatsapp-ai-agent",
      },
    ],
    cta: "Give your business a 24/7 digital front desk at winlerr.vip/get-started.",
  },
];

export function getSystem(slug: string): SystemDetail | undefined {
  return SYSTEM_DETAILS.find((system) => system.slug === slug);
}

export interface DocsSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface DocsArticle {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: DocsSection[];
}

/**
 * Editorial copy for the public /docs section.
 *
 * Figures here are stated as targets or ranges, never as measured customer
 * results, until measured numbers exist and are approved for public claims.
 */
export const ARTICLES: DocsArticle[] = [
  {
    slug: "what-is-winlerr",
    title: "What is Winlerr?",
    description:
      "Winlerr is a free professional website for Zambian businesses, plus the AI systems that answer, qualify, and follow up every enquiry.",
    intro:
      "Winlerr is two things in one platform: a professional website for your business at no upfront cost, and the systems that make sure every enquiry that arrives gets answered, qualified, and followed up.",
    sections: [
      {
        heading: "Why the website comes first",
        paragraphs: [
          "Most small businesses lose enquiries before any software could help, because they have no credible online presence. So that is where we start: a professional page for your business, live in days.",
          "There is no upfront cost for the website. Once it is live, we connect the first system that closes the gap between an enquiry and a reply.",
        ],
      },
      {
        heading: "What the systems do",
        paragraphs: [
          "The systems are deliberately practical. They sit where your customers already are — WhatsApp, Facebook, Instagram, and your phone — and they do the work that currently falls on whoever picks up first.",
        ],
        items: [
          "Answer every enquiry in seconds instead of hours.",
          "Qualify each enquiry so you know who is ready to buy before you call.",
          "Track and chase the follow-ups you promised.",
          "Keep working at night, over weekends, and on holidays.",
        ],
      },
      {
        heading: "Who it is for",
        paragraphs: [
          "Winlerr is built in Zambia, for Zambian businesses. That means WhatsApp-first by default, mobile-money aware, and priced for growing businesses rather than adapted from a market where customers behave differently.",
        ],
      },
      {
        heading: "How we charge",
        paragraphs: [
          "The website has no upfront cost. Systems are scoped as fixed-price builds with clear timelines, and you start with one — adding more only when the first is earning its place.",
        ],
      },
    ],
  },
  {
    slug: "free-website",
    title: "The free website",
    description:
      "What is included in the Winlerr free professional website, how long it takes to go live, and what you need to provide.",
    intro:
      "Every Winlerr business starts with a professional website at no upfront cost. This page sets out what is included, how long it takes, and what we need from you.",
    sections: [
      {
        heading: "What is included",
        paragraphs: [
          "A clean, mobile-first page that loads fast on the mobile connections your customers actually use, with the information a new customer needs to decide to enquire.",
        ],
        items: [
          "Your business name, what you do, and the services you offer.",
          "Opening hours and the ways to reach you — WhatsApp first.",
          "A direct WhatsApp button, so an enquiry is one tap away.",
          "A link to your live enquiry form.",
        ],
      },
      {
        heading: "How long it takes",
        paragraphs: [
          "Live in days, not weeks. The constraint is usually how quickly we can get your service list, opening hours, and a logo or photo you are happy with — everything else we handle.",
        ],
      },
      {
        heading: "What we need from you",
        items: [
          "The name of the business and what it does.",
          "The services you want listed.",
          "Your opening hours.",
          "A logo or photo, if you have one. Not required.",
        ],
      },
      {
        heading: "What happens after it is live",
        paragraphs: [
          "The website is the foundation, not the product. Once it is live we connect your first system — usually lead response and WhatsApp — so the enquiries it starts generating are actually answered.",
        ],
      },
    ],
  },
  {
    slug: "systems-overview",
    title: "Systems overview",
    description:
      "How the six Winlerr systems fit together: lead response, WhatsApp AI agent, social DM agent, booking, customer follow-up, and AI receptionist.",
    intro:
      "The six systems are independent and composable. Most businesses start with one, configure it properly, and add the next when the first is doing its job.",
    sections: [
      {
        heading: "Lead response",
        paragraphs: [
          "Every enquiry triaged and answered in seconds. Calls, forms, WhatsApp messages, and DMs land in one queue, get a first response, and are scored so you know who is ready to buy.",
        ],
      },
      {
        heading: "WhatsApp AI agent",
        paragraphs: [
          "Customer conversations on autopilot, 24/7. It answers questions, captures the details you need, and hands off to a human at the right moment.",
        ],
      },
      {
        heading: "Social DM agent",
        paragraphs: [
          "Facebook and Instagram messages handled, qualified, and routed — from the same dashboard as everything else, so nothing lives in a separate inbox.",
        ],
      },
      {
        heading: "Booking system",
        paragraphs: [
          "Appointments without the back-and-forth. Customers pick a time that suits them; confirmations and reminders go out automatically.",
        ],
      },
      {
        heading: "Customer follow-up",
        paragraphs: [
          "Quotes chased, reviews requested, nobody forgotten. Open quotes and promised follow-ups are tracked so enquiries do not go quiet between first message and sale.",
        ],
      },
      {
        heading: "AI receptionist",
        paragraphs: [
          "A front desk that never sleeps. It answers after hours, on weekends, and on holidays, captures the enquiry, and leaves you a warm pipeline in the morning.",
        ],
      },
      {
        heading: "Winlerr OS",
        paragraphs: [
          "Leads, conversations, follow-ups, and reports in a single dashboard that works on any device. Every system above writes into it, so you get one place to see the business.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    description:
      "Answers to common questions about the Winlerr free website, pricing, the AI systems, WhatsApp, and what happens after you get started.",
    intro:
      "The questions we are asked most often, answered plainly. If yours is not here, ask us directly and we will answer it.",
    sections: [
      {
        heading: "Is the website really free?",
        paragraphs: [
          "There is no upfront cost for your website. It is ours to build and ours to host, and it is the first step rather than a sales tactic — a business with no credible online presence cannot benefit from lead automation yet.",
        ],
      },
      {
        heading: "What does it cost to add systems?",
        paragraphs: [
          "Systems are fixed-scope builds with a clear price agreed before work starts, not open-ended projects. You start with one system and add more as the business grows.",
        ],
      },
      {
        heading: "How fast do you respond?",
        paragraphs: [
          "The systems are built to a target of a first response in under 60 seconds, around the clock. That is a service level we design for and measure internally, not a claim about any customer's results.",
        ],
      },
      {
        heading: "Do I need to change how my customers contact me?",
        paragraphs: [
          "No. We work on the channels you already use — WhatsApp, Facebook, Instagram, and your phone. The goal is that your customers notice no change, and you stop losing the conversations you were already having.",
        ],
      },
      {
        heading: "Will the AI talk to my customers on its own?",
        paragraphs: [
          "It does, under your control. You decide what it can answer, what it must escalate, and when it hands off to a person. Anything it is not confident about goes to a human rather than being guessed at.",
        ],
      },
      {
        heading: "How long does implementation take?",
        paragraphs: [
          "The website goes live in days. A first system takes longer, because it has to be configured to your business — your services, your hours, your tone, and your escalation rules.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string): DocsArticle | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

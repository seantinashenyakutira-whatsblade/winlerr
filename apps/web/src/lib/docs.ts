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
 */
export const ARTICLES: DocsArticle[] = [
  {
    slug: "what-is-winlerr",
    title: "What is Winlerr?",
    description: "A short introduction for business owners.",
    intro: "A short introduction for business owners.",
    sections: [
      {
        heading: "What Winlerr is",
        paragraphs: [
          "Winlerr is a Zambia-based digital business building a clearer online presence and practical systems for customer and business operations.",
        ],
      },
      {
        heading: "What we offer",
        paragraphs: [
          "The public catalogue includes a professional business website, business automation systems, AI agents, business operations workflows, and the WinlerrOS platform. Browse the catalogue for product goals, requirements, and typical workflows.",
        ],
      },
      {
        heading: "Product availability",
        paragraphs: [
          "The catalogue is a guide to product concepts and intended workflows. Current availability, requirements, and pricing are confirmed with Winlerr before any commitment.",
        ],
      },
      {
        heading: "Who it is for",
        paragraphs: [
          "Winlerr is designed for Zambian businesses reviewing how customers find them, make enquiries, book services, and stay in touch.",
        ],
      },
      {
        heading: "How to get started",
        paragraphs: [
          "Visit winlerr.vip/get-started to share what your business does and what you want to improve. Winlerr can then discuss current product availability and requirements with you.",
        ],
      },
    ],
  },
  {
    slug: "free-website",
    title: "Professional business website",
    description: "Explore the website offering and confirm scope with Winlerr.",
    intro: "Learn what to prepare before discussing a professional business website with Winlerr.",
    sections: [
      {
        heading: "Offering and availability",
        paragraphs: [
          "The catalogue includes an offering named Free Professional Business Website. Confirm current availability, scope, and any applicable terms with Winlerr before work begins.",
        ],
      },
      {
        heading: "What to prepare",
        paragraphs: [
          "Prepare your business name, a short description of your services, preferred contact details, and any photos or branding you want to discuss.",
        ],
      },
      {
        heading: "Scope and delivery",
        paragraphs: [
          "The final page content, integrations, delivery timeline, and update process depend on confirmed scope. Winlerr will discuss those details before work begins.",
        ],
      },
    ],
  },
  {
    slug: "systems-overview",
    title: "Winlerr product catalogue",
    description: "Explore the current catalogue and discuss product fit and availability.",
    intro:
      "Explore the website, business workflow, AI agent, and WinlerrOS offerings in the public catalogue.",
    sections: [
      {
        heading: "Browse the catalogue",
        paragraphs: [
          "The public catalogue includes a professional business website, business automation systems, AI agents, business operations workflows, and WinlerrOS. Each entry describes a proposed customer problem, workflow, requirements, and related products.",
        ],
      },
      {
        heading: "Current availability and pricing",
        paragraphs: [
          "The reviewed Systems Lab catalogue specification has not yet supplied approved availability and pricing for these entries. Winlerr confirms current availability, scope, and pricing directly with each business before any commitment.",
          "The public catalogue describes product goals and typical workflows; it does not mean every listed capability is currently operational.",
        ],
      },
      {
        heading: "Learn more",
        paragraphs: [
          "Browse the catalogue at winlerr.vip/products or contact Winlerr to discuss fit, requirements, integrations, availability, and pricing.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    description: "Straight answers to common questions.",
    intro: "Straight answers to common questions.",
    sections: [
      {
        heading: "What does the website offering cost?",
        paragraphs: [
          "The catalogue includes an offering named Free Professional Business Website. Confirm its current availability and scope with Winlerr before work begins.",
        ],
      },
      {
        heading: "Are the listed systems available now?",
        paragraphs: [
          "Availability is confirmed with Winlerr. The catalogue describes product concepts and workflows, and does not guarantee that a listed product or integration is currently operational.",
        ],
      },
      {
        heading: "Do I need a Winlerr website first?",
        paragraphs: [
          "Requirements depend on the product and your current setup. Tell us what you already use, and we will confirm which requirements apply.",
        ],
      },
      {
        heading: "How long does setup take?",
        paragraphs: [
          "Timing depends on confirmed scope, integrations, and the information your business provides. Winlerr will discuss a timeline before work begins.",
        ],
      },
      {
        heading: "What information should I prepare?",
        paragraphs: [
          "Prepare a short description of your business, the customer workflow you want to improve, the channels you use, and any existing tools or information relevant to that workflow.",
        ],
      },
      {
        heading: "How do AI agents handle customer conversations?",
        paragraphs: [
          "The catalogue describes possible AI agent workflows. Current availability, supported channels, approved business information, and human hand-off rules must be confirmed for each setup.",
        ],
      },
      {
        heading: "Which channels and integrations are supported?",
        paragraphs: [
          "Integrations depend on product availability and your account setup. Winlerr will confirm supported connections and access requirements during discovery.",
        ],
      },
      {
        heading: "Where do I ask about pricing?",
        paragraphs: [
          "Pricing is not published in the public catalogue yet. Request a consultation to discuss current availability and pricing for your requirements.",
        ],
      },
      {
        heading: "How do I get started?",
        paragraphs: [
          "Visit winlerr.vip/get-started to share your business details and what you want to improve. Winlerr will discuss current availability and next steps with you.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string): DocsArticle | undefined {
  return ARTICLES.find(article => article.slug === slug);
}

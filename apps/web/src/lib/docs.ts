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
          "Winlerr is a digital growth company built specifically for small and medium businesses in Zambia. We help local business owners establish a credible presence online and manage customer communications reliably. Running a business often means balancing daily operations while answering phone calls, responding to WhatsApp texts, and chasing quotes. Winlerr gives you the tools to handle incoming demand without having to hire extra administrative staff.",
        ],
      },
      {
        heading: "What we offer",
        paragraphs: [
          "We offer two connected solutions: a free professional website and intelligent automation systems. The website gives your business a clean, trustworthy home on the internet. The AI systems connect directly to that presence to answer enquiries, qualify potential buyers, take bookings, and follow up with leads across WhatsApp and social media.",
        ],
      },
      {
        heading: "The order matters",
        paragraphs: [
          "Every business starts with the free website before adding any automation systems. We do this because automation needs a solid foundation to work properly. When a potential customer hears about your business, they want to verify who you are, see your services, and know how to reach you. Once your website is live and establishing trust, we can plug in the systems that capture and convert those visitors.",
        ],
      },
      {
        heading: "Who it is for",
        paragraphs: [
          "Winlerr is designed for Zambian service providers, retail shops, restaurants, salons, and contractors who want to grow their customer base. If you are losing enquiries because you are busy on a job, serving clients, or away from your phone after hours, Winlerr is built for you. You get a reliable digital presence that works around the clock.",
        ],
      },
      {
        heading: "How to get started",
        paragraphs: [
          "Getting started is simple and straightforward. Visit winlerr.vip/get-started and share a few basic details about your business. Our team will review your information, start building your website, and contact you directly on WhatsApp to guide you through each step.",
        ],
      },
    ],
  },
  {
    slug: "free-website",
    title: "How the free website works",
    description: "What's included, what it costs, how long it takes.",
    intro: "What's included, what it costs, how long it takes.",
    sections: [
      {
        heading: "What the free website costs",
        paragraphs: [
          "The Winlerr website is completely free. There are no design fees, no setup charges, and zero upfront costs. We build the site and provide the hosting on our platform at no charge to your business. There are no hidden fees or surprise invoices.",
        ],
      },
      {
        heading: "Where your website lives",
        paragraphs: [
          "Your website goes live on your own dedicated subdomain at yourbusiness.winlerr.vip. This gives you an immediate web address that you can share on business cards, post on Facebook and Instagram, or send directly to customers over WhatsApp.",
        ],
      },
      {
        heading: "What is included",
        paragraphs: [
          "Your free website is designed specifically for your trade. It includes a modern, mobile-friendly design that loads quickly on standard mobile connections across Zambia. It clearly displays your business name, what you do, and your full list of services. It also includes an interactive contact form, your operating hours, photos of your work (you provide them, or we use what you have on hand), and a direct WhatsApp button so new visitors can message you with one tap.",
        ],
      },
      {
        heading: "How long it takes",
        paragraphs: [
          "We build and launch your website in days, not weeks. We do not promise instant creation because our team prepares a clean layout tailored to your actual business. As soon as you share your basic information, we begin assembling your pages and preparing them for launch.",
        ],
      },
      {
        heading: "What we need from you",
        paragraphs: [
          "To build your site, we only need a few essentials: your registered or trading business name, your WhatsApp phone number, your physical location or service area, a list of your services, and any photos you have of your work. If you have an existing logo, we will include it; if not, we will create a clean, simple text header for you.",
        ],
      },
      {
        heading: "Edits after launch",
        paragraphs: [
          "Your website is not locked once it goes live. If your phone number changes, your operating hours adjust, or you want to update your service offerings, you can request text and image updates directly through our team.",
        ],
      },
    ],
  },
  {
    slug: "systems-overview",
    title: "The systems Winlerr offers",
    description: "What each system does and who it's for.",
    intro: "What each system does and who it's for.",
    sections: [
      {
        heading: "The foundation",
        paragraphs: [
          "Every Winlerr client starts with our free professional website. Once your website is live and welcoming visitors, you can add specialized AI systems to manage your customer communications.",
        ],
      },
      {
        heading: "The six systems",
        paragraphs: [
          "Winlerr offers six distinct systems tailored to how Zambian businesses operate.",
          "Lead Response: Immediately captures and acknowledges every incoming enquiry across your website, WhatsApp, and social inboxes, making sure no customer is ignored. Fits contractors, consultants, and trade businesses.",
          "WhatsApp AI Agent: Lives inside your official WhatsApp number to answer common customer questions, share details, and hand over complex chats to your team 24/7. Fits restaurants, clinics, and salons.",
          "Social DM Agent: Manages incoming messages on Facebook and Instagram, answering product and pricing questions and guiding buyers to complete their order. Fits fashion boutiques and retail shops.",
          "Booking System: Allows customers to view open dates and book appointments directly on your website without endless back-and-forth messages. Fits salons, repair shops, and studios.",
          "Customer Follow-up: Automatically checks in on sent quotes and reminds past customers when it is time to reorder or rebook services. Fits trade contractors and wholesale suppliers.",
          "AI Receptionist: Covers your business during evenings, weekends, and holidays by answering common questions and recording structured callback requests. Fits legal firms, transport providers, and clinics.",
        ],
      },
      {
        heading: "How the systems are delivered",
        paragraphs: [
          "Unlike the free website, these automation systems are paid add-ons. Each system is tailored specifically to your business operations, pricing structure, and preferred conversation style. You do not need to purchase all six systems at once. Most businesses start with one system, such as Lead Response or the WhatsApp AI Agent, and only add more systems as their customer volume grows.",
        ],
      },
      {
        heading: "Learn more",
        paragraphs: [
          "You can explore the full technical capabilities and workflows of each individual tool by visiting winlerr.vip/systems.",
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
        heading: "Is the website really free?",
        paragraphs: [
          "Yes. There is zero upfront cost, no design fee, and no hosting fee for your website on yourbusiness.winlerr.vip. It is our way of giving your business a solid digital foundation before discussing optional automation tools.",
        ],
      },
      {
        heading: "Do I need a website before I can get a system?",
        paragraphs: [
          "Yes. We require your website to be live first so your business has an official presence to capture customer details and anchor your automation. If you already have an existing website, our team will confirm during onboarding how we can connect.",
        ],
      },
      {
        heading: "How long does the website take?",
        paragraphs: [
          "Your website goes live in days, not weeks. The exact turnaround depends on how quickly you provide your business details, list of services, and photos.",
        ],
      },
      {
        heading: "Can I change my website after it goes live?",
        paragraphs: [
          "Yes. You can request updates to your services, operating hours, contact numbers, or photos whenever your business changes. Simply send your requested edits to our team on WhatsApp.",
        ],
      },
      {
        heading: "Do I need a business email or domain?",
        paragraphs: [
          "No. You do not need a custom domain or business email to get started. Your website runs on your dedicated yourbusiness.winlerr.vip address, and all customer messages route directly to your active WhatsApp number.",
        ],
      },
      {
        heading: "How do the AI systems handle my customers?",
        paragraphs: [
          "The AI systems respond directly to your customer enquiries in natural, professional language. They answer frequent questions, provide service details, take booking information, and pass complex enquiries directly to you.",
        ],
      },
      {
        heading: "What if the AI doesn't know an answer?",
        paragraphs: [
          "If a customer asks a question outside its knowledge or requests custom terms, the AI politely explains that it will check with the business owner and immediately routes the conversation to you.",
        ],
      },
      {
        heading: "Can I cancel a system later?",
        paragraphs: [
          "Yes. Our systems are delivered as tailored packages without long lock-in contracts. If your operational needs change, you can pause or cancel a system by notifying our team.",
        ],
      },
      {
        heading: "Do you work with businesses outside Lusaka?",
        paragraphs: [
          "Yes. We support businesses throughout Zambia. Because our onboarding, setup, and support happen digitally over WhatsApp and phone, your location in Zambia does not limit our service.",
        ],
      },
      {
        heading: "How do I get started?",
        paragraphs: [
          "To get started, visit winlerr.vip/get-started and submit your business details. Our team will review your submission and contact you on WhatsApp to begin creating your website.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string): DocsArticle | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

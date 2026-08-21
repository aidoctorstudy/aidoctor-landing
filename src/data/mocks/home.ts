/**
 * Copy and content for the home page. Layout, offsets and structure are
 * lifted from the Figma frame "Concept 4" (node `1518:1970`) — only the
 * copy below has been re-written for AI Doctor Study.
 *
 * Components take this through props — never by importing this file directly
 * (see obsidian/frontend/component-conventions.md → Data rules). Swap it for a
 * CMS payload later without touching a single component.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface SectionIntro {
  eyebrow: string;
  title: string;
  description: string;
}

export interface HeroContent extends SectionIntro {
  actions: readonly CtaLink[];
  /** Small proof line under the fold divider. */
  trustLine: string;
  /** Service chips floating over the scene. */
  serviceChips: readonly string[];
}

/** Static copy for the decorative browser-chrome app preview. */
export interface AppMockupContent {
  url: string;
  question: string;
  answer: string;
}

export interface WhyContent extends SectionIntro {
  actions: readonly CtaLink[];
  /** Images that stream after the cursor, oldest fading out. */
  trailImages: readonly string[];
  mockup: AppMockupContent;
}

export interface ServiceCard {
  index: string;
  title: string;
  /** Sub-services listed on the opening card. */
  items?: readonly string[];
  /** Decorative, on the "photo" variant's gradient card (ADR-0027). */
  emoji?: string;
  /** Tail card carries a "Discover" affordance. */
  cta?: string;
  variant: "lime" | "photo" | "brand";
}

export interface StatItem {
  value: string;
  label: string;
}

/** The About paragraph greys the clauses that aren't the point. */
export interface AboutFragment {
  text: string;
  muted: boolean;
}

export interface AboutContent {
  eyebrow: string;
  stats: readonly StatItem[];
  paragraph: readonly AboutFragment[];
  actions: readonly CtaLink[];
}

export interface TeamMember {
  name: string;
  /** e.g. "MBBS Year 4, UAE" — credential + country, not a job title. */
  role: string;
  /** Short pull-quote testimonial, rendered under the name/role plate. */
  quote: string;
  /** 1-2 letters, rendered on a gradient avatar circle instead of a photo. */
  initials: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "instagram" | "facebook" | "linkedin" | "twitter";
}

/** Tail card closing the team rail (Figma node `1575:238`). */
export interface TeamMoreCard {
  title: string;
  cta: string;
  href: string;
}

export interface TeamContent {
  eyebrow: string;
  title: string;
  socials: readonly SocialLink[];
  members: readonly TeamMember[];
  more: TeamMoreCard;
}

/** One bubble in the Live Demo's scripted conversation. */
export interface DemoMessage {
  role: "user" | "ai";
  text: string;
}

export interface LiveDemoContent extends SectionIntro {
  messages: readonly DemoMessage[];
  /** Below the transcript, linking to `APP_URL`. */
  ctaLabel: string;
  ctaHref: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  /** e.g. `"/month"` — appended straight after `price`. */
  period: string;
  description: string;
  features: readonly string[];
  cta: CtaLink;
  /** Renders a small pill above the card, e.g. `"Most Popular"`. */
  badge?: string;
  /** Pro's cyan-glow treatment. */
  highlighted?: boolean;
  /**
   * Small caption under the CTA button — used by Pro to explain that the
   * button leads to sign-up/login first, not straight to checkout (no
   * auth-gated checkout redirect exists yet; see decisions-log).
   */
  note?: string;
}

export interface PricingContent extends SectionIntro {
  plans: readonly PricingPlan[];
  /** Student-discount callout under the cards. */
  discountNote: string;
}

/** The final-CTA section (formerly a lead-capture form — see decisions-log). */
export interface ContactContent extends SectionIntro {
  actions: readonly CtaLink[];
}

/**
 * The study app — every "Start for Free"/"Start Free Trial"/"Get Started"
 * CTA leads here. Same-origin `/app` route (ADR-0028), not the old
 * `app.aidoctor.study` subdomain — `next/link` renders it as a real
 * client-side navigation instead of a full page load to another origin.
 */
export const APP_URL = "/app";
/** Pro checkout (Gumroad) — linked from pricing-adjacent CTAs. */
export const PRO_CHECKOUT_URL = "https://hyperai3.gumroad.com/l/aidoctorstudypro";

export const SITE_NAV: readonly NavLink[] = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export const HEADER_CTA: CtaLink = {
  label: "Start for Free",
  href: APP_URL,
};

/** Navbar's secondary pill, next to `HEADER_CTA` — same `/app` destination. */
export const LOGIN_CTA: CtaLink = {
  label: "Login",
  href: APP_URL,
};

/** Fixed bottom-right pill, shown once the visitor has scrolled past the hero. */
export const FLOATING_CTA: CtaLink = {
  label: "Try Free →",
  href: APP_URL,
};

export const BRAND_NAME = "AI Doctor Study";

export const HERO_CONTENT: HeroContent = {
  eyebrow: "AI-Powered Medical Learning",
  title: "Study smarter. Pass your exams.",
  description:
    "The AI study companion built for MBBS and medical students. Ask anything, get expert explanations instantly.",
  actions: [
    { label: "Sign Up for Free", href: APP_URL },
    { label: "Login", href: APP_URL },
  ],
  trustLine: "Trusted by 50,000+ medical students worldwide",
  serviceChips: [
    "MBBS",
    "Clinical Cases",
    "Drug Mnemonics",
    "USMLE/PLAB",
    "Flashcards",
  ],
};

export const WHY_CONTENT: WhyContent = {
  eyebrow: "Why AI Doctor Study",
  title: "One AI, every subject, always available",
  description:
    "No more searching through textbooks. Ask like you'd ask a doctor.",
  actions: [
    { label: "Explore Features", href: "#features" },
    { label: "See Results", href: "#about" },
  ],
  trailImages: [
    "/assets/Why Dantora/01.png",
    "/assets/Why Dantora/02.png",
    "/assets/Why Dantora/03.png",
    "/assets/Why Dantora/04.png",
    "/assets/Why Dantora/05.png",
    "/assets/Why Dantora/06.png",
    "/assets/Why Dantora/07.png",
    "/assets/Why Dantora/08.png",
  ],
  mockup: {
    url: "aidoctor.study/app",
    question: "What's first-line for a STEMI?",
    answer:
      "Aspirin 300mg chewed immediately, then urgent PCI within 90 minutes if available — thrombolysis if not.",
  },
};

export const SERVICES_INTRO: SectionIntro = {
  eyebrow: "Features",
  title: "Everything you need to ace medical school",
  description:
    "From a quick answer to full exam prep — five tools that cover understanding, practice and recall.",
};

export const SERVICE_CARDS: readonly ServiceCard[] = [
  {
    index: "01",
    title: "AI Q&A",
    items: [
      "Ask any topic, anytime",
      "Step-by-step explanations",
      "Sources you can trust",
    ],
    variant: "lime",
  },
  {
    index: "02",
    title: "Image Analysis",
    emoji: "🩻",
    cta: "Discover",
    variant: "photo",
  },
  {
    index: "03",
    title: "Clinical Cases",
    cta: "Discover",
    variant: "brand",
  },
  {
    index: "04",
    title: "Drug Mnemonics",
    emoji: "💊",
    cta: "Discover",
    variant: "photo",
  },
  {
    index: "05",
    title: "Exam Prep",
    emoji: "📝",
    cta: "Discover",
    variant: "photo",
  },
];

export const LIVE_DEMO_CONTENT: LiveDemoContent = {
  eyebrow: "Live Demo",
  title: "Ask like you'd ask a doctor",
  description:
    "A real exchange, not a mockup — this is exactly how AI Doctor Study answers.",
  messages: [
    { role: "user", text: "Explain the mechanism of metformin" },
    {
      role: "ai",
      text: "Metformin works primarily by activating AMPK in the liver, which inhibits gluconeogenesis — reducing hepatic glucose output by up to 30%. It also improves peripheral insulin sensitivity and modestly reduces intestinal glucose absorption.",
    },
    { role: "user", text: "What are the contraindications?" },
    {
      role: "ai",
      text: "Key contraindications: eGFR <30 mL/min (lactic acidosis risk), acute heart failure, severe hepatic disease, and any acute condition predisposing to hypoxia or tissue hypoperfusion.",
    },
  ],
  ctaLabel: "Try it yourself at aidoctor.study/app",
  ctaHref: APP_URL,
};

export const ABOUT_CONTENT: AboutContent = {
  eyebrow: "Why Students Trust Us",
  stats: [
    { value: "50K+", label: "Students" },
    { value: "98%", label: "Pass Rate" },
    { value: "24/7", label: "Available" },
    { value: "5★", label: "Rating" },
  ],
  paragraph: [
    {
      text: "AI Doctor Study is the AI study companion built for medical students:",
      muted: true,
    },
    { text: " ask a question, get a doctor-level explanation. ", muted: false },
    {
      text: "From first-year anatomy to final licensing exams, ",
      muted: true,
    },
    {
      text: "every answer is built to help you understand, not just memorize.",
      muted: false,
    },
  ],
  actions: [
    { label: "Sign Up for Free", href: APP_URL },
    { label: "Login", href: APP_URL },
    { label: "See Pricing", href: PRO_CHECKOUT_URL },
  ],
};

export const TEAM_CONTENT: TeamContent = {
  eyebrow: "Testimonials",
  title: "Trusted by students who needed to pass.",
  socials: [
    { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
    { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
    { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
    { label: "X", href: "https://x.com", icon: "twitter" },
  ],
  members: [
    {
      name: "Ahmed Al-Rashidi",
      role: "MBBS Year 4, UAE",
      quote:
        "Explained pharmacology better than my professor. Passed with distinction.",
      initials: "AA",
    },
    {
      name: "Priya Sharma",
      role: "USMLE Step 1 Cleared, India",
      quote: "Asked 200+ questions during Step 1 prep. Every answer was spot on.",
      initials: "PS",
    },
    {
      name: "Omar Hassan",
      role: "PLAB Candidate, Egypt",
      quote:
        "The clinical cases feature is unreal. Like having a consultant in your pocket.",
      initials: "OH",
    },
    {
      name: "Sarah Chen",
      role: "Med Student Year 3, UK",
      quote: "Drug mnemonics mode saved my pharmacology exam. Genuinely.",
      initials: "SC",
    },
    {
      name: "Khalid Mansoor",
      role: "Final Year MBBS, Pakistan",
      quote: "I use it every single day. Worth every penny of Pro.",
      initials: "KM",
    },
  ],
  more: {
    title: "Join 50,000+ students studying smarter",
    cta: "Get Started",
    href: APP_URL,
  },
};

export const PRICING_CONTENT: PricingContent = {
  eyebrow: "Pricing",
  title: "Start free. Upgrade when exam season hits.",
  description: "No credit card for Free. Cancel Pro anytime.",
  plans: [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Enough to get through a normal study week.",
      features: ["20 questions a day", "Basic subjects", "Standard AI"],
      cta: { label: "Start for Free", href: APP_URL },
    },
    {
      name: "Pro",
      price: "$2.99",
      period: "/month",
      description: "Everything unlocked for exam season.",
      features: [
        "Unlimited questions",
        "All subjects",
        "Claude AI",
        "Image analysis",
        "Clinical cases",
        "Drug mnemonics",
        "USMLE/PLAB prep",
        "Flashcards",
      ],
      // Not a direct checkout link yet: there's no auth-gated redirect to
      // Gumroad after sign-up/login, so this sends the visitor to /app
      // first (see decisions-log) — the `note` explains why.
      cta: { label: "Get Pro", href: APP_URL },
      note: "Sign up or log in first — you'll continue to checkout from there.",
      badge: "Most Popular",
      highlighted: true,
    },
  ],
  discountNote: "Student? Use code MED20 at checkout for 20% off Pro.",
};

// Formerly a lead-capture form (POST /api/contact) — replaced with a plain
// closing CTA at the project owner's request. See decisions-log.
export const CONTACT_CONTENT: ContactContent = {
  eyebrow: "Get Started",
  title: "Ready to study smarter?",
  description: "Join 50,000+ medical students already using AI Doctor Study.",
  actions: [
    { label: "Start for Free", href: APP_URL },
    { label: "Get Pro", href: PRO_CHECKOUT_URL },
  ],
};

// These four routes don't have pages yet — see SiteFooter's docstring.
export const FOOTER_LINKS: readonly FooterLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Refunds", href: "/refunds" },
  { label: "Cookies", href: "/cookies" },
  { label: "Privacy", href: "/privacy" },
];

/**
 * Content for the four legal pages (/terms, /refunds, /cookies, /privacy).
 *
 * Terms, Refunds and Cookies are ported from the legacy standalone pages at
 * `public/app/{terms,refunds,cookies}.html` — same copy, restructured into
 * data so `views/legal/legal-page.tsx` can render it through the project's
 * own design tokens instead of that page's separate inline CSS. Privacy is
 * authored fresh here; no prior version existed anywhere in the project.
 *
 * Components take this through props — never by importing this file
 * directly (see obsidian/frontend/component-conventions.md → Data rules).
 *
 * 📖 Docs: obsidian/frontend/components/home-sections.md, decisions-log ADR-0029
 */

/** A run of inline text — plain, bold, or a link (mailto:, https://, or an internal `/route`). */
export interface LegalRun {
  text: string;
  bold?: boolean;
  href?: string;
}

export type LegalBlock =
  | { type: "paragraph"; runs: LegalRun[] }
  | { type: "list"; ordered?: boolean; items: LegalRun[][] }
  | {
      type: "callout";
      tone: "info" | "warning" | "danger";
      label: string;
      paragraphs: LegalRun[][];
    }
  | { type: "table"; headers: readonly string[]; rows: readonly string[][] };

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  blocks: readonly LegalBlock[];
}

export interface LegalPageContent {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  scope: string;
  /** The "short version" callout at the top of every legal page. */
  summary: readonly LegalRun[][];
  sections: readonly LegalSection[];
}

/** `mailto:` — reused across all four pages rather than repeated as a literal. */
const SUPPORT_EMAIL = "support@aidoctor.study";
const SUPPORT_LINK: LegalRun = { text: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` };

// ---------------------------------------------------------------------------
// TERMS OF SERVICE
// ---------------------------------------------------------------------------

export const TERMS_CONTENT: LegalPageContent = {
  eyebrow: "Legal",
  title: "Terms of Service",
  lastUpdated: "17 August 2026",
  scope: "Applies to aidoctor.study and the AI Doctor Study app",
  summary: [
    [
      { text: "AI Doctor Study is a " },
      { text: "study tool for medical students", bold: true },
      { text: " — it is not medical advice and must never be used for real patient care." },
    ],
    [
      { text: "AI answers can be wrong. " },
      { text: "Always verify", bold: true },
      { text: " against your textbooks, lecturers, and official guidelines." },
    ],
    [
      { text: "AI Doctor Study is " },
      { text: "completely free", bold: true },
      { text: " — no subscription, no payment details. A fair-use rate limit keeps things running smoothly for everyone." },
    ],
    [{ text: "Don't share accounts, scrape our content, or use the app to break your university's or exam board's rules." }],
    [{ text: "Be fair to us and we'll be fair to you. Questions? " }, SUPPORT_LINK, { text: "." }],
  ],
  sections: [
    {
      id: "agreement",
      number: "01",
      title: "Agreement to these Terms",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "These Terms of Service (“Terms”) are an agreement between you and the operator of AI Doctor Study (“AI Doctor Study”, “we”, “us”). They cover your use of the website at " },
            { text: "aidoctor.study", href: "https://aidoctor.study" },
            { text: ", our apps, and everything we provide through them (together, the “Service”)." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "By creating an account or simply using the Service, you agree to these Terms and to our " },
            { text: "Privacy Policy", href: "/privacy" },
            { text: ", " },
            { text: "Cookie Policy", href: "/cookies" },
            { text: ", and " },
            { text: "Refund Policy", href: "/refunds" },
            { text: ". If you don't agree, please don't use the Service." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "You must be at least " },
            { text: "16 years old", bold: true },
            { text: " to use the Service." },
          ],
        },
      ],
    },
    {
      id: "service",
      number: "02",
      title: "The Service",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "AI Doctor Study is an AI-powered study companion for medical students. Depending on your plan, the Service may include AI-generated explanations and answers, question practice, study material organised by year and exam (such as MBBS), embedded educational videos, and progress features." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "The Service is aimed at students preparing for medical courses and exams. It is a " },
            { text: "learning aid", bold: true },
            { text: " — nothing more." },
          ],
        },
      ],
    },
    {
      id: "medical",
      number: "03",
      title: "Educational use only — not medical advice",
      blocks: [
        {
          type: "callout",
          tone: "danger",
          label: "Read this one carefully",
          paragraphs: [
            [
              { text: "AI Doctor Study is for " },
              { text: "education and exam preparation only", bold: true },
              { text: ". It is " },
              { text: "not medical advice", bold: true },
              { text: ", not a diagnostic tool, and not a clinical decision-support system. It must never be used to diagnose, treat, or manage real patients, or to make any decision about a real person's health." },
            ],
            [{ text: "If you are a patient or need medical help, speak to a qualified doctor. In an emergency, contact your local emergency services." }],
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "Content in the Service — including AI output — may be incomplete, outdated, or simply wrong. Clinical practice also varies between countries, hospitals, and guidelines. You are responsible for verifying everything against authoritative sources: your official curriculum, textbooks, lecturers, and current national guidelines." },
          ],
        },
      ],
    },
    {
      id: "ai",
      number: "04",
      title: "AI-generated content",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Large parts of the Service are generated by artificial intelligence. AI models can produce content that sounds confident but is inaccurate, incomplete, or biased (“hallucinations”). We do not guarantee the accuracy, completeness, or exam-suitability of any AI output." },
          ],
        },
        {
          type: "list",
          items: [
            [{ text: "Treat AI answers as a starting point for study, not the final word." }],
            [{ text: "Cross-check anything important before you rely on it in an exam or assignment." }],
            [{ text: "If you spot a wrong answer, we'd genuinely like to know — report it to " }, SUPPORT_LINK, { text: "." }],
          ],
        },
      ],
    },
    {
      id: "account",
      number: "05",
      title: "Your account",
      blocks: [
        { type: "paragraph", runs: [{ text: "You sign in to AI Doctor Study with your Google account. You agree to:" }] },
        {
          type: "list",
          items: [
            [{ text: "provide accurate information (like your name, study year, and exam) during onboarding;" }],
            [{ text: "keep your Google account secure — anything done through your account is your responsibility;" }],
            [{ text: "use one account per person and not share, sell, or transfer your account;" }],
            [{ text: "tell us promptly at " }, SUPPORT_LINK, { text: " if you believe your account has been compromised." }],
          ],
        },
      ],
    },
    {
      id: "plans",
      number: "06",
      title: "Free to use",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "AI Doctor Study is free — every feature described in the app is available at no cost, with no subscription and no payment details required." },
          ],
        },
        {
          type: "list",
          items: [
            [
              { text: "Fair use.", bold: true },
              { text: " To keep the Service fast and available for everyone, AI-powered features are subject to a reasonable rate limit (for example, a cap on requests per hour). This is not a paid quota — it's an anti-abuse measure, and we may adjust the limit at any time." },
            ],
            [
              { text: "No billing.", bold: true },
              { text: " We don't charge for access to the Service and don't store payment details." },
            ],
          ],
        },
      ],
    },
    {
      id: "refunds",
      number: "07",
      title: "Refunds",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Since the Service is free, there is nothing to refund. See our " },
            { text: "Refund Policy", href: "/refunds" },
            { text: " for details, including what to do if you were charged under the previous paid plan." },
          ],
        },
      ],
    },
    {
      id: "acceptable",
      number: "08",
      title: "Acceptable use",
      blocks: [
        { type: "paragraph", runs: [{ text: "You agree not to:" }] },
        {
          type: "list",
          items: [
            [{ text: "use the Service for anything unlawful, or in a way that harms us, other users, or anyone else;" }],
            [{ text: "use the Service to cheat — for example, using it during an exam or assessment where outside help or AI tools are prohibited by your university or exam board. Your institution's academic-integrity rules are your responsibility;" }],
            [{ text: "scrape, bulk-download, or systematically extract our content or question banks, or use the Service to build a competing product or train an AI model;" }],
            [{ text: "reverse engineer, probe, or interfere with the Service, bypass rate limits, or access it by any automated means;" }],
            [{ text: "resell, rent, or commercially exploit the Service or your account;" }],
            [{ text: "attempt to generate content through the Service that is illegal, harmful, or infringes anyone's rights." }],
          ],
        },
        { type: "paragraph", runs: [{ text: "We may suspend or terminate accounts that break these rules (see Termination below)." }] },
      ],
    },
    {
      id: "ip",
      number: "09",
      title: "Your content & our content",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Your content.", bold: true },
            { text: " You keep ownership of anything you type into the Service (like questions and notes). You give us a limited licence to store and process it purely to run and improve the Service for you." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "Our content.", bold: true },
            { text: " The Service — including its design, branding, logo, software, and the study content we've created or arranged — belongs to us or our licensors and is protected by intellectual-property laws. We give you a personal, non-transferable, non-exclusive licence to use it for your own studies while these Terms apply. That licence doesn't allow copying, republishing, or redistributing our content." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "AI output.", bold: true },
            { text: " Subject to these Terms and any third-party rights, you may use AI output generated for you in your personal studies. You're responsible for how you use it, including complying with your institution's rules on AI-assisted work." },
          ],
        },
      ],
    },
    {
      id: "thirdparty",
      number: "10",
      title: "Third-party services",
      blocks: [
        { type: "paragraph", runs: [{ text: "The Service is built on, and connects to, services run by other companies. Their terms apply to their parts of the experience:" }] },
        {
          type: "list",
          items: [
            [
              { text: "Google / Firebase", bold: true },
              { text: " — sign-in, data storage, and analytics. See the " },
              { text: "Google Privacy Policy", href: "https://policies.google.com/privacy" },
              { text: "." },
            ],
            [
              { text: "YouTube", bold: true },
              { text: " — some videos in the Service are provided via YouTube API Services. By using those features you also agree to the " },
              { text: "YouTube Terms of Service", href: "https://www.youtube.com/t/terms" },
              { text: ", and Google's handling of data is described in the " },
              { text: "Google Privacy Policy", href: "https://policies.google.com/privacy" },
              { text: "." },
            ],
          ],
        },
        { type: "paragraph", runs: [{ text: "We're not responsible for third-party services, their content, or their availability." }] },
      ],
    },
    {
      id: "availability",
      number: "11",
      title: "Availability & changes to the Service",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "We work hard to keep AI Doctor Study fast and available, but we can't promise it will be uninterrupted or error-free. We may add, change, or remove features, and we may impose or adjust rate limits, at any time." },
          ],
        },
      ],
    },
    {
      id: "disclaimer",
      number: "12",
      title: "Disclaimers",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "To the maximum extent permitted by law, the Service is provided " },
            { text: "“as is” and “as available”", bold: true },
            { text: ", without warranties of any kind, whether express or implied — including any implied warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant that the Service will meet your requirements, that content is accurate or exam-relevant, or that using the Service will produce any particular academic result." },
          ],
        },
      ],
    },
    {
      id: "liability",
      number: "13",
      title: "Limitation of liability",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "To the maximum extent permitted by law: we are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or academic outcomes (including exam results), arising from your use of — or inability to use — the Service." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "Our total liability for all claims relating to the Service is limited to the greater of (a) the amount you paid us for the Service in the 12 months before the claim arose, or (b) USD 20." },
          ],
        },
        {
          type: "paragraph",
          runs: [{ text: "Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, and nothing affects your statutory rights as a consumer." }],
        },
      ],
    },
    {
      id: "termination",
      number: "14",
      title: "Termination",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "You can stop using the Service and delete your account at any time. We may suspend or terminate your access if you materially breach these Terms (for example, account sharing, scraping, or abusing rate limits), if required by law, or if we discontinue the Service. Sections that by their nature should survive (like 09, 12, 13, and 16) survive termination." },
          ],
        },
      ],
    },
    {
      id: "changes",
      number: "15",
      title: "Changes to these Terms",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "We may update these Terms from time to time. If a change is material, we'll take reasonable steps to notify you — such as a notice in the app or an email — before it takes effect. The “Last updated” date at the top shows the current version. Continuing to use the Service after a change takes effect means you accept the updated Terms." },
          ],
        },
      ],
    },
    {
      id: "law",
      number: "16",
      title: "Governing law",
      blocks: [
        {
          type: "callout",
          tone: "warning",
          label: "Placeholder — finalize with legal counsel before launch",
          paragraphs: [
            [
              { text: "This section names the governing law and jurisdiction for disputes. That depends on where the operating entity is registered, which hasn't been finalized yet — fill it in (and have it reviewed) before this policy is relied on." },
            ],
          ],
        },
      ],
    },
    {
      id: "contact",
      number: "17",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "Questions about these Terms? Email us at " }, SUPPORT_LINK, { text: " — we're students of this stuff too, and we actually read our inbox." }],
        },
      ],
    },
    {
      id: "cookie-clause",
      number: "18",
      title: "The Cookie Clause",
      blocks: [
        {
          type: "paragraph",
          runs: [
            {
              text: "By signing up for AI Doctor Study, you acknowledge that if the CEO encounters you in real life, you owe him 2 cookies. No exceptions. This is legally binding.",
            },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// REFUND POLICY
// ---------------------------------------------------------------------------

export const REFUNDS_CONTENT: LegalPageContent = {
  eyebrow: "Legal",
  title: "Refund Policy",
  lastUpdated: "31 October 2026",
  scope: "Applies to aidoctor.study and the AI Doctor Study app",
  summary: [
    [
      { text: "AI Doctor Study is 100% free.", bold: true },
      { text: " There is no Pro tier and nothing to buy, so there is nothing to refund." },
    ],
    [{ text: "We don't take payments, store card details, or bill anyone for using the app." }],
    [{ text: "A fair-use rate limit keeps the AI features running smoothly for everyone — it is not a paid quota." }],
  ],
  sections: [
    {
      id: "overview",
      number: "01",
      title: "No billing, no refunds",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "AI Doctor Study used to offer a paid Pro subscription through Gumroad. That subscription no longer exists — every feature is free for every user, with no plans to reintroduce payments. Since nothing is purchased, this policy is simple: there is nothing to request a refund for." },
          ],
        },
      ],
    },
    {
      id: "legacy",
      number: "02",
      title: "If you were previously charged",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "If you paid for a Pro subscription before it was discontinued and still see a charge or active subscription, cancel it directly from your " },
            { text: "Gumroad subscriptions page", href: "https://gumroad.com/subscriptions" },
            { text: " or the link in your Gumroad receipt email — that stops any future billing immediately. For a refund on a past charge, contact Gumroad support or email " },
            SUPPORT_LINK,
            { text: " and we'll help sort it out." },
          ],
        },
      ],
    },
    {
      id: "changes",
      number: "03",
      title: "Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "We may update this page if anything about pricing ever changes. The “Last updated” date above shows the current version." }],
        },
      ],
    },
    {
      id: "contact",
      number: "04",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "Anything unclear? Email " }, SUPPORT_LINK, { text: "." }],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// COOKIE POLICY
// ---------------------------------------------------------------------------

export const COOKIES_CONTENT: LegalPageContent = {
  eyebrow: "Legal",
  title: "Cookie Policy",
  lastUpdated: "17 August 2026",
  scope: "Applies to aidoctor.study and the AI Doctor Study app",
  summary: [
    [
      { text: "We use a small set of cookies and local storage to " },
      { text: "keep you signed in", bold: true },
      { text: " and " },
      { text: "remember your study profile", bold: true },
      { text: " — those are essential and always on." },
    ],
    [
      { text: "Analytics only runs if you say yes", bold: true },
      { text: " in the cookie banner. Say no and the app works exactly the same." },
    ],
    [{ text: "YouTube (videos) may set its own cookies when you use that feature." }],
    [
      { text: "You can change your mind anytime via " },
      { text: "Cookie settings", bold: true },
      { text: " or your browser." },
    ],
  ],
  sections: [
    {
      id: "what",
      number: "01",
      title: "What cookies & local storage are",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Cookies", bold: true },
            { text: " are small text files a website stores on your device so it can recognise you between pages and visits. " },
            { text: "Local storage", bold: true },
            { text: " is a similar browser feature we use to save data (like your study profile) directly on your device instead of on our servers. This policy covers both, plus similar technologies like SDK identifiers in our app." },
          ],
        },
      ],
    },
    {
      id: "why",
      number: "02",
      title: "How we use them",
      blocks: [
        {
          type: "list",
          items: [
            [
              { text: "Essential", bold: true },
              { text: " — signing you in with Google (Firebase Authentication), keeping your session secure, and remembering your cookie choice. The Service can't work without these, so they don't require consent." },
            ],
            [
              { text: "Functional", bold: true },
              { text: " — remembering your name, study year, and exam so you land straight in your study space instead of re-doing onboarding." },
            ],
            [
              { text: "Analytics (optional)", bold: true },
              { text: " — anonymous-style usage statistics via Google Analytics / Firebase Analytics, so we can see which features help students and which need fixing. These run " },
              { text: "only with your consent", bold: true },
              { text: "." },
            ],
          ],
        },
        { type: "paragraph", runs: [{ text: "We don't use advertising cookies, and we don't sell your data." }] },
      ],
    },
    {
      id: "list",
      number: "03",
      title: "Cookies & storage we set",
      blocks: [
        {
          type: "table",
          headers: ["Name", "Set by", "Purpose", "Duration"],
          rows: [
            ["Firebase Auth session (IndexedDB / storage)", "Firebase (Google)", "Keeps you signed in with your Google account and secures your session.", "Until you sign out"],
            ["aid_cookie_consent", "AI Doctor Study", "Remembers whether you accepted or declined optional cookies, so we don't keep asking.", "Until cleared"],
            ["aid_name_*, aid_year_*, aid_exam_*", "AI Doctor Study", "Stores your name, study year, and exam (e.g. MBBS) on your device so the app opens straight into your study space.", "Until cleared"],
            ["App preferences", "AI Doctor Study", "Remembers in-app settings and preferences on your device.", "Until cleared"],
            ["_ga, _ga_*", "Google Analytics", "Distinguishes visitors and measures how the app is used (pages viewed, features tapped) so we can improve it. Only set with consent.", "Up to 2 years"],
            ["Firebase Analytics identifiers", "Firebase (Google)", "Aggregated usage measurement in the app. Only set with consent.", "Varies"],
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "You can read how Google uses this data at " },
            { text: "policies.google.com/technologies/partner-sites", href: "https://policies.google.com/technologies/partner-sites" },
            { text: "." },
          ],
        },
      ],
    },
    {
      id: "thirdparty",
      number: "04",
      title: "Third-party cookies",
      blocks: [
        {
          type: "list",
          items: [
            [
              { text: "YouTube", bold: true },
              { text: " — some study videos are embedded from YouTube. When you play one, YouTube (Google) may set cookies and collect data under the " },
              { text: "Google Privacy Policy", href: "https://policies.google.com/privacy" },
              { text: "." },
            ],
          ],
        },
        { type: "paragraph", runs: [{ text: "These third parties control their own cookies — we can't switch them off from our side, but they only load when you use those features." }] },
      ],
    },
    {
      id: "choices",
      number: "05",
      title: "Your choices",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "The cookie banner.", bold: true },
            { text: " On your first visit you can choose Accept all or Essential only. Analytics stays off unless you accept. Your choice is saved on your device, and you can change it anytime from the cookie settings control in the site footer." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "Your browser.", bold: true },
            { text: " You can also block or delete cookies and site data in your browser settings — note that deleting essential storage will sign you out and reset your on-device study profile." },
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "Google's opt-out.", bold: true },
            { text: " For Google Analytics specifically, Google offers a " },
            { text: "browser opt-out add-on", href: "https://tools.google.com/dlpage/gaoptout" },
            { text: "." },
          ],
        },
      ],
    },
    {
      id: "changes",
      number: "06",
      title: "Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "If we add new cookies or change how we use them, we'll update this page and, where the change is significant, ask for your consent again through the banner. The “Last updated” date above shows the current version." }],
        },
      ],
    },
    {
      id: "contact",
      number: "07",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Questions about cookies or your data? Email " },
            SUPPORT_LINK,
            { text: ". For how we handle personal data more broadly, see our " },
            { text: "Privacy Policy", href: "/privacy" },
            { text: "." },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PRIVACY POLICY (authored fresh — no prior version existed)
// ---------------------------------------------------------------------------

export const PRIVACY_CONTENT: LegalPageContent = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  lastUpdated: "20 August 2026",
  scope: "Applies to aidoctor.study and the AI Doctor Study app",
  summary: [
    [
      { text: "We collect the minimum needed to run your account and study profile", bold: true },
      { text: " — your name, email, study year, and exam focus." },
    ],
    [{ text: "Your questions and study activity are processed to generate answers and are never sold to advertisers." }],
    [
      { text: "Sign-in, storage, and analytics run through Google/Firebase", bold: true },
      { text: " — see their policy for how they handle data. AI Doctor Study is free — we don't collect payment data." },
    ],
    [{ text: "You can request a copy of your data or ask us to delete your account at any time." }],
    [{ text: "See the " }, { text: "Cookie Policy", href: "/cookies" }, { text: " for the specific cookies and local storage we use." }],
  ],
  sections: [
    {
      id: "scope",
      number: "01",
      title: "Who this policy covers",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "This Privacy Policy explains what personal data AI Doctor Study (“we”, “us”) collects when you use " },
            { text: "aidoctor.study", href: "https://aidoctor.study" },
            { text: " and the AI Doctor Study app (together, the “Service”), why we collect it, and the choices you have. It should be read alongside our " },
            { text: "Terms of Service", href: "/terms" },
            { text: " and " },
            { text: "Cookie Policy", href: "/cookies" },
            { text: "." },
          ],
        },
      ],
    },
    {
      id: "data",
      number: "02",
      title: "Data we collect",
      blocks: [
        {
          type: "list",
          items: [
            [
              { text: "Account data", bold: true },
              { text: " — your name, email address, and profile photo from Google sign-in; your study year and exam focus (e.g. MBBS, USMLE) from onboarding." },
            ],
            [
              { text: "Study activity", bold: true },
              { text: " — the questions you ask, the subjects and modes you use, and features like flashcards or saved cases, so the Service can respond to you and keep your progress." },
            ],
            [
              { text: "Device & usage data", bold: true },
              { text: " — device type, browser, and, only if you consent to analytics, aggregated usage statistics (see the " },
              { text: "Cookie Policy", href: "/cookies" },
              { text: ")." },
            ],
          ],
        },
      ],
    },
    {
      id: "use",
      number: "03",
      title: "How we use your data",
      blocks: [
        {
          type: "list",
          items: [
            [{ text: "to create and secure your account, and let you sign in;" }],
            [{ text: "to generate the AI explanations, answers, and study material you ask for;" }],
            [{ text: "to remember your study profile so the app opens straight into it;" }],
            [{ text: "to fix bugs, understand which features help students, and improve the Service (only using analytics you've consented to);" }],
            [{ text: "to reply when you contact support." }],
          ],
        },
        {
          type: "paragraph",
          runs: [{ text: "We do not sell your personal data, and we do not use it to serve you advertising." }],
        },
      ],
    },
    {
      id: "sharing",
      number: "04",
      title: "Who we share it with",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "We share data only with the service providers that run parts of the Service on our behalf, and only what each one needs to do its job:" }],
        },
        {
          type: "list",
          items: [
            [
              { text: "Google / Firebase", bold: true },
              { text: " — authentication, data storage, and (with consent) analytics. See the " },
              { text: "Google Privacy Policy", href: "https://policies.google.com/privacy" },
              { text: "." },
            ],
            [
              { text: "YouTube", bold: true },
              { text: " — when you play an embedded study video. See the " },
              { text: "Google Privacy Policy", href: "https://policies.google.com/privacy" },
              { text: "." },
            ],
          ],
        },
        {
          type: "paragraph",
          runs: [{ text: "We may also disclose data if required by law, or to protect the rights, safety, or security of AI Doctor Study, our users, or the public." }],
        },
      ],
    },
    {
      id: "retention",
      number: "05",
      title: "How long we keep it",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "We keep your account and study data for as long as your account is active, so your progress and history stay available to you. If you delete your account (see " },
            { text: "Your rights", href: "#rights" },
            { text: " below), we delete or anonymise your personal data within a reasonable period, except where we're required to keep records for legal, tax, or fraud-prevention reasons." },
          ],
        },
      ],
    },
    {
      id: "security",
      number: "06",
      title: "Security",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "We rely on Google/Firebase's infrastructure and security practices for authentication and storage. AI Doctor Study is free, so we never collect or handle payment details at all. No method of transmission or storage is 100% secure, but we take reasonable steps to protect your data and limit who can access it." },
          ],
        },
      ],
    },
    {
      id: "rights",
      number: "07",
      title: "Your rights",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "Depending on where you live, you may have the right to:" }],
        },
        {
          type: "list",
          items: [
            [{ text: "request a copy of the personal data we hold about you;" }],
            [{ text: "ask us to correct inaccurate data;" }],
            [{ text: "ask us to delete your account and associated data;" }],
            [{ text: "withdraw analytics consent at any time, from the cookie settings control in the site footer;" }],
            [{ text: "object to, or ask us to restrict, certain processing." }],
          ],
        },
        { type: "paragraph", runs: [{ text: "To exercise any of these, email " }, SUPPORT_LINK, { text: " — we'll respond within a reasonable time." }] },
      ],
    },
    {
      id: "children",
      number: "08",
      title: "Children's privacy",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "The Service is intended for users aged 16 and over (see the " },
            { text: "Terms of Service", href: "/terms" },
            { text: "). We don't knowingly collect personal data from anyone younger. If you believe a younger person has created an account, contact us and we'll take appropriate action." },
          ],
        },
      ],
    },
    {
      id: "law",
      number: "09",
      title: "International transfers & governing law",
      blocks: [
        {
          type: "callout",
          tone: "warning",
          label: "Placeholder — finalize with legal counsel before launch",
          paragraphs: [
            [{ text: "Where data is processed, and which jurisdiction's law governs this policy, depends on where the operating entity is registered and where its service providers host data — both to be confirmed and reviewed before this policy is relied on." }],
          ],
        },
      ],
    },
    {
      id: "changes",
      number: "10",
      title: "Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "We may update this Privacy Policy from time to time. If a change is material, we'll take reasonable steps to notify you before it takes effect. The “Last updated” date above shows the current version." }],
        },
      ],
    },
    {
      id: "contact",
      number: "11",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "Questions about this policy or your data? Email " }, SUPPORT_LINK, { text: "." }],
        },
      ],
    },
  ],
};

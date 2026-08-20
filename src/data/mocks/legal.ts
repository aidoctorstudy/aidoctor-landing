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
      { text: "The free plan is free. " },
      { text: "Pro renews monthly", bold: true },
      { text: " through Gumroad and you can cancel anytime — you keep Pro until your paid period ends." },
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
            { text: "By creating an account, purchasing a subscription, or simply using the Service, you agree to these Terms and to our " },
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
            { text: " to use the Service, and old enough to form a binding contract in your country to purchase a subscription." },
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
            [{ text: "use one account per person and not share, sell, or transfer your account or Pro access;" }],
            [{ text: "tell us promptly at " }, SUPPORT_LINK, { text: " if you believe your account has been compromised." }],
          ],
        },
      ],
    },
    {
      id: "plans",
      number: "06",
      title: "Free plan & Pro subscription",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "The free plan gives you limited access to the Service at no cost. " },
            { text: "Pro", bold: true },
            { text: " is a paid monthly subscription that unlocks additional features and higher usage limits, as described in the app at the time you purchase." },
          ],
        },
        {
          type: "list",
          items: [
            [
              { text: "Billing.", bold: true },
              { text: " Pro payments are processed by " },
              { text: "Gumroad", href: "https://gumroad.com" },
              { text: ", our payment provider and merchant of record. Your receipt, invoice, and any applicable taxes (such as VAT/GST) come from Gumroad." },
            ],
            [
              { text: "Auto-renewal.", bold: true },
              { text: " Pro renews automatically each month until you cancel. The renewal price is the price shown when you subscribed, unless we notify you of a change in advance." },
            ],
            [
              { text: "Cancelling.", bold: true },
              { text: " You can cancel anytime from Settings → Subscription in the app, which takes you to Gumroad to complete the cancellation. You keep Pro until the end of the period you've already paid for, then move back to the free plan automatically." },
            ],
            [
              { text: "Price changes.", bold: true },
              { text: " If we change the Pro price, we'll give you reasonable advance notice. The new price only applies from your next renewal, and you can cancel before it takes effect." },
            ],
            [
              { text: "Fair use.", bold: true },
              { text: " “Unlimited” features are subject to fair, personal, non-automated use. We may apply reasonable limits to protect the Service from abuse." },
            ],
          ],
        },
      ],
    },
    {
      id: "refunds",
      number: "07",
      title: "Cancellation & refunds",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Refunds are covered by our " },
            { text: "Refund Policy", href: "/refunds" },
            { text: ", which forms part of these Terms. In short: cancelling stops future renewals but isn't a refund of the current period; first-time purchases have a short money-back window; and refunded or charged-back payments end Pro access immediately." },
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
            [{ text: "reverse engineer, probe, or interfere with the Service, bypass usage limits or paywalls, or access it by any automated means;" }],
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
              { text: "Gumroad", bold: true },
              { text: " — payment processing for Pro. See " },
              { text: "Gumroad's Terms", href: "https://gumroad.com/terms" },
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
            { text: "We work hard to keep AI Doctor Study fast and available, but we can't promise it will be uninterrupted or error-free. We may add, change, or remove features, and we may impose or adjust usage limits, at any time. If we make a change that materially reduces what Pro includes, you can always cancel before your next renewal." },
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
            { text: "You can stop using the Service and delete your account at any time. We may suspend or terminate your access if you materially breach these Terms (for example, account sharing, scraping, or payment abuse), if required by law, or if we discontinue the Service. If we terminate without cause while you have an active paid period, we'll refund the unused portion of that period. Sections that by their nature should survive (like 09, 12, 13, and 16) survive termination." },
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
  ],
};

// ---------------------------------------------------------------------------
// REFUND POLICY
// ---------------------------------------------------------------------------

export const REFUNDS_CONTENT: LegalPageContent = {
  eyebrow: "Legal",
  title: "Refund Policy",
  lastUpdated: "17 August 2026",
  scope: "Applies to AI Doctor Study Pro purchases made through Gumroad",
  summary: [
    [
      { text: "First month didn't work out?", bold: true },
      { text: " Email us within 7 days of your first Pro purchase and we'll refund it, no drama." },
    ],
    [
      { text: "Cancelling ≠ refund.", bold: true },
      { text: " Cancel anytime — you keep Pro until your paid month ends, and you just won't be charged again." },
    ],
    [
      { text: "Renewals", bold: true },
      { text: " generally aren't refundable once a new month starts, except for billing mistakes or where the law says otherwise." },
    ],
    [{ text: "Refunds go back to your original payment method via Gumroad, usually within 5–10 business days." }],
    [
      { text: "Once a payment is refunded or charged back, " },
      { text: "Pro access ends immediately", bold: true },
      { text: "." },
    ],
  ],
  sections: [
    {
      id: "overview",
      number: "01",
      title: "How billing works",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "AI Doctor Study Pro is a monthly subscription billed through " },
            { text: "Gumroad", href: "https://gumroad.com" },
            { text: ", our payment provider and merchant of record. Gumroad charges your payment method, issues your receipt, and handles any applicable taxes. Refunds we approve are issued through Gumroad back to the payment method you used." },
          ],
        },
      ],
    },
    {
      id: "cancel",
      number: "02",
      title: "Cancelling your subscription",
      blocks: [
        { type: "paragraph", runs: [{ text: "You can cancel anytime — no notice period, no questions:" }] },
        {
          type: "list",
          ordered: true,
          items: [
            [
              { text: "Open the app → " },
              { text: "Settings → Subscription → Cancel Subscription", bold: true },
              { text: " (this takes you to Gumroad, where the cancellation is completed), or" },
            ],
            [
              { text: "Cancel directly from your " },
              { text: "Gumroad subscriptions page", href: "https://gumroad.com/subscriptions" },
              { text: " or the link in your Gumroad receipt email." },
            ],
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "Cancelling stops all future charges. " },
            { text: "You keep full Pro access until the end of the period you've already paid for", bold: true },
            { text: ", then your account moves back to the free plan automatically. Cancelling is not a refund of the current period, and we don't give partial refunds for unused days." },
          ],
        },
      ],
    },
    {
      id: "guarantee",
      number: "03",
      title: "7-day guarantee on your first purchase",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "We want Pro to actually help you study. If it's not for you, email us within " },
            { text: "7 days of your first Pro payment", bold: true },
            { text: " and we'll refund it in full. This applies once per person, to your first payment only — it's a chance to try Pro properly, not a recurring free month." },
          ],
        },
      ],
    },
    {
      id: "renewals",
      number: "04",
      title: "Renewal payments",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "Because you can cancel anytime before a renewal, renewal payments are generally " },
            { text: "non-refundable", bold: true },
            { text: " once the new billing period has started. We make exceptions when something on our side went wrong, for example:" },
          ],
        },
        {
          type: "list",
          items: [
            [{ text: "you were charged after cancelling before the renewal date;" }],
            [{ text: "you were charged twice for the same period;" }],
            [{ text: "a serious technical problem on our side made Pro unusable for a substantial part of the period and we couldn't fix it." }],
          ],
        },
        { type: "paragraph", runs: [{ text: "If any of those happen, contact us and we'll make it right — with a refund or account credit for the affected period." }] },
      ],
    },
    {
      id: "request",
      number: "05",
      title: "How to request a refund",
      blocks: [
        { type: "paragraph", runs: [{ text: "Email " }, SUPPORT_LINK, { text: " from any address, and include:" }] },
        {
          type: "list",
          items: [
            [{ text: "the " }, { text: "email address on your Gumroad receipt", bold: true }, { text: ";" }],
            [{ text: "the approximate " }, { text: "date of the charge", bold: true }, { text: " (or the Gumroad order/receipt number if you have it);" }],
            [{ text: "a sentence on " }, { text: "what went wrong", bold: true }, { text: " — it genuinely helps us improve the app." }],
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "We aim to reply within " },
            { text: "2 business days", bold: true },
            { text: ". Approved refunds are issued through Gumroad and typically appear on your statement within " },
            { text: "5–10 business days", bold: true },
            { text: ", depending on your bank." },
          ],
        },
      ],
    },
    {
      id: "after",
      number: "06",
      title: "What happens after a refund",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "When a payment is refunded, the Pro access it paid for ends " },
            { text: "immediately", bold: true },
            { text: " — your account returns to the free plan and your study data stays intact. If a refunded charge is somehow processed again by mistake, contact us and we'll reverse it." },
          ],
        },
      ],
    },
    {
      id: "chargebacks",
      number: "07",
      title: "Chargebacks",
      blocks: [
        {
          type: "callout",
          tone: "warning",
          label: "Please talk to us first",
          paragraphs: [
            [
              { text: "Chargebacks (disputing a charge with your bank) cost small products like ours real money in fees, even when resolved. If anything looks wrong on your statement, email us before disputing — we can almost always fix it faster than your bank can." },
            ],
          ],
        },
        {
          type: "paragraph",
          runs: [
            { text: "When a chargeback is filed, Gumroad notifies us and " },
            { text: "Pro access is revoked automatically and immediately", bold: true },
            { text: ". We may decline future purchases from accounts with abusive chargeback activity. Of course, nothing here limits your legal right to dispute genuinely unauthorised charges." },
          ],
        },
      ],
    },
    {
      id: "rights",
      number: "08",
      title: "Your statutory rights",
      blocks: [
        {
          type: "paragraph",
          runs: [
            { text: "This policy sits alongside your rights as a consumer — it never reduces them. If the consumer-protection law where you live gives you stronger refund or cancellation rights (for example, cooling-off rights for digital subscriptions in some countries), those rights apply. Where local law requires it, by starting your subscription immediately you consent to immediate supply of the digital service and acknowledge how this may affect any statutory withdrawal right." },
          ],
        },
      ],
    },
    {
      id: "changes",
      number: "09",
      title: "Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "We may update this Refund Policy from time to time. The version in force when you were charged is the one that applies to that charge. The “Last updated” date above shows the current version." }],
        },
      ],
    },
    {
      id: "contact",
      number: "10",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          runs: [{ text: "Anything unclear, or a situation this page doesn't cover? Email " }, SUPPORT_LINK, { text: " — a human reads it, and we'd rather sort it out than argue about it." }],
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
    [{ text: "Gumroad (payments) and YouTube (videos) may set their own cookies when you use those features." }],
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
              { text: "Gumroad", bold: true },
              { text: " — when you open the Pro checkout or manage your subscription, Gumroad sets its own cookies to process your payment securely. See " },
              { text: "Gumroad's Privacy Policy", href: "https://gumroad.com/privacy" },
              { text: "." },
            ],
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
      { text: "Sign-in, storage, and analytics run through Google/Firebase; payments run through Gumroad", bold: true },
      { text: " — see each provider's own policy for how they handle data." },
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
              { text: "Payment data", bold: true },
              { text: " — if you subscribe to Pro, Gumroad handles your payment details directly; we receive confirmation of your subscription status, not your card details." },
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
            [{ text: "to process Pro subscriptions and respond to billing/refund requests;" }],
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
              { text: "Gumroad", bold: true },
              { text: " — payment processing for Pro subscriptions. See " },
              { text: "Gumroad's Privacy Policy", href: "https://gumroad.com/privacy" },
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
            { text: "We rely on Google/Firebase's infrastructure and security practices for authentication and storage, and we don't handle your payment card details directly — Gumroad does. No method of transmission or storage is 100% secure, but we take reasonable steps to protect your data and limit who can access it." },
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

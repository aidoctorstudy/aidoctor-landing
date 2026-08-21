/**
 * Study app i18n runtime — loads before the numbered feature modules (see
 * `index.html`'s script order) and does three things:
 *
 * 1. Resolves the active locale. The app is embedded via `<iframe
 *    src="/app/index.html?locale=ar">` from the Next.js `[locale]` route
 *    (`src/views/app/study-app-frame.tsx`) — that query param is the "URL
 *    locale prefix" the app has no independent one of its own, since it's a
 *    single static path with its own client-side view switching, not a
 *    router. Falls back to a remembered choice, then the browser's
 *    language, then `en`.
 * 2. Sets `<html lang>`/`dir` immediately (before first paint, same pattern
 *    as the inline theme-detection script already in `index.html`) and
 *    applies the translation dictionary from `./translations.js` to
 *    existing DOM text.
 * 3. Keeps translating: a `MutationObserver` re-applies the same lookup to
 *    any node the app's ~5,000 lines of vanilla JS inject afterwards (quiz
 *    questions, generated flashcards, panel switches, toasts, …).
 *
 * ## Why a dictionary keyed by exact English text, not `t('some.key')`
 * calls rewritten into every one of those ~5,000 lines
 *
 * That would mean touching a large, working, revenue-generating app's
 * logic at hundreds of call sites — genuinely risky for a codebase with no
 * test suite. Instead, `translations.js` is keyed by the *current English
 * string itself* (`{ "Log In": "Iniciar sesión", ... }`), and this file
 * looks up whatever text is already on the page. That works identically
 * for markup that exists at load time and for anything injected later,
 * without a single edit to the feature modules — the trade-off is that a
 * *dynamically concatenated* string (`'Q ' + num + '/' + total`) can't be
 * matched (the DOM only ever sees the final joined text), so those stay in
 * English. See `scripts/extract-app-strings.mjs` for how the dictionary's
 * source strings were pulled out with that limitation already accounted
 * for (fragments that look like they're missing their other half are
 * excluded, not translated uselessly).
 *
 * `window.t(text)` is also exposed for the few places worth a direct call
 * (none required today — DOM translation covers the app as shipped).
 */
(function () {
  "use strict";

  var RTL_LOCALES = ["ar", "ur"];
  var SUPPORTED_LOCALES = ["en", "ar", "ur", "es", "fr", "hi", "pt", "de", "zh"];
  var STORAGE_KEY = "aid_locale";
  /** Native display names — mirrors LOCALE_LABELS in src/lib/i18n/locales.ts. */
  var LOCALE_LABELS = {
    en: "English",
    ar: "العربية",
    ur: "اردو",
    es: "Español",
    fr: "Français",
    hi: "हिन्दी",
    pt: "Português",
    de: "Deutsch",
    zh: "中文",
  };

  function detectLocale() {
    try {
      var fromQuery = new URLSearchParams(window.location.search).get("locale");
      if (fromQuery && SUPPORTED_LOCALES.indexOf(fromQuery) !== -1) {
        localStorage.setItem(STORAGE_KEY, fromQuery);
        return fromQuery;
      }
    } catch (e) {}

    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES.indexOf(stored) !== -1) return stored;
    } catch (e) {}

    var browserLang = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (SUPPORTED_LOCALES.indexOf(browserLang) !== -1) return browserLang;

    return "en";
  }

  var locale = detectLocale();
  var isRtl = RTL_LOCALES.indexOf(locale) !== -1;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";

  var dict = (window.AID_TRANSLATIONS && window.AID_TRANSLATIONS[locale]) || {};

  function t(text) {
    if (!text) return text;
    var trimmed = text.trim();
    if (!trimmed) return text;
    var translated = dict[trimmed];
    if (!translated) return text;
    // Preserve any whitespace the original text node had around it.
    var leading = text.slice(0, text.indexOf(trimmed));
    var trailing = text.slice(text.indexOf(trimmed) + trimmed.length);
    return leading + translated + trailing;
  }
  window.t = t;

  var TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label"];

  function translateElement(el) {
    for (var i = 0; i < TRANSLATABLE_ATTRS.length; i++) {
      var attr = TRANSLATABLE_ATTRS[i];
      var value = el.getAttribute(attr);
      if (value) {
        var next = t(value);
        if (next !== value) el.setAttribute(attr, next);
      }
    }
  }

  /** Walks `root`'s subtree, translating text nodes and the attributes above. */
  function translateTree(root) {
    if (root.nodeType === Node.ELEMENT_NODE) {
      var tag = root.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return;
      translateElement(root);
    }
    if (root.nodeType === Node.TEXT_NODE) {
      var next = t(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
      return;
    }
    var child = root.firstChild;
    while (child) {
      translateTree(child);
      child = child.nextSibling;
    }
  }

  function runInitialPass() {
    if (locale === "en") return; // English is the source text — nothing to swap.
    translateTree(document.body);
  }

  function observeFutureContent() {
    if (locale === "en") return;
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          translateTree(mutation.addedNodes[j]);
        }
        if (mutation.type === "attributes" && mutation.target.nodeType === Node.ELEMENT_NODE) {
          translateElement(mutation.target);
        }
        if (mutation.type === "characterData") {
          var next = t(mutation.target.nodeValue);
          if (next !== mutation.target.nodeValue) mutation.target.nodeValue = next;
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });
  }

  /**
   * `/app` has no `[locale]` segment of its own (it's one static path — see
   * the header docstring), so "update the URL to the correct locale prefix"
   * means navigating the *top-level* window, not this iframe: the visible
   * address bar belongs to the Next.js `[locale]/app` route that embeds
   * this page, and only that window can show `/ar/app` in it. Matches
   * `localizedPath()` in src/lib/i18n/locales.ts — unprefixed for `en`,
   * `/<locale>/app` otherwise. Works the same if this file is ever loaded
   * outside the iframe (`window.top === window`).
   */
  function switchLocale(newLocale) {
    if (SUPPORTED_LOCALES.indexOf(newLocale) === -1 || newLocale === locale) return;
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (e) {}
    var path = newLocale === "en" ? "/app" : "/" + newLocale + "/app";
    (window.top || window).location.href = path;
  }

  var SWITCHER_CONTAINER_IDS = ["langSwitcherNav", "langSwitcherTopbar", "langSwitcherOnboard"];

  /** A plain `<select>` — keyboard-operable and localized by the OS/browser for free. */
  function buildSwitcher() {
    var select = document.createElement("select");
    select.className = "lang-switcher-select";
    select.setAttribute("aria-label", "Language");
    for (var i = 0; i < SUPPORTED_LOCALES.length; i++) {
      var code = SUPPORTED_LOCALES[i];
      var option = document.createElement("option");
      option.value = code;
      option.textContent = LOCALE_LABELS[code] || code;
      if (code === locale) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener("change", function () {
      switchLocale(select.value);
    });
    return select;
  }

  function mountLanguageSwitchers() {
    for (var i = 0; i < SWITCHER_CONTAINER_IDS.length; i++) {
      var container = document.getElementById(SWITCHER_CONTAINER_IDS[i]);
      if (container && !container.firstChild) container.appendChild(buildSwitcher());
    }
  }

  function start() {
    mountLanguageSwitchers();
    runInitialPass();
    observeFutureContent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.AID_I18N = {
    locale: locale,
    isRtl: isRtl,
    locales: SUPPORTED_LOCALES,
    localeLabels: LOCALE_LABELS,
    switchLocale: switchLocale,
    t: t,
  };
})();

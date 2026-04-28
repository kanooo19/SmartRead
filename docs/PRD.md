# Product Requirements Document (PRD)
## SmartRead — Chrome Extension
**Version:** 1.0
**Date:** 2026-04-28
**Status:** V1 Shipped

---

## 1. What We Are Building

SmartRead is a Chrome extension that automatically fixes broken Arabic/English mixed-text rendering on AI tools and websites. It detects mixed-direction text, applies proper Unicode directionality markers (`<bdi>`, `dir` attributes), and delivers correct, readable output — with zero configuration required from the user.

---

## 2. Core Problem

Arab professionals who use AI tools (Claude, Gemini) daily receive responses that contain both Arabic and English text. These tools do not reliably handle bidirectional (BiDi) text rendering, resulting in:

- Reversed word order in mixed sentences
- Wrong reading direction applied to entire paragraphs
- Scrambled punctuation and number placement
- Inconsistent rendering across sessions and page reloads

The problem is not cosmetic. It breaks comprehension, slows down work, and forces users to manually re-read or reformat AI output. No existing tool addresses this for Arabic/English specifically in AI tool contexts.

---

## 3. Target Users

**Primary:** Arab professionals — analysts, consultants, writers, and researchers who work in Arabic and English daily and rely on AI tools as part of their workflow.

**Characteristics:**
- Use Claude, Gemini, or similar tools multiple times per day
- Write and read in both Arabic and English in the same session
- Are not developers — they expect tools to just work
- Will pay for a reliable solution that removes daily friction

**Secondary (post-V1):** Arabic-speaking students and content creators using AI tools for research or writing.

---

## 4. V1 Scope

V1 targets the highest-pain scenario: broken text inside AI tool chat interfaces. It is intentionally narrow.

### In scope
| Feature | Description |
|---|---|
| Auto-fix on page load | Detect and fix all mixed-direction text blocks when the page loads |
| Auto-fix on new responses | MutationObserver watches for new AI messages and fixes them as they stream in |
| Manual "Fix This Page" button | User-triggered re-run of the fix pass on the current page |
| Per-site toggle | Enable/disable SmartRead for the current site, persisted across sessions |
| Fix counter | Live count of text blocks corrected in the current session |
| Custom site support | User can add any domain via the popup; SmartRead activates there automatically |

### Supported sites (V1)
- claude.ai
- gemini.google.com
- User-defined custom domains

### Not in scope (V2+)
- ChatGPT (deferred — DOM patterns to be verified post-V1)
- Smart template system (structured output formatting)
- AI-powered text rewrite / cleanup
- Fix history and undo log
- Full "run on all websites" mode

---

## 5. User Flow

```
User opens claude.ai
       │
       ▼
SmartRead loads automatically (default: ON)
       │
       ▼
Page loads → content_script runs fixSubtree() on chat containers
       │
       ▼
User sends a message → AI responds
       │
       ▼
MutationObserver detects new DOM nodes → fixSubtree() runs on each new block
       │
       ▼
Mixed-direction text nodes are wrapped in <bdi> with correct dir attributes
       │
       ▼
Popup shows live counter: "Fixed: N blocks"
       │
  ─────┴─────────────────────────────
  │                                 │
User wants to disable          User wants to re-run
  │                                 │
Clicks toggle → OFF            Clicks "Fix This Page"
  │                                 │
Scripts stop, bdi wrappers     fixSubtree() re-runs
removed, text reverts          counter updates
```

---

## 6. Key Features

### 6.1 Auto-Fix Engine
- Detects Arabic (`U+0600–U+06FF` and extended ranges) and Latin characters in text nodes
- Triggers on both: initial page load and streamed AI responses (via MutationObserver)
- Wraps mixed segments in `<bdi>` elements; sets `dir="rtl"` or `dir="ltr"` based on dominant language
- Skips `<script>`, `<style>`, `<code>`, `<pre>`, and already-processed nodes

### 6.2 Popup UI
- **Toggle:** Enable/disable SmartRead for the current site
- **Fix This Page:** Manual re-run button
- **Fixed counter:** Live display of blocks corrected this session
- **Custom sites:** Add/remove any domain; stored in `chrome.storage.sync`

### 6.3 Per-Site State
- Toggle state stored in `chrome.storage.sync` keyed by hostname
- Syncs across devices on the same Chrome profile
- Defaults to ON for all supported sites on first visit

### 6.4 Custom Site Injection
- User adds a domain in the popup
- `background.js` listens for `tabs.onUpdated` and injects content scripts dynamically into matching tabs

---

## 7. Non-Goals

The following are explicitly out of scope for V1 and should not be added:

- **AI rewriting:** SmartRead fixes rendering, not content. It does not call any API to rephrase or clean up text.
- **Full-page CSS overrides:** We do not inject global stylesheets. All fixes are surgical, node-level changes.
- **ChatGPT support in V1:** ChatGPT's DOM structure needs separate verification before targeting.
- **Browser support beyond Chrome:** No Firefox, Safari, or Edge builds in V1.
- **Settings/options page:** All controls live in the popup. No standalone options page.
- **Analytics or telemetry:** No usage data is collected in V1.
- **Onboarding flow:** Zero setup is the value prop. No tutorial, no welcome screen.

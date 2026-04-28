# Decision Log & Changelog
## SmartRead — Chrome Extension
**Version:** 1.0
**Date:** 2026-04-28

This document records the key product decisions made during planning, what alternatives were considered, and why we chose what we chose. It is not a git changelog — it is a record of intent.

---

## Planning Session — 2026-04-28

---

### Decision 1: Target User — Arab Professionals

**Chosen:** Arab professionals (analysts, consultants, writers, researchers)

**Alternatives considered:**
- Arabic students
- Content creators (bilingual marketers/bloggers)
- Developers and power users

**Why we chose this:**
Arab professionals are high-frequency users of AI tools with real workflow consequences when text breaks. They have purchasing power and a clear ROI for a paid fix. Students have higher churn and lower willingness to pay. Content creators are a secondary segment, not a primary one. Developers could self-fix with CSS — they are not the core audience.

---

### Decision 2: Core Problem Focus — AI Tool Rendering Only (V1)

**Chosen:** Fix broken text in AI tools (Claude, Gemini)

**Alternatives considered:**
- Copy-paste corruption (documents, clipboard)
- Inconsistent web rendering across general websites
- All of the above equally

**Why we chose this:**
AI tools are where the pain is most acute and most frequent for Arab professionals today. Focusing on one context lets us build precise DOM selectors and test thoroughly. Trying to fix all websites in V1 would mean shallow, untested coverage everywhere. Nail one use case before expanding.

---

### Decision 3: V1 Feature Set — Auto-Fix + Manual Button Only

**Chosen:** Auto-fix on page load/new responses + Manual "Fix This Page" button

**Alternatives considered:**
- Smart template system (enforce consistent output formatting)
- AI-powered text rewrite/cleanup
- Fix history and undo log

**Why we chose this:**
The auto-fix + manual button covers 100% of the core use case. Smart templates and AI rewriting are V2 features that require more user research and significantly more complexity. Including them in V1 risks scope creep, delayed launch, and a bloated first release. The counter-argument ("users want templates") is valid — but they first need the rendering to work. Fix the foundation before building on it.

**What we intentionally excluded:**
- AI enhancement: requires API key management, latency, cost — wrong tradeoff for V1
- Smart templates: valuable but not the core fix
- Fix history: nice-to-have, not need-to-have

---

### Decision 4: Default Behavior — Auto-On with Per-Site Pause

**Chosen:** Auto-on by default; user can toggle off per site

**Alternatives considered:**
- Always-on with no toggle (no control)
- Manual-only (user must activate every time)
- Ask on first visit per site

**Why we chose this:**
"Zero setup, instant results" is the core value proposition. The extension must work immediately without the user doing anything. But users need an escape hatch — if SmartRead breaks something on a specific site, they should be able to pause it with one click. Always-on with no toggle is too aggressive. Manual-only undermines the whole point. "Ask on first visit" adds friction and feels like every other extension that asks too many questions.

---

### Decision 5: Popup UI — Toggle + Status (Not Minimal, Not Full Control Panel)

**Chosen:** Toggle + site name + "Fix This Page" button + live fixed counter

**Alternatives considered:**
- Minimal toggle only (just on/off)
- Full control panel (toggle + fix button + settings + history)

**Why we chose this:**
The minimal toggle is too bare — users want confirmation that something is happening. The full control panel is too heavy for V1. The middle option gives users what they need: a clear on/off state, a manual escape, and proof that the tool is working (the counter). The counter is specifically important for building trust — users need to see "Fixed: 12 blocks" to know SmartRead did something.

---

### Decision 6: Supported Sites — Claude + Gemini + Custom Domains

**Chosen:** claude.ai, gemini.google.com, plus user-defined custom sites

**Alternatives considered:**
- ChatGPT as a V1 target
- All websites (no allowlist)

**Why we chose this:**
ChatGPT was excluded from V1 because its DOM structure requires separate verification — rushing support risks shipping broken behavior on the highest-traffic AI tool, which would damage early reviews. We start with Claude and Gemini, get the DOM selectors right, then add ChatGPT in a point release. Custom site support was included because it costs almost nothing to build and gives power users a way to extend SmartRead to any site they need (internal tools, Notion, etc.) without waiting for an official update.

---

### Decision 7: Monetization — Subscription

**Chosen:** Subscription (~$2–$5/month), with a free tier

**Alternatives considered:**
- Free forever (monetize later)
- Freemium (free core, pay for Pro features)
- One-time purchase ($5–$10)

**Why we chose this:**
SmartRead is a daily-use utility. Daily-use tools justify recurring billing because they deliver recurring value. A one-time purchase undervalues the product and removes the revenue needed to maintain DOM selectors as AI tool UIs change (they change constantly). Free forever delays sustainability. Subscription with a free tier is the standard for productivity tools in this category and aligns incentives: if the tool keeps working, users keep paying.

**Free tier limits (V1 plan):**
- 1 supported site (Claude)
- 50 fixes/day

**Pro tier:**
- All sites (Claude, Gemini, custom)
- Unlimited fixes
- Priority updates when AI tool UIs change

---

### Decision 8: Differentiator — Zero Setup, Instant Results

**Chosen:** Zero setup, instant results

**Alternatives considered:**
- Arabic-first design positioning
- AI tool specialization (tuned DOM selectors)
- Smart template output (goes beyond fixing)

**Why we chose this:**
"Zero setup, instant results" is the most universally understood value for any professional. It requires no education. The user opens Claude, text is already fixed. That is the entire pitch. The other differentiators are real — but they are the *how*, not the *why*. The positioning leads with the user outcome, not the technical implementation.

---

## What We Are Deferring and Why

| Deferred Feature | Reason |
|---|---|
| ChatGPT support | DOM needs verification; risk of broken V1 experience on highest-traffic platform |
| Smart template system | Useful but not the core fix; adds complexity before foundation is proven |
| AI text enhancement | Wrong tradeoff for V1: adds API cost, latency, and key management |
| Fix history / undo | Nice-to-have; no evidence users need it in V1 |
| All-websites mode | Untested; risks regressions on sites we haven't designed for |
| Options/settings page | Popup covers V1 needs; options page adds scope without adding value |
| Analytics / telemetry | Not needed to ship; adds privacy complexity |
| Firefox / Safari support | Chrome-first is correct; port after V1 is proven |

# Trelink — Design System Onboarding

**Audience:** Hai (development), David (Tech Lead)
**Owner:** Vitorino (PM & Design)
**Repo:** `wireframe-journey-map` (`~/Development/wireframe-journey-map`), served on `localhost:8080`
**Status:** Design direction approved by PM. Implementation prompts below are ready to run in Claude Code, in order.

## 1. Project context

Trelink is a Swedish B2B marketplace for buying/selling commercial real estate, business inventories ("inkråm"), and companies ("bolag"). Three roles: **sellers**, **buyers** (anonymous, identified via K-codes visible only to Trelink and sellers), and **Trelink admins**.

Client stakeholders: George (CEO), Dani, Jenny. Weekly sync: Fridays 16:00.

Current build is a **wireframe/journey-map prototype** — Vite + TypeScript, data layer is localStorage only (no backend yet; Supabase noted in tech stack for later). It covers three flows end-to-end:

- **Seller flow** — multi-step "Skapa annons" wizard, uppdragsavtal preview, onboarding data
- **Admin/CRM portal** — post-approval pipeline, pricing, annonstext composer, Granskning queue, Fastighetsinfo, Översikt dashboard
- **Buyer flow** — registration → PLP → listing detail → interest → PDF review → decision, wired to seller-side notifications

Wireframe-level fidelity only: no real PDF generation, no real email integrations, no mocked data, empty state by default.

**We are now moving from wireframe fidelity to a premium production-grade visual layer**, before the eventual wireframe → UI branch transition (tag `wireframe-approved-<date>`, new UI branch, cherry-pick rules added to `CLAUDE.md` at that point — not yet).

**Scope note:** third-party ad architecture and a new "Tilläggstjänster" page are identified change-request candidates from the May 2026 kickoff — **out of current scope** until confirmed with George/Dani. This design system work does not touch that scope question.

**Language convention:** all UI copy stays Swedish. This document and all Claude Code prompts are English (internal dev documentation convention).

## 2. Design direction

**Brief:** modern, premium — "like Airbnb" — using Tailwind. Not generic, not default-shadcn-looking.

**Approach distilled from design research:**

- Premium reads as **restraint**, not decoration: one confident type pairing, a disciplined color system where the brand purple is used sparingly on primary actions, generous whitespace on a 4/8px grid, hairline borders + soft layered shadows instead of heavy drop-shadows, a small fixed set of border-radii.
- Escape the "generic AI/shadcn" look by **editing tokens, not fighting the component library**: custom OKLCH color scale + warm-tinted neutrals (not default Tailwind slate/gray), a distinctive font pairing (not Inter-only), one signature shadow + easing curve reused everywhere, `tabular-nums` on all financial/numeric figures.
- **Tailwind v4, CSS-first `@theme` tokens** (not `tailwind.config.js`).

Brand colors: #3D138D (primary, deep purple) and #FDC8C4 (secondary, soft pink). Neutrals: black/white plus a warm-tinted gray scale.

**Important color-accuracy note for devs:** #3D138D has ~12.5:1 contrast with white — excellent for filled buttons/headings, but **too dark/low-contrast-mismatched to use as a link/interactive text color** at smaller sizes. Use the lighter derived purple-600 (~#714CDE) for text links and interactive states that need to pass WCAG AA on white. Full scale below.

---

## 3. Design tokens (reference — Tailwind v4 `@theme`)

Use this as the target token set. It will be introduced via the two Claude Code prompts in Section 4 (Prompt 1 = typography + color, Prompt 2 = spacing/radius/shadow/motion + components). Pasting the full reference here so the whole team has one source of truth.

### 3.1 Typography

- Display/headings: **Instrument Serif** or **Fraunces**
- Body/UI: **Inter**
- Load via `@fontsource` or Google Fonts, Latin + Nordic (å/ä/ö) subset
- Type scale: `12 / 14 / 16(base) / 20 / 24 / 30 / 36 / 48 / 60px`, body line-height ~1.5
- Negative letter-spacing (~-0.02em) on headings ≥30px only
- `.tabular-nums` utility (`font-variant-numeric: tabular-nums`) — required on all price, valuation, yta (kvm), and inventory figures; right-align these in tables

### 3.2 Color

```css
/* Primitive scale — purple, OKLCH-based, #3D138D = 800 */
--color-purple-50:  #F3F2FD;
--color-purple-100: #E5E3FD;
--color-purple-200: #D1CCFB;
--color-purple-300: #BAB0FF;
--color-purple-400: #A191FA;
--color-purple-500: #896CF8;
--color-purple-600: #714CDE;  /* text links / interactive text on white — AA safe */
--color-purple-700: #5731B6;
--color-purple-800: #3D138D;  /* BRAND — filled CTA bg + white text */
--color-purple-900: #2E096D;
--color-purple-950: #1A0344;

/* Primitive scale — pink wash, from #FDC8C4. Backgrounds/badges/illustrations only */
--color-pink-50:  #FFF6F5;
--color-pink-100: #FEEBE9;
--color-pink-200: #FDDCD9;
--color-pink-300: #FDC8C4;

--color-black: #000000;
--color-white: #FFFFFF;

/* Neutrals — warm/purple-tinted, NOT default Tailwind slate/gray */
--color-canvas: #FBFAFC;
--color-surface: #FFFFFF;
--color-border-hairline: #ECEAF1;
--color-text: #1D1A24;
--color-text-muted: #6B6675;

/* Semantic layer — components reference ONLY these, never primitives directly */
--color-primary: var(--color-purple-800);
--color-primary-hover: var(--color-purple-900);
--color-interactive: var(--color-purple-600);
--color-focus-ring: var(--color-purple-500);
--color-accent-wash: var(--color-pink-100);
--color-success: oklch(0.70 0.15 140);
--color-warning: oklch(0.70 0.15 90);
--color-danger:  oklch(0.63 0.20 25);
```

### 3.3 Spacing & radius

```css
/* Spacing scale (px) — replace ad-hoc padding/margin with these */
4, 8, 12, 16, 24, 32, 48, 64, 96

/* Radius scale — three values only */
--radius-control: 8px;   /* buttons, inputs */
--radius-card: 12px;     /* cards, modals — up to 16px for larger cards */
--radius-pill: 999px;    /* badges, pills, search bars */
```

### 3.4 Shadow & motion

```css
--shadow-sm: 0 1px 2px rgba(29,26,36,0.04);
--shadow-md: 0 1px 2px rgba(29,26,36,0.04), 0 4px 12px rgba(29,26,36,0.06);
--shadow-lg: /* stronger variant, modals/popovers */;

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

Rules: cards get hairline border or `--shadow-md`, never both. Card hover increases shadow only (no resize). Button active/press scales to ~0.97. Respect `prefers-reduced-motion`.

### 3.5 Components (behavioral spec)

| Component | Spec |
|---|---|
| Primary button | filled `--color-primary`, white text, `--radius-control`, medium weight, ~10-12px vertical padding |
| Secondary button | hairline border, neutral text |
| Tertiary button | text-only link, `--color-interactive` |
| Cards | `--radius-card`, `--shadow-md` OR hairline border (not both), image-first where applicable |
| Inputs | ~44px height, 8-10px radius, hairline border, focus = border → `--color-interactive` + soft ring `--color-focus-ring` |
| Tables | horizontal-lines-only, sticky header, numeric columns right-aligned + `.tabular-nums`, uppercase muted 12px column labels, subtle row hover tint |
| Navigation | hairline bottom border (no heavy shadow), active item = `--color-interactive` text or 2px underline in `--color-primary` |
| Icons | standardize on **Lucide**, one consistent stroke width — do not mix icon styles |

---

## 4. Implementation prompts (run in order via Claude Code)

Both follow standing conventions: repo-pull opener, English, `localhost:8080` check before commit, ✅/❌ checklist (4+ numbered points).

### Prompt 1 — Typography & color tokens

```
Go to the wireframe-journey-map repo in ~/Development (git pull first).

We're moving away from the "wireframe" look toward a premium, modern design
system in the spirit of Airbnb/Stripe/Linear — but must not look generic or
default-shadcn/Tailwind. This is step 1 of 2: typography + color foundations.
This replaces the earlier basic color-token pass with a fuller scale.

CONTEXT: This is Tailwind v4. Use the CSS-first @theme approach (not
tailwind.config.js) for all tokens.

1. TYPOGRAPHY
    - Add font pairing: "Instrument Serif" or "Fraunces" for large display
headings (h1/h2, hero numbers), "Inter" for everything else (body, UI,
labels, buttons). Load via @fontsource or Google Fonts, Latin + Nordic (å/ä/
ö) subset.
    - Define a type scale as tokens: 12/14/16(base)/20/24/30/36/48/60px, line-
height ~1.5 for body.
    - Apply tight negative letter-spacing (~-0.02em) only on headings ≥30px.
    - Add a `.tabular-nums` utility (font-variant-numeric: tabular-nums) and
apply it to ALL price, valuation, area (kvm), and inventory figures across
seller/admin/buyer flows — right-align these in tables.

2. COLOR TOKENS
    Define in :root as CSS variables, OKLCH-based purple scale with #3D138D as
the 800-step:
    --color-purple-50 through --color-purple-950 (11 steps, #3D138D at 800)
    --color-purple-600 (~#714CDE) = interactive/link color — use this, NOT
purple-800, for text links and any interactive text on white
    --color-pink-50 through --color-pink-300 (soft wash scale from #FDC8C4,
low-chroma, for backgrounds/badges/illustrations only — never for buttons or
status)
    --color-black: #000000, --color-white: #FFFFFF
    Neutral scale: warm/purple-tinted grays (NOT default Tailwind slate/gray)
— e.g. canvas ~#FBFAFC, border-hairline ~#ECEAF1, text-muted ~#6B6675, text
~#1D1A24. Only introduce these if not already consistently defined; otherwise
adjust existing neutrals to have a faint warm/purple tint rather than cool
gray.

    Semantic tokens (map to the above):
    --color-primary (purple-800, filled buttons/CTA)
    --color-primary-hover (purple-900)
    --color-interactive (purple-600, links/active nav)
    --color-focus-ring (purple-500)
    --color-accent-wash (pink-100, backgrounds/badges)
    --color-surface, --color-canvas, --color-border, --color-text, --color-
text-muted
    --color-success / --color-warning / --color-danger at matched OKLCH
lightness (~0.65-0.7) so they read as one family

    Replace hardcoded color values throughout the codebase (seller, admin/CRM,
buyer flows) with references to these tokens.

3. DO NOT touch content/copy — all Swedish UI text stays exactly as-is. DO
NOT touch spacing, radius, shadows, or component structure yet — that's a
separate follow-up prompt.

List each numbered point above with ✅/❌ (no justification needed for ✅,
brief reason only for ❌).

Show me the result on localhost:8080 before you commit.
```

### Prompt 2 — Spacing, radius, shadow, motion & components

*(run after Prompt 1 is reviewed and committed)*

```
Go to the wireframe-journey-map repo in ~/Development (git pull first).

This is step 2 of 2 in the premium design system rollout (typography and
color tokens from step 1 are already in place — use those tokens, do not
redefine colors/fonts).

1. SPACING & RADIUS TOKENS
    - Spacing scale: 4/8/12/16/24/32/48/64/96px — audit and replace ad-hoc
padding/margin values across all three flows with this scale.
    - Radius scale: 8px (buttons/inputs), 12-16px (cards/modals), 999px
(pills/badges/search bars). Replace inconsistent radius values with these
three.

2. SHADOW & MOTION TOKENS
    - Define ONE signature shadow scale (warm-tinted, layered, not pure
gray/black), e.g.:
      --shadow-sm: 0 1px 2px rgba(29,26,36,0.04)
      --shadow-md: 0 1px 2px rgba(29,26,36,0.04), 0 4px 12px
rgba(29,26,36,0.06)
      --shadow-lg: for modals/popovers, slightly stronger
    - Apply --shadow-md to cards (listing cards, dashboard cards) instead of
default Tailwind shadow utilities. Cards should NOT have both a heavy border
AND a heavy shadow — pick hairline border OR soft shadow, not both.
    - Define one easing/transition token (e.g. cubic-bezier(0.4, 0, 0.2, 1))
and use it consistently for hover/transition states (buttons, cards, nav).
    - On card hover: increase shadow intensity only, do not resize/scale the
card.
    - On button active/press: scale to ~0.97 for tactile feedback.
    - Respect prefers-reduced-motion.

3. COMPONENT UPDATES (apply across seller, admin/CRM, and buyer flows)
    - Buttons: primary = filled purple-800 bg + white text + 8px radius +
medium font-weight; secondary = hairline border + neutral text; tertiary =
text-only link in purple-600. Comfortable padding (~10-12px vertical).
    - Cards (listings, dashboard cards, admin review cards): 12-16px radius,
--shadow-md OR hairline border (not both), image-first treatment where a
listing has an image/placeholder.
    - Forms: inputs at ~44px height, 8-10px radius, hairline border, focus
state = border shifts to purple-600 + soft focus ring in purple-500.
    - Tables (Granskning list, admin data tables, buyer PLP if tabular):
horizontal-lines-only style, sticky header, numeric columns right-aligned
with tabular-nums (from step 1), muted uppercase micro-labels (12px, letter-
spacing +0.02em) for column headers, subtle neutral hover tint per row.
    - Navigation: hairline bottom border (no heavy shadow), active nav item =
purple-600 text or 2px underline in purple-800.
    - Icons: standardize on Lucide (already likely in use) at a single
consistent stroke width — do not mix icon styles/weights.

4. DO NOT touch content/copy — all Swedish UI text stays exactly as-is.

List each numbered point above with ✅/❌ (no justification needed for ✅,
brief reason only for ❌).

Show me the result on localhost:8080 before you commit.
```

---

## 5. Ground rules for this workstream

- **Scope discipline:** this design system work does not expand into the third-party ad architecture or "Tilläggstjänster" page discussions — those remain pending George/Dani confirmation.
- **Content is frozen:** no Swedish copy changes in either prompt. This is visual/token layer only.
- **Test before stacking:** review each prompt's result on `localhost:8080` before running the next one or committing.
- **Commit messages:** English, imperative form (standing convention).
- **Not yet in scope:** the wireframe → UI branch/tag transition (`wireframe-approved-<date>` tag + new branch + `CLAUDE.md` cherry-pick rules). This design system lands on the current wireframe branch first; the branch split happens as its own separate, single Claude Code prompt when the PM confirms the UI phase is starting.
- **Questions/deviations:** if Claude Code has to deviate from a spec above (e.g. a token value doesn't work for accessibility reasons), it should flag it in the ✅/❌ checklist rather than silently substituting.

*Prepared by Vitorino (PM) for Hai/David — CC Projects × Trelink.*

# Trelink Wireframe Prototype
## What this is
A clickable wireframe prototype for Trelink — a Swedish marketplace for business transfers (verksamhetsöverlåtelser). Its only purpose is client sign-off on user flows. It is NOT production code and will be retired after the design phase. Production is built separately in Next.js by the tech team.
## Rules

* The prototype has moved from a plain grayscale wireframe to a premium design system (Airbnb/Stripe/Linear-inspired, not generic shadcn/Tailwind defaults) — still built on WireBox, PageHeader, WireBtn, WireTag, Annotation from @/components/wire, but no longer purely monochrome or flat. All tokens live in src/styles.css (Tailwind v4 CSS-first @theme):
   * Typography: "Instrument Serif" for h1/h2 and hero numbers, "Inter" for everything else (h3-h6 included); type scale 12/14/16/20/24/30/36/48/60px with -0.02em letter-spacing baked into the 30px+ steps; `tabular-nums` on price/valuation/area/inventory figures.
   * Color: OKLCH purple scale (purple-800 = #3D138D = --color-primary, filled buttons/CTAs only) and pink wash scale (from #FDC8C4, backgrounds/badges only — never buttons/status); --color-interactive (purple-600) for text links, not primary/800; warm/purple-tinted neutrals power --background/--foreground/--muted/--border app-wide.
   * Spacing: Tailwind's default scale (4/8/12/16/24/32/48/64/96px) — no custom tokens needed.
   * Radius: three roles only — rounded-button (8px), rounded-card (14px), rounded-pill (999px).
   * Shadow/motion: shadow-sm/md/lg are warm-tinted (not gray/black) and registered under Tailwind's own utility names; ease-standard documents that Tailwind's default `ease-in-out` already matches cubic-bezier(0.4,0,0.2,1); buttons scale to 0.97 on press; cards increase shadow (never scale) on hover; prefers-reduced-motion is respected globally.
   * Cards use shadow OR a hairline border, never both. Forms: ~44px inputs, hairline border, purple-600 focus border + purple-500 focus ring.
   Content/copy is never touched by these passes — Swedish UI text stays as-is.
* All user-facing text in Swedish. Code identifiers, comments, and commit messages in English. Swedish legal/domain terms (inkråm, uppdragsavtal, hyresvärd) may remain Swedish inside identifiers.
* Data is localStorage only (key: saljare-annonser). No backend, no APIs.
* The seller workflow state machine lives in src/lib/annons-workflow.ts. Any new status must be added there first.
* Business facts that must stay consistent everywhere:
   * Fees: 29 900 kr (Överlåtelse), 39 900 kr (Inkråm), 79 900 kr (Aktieöverlåtelse). Premium add-on: 2 500 kr.
   * TreLink writes listing title/text and sets the price — sellers never edit published content.
   * Direct buyer–seller contact is fully blocked. Buyers appear only as anonymous codes (K-xxx).
   * UC (Upplysningscentralen) credit checks are NOT part of the product — do not reintroduce UC/kreditupplysning references anywhere.
   * Review SLA: 24h on weekdays. Document retention: 7 years (Swedish brokerage practice).
* Keep changes minimal and scoped. Never refactor broadly without being asked.

## Sync
main → Lovable auto-sync → preview at preview--wireframe-journey-map.lovable.app. Local dev runs at localhost:8080. Published client URL is currently unpublished — do not deploy without explicit approval.

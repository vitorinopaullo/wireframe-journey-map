# Trelink Wireframe Prototype
## What this is
A clickable wireframe prototype for Trelink — a Swedish marketplace for business transfers (verksamhetsöverlåtelser). Its only purpose is client sign-off on user flows. It is NOT production code and will be retired after the design phase. Production is built separately in Next.js by the tech team.
## Rules

* Preserve the wireframe aesthetic: WireBox, PageHeader, WireBtn, WireTag, Annotation from @/components/wire. Dashed borders, font-mono labels, no brand colors.
* All user-facing text in Swedish. Code identifiers, comments, and commit messages in English. Swedish legal/domain terms (inkråm, uppdragsavtal, hyresvärd) may remain Swedish inside identifiers.
* Data is localStorage only (key: saljare-annonser). No backend, no APIs.
* The seller workflow state machine lives in src/lib/annons-workflow.ts. Any new status must be added there first.
* Business facts that must stay consistent everywhere:
   * Fees: 29 900 kr (Överlåtelse), 39 900 kr (Inkråm), 79 900 kr (Aktieöverlåtelse). Premium add-on: 2 500 kr.
   * TreLink writes listing title/text and sets the price — sellers never edit published content.
   * Direct buyer–seller contact is fully blocked. Buyers appear only as anonymous codes (K-xxx).
   * UC credit check on the BUYER happens only after signed purchase agreement and paid deposit. Sellers never see the buyer's credit process.
   * Review SLA: 24h on weekdays. Document retention: 7 years (Swedish brokerage practice).
* Keep changes minimal and scoped. Never refactor broadly without being asked.

## Sync
main → Lovable auto-sync → preview at preview--wireframe-journey-map.lovable.app. Local dev runs at localhost:8080. Published client URL is currently unpublished — do not deploy without explicit approval.

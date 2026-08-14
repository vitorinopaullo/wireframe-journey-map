// Offline, self-contained placeholder images (inline SVG data URIs) for the
// wireframe — no network dependency, no real photography needed. Used for
// listing-gallery and floor-plan placeholders wherever an actual <img> (not
// just a "[ Bild ]" text box) is needed to demo real gallery/lightbox UI.

// SVG is XML — unescaped "&"/"<"/">" in text content breaks the parser
// (silently, as a 0x0 broken image), so any label with e.g. "&" needs this.
function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function placeholderImage(title: string, subtitle?: string): string {
  const bg = "#ECEAF1";
  const fg = "#6B6675";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="${subtitle ? "46%" : "50%"}" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" fill="${fg}">${escapeXml(title)}</text>
    ${subtitle ? `<text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" fill="${fg}">${escapeXml(subtitle)}</text>` : ""}
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

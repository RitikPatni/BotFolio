import { Resvg } from "@resvg/resvg-js";

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background: off-white light -->
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fafafa"/>
        <stop offset="100%" stop-color="#f5f5f7"/>
      </linearGradient>
      
      <!-- Studio accent: blue-purple (same as dark) -->
      <linearGradient id="studio" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#82aaff"/>
        <stop offset="100%" stop-color="#c792ea"/>
      </linearGradient>
      
      <!-- Field accent: amber-red (same as dark) -->
      <linearGradient id="field" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
      
      <!-- Dual accent: split gradient (same as dark) -->
      <linearGradient id="dual" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#82aaff"/>
        <stop offset="50%" stop-color="#c792ea"/>
        <stop offset="50%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
      
      <!-- Subtle grid pattern (darker for light mode) -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <line x1="40" y1="0" x2="40" y2="40" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>
        <line x1="0" y1="40" x2="40" y2="40" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    
    <!-- Background with subtle grid -->
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    
    <!-- Top accent bar: studio gradient -->
    <rect x="0" y="0" width="600" height="4" fill="url(#studio)"/>
    
    <!-- Bottom accent bar: field gradient -->
    <rect x="600" y="0" width="600" height="4" fill="url(#field)"/>
    
    <!-- Name: large, confident, left-aligned (dark text) -->
    <text x="80" y="280" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="80" font-weight="300" letter-spacing="-0.04" fill="#0a0a0b">RITIK</text>
    <text x="80" y="370" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="80" font-weight="300" letter-spacing="-0.04" fill="#0a0a0b">PATNI</text>
    
    <!-- Dual accent line under name -->
    <line x1="80" y1="420" x2="400" y2="420" stroke="url(#dual)" stroke-width="3" stroke-linecap="round"/>
    
    <!-- Tagline: smaller, muted (dark gray) -->
    <text x="80" y="470" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="20" font-weight="300" letter-spacing="-0.01" fill="#5c5c6e">Frontend developer · wildlife/macro photographer</text>
    
    <!-- URL: subtle, right-aligned (darker gray) -->
    <text x="1120" y="590" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="16" font-weight="400" letter-spacing="0.02" fill="#56566a" text-anchor="end">ritikpatni.me</text>
    
    <!-- Corner accent: top-right studio glow (lighter opacity for light mode) -->
    <rect x="1050" y="0" width="150" height="150" fill="url(#studio)" opacity="0.12"/>
    
    <!-- Corner accent: bottom-left field glow (lighter opacity for light mode) -->
    <rect x="0" y="480" width="150" height="150" fill="url(#field)" opacity="0.12"/>
  </svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}

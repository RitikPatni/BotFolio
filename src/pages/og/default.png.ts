import { Resvg } from "@resvg/resvg-js";

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background gradient: subtle dark gradient -->
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a0a0b"/><stop offset="50%" stop-color="#0d1015"/><stop offset="100%" stop-color="#0a0a0b"/>
      </linearGradient>
      
      <!-- Studio accent: blue-purple -->
      <linearGradient id="accent-studio" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#82aaff"/><stop offset="100%" stop-color="#c792ea"/>
      </linearGradient>
      
      <!-- Field accent: amber-red -->
      <linearGradient id="accent-field" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
      
      <!-- Dual accent line: split gradient -->
      <linearGradient id="accent-dual" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#82aaff"/><stop offset="50%" stop-color="#c792ea"/><stop offset="50%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bg)"/>
    
    <!-- Subtle studio accent glow (top-left) -->
    <ellipse cx="200" cy="160" rx="400" ry="320" fill="url(#accent-studio)" opacity="0.06"/>
    
    <!-- Subtle field accent glow (bottom-right) -->
    <ellipse cx="1000" cy="500" rx="360" ry="280" fill="url(#accent-field)" opacity="0.05"/>
    
    <!-- Name -->
    <text x="600" y="260" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="72" font-weight="300" letter-spacing="-0.5" fill="#fafafa" text-anchor="middle">Ritik Patni</text>
    
    <!-- Tagline -->
    <text x="600" y="335" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="24" font-weight="300" fill="#888896" text-anchor="middle">Frontend developer &amp; wildlife/macro photographer</text>
    
    <!-- Dual accent line (hints at both personas) -->
    <rect x="450" y="385" width="300" height="3" rx="1.5" fill="url(#accent-dual)"/>
    
    <!-- URL -->
    <text x="600" y="435" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="18" font-weight="300" fill="#5c5c6e" text-anchor="middle">ritikpatni.me</text>
  </svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}
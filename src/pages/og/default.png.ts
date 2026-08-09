import { Resvg } from "@resvg/resvg-js";

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a0a0b"/><stop offset="50%" stop-color="#0d1015"/><stop offset="100%" stop-color="#0a0a0b"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#82aaff"/><stop offset="100%" stop-color="#c792ea"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <ellipse cx="200" cy="160" rx="400" ry="320" fill="url(#accent)" opacity="0.08"/>
    <ellipse cx="1000" cy="500" rx="360" ry="280" fill="url(#accent)" opacity="0.06"/>
    <text x="600" y="260" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="72" font-weight="300" letter-spacing="-0.5" fill="#fafafa" text-anchor="middle">Ritik Patni</text>
    <text x="600" y="335" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="24" font-weight="300" fill="#888896" text-anchor="middle">Frontend developer &amp; wildlife/macro photographer</text>
    <rect x="518" y="385" width="164" height="3" rx="1.5" fill="url(#accent)"/>
    <text x="600" y="435" font-family="Inter,ui-sans-serif,system-ui,sans-serif" font-size="18" font-weight="300" fill="#5c5c6e" text-anchor="middle">ritikpatni.me</text>
  </svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}
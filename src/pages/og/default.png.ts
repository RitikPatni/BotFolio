import { Resvg } from "@resvg/resvg-js";

function svg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#030507"/><stop offset="50%" stop-color="#0d1117"/><stop offset="100%" stop-color="#030507"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="4" fill="rgba(255,255,255,0.06)"/>
    <text x="600" y="270" font-family="Georgia,serif" font-size="72" font-weight="600" fill="#f8fafb" text-anchor="middle">Ritik Patni</text>
    <text x="600" y="340" font-family="Arial,sans-serif" font-size="24" fill="#ced4da" text-anchor="middle">Frontend developer &amp; wildlife/macro photographer</text>
    <text x="600" y="400" font-family="Arial,sans-serif" font-size="18" fill="#868e96" text-anchor="middle">ritikpatni.me</text>
  </svg>`;
}

export async function GET() {
  const png = new Resvg(svg(), { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}
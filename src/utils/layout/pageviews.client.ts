/**
 * Footer lifetime pageviews: fetch the site-owned API (one GET, cached at
 * the edge) and reveal the total only when it returns a real number.
 * Any failure keeps the line hidden — no placeholder, no zero.
 */

type PageviewsResponse = { pageviews?: number };

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export async function loadPageviews(): Promise<void> {
  let data: PageviewsResponse | undefined;
  try {
    const response = await fetch("/api/pageviews", {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return;
    data = (await response.json()) as PageviewsResponse;
  } catch {
    return;
  }

  const total = data?.pageviews;
  if (typeof total !== "number" || total <= 0) return;

  document
    .querySelectorAll<HTMLElement>("[data-site-pageviews]")
    .forEach((line) => {
      const value = line.querySelector<HTMLElement>("[data-site-pageviews-count]");
      if (!value) return;
      value.textContent = formatCount(total);
      line.removeAttribute("hidden");
    });
}

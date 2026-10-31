import { getCollection } from "astro:content";
import { slugOf } from "../../utils/slug";

export async function GET() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const slugs = posts.map(slugOf);
  return new Response(JSON.stringify(slugs), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

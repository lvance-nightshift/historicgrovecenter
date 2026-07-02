import type { MetadataRoute } from "next";

/*
 * TEMPORARY: blocks all crawlers while the site shows placeholder content.
 * DELETE this file (and the `robots` block in layout.tsx) when you're ready
 * to be indexed by search engines.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}

import type { NextConfig } from "next";

/*
 * Allow next/image to optimize images served from R2.
 *
 * Set R2_PUBLIC_URL (e.g. https://images.historicgrovecenter.com or the
 * https://<hash>.r2.dev URL). The hostname is read at build time; if it's
 * unset the pattern is simply omitted (keeps the build green pre-config).
 */
function r2RemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) return [];
  try {
    const { protocol, hostname } = new URL(url);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2RemotePatterns(),
  },
  /*
   * Forgiving aliases for the printed Pumpkin Fest flyer URL — near-misses
   * still land on /pumpkin-fest. These run before the coming-soon proxy, and
   * the target is exempt, so they resolve even while the rest of the site is
   * gated. Temporary (307) so we can repoint freely if a URL ever changes.
   */
  async redirects() {
    return [
      { source: "/pumpkinfest", destination: "/pumpkin-fest", permanent: false },
      { source: "/pumpkin", destination: "/pumpkin-fest", permanent: false },
      { source: "/vendors", destination: "/pumpkin-fest", permanent: false },
    ];
  },
};

export default nextConfig;

import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";
import { stackServerApp } from "@/stack";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://historicgrovecenter.com"),
  title: {
    default: `${site.fullName} — ${site.city}`,
    template: `%s · ${site.name}`,
  },
  description:
    "Grove Center is Oak Ridge, Tennessee's original neighborhood shopping center, dating to the Manhattan Project era. Discover its merchants, events, and Secret City history.",
  keywords: [
    "Grove Center",
    "Oak Ridge",
    "Tennessee",
    "Secret City",
    "Manhattan Project",
    "shopping center",
    "merchants",
  ],
  openGraph: {
    title: `${site.fullName} — ${site.city}`,
    description: site.tagline,
    type: "website",
    locale: "en_US",
  },
  // TEMPORARY: site is live with placeholder content. This blocks search
  // engines from indexing it. REMOVE this `robots` block (and src/app/robots.ts)
  // once real content is in and you're ready to be found.
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shell = (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="texture-paper flex min-h-full flex-col">
        {/* Wrap in Stack Auth only once Neon Auth keys are configured. */}
        {stackServerApp ? (
          <StackProvider app={stackServerApp}>
            <StackTheme>{shell}</StackTheme>
          </StackProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}

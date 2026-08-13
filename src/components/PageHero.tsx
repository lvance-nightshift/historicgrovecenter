import Image from "next/image";

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  logoUrl,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  logoUrl?: string;
}) {
  return (
    <section className="border-b border-border bg-grove text-background">
      <div
        className={`mx-auto max-w-6xl px-4 sm:px-6 ${
          logoUrl ? "py-8 sm:py-10" : "py-16 sm:py-20"
        }`}
      >
        <div
          className={
            logoUrl
              ? "flex flex-col items-start gap-6 sm:flex-row sm:items-center"
              : ""
          }
        >
          {logoUrl && (
            <span className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/10 sm:h-36 sm:w-36">
              <Image src={logoUrl} alt="" fill sizes="144px" className="object-contain p-3" />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brass-light">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-background/85">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

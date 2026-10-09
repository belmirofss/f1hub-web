import { ANDROID_APP_URL, EXTERNAL_LINK, JOLPICA_URL } from "@/lib/links";

const SOURCES = [
  { label: "Jolpica F1", href: JOLPICA_URL },
  { label: "OpenF1", href: "https://openf1.org" },
  { label: "Open-Meteo", href: "https://open-meteo.com" },
  { label: "Wikipedia", href: "https://www.wikipedia.org" },
];

export const SiteFooter = () => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-x-6 gap-y-3 px-4 pt-5 pb-8 text-xs leading-5 text-muted md:px-6">
      <p>
        Data:{" "}
        {SOURCES.map((source, index) => (
          <span key={source.href}>
            {index > 0 && " · "}
            <a
              href={source.href}
              {...EXTERNAL_LINK}
              className="hover:text-text"
            >
              {source.label}
            </a>
          </span>
        ))}
        . F1HUB is independent and has no relationship with Formula 1.
      </p>
      <a
        href={ANDROID_APP_URL}
        {...EXTERNAL_LINK}
        className="underline hover:text-text"
      >
        Android app
      </a>
    </div>
  </footer>
);

import { ANDROID_APP_URL, EXTERNAL_LINK, JOLPICA_URL } from "@/lib/links";
import { Wordmark } from "./Wordmark";

const SOURCES = [
  { label: "Jolpica F1", href: JOLPICA_URL },
  { label: "OpenF1", href: "https://openf1.org" },
  { label: "Open-Meteo", href: "https://open-meteo.com" },
  { label: "Wikipedia", href: "https://www.wikipedia.org" },
];

// The back page: the heavy rule and wordmark of the header, then the
// sources
export const SiteFooter = () => (
  <footer className="border-t-2 border-text">
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-4 pb-8 text-xs leading-5 text-muted md:px-6">
      <div className="flex flex-col items-start gap-1.5">
        <Wordmark className="text-2xl leading-7 text-text" />
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
      </div>
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

# F1HUB Web: build plan

The web version of [F1HUB](https://github.com/belmirofss/f1hub) (React Native / Expo). Same features in the "Programme" look (a printed race-day programme: paper, ink, vermilion, Big Shoulders headlines), built for the browser: server-rendered for SEO, responsive from phone to desktop, and installable as a PWA. When someone opens it on a phone, the site suggests installing it.

- **Stack:** Next.js (App Router, latest stable) · TypeScript (strict) · Tailwind CSS v4
- **Hosting:** Vercel, default `*.vercel.app` domain (no custom domain)
- **Prototypes:** [F1HUB Web Prototypes canvas](https://claude.ai/artifact/EfKW2p8dNML2poPCaP6Ne1): 22 artboards (19 mobile screens and states, 3 desktop layouts) built with real 2026 data
- **Scope:** a hobby project, so there are no unit tests, no CI/CD pipelines and no Lighthouse CI. Vercel's Git integration deploys every push.

Work through the GitHub issues **in order** (`#1` → `#29`). Each issue builds on the previous ones.

---

## 1. What the app does today (feature inventory)

| Area | Features to port |
|---|---|
| **Home** | Search bar; **Lights Out hero**: a start-light pod per session that lights up as it finishes (flashing while live), `NEXT · SPRINT · ROUND 17`, the Grand Prix name, a giant countdown to the next session (h:m, or d:h over a day away; LIVE while one runs), a Fri–Sun timeline with a NOW line, the session list with per-session temperature, *My time / Track* toggle, weather summary, weekend + circuit links; the champions instead once the season is over. **Quick-info cards** (3 / 2 / 1 columns): last race (podium, pole, fastest lap, top gainer, analysis shortcuts), title fight, form, constructors, closest teammate battle, weekend forecast, circuit at a glance, season so far, up next after this |
| **Navigation** | Header with Home · Calendar · Standings · Archive, search (`/` shortcut) and settings; phones get a bottom tab bar. The **season spine** under it: a cell per round coloured by the winner's team, the next round in vermilion, the open race outlined, a popover per round and a season switcher (hidden on the calendar) |
| **Calendar** | Three views through a URL switch. **Posters**: a poster per round (dates, sprint, track outline, winner band), the next round double size with its countdown, Done / Around now / To go filter, wins-by-team tile. **Timeline**: rounds on a date axis with gaps and a TODAY line, All / Sprints / Night races, the selected round's sessions, last winners and add-to-calendar. **Month**: a Monday-first month grid with each weekend's sessions on their days at the track, race day named with the winner's code or NEXT, prev / next month, and the same round details under it. All: "Next" jump button and `done/total` meta |
| **Standings** | Drivers / Constructors / Teammates; tables with team bar, gap to leader and last-5 form; **Title fight** card (who can still win, reach bars, what each driver needs); **What-if simulator** before the finale |
| **Teammates** | Pair card (qualifying, race, points and podium head-to-heads with split bars, average qualifying gap); list of every team. Also its own screen per season and team |
| **Race weekend** | Header (round, venue, date, laps, share; pole, fastest lap and top gainer). Tabs: **Schedule** (weekend timeline, weekend forecast + per-session forecast, sessions in your time and track time, circuit info, Wikipedia link), **Race** and **Sprint** results (summary stats, +/- places, tyre stints from 2023, gaps, status, points, and a key laps sidebar from race control), **Qualifying** (Q3 / out in Q2 / out in Q1 groups with gaps), **Analysis** (interactive lap chart, tyre strategy, fastest pit stops), **Radio** (team radio player, race control timeline, filters, yellow / safety car / deleted-lap summary). Tabs are disabled until there is data |
| **Archive / Season** | Champions grid (a decade per row, cells in the champion's team colour) for drivers or constructors, detail panel, most titles, team legend, filter, and the list of every season; Season page with champion card and Drivers / Constructors / Races tabs |
| **Driver** | Hero in the team's colour, titles, season + career stats, every race of the season, last 5 races, championship-by-season bars, teammate comparison, Wikipedia bio and facts |
| **Team** | Hero, titles, current drivers, all-time stats, points per round chart, constructors' position history, teammate battle link |
| **Circuit** | Tags (street circuit, night race, direction), track map from OpenF1 (3 sectors), facts (length, laps, distance, corners, first GP, races held), fastest race lap, recent winners, most wins, link to this season's weekend |
| **Search** | Global search across drivers, teams, races, circuits and seasons; filter chips with counts; top hit; grouped results; recent searches; "monaco 2024" style year queries; aliases (COTA, Silver Arrows…) |
| **Settings** | 12/24-hour clock (the accent colour picker went with the Programme redesign, #72), store / share / data-source links, privacy note |

**Data sources:** Jolpica F1 (Ergast-compatible), OpenF1 (2023+: tyres, radio, race control, track map), Open-Meteo (forecast), Wikipedia REST (bios).

**Not ported:** AdMob banners. Google AdSense only approves sites on a domain you own, and a `*.vercel.app` subdomain can't be verified, so the web version ships without ads. If you add a custom domain later, add AdSense slots where the app has banners.

---

## 2. Architecture

```
app/
  layout.tsx                 fonts, theme script, shell, manifest, SW registration
  page.tsx                   Home
  calendar/page.tsx
  standings/page.tsx                     drivers
  standings/constructors/page.tsx
  standings/teammates/page.tsx           ?team=<constructorId>
  archive/page.tsx
  seasons/[year]/page.tsx                drivers
  seasons/[year]/constructors/page.tsx
  seasons/[year]/races/page.tsx
  seasons/[year]/teammates/page.tsx
  races/[year]/[slug]/layout.tsx         header + tabs
  races/[year]/[slug]/page.tsx           race results (or schedule before the race)
  races/[year]/[slug]/schedule/page.tsx
  races/[year]/[slug]/sprint/page.tsx
  races/[year]/[slug]/qualifying/page.tsx
  races/[year]/[slug]/analysis/page.tsx
  races/[year]/[slug]/radio/page.tsx
  drivers/[driverId]/page.tsx
  teams/[constructorId]/page.tsx
  circuits/[circuitId]/page.tsx
  search/page.tsx            noindex
  settings/page.tsx          noindex
  offline/page.tsx           service worker fallback
  api/search-index/route.ts
  api/seasons/[year]/races/route.ts    "monaco 2024" searches
  manifest.ts · sitemap.ts · robots.ts · opengraph-image.tsx (per route)
lib/
  api/        jolpica.ts · openf1.ts · openMeteo.ts · wikipedia.ts · fetcher.ts (throttle, retry, revalidate)
  domain/     sessions · championship · results · headToHead · teams · circuits · countries · weather · search · time · routes
  data/       champions.ts · constructorChampions.ts   (copied from the app)
components/   ui/ (Card, Label, TeamBar, Segmented, Tabs, StatGrid, StatRows, SplitBar, FormChips…) + feature components
public/       sw.js · icons/
```

### Rendering and data

- **Server Components fetch everything** and render HTML, which is what search engines index. Client components are only for interaction: countdown, time-zone toggle, lap chart selection, what-if, radio player, filters, search, settings, install prompt.
- **One fetch wrapper** (`lib/api/fetcher.ts`) built on `fetch(url, { next: { revalidate, tags } })`, with a small per-instance queue (Jolpica allows about 4 req/s and 500 req/h; OpenF1 3 req/s) and retry on `429` honouring `Retry-After`. `getAllPages()` is ported from `src/api.ts`.
- **Cache tiers** (Vercel Data Cache is shared across instances and deployments):

  | Data | `revalidate` |
  |---|---|
  | Current season schedule, results, standings | 10 min |
  | Past seasons (results, standings, laps, pit stops) | 30 days |
  | Full driver / constructor / circuit lists | 1 day |
  | OpenF1 data for finished sessions | 30 days |
  | Open-Meteo forecast | 30 min |
  | Wikipedia summaries | 1 day |

- **ISR pages:** `generateStaticParams` returns only the current season's races and grid, and everything else renders on first request (`dynamicParams = true`). This keeps builds fast and avoids burning the Jolpica hourly quota at build time.
- **Race URLs use slugs:** `/races/2026/singapore-grand-prix`, resolved through the season schedule. If a season has two races with the same name, the round is appended.
- **Dates and time zones:** the server renders `<time dateTime="…UTC">` and a stable fallback. A `<LocalTime>` client component formats it in the viewer's time zone after hydration, so there are no hydration mismatches. Track time uses the circuit time-zone map. `moment-timezone` is replaced by `Intl.DateTimeFormat`, with no date library.
- **Settings** (the clock) and **recent searches** live in `localStorage`.
- **Search** loads a compact index from `/api/search-index` (revalidated daily) the first time the search page opens. The ranking logic is the same `helpers/search.ts` as the app. On desktop, `/` focuses search.

### Responsive layout

- **Every width:** a header (wordmark, search, settings) and the **season spine** under it: one cell per round of the season, coloured by the winning team, the next round in vermilion, with a popover on hover or keyboard focus. Race and season pages show their own year and the calendar page hides it. Next session details live in the next round's popover.
- **< 768px:** the app layout, with a bottom tab bar (Home, Calendar, Standings, Archive), the spine as a sideways strip centred on the current round, back buttons in headers and full-width cards.
- **≥ 768px:** the four sections move into the header, and the spine gets a season switcher.
- **≥ 1024px:** an inline search field, a 1240px max-width container, a two-column grid (main + aside) and wide tables with extra columns (grid, laps, team, wins). See the desktop artboards.
- Tables that can overflow go in an `overflow-x: auto` box. Touch targets are at least 44px.

---

## 3. SEO

- `generateMetadata` on every route: a unique title and description (for example *"Singapore Grand Prix 2026: schedule, results and analysis | F1HUB"*), canonical URL and Open Graph / Twitter tags.
- `metadataBase` comes from `VERCEL_PROJECT_PRODUCTION_URL` (the `*.vercel.app` address), with no hard-coded domain.
- Dynamic OG images (`next/og`) for home, race, driver, team, circuit and standings, in the Programme style. Satori needs static TTFs, so Big Shoulders, Instrument Sans and JetBrains Mono are bundled in `assets/fonts` with their OFL licences.
- `sitemap.ts` split with `generateSitemaps` (seasons, races, drivers, teams, circuits). `robots.ts` disallows `/search`, `/settings` and `/api`, and returns `noindex` on preview deployments (`VERCEL_ENV !== "production"`).
- JSON-LD: `WebSite` + `SearchAction`, `SportsEvent` (race, with start time and circuit location), `Person` (driver), `SportsTeam` (team), `Place` (circuit) and `BreadcrumbList`.
- Semantic HTML: one `h1` per page, real `<table>`s for standings and results, and `<time>` elements.
- Google Search Console: verify the URL-prefix property with a meta tag (`NEXT_PUBLIC_GSC_VERIFICATION`) and submit the sitemap.

---

## 4. PWA

- `app/manifest.ts`: name, short name, `display: standalone`, `theme_color`/`background_color` the paper `#F1ECE2`, start URL `/`, 192/512 icons and a maskable icon (generated from `brand/icon.png` / `adaptive-icon.png`: the wordmark on paper), app shortcuts (Calendar, Standings), and screenshots for the richer Android install UI.
- `apple-touch-icon` and `appleWebApp` metadata for iOS.
- A hand-written `public/sw.js` (no build plugin), registered from a client component in production only:
  - precaches the offline page and app-shell assets;
  - navigations: network first, then the cached page, then `/offline`;
  - `/_next/static`, fonts and images: stale-while-revalidate;
  - radio audio and API calls are not cached.
- **Install prompt on mobile** (artboards *PWA prompt · Android* and *PWA prompt · iOS*):
  - shown only on phones (`pointer: coarse` and narrow viewport), only when the site isn't already running standalone, after the second page view, and hidden for 14 days after "Not now";
  - Android / Chromium: capture `beforeinstallprompt`, show the custom bottom sheet, call `prompt()` from "Install", and hide on `appinstalled`;
  - iOS Safari (and Chrome / Firefox on iOS 16.4+): no install API, so the sheet explains *Share → Add to Home Screen → Add*;
  - Settings also has an "Install F1HUB on this device" row that opens the same flow.
- Standalone polish: safe-area insets, `theme-color`, in-app back buttons (there's no browser back bar), and no overscroll glow.

---

## 5. Milestones and issues

| # | Milestone | Issues |
|---|---|---|
| M1 | Foundation | 1–7 |
| M2 | Screens | 8–20 |
| M3 | SEO | 21–23 |
| M4 | PWA | 24–27 |
| M5 | Launch | 28–29 |

1. Scaffold Next.js + TypeScript + Tailwind and deploy to Vercel
2. Design tokens, fonts and base UI primitives
3. App shell: responsive navigation and page layout
4. Settings: accent colour and clock, persisted locally
5. Data layer: typed API clients with throttling and cache tiers
6. Port domain helpers and static data; replace moment with Intl
7. Time-zone-safe rendering: LocalTime, track time and countdown
8. Home page
9. Calendar page
10. Standings: drivers, constructors, title fight and what-if
11. Teammate battles
12. Race weekend shell and Schedule tab
13. Race weekend: Race, Sprint and Qualifying results
14. Race weekend: Analysis (lap chart, tyre strategy, pit stops)
15. Race weekend: Radio and race control
16. Archive and Season pages
17. Driver page
18. Team page
19. Circuit page with OpenF1 track map
20. Global search
21. Metadata, canonical URLs and Open Graph tags
22. Dynamic Open Graph images
23. Sitemap, robots and structured data
24. Web app manifest and icons
25. Service worker and offline page
26. Mobile install prompt (Android + iOS)
27. Standalone-mode polish
28. Responsive and accessibility pass
29. Production launch

## 6. Risks and decisions

- **Jolpica rate limits** (about 500 requests per hour): this is why the cache tiers above are long, builds don't pre-render history, and the throttle and retry live server-side. A driver's career page costs 3–10 requests the first time and nothing after that.
- **OpenF1** only covers 2023 onwards, so the Analysis "Tyres", Radio and track map sections are hidden for older races, just like in the app.
- **Hydration and time zones:** never format a user-facing time on the server.
- **Ads:** left out because AdSense can't verify a `*.vercel.app` domain.
- **Colour contrast:** the "subtle" colour fails WCAG AA on the paper, so use it only for decoration. The vermilion fill `#D83A1E` takes white text (4.6:1) but is under 4.5:1 as text on paper, so text uses `accent-ink` `#B32E17`. Team colours used as text are darkened until they pass 4.5:1, and driver and team names are never set in team colour.

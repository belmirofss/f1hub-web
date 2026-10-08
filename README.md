# F1HUB Web

The web version of [F1HUB](https://github.com/belmirofss/f1hub): Formula 1 calendar, live-season standings, race weekends, analysis and the full archive, in the browser and installable as an app.

- Next.js (App Router) · TypeScript · Tailwind CSS
- Hosted on Vercel: https://webf1hub.vercel.app
- Data: [Jolpica F1](https://github.com/jolpica/jolpica-f1), [OpenF1](https://openf1.org), [Open-Meteo](https://open-meteo.com), [Wikipedia](https://en.wikipedia.org/api/rest_v1/)

The build plan is in [docs/PLAN.md](docs/PLAN.md), and the work is tracked as numbered GitHub issues, meant to be done in order.

F1HUB is independent and has no relationship with Formula 1.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run build` makes a production build, `npm run lint` runs ESLint and `npm run format` runs Prettier.

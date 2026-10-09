import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";

const BACKGROUND = "#0B0B0D";

// Shortcuts show in the installed app's long-press / right-click menu
const shortcutIcons = [
  { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
];

// The install manifest. Icons are generated from brand/: the regular ones from
// icon.png, the maskable one from adaptive-icon.png, whose wordmark sits inside
// the safe zone that Android's circle and squircle masks keep.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "en",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BACKGROUND,
    theme_color: BACKGROUND,
    categories: ["sports"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Calendar",
        description: "Every race weekend this season",
        url: "/calendar",
        icons: shortcutIcons,
      },
      {
        name: "Standings",
        description: "Drivers' championship",
        url: "/standings",
        icons: shortcutIcons,
      },
      {
        name: "Next race",
        description: "Schedule, weather and countdown",
        url: "/next-race",
        icons: shortcutIcons,
      },
    ],
    // Android's richer install sheet: one for phones, one for desktop
    screenshots: [
      {
        src: "/screenshots/narrow.png",
        sizes: "1080x2340",
        type: "image/png",
        form_factor: "narrow",
        label: "Home: next race, countdown and championship",
      },
      {
        src: "/screenshots/wide.png",
        sizes: "2560x1600",
        type: "image/png",
        form_factor: "wide",
        label: "Home on desktop",
      },
    ],
  };
}

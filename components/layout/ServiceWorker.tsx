"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Registers public/sw.js in production. The URL carries the deployment's
// version, so a new deployment installs a new worker, which then waits. It
// takes over on the next navigation (this page load, or the next route
// change) without reloading the page, so it can't loop.
export const ServiceWorker = () => {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const { serviceWorker } = navigator;

    if (process.env.NODE_ENV !== "production") {
      // A worker left by `next start` on the same port would serve stale
      // pages to `next dev`
      serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        );
      return;
    }

    serviceWorker
      .register(`/sw.js?v=${process.env.SW_VERSION}`, {
        scope: "/",
        updateViaCache: "none",
      })
      .catch((error) => console.error("Service worker", error));
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const { serviceWorker } = navigator;
    serviceWorker.ready.then(async (registration) => {
      const { waiting } = registration;
      if (waiting) {
        await new Promise((resolve) => {
          serviceWorker.addEventListener("controllerchange", resolve, {
            once: true,
          });
          waiting.postMessage("activate");
        });
      }
      // Client-side navigations fetch RSC data, not the page's HTML, so the
      // worker fetches the HTML itself to keep this page for offline use
      registration.active?.postMessage({ type: "save", url: location.href });
    });
  }, [pathname, search]);

  return null;
};

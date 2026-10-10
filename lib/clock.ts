// What the app takes as "now". In development, NEXT_PUBLIC_FAKE_NOW (an ISO
// date such as "2026-10-04T08:00Z") stops the clock at that moment on the
// server and in the browser, so the race weekend states can be checked on
// any day. Production always runs on the real clock.
const fake =
  process.env.NODE_ENV === "development"
    ? Date.parse(process.env.NEXT_PUBLIC_FAKE_NOW ?? "")
    : NaN;

export const clockNow = () => (Number.isNaN(fake) ? Date.now() : fake);

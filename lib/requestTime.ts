import "server-only";
import { io } from "next/cache";

// The current time on the server, read per request rather than baked into
// the prerendered page. For picking the next race or session; times shown to
// the visitor are still formatted in the browser.
export const getRequestTime = async () => {
  await io();
  return Date.now();
};

import { Suspense } from "react";
import { ActiveNavItems, NavItems } from "./MainNav";

// Fixed bottom tab bar below 768px, like the app. The body reserves its
// height (see layout.tsx) so the footer never ends up underneath it.
export const TabBar = () => (
  <nav
    aria-label="Main"
    className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-background pr-[max(4px,env(safe-area-inset-right))] pb-[max(12px,env(safe-area-inset-bottom))] pl-[max(4px,env(safe-area-inset-left))] md:hidden"
  >
    <Suspense fallback={<NavItems variant="bottom" />}>
      <ActiveNavItems variant="bottom" />
    </Suspense>
  </nav>
);

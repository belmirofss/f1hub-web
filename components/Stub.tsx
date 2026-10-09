// Placeholder content for the route stubs from #3. Each page replaces it when
// it's built, and this file goes once nothing imports it.
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";

export const Stub = ({
  issue,
  children,
  links,
}: {
  // The GitHub issue that builds this page
  issue: number;
  children: ReactNode;
  // Ways into deeper pages so every stub can be reached
  links?: { href: string; label: string }[];
}) => (
  <Card>
    <Label>Coming in #{issue}</Label>
    <p className="text-soft">{children}</p>
    {!!links?.length && (
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.href} className="border-t border-line-soft">
            <Link
              href={link.href}
              className="flex min-h-11 items-center justify-between gap-3 font-semibold hover:text-accent"
            >
              {link.label}
              <ChevronRight
                aria-hidden
                size={16}
                className="shrink-0 text-muted"
              />
            </Link>
          </li>
        ))}
      </ul>
    )}
  </Card>
);

import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { shortYear } from "@/lib/domain/drivers";

// "2008 World Champion" or "7× World Champion   '08 '14 '15 '17 '18 '19 '20"
export const TitlesCard = ({
  titles,
  champion = "World Champion",
}: {
  titles: string[];
  champion?: string;
}) => {
  if (!titles.length) return null;

  return (
    <Card className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5 rounded-[10px] px-3 py-2.5">
      <Trophy
        aria-hidden
        size={18}
        strokeWidth={2}
        className="shrink-0 text-accent"
      />
      <p className="text-sm font-bold whitespace-nowrap">
        {titles.length === 1
          ? `${titles[0]} ${champion}`
          : `${titles.length}× ${champion}`}
      </p>
      {titles.length > 1 && (
        // Wraps under the title when the years don't fit beside it
        <p className="ml-auto font-mono text-[11px] text-muted">
          <span className="sr-only">{titles.join(", ")}</span>
          <span aria-hidden>{titles.map(shortYear).join(" ")}</span>
        </p>
      )}
    </Card>
  );
};

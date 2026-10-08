import { PageHeader } from "@/components/layout/PageHeader";
import { Segmented } from "@/components/ui/Segmented";

type View = "drivers" | "constructors" | "races" | "teammates";

export const SeasonHeader = ({
  year,
  value,
}: {
  year: string;
  value: View;
}) => {
  const base = `/seasons/${year}`;

  return (
    <PageHeader back="/archive" meta="ARCHIVE" title={`${year} season`}>
      <Segmented<View>
        label="Season view"
        value={value}
        className="lg:max-w-xl"
        options={[
          { value: "drivers", label: "Drivers", href: base },
          {
            value: "constructors",
            label: "Constructors",
            href: `${base}/constructors`,
          },
          { value: "races", label: "Races", href: `${base}/races` },
          { value: "teammates", label: "Teammates", href: `${base}/teammates` },
        ]}
      />
    </PageHeader>
  );
};

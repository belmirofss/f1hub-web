import { PageHeader } from "@/components/layout/PageHeader";
import { Segmented } from "@/components/ui/Segmented";

type View = "drivers" | "constructors" | "teammates";

export const StandingsHeader = ({ value }: { value: View }) => (
  <PageHeader title="Standings">
    <Segmented<View>
      label="Standings view"
      value={value}
      className="lg:max-w-md"
      options={[
        { value: "drivers", label: "Drivers", href: "/standings" },
        {
          value: "constructors",
          label: "Constructors",
          href: "/standings/constructors",
        },
        {
          value: "teammates",
          label: "Teammates",
          href: "/standings/teammates",
        },
      ]}
    />
  </PageHeader>
);

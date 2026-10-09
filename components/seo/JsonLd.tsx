import type { JsonLdData } from "@/lib/structuredData";

// Structured data for search engines. "<" is escaped so text from the API
// can't close the script tag.
export const JsonLd = ({ data }: { data: JsonLdData | JsonLdData[] }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\u003c"),
    }}
  />
);

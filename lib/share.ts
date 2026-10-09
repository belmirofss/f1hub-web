export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

// The system share sheet where there is one (phones, Safari, Edge),
// otherwise `copy` goes to the clipboard. The caller shows the toast.
export const share = async ({
  title,
  text,
  url,
  copy,
}: {
  title: string;
  text: string;
  url: string;
  // What lands on the clipboard without a share sheet
  copy: string;
}): Promise<ShareResult> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      // Closing the share sheet isn't a failure
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(copy);
    return "copied";
  } catch {
    return "failed";
  }
};

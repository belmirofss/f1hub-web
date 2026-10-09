export const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=com.yabcompany.f1hub";

export const JOLPICA_URL = "https://github.com/jolpica/jolpica-f1";

// Other sites open in the browser. Inside the installed app a plain link
// would replace F1HUB in its own window, with no way back.
export const EXTERNAL_LINK = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

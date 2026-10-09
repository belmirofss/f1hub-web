// WCAG colour maths for #RRGGBB colours

const channels = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  return [16, 8, 0].map((shift) => (value >> shift) & 255);
};

const toHex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

// Relative luminance, from 0 (black) to 1 (white)
export const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

// Ink or white, whichever reads better on top of the colour: ink on light
// team colours like Mercedes teal, white on dark ones like Red Bull blue
export const textOn = (hex: string) =>
  contrastRatio(hex, "#1a1814") >= contrastRatio(hex, "#ffffff")
    ? "#1a1814"
    : "#ffffff";

// The colour mixed with just enough black (on a light background) or white
// (on a dark one) to be read as text on it (4.5:1, WCAG AA). Colours that
// already pass come back unchanged.
export const readableOn = (hex: string, background: string) => {
  const rgb = channels(hex);
  const target = luminance(background) > 0.18 ? 0 : 255;
  for (let amount = 0; amount < 1; amount += 0.05) {
    const mixed = toHex(rgb.map((c) => c + (target - c) * amount));
    if (contrastRatio(mixed, background) >= 4.5) return mixed;
  }
  return target ? "#ffffff" : "#000000";
};

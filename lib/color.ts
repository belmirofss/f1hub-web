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

// The colour mixed with just enough white to be read as text on the
// background (4.5:1, WCAG AA). Light colours come back unchanged.
export const readableOn = (hex: string, background: string) => {
  const rgb = channels(hex);
  for (let white = 0; white < 1; white += 0.05) {
    const mixed = toHex(rgb.map((c) => c + (255 - c) * white));
    if (contrastRatio(mixed, background) >= 4.5) return mixed;
  }
  return "#ffffff";
};

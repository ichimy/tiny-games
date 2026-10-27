const GLYPHS = ["●", "★", "♥", "✦", "◆", "☁"];
const COLORS = ["#ff5e7e", "#ffb703", "#58c7a4", "#4d96ff", "#c77dff"];
const pick = (values, random) => values[Math.floor(random() * values.length)];

export const pickShapeGlyphs = (count, random = Math.random) =>
  Array.from({ length: count }, () => pick(GLYPHS, random));

export function createSpark({ x, y }, random = Math.random) {
  return {
    x,
    y,
    size: 36 + Math.floor(random() * 61),
    rotation: Math.floor(random() * 360),
    color: pick(COLORS, random),
    glyph: pick(GLYPHS, random),
    driftX: -40 + Math.floor(random() * 81),
    driftY: -80 - Math.floor(random() * 61),
  };
}

export const COLORS = {
  bg: '#FFF9F0',
  card: '#FFFFFF',
  ink: '#2B2B2B',
  inkSoft: '#6B6B6B',
  freeDraw: '#FCE9E2',
  freeDrawInk: '#8A3B1E',
  coloring: '#E9E7FB',
  coloringInk: '#3B3499',
  border: '#EFE6D8',
};

// Crayon box – big, saturated, easy for a toddler to tell apart.
export const CRAYONS: string[] = [
  '#000000',
  '#FFFFFF',
  '#E53935', // red
  '#FB8C00', // orange
  '#FDD835', // yellow
  '#43A047', // green
  '#1E88E5', // blue
  '#8E24AA', // purple
  '#EC407A', // pink
  '#6D4C41', // brown
  '#00ACC1', // teal
  '#C0CA33', // lime
];

// 10 brush levels, thin → thick (in points). Index 4 (level 5) is the default.
export const BRUSH_SIZES = [3, 6, 10, 15, 21, 28, 36, 45, 54, 64] as const;
export const DEFAULT_BRUSH_INDEX = 4;

export const FONT = {
  // System font; keep it simple and legible.
  title: undefined as string | undefined,
};

// Paper colours for the free-draw canvas – soft pastels plus a few dark ones
// that make glow / sparkle strokes pop.
export const BACKGROUNDS: string[] = [
  '#FFFFFF',
  '#FFF8E1', // cream
  '#FFE0B2', // peach
  '#FCE4EC', // pink
  '#F3E5F5', // lavender
  '#E3F2FD', // light blue
  '#E8F5E9', // mint
  '#FFF59D', // lemon
  '#B3E5FC', // sky
  '#C8E6C9', // green
  '#263238', // slate
  '#1A237E', // navy
  '#000000',
];
export const DEFAULT_BACKGROUND = '#FFFFFF';

// Stroke opacity steps, solid → see-through.
export const OPACITY_LEVELS = [1, 0.7, 0.45, 0.2] as const;

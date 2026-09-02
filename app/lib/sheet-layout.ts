import type { AspectRatio } from "./generate-image";
import type { SheetLayout } from "./tamer-types";

export interface SheetLayoutSpec {
  cols: number;
  rows: number;
  frames: number;
  aspectRatio: AspectRatio;
  promptDescription: string;
}

export const SHEET_LAYOUTS: Record<SheetLayout, SheetLayoutSpec> = {
  "row-8": {
    cols: 8,
    rows: 1,
    frames: 8,
    aspectRatio: "21:9",
    promptDescription:
      "Arrange exactly 8 animation frames in a SINGLE horizontal row, equally spaced, left to right, in sequential order from frame 1 to frame 8.",
  },
  "grid-3x2": {
    cols: 3,
    rows: 2,
    frames: 6,
    aspectRatio: "1:1",
    promptDescription:
      "Arrange exactly 6 animation frames in a 3-column by 2-row grid. Top row is frames 1, 2, 3 left to right. Bottom row is frames 4, 5, 6 left to right.",
  },
  single: {
    cols: 1,
    rows: 1,
    frames: 1,
    aspectRatio: "1:1",
    promptDescription:
      "Generate a SINGLE still image (not a sprite sheet). One character portrait only, centered.",
  },
};

export function getSheetLayoutSpec(layout: SheetLayout): SheetLayoutSpec {
  return SHEET_LAYOUTS[layout];
}

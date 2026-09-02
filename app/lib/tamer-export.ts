import type { TamerCharacterKey, TamerSpriteType } from "./tamer-types";
import { getTamerAnimationRule } from "./tamer-rules";

function padFrameIndex(index: number): string {
  return String(index).padStart(2, "0");
}

function basename(characterKey: TamerCharacterKey, spriteType: TamerSpriteType): string {
  return `${characterKey}_${spriteType.replace(/-/g, "_")}`;
}

/** Individual frame filename. Portraits omit the numeric suffix. */
export function getTamerFrameFilename(
  characterKey: TamerCharacterKey,
  spriteType: TamerSpriteType,
  frameIndex: number
): string {
  const rule = getTamerAnimationRule(spriteType);
  const base = basename(characterKey, spriteType);
  if (rule.layout === "single" || rule.frames === 1) {
    return `${base}.png`;
  }
  return `${base}_${padFrameIndex(frameIndex)}.png`;
}

export function getTamerSheetFilename(
  characterKey: TamerCharacterKey,
  spriteType: TamerSpriteType
): string {
  return `${basename(characterKey, spriteType)}_sheet.png`;
}

export function getTamerZipFilename(
  characterKey: TamerCharacterKey,
  spriteType: TamerSpriteType
): string {
  return `${basename(characterKey, spriteType)}_frames.zip`;
}

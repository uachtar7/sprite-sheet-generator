export type TamerCharacterKey = "ayesha";

export type TamerDirection =
  | "south"
  | "southeast"
  | "east"
  | "northeast"
  | "north"
  | "northwest"
  | "west"
  | "southwest"
  | "back";

export type TamerEmotion =
  | "neutral"
  | "happy"
  | "shocked"
  | "angry"
  | "sad"
  | "determined";

export type TamerAnimationCategory =
  | "idle"
  | "walk"
  | "run"
  | "battle"
  | "dialogue"
  | "portrait";

export type SheetLayout = "row-8" | "grid-3x2" | "single";

export type TamerBodyType = "full-body" | "bust";

export const TAMER_CHARACTER_KEYS = ["ayesha"] as const;

export const TAMER_SPRITE_TYPES = [
  "idle-south",
  "idle-north",
  "idle-east",
  "idle-west",
  "walk-south",
  "walk-southeast",
  "walk-east",
  "walk-northeast",
  "walk-north",
  "walk-northwest",
  "walk-west",
  "walk-southwest",
  "run-south",
  "run-north",
  "run-east",
  "run-west",
  "battle-back",
  "dialogue-neutral",
  "dialogue-happy",
  "dialogue-shocked",
  "dialogue-angry",
  "dialogue-sad",
  "dialogue-determined",
  "portrait-neutral",
  "portrait-happy",
  "portrait-shocked",
  "portrait-angry",
  "portrait-sad",
  "portrait-determined",
] as const;

export type TamerSpriteType = (typeof TAMER_SPRITE_TYPES)[number];

export const TAMER_EMOTIONS: TamerEmotion[] = [
  "neutral",
  "happy",
  "shocked",
  "angry",
  "sad",
  "determined",
];

export const TAMER_CATEGORIES: TamerAnimationCategory[] = [
  "idle",
  "walk",
  "run",
  "battle",
  "dialogue",
  "portrait",
];

export interface TamerAnimationRule {
  frames: number;
  layout: SheetLayout;
  bodyType: TamerBodyType;
  direction?: TamerDirection;
  emotion?: TamerEmotion;
  category: TamerAnimationCategory;
  isLoop: boolean;
  defaultFps: number;
  notes: string[];
  label: string;
}

export type AppMode = "generic" | "tamer";

export interface TamerGenerateRequest {
  mode: "tamer";
  characterKey: TamerCharacterKey;
  characterImageUrl: string;
  type: TamerSpriteType;
  referenceImageUrls?: string[];
  additionalNotes?: string;
  imageModel?: string;
  gptImageQuality?: string;
}

export interface TamerGenerateResponse {
  imageUrl: string;
  width: number;
  height: number;
  type: TamerSpriteType;
  characterKey: TamerCharacterKey;
  frameCount: number;
  layout: SheetLayout;
  direction?: TamerDirection;
  bodyType: TamerBodyType;
}

export function isTamerCharacterKey(value: unknown): value is TamerCharacterKey {
  return TAMER_CHARACTER_KEYS.includes(value as TamerCharacterKey);
}

export function isTamerSpriteType(value: unknown): value is TamerSpriteType {
  return (TAMER_SPRITE_TYPES as readonly string[]).includes(value as string);
}

import { SHEET_LAYOUTS } from "./sheet-layout";
import type {
  TamerAnimationCategory,
  TamerAnimationRule,
  TamerDirection,
  TamerEmotion,
  TamerSpriteType,
} from "./tamer-types";
import { TAMER_SPRITE_TYPES } from "./tamer-types";

const IDLE_NOTES = [
  "subtle breathing / body bob",
  "restrained movement",
  "hair moves slightly",
  "jumper moves slightly",
  "optional natural blink in one later frame",
  "do not dramatically shift pose",
  "preserve silhouette",
  "preserve height",
  "preserve scale",
  "preserve ground line",
  "six-beat cycle: rest, inhale, peak, settle, exhale, near-rest",
  "frame 6 must transition naturally back to frame 1",
  "do NOT simply duplicate frame 1 as frame 6",
];

const WALK_NOTES = [
  "full walk cycle",
  "alternating strides",
  "natural arm swing",
  "restrained body bob",
  "consistent ground contact",
  "identical identity throughout",
  "side profiles must NOT make character shorter",
  "diagonal views must preserve scale",
  "frame 8 loops naturally into frame 1",
];

const RUN_NOTES = [
  "stronger stride than walking",
  "clear contact/pass/flight phases",
  "stronger but controlled arm swing",
  "hair reacts naturally",
  "jumper reacts naturally",
  "preserve exact apparent character height",
  "do NOT compress the torso",
  "do NOT shorten the legs",
  "do NOT turn east/west views into chibi proportions",
  "frame 8 transitions naturally to frame 1",
];

const BATTLE_NOTES = [
  "back view",
  "same height as overworld character",
  "battle-ready stance",
  "subtle breathing / weight shift",
  "restrained hand movement is acceptable",
  "preserve hair",
  "preserve clothing",
  "preserve silhouette",
  "no major rotation",
  "no random weapons",
  "no redesign",
  "seamless idle loop",
  "six-beat weight-shift cycle",
  "frame 6 must transition naturally back to frame 1",
  "do NOT simply duplicate frame 1 as frame 6",
];

const DIALOGUE_NOTES = [
  "facial identity must remain fixed",
  "minimal head movement",
  "subtle natural speaking motion",
  "do not change hairstyle",
  "do not change outfit",
  "no random jewellery",
  "no cross-style jewellery",
  "mouth shapes should be visibly distinct",
  "animation should loop naturally",
];

const PORTRAIT_NOTES = [
  "single still bust portrait",
  "facial identity must remain fixed",
  "do not change hairstyle",
  "do not change outfit",
  "no random jewellery",
  "no cross-style jewellery",
];

export const TAMER_DIRECTION_LABELS: Record<TamerDirection, string> = {
  south: "South",
  southeast: "South-East",
  east: "East",
  northeast: "North-East",
  north: "North",
  northwest: "North-West",
  west: "West",
  southwest: "South-West",
  back: "Back / Facing Enemy",
};

export const TAMER_EMOTION_LABELS: Record<TamerEmotion, string> = {
  neutral: "Neutral",
  happy: "Happy",
  shocked: "Shocked",
  angry: "Angry",
  sad: "Sad",
  determined: "Determined",
};

export const TAMER_CATEGORY_LABELS: Record<TamerAnimationCategory, string> = {
  idle: "Idle",
  walk: "Walk",
  run: "Run",
  battle: "Battle",
  dialogue: "Dialogue",
  portrait: "Portrait",
};

function capitalizeDirection(direction: TamerDirection): string {
  return TAMER_DIRECTION_LABELS[direction];
}

function idleRule(direction: "south" | "north" | "east" | "west"): TamerAnimationRule {
  return {
    frames: 6,
    layout: "grid-3x2",
    bodyType: "full-body",
    direction,
    category: "idle",
    isLoop: true,
    defaultFps: 6,
    notes: IDLE_NOTES,
    label: `Idle ${capitalizeDirection(direction)}`,
  };
}

function walkRule(
  direction:
    | "south"
    | "southeast"
    | "east"
    | "northeast"
    | "north"
    | "northwest"
    | "west"
    | "southwest"
): TamerAnimationRule {
  return {
    frames: 8,
    layout: "row-8",
    bodyType: "full-body",
    direction,
    category: "walk",
    isLoop: true,
    defaultFps: 10,
    notes: WALK_NOTES,
    label: `Walk ${capitalizeDirection(direction)}`,
  };
}

function runRule(direction: "south" | "north" | "east" | "west"): TamerAnimationRule {
  return {
    frames: 8,
    layout: "row-8",
    bodyType: "full-body",
    direction,
    category: "run",
    isLoop: true,
    defaultFps: 15,
    notes: RUN_NOTES,
    label: `Run ${capitalizeDirection(direction)}`,
  };
}

function dialogueRule(emotion: TamerEmotion): TamerAnimationRule {
  return {
    frames: 6,
    layout: "grid-3x2",
    bodyType: "bust",
    emotion,
    category: "dialogue",
    isLoop: true,
    defaultFps: 10,
    notes: DIALOGUE_NOTES,
    label: `Dialogue ${TAMER_EMOTION_LABELS[emotion]}`,
  };
}

function portraitRule(emotion: TamerEmotion): TamerAnimationRule {
  return {
    frames: 1,
    layout: "single",
    bodyType: "bust",
    emotion,
    category: "portrait",
    isLoop: false,
    defaultFps: 1,
    notes: PORTRAIT_NOTES,
    label: `Portrait ${TAMER_EMOTION_LABELS[emotion]}`,
  };
}

export const TAMER_ANIMATION_RULES: Record<TamerSpriteType, TamerAnimationRule> = {
  "idle-south": idleRule("south"),
  "idle-north": idleRule("north"),
  "idle-east": idleRule("east"),
  "idle-west": idleRule("west"),

  "walk-south": walkRule("south"),
  "walk-southeast": walkRule("southeast"),
  "walk-east": walkRule("east"),
  "walk-northeast": walkRule("northeast"),
  "walk-north": walkRule("north"),
  "walk-northwest": walkRule("northwest"),
  "walk-west": walkRule("west"),
  "walk-southwest": walkRule("southwest"),

  "run-south": runRule("south"),
  "run-north": runRule("north"),
  "run-east": runRule("east"),
  "run-west": runRule("west"),

  "battle-back": {
    frames: 6,
    layout: "grid-3x2",
    bodyType: "full-body",
    direction: "back",
    category: "battle",
    isLoop: true,
    defaultFps: 6,
    notes: BATTLE_NOTES,
    label: "Battle Back / Facing Enemy",
  },

  "dialogue-neutral": dialogueRule("neutral"),
  "dialogue-happy": dialogueRule("happy"),
  "dialogue-shocked": dialogueRule("shocked"),
  "dialogue-angry": dialogueRule("angry"),
  "dialogue-sad": dialogueRule("sad"),
  "dialogue-determined": dialogueRule("determined"),

  "portrait-neutral": portraitRule("neutral"),
  "portrait-happy": portraitRule("happy"),
  "portrait-shocked": portraitRule("shocked"),
  "portrait-angry": portraitRule("angry"),
  "portrait-sad": portraitRule("sad"),
  "portrait-determined": portraitRule("determined"),
};

export const TAMER_TYPES_BY_CATEGORY: Record<TamerAnimationCategory, TamerSpriteType[]> = {
  idle: ["idle-south", "idle-north", "idle-east", "idle-west"],
  walk: [
    "walk-south",
    "walk-southeast",
    "walk-east",
    "walk-northeast",
    "walk-north",
    "walk-northwest",
    "walk-west",
    "walk-southwest",
  ],
  run: ["run-south", "run-north", "run-east", "run-west"],
  battle: ["battle-back"],
  dialogue: [
    "dialogue-neutral",
    "dialogue-happy",
    "dialogue-shocked",
    "dialogue-angry",
    "dialogue-sad",
    "dialogue-determined",
  ],
  portrait: [
    "portrait-neutral",
    "portrait-happy",
    "portrait-shocked",
    "portrait-angry",
    "portrait-sad",
    "portrait-determined",
  ],
};

export function getTamerAnimationRule(type: TamerSpriteType): TamerAnimationRule {
  return TAMER_ANIMATION_RULES[type];
}

export function getTamerSpriteTypeLabel(type: TamerSpriteType): string {
  return TAMER_ANIMATION_RULES[type].label;
}

for (const type of TAMER_SPRITE_TYPES) {
  const rule = TAMER_ANIMATION_RULES[type];
  const spec = SHEET_LAYOUTS[rule.layout];
  if (spec.frames !== rule.frames) {
    throw new Error(
      `Tamer rule ${type}: frames ${rule.frames} does not match layout ${rule.layout} (${spec.frames})`
    );
  }
}

const listedTypes = new Set(Object.values(TAMER_TYPES_BY_CATEGORY).flat());
for (const type of TAMER_SPRITE_TYPES) {
  if (!listedTypes.has(type)) {
    throw new Error(`Tamer sprite type ${type} is missing from TAMER_TYPES_BY_CATEGORY`);
  }
}

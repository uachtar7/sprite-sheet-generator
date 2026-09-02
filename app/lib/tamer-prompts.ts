import type { ImageModel } from "./generate-image";
import type { TamerCharacterProfile } from "./tamer-characters";
import { getSheetLayoutSpec } from "./sheet-layout";
import type { TamerAnimationRule, TamerDirection, TamerEmotion } from "./tamer-types";

const NO_DOCUMENTATION_UI = `GENERATED IMAGE CONTENT:
The output must contain sprites ONLY on a simple plain removable background (solid light gray or white).

Do NOT bake any of the following into the image:
- titles
- frame numbers
- guide lines
- palettes
- note panels
- labels
- watermarks
- decorative borders
- presentation-card UI
- grid divider lines between frames

Leave spacing between poses as plain empty background.`;

const SCALE_LOCK = `SCALE / HEIGHT LOCK (critical):
- preserve exact apparent character height
- preserve head-to-body ratio
- preserve torso length
- preserve leg length
- preserve body proportions
- preserve sprite scale
- preserve camera distance
- preserve ground level
- do not squash the character
- do not shorten the character
- do not enlarge the head
- do not make the character chibi
- only change body position as required by the animation`;

const SIDE_VIEW_SCALE_LOCK = `SIDE VIEW HEIGHT LOCK:
Turning the character sideways must not reduce her standing height or alter her proportions.
East and west profiles must keep the same apparent height, leg length, torso length, and head-to-body ratio as the canonical master. Do not compress into chibi proportions.`;

const DIRECTION_PROMPTS: Record<TamerDirection, string> = {
  south: `DIRECTION: SOUTH.
The character's front is visible, facing toward the viewer.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  north: `DIRECTION: NORTH.
Back view. The character faces directly away from the viewer.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  east: `DIRECTION: EAST.
True clean side profile facing RIGHT.
The character's face, chest, and front foot point toward the right edge of the image.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  west: `DIRECTION: WEST.
True clean side profile facing LEFT.
The character's face, chest, and front foot point toward the left edge of the image.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  southeast: `DIRECTION: SOUTH-EAST.
3/4 front-right view. Front of the character is mostly visible, turned slightly toward the right.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  southwest: `DIRECTION: SOUTH-WEST.
3/4 front-left view. Front of the character is mostly visible, turned slightly toward the left.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  northeast: `DIRECTION: NORTH-EAST.
3/4 back-right view. Back of the character is mostly visible, turned slightly toward the right.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  northwest: `DIRECTION: NORTH-WEST.
3/4 back-left view. Back of the character is mostly visible, turned slightly toward the left.
All frames must keep this exact viewing direction. Movement must not rotate the body into another camera angle.`,
  back: `DIRECTION: BACK / FACING ENEMY.
Player tamer viewed from behind, facing the enemy monster, similar to the classic rear-player presentation of monster-battling RPGs.
The camera is behind the character. We see their back. They face away from the viewer toward the battle.
All frames must keep this exact viewing direction. No major rotation.`,
};

const EMOTION_PROMPTS: Record<TamerEmotion, string> = {
  neutral: "EMOTION: neutral. Relaxed brows, calm eyes, rest mouth.",
  happy: "EMOTION: happy. Raised cheeks, brighter eyes, a warm smile in the resting mouth shape.",
  shocked: "EMOTION: shocked. Raised brows, widened eyes, open or tense resting mouth.",
  angry: "EMOTION: angry. Lowered/knit brows, intense eyes, tighter jaw and mouth rest.",
  sad: "EMOTION: sad. Inner brows up, softer/downcast eyes, downturned resting mouth.",
  determined:
    "EMOTION: determined. Focused brows, steady eyes, firm mouth rest, slightly forward head posture.",
};

const MOUTH_CYCLE = `Neutral talking mouth cycle across the 6 frames:
1. neutral/rest
2. slight open
3. wider open
4. mid shape
5. small / rounded shape
6. near-rest

Mouth shapes must be visibly distinct. The selected emotion stays in the eyebrows, eyes, cheek tension, mouth resting shape, and head posture in EVERY frame.`;

function buildAnimationPrompt(rule: TamerAnimationRule): string {
  const notes = rule.notes.map((n) => `- ${n}`).join("\n");

  switch (rule.category) {
    case "idle":
      return `ANIMATION: OVERWORLD IDLE (${rule.frames} frames, looping).
Full-body sprite. Subtle breathing / body bob idle cycle.
Restrained movement. Hair and jumper move slightly. Optional natural blink in one later frame.
Do not dramatically shift pose. Frame 8 must transition naturally back to frame 1.
Do NOT simply duplicate frame 1 as frame 8.

Rules:
${notes}`;
    case "walk":
      return `ANIMATION: OVERWORLD WALK CYCLE (${rule.frames} frames, looping).
Full-body sprite. Full walk cycle with alternating strides, natural arm swing, restrained body bob, and consistent ground contact.
Frame 8 loops naturally into frame 1. Identical identity throughout.

Rules:
${notes}`;
    case "run":
      return `ANIMATION: OVERWORLD RUN CYCLE (${rule.frames} frames, looping).
Full-body sprite. Stronger stride than walking, with clear contact / pass / flight phases and stronger but controlled arm swing.
Hair and jumper react naturally. Frame 8 transitions naturally to frame 1.

Rules:
${notes}`;
    case "battle":
      return `ANIMATION: BATTLE IDLE (${rule.frames} frames, looping).
Full-body sprite. Player tamer viewed from behind in a battle-ready stance, facing the enemy monster.
Subtle breathing / weight shift. Restrained hand movement is acceptable.
No random weapons. No redesign. No major rotation. Seamless idle loop.

Rules:
${notes}`;
    case "dialogue":
      return `ANIMATION: DIALOGUE SPEAKING (${rule.frames} frames, looping).
BUST / chest-up portrait. Minimal head movement. Subtle natural speaking motion.
${rule.emotion ? EMOTION_PROMPTS[rule.emotion] : ""}

${MOUTH_CYCLE}

Rules:
${notes}`;
    case "portrait":
      return `ANIMATION: STATIC PORTRAIT (1 frame).
BUST / chest-up portrait. A single still image. No animation sheet.
${rule.emotion ? EMOTION_PROMPTS[rule.emotion] : ""}

Rules:
${notes}`;
  }
}

function buildLayoutPrompt(rule: TamerAnimationRule): string {
  const spec = getSheetLayoutSpec(rule.layout);
  return `SHEET LAYOUT:
${spec.promptDescription}
Expected frame count: ${rule.frames}.
Body framing: ${rule.bodyType === "bust" ? "bust / chest-up portrait, head and shoulders clearly readable" : "full body, head to feet, grounded on a consistent ground line"}.`;
}

const GPT_IMAGE_2_SIDE_APPEND = `Character orientation must stay a true side profile for every frame. Do not twist the torso toward the camera. Do not shorten the standing height when showing the side view.`;

export function getTamerModelPromptAppend(
  model: ImageModel,
  rule: TamerAnimationRule
): string | undefined {
  if (model === "gpt-image-2" && (rule.direction === "east" || rule.direction === "west")) {
    return GPT_IMAGE_2_SIDE_APPEND;
  }
  return undefined;
}

export function buildTamerPrompt(input: {
  character: TamerCharacterProfile;
  rule: TamerAnimationRule;
  additionalNotes?: string;
  model: ImageModel;
}): string {
  const { character, rule, additionalNotes, model } = input;
  const parts: string[] = [];

  parts.push(`CHARACTER IDENTITY LOCK:\n${character.identityPrompt}`);
  parts.push(`VISUAL RULES (must preserve):\n${character.visualRules.map((r) => `- ${r}`).join("\n")}`);
  parts.push(character.artStylePrompt);

  if (rule.bodyType === "full-body") {
    parts.push(SCALE_LOCK);
    if (rule.direction === "east" || rule.direction === "west") {
      parts.push(SIDE_VIEW_SCALE_LOCK);
    }
  }

  parts.push(buildAnimationPrompt(rule));

  if (rule.direction) {
    parts.push(DIRECTION_PROMPTS[rule.direction]);
  }

  parts.push(buildLayoutPrompt(rule));
  parts.push(NO_DOCUMENTATION_UI);

  const trimmedNotes = additionalNotes?.trim();
  if (trimmedNotes) {
    parts.push(`ADDITIVE ANIMATION NOTES (apply ONLY if they do not conflict with the locks above).
These notes must NEVER change character identity, outfit, direction, required frame count, sheet layout, body type, proportions, or animation type:
${trimmedNotes}`);
  }

  const modelAppend = getTamerModelPromptAppend(model, rule);
  if (modelAppend) {
    parts.push(modelAppend);
  }

  return parts.join("\n\n");
}

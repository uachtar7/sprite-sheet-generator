import { getTamerCharacter } from "./tamer-characters";
import { getTamerAnimationRule } from "./tamer-rules";
import {
  isTamerCharacterKey,
  isTamerSpriteType,
  type TamerCharacterKey,
  type TamerSpriteType,
} from "./tamer-types";
import type { TamerCharacterProfile } from "./tamer-characters";
import type { TamerAnimationRule } from "./tamer-types";

export interface ValidatedTamerRequest {
  characterKey: TamerCharacterKey;
  characterImageUrl: string;
  type: TamerSpriteType;
  referenceImageUrls: string[];
  additionalNotes?: string;
  character: TamerCharacterProfile;
  rule: TamerAnimationRule;
}

export function validateTamerRequest(body: unknown):
  | { ok: true; data: ValidatedTamerRequest }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const {
    characterKey,
    characterImageUrl,
    type,
    referenceImageUrls,
    additionalNotes,
  } = body as Record<string, unknown>;

  if (!characterImageUrl || typeof characterImageUrl !== "string" || !characterImageUrl.trim()) {
    return { ok: false, error: "Canonical character image is required for Monster Tamer mode" };
  }

  if (!isTamerCharacterKey(characterKey)) {
    return {
      ok: false,
      error: `Unknown characterKey "${String(characterKey)}". Supported: ayesha`,
    };
  }

  if (!isTamerSpriteType(type)) {
    return {
      ok: false,
      error: `Invalid animation type "${String(type)}" for Monster Tamer mode. Use a valid Tamer sprite type such as idle-south, run-west, or dialogue-neutral. Combinations like idle-southeast or run-southeast are not valid.`,
    };
  }

  if (
    referenceImageUrls !== undefined &&
    (!Array.isArray(referenceImageUrls) ||
      referenceImageUrls.some((url) => typeof url !== "string"))
  ) {
    return { ok: false, error: "referenceImageUrls must be an array of strings" };
  }

  if (additionalNotes !== undefined && typeof additionalNotes !== "string") {
    return { ok: false, error: "additionalNotes must be a string" };
  }

  const extraRefs = (referenceImageUrls as string[] | undefined)?.filter((url) => url.trim()) ?? [];

  return {
    ok: true,
    data: {
      characterKey,
      characterImageUrl: characterImageUrl.trim(),
      type,
      referenceImageUrls: extraRefs,
      additionalNotes: typeof additionalNotes === "string" ? additionalNotes : undefined,
      character: getTamerCharacter(characterKey),
      rule: getTamerAnimationRule(type),
    },
  };
}

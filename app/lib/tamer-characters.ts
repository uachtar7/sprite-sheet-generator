import type { TamerCharacterKey } from "./tamer-types";

export interface TamerCharacterProfile {
  key: TamerCharacterKey;
  displayName: string;
  identityPrompt: string;
  visualRules: string[];
  artStylePrompt: string;
  /** Optional hosted canonical master. Upload remains required until this is set. */
  savedMasterImageUrl?: string;
}

const AYESHA_IDENTITY_PROMPT = `Ayesha is the canonical character. Use the supplied reference image as the visual source of truth.

Preserve:
- exact facial identity
- medium warm-brown Sinhalese skin tone
- dark-brown eyes
- dark long wavy hair
- half-up bun
- pink/magenta hair tie
- gold earrings
- burgundy/muted mauve jumper
- black fitted leggings
- white sneakers
- no cross-style jewellery
- tall/slender proportions
- exact apparent height
- leg length
- torso length
- head-to-body ratio
- character scale
- rendering style

Do not redesign, reinterpret, beautify, exaggerate, simplify, shorten or make the character more chibi.

This is the same character in another animation frame.

ONLY change what the selected animation requires.`;

export const TAMER_CHARACTERS: Record<TamerCharacterKey, TamerCharacterProfile> = {
  ayesha: {
    key: "ayesha",
    displayName: "Ayesha",
    identityPrompt: AYESHA_IDENTITY_PROMPT,
    visualRules: [
      "female",
      "South Asian / Sinhalese appearance",
      "medium warm-brown skin tone",
      "dark-brown eyes",
      "dark-brown / near-black hair",
      "long, thick, wavy hair",
      "half-up bun",
      "pink/magenta hair tie",
      "gold earrings",
      "burgundy / muted mauve modern jumper",
      "black fitted leggings",
      "clean white sneakers",
      "no cross-style jewellery",
      "preserve the approved tall/slender character proportions",
      "preserve leg length",
      "preserve torso length",
      "preserve head-to-body ratio",
      "preserve overall apparent height",
      "preserve silhouette",
      "preserve facial identity",
      "preserve hair volume and shape",
      "preserve outfit fit",
      "preserve skin tone",
      "preserve overall sprite scale",
    ],
    artStylePrompt: `The character art style must match the approved reference:
- polished HD-2D pixel art
- detailed but readable sprite rendering
- strong clean silhouette
- controlled palette
- consistent linework
- consistent shading

Do not switch to chibi, SD, anime-redesign, painterly, or photoreal styles.`,
  },
};

export function getTamerCharacter(key: TamerCharacterKey): TamerCharacterProfile {
  return TAMER_CHARACTERS[key];
}

export const TAMER_CHARACTER_LIST: TamerCharacterProfile[] = Object.values(TAMER_CHARACTERS);

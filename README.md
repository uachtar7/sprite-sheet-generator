# Sprite Sheet Creator

Sprite sheet generator for 2D pixel art characters and maps. Built with [fal.ai](https://fal.ai).

## Demo

### Side-Scroller Sprite Sheets

| Walk Cycle | Jump Animation | Attack Animation |
|:----------:|:--------------:|:----------------:|
| ![Walk Sprite Sheet](./assets/walk-sprite-sheet.png) | ![Jump Sprite Sheet](./assets/jump-sprite-sheet.png) | ![Attack Sprite Sheet](./assets/attack-sprite-sheet.png) |

### Side-Scroller Sandbox

![Sandbox Preview](./assets/sandbox-preview.png)

### Isometric Mode

![Isometric Preview](./assets/isometric-preview.png)

## Features

### Two Production Modes

- **Generic** keeps the original side-scroller and isometric RPG workflows.
- **Monster Tamer** is a locked-character production workflow for game-ready sheets (starting with Ayesha).

### Two Generic Game Styles

- **Side-Scroller** generates walk, jump, attack, and idle sprite sheets, plus an optional 3 layer parallax background.
- **Isometric (RPG)** generates walk sheets for three directions (down, up, side), matching attack sheets for the same directions, an idle sheet, and a full top-down world map to explore.

### Generation

- **Character generation** from a text prompt or by converting an uploaded image into pixel art.
- **Sprite sheets** rendered as 2x2 grids per animation, with consistent character identity across frames.
- **Backgrounds** generated to match your character. Side-scroller mode produces a 3 layer parallax scene (sky, midground, foreground). Isometric mode produces a single large top-down map.
- **Background removal** via Bria for sprite sheets and parallax midground and foreground layers.

### Editing and Preview

- **Frame extraction** with adjustable grid dividers for each sprite sheet.
- **Animation preview** with adjustable FPS.
- **Per sprite size sliders** in the sandbox so you can correct scale without regenerating.
- **Layer position sliders** for side-scroller custom backgrounds, so you can nudge each layer vertically if alignment is slightly off.
- **Map size slider** for the isometric map, so you can rescale the world relative to the character.
- **Per layer regeneration** for the 3 parallax layers, so you can retry one without redoing the others.

### Image Models

Pick the model once at the top of the page and it applies to every generation in the flow:

- **Nano Banana Pro** (`fal-ai/nano-banana-pro` and `/edit`)
- **Nano Banana Lite** (`google/nano-banana-lite` and `/edit`)
- **GPT Image 2** (`openai/gpt-image-2` and `/edit`)

## Monster Tamer Mode

Locked-character sprite production for Monster Tamer. Generic side-scroller and isometric flows are unchanged.

1. Select **Monster Tamer**.
2. Choose a locked tamer (currently **Ayesha**).
3. Upload the canonical character master. This image is the identity source of truth.
4. Optionally add a directional reference and/or a style reference (lower priority than the master).
5. Select an animation category and a valid type/direction.
6. Add optional **additional animation notes** (additive only — they cannot change identity, outfit, direction, frame count, layout, or body type).
7. Generate the sheet. Frame count and layout come from the server-side animation rules, not from the form.
8. Remove the background.
9. Extract frames. The grid starts from the rule layout (`8×1`, `3×2`, or `1×1`) and remains adjustable if the model packed frames differently.
10. Preview at the extracted frame count with adjustable FPS.
11. Export the full sheet and/or individual PNG frames as a ZIP.

Filenames follow `{character}_{animation}_{direction}_{index}.png`, for example `ayesha_idle_south_00.png`. Portraits omit the index: `ayesha_portrait_shocked.png`.

### Canonical frame table

| Animation | Directions | Frames |
|---|---|---|
| Idle | S / N / E / W | 8 |
| Walk | 8 directions | 8 |
| Run | S / N / E / W | 8 |
| Battle Back | Back | 8 |
| Dialogue | per emotion | 6 |
| Portrait | per emotion | 1 |

Invalid combinations (for example Idle South-East or Run South-East) cannot be selected and are rejected by the API.

Adding another tamer later is a new character profile. Animation rules are shared.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your fal.ai API key:
```
FAL_KEY=your_api_key_here
```

Get your API key at https://fal.ai/dashboard/keys

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Controls

### Animation Preview (Step 5)
- `D` / `→` Walk right
- `A` / `←` Walk left
- `Space` Stop

### Side-Scroller Sandbox
- `A` / `←` Walk left
- `D` / `→` Walk right
- `W` / `↑` Jump
- `J` Attack

### Isometric Sandbox
- `W` / `↑` Up
- `S` / `↓` Down
- `A` / `←` Left
- `D` / `→` Right
- `J` Attack

## Tech Stack

- Next.js 14
- React 18
- fal.ai (Nano Banana Pro, Nano Banana Lite, GPT Image 2, Bria background removal)
- HTML Canvas

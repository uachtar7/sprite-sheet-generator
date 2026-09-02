"use client";

import {
  TAMER_CATEGORIES,
  type TamerAnimationCategory,
  type TamerSpriteType,
} from "../lib/tamer-types";
import {
  TAMER_ANIMATION_RULES,
  TAMER_CATEGORY_LABELS,
  TAMER_TYPES_BY_CATEGORY,
} from "../lib/tamer-rules";

interface TamerAnimationSelectorProps {
  value: TamerSpriteType;
  onChange: (type: TamerSpriteType) => void;
}

export default function TamerAnimationSelector({
  value,
  onChange,
}: TamerAnimationSelectorProps) {
  const category = TAMER_ANIMATION_RULES[value].category;
  const options = TAMER_TYPES_BY_CATEGORY[category];
  const rule = TAMER_ANIMATION_RULES[value];

  const selectCategory = (next: TamerAnimationCategory) => {
    if (next === category) return;
    onChange(TAMER_TYPES_BY_CATEGORY[next][0]);
  };

  return (
    <div className="input-group">
      <label>Animation category</label>
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          marginBottom: "0.75rem",
        }}
      >
        {TAMER_CATEGORIES.map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => selectCategory(key)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              border: "none",
              borderLeft: i === 0 ? "none" : "1px solid var(--border-color)",
              cursor: "pointer",
              background: category === key ? "var(--fal-purple-deep)" : "var(--bg-secondary)",
              color: category === key ? "#fff" : "var(--text-secondary)",
            }}
          >
            {TAMER_CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      <label>Animation / direction</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {options.map((type) => (
          <button
            key={type}
            type="button"
            className={`btn ${value === type ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onChange(type)}
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
          >
            {TAMER_ANIMATION_RULES[type].label.replace(
              /^(Idle|Walk|Run|Dialogue|Portrait|Battle)\s/,
              ""
            )}
          </button>
        ))}
      </div>

      <p className="description-text" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
        {rule.frames} frame{rule.frames === 1 ? "" : "s"} · {rule.layout} · {rule.bodyType}
        {rule.direction ? ` · ${rule.direction}` : ""}
        {rule.emotion ? ` · ${rule.emotion}` : ""}
      </p>
    </div>
  );
}

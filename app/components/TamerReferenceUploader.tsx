"use client";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

interface UploadSlotProps {
  id: string;
  title: string;
  hint: string;
  required?: boolean;
  value: string | null;
  onChange: (url: string | null) => void;
}

function UploadSlot({ id, title, hint, required, value, onChange }: UploadSlotProps) {
  return (
    <div className="input-group" style={{ marginBottom: 0 }}>
      <label htmlFor={id}>
        {title}
        {required ? (
          <span style={{ color: "var(--fal-red)", marginLeft: "0.35rem" }}>Required</span>
        ) : (
          <span style={{ color: "var(--text-tertiary)", marginLeft: "0.35rem", fontWeight: 400 }}>
            Optional
          </span>
        )}
      </label>
      <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.5rem" }}>
        {hint}
      </p>
      {!value ? (
        <label
          htmlFor={id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            border: "2px dashed var(--border-color)",
            borderRadius: "8px",
            cursor: "pointer",
            background: "var(--bg-secondary)",
            minHeight: "140px",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Click to upload
          </span>
          <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
            PNG, JPG, WEBP
          </span>
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChange(await readFileAsDataUrl(file));
              }
            }}
            style={{ display: "none" }}
          />
        </label>
      ) : (
        <div
          style={{
            position: "relative",
            display: "inline-block",
            padding: "0.75rem",
            border: "2px solid var(--border-color)",
            borderRadius: "8px",
            background: "var(--bg-secondary)",
          }}
        >
          <img
            src={value}
            alt={title}
            style={{ maxWidth: "180px", maxHeight: "180px", borderRadius: "4px", display: "block" }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove image"
            style={{
              position: "absolute",
              top: "0.4rem",
              right: "0.4rem",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "none",
              background: "var(--bg-primary)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

interface TamerReferenceUploaderProps {
  masterImageUrl: string | null;
  directionalRefUrl: string | null;
  styleRefUrl: string | null;
  onMasterChange: (url: string | null) => void;
  onDirectionalChange: (url: string | null) => void;
  onStyleChange: (url: string | null) => void;
}

export default function TamerReferenceUploader({
  masterImageUrl,
  directionalRefUrl,
  styleRefUrl,
  onMasterChange,
  onDirectionalChange,
  onStyleChange,
}: TamerReferenceUploaderProps) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", marginBottom: "0.5rem" }}>Reference images</label>
      <p className="description-text">
        Priority: <strong>1. Canonical master</strong> (identity) → 2. Directional reference → 3. Style
        reference. The master always overrides conflicting text.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <UploadSlot
          id="tamer-master"
          title="1. Canonical Character Master"
          hint="Approved character design. Source of truth for identity, outfit, proportions, and scale."
          required
          value={masterImageUrl}
          onChange={onMasterChange}
        />
        <UploadSlot
          id="tamer-directional"
          title="2. Directional Reference"
          hint="Optional pose or facing reference for this animation. Identity still comes from the master."
          value={directionalRefUrl}
          onChange={onDirectionalChange}
        />
        <UploadSlot
          id="tamer-style"
          title="3. Animation / Style Reference"
          hint="Optional style or motion reference. Lowest priority."
          value={styleRefUrl}
          onChange={onStyleChange}
        />
      </div>
    </div>
  );
}

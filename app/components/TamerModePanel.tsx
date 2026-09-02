"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GptImageQuality, ImageModel } from "../lib/generate-image";
import { getSheetLayoutSpec } from "../lib/sheet-layout";
import { TAMER_CHARACTER_LIST } from "../lib/tamer-characters";
import {
  getTamerFrameFilename,
  getTamerSheetFilename,
  getTamerZipFilename,
} from "../lib/tamer-export";
import { getTamerAnimationRule } from "../lib/tamer-rules";
import type {
  TamerCharacterKey,
  TamerGenerateResponse,
  TamerSpriteType,
} from "../lib/tamer-types";
import { downloadFramesZip, downloadUrlAsFile, triggerBlobDownload } from "../lib/zip-download";
import TamerAnimationSelector from "./TamerAnimationSelector";
import TamerReferenceUploader from "./TamerReferenceUploader";

type TamerStep = 1 | 2 | 3 | 4 | 5;

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Frame {
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contentBounds: BoundingBox;
}

interface TamerModePanelProps {
  imageModel: ImageModel;
  gptImageQuality: GptImageQuality;
}

function getContentBounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): BoundingBox {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return { x: 0, y: 0, width, height };
  }

  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function extractFramesFromSheet(
  imageUrl: string,
  verticalDividers: number[],
  horizontalDividers: number[]
): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const frames: Frame[] = [];
      const colPositions = [0, ...verticalDividers, 100];
      const rowPositions = [0, ...horizontalDividers, 100];

      for (let row = 0; row < rowPositions.length - 1; row++) {
        const startY = Math.round((rowPositions[row] / 100) * img.height);
        const endY = Math.round((rowPositions[row + 1] / 100) * img.height);
        const frameHeight = endY - startY;

        for (let col = 0; col < colPositions.length - 1; col++) {
          const startX = Math.round((colPositions[col] / 100) * img.width);
          const endX = Math.round((colPositions[col + 1] / 100) * img.width);
          const frameWidth = endX - startX;
          const canvas = document.createElement("canvas");
          canvas.width = frameWidth;
          canvas.height = frameHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              img,
              startX,
              startY,
              frameWidth,
              frameHeight,
              0,
              0,
              frameWidth,
              frameHeight
            );
            frames.push({
              dataUrl: canvas.toDataURL("image/png"),
              x: startX,
              y: startY,
              width: frameWidth,
              height: frameHeight,
              contentBounds: getContentBounds(ctx, frameWidth, frameHeight),
            });
          }
        }
      }
      resolve(frames);
    };
    img.onerror = () => reject(new Error("Failed to load sprite sheet for extraction"));
    img.src = imageUrl;
  });
}

export default function TamerModePanel({ imageModel, gptImageQuality }: TamerModePanelProps) {
  const [currentStep, setCurrentStep] = useState<TamerStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [characterKey, setCharacterKey] = useState<TamerCharacterKey>("ayesha");
  const [spriteType, setSpriteType] = useState<TamerSpriteType>("idle-south");
  const [masterImageUrl, setMasterImageUrl] = useState<string | null>(null);
  const [directionalRefUrl, setDirectionalRefUrl] = useState<string | null>(null);
  const [styleRefUrl, setStyleRefUrl] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [generated, setGenerated] = useState<TamerGenerateResponse | null>(null);
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rule = getTamerAnimationRule(spriteType);
  const layoutSpec = getSheetLayoutSpec(rule.layout);

  const [gridCols, setGridCols] = useState(layoutSpec.cols);
  const [gridRows, setGridRows] = useState(layoutSpec.rows);
  const [verticalDividers, setVerticalDividers] = useState<number[]>([]);
  const [horizontalDividers, setHorizontalDividers] = useState<number[]>([]);
  const [extractedFrames, setExtractedFrames] = useState<Frame[]>([]);
  const [sheetDimensions, setSheetDimensions] = useState({ width: 0, height: 0 });
  const sheetRef = useRef<HTMLImageElement>(null);

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(rule.defaultFps);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetDownstream = useCallback(() => {
    setGenerated(null);
    setBgRemovedUrl(null);
    setExtractedFrames([]);
    setSheetDimensions({ width: 0, height: 0 });
    setCurrentFrameIndex(0);
    setIsPlaying(false);
    setCompletedSteps(new Set());
    setCurrentStep(1);
  }, []);

  const applySpriteType = (type: TamerSpriteType) => {
    setSpriteType(type);
    const nextRule = getTamerAnimationRule(type);
    const nextLayout = getSheetLayoutSpec(nextRule.layout);
    setGridCols(nextLayout.cols);
    setGridRows(nextLayout.rows);
    setFps(nextRule.defaultFps);
    resetDownstream();
  };

  useEffect(() => {
    if (sheetDimensions.width <= 0) return;
    const v: number[] = [];
    for (let i = 1; i < gridCols; i++) v.push((i / gridCols) * 100);
    setVerticalDividers(v);
    const h: number[] = [];
    for (let i = 1; i < gridRows; i++) h.push((i / gridRows) * 100);
    setHorizontalDividers(h);
  }, [gridCols, gridRows, sheetDimensions.width]);

  useEffect(() => {
    if (!bgRemovedUrl || sheetDimensions.width <= 0) return;
    let cancelled = false;
    extractFramesFromSheet(bgRemovedUrl, verticalDividers, horizontalDividers)
      .then((frames) => {
        if (!cancelled) {
          setExtractedFrames(frames);
          setCurrentFrameIndex(0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Frame extraction failed");
      });
    return () => {
      cancelled = true;
    };
  }, [bgRemovedUrl, verticalDividers, horizontalDividers, sheetDimensions]);

  useEffect(() => {
    if (!isPlaying || extractedFrames.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % extractedFrames.length);
    }, 1000 / Math.max(1, fps));
    return () => clearInterval(interval);
  }, [isPlaying, fps, extractedFrames.length]);

  useEffect(() => {
    if (extractedFrames.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frame = extractedFrames[currentFrameIndex];
    if (!frame) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = frame.dataUrl;
  }, [currentFrameIndex, extractedFrames]);

  const generateSheet = async () => {
    if (!masterImageUrl) {
      setError("Upload the canonical character master image first.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    const referenceImageUrls = [directionalRefUrl, styleRefUrl].filter(
      (url): url is string => Boolean(url)
    );

    try {
      const response = await fetch("/api/generate-sprite-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tamer",
          characterKey,
          type: spriteType,
          characterImageUrl: masterImageUrl,
          referenceImageUrls,
          additionalNotes: additionalNotes.trim() || undefined,
          imageModel,
          gptImageQuality,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate sprite sheet");
      }
      setGenerated(data as TamerGenerateResponse);
      setBgRemovedUrl(null);
      setExtractedFrames([]);
      setCompletedSteps(new Set([1]));
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate sprite sheet");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeBackground = async () => {
    if (!generated?.imageUrl) return;
    setError(null);
    setIsRemovingBg(true);
    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: generated.imageUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove background");
      }
      setBgRemovedUrl(data.imageUrl);
      setSheetDimensions({ width: data.width, height: data.height });
      const spec = getSheetLayoutSpec(getTamerAnimationRule(spriteType).layout);
      setGridCols(spec.cols);
      setGridRows(spec.rows);
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        next.add(2);
        return next;
      });
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove background");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleDividerDrag = (
    kind: "vertical" | "horizontal",
    index: number,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    const imgRect = sheetRef.current?.getBoundingClientRect();
    if (!imgRect) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (kind === "vertical") {
        const relativeX = moveEvent.clientX - imgRect.left;
        const percentage = Math.max(0, Math.min(100, (relativeX / imgRect.width) * 100));
        setVerticalDividers((prev) => {
          const next = [...prev];
          const minPos = index > 0 ? next[index - 1] + 2 : 2;
          const maxPos = index < next.length - 1 ? next[index + 1] - 2 : 98;
          next[index] = Math.max(minPos, Math.min(maxPos, percentage));
          return next;
        });
      } else {
        const relativeY = moveEvent.clientY - imgRect.top;
        const percentage = Math.max(0, Math.min(100, (relativeY / imgRect.height) * 100));
        setHorizontalDividers((prev) => {
          const next = [...prev];
          const minPos = index > 0 ? next[index - 1] + 2 : 2;
          const maxPos = index < next.length - 1 ? next[index + 1] - 2 : 98;
          next[index] = Math.max(minPos, Math.min(maxPos, percentage));
          return next;
        });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const exportSheet = async () => {
    const url = bgRemovedUrl || generated?.imageUrl;
    if (!url) return;
    const filename = getTamerSheetFilename(characterKey, spriteType);
    try {
      await downloadUrlAsFile(url, filename);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    }
  };

  const exportZip = async () => {
    if (extractedFrames.length === 0) return;
    await downloadFramesZip({
      zipName: getTamerZipFilename(characterKey, spriteType),
      frames: extractedFrames.map((frame, index) => ({
        filename: getTamerFrameFilename(characterKey, spriteType, index),
        dataUrl: frame.dataUrl,
      })),
    });
  };

  const exportSingleFrame = (index: number) => {
    const frame = extractedFrames[index];
    if (!frame) return;
    triggerBlobDownload(
      getTamerFrameFilename(characterKey, spriteType, index),
      dataUrlToBlob(frame.dataUrl)
    );
  };

  const metadata = generated;
  const expectedFrames = metadata?.frameCount ?? rule.frames;

  return (
    <>
      <div className="steps-indicator">
        {([1, 2, 3, 4, 5] as TamerStep[]).map((step) => (
          <div
            key={step}
            className={`step-dot ${currentStep === step ? "active" : ""} ${
              completedSteps.has(step) ? "completed" : ""
            }`}
            style={{
              cursor:
                completedSteps.has(step) || currentStep === step ? "pointer" : "default",
            }}
            onClick={() => {
              if (completedSteps.has(step) || currentStep === step) {
                setCurrentStep(step);
              }
            }}
          />
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      {currentStep === 1 && (
        <div className="step-container">
          <h2 className="step-title">
            <span className="step-number">1</span>
            Monster Tamer Setup
          </h2>
          <p className="description-text">
            Locked-character production. The uploaded master is the identity source of truth. Additional
            notes are additive only and cannot change identity, layout, or frame count.
          </p>

          <div className="input-group">
            <label>Character</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {TAMER_CHARACTER_LIST.map((character) => (
                <button
                  key={character.key}
                  type="button"
                  className={`btn ${characterKey === character.key ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => {
                    setCharacterKey(character.key);
                    resetDownstream();
                  }}
                >
                  {character.displayName}
                </button>
              ))}
            </div>
          </div>

          <TamerAnimationSelector value={spriteType} onChange={applySpriteType} />

          <TamerReferenceUploader
            masterImageUrl={masterImageUrl}
            directionalRefUrl={directionalRefUrl}
            styleRefUrl={styleRefUrl}
            onMasterChange={setMasterImageUrl}
            onDirectionalChange={setDirectionalRefUrl}
            onStyleChange={setStyleRefUrl}
          />

          <div className="input-group">
            <label htmlFor="tamer-notes">Additional animation notes</label>
            <textarea
              id="tamer-notes"
              className="text-input"
              rows={2}
              spellCheck={false}
              placeholder='Additive only, e.g. "Make the hand lift slightly during frames 4–6."'
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.4rem" }}>
              Cannot override identity, outfit, direction, frame count, sheet layout, or body type.
            </p>
          </div>

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={generateSheet}
              disabled={isGenerating || !masterImageUrl}
            >
              {isGenerating ? "Generating..." : `Generate ${rule.label}`}
            </button>
          </div>

          {isGenerating && (
            <div className="loading">
              <div className="spinner" />
              <span className="loading-text">
                Generating locked {characterKey} {spriteType} sheet ({expectedFrames} frames)...
              </span>
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && generated && (
        <div className="step-container">
          <h2 className="step-title">
            <span className="step-number">2</span>
            Generated Sheet
          </h2>
          <p className="description-text">
            {rule.label} · {generated.frameCount} frames · {generated.layout} · {generated.bodyType}
            {generated.direction ? ` · ${generated.direction}` : ""}
          </p>
          <div className="image-preview">
            <img src={generated.imageUrl} alt={`${rule.label} sprite sheet`} />
          </div>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
              ← Back
            </button>
            <button
              className="btn btn-secondary"
              onClick={generateSheet}
              disabled={isGenerating || isRemovingBg}
            >
              {isGenerating ? "Regenerating..." : "Regenerate"}
            </button>
            <button
              className="btn btn-success"
              onClick={removeBackground}
              disabled={isRemovingBg || isGenerating}
            >
              {isRemovingBg ? "Removing Background..." : "Remove Background →"}
            </button>
          </div>
          {(isGenerating || isRemovingBg) && (
            <div className="loading">
              <div className="spinner" />
              <span className="loading-text">
                {isGenerating ? "Regenerating sprite sheet..." : "Removing background..."}
              </span>
            </div>
          )}
        </div>
      )}

      {currentStep === 3 && bgRemovedUrl && (
        <div className="step-container">
          <h2 className="step-title">
            <span className="step-number">3</span>
            Background Removed
          </h2>
          <p className="description-text">
            Transparent PNG ready. Next, extract {expectedFrames} frame
            {expectedFrames === 1 ? "" : "s"} using the {rule.layout} layout.
          </p>
          <div className="image-preview">
            <img src={bgRemovedUrl} alt="Sprite sheet with background removed" />
          </div>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
              ← Back
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                setCompletedSteps((prev) => {
                  const next = new Set(prev);
                  next.add(3);
                  return next;
                });
                setCurrentStep(4);
              }}
            >
              Extract Frames →
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && bgRemovedUrl && (
        <div className="step-container">
          <h2 className="step-title">
            <span className="step-number">4</span>
            Extract Frames
          </h2>
          <p className="description-text">
            Initial grid is {layoutSpec.cols}×{layoutSpec.rows} from the animation rule. Drag dividers if
            the model used a different packing (for example 4×2 instead of 8×1).
          </p>

          <div className="frame-controls">
            <label htmlFor="tamerGridCols">Columns:</label>
            <input
              id="tamerGridCols"
              type="number"
              className="frame-count-input"
              min={1}
              max={8}
              value={gridCols}
              onChange={(e) => setGridCols(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
            />
            <label htmlFor="tamerGridRows" style={{ marginLeft: "1rem" }}>
              Rows:
            </label>
            <input
              id="tamerGridRows"
              type="number"
              className="frame-count-input"
              min={1}
              max={8}
              value={gridRows}
              onChange={(e) => setGridRows(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
            />
            <span style={{ marginLeft: "1rem", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
              ({gridCols * gridRows} cells, rule expects {expectedFrames})
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: "auto", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              onClick={() => {
                setGridCols(layoutSpec.cols);
                setGridRows(layoutSpec.rows);
              }}
            >
              Reset to {layoutSpec.cols}×{layoutSpec.rows}
            </button>
          </div>

          <div className="frame-extractor">
            <div className="sprite-sheet-container">
              <img
                ref={sheetRef}
                src={bgRemovedUrl}
                alt="Sprite sheet"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  setSheetDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                }}
              />
              <div className="divider-overlay">
                {verticalDividers.map((pos, index) => (
                  <div
                    key={`tv-${index}`}
                    className="divider-line divider-vertical"
                    style={{ left: `${pos}%` }}
                    onMouseDown={(e) => handleDividerDrag("vertical", index, e)}
                  />
                ))}
                {horizontalDividers.map((pos, index) => (
                  <div
                    key={`th-${index}`}
                    className="divider-line divider-horizontal"
                    style={{ top: `${pos}%` }}
                    onMouseDown={(e) => handleDividerDrag("horizontal", index, e)}
                  />
                ))}
              </div>
            </div>
          </div>

          {extractedFrames.length > 0 && (
            <div className="frames-preview">
              {extractedFrames.map((frame, index) => (
                <div
                  key={index}
                  className="frame-thumb"
                  title={getTamerFrameFilename(characterKey, spriteType, index)}
                  onClick={() => exportSingleFrame(index)}
                >
                  <img src={frame.dataUrl} alt={`Frame ${index}`} />
                  <div className="frame-label">{String(index).padStart(2, "0")}</div>
                </div>
              ))}
            </div>
          )}

          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setCurrentStep(3)}>
              ← Back
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                setCompletedSteps((prev) => {
                  const next = new Set(prev);
                  next.add(4);
                  return next;
                });
                setCurrentStep(5);
              }}
              disabled={extractedFrames.length === 0}
            >
              Preview & Export →
            </button>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="step-container">
          <h2 className="step-title">
            <span className="step-number">5</span>
            Preview & Export
          </h2>
          <p className="description-text">
            Preview uses the extracted {extractedFrames.length} frame
            {extractedFrames.length === 1 ? "" : "s"} (rule: {expectedFrames}). FPS is adjustable.
          </p>

          <div className="animation-preview">
            <div className="animation-canvas-container">
              <canvas ref={canvasRef} className="animation-canvas" />
            </div>
            <div className="animation-controls">
              <button
                className={`btn ${isPlaying ? "btn-secondary" : "btn-primary"}`}
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={extractedFrames.length <= 1}
              >
                {isPlaying ? "Stop" : "Play"}
              </button>
              <div className="fps-control">
                <label>FPS: {fps}</label>
                <input
                  type="range"
                  className="fps-slider"
                  min={1}
                  max={24}
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="frames-preview">
            {extractedFrames.map((frame, index) => (
              <div
                key={index}
                className={`frame-thumb ${currentFrameIndex === index ? "active" : ""}`}
                onClick={() => setCurrentFrameIndex(index)}
              >
                <img src={frame.dataUrl} alt={`Frame ${index}`} />
                <div className="frame-label">
                  {String(index).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>

          <div className="export-section">
            <h3>Export</h3>
            <div className="export-options">
              <button className="btn btn-primary" onClick={exportSheet}>
                Download sheet
              </button>
              <button
                className="btn btn-primary"
                onClick={exportZip}
                disabled={extractedFrames.length === 0}
              >
                Download frames as ZIP
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginTop: "0.75rem" }}>
              Frames are named like{" "}
              <code>{getTamerFrameFilename(characterKey, spriteType, 0)}</code>
            </p>
          </div>

          <div className="button-group" style={{ marginTop: "1.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setCurrentStep(4)}>
              ← Back to Frame Extraction
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                resetDownstream();
                setMasterImageUrl(null);
                setDirectionalRefUrl(null);
                setStyleRefUrl(null);
                setAdditionalNotes("");
                applySpriteType("idle-south");
              }}
            >
              Start New Tamer Sheet
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = comma >= 0 ? dataUrl.slice(0, comma) : "";
  const mimeMatch = /data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1] || "image/png";
  const binary = atob(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

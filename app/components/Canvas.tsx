"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { ObstacleRect } from "./ObstacleRect";
import { computeLayout } from "../lib/compute";
import type { EditorState, Obstacle, TextBlock } from "../lib/types";

const PADDING = 20;

type Props = {
  state: EditorState;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateObstacle: (
    blockId: string,
    id: string,
    patch: Partial<Obstacle>,
  ) => void;
  onRemoveObstacle: (blockId: string, id: string) => void;
  onAddObstacle: (blockId: string, x: number, y: number) => void;
  onUpdateBlock: (id: string, patch: Partial<TextBlock>) => void;
};


/** Hook that returns a CSS scale factor so the canvas fits inside its wrapper */
function useScaleFit(canvasWidth: number) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const available = el.clientWidth;
      if (available > 0 && canvasWidth > 0) {
        setScale(Math.min(1, available / canvasWidth));
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasWidth]);

  return { wrapperRef, scale };
}

function SingleCanvas({
  block,
  blockIndex,
  state,
  isSelected,
  onSelectBlock,
  onUpdateObstacle,
  onRemoveObstacle,
  onAddObstacle,
}: {
  block: TextBlock;
  blockIndex: number;
  state: EditorState;
  isSelected: boolean;
  onSelectBlock: (id: string) => void;
  onUpdateObstacle: (
    blockId: string,
    id: string,
    patch: Partial<Obstacle>,
  ) => void;
  onRemoveObstacle: (blockId: string, id: string) => void;
  onAddObstacle: (blockId: string, x: number, y: number) => void;
}) {
  const { wrapperRef, scale } = useScaleFit(state.containerWidth);

  // Compute how many lines actually render — may exceed containerHeight when overflow is enabled
  const renderedLines = useMemo(
    () =>
      computeLayout(
        block.text,
        `${block.fontSize}px ${block.font}`,
        block.lineHeight,
        state.containerWidth - PADDING * 2,
        // Large height so ALL lines render (overflow)
        99999,
        block.obstacles,
        0,
        0,
        block.textShape,
        // Use the user-defined canvas height for shape tapering calculations
        state.containerHeight - PADDING * 2,
      ),
    [block, state.containerWidth, state.containerHeight],
  );

  // Natural content height: last line's bottom edge + padding
  const contentHeight =
    renderedLines.length > 0
      ? renderedLines[renderedLines.length - 1].y +
        block.lineHeight +
        PADDING * 2
      : state.containerHeight;

  // The canvas is at least the user-defined height, but grows to fit all text
  const canvasHeight = Math.max(state.containerHeight, contentHeight);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelectBlock(block.id);
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      onAddObstacle(
        block.id,
        (e.clientX - rect.left) / scale - PADDING,
        (e.clientY - rect.top) / scale - PADDING,
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Layer label — click to select */}
      <div
        className="flex items-center gap-2 px-0.5 cursor-pointer select-none w-fit"
        onClick={() => onSelectBlock(block.id)}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: block.color }}
        />
        <span
          className="text-[11px] font-mono transition-colors"
          style={{ color: isSelected ? "rgb(251,191,36)" : "rgb(113,113,122)" }}
        >
          Layer {blockIndex + 1}
        </span>
      </div>

      {/*
        Responsive wrapper — full width of the column.
        We measure this to compute the scale factor.
        Its height is set to the scaled canvas height so the layout
        doesn't collapse (transform doesn't affect flow).
      */}
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          height: canvasHeight * scale,
          position: "relative",
        }}
      >
        {/* Scaled canvas — rendered at full pixel size, scaled down to fit */}
        <div
          style={{
            width: state.containerWidth,
            height: canvasHeight,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* Canvas inner */}
          <div
            className="relative"
            style={{
              width: state.containerWidth,
              height: canvasHeight,
              background: "#111113",
              border: isSelected
                ? "1px solid rgba(251,191,36,0.3)"
                : "1px solid rgba(63,63,70,0.5)",
              boxShadow: isSelected
                ? "0 0 0 1px rgba(251,191,36,0.15), 0 24px 48px -12px rgba(0,0,0,0.6)"
                : "0 0 0 1px rgba(0,0,0,0.5), 0 24px 48px -12px rgba(0,0,0,0.6)",
              borderRadius: 4,
              overflow: "hidden",
              cursor: "crosshair",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onClick={handleClick}
          >
            {/* Grid — covers the full (possibly taller) canvas */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={state.containerWidth}
              height={canvasHeight}
            >
              <defs>
                <pattern
                  id={`grid-${block.id}`}
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(255,255,255,0.022)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#grid-${block.id})`}
              />
            </svg>

            {/* Text lines — all of them, even past original containerHeight */}
            {renderedLines.map((line, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: line.x + PADDING,
                  top: line.y + PADDING,
                  whiteSpace: "nowrap",
                  fontFamily: block.font,
                  fontSize: block.fontSize,
                  lineHeight: `${block.lineHeight}px`,
                  color: block.color,
                  pointerEvents: "none",
                }}
              >
                {line.text}
              </span>
            ))}

            {/* This block's obstacles */}
            {block.obstacles.map((obstacle) => (
              <ObstacleRect
                key={obstacle.id}
                obstacle={{
                  ...obstacle,
                  x: obstacle.x + PADDING,
                  y: obstacle.y + PADDING,
                }}
                onUpdate={(id, patch) => {
                  const adj: Partial<Obstacle> = {};
                  if (patch.x !== undefined) adj.x = patch.x - PADDING;
                  if (patch.y !== undefined) adj.y = patch.y - PADDING;
                  if (patch.width !== undefined) adj.width = patch.width;
                  if (patch.height !== undefined) adj.height = patch.height;
                  if ('imageUrl' in patch) adj.imageUrl = patch.imageUrl;
                  if (patch.shape !== undefined) adj.shape = patch.shape;
                  if (patch.padding !== undefined) adj.padding = patch.padding;
                  onUpdateObstacle(block.id, id, adj);
                }}
                onRemove={(id) => onRemoveObstacle(block.id, id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Per-canvas status bar */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] text-zinc-600 font-mono">
          {renderedLines.length} lines · {block.obstacles.length} obstacle
          {block.obstacles.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[11px] text-zinc-700 font-mono">
          click to add obstacle
        </span>
      </div>
    </div>
  );
}

export function Canvas({
  state,
  selectedBlockId,
  onSelectBlock,
  onUpdateObstacle,
  onRemoveObstacle,
  onAddObstacle,
}: Props) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {state.textBlocks.map((block, i) => (
        <SingleCanvas
          key={block.id}
          block={block}
          blockIndex={i}
          state={state}
          isSelected={selectedBlockId === block.id}
          onSelectBlock={onSelectBlock}
          onUpdateObstacle={onUpdateObstacle}
          onRemoveObstacle={onRemoveObstacle}
          onAddObstacle={onAddObstacle}
        />
      ))}
    </div>
  );
}

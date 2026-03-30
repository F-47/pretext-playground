"use client";

import { useCallback, useReducer, useState, useEffect } from "react";
import { Canvas } from "./Canvas";
import { Controls } from "./Controls";
import { ExportDrawer } from "./ExportDrawer";
import type { EditorState, Obstacle, ObstacleShape, TextBlock } from "../lib/types";

const INITIAL_STATE: EditorState = {
  containerWidth: 680,
  containerHeight: 460,
  textBlocks: [
    {
      id: "b1",
      text: `Text flows around the exact boundary of each shape — not just the bounding box. A circle carves a circular gap; a diamond cuts pointed clearance at each side.\n\nDrag any obstacle to reposition it. Grab the corner handle to resize. Click shape to change its geometry — rect, circle, triangle, or diamond. Use spacing to push text further from the edge.\n\nEvery line is computed live. Export gives you production-ready React with pre-calculated positions and zero layout shift.`,
      font: "Georgia",
      fontSize: 16,
      lineHeight: 26,
      color: "#a1a1aa",
      obstacles: [
        { id: "o1", x: 450, y: 20, width: 170, height: 170, shape: "circle" as ObstacleShape, padding: 14 },
        { id: "o2", x: 80, y: 270, width: 160, height: 120, padding: 10 },
      ],
    },
  ],
};

type EditorAction =
  | { type: "PATCH"; payload: Partial<EditorState> }
  | { type: "ADD_OBSTACLE"; blockId: string; x: number; y: number }
  | {
      type: "UPDATE_OBSTACLE";
      blockId: string;
      id: string;
      patch: Partial<Obstacle>;
    }
  | { type: "REMOVE_OBSTACLE"; blockId: string; id: string }
  | { type: "ADD_BLOCK"; id: string }
  | { type: "UPDATE_BLOCK"; id: string; patch: Partial<TextBlock> }
  | { type: "REMOVE_BLOCK"; id: string };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.payload };
    case "ADD_OBSTACLE":
      return {
        ...state,
        textBlocks: state.textBlocks.map((b) =>
          b.id === action.blockId
            ? {
                ...b,
                obstacles: [
                  ...b.obstacles,
                  {
                    id: `o${Date.now()}`,
                    x: action.x - 60,
                    y: action.y - 40,
                    width: 120,
                    height: 80,
                  },
                ],
              }
            : b,
        ),
      };
    case "UPDATE_OBSTACLE":
      return {
        ...state,
        textBlocks: state.textBlocks.map((b) =>
          b.id === action.blockId
            ? {
                ...b,
                obstacles: b.obstacles.map((o) =>
                  o.id === action.id ? { ...o, ...action.patch } : o,
                ),
              }
            : b,
        ),
      };
    case "REMOVE_OBSTACLE":
      return {
        ...state,
        textBlocks: state.textBlocks.map((b) =>
          b.id === action.blockId
            ? { ...b, obstacles: b.obstacles.filter((o) => o.id !== action.id) }
            : b,
        ),
      };
    case "ADD_BLOCK":
      return {
        ...state,
        textBlocks: [
          ...state.textBlocks,
          {
            id: action.id,
            text: "New text layer. Edit this text in the panel.",
            font: "Georgia",
            fontSize: 15,
            lineHeight: 24,
            color: "#71717a",
            obstacles: [],
          },
        ],
      };
    case "UPDATE_BLOCK":
      return {
        ...state,
        textBlocks: state.textBlocks.map((b) =>
          b.id === action.id ? { ...b, ...action.patch } : b,
        ),
      };
    case "REMOVE_BLOCK":
      return {
        ...state,
        textBlocks: state.textBlocks.filter((b) => b.id !== action.id),
      };
    default:
      return state;
  }
}

type HistoryState = {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
};
type HistoryAction =
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "EDIT"; action: EditorAction };

function historyReducer(h: HistoryState, ha: HistoryAction): HistoryState {
  switch (ha.type) {
    case "EDIT": {
      const next = editorReducer(h.present, ha.action);
      if (next === h.present) return h;
      return {
        past: [...h.past.slice(-60), h.present],
        present: next,
        future: [],
      };
    }
    case "UNDO":
      if (!h.past.length) return h;
      return {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future],
      };
    case "REDO":
      if (!h.future.length) return h;
      return {
        past: [...h.past, h.present],
        present: h.future[0],
        future: h.future.slice(1),
      };
  }
}

export function Editor() {
  const [history, dispatchHistory] = useReducer(historyReducer, {
    past: [],
    present: INITIAL_STATE,
    future: [],
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>("b1");
  const [exportOpen, setExportOpen] = useState(false);

  const state = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const dispatch = useCallback((action: EditorAction) => {
    dispatchHistory({ type: "EDIT", action });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatchHistory({ type: "UNDO" });
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        dispatchHistory({ type: "REDO" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex w-full h-full relative">
      {/* Canvas area — scrollable, aligned to top so first canvas is always visible */}
      <div className="flex-1 bg-[#09090b] overflow-auto">
        <div className="py-10 px-6 sm:px-10 w-full max-w-[calc(var(--canvas-w,680px)+80px)] mx-auto" style={{ '--canvas-w': `${state.containerWidth}px` } as React.CSSProperties}>
          <Canvas
            state={state}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onAddObstacle={(blockId, x, y) =>
              dispatch({ type: "ADD_OBSTACLE", blockId, x, y })
            }
            onUpdateObstacle={(blockId, id, patch) =>
              dispatch({ type: "UPDATE_OBSTACLE", blockId, id, patch })
            }
            onRemoveObstacle={(blockId, id) =>
              dispatch({ type: "REMOVE_OBSTACLE", blockId, id })
            }
            onUpdateBlock={(id, patch) =>
              dispatch({ type: "UPDATE_BLOCK", id, patch })
            }
          />
        </div>
      </div>

      <aside className="w-72 shrink-0 border-l border-zinc-800/60 flex flex-col overflow-y-auto bg-[#0c0c0e]">
        {/* Undo/redo */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-zinc-800/40">
          <button
            onClick={() => dispatchHistory({ type: "UNDO" })}
            disabled={!canUndo}
            className="text-[10px] font-mono px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-zinc-800/50 transition-colors"
          >
            ↩ undo
          </button>
          <button
            onClick={() => dispatchHistory({ type: "REDO" })}
            disabled={!canRedo}
            className="text-[10px] font-mono px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-25 disabled:cursor-not-allowed hover:bg-zinc-800/50 transition-colors"
          >
            ↪ redo
          </button>
          <span className="ml-auto text-[10px] font-mono text-zinc-700">
            {canUndo ? `${history.past.length} steps` : "no history"}
          </span>
        </div>

        <Controls
          state={state}
          selectedBlockId={selectedBlockId}
          onChange={(patch) => dispatch({ type: "PATCH", payload: patch })}
          onUpdateBlock={(id, patch) =>
            dispatch({ type: "UPDATE_BLOCK", id, patch })
          }
          onAddBlock={() => {
            const newId = `b${Date.now()}`;
            dispatch({ type: "ADD_BLOCK", id: newId });
            setSelectedBlockId(newId);
          }}
          onRemoveBlock={(id) => {
            dispatch({ type: "REMOVE_BLOCK", id });
            if (selectedBlockId === id) setSelectedBlockId(null);
          }}
          onSelectBlock={setSelectedBlockId}
          onExport={() => setExportOpen(true)}
        />
      </aside>

      <ExportDrawer
        state={state}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}

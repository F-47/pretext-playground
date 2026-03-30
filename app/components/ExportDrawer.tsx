"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CopySimple } from "@phosphor-icons/react";
import { generateReactCode } from "../lib/export";
import type { EditorState } from "../lib/types";

type Props = {
  state: EditorState;
  open: boolean;
  onClose: () => void;
};

export function ExportDrawer({ state, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => generateReactCode(state), [state]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const totalLines = code.split("\n").length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
            style={{
              background: "#0f0f11",
              borderTop: "1px solid rgba(63,63,70,0.6)",
              boxShadow: "0 -24px 48px -12px rgba(0,0,0,0.7)",
              maxHeight: "60vh",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-100 tracking-tight">
                  React component
                </span>
                <span className="h-3 w-px bg-zinc-700" />
                <span className="text-xs text-zinc-600 font-mono">
                  {state.textBlocks.length} layer{state.textBlocks.length !== 1 ? 's' : ''} · {state.textBlocks.reduce((s, b) => s + b.obstacles.length, 0)} obstacles · zero CLS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-sm transition-all duration-150"
                  style={{
                    background: copied
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(251,191,36,0.1)",
                    border: copied
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(251,191,36,0.25)",
                    color: copied ? "rgb(134,239,172)" : "rgb(251,191,36)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {copied ? (
                    <Check size={12} weight="bold" />
                  ) : (
                    <CopySimple size={12} weight="bold" />
                  )}
                  {copied ? "copied" : "copy"}
                </motion.button>

                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <pre
                className="text-xs leading-relaxed font-mono text-zinc-400 p-6"
                style={{ tabSize: 2 }}
              >
                <code>{code}</code>
              </pre>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client'

import { DownloadSimple, Plus, Trash, Stack } from '@phosphor-icons/react'
import type { EditorState, TextBlock, TextShape } from '../lib/types'

const TEXT_SHAPES: { value: TextShape; label: string; icon: string }[] = [
  { value: 'rect',             label: 'Normal',          icon: '▬▬▬\n▬▬▬\n▬▬▬' },
  { value: 'pyramid',          label: 'Pyramid',         icon: '▬▬▬\n ▬▬\n  ▬' },
  { value: 'inverted-pyramid', label: 'Inv. Pyramid',    icon: '  ▬\n ▬▬\n▬▬▬' },
  { value: 'diamond',          label: 'Diamond',         icon: ' ▬▬\n▬▬▬\n ▬▬' },
  { value: 'wave',             label: 'Wave',            icon: ' ▬▬\n▬▬▬\n ▬▬' },
]

type Props = {
  state: EditorState
  selectedBlockId: string | null
  onChange: (patch: Partial<EditorState>) => void
  onUpdateBlock: (id: string, patch: Partial<TextBlock>) => void
  onAddBlock: () => void
  onRemoveBlock: (id: string) => void
  onSelectBlock: (id: string) => void
  onExport: () => void
}

const FONTS = [
  { value: 'Georgia', label: 'Georgia' },
  { value: 'sans-serif', label: 'System Sans' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'serif', label: 'Serif' },
]

const COLORS = [
  '#e4e4e7', '#a1a1aa', '#fbbf24', '#86efac', '#93c5fd', '#f9a8d4',
]

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">{children}</span>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number
}) {
  return (
    <input
      type="number" min={min} max={max} step={step} value={value ?? 0}
      onChange={(e) => {
        const n = Number(e.target.value)
        if (!isNaN(n)) onChange(n)
      }}
      className="w-16 bg-transparent text-right text-sm font-mono text-zinc-200 focus:outline-none focus:text-amber-300 transition-colors"
    />
  )
}

export function Controls({ state, selectedBlockId, onChange, onUpdateBlock, onAddBlock, onRemoveBlock, onSelectBlock, onExport }: Props) {
  const selectedBlock = state.textBlocks.find((b) => b.id === selectedBlockId)

  return (
    <div className="flex flex-col h-full text-sm">

      {/* Text layers */}
      <div className="px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-1.5 mb-3">
          <Stack size={11} className="text-zinc-600" />
          <Label>Text Layers</Label>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.textBlocks.map((block, i) => {
            const active = selectedBlockId === block.id
            return (
              <div
                key={block.id}
                className="relative group cursor-pointer transition-all duration-100"
                onClick={() => onSelectBlock(block.id)}
              >
                <div
                  className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-sm transition-all duration-100"
                  style={{
                    background: active ? 'rgba(251,191,36,0.08)' : 'rgba(39,39,42,0.5)',
                    border: active ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(63,63,70,0.6)',
                  }}
                >
                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full" style={{ background: block.color }} />
                  {/* Layer name */}
                  <span
                    className="text-[10px] font-mono leading-none"
                    style={{ color: active ? 'rgb(251,191,36)' : 'rgb(113,113,122)' }}
                  >
                    Layer {i + 1}
                  </span>
                  {/* Font hint */}
                  <span className="text-[9px] font-mono text-zinc-700 leading-none">
                    {block.fontSize}px
                  </span>
                </div>

                {/* Remove button */}
                {state.textBlocks.length > 1 && (
                  <button
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-600 hover:text-red-400 hover:border-red-400/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id) }}
                  >
                    <Trash size={8} />
                  </button>
                )}
              </div>
            )
          })}

          {/* Add layer button */}
          <button
            onClick={onAddBlock}
            className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-sm border border-dashed border-zinc-700 hover:border-amber-400/40 hover:bg-amber-400/5 text-zinc-600 hover:text-amber-400 transition-all"
          >
            <Plus size={14} weight="bold" />
            <span className="text-[9px] font-mono">add</span>
          </button>
        </div>
      </div>

      {/* Selected layer settings */}
      {selectedBlock ? (
        <>
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <Label>Content</Label>
            <textarea
              rows={7}
              value={selectedBlock.text ?? ''}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { text: e.target.value })}
              className="mt-2.5 w-full bg-zinc-900/50 border border-zinc-800 rounded-sm text-sm text-zinc-300 leading-relaxed px-3 py-2.5 resize-none focus:outline-none focus:border-zinc-600 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            />
          </div>

          <div className="px-5 py-4 border-b border-zinc-800/60">
            <Label>Typography</Label>
            <div className="mt-3 divide-y divide-zinc-800/50">
              <Row label="Font">
                <select
                  value={selectedBlock.font ?? 'Georgia'}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { font: e.target.value })}
                  className="bg-transparent text-sm text-zinc-300 font-mono focus:outline-none focus:text-amber-300 cursor-pointer"
                >
                  {FONTS.map((f) => (
                    <option key={f.value} value={f.value} className="bg-zinc-900">{f.label}</option>
                  ))}
                </select>
              </Row>
              <Row label="Size">
                <NumInput value={selectedBlock.fontSize} onChange={(v) => onUpdateBlock(selectedBlock.id, { fontSize: v })} min={8} max={72} />
                <span className="text-xs text-zinc-600 font-mono">px</span>
              </Row>
              <Row label="Line height">
                <NumInput value={selectedBlock.lineHeight} onChange={(v) => onUpdateBlock(selectedBlock.id, { lineHeight: v })} min={12} max={80} />
                <span className="text-xs text-zinc-600 font-mono">px</span>
              </Row>
              <Row label="Color">
                <div className="flex gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateBlock(selectedBlock.id, { color: c })}
                      className="w-4 h-4 rounded-full transition-all"
                      style={{
                        background: c,
                        outline: selectedBlock.color === c ? `2px solid ${c}` : '2px solid transparent',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </Row>
            </div>
          </div>

          {/* Text shape */}
          <div className="px-5 py-4 border-b border-zinc-800/60">
            <div className="flex items-center justify-between mb-3">
              <Label>Text Shape</Label>
              <span className="text-[10px] font-mono text-zinc-600">
                {TEXT_SHAPES.find(s => s.value === (selectedBlock.textShape ?? 'rect'))?.label}
              </span>
            </div>
            <div className="flex gap-1.5">
              {TEXT_SHAPES.map((s) => {
                const active = (selectedBlock.textShape ?? 'rect') === s.value
                return (
                  <button
                    key={s.value}
                    title={s.label}
                    onClick={() => onUpdateBlock(selectedBlock.id, { textShape: s.value })}
                    className="flex-1 flex items-center justify-center py-2 rounded-sm transition-all"
                    style={{
                      background: active ? 'rgba(251,191,36,0.1)' : 'rgba(39,39,42,0.4)',
                      border: active ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(63,63,70,0.5)',
                      color: active ? 'rgb(251,191,36)' : 'rgb(113,113,122)',
                    }}
                  >
                    <span
                      className="leading-tight font-mono whitespace-pre text-center block"
                      style={{ fontSize: 6, letterSpacing: '-0.5px', lineHeight: '1.4' }}
                    >
                      {s.icon}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="px-5 py-8 text-center border-b border-zinc-800/60">
          <span className="text-xs text-zinc-700 font-mono">
            select a layer above to edit it
          </span>
        </div>
      )}

      {/* Canvas */}
      <div className="px-5 py-4 border-b border-zinc-800/60">
        <Label>Canvas</Label>
        <div className="mt-3 divide-y divide-zinc-800/50">
          <Row label="Width">
            <NumInput value={state.containerWidth} onChange={(v) => onChange({ containerWidth: v })} min={300} max={1400} step={10} />
            <span className="text-xs text-zinc-600 font-mono">px</span>
          </Row>
          <Row label="Height">
            <NumInput value={state.containerHeight} onChange={(v) => onChange({ containerHeight: v })} min={100} max={1000} step={10} />
            <span className="text-xs text-zinc-600 font-mono">px</span>
          </Row>
        </div>
      </div>

      <div className="flex-1" />

      <div className="px-5 py-4 border-t border-zinc-800/60">
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-zinc-950 text-sm font-semibold rounded-sm px-4 py-2.5 transition-all duration-150"
          style={{ letterSpacing: '-0.01em' }}
        >
          <DownloadSimple size={15} weight="bold" />
          Export React code
        </button>
        <p className="mt-2 text-center text-[10px] text-zinc-700">
          pre-calculated · no DOM reads · zero CLS
        </p>
      </div>
    </div>
  )
}

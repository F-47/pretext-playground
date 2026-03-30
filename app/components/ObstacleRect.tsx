'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImageSquare, Check, UploadSimple, Link, ArrowsOut } from '@phosphor-icons/react'
import type { Obstacle, ObstacleShape } from '../lib/types'

type Props = {
  obstacle: Obstacle
  onUpdate: (id: string, patch: Partial<Obstacle>) => void
  onRemove: (id: string) => void
}

const MIN_SIZE = 24

type ImageTab = 'url' | 'upload'
type Panel = 'shape' | 'image' | 'spacing' | null


const SHAPES: { value: ObstacleShape; label: string; path: string }[] = [
  { value: 'rect',          label: 'Rect',     path: 'M2 2h12v12H2z' },
  { value: 'circle',        label: 'Circle',   path: 'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z' },
  { value: 'triangle-up',   label: 'Tri ↑',   path: 'M8 2L14 14H2z' },
  { value: 'triangle-down', label: 'Tri ↓',   path: 'M2 2h12L8 14z' },
  { value: 'diamond',       label: 'Diamond',  path: 'M8 1l7 7-7 7-7-7z' },
]

const CLIP_PATHS: Record<ObstacleShape, string> = {
  rect:            'none',
  circle:          'ellipse(50% 50% at 50% 50%)',
  'triangle-up':   'polygon(50% 0%, 0% 100%, 100% 100%)',
  'triangle-down': 'polygon(0% 0%, 100% 0%, 50% 100%)',
  diamond:         'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
}

export function ObstacleRect({ obstacle, onUpdate, onRemove }: Props) {
  const [hovered, setHovered] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [tab, setTab] = useState<ImageTab>('url')
  const [urlInput, setUrlInput] = useState(obstacle.imageUrl ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizing = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  const shape = obstacle.shape ?? 'rect'
  const clipPath = shape === 'circle'
    ? `circle(${Math.min(obstacle.width, obstacle.height) / 2}px at 50% 50%)`
    : CLIP_PATHS[shape]

  useEffect(() => { setUrlInput(obstacle.imageUrl ?? '') }, [obstacle.imageUrl])

  const onDragStart = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = { startX: e.clientX, startY: e.clientY, origX: obstacle.x, origY: obstacle.y }
  }, [obstacle.x, obstacle.y])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging.current) {
      onUpdate(obstacle.id, {
        x: Math.max(0, dragging.current.origX + e.clientX - dragging.current.startX),
        y: Math.max(0, dragging.current.origY + e.clientY - dragging.current.startY),
      })
    }
    if (resizing.current) {
      onUpdate(obstacle.id, {
        width: Math.max(MIN_SIZE, resizing.current.origW + e.clientX - resizing.current.startX),
        height: Math.max(MIN_SIZE, resizing.current.origH + e.clientY - resizing.current.startY),
      })
    }
  }, [obstacle.id, onUpdate])

  const onPointerUp = useCallback(() => {
    dragging.current = null
    resizing.current = null
  }, [])

  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizing.current = { startX: e.clientX, startY: e.clientY, origW: obstacle.width, origH: obstacle.height }
  }, [obstacle.width, obstacle.height])

  const commitUrl = () => {
    onUpdate(obstacle.id, { imageUrl: urlInput.trim() || undefined })
    setPanel(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (obstacle.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(obstacle.imageUrl)
    onUpdate(obstacle.id, { imageUrl: URL.createObjectURL(file) })
    setPanel(null)
  }

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: obstacle.x, top: obstacle.y,
        width: obstacle.width, height: obstacle.height,
        cursor: 'move', userSelect: 'none',
        zIndex: hovered ? 10 : 1,
      }}
      animate={{ opacity: hovered ? 1 : 0.82 }}
      transition={{ duration: 0.12 }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={onDragStart}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Clipped body */}
      <div
        className="absolute inset-0 overflow-hidden transition-all duration-150"
        style={{
          clipPath,
          background: obstacle.imageUrl ? 'transparent' : (hovered ? 'rgba(251,191,36,0.06)' : 'rgba(24,24,27,0.75)'),
          border: shape === 'rect' ? (hovered ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(63,63,70,0.7)') : 'none',
        }}
      >
        {obstacle.imageUrl && (
          <img src={obstacle.imageUrl} alt="" draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none"
            style={{ opacity: hovered ? 0.85 : 1, transition: 'opacity 0.15s' }}
          />
        )}
      </div>

      {/* Shape outline for non-rect shapes */}
      {shape !== 'rect' && (
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {shape === 'circle' && (() => {
            const r = Math.min(obstacle.width, obstacle.height) / 2
            const pctX = (r / obstacle.width) * 100
            const pctY = (r / obstacle.height) * 100
            return (
            <ellipse cx="50" cy="50" rx={pctX - 1} ry={pctY - 1}
              fill="none"
              stroke={hovered ? 'rgba(251,191,36,0.5)' : 'rgba(63,63,70,0.6)'}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            )
          })()}
          {shape === 'triangle-up' && (
            <polygon points="50,1 99,99 1,99"
              fill="none"
              stroke={hovered ? 'rgba(251,191,36,0.5)' : 'rgba(63,63,70,0.6)'}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {shape === 'triangle-down' && (
            <polygon points="1,1 99,1 50,99"
              fill="none"
              stroke={hovered ? 'rgba(251,191,36,0.5)' : 'rgba(63,63,70,0.6)'}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {shape === 'diamond' && (
            <polygon points="50,1 99,50 50,99 1,50"
              fill="none"
              stroke={hovered ? 'rgba(251,191,36,0.5)' : 'rgba(63,63,70,0.6)'}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}

      {/* Toolbar */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            data-no-drag="true"
            className="absolute -top-7 left-0 flex items-center gap-1"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            {/* Shape button */}
            <button
              className="flex items-center gap-1 h-6 px-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/40 transition-colors text-[10px] font-mono"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setPanel(panel === 'shape' ? null : 'shape')}
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                <path d={SHAPES.find(s => s.value === shape)?.path ?? SHAPES[0].path} />
              </svg>
              shape
            </button>

            {/* Spacing button */}
            <button
              className="flex items-center gap-1 h-6 px-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/40 transition-colors text-[10px] font-mono"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setPanel(panel === 'spacing' ? null : 'spacing')}
              style={{ color: (obstacle.padding ?? 0) > 0 ? 'rgb(251,191,36)' : undefined }}
            >
              <ArrowsOut size={10} weight="bold" />
              {(obstacle.padding ?? 0) > 0 ? `${obstacle.padding}px` : 'spacing'}
            </button>

            {/* Image button */}
            <button
              className="flex items-center gap-1 h-6 px-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-400/40 transition-colors text-[10px] font-mono"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { setPanel(panel === 'image' ? null : 'image'); setUrlInput(obstacle.imageUrl ?? '') }}
            >
              <ImageSquare size={10} weight="bold" />
              {obstacle.imageUrl ? 'edit' : 'image'}
            </button>

            {/* Remove */}
            <button
              className="h-6 w-6 flex items-center justify-center rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400/40 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRemove(obstacle.id)}
            >
              <X size={9} weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shape picker panel */}
      <AnimatePresence>
        {panel === 'shape' && (
          <motion.div
            data-no-drag="true"
            className="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-sm shadow-2xl p-2 flex gap-1.5"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {SHAPES.map((s) => (
              <button
                key={s.value}
                title={s.label}
                onClick={() => { onUpdate(obstacle.id, { shape: s.value }); setPanel(null) }}
                className="flex flex-col items-center gap-1 p-2 rounded-sm transition-all"
                style={{
                  background: shape === s.value ? 'rgba(251,191,36,0.12)' : 'transparent',
                  border: shape === s.value ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent',
                  color: shape === s.value ? 'rgb(251,191,36)' : 'rgb(113,113,122)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d={s.path} />
                </svg>
                <span className="text-[9px] font-mono">{s.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacing panel */}
      <AnimatePresence>
        {panel === 'spacing' && (
          <motion.div
            data-no-drag="true"
            className="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-sm shadow-2xl p-3"
            style={{ width: 180 }}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Spacing</span>
              <span className="text-[10px] font-mono text-zinc-500">{obstacle.padding ?? 0}px</span>
            </div>
            <input
              type="range"
              min={0} max={80} step={1}
              value={obstacle.padding ?? 0}
              onChange={(e) => onUpdate(obstacle.id, { padding: Number(e.target.value) })}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-zinc-700">0</span>
              <span className="text-[9px] font-mono text-zinc-700">80</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image picker panel */}
      <AnimatePresence>
        {panel === 'image' && (
          <motion.div
            data-no-drag="true"
            className="absolute top-full left-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-sm shadow-2xl"
            style={{ width: 280 }}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex border-b border-zinc-800">
              {(['url', 'upload'] as ImageTab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex items-center gap-1.5 flex-1 justify-center py-2 text-[11px] font-mono transition-colors"
                  style={{
                    color: tab === t ? 'rgb(251,191,36)' : 'rgb(113,113,122)',
                    borderBottom: tab === t ? '1px solid rgb(251,191,36)' : '1px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  {t === 'url' ? <Link size={10} /> : <UploadSimple size={10} />}
                  {t === 'url' ? 'URL' : 'Upload'}
                </button>
              ))}
            </div>
            <div className="p-3">
              {tab === 'url' ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={urlInput ?? ''}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitUrl(); if (e.key === 'Escape') setPanel(null) }}
                    placeholder="https://picsum.photos/400/300"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-sm px-2.5 py-1.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <button onClick={commitUrl}
                    className="h-7 w-7 flex items-center justify-center rounded-sm bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors shrink-0"
                  >
                    <Check size={11} weight="bold" />
                  </button>
                </div>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-5 border border-dashed border-zinc-700 hover:border-amber-400/40 hover:bg-amber-400/5 rounded-sm text-xs font-mono text-zinc-500 hover:text-amber-400 transition-all"
                  >
                    <UploadSimple size={14} />
                    click to upload image
                  </button>
                </>
              )}
              {obstacle.imageUrl && (
                <button
                  className="mt-2 w-full text-center text-[10px] font-mono text-zinc-700 hover:text-red-400 transition-colors"
                  onClick={() => { if (obstacle.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(obstacle.imageUrl); onUpdate(obstacle.id, { imageUrl: undefined }); setPanel(null) }}
                >
                  remove image
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 flex items-end justify-end pb-1 pr-1"
        style={{ cursor: 'nwse-resize' }}
        onPointerDown={onResizeStart} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      >
        <svg width="7" height="7" viewBox="0 0 7 7" className="opacity-30">
          <path d="M6 1L1 6M6 3.5L3.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </motion.div>
  )
}

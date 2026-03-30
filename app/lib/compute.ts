import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'
import type { Obstacle, RenderedLine, ObstacleShape, TextShape } from './types'

type Segment = { x: number; width: number }

/**
 * Returns the [left, right] x-range blocked by an obstacle at a given y midpoint.
 * Returns null if the obstacle doesn't cover this y position.
 */
function getObstacleRange(o: Obstacle, midY: number): [number, number] | null {
  const pad = o.padding ?? 0
  const x = o.x - pad
  const oy = o.y - pad
  const width = o.width + pad * 2
  const height = o.height + pad * 2
  const shape = (o.shape ?? 'rect') as ObstacleShape

  if (midY < oy || midY > oy + height) return null

  const t = (midY - oy) / height   // 0 = top, 1 = bottom
  const cx = x + width / 2

  switch (shape) {
    case 'rect':
      return [x, x + width]

    case 'circle': {
      const r = Math.min(width, height) / 2
      const cy = oy + height / 2
      const dy = midY - cy
      if (Math.abs(dy) >= r) return null
      const halfW = Math.sqrt(r * r - dy * dy)
      return [cx - halfW, cx + halfW]
    }

    case 'triangle-up':
      return [cx - t * width / 2, cx + t * width / 2]

    case 'triangle-down': {
      const inv = 1 - t
      return [cx - inv * width / 2, cx + inv * width / 2]
    }

    case 'diamond': {
      const dt = Math.abs(t - 0.5) * 2
      const halfW = (1 - dt) * width / 2
      if (halfW <= 1) return null
      return [cx - halfW, cx + halfW]
    }

    default:
      return [x, x + width]
  }
}

/** Returns all free horizontal segments for a y band, respecting obstacle shapes */
function getAllSegments(
  y: number,
  lineHeight: number,
  blockWidth: number,
  obstacles: Obstacle[],
): Segment[] {
  const midY = y + lineHeight / 2

  const blockedRanges: [number, number][] = []
  for (const o of obstacles) {
    const range = getObstacleRange(o, midY)
    if (range) blockedRanges.push(range)
  }

  if (blockedRanges.length === 0) return [{ x: 0, width: blockWidth }]

  const points = new Set<number>([0, blockWidth])
  for (const [l, r] of blockedRanges) {
    points.add(Math.max(0, l))
    points.add(Math.min(blockWidth, r))
  }

  const sorted = Array.from(points).sort((a, b) => a - b)
  const segments: Segment[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const segX = sorted[i]
    const segEnd = sorted[i + 1]
    const segW = segEnd - segX
    const isBlocked = blockedRanges.some(([l, r]) => l < segEnd && r > segX)
    if (!isBlocked && segW >= 10) segments.push({ x: segX, width: segW })
  }

  return segments
}

/** Returns the available segment imposed by the text container shape */
function getTextShapeSegment(
  y: number,
  lineHeight: number,
  blockHeight: number,
  blockWidth: number,
  shape: TextShape,
): Segment {
  const t = (y + lineHeight / 2) / Math.max(blockHeight, 1)
  const cx = blockWidth / 2

  let w: number
  let x: number

  switch (shape) {
    case 'pyramid': {
      w = Math.max(30, blockWidth * (1 - t * 0.84))
      x = cx - w / 2
      break
    }
    case 'inverted-pyramid': {
      w = Math.max(30, blockWidth * (0.16 + t * 0.84))
      x = cx - w / 2
      break
    }
    case 'diamond': {
      const dt = Math.abs(t - 0.5) * 2
      w = Math.max(30, blockWidth * (1 - dt * 0.78))
      x = cx - w / 2
      break
    }
    case 'wave': {
      w = Math.max(40, blockWidth * (0.62 + Math.sin(t * Math.PI * 4) * 0.2))
      x = cx - w / 2 + Math.sin(t * Math.PI * 2.5) * blockWidth * 0.1
      break
    }
    default:
      return { x: 0, width: blockWidth }
  }

  const clampedX = Math.max(0, x)
  const clampedW = Math.min(w, blockWidth - clampedX)
  return { x: clampedX, width: Math.max(10, clampedW) }
}

/** Clips segments to a shape boundary, returns only the intersecting parts */
function clipSegments(segments: Segment[], clip: Segment): Segment[] {
  const clipEnd = clip.x + clip.width
  return segments.flatMap((seg) => {
    const start = Math.max(seg.x, clip.x)
    const end = Math.min(seg.x + seg.width, clipEnd)
    return end - start >= 10 ? [{ x: start, width: end - start }] : []
  })
}

export function computeLayout(
  text: string,
  fontString: string,
  lineHeight: number,
  blockWidth: number,
  blockHeight: number,
  obstacles: Obstacle[],
  blockX = 0,
  blockY = 0,
  textShape?: TextShape,
  shapeHeight?: number, // reference height for shape tapering (defaults to blockHeight)
): RenderedLine[] {
  if (!text.trim()) return []

  const localObstacles = obstacles
    .map((o) => ({ ...o, x: o.x - blockX, y: o.y - blockY }))
    .filter((o) => o.x < blockWidth && o.x + o.width > 0)

  const prepared = prepareWithSegments(text, fontString)
  const lines: RenderedLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = 0
  let exhausted = false

  while (y < blockHeight && !exhausted) {
    let segments = getAllSegments(y, lineHeight, blockWidth, localObstacles)

    if (textShape && textShape !== 'rect') {
      const effectiveShapeH = shapeHeight ?? blockHeight
      // Only apply shape tapering while within the defined shape region.
      // Lines past shapeHeight flow as full-width rect (overflow).
      if (y < effectiveShapeH) {
        const clip = getTextShapeSegment(y, lineHeight, effectiveShapeH, blockWidth, textShape)
        segments = clipSegments(segments, clip)
      }
    }

    if (segments.length === 0) { y += lineHeight; continue }

    for (const seg of segments) {
      const line = layoutNextLine(prepared, cursor, seg.width)
      if (line === null) { exhausted = true; break }
      lines.push({ text: line.text, x: seg.x, y, width: seg.width })
      cursor = line.end
    }

    y += lineHeight
  }

  return lines
}

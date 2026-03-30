export type ObstacleShape = 'rect' | 'circle' | 'triangle-up' | 'triangle-down' | 'diamond'

export type TextShape = 'rect' | 'pyramid' | 'inverted-pyramid' | 'diamond' | 'wave'

export type Obstacle = {
  id: string
  x: number
  y: number
  width: number
  height: number
  shape?: ObstacleShape
  imageUrl?: string
  padding?: number
}

export type TextBlock = {
  id: string
  text: string
  font: string
  fontSize: number
  lineHeight: number
  color: string
  textShape?: TextShape
  obstacles: Obstacle[]
}

export type RenderedLine = {
  text: string
  x: number
  y: number
  width: number
}

export type EditorState = {
  containerWidth: number
  containerHeight: number
  textBlocks: TextBlock[]
}

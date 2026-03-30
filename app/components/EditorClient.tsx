'use client'

import dynamic from 'next/dynamic'

export const EditorClient = dynamic(
  () => import('./Editor').then((m) => m.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="text-zinc-600 font-mono text-sm animate-pulse">initializing canvas...</div>
    ),
  }
)

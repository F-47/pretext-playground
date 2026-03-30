import { EditorClient } from "./components/EditorClient";

export default function Home() {
  return (
    <div className="flex flex-col h-dvh">
      {/* Top bar — fixed */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-12 border-b border-zinc-800/60 shrink-0 bg-[#09090b]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Pretext Playground
          </span>
          <span className="h-3.5 w-px bg-zinc-700" />
          <span className="text-xs text-zinc-500">
            text flows around obstacles
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/chenglou/pretext"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-200"
          >
            powered by Pretext
          </a>
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded px-2 py-0.5">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
            zero CLS
          </span>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 flex overflow-hidden">
        <EditorClient />
      </main>
    </div>
  );
}

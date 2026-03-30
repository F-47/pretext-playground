# Pretext Playground

An interactive editor for flowing text around arbitrary obstacles — powered by [Pretext](https://github.com/chenglou/pretext).

## What it does

- Draw obstacle rectangles on a canvas
- Text reflows around them in real time with **zero layout shift**
- Layouts are pre-calculated, not computed at runtime
- Export production-ready React code

## Tech

- [Next.js](https://nextjs.org) 16
- [Pretext](https://github.com/chenglou/pretext) — the text layout engine
- [Framer Motion](https://www.framer.com/motion/) — obstacle drag interactions
- [Tailwind CSS](https://tailwindcss.com) v4

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

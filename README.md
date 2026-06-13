# Game — Space Defender

A fast-paced browser arcade space shooter built with **Vite** and **TypeScript**. No frameworks, no assets to download — just open it and play.

## Play

```bash
bun install   # or: npm install
bun dev       # or: npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Controls

| Action | Keys |
|--------|------|
| Move | `WASD` or Arrow keys |
| Shoot | `Space`, `Up`, or click/tap |
| Pause | `P` or `Esc` |

## Power-ups

| Icon | Effect |
|------|--------|
| **S** | Energy shield — absorbs one hit |
| **R** | Rapid fire for 6 seconds |
| **W** | Spread shot for 6 seconds |
| **+** | Extra life (max 5) |

## Features

- Wave-based enemy spawning with increasing difficulty
- Combo multiplier for chained kills
- Local high score (saved in `localStorage`)
- Particle effects, screen shake, and neon arcade visuals
- Three enemy types: Scout, Fighter, Tank

## Build

```bash
bun run build
bun run preview
```

Static output goes to `dist/` — deploy anywhere (GitHub Pages, Netlify, Vercel, etc.).

## Repository setup

This project is intended for a dedicated **Game** repository. To publish under `VN4x/Game` (or your own org):

```bash
# On GitHub: create a new empty repo named "Game"
git remote set-url origin https://github.com/VN4x/Game.git
git push -u origin main
```

## Tech stack

- [Vite](https://vitejs.dev/) — dev server & bundler
- [TypeScript](https://www.typescriptlang.org/) — type-safe game logic
- HTML5 Canvas — rendering

## License

MIT

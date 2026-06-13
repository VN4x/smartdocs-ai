export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hsl(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function loadHighScore(): number {
  const raw = localStorage.getItem("space-defender-high-score");
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveHighScore(score: number): void {
  localStorage.setItem("space-defender-high-score", String(score));
}

export type GameState = "menu" | "playing" | "paused" | "gameover";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Bullet {
  x: number;
  y: number;
  vy: number;
  damage: number;
  friendly: boolean;
  w: number;
  h: number;
}

export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  score: number;
  shootCooldown: number;
  type: "scout" | "fighter" | "tank";
  hue: number;
}

export interface PowerUp {
  x: number;
  y: number;
  vy: number;
  kind: "shield" | "rapid" | "spread" | "life";
  w: number;
  h: number;
  pulse: number;
}

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  lives: number;
  shield: number;
  rapidTimer: number;
  spreadTimer: number;
  shootCooldown: number;
  invincible: number;
}

export const CANVAS_W = 800;
export const CANVAS_H = 600;

export const HIGH_SCORE_KEY = "space-defender-high-score";

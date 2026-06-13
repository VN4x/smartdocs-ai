import { Input } from "./Input";
import {
  CANVAS_H,
  CANVAS_W,
  type Bullet,
  type Enemy,
  type GameState,
  type Particle,
  type Player,
  type PowerUp,
  type Star,
} from "./types";
import { clamp, hsl, loadHighScore, rand, randInt, rectsOverlap, saveHighScore } from "./utils";

export class Game {
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private state: GameState = "menu";
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;

  private player: Player = this.createPlayer();
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  private stars: Star[] = [];

  private score = 0;
  private wave = 1;
  private highScore = loadHighScore();
  private spawnTimer = 0;
  private waveTimer = 0;
  private shake = 0;
  private flash = 0;
  private combo = 0;
  private comboTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.input = new Input(canvas);
    this.initStars();
    this.updateHud();
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(now: number): void {
    const frameDt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.accumulator += frameDt;

    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }

    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_W / 2 - 20,
      y: CANVAS_H - 80,
      w: 40,
      h: 36,
      speed: 320,
      lives: 3,
      shield: 0,
      rapidTimer: 0,
      spreadTimer: 0,
      shootCooldown: 0,
      invincible: 0,
    };
  }

  private initStars(): void {
    this.stars = Array.from({ length: 90 }, () => ({
      x: rand(0, CANVAS_W),
      y: rand(0, CANVAS_H),
      speed: rand(20, 120),
      size: rand(0.5, 2.2),
      brightness: rand(0.3, 1),
    }));
  }

  private resetGame(): void {
    this.player = this.createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];
    this.score = 0;
    this.wave = 1;
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.updateHud();
  }

  private update(dt: number): void {
    this.handleInput();

    if (this.state !== "playing") return;

    this.updateStars(dt);
    this.updatePlayer(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updatePowerUps(dt);
    this.updateParticles(dt);
    this.updateSpawning(dt);
    this.updateTimers(dt);
    this.checkCollisions();
    this.updateHud();
  }

  private handleInput(): void {
    if (this.state === "menu") {
      if (this.input.wasPressed(" ") || this.input.wasPressed("enter") || this.input.pointer.down) {
        this.resetGame();
        this.state = "playing";
      }
      return;
    }

    if (this.state === "gameover") {
      if (this.input.wasPressed(" ") || this.input.wasPressed("enter") || this.input.pointer.down) {
        this.state = "menu";
      }
      return;
    }

    if (this.input.wasPressed("p") || this.input.wasPressed("escape")) {
      this.state = this.state === "paused" ? "playing" : "paused";
    }
  }

  private updateStars(dt: number): void {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > CANVAS_H) {
        star.y = 0;
        star.x = rand(0, CANVAS_W);
      }
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    const moveX = this.input.axisX();
    const moveY = this.input.axisY();

    p.x += moveX * p.speed * dt;
    p.y += moveY * p.speed * dt * 0.6;
    p.x = clamp(p.x, 10, CANVAS_W - p.w - 10);
    p.y = clamp(p.y, CANVAS_H * 0.45, CANVAS_H - p.h - 10);

    if (p.rapidTimer > 0) p.rapidTimer -= dt;
    if (p.spreadTimer > 0) p.spreadTimer -= dt;
    if (p.shield > 0) p.shield -= dt;
    if (p.invincible > 0) p.invincible -= dt;

    const fireRate = p.rapidTimer > 0 ? 0.08 : 0.18;
    if (p.shootCooldown > 0) p.shootCooldown -= dt;

    const wantsShoot =
      this.input.isDown(" ") ||
      this.input.isDown("arrowup") ||
      this.input.isDown("w") ||
      this.input.pointer.down;

    if (wantsShoot && p.shootCooldown <= 0) {
      this.firePlayerBullets();
      p.shootCooldown = fireRate;
    }
  }

  private firePlayerBullets(): void {
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y;

    if (p.spreadTimer > 0) {
      const angles = [-0.15, 0, 0.15];
      for (const angle of angles) {
        const speed = 520;
        this.bullets.push({
          x: cx - 2,
          y: cy,
          vy: -speed * Math.cos(angle),
          damage: 1,
          friendly: true,
          w: 4,
          h: 14,
        });
        this.bullets[this.bullets.length - 1]!.x += Math.sin(angle) * 8;
      }
    } else {
      this.bullets.push({
        x: cx - 2,
        y: cy,
        vy: -520,
        damage: 1,
        friendly: true,
        w: 4,
        h: 14,
      });
    }
  }

  private updateBullets(dt: number): void {
    for (const bullet of this.bullets) {
      bullet.y += bullet.vy * dt;
    }
    this.bullets = this.bullets.filter(
      (b) => b.y > -20 && b.y < CANVAS_H + 20 && b.x > -20 && b.x < CANVAS_W + 20,
    );
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.shootCooldown -= dt;

      if (enemy.x < 0 || enemy.x > CANVAS_W - enemy.w) {
        enemy.vx *= -1;
      }

      if (enemy.shootCooldown <= 0 && enemy.y > 40) {
        this.fireEnemyBullet(enemy);
        enemy.shootCooldown = enemy.type === "tank" ? 1.8 : enemy.type === "fighter" ? 1.2 : 2.4;
      }
    }

    this.enemies = this.enemies.filter((e) => e.y < CANVAS_H + 60);
  }

  private fireEnemyBullet(enemy: Enemy): void {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h;
    const playerCx = this.player.x + this.player.w / 2;
    const playerCy = this.player.y + this.player.h / 2;
    const dx = playerCx - cx;
    const dy = playerCy - cy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = enemy.type === "tank" ? 180 : 240;

    this.bullets.push({
      x: cx - 3,
      y: cy,
      vy: (dy / len) * speed,
      damage: enemy.type === "tank" ? 2 : 1,
      friendly: false,
      w: 6,
      h: 6,
    });
    const last = this.bullets[this.bullets.length - 1]!;
    last.x += (dx / len) * speed * 0.02;
  }

  private updatePowerUps(dt: number): void {
    for (const pu of this.powerUps) {
      pu.y += pu.vy * dt;
      pu.pulse += dt * 6;
    }
    this.powerUps = this.powerUps.filter((pu) => pu.y < CANVAS_H + 30);
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private updateSpawning(dt: number): void {
    this.waveTimer += dt;
    if (this.waveTimer >= 18) {
      this.wave++;
      this.waveTimer = 0;
    }

    const interval = clamp(1.4 - this.wave * 0.06, 0.35, 1.4);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = interval + rand(-0.15, 0.15);

      if (Math.random() < 0.08) {
        this.spawnPowerUp();
      }
    }
  }

  private spawnEnemy(): void {
    const roll = Math.random();
    let type: Enemy["type"] = "scout";
    if (roll > 0.72) type = "tank";
    else if (roll > 0.42) type = "fighter";

    const configs = {
      scout: { w: 34, h: 28, hp: 1, score: 100, vy: 90 + this.wave * 4, hue: 190 },
      fighter: { w: 42, h: 34, hp: 2, score: 200, vy: 70 + this.wave * 3, hue: 280 },
      tank: { w: 52, h: 44, hp: 4, score: 400, vy: 45 + this.wave * 2, hue: 350 },
    } as const;

    const cfg = configs[type];
    this.enemies.push({
      x: rand(20, CANVAS_W - cfg.w - 20),
      y: -cfg.h,
      w: cfg.w,
      h: cfg.h,
      vx: rand(-40, 40),
      vy: cfg.vy,
      hp: cfg.hp + Math.floor(this.wave / 4),
      maxHp: cfg.hp + Math.floor(this.wave / 4),
      score: cfg.score,
      shootCooldown: rand(0.5, 1.5),
      type,
      hue: cfg.hue,
    });
  }

  private spawnPowerUp(): void {
    const kinds: PowerUp["kind"][] = ["shield", "rapid", "spread", "life"];
    const kind = kinds[randInt(0, kinds.length - 1)]!;
    this.powerUps.push({
      x: rand(30, CANVAS_W - 50),
      y: -24,
      vy: 90,
      kind,
      w: 28,
      h: 28,
      pulse: 0,
    });
  }

  private updateTimers(dt: number): void {
    if (this.shake > 0) this.shake -= dt * 3;
    if (this.flash > 0) this.flash -= dt * 2.5;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
  }

  private checkCollisions(): void {
    // Player bullets vs enemies
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]!;
      if (!bullet.friendly) continue;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j]!;
        if (!rectsOverlap(bullet, enemy)) continue;

        enemy.hp -= bullet.damage;
        this.bullets.splice(i, 1);
        this.spawnHitParticles(bullet.x, bullet.y, enemy.hue);

        if (enemy.hp <= 0) {
          this.destroyEnemy(enemy, j);
        }
        break;
      }
    }

    // Enemy bullets vs player
    if (this.player.invincible <= 0 && this.player.shield <= 0) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i]!;
        if (bullet.friendly) continue;
        if (!rectsOverlap(bullet, this.player)) continue;

        this.bullets.splice(i, 1);
        this.damagePlayer();
        break;
      }
    }

    // Enemies vs player
    if (this.player.invincible <= 0) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i]!;
        if (!rectsOverlap(enemy, this.player)) continue;
        this.destroyEnemy(enemy, i);
        this.damagePlayer();
      }
    }

    // Power-ups vs player
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i]!;
      if (!rectsOverlap(pu, this.player)) continue;
      this.applyPowerUp(pu.kind);
      this.powerUps.splice(i, 1);
      this.spawnPickupParticles(pu.x + pu.w / 2, pu.y + pu.h / 2, pu.kind);
    }
  }

  private destroyEnemy(enemy: Enemy, index: number): void {
    this.enemies.splice(index, 1);
    this.combo++;
    this.comboTimer = 2.5;
    const multiplier = 1 + Math.min(this.combo * 0.1, 1);
    this.score += Math.floor(enemy.score * multiplier);
    this.spawnExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.hue);
    this.shake = 0.35;
  }

  private damagePlayer(): void {
    if (this.player.shield > 0) {
      this.player.shield = 0;
      this.player.invincible = 1.2;
      this.flash = 0.6;
      return;
    }

    this.player.lives--;
    this.player.invincible = 2;
    this.combo = 0;
    this.shake = 0.8;
    this.flash = 1;

    if (this.player.lives <= 0) {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        saveHighScore(this.score);
      }
      this.state = "gameover";
    }
  }

  private applyPowerUp(kind: PowerUp["kind"]): void {
    switch (kind) {
      case "shield":
        this.player.shield = 8;
        break;
      case "rapid":
        this.player.rapidTimer = 6;
        break;
      case "spread":
        this.player.spreadTimer = 6;
        break;
      case "life":
        this.player.lives = Math.min(this.player.lives + 1, 5);
        break;
    }
  }

  private spawnExplosion(x: number, y: number, hue: number): void {
    for (let i = 0; i < 18; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(60, 220);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.3, 0.7),
        maxLife: 0.7,
        color: hsl(hue + rand(-20, 20), 90, rand(50, 70)),
        size: rand(2, 5),
      });
    }
  }

  private spawnHitParticles(x: number, y: number, hue: number): void {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: rand(-80, 80),
        vy: rand(-120, 40),
        life: rand(0.15, 0.35),
        maxLife: 0.35,
        color: hsl(hue, 80, 70),
        size: rand(1.5, 3),
      });
    }
  }

  private spawnPickupParticles(x: number, y: number, kind: PowerUp["kind"]): void {
    const colors: Record<PowerUp["kind"], string> = {
      shield: "#4cc9f0",
      rapid: "#ffd166",
      spread: "#b5179e",
      life: "#06d6a0",
    };
    for (let i = 0; i < 10; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 140);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.2, 0.5),
        maxLife: 0.5,
        color: colors[kind],
        size: rand(1.5, 3.5),
      });
    }
  }

  private updateHud(): void {
    const hud = document.getElementById("hud");
    if (!hud) return;

    if (this.state === "menu") {
      hud.textContent = `High score: ${this.highScore.toLocaleString()}`;
      return;
    }

    hud.textContent = `Score ${this.score.toLocaleString()} · Wave ${this.wave} · Lives ${this.player.lives} · Best ${this.highScore.toLocaleString()}`;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();

    if (this.shake > 0) {
      const intensity = this.shake * 8;
      ctx.translate(rand(-intensity, intensity), rand(-intensity, intensity));
    }

    this.drawBackground();
    this.drawStars();

    if (this.state === "playing" || this.state === "paused") {
      this.drawPowerUps();
      this.drawEnemies();
      this.drawBullets();
      this.drawPlayer();
      this.drawParticles();
      this.drawHudOverlay();

      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255, 80, 100, ${this.flash * 0.25})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }

      if (this.state === "paused") {
        this.drawCenteredText("PAUSED", "Press P to resume", 0.9);
      }
    }

    if (this.state === "menu") {
      this.drawMenu();
    }

    if (this.state === "gameover") {
      this.drawGameOver();
    }

    ctx.restore();
  }

  private drawBackground(): void {
    const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, "#060b1f");
    grad.addColorStop(1, "#02040a");
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  private drawStars(): void {
    for (const star of this.stars) {
      this.ctx.fillStyle = `rgba(220, 240, 255, ${star.brightness})`;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  private drawPlayer(): void {
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    if (p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0) return;

    if (p.shield > 0) {
      this.ctx.strokeStyle = `rgba(76, 201, 240, ${0.35 + Math.sin(performance.now() / 120) * 0.15})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, p.w * 0.75, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Ship body
    this.ctx.fillStyle = "#00f0ff";
    this.ctx.beginPath();
    this.ctx.moveTo(cx, p.y);
    this.ctx.lineTo(p.x + p.w, p.y + p.h);
    this.ctx.lineTo(cx, p.y + p.h - 8);
    this.ctx.lineTo(p.x, p.y + p.h);
    this.ctx.closePath();
    this.ctx.fill();

    // Cockpit
    this.ctx.fillStyle = "#b8ffff";
    this.ctx.beginPath();
    this.ctx.moveTo(cx, p.y + 8);
    this.ctx.lineTo(cx + 6, p.y + 20);
    this.ctx.lineTo(cx - 6, p.y + 20);
    this.ctx.closePath();
    this.ctx.fill();

    // Engine glow
    this.ctx.fillStyle = "rgba(255, 120, 60, 0.8)";
    this.ctx.fillRect(cx - 5, p.y + p.h - 4, 10, 6);
  }

  private drawEnemies(): void {
    for (const enemy of this.enemies) {
      const cx = enemy.x + enemy.w / 2;

      this.ctx.fillStyle = hsl(enemy.hue, 75, 55);
      this.ctx.beginPath();
      this.ctx.moveTo(cx, enemy.y + enemy.h);
      this.ctx.lineTo(enemy.x, enemy.y);
      this.ctx.lineTo(cx, enemy.y + 10);
      this.ctx.lineTo(enemy.x + enemy.w, enemy.y);
      this.ctx.closePath();
      this.ctx.fill();

      // HP bar for tougher enemies
      if (enemy.maxHp > 1) {
        const ratio = enemy.hp / enemy.maxHp;
        this.ctx.fillStyle = "rgba(0,0,0,0.5)";
        this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.w, 4);
        this.ctx.fillStyle = hsl(enemy.hue, 90, 60);
        this.ctx.fillRect(enemy.x, enemy.y - 8, enemy.w * ratio, 4);
      }
    }
  }

  private drawBullets(): void {
    for (const bullet of this.bullets) {
      if (bullet.friendly) {
        this.ctx.fillStyle = "#7dffcf";
        this.ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
      } else {
        this.ctx.fillStyle = "#ff5d8f";
        this.ctx.beginPath();
        this.ctx.arc(bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, bullet.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawPowerUps(): void {
    const labels: Record<PowerUp["kind"], string> = {
      shield: "S",
      rapid: "R",
      spread: "W",
      life: "+",
    };
    const colors: Record<PowerUp["kind"], string> = {
      shield: "#4cc9f0",
      rapid: "#ffd166",
      spread: "#c77dff",
      life: "#06d6a0",
    };

    for (const pu of this.powerUps) {
      const scale = 1 + Math.sin(pu.pulse) * 0.08;
      const cx = pu.x + pu.w / 2;
      const cy = pu.y + pu.h / 2;

      this.ctx.save();
      this.ctx.translate(cx, cy);
      this.ctx.scale(scale, scale);
      this.ctx.fillStyle = colors[pu.kind];
      this.ctx.beginPath();
      this.ctx.arc(0, 0, pu.w / 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = "#05060f";
      this.ctx.font = "bold 14px Orbitron, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(labels[pu.kind], 0, 1);
      this.ctx.restore();
    }
  }

  private drawParticles(): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }

  private drawHudOverlay(): void {
    this.ctx.font = "600 16px Orbitron, sans-serif";
    this.ctx.fillStyle = "rgba(0, 240, 255, 0.9)";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE ${this.score}`, 16, 28);

    this.ctx.textAlign = "right";
    this.ctx.fillText(`WAVE ${this.wave}`, CANVAS_W - 16, 28);

    if (this.combo > 1) {
      this.ctx.fillStyle = "#ffd166";
      this.ctx.textAlign = "center";
      this.ctx.fillText(`COMBO x${this.combo}`, CANVAS_W / 2, 28);
    }

    // Lives
    for (let i = 0; i < this.player.lives; i++) {
      this.ctx.fillStyle = "#00f0ff";
      this.ctx.beginPath();
      this.ctx.moveTo(20 + i * 18, CANVAS_H - 14);
      this.ctx.lineTo(26 + i * 18, CANVAS_H - 6);
      this.ctx.lineTo(14 + i * 18, CANVAS_H - 6);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Power-up timers
    let statusY = 52;
    if (this.player.rapidTimer > 0) {
      this.drawStatusBar("RAPID", this.player.rapidTimer / 6, "#ffd166", statusY);
      statusY += 18;
    }
    if (this.player.spreadTimer > 0) {
      this.drawStatusBar("SPREAD", this.player.spreadTimer / 6, "#c77dff", statusY);
    }
  }

  private drawStatusBar(label: string, ratio: number, color: string, y: number): void {
    this.ctx.font = "10px Rajdhani, sans-serif";
    this.ctx.fillStyle = "rgba(255,255,255,0.7)";
    this.ctx.textAlign = "left";
    this.ctx.fillText(label, 16, y);
    this.ctx.fillStyle = "rgba(255,255,255,0.15)";
    this.ctx.fillRect(16, y + 4, 80, 4);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(16, y + 4, 80 * clamp(ratio, 0, 1), 4);
  }

  private drawMenu(): void {
    this.drawBackground();
    this.drawStars();

    this.ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
    this.ctx.fillRect(0, CANVAS_H * 0.22, CANVAS_W, 200);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#00f0ff";
    this.ctx.font = "900 52px Orbitron, sans-serif";
    this.ctx.fillText("SPACE DEFENDER", CANVAS_W / 2, CANVAS_H * 0.35);

    this.ctx.font = "600 18px Rajdhani, sans-serif";
    this.ctx.fillStyle = "rgba(232, 244, 255, 0.85)";
    this.ctx.fillText("Dodge enemy fire · Collect power-ups · Survive the waves", CANVAS_W / 2, CANVAS_H * 0.43);

    this.ctx.fillStyle = "#ffd166";
    this.ctx.font = "700 20px Orbitron, sans-serif";
    this.ctx.fillText("PRESS SPACE OR CLICK TO START", CANVAS_W / 2, CANVAS_H * 0.55);

    this.ctx.fillStyle = "rgba(122, 140, 168, 0.9)";
    this.ctx.font = "16px Rajdhani, sans-serif";
    this.ctx.fillText(`HIGH SCORE: ${this.highScore.toLocaleString()}`, CANVAS_W / 2, CANVAS_H * 0.63);

    this.drawControls( CANVAS_H * 0.74);
  }

  private drawGameOver(): void {
    this.drawBackground();
    this.drawStars();
    this.drawEnemies();
    this.drawBullets();
    this.drawParticles();

    this.ctx.fillStyle = "rgba(5, 6, 15, 0.72)";
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#ff3b6b";
    this.ctx.font = "900 48px Orbitron, sans-serif";
    this.ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H * 0.38);

    this.ctx.fillStyle = "#e8f4ff";
    this.ctx.font = "600 22px Rajdhani, sans-serif";
    this.ctx.fillText(`Final Score: ${this.score.toLocaleString()}`, CANVAS_W / 2, CANVAS_H * 0.48);
    this.ctx.fillText(`Wave Reached: ${this.wave}`, CANVAS_W / 2, CANVAS_H * 0.54);

    if (this.score >= this.highScore && this.score > 0) {
      this.ctx.fillStyle = "#ffd166";
      this.ctx.fillText("NEW HIGH SCORE!", CANVAS_W / 2, CANVAS_H * 0.61);
    }

    this.ctx.fillStyle = "#00f0ff";
    this.ctx.font = "700 18px Orbitron, sans-serif";
    this.ctx.fillText("PRESS SPACE TO RETURN TO MENU", CANVAS_W / 2, CANVAS_H * 0.7);
  }

  private drawCenteredText(title: string, subtitle: string, alpha: number): void {
    this.ctx.fillStyle = `rgba(5, 6, 15, ${alpha * 0.75})`;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#00f0ff";
    this.ctx.font = "900 40px Orbitron, sans-serif";
    this.ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 10);

    this.ctx.fillStyle = "rgba(232, 244, 255, 0.85)";
    this.ctx.font = "18px Rajdhani, sans-serif";
    this.ctx.fillText(subtitle, CANVAS_W / 2, CANVAS_H / 2 + 28);
  }

  private drawControls(y: number): void {
    const lines = [
      "Move: WASD / Arrow Keys",
      "Shoot: Space / Up / Click",
      "Pause: P / Esc",
      "Power-ups: S Shield · R Rapid · W Spread · + Life",
    ];

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "rgba(122, 140, 168, 0.95)";
    this.ctx.font = "15px Rajdhani, sans-serif";
    lines.forEach((line, i) => {
      this.ctx.fillText(line, CANVAS_W / 2, y + i * 20);
    });
  }
}

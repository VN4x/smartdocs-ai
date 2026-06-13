import type { Vec2 } from "./types";

export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private canvas: HTMLCanvasElement;
  pointer = { x: 0, y: 0, down: false };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
    window.addEventListener("keyup", (e) => this.onKeyUp(e));
    canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
    canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    window.addEventListener("pointerup", () => {
      this.pointer.down = false;
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (!this.keys.has(key)) {
      this.justPressed.add(key);
    }
    this.keys.add(key);

    if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "p"].includes(key)) {
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private onPointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.pointer.x = (e.clientX - rect.left) * scaleX;
    this.pointer.y = (e.clientY - rect.top) * scaleY;
  }

  private onPointerDown(e: PointerEvent): void {
    this.pointer.down = true;
    this.onPointerMove(e);
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  wasPressed(key: string): boolean {
    return this.justPressed.has(key.toLowerCase());
  }

  axisX(): number {
    let x = 0;
    if (this.isDown("arrowleft") || this.isDown("a")) x -= 1;
    if (this.isDown("arrowright") || this.isDown("d")) x += 1;
    return x;
  }

  axisY(): number {
    let y = 0;
    if (this.isDown("arrowup") || this.isDown("w")) y -= 1;
    if (this.isDown("arrowdown") || this.isDown("s")) y += 1;
    return y;
  }

  endFrame(): void {
    this.justPressed.clear();
  }

  worldFromPointer(): Vec2 {
    return { x: this.pointer.x, y: this.pointer.y };
  }
}

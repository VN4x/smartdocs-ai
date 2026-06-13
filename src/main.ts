import "./style.css";
import { Game } from "./game/Game";
import { CANVAS_H, CANVAS_W } from "./game/types";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error("Game canvas element not found");
}

canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const game = new Game(canvas);
game.start();

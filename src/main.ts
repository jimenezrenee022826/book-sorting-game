import { LEVELS } from './game/levels';
import { isSolved } from './game/rules';
import { createState, findMovable, placeBook, starsFor } from './game/state';
import type { GameState } from './game/types';
import { draw } from './render/draw';
import type { View } from './render/draw';
import { attachInput } from './render/input';
import type { DragInfo } from './render/input';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Missing #game canvas');
const context = canvas.getContext('2d');
if (!context) throw new Error('2D canvas is not supported in this browser');
const ctx: CanvasRenderingContext2D = context;

let levelIndex = 0;
let state: GameState = createState(LEVELS[levelIndex]!);
let drag: DragInfo | null = null;
let shake: View['shake'] = null;
let overlay: View['overlay'] = null;

function startLevel(index: number): void {
  levelIndex = index;
  state = createState(LEVELS[levelIndex]!);
  drag = null;
  shake = null;
  overlay = null;
}

attachInput(canvas, {
  getState: () => state,
  isLocked: () => overlay !== null,
  onDragChange: (next) => {
    drag = next;
  },
  onDrop: (bookId, target) => {
    // Dropping a book back where it came from is a no-op, not a rejection.
    if (target !== null && findMovable(state, bookId)?.from === target) return;
    const next = target === null ? null : placeBook(state, bookId, target);
    if (!next) {
      shake = { bookId, startedAt: performance.now() };
      return;
    }
    state = next;
    if (isSolved(state)) {
      overlay = { stars: starsFor(state), isLast: levelIndex === LEVELS.length - 1 };
    }
  },
  onClick: () => startLevel(overlay?.isLast ? 0 : levelIndex + 1),
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') startLevel(levelIndex);
});

function frame(now: number): void {
  draw(ctx, { state, drag, shake, overlay, now });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

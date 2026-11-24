import type { Book, Color, GameState } from '../game/types';
import { BOOK_W, CANVAS_H, CANVAS_W, PILE_RECT, layoutBooks, ruleLabel, shelfRect } from './layout';
import type { Rect } from './layout';

const COLORS: Record<Color, string> = {
  red: '#d9534f',
  blue: '#4a7fd1',
  green: '#4fae6a',
  yellow: '#e5c242',
};

export interface View {
  state: GameState;
  /** Book being dragged and the pointer position holding it. */
  drag: { bookId: number; x: number; y: number; offsetX: number; offsetY: number } | null;
  /** Book that was just rejected, for a short shake. */
  shake: { bookId: number; startedAt: number } | null;
  /** Shown when the level is solved. */
  overlay: { stars: number; isLast: boolean } | null;
  now: number;
}

const SHAKE_MS = 300;

function drawBook(ctx: CanvasRenderingContext2D, book: Book, rect: Rect): void {
  ctx.fillStyle = COLORS[book.color];
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(book.genre, rect.x + BOOK_W / 2, rect.y + rect.h / 2);
}

function drawShelves(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.level.shelves.forEach((def, i) => {
    const r = shelfRect(i);
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#3b2a1f';
    ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let slot = 0; slot < def.capacity; slot++) {
      ctx.strokeRect(r.x + 10 + slot * (BOOK_W + 6), r.y + 8, BOOK_W, r.h - 14);
    }
    ctx.fillStyle = '#f3e9dc';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${ruleLabel(def.rule)} (${def.capacity})`, r.x + r.w - 12, r.y + r.h / 2);
  });
}

function drawOverlay(ctx: CanvasRenderingContext2D, overlay: NonNullable<View['overlay']>): void {
  ctx.fillStyle = 'rgba(20,12,28,0.8)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('Level complete!', CANVAS_W / 2, 230);
  ctx.fillStyle = '#ffd24d';
  ctx.font = '56px sans-serif';
  ctx.fillText('★'.repeat(overlay.stars) + '☆'.repeat(3 - overlay.stars), CANVAS_W / 2, 310);
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(overlay.isLast ? 'Click to play again from level 1' : 'Click for the next level', CANVAS_W / 2, 390);
}

export function draw(ctx: CanvasRenderingContext2D, view: View): void {
  const { state, drag, shake, overlay, now } = view;

  ctx.fillStyle = '#2b2233';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#f3e9dc';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.level.name, 40, 24);
  ctx.textAlign = 'right';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Moves: ${state.moves}   (R to restart)`, CANVAS_W - 40, 24);

  drawShelves(ctx, state);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(PILE_RECT.x, PILE_RECT.y, PILE_RECT.w, PILE_RECT.h);
  ctx.fillStyle = 'rgba(243,233,220,0.5)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pile (drop books here to take them off a shelf)', PILE_RECT.x + 6, PILE_RECT.y - 8);

  const rects = layoutBooks(state);
  const books = [...state.pile, ...state.shelves.flat()];
  for (const book of books) {
    if (drag?.bookId === book.id) continue;
    const rect = rects.get(book.id);
    if (!rect) continue;
    let dx = 0;
    if (shake?.bookId === book.id && now - shake.startedAt < SHAKE_MS) {
      dx = Math.sin((now - shake.startedAt) / 20) * 6;
    }
    drawBook(ctx, book, { ...rect, x: rect.x + dx });
  }

  if (drag) {
    const book = books.find((b) => b.id === drag.bookId);
    const rect = rects.get(drag.bookId);
    if (book && rect) {
      drawBook(ctx, book, { ...rect, x: drag.x - drag.offsetX, y: drag.y - drag.offsetY });
    }
  }

  if (overlay) drawOverlay(ctx, overlay);
}

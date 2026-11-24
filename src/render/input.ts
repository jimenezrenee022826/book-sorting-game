import type { GameState, Target } from '../game/types';
import { findMovable } from '../game/state';
import { CANVAS_H, CANVAS_W, PILE_RECT, contains, layoutBooks, shelfRect } from './layout';

export interface DragInfo {
  bookId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

export interface InputHandlers {
  getState: () => GameState;
  /** True while a modal overlay should swallow drags. */
  isLocked: () => boolean;
  onDragChange: (drag: DragInfo | null) => void;
  /** Called on drop. `target` is null when the book was dropped on empty space. */
  onDrop: (bookId: number, target: Target | null) => void;
  onClick: () => void;
}

function canvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) * CANVAS_W) / box.width,
    y: ((event.clientY - box.top) * CANVAS_H) / box.height,
  };
}

function targetAt(state: GameState, x: number, y: number): Target | null {
  for (let i = 0; i < state.level.shelves.length; i++) {
    if (contains(shelfRect(i), x, y)) return i;
  }
  return contains(PILE_RECT, x, y) ? 'pile' : null;
}

export function attachInput(canvas: HTMLCanvasElement, handlers: InputHandlers): void {
  let drag: DragInfo | null = null;

  canvas.addEventListener('pointerdown', (event) => {
    if (handlers.isLocked()) {
      handlers.onClick();
      return;
    }
    const state = handlers.getState();
    const { x, y } = canvasPoint(canvas, event);
    const rects = layoutBooks(state);
    const books = [...state.pile, ...state.shelves.flat()].reverse();
    for (const book of books) {
      const rect = rects.get(book.id);
      if (!rect || !contains(rect, x, y) || !findMovable(state, book.id)) continue;
      drag = { bookId: book.id, x, y, offsetX: x - rect.x, offsetY: y - rect.y };
      canvas.setPointerCapture(event.pointerId);
      handlers.onDragChange(drag);
      return;
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const { x, y } = canvasPoint(canvas, event);
    drag = { ...drag, x, y };
    handlers.onDragChange(drag);
  });

  const finish = (event: PointerEvent): void => {
    if (!drag) return;
    const { x, y } = canvasPoint(canvas, event);
    const finished = drag;
    drag = null;
    handlers.onDragChange(null);
    handlers.onDrop(finished.bookId, targetAt(handlers.getState(), x, y));
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
}

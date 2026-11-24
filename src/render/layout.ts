import type { Book, GameState, ShelfRule } from '../game/types';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CANVAS_W = 800;
export const CANVAS_H = 600;
export const BOOK_W = 36;
const GAP = 6;
const PILE_PER_ROW = 15;

export const PILE_RECT: Rect = { x: 40, y: 446, w: 720, h: 140 };

export function shelfRect(index: number): Rect {
  return { x: 40, y: 50 + index * 100, w: 720, h: 84 };
}

export function bookHeight(book: Book): number {
  return 30 + book.height * 5;
}

export function contains(rect: Rect, px: number, py: number): boolean {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function ruleLabel(rule: ShelfRule): string {
  switch (rule.kind) {
    case 'color':
      return `Color: ${rule.value}`;
    case 'genre':
      return `Genre: ${rule.value}`;
    case 'heightAscending':
      return 'Small to tall';
  }
}

/** Resting rectangle of every book in the state (pile and shelves). */
export function layoutBooks(state: GameState): Map<number, Rect> {
  const rects = new Map<number, Rect>();

  state.shelves.forEach((books, shelfIndex) => {
    const shelf = shelfRect(shelfIndex);
    books.forEach((book, i) => {
      const h = bookHeight(book);
      rects.set(book.id, {
        x: shelf.x + 10 + i * (BOOK_W + GAP),
        y: shelf.y + shelf.h - 4 - h,
        w: BOOK_W,
        h,
      });
    });
  });

  state.pile.forEach((book, i) => {
    const row = Math.floor(i / PILE_PER_ROW);
    const h = bookHeight(book);
    const baseline = PILE_RECT.y + 70 + row * 64;
    rects.set(book.id, {
      x: PILE_RECT.x + 10 + (i % PILE_PER_ROW) * (BOOK_W + GAP),
      y: baseline - h,
      w: BOOK_W,
      h,
    });
  });

  return rects;
}

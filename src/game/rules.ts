import type { Book, GameState, ShelfDef } from './types';

function fitsRule(def: ShelfDef, book: Book, previous: Book | undefined): boolean {
  switch (def.rule.kind) {
    case 'color':
      return book.color === def.rule.value;
    case 'genre':
      return book.genre === def.rule.value;
    case 'heightAscending':
      return previous === undefined || book.height >= previous.height;
  }
}

/** Whether `book` may be appended to the end of the shelf at `shelfIndex`. */
export function canPlace(state: GameState, shelfIndex: number, book: Book): boolean {
  const def = state.level.shelves[shelfIndex];
  const books = state.shelves[shelfIndex];
  if (def === undefined || books === undefined) return false;
  if (books.length >= def.capacity) return false;
  return fitsRule(def, book, books[books.length - 1]);
}

export function isShelfValid(def: ShelfDef, books: Book[]): boolean {
  if (books.length > def.capacity) return false;
  return books.every((book, i) => fitsRule(def, book, books[i - 1]));
}

export function isSolved(state: GameState): boolean {
  return (
    state.pile.length === 0 &&
    state.level.shelves.every((def, i) => isShelfValid(def, state.shelves[i] ?? []))
  );
}

import { canPlace } from './rules';
import type { Book, GameState, Level, Target } from './types';

export function createState(level: Level): GameState {
  return {
    level,
    pile: [...level.books],
    shelves: level.shelves.map(() => []),
    moves: 0,
  };
}

interface Located {
  book: Book;
  from: Target;
}

/** Finds a book the player can pick up: any pile book, or the last book on a shelf. */
export function findMovable(state: GameState, bookId: number): Located | null {
  const inPile = state.pile.find((b) => b.id === bookId);
  if (inPile) return { book: inPile, from: 'pile' };
  for (let i = 0; i < state.shelves.length; i++) {
    const last = state.shelves[i]?.at(-1);
    if (last?.id === bookId) return { book: last, from: i };
  }
  return null;
}

/**
 * Moves a book to `target`. Returns the new state, or null when the move is
 * illegal (book not movable, same place, or the shelf rejects it). The input
 * state is never mutated.
 */
export function placeBook(state: GameState, bookId: number, target: Target): GameState | null {
  const found = findMovable(state, bookId);
  if (!found || found.from === target) return null;
  if (target !== 'pile' && !canPlace(state, target, found.book)) return null;

  const pile = found.from === 'pile' ? state.pile.filter((b) => b.id !== bookId) : [...state.pile];
  const shelves = state.shelves.map((books, i) =>
    i === found.from ? books.slice(0, -1) : [...books],
  );
  if (target === 'pile') pile.push(found.book);
  else shelves[target]?.push(found.book);

  return { ...state, pile, shelves, moves: state.moves + 1 };
}

export function starsFor(state: GameState): 1 | 2 | 3 {
  const [three, two] = state.level.starMoves;
  if (state.moves <= three) return 3;
  if (state.moves <= two) return 2;
  return 1;
}

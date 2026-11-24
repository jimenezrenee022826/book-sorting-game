import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import { canPlace, isShelfValid, isSolved } from './rules';
import { createState, findMovable, placeBook, starsFor } from './state';
import type { Book, GameState, Level } from './types';

const book = (id: number, color: Book['color'], genre: Book['genre'], height: number): Book => ({
  id,
  color,
  genre,
  height,
});

function tinyLevel(overrides: Partial<Level> = {}): Level {
  return {
    name: 'tiny',
    books: [book(0, 'red', 'F', 1), book(1, 'blue', 'S', 2), book(2, 'red', 'S', 3)],
    shelves: [
      { rule: { kind: 'color', value: 'red' }, capacity: 2 },
      { rule: { kind: 'genre', value: 'S' }, capacity: 1 },
    ],
    starMoves: [3, 5],
    ...overrides,
  };
}

describe('canPlace', () => {
  it('accepts a book matching a color rule and rejects others', () => {
    const state = createState(tinyLevel());
    expect(canPlace(state, 0, state.pile[0]!)).toBe(true);
    expect(canPlace(state, 0, state.pile[1]!)).toBe(false);
  });

  it('accepts a book matching a genre rule', () => {
    const state = createState(tinyLevel());
    expect(canPlace(state, 1, state.pile[1]!)).toBe(true);
    expect(canPlace(state, 1, state.pile[0]!)).toBe(false);
  });

  it('rejects placement on a full shelf', () => {
    let state: GameState = createState(tinyLevel());
    state = placeBook(state, 1, 1)!;
    expect(canPlace(state, 1, book(2, 'red', 'S', 3))).toBe(false);
  });

  it('enforces ascending height from the last book on the shelf', () => {
    const level = tinyLevel({
      shelves: [{ rule: { kind: 'heightAscending' }, capacity: 3 }],
    });
    let state = createState(level);
    state = placeBook(state, 1, 0)!; // height 2
    expect(canPlace(state, 0, book(0, 'red', 'F', 1))).toBe(false);
    expect(canPlace(state, 0, book(2, 'red', 'S', 3))).toBe(true);
  });

  it('returns false for an unknown shelf index', () => {
    const state = createState(tinyLevel());
    expect(canPlace(state, 9, state.pile[0]!)).toBe(false);
  });
});

describe('isShelfValid', () => {
  it('flags overflow and rule violations', () => {
    const def = { rule: { kind: 'color', value: 'red' }, capacity: 1 } as const;
    expect(isShelfValid(def, [book(0, 'red', 'F', 1)])).toBe(true);
    expect(isShelfValid(def, [book(0, 'red', 'F', 1), book(1, 'red', 'F', 1)])).toBe(false);
    expect(isShelfValid(def, [book(2, 'blue', 'F', 1)])).toBe(false);
  });
});

describe('placeBook', () => {
  it('moves a book from the pile to a shelf without mutating the input', () => {
    const before = createState(tinyLevel());
    const after = placeBook(before, 0, 0)!;
    expect(after.pile.map((b) => b.id)).toEqual([1, 2]);
    expect(after.shelves[0]!.map((b) => b.id)).toEqual([0]);
    expect(after.moves).toBe(1);
    expect(before.pile).toHaveLength(3);
    expect(before.moves).toBe(0);
  });

  it('rejects a rule-breaking drop', () => {
    expect(placeBook(createState(tinyLevel()), 1, 0)).toBeNull();
  });

  it('rejects dropping a book where it already is', () => {
    expect(placeBook(createState(tinyLevel()), 0, 'pile')).toBeNull();
  });

  it('only lets the last book on a shelf be picked up', () => {
    let state = createState(tinyLevel());
    state = placeBook(state, 0, 0)!;
    state = placeBook(state, 2, 0)!;
    expect(findMovable(state, 0)).toBeNull();
    expect(findMovable(state, 2)?.from).toBe(0);
  });

  it('moves a shelf book back to the pile and onto another shelf', () => {
    let state = createState(tinyLevel());
    state = placeBook(state, 2, 0)!;
    state = placeBook(state, 2, 1)!;
    expect(state.shelves[0]).toHaveLength(0);
    expect(state.shelves[1]!.map((b) => b.id)).toEqual([2]);
    state = placeBook(state, 2, 'pile')!;
    expect(state.pile.map((b) => b.id)).toContain(2);
  });

  it('returns null for an unknown book id', () => {
    expect(placeBook(createState(tinyLevel()), 99, 0)).toBeNull();
  });
});

describe('isSolved and starsFor', () => {
  it('is solved only when the pile is empty and shelves are valid', () => {
    const level = tinyLevel({
      books: [book(0, 'red', 'F', 1), book(1, 'red', 'S', 2)],
      shelves: [{ rule: { kind: 'color', value: 'red' }, capacity: 2 }],
    });
    let state = createState(level);
    expect(isSolved(state)).toBe(false);
    state = placeBook(state, 0, 0)!;
    expect(isSolved(state)).toBe(false);
    state = placeBook(state, 1, 0)!;
    expect(isSolved(state)).toBe(true);
  });

  it('awards stars by move count', () => {
    const base = createState(tinyLevel());
    expect(starsFor({ ...base, moves: 3 })).toBe(3);
    expect(starsFor({ ...base, moves: 5 })).toBe(2);
    expect(starsFor({ ...base, moves: 6 })).toBe(1);
  });
});

/** Backtracking solver: place books in height order, trying every legal shelf. */
function solve(state: GameState): GameState | null {
  if (state.pile.length === 0) return isSolved(state) ? state : null;
  const next = [...state.pile].sort((a, b) => a.height - b.height)[0]!;
  for (let i = 0; i < state.shelves.length; i++) {
    const moved = placeBook(state, next.id, i);
    const solved = moved && solve(moved);
    if (solved) return solved;
  }
  return null;
}

describe('levels', () => {
  it.each(LEVELS.map((level, i) => [i + 1, level] as const))('level %i is solvable', (_n, level) => {
    const solved = solve(createState(level));
    expect(solved).not.toBeNull();
    expect(isSolved(solved!)).toBe(true);
  });

  it.each(LEVELS.map((level, i) => [i + 1, level] as const))(
    'level %i has unique book ids and enough shelf room',
    (_n, level) => {
      const ids = new Set(level.books.map((b) => b.id));
      expect(ids.size).toBe(level.books.length);
      const room = level.shelves.reduce((sum, s) => sum + s.capacity, 0);
      expect(room).toBeGreaterThanOrEqual(level.books.length);
    },
  );

  it('has 3-star thresholds that a perfect solve can reach', () => {
    for (const level of LEVELS) {
      const solved = solve(createState(level))!;
      expect(starsFor(solved)).toBe(3);
    }
  });
});

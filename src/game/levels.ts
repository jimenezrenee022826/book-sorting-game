import type { Book, Color, Genre, Level, ShelfDef } from './types';

type Spec = [color: Color, genre: Genre, height: number];

/** Small seeded PRNG so every level's pile order is the same on each run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeBooks(specs: Spec[], seed: number): Book[] {
  const books = specs.map(([color, genre, height], id) => ({ id, color, genre, height }));
  const random = mulberry32(seed);
  for (let i = books.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [books[i], books[j]] = [books[j]!, books[i]!];
  }
  return books;
}

const colorShelf = (value: Color, capacity: number): ShelfDef => ({
  rule: { kind: 'color', value },
  capacity,
});
const genreShelf = (value: Genre, capacity: number): ShelfDef => ({
  rule: { kind: 'genre', value },
  capacity,
});

/** `perGroup` books for each value, with the other attributes cycling. */
function grouped(colors: Color[], genres: Genre[], perGroup: number, by: 'color' | 'genre'): Spec[] {
  const specs: Spec[] = [];
  const groups = by === 'color' ? colors : genres;
  groups.forEach((_, g) => {
    for (let n = 0; n < perGroup; n++) {
      const color = by === 'color' ? colors[g]! : colors[n % colors.length]!;
      const genre = by === 'genre' ? genres[g]! : genres[n % genres.length]!;
      specs.push([color, genre, (n % 3) + 1]);
    }
  });
  return specs;
}

const level1: Level = {
  name: 'First Shelves',
  books: makeBooks(grouped(['red', 'blue', 'green'], ['F', 'S', 'H'], 3, 'color'), 1),
  shelves: [colorShelf('red', 3), colorShelf('blue', 3), colorShelf('green', 3)],
  starMoves: [9, 12],
};

const level2: Level = {
  name: 'Rainbow Row',
  books: makeBooks(grouped(['red', 'blue', 'green', 'yellow'], ['F', 'S', 'H', 'M'], 4, 'color'), 2),
  shelves: [colorShelf('red', 4), colorShelf('blue', 4), colorShelf('green', 4), colorShelf('yellow', 4)],
  starMoves: [16, 20],
};

const level3: Level = {
  name: 'By Genre',
  books: makeBooks(grouped(['red', 'blue', 'green', 'yellow'], ['F', 'S', 'H'], 4, 'genre'), 3),
  shelves: [genreShelf('F', 4), genreShelf('S', 4), genreShelf('H', 4)],
  starMoves: [12, 16],
};

const level4: Level = {
  name: 'Small to Tall',
  books: makeBooks(
    Array.from({ length: 10 }, (_, i): Spec => ['red', 'F', i + 1]),
    4,
  ),
  shelves: [
    { rule: { kind: 'heightAscending' }, capacity: 5 },
    { rule: { kind: 'heightAscending' }, capacity: 5 },
  ],
  starMoves: [12, 16],
};

// 18 books exactly fill 18 slots, and a few books fit two shelves, so the
// player has to plan which shelf takes which.
const level5Specs: Spec[] = [
  ['red', 'F', 1], ['red', 'F', 2], ['red', 'F', 3],
  ['blue', 'F', 1], ['blue', 'F', 2], ['blue', 'F', 3],
  ['red', 'S', 1], ['red', 'S', 2],
  ['blue', 'H', 1], ['blue', 'H', 2],
  ['green', 'S', 1], ['green', 'S', 2], ['green', 'S', 3],
  ['yellow', 'H', 1], ['yellow', 'H', 2], ['yellow', 'H', 3],
  ['red', 'H', 1],
  ['blue', 'S', 1],
];

const level5: Level = {
  name: 'Tight Fit',
  books: makeBooks(level5Specs, 5),
  shelves: [colorShelf('red', 4), colorShelf('blue', 4), genreShelf('S', 5), genreShelf('H', 5)],
  starMoves: [18, 24],
};

export const LEVELS: Level[] = [level1, level2, level3, level4, level5];

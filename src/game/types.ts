export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type Genre = 'F' | 'S' | 'H' | 'M';

export interface Book {
  id: number;
  color: Color;
  genre: Genre;
  height: number;
}

export type ShelfRule =
  | { kind: 'color'; value: Color }
  | { kind: 'genre'; value: Genre }
  | { kind: 'heightAscending' };

export interface ShelfDef {
  rule: ShelfRule;
  capacity: number;
}

export interface Level {
  name: string;
  books: Book[];
  shelves: ShelfDef[];
  /** Move counts for 3 stars and 2 stars; anything above is 1 star. */
  starMoves: [number, number];
}

export interface GameState {
  level: Level;
  pile: Book[];
  /** Books on each shelf, left to right. */
  shelves: Book[][];
  moves: number;
}

/** Where a book can be dropped: back on the pile, or a shelf by index. */
export type Target = 'pile' | number;

# book-sorting-game

A small browser game inspired by cozy book-tidying games: a messy pile of books, and the player drags each one onto the right shelf (by color, genre, or height). The prototype is one screen with 5 levels and placeholder art, to check that the loop is fun before investing in polish.

## Run and test

- `npm install`
- `npm run dev`: play at the URL Vite prints
- `npm test`: unit tests, including a solver that checks every level is solvable
- `npm run build`: type-check and production build

## How to play

Drag a book from the pile onto a shelf. A shelf rejects books that break its rule (color, genre, or small-to-tall order) or that exceed its capacity. Drag the last book on a shelf back to the pile to undo. Fewer moves earn more stars. Press `R` to restart a level.

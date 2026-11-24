# book-sorting-game

Browser prototype: drag books from a messy pile onto the correct shelves. 5 levels, placeholder art.

## Stack
- TypeScript, Vite, Vitest. Plain canvas 2D, no game framework.

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test`
- Lint/typecheck: `npm run lint` (`tsc --noEmit`; there is no separate linter)
- Build: `npm run build`

## Layout
- `src/game/`: pure rules, state, and levels. No DOM. Tests live in `game.test.ts`.
- `src/render/`: `layout.ts` (positions, shared by drawing and hit-testing), `draw.ts`, `input.ts` (pointer drag)
- `src/main.ts`: game loop and level flow
- `index.html`: the single canvas (800x600)

## Conventions and gotchas
- Keep sorting rules separate from rendering so levels are testable without a browser.
- Books are only ever appended to a shelf's end; only the last book on a shelf can be picked up.
- Pile order is a seeded shuffle (`levels.ts`), so levels are identical on every run.
- A level is only valid if the backtracking solver in `game.test.ts` can solve it. Add a level, run the tests.
- Inspired by the Play Store app "Tidy Up Books: Magic Librarian", whose listing could not be read. Mechanics are our own design; do not assume they match the original.
- No secrets needed; `.env.example` is intentionally empty.

Workspace rules in `../../CLAUDE.md` still apply; anything here overrides them for this project.

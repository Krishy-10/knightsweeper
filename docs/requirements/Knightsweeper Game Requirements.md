# Knightsweeper: Game Requirements

2026-09-19 · Product Specification (v2.0 Chess Battlefield Edition)

## Concept

**Knightsweeper = chess-knight movement + Minesweeper-style deduction on a mined chess battlefield.**

Each number counts the mines one legal knight jump away, and your objective is to cross the battlefield alive and **capture the enemy King**.

You command a chess knight on an 8×8 chessboard embedded with hidden landmines, and you have two knights (lives) to spend. If the first knight steps on a mine, the second takes its place on the previous safe square. The enemy King stands stationary on the opponent ranks and is visible from the start. You can only move by knight jumps, so every advance is a tactical deduction based on the numbers you have already uncovered.

The core relationship that carries the game:
**The clue has the same shape as the move.**
A number describes exactly the squares your knight could jump to next.

Decisions:
- **Movement:** Knight-only.
- **Objective:** Capture the enemy King. The King does not move, attack, or check; it is purely the destination objective.
- **Two knights (two lives):** Safe respawn on the square from which the fatal jump was made.
- **Battlefield Identity:** Each generated puzzle is presented as a **Battlefield** (e.g. `MEDIUM · BATTLEFIELD #42817`).
- **Difficulty Modes:** Easy (8 mines, 12.5% density), Medium (16 mines, 25% density, default), Hard (24 mines, 37.5% density).

### Product Lifecycle & Evolution Note
This document reflects the finalized product requirements following iterative PM and engineering cycles:
1. **Thematic Realignment:** Nautical motifs (open sea, buoys, depth soundings) were replaced with an authentic chess battlefield theme.
2. **Objective Definition:** Evolved from reaching a generic gold star to capturing the enemy King ($\text{♔}$) with hit-stop freeze, King topple, and victory fanfare.
3. **Difficulty Balance:** Calibrated from a single 10-mine default into 8 / 16 / 24 mines with dynamic counter synchronization and fallback easing.
4. **UX Ergonomics:** PRNG seed jargon abstracted into user-friendly Battlefield numbers; added board elevation tray, framing highlights, and ambient lighting.
5. **Acoustic Design:** Procedural synthesis of wood-on-wood impacts, sub-bass detonations, and brass fanfares replacing synthetic sine waves.

### Project Lifecycle Documentation Suite
- **Planning & Requirements:** [Knightsweeper Game Requirements.md](Knightsweeper%20Game%20Requirements.md) (this document)
- **Architecture & Domain Models:** [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Engineering Decisions & Tradeoffs:** [../ENGINEERING-JOURNAL.md](../ENGINEERING-JOURNAL.md)
- **Computer Science & Algorithms:** [../LEARNING-GUIDE.md](../LEARNING-GUIDE.md)
- **Verification & Testing (PM / User Perspective):** [../TESTING.md](../TESTING.md)

---

## Core Rules

1. **Board & Positions:** The board is an 8×8 chessboard. You start on one of the bottom two ranks (ranks 1–2, files b–g, never a corner). The enemy King stands on one of the top two ranks (ranks 7–8, at least 3 jumps from start). Both are visible from the first move.
2. **Movement:** You can only click/tap a square your knight can legally jump to from where it currently stands. No other square is jumpable.
3. **Clues:** Every square you land on shows a clue: the number of mines on the squares a knight could jump to from there (0 to 8). The clue remains on the board.
4. **Mine Detonation & Respawn:** Landing on a mine detonates it, spending that knight. The entire 8×8 battlefield container jolts with an explosive shake. The mine remains revealed, scorched, and disabled. Your second knight steps in on the safe square the first knight jumped from. Losing the second knight ends the game in defeat and reveals the full minefield with the enemy King remaining standing.
5. **Victory:** Reaching the enemy King's square through a legal knight jump initiates a staged capture: hit-stop impact freeze, King topple, and gold/ivory particle celebration with victory fanfare (`KING CAPTURED`).

### Supporting Rules
- **Zero Cascade:** When a clue is 0, nothing opens automatically. A 0 proves that all squares a knight can jump to from there are safe; you jump onto those squares yourself to reveal their numbers.
- **Walking:** Explored squares are never dangerous; you can jump onto them freely to navigate across known ground.
- **Flags:** Right-click or toggle Flag mode to plant tactical warning flags. A flagged square cannot be jumped onto until unflagged, protecting against misclicks.
- **No Free Peeks:** The game never highlights unopened safe squares automatically. Working that out is the puzzle.

### Two-Knight Life System
Only one knight is on the board at a time:
- The detonated mine stays revealed and can never be stepped on again.
- The replacement knight appears on the square the dead knight jumped from (which is proven safe).
- Explored squares, clues, and flags remain intact.
- Losing both knights ends the game in defeat.

---

## Battlefield Generation & Difficulty

A battlefield is valid only if the enemy King can be reached purely through logical deduction, with zero forced guesses.

| Difficulty | Target Mines | Density | Start Square | Enemy King Square |
| --- | --- | --- | --- | --- |
| **Easy** | 8 | 12.5% | Bottom two ranks (files b–g, never corner, never mine) | Top two ranks (never mine, $\ge 3$ jumps from start) |
| **Medium (Default)** | 16 | 25.0% | Bottom two ranks (files b–g, never corner, never mine) | Top two ranks (never mine, $\ge 3$ jumps from start) |
| **Hard** | 24 | 37.5% | Bottom two ranks (files b–g, never corner, never mine) | Top two ranks (never mine, $\ge 3$ jumps from start) |

### Generation Steps
1. Pick the start square and enemy King square according to rank and distance rules.
2. Distribute candidate mines at random using the deterministic PRNG.
3. Run the deduction solver.
4. If the solver reaches the enemy King without guessing and requires at least 3 rounds of deduction, accept the battlefield. Otherwise, resample.
5. If 500 attempts fail, ease by reducing mine count by 1 until solvable. Counters dynamically reflect the actual generated mine count.
6. The battlefield number corresponds to the internal seed; identical `seed + difficulty` reproduces the exact identical layout on **Retry Battlefield**.

---

## Screen & Controls

- **Chessboard:** 8×8 grid with alternating light and dark squares, rank coordinates (8 to 1), and file coordinates (a to h).
- **Knight Piece:** Displayed on its current square with a small tactical badge indicating its current clue.
- **Enemy King:** Distinctive chess King piece ($\text{♔}$) with crown and cross.
- **Legal Jumps:** Dotted indicators show geometric knight movement rules.
- **Mines:** Tactically styled landmines. Detonated mines display scorch marks and fallen knight markers.
- **Status Bar:** Knights remaining (`♞ ♞`), moves taken, remaining mines counter, and battlefield status tag.
- **Controls:** Difficulty selector (`Easy | Medium | Hard`), Flag mode toggle, Sound toggle, Theme toggle, **Retry Battlefield**, and **New Battlefield**.

# Knightsweeper: Engineering Journal

This journal documents key architectural and software-engineering decisions made during the transformation of Knightsweeper from a monolithic prototype into a modular, production-grade Next.js, React, and TypeScript application.

Each entry details the real-world engineering problem, existing behavior, decision rationale, concrete implementation, tradeoffs, and key computer-science lessons.

---

## Entry 01: 1D Flattened Integer Keys vs. 2D Coordinate Objects

### Problem
In an 8×8 grid game, every square can be indexed by a rank and file pair `(row, col)`. Representing coordinates throughout an application frequently causes reference equality traps in JavaScript/TypeScript:
`{ row: 4, col: 4 } !== { row: 4, col: 4 }`
Using coordinate objects or strings like `"4,4"` creates performance overhead, garbage collection churn, and requires continuous string serialization/parsing when performing set membership tests (`Set.has`).

### Existing Prototype Behavior
The prototype uses a flat integer key: `key(r, c) = r * 8 + c`, mapping all 64 squares onto integers `0..63`. Row 0 represents rank 8 (top), and row 7 represents rank 1 (bottom).

### Decision
Preserve and formalize the 1D integer index pattern as a dedicated TypeScript type alias:
`export type SquareKey = number;`
Provide pure utility functions (`rowOf`, `colOf`, `coordsOf`, `nameOf`, `keyFromName`) in `src/core/coordinates.ts`.

### Reasoning
- **Primitive Value Comparison:** Numbers compare by value in JavaScript. `Set<number>.has(k)` is an $O(1)$ hash table lookup without memory allocation.
- **Memory Compactness & Efficiency:** A 64-element flat array (`T[]`) avoids nested reference indirection compared to arrays of arrays (`T[][]`), keeping memory layout contiguous and access straightforward.
- **Bijective Mapping:** Every integer in `[0..63]` corresponds to exactly one square on the board:
  $$\text{key}(r, c) = r \cdot 8 + c$$
  $$r = \lfloor k / 8 \rfloor, \quad c = k \pmod 8$$

### Tradeoffs
- Code reading arithmetic requires team awareness that row 0 corresponds to rank 8.
- Grid dimension (8) is baked into the math; if rectangular boards are introduced in the future, the multiplier must become dynamic.

### What to Learn From This
Coordinate systems should match the storage and access patterns of your runtime. When working with small, fixed-size mathematical spaces (like a 64-square chessboard), integer flattening provides the highest performance and cleanest value semantics.

---

## Entry 02: Precomputed Adjacency Table vs. On-Demand Vector Math

### Problem
A knight moves by making an $L$-shaped jump: 2 squares in one orthogonal direction and 1 square perpendicularly. During gameplay, pathfinding, and clue calculations, we frequently query "which squares can a knight jump to from square $k$?" Calculating vectors and checking boundary conditions thousands of times per second (especially inside procedural generation loops) wastes CPU cycles.

### Existing Prototype Behavior
Precomputes `J[k]` at load time as an array of 64 arrays containing valid target indices for each square.

### Decision
Extract and strongly type the knight movement graph into `src/core/graph.ts` as `KNIGHT_GRAPH: ReadonlyArray<readonly SquareKey[]>`.

### Reasoning
- **Static Topology:** The topology of an 8×8 chessboard never changes during execution. The knight graph has exactly $|V| = 64$ vertices and $|E| = 336$ directed edges (168 undirected edges).
- **Constant Time Lookup:** Looking up moves is a single array index read `KNIGHT_GRAPH[k]`, achieving $O(1)$ access without trigonometric or vector boundary checks.
- **Memory Footprint:** With only 336 total directed edge entries across the entire board, the precomputed adjacency structure is compact and fits comfortably in memory.

### Tradeoffs
- Graph precomputation executes once at module evaluation with negligible overhead.

### What to Learn From This
When the problem space has an immutable graph topology, precomputing the adjacency list transforms repeated runtime boundary verification into trivial constant-time pointer indexing.

---

## Entry 03: Mulberry32 PRNG Determinism and Board Reproducibility

### Problem
Standard `Math.random()` cannot be seeded in JavaScript. Without seeded randomness, board generation is non-reproducible: players cannot replay the same board layout, cannot share challenging puzzle seeds with peers, and automated unit tests cannot assert deterministic board structures.

### Existing Prototype Behavior
Uses a custom 32-bit PRNG function based on the Mulberry32 algorithm, taking an unsigned 32-bit integer seed and returning pseudo-random floats in `[0, 1)`.

### Decision
Encapsulate the exact Mulberry32 PRNG in `src/core/random.ts` along with a Fisher-Yates array shuffling implementation.

### Reasoning
- **Exact Parity:** Keeping the Mulberry32 bit shifts and multiplier constants identical guarantees 100% backward compatibility with boards generated by the prototype.
- **Deterministic Reproducibility:** Mulberry32 provides a lightweight 32-bit generator with a period of $2^{32}$, well-suited for fast, repeatable procedural board generation across client sessions without external dependencies.
- **Separation of Concerns:** Separating the PRNG function generator `mulberry32(seed)` from the board generator allows testing the generator with arbitrary seed inputs.

### Tradeoffs
- Mulberry32 is not cryptographically secure, which is completely irrelevant for puzzle generation where speed and reproducibility are paramount.

### What to Learn From This
Procedural generation requires deterministic state machines. Decoupling random number generation from global system state enables replayability, challenge sharing, and regression testing.

---

## Entry 04: Pure Rejection Sampling with Easing vs. Constructive Generation

### Problem
We need to generate a board with 10 mines where:
1. Start is on ranks 1..2 (files b..g, never a corner).
2. Exit is on ranks 7..8 (at least 3 knight jumps away).
3. The board is guaranteed solvable purely by logic without guessing.
4. The board requires at least 3 rounds of deduction (not trivially simple).

Should we constructively place mines along a solvable path, or generate random configurations and test them using a solver (rejection sampling)?

### Existing Prototype Behavior
Places random candidate mines, tests them with the solver, rejects invalid boards, and eases the mine count by 1 if 500 attempts fail.

### Decision
Retain rejection sampling with solver verification in `src/core/generator.ts`, parameterized by configurable constraints.

### Reasoning
- **Variety & Organic Layouts:** Constructive placement algorithms tend to produce predictable artifacts or corridor bias. Candidate mine generation samples randomly across candidate squares before solver validation filters for solvability, yielding varied and natural tactical layouts.
- **Solver as Arbiter:** Using the deduction solver as an acceptance oracle guarantees that accepted boards strictly meet player-facing fairness criteria.
- **Speed:** Because board verification is fast ($O(|V| + |E|)$ graph traversal) and typical candidate boards pass in relatively few attempts, generation completes imperceptibly without noticeable frame lag.
- **Fallback Easing:** If a particularly constrained seed fails after 500 attempts, decreasing `mineCount` prevents CPU hangs while preserving the game invariant.

### Tradeoffs
- Theoretical worst-case unbound runtime, mitigated by a hard cap `TRIES_HARD_CAP = 20000`.

### What to Learn From This
When the verification function is fast ($O(|V| + |E|)$), rejection sampling paired with constraint validation allows generating diverse, organic configurations while strictly enforcing solvability and gameplay invariants.

---

## Entry 05: Single-Clue Constraint Propagation in the Solver

### Problem
How can an automated solver verify that a player can reach the exit without ever being forced to take a 50/50 guess?

### Existing Prototype Behavior
The solver implements a two-phase loop:
1. **Walk Phase:** The solver walks to every square it can reach across squares already proven `safe`.
2. **Deduction Phase:** When stuck, it evaluates clues on all opened squares:
   - If `clue === count(knownMines)`: all remaining unknown neighbors are proven safe.
   - If `clue - count(knownMines) === count(unknownNeighbors)`: all remaining unknown neighbors are proven mines.
If neither deduction yields new knowledge, the solver halts and rejects the board.

### Decision
Formalize this algorithm in `src/core/solver.ts` with comprehensive unit test coverage verifying that ambiguous boards are rejected.

### Reasoning
- **Single-Clue Simplicity:** Humans naturally solve Minesweeper-style puzzles by scanning individual numbers before attempting multi-clue linear algebra. Limiting the generation check to single-clue deductions ensures that generated boards feel fair and approachable without requiring obscure multi-variable matrix reductions.
- **Deduction Round Metric:** Tracking the number of deduction passes (`rounds >= 3`) prevents trivially simple boards (e.g. where the knight could walk directly to the exit on move 1).

### Tradeoffs
- Some boards that a human master could solve via overlapping clue subsets are rejected. This is an intentional design choice favoring fun and fairness over esoteric complexity.

### What to Learn From This
Solvers in puzzle generation should model the target player's cognitive reasoning rather than using brute-force search. A solver that models human deduction ensures the game generates puzzles humans can solve.

---

## Entry 06: Two-Knight Life System & Previous-Square Respawn Invariant

### Problem
Landing on a hidden mine in traditional Minesweeper results in instant death. Knightsweeper introduces a two-knight life system. What happens to the board state when the first knight dies?

### Existing Prototype Behavior & Requirements
1. The hit mine is permanently revealed and can never be stepped on again.
2. The knight counter decrements from 2 to 1.
3. The replacement knight respawns on the square from which the fatal jump was made.
4. All previously opened squares, clues, and placed flags remain unchanged.

### Decision
Enforce this invariant inside the pure state reducer `src/core/gameReducer.ts`:
When `mines.has(target)` and `knights > 1`:
- `hit.add(target)`
- `knights: state.knights - 1`
- `pos: state.pos` (the originating square!)
- `message: "Mine detonated on ... Your second knight takes the field on ..."`

### Reasoning
- **Zero Information Leakage:** If the game searched for the "nearest safe square" to respawn the player, the choice of square would leak secret information about mine positions. Respawning at the square the player just jumped from is 100% safe because that square was already opened and proven safe.
- **Physical Continuity:** It feels tactically coherent: the scout was lost, and the commander holds the previous outpost.

### What to Learn From This
Game rules that handle player errors must not accidentally violate the fog-of-war. Returning the player to a known-safe state preserves information integrity.

---

## Entry 07: Pure Reducer Architecture with Decoupled Sound Events

### Problem
In the original prototype, UI event handlers directly mutated global state variables, manually redrew the DOM, and triggered audio oscillator calls in a single monolithic block. This makes state transitions untestable without a browser DOM and Web Audio runtime.

### Decision
Extract all game logic into a pure functional reducer:
`gameReducer(state: GameState, action: GameAction): { state: GameState, soundEvents: SoundEvent[] }`

### Reasoning
- **Deterministic Testing:** We can test movement rules, flag toggling, mine detonation, victory, and loss completely in memory using standard Node.js test runners (Vitest) swiftly without headless browser dependencies.
- **Side-Effect Free:** The reducer never touches `window.AudioContext` or `localStorage`. It simply emits descriptive sound events (`{ type: 'land', clue: 2 }`, `{ type: 'mine' }`, `{ type: 'win' }`). The React hook `useKnightsweeper` listens to these events and passes them to `SoundEngine`.

### Tradeoffs
- Creates a small wrapper hook `useKnightsweeper` to bridge React state and audio side effects.

### What to Learn From This
Decoupling state transitions from side effects (audio, storage, DOM) is the fundamental principle of robust frontend architecture. It enables comprehensive unit testing of core mechanics independently of React and browser APIs.

---

## Entry 08: Zero Cascade & Clue-Neighborhood Inspection

### Problem
In traditional Minesweeper, clicking a 0 reveals all adjacent squares automatically (cascade). In Knightsweeper, should a 0 auto-open all 8 knight-jump squares?

### Existing Prototype Behavior & Requirements
Zero cascade is explicitly disabled. Landing on a 0 proves that all squares a knight could jump to are safe, but does not open them. The player jumps to them manually to read their individual soundings.
Additionally, hovering over an opened square (or clicking an opened square you cannot immediately jump to) outlines its 8 counted squares (clue peek).

### Decision
Preserve the zero-cascade rule. Implement reactive neighborhood peeking by calculating the active peek square in `useKnightsweeper.ts` and passing `isCounted` to `Square.tsx`.

### Reasoning
- **Spatial Confusion of Knight Moves:** Knight jumps scatter in an alternating checkerboard pattern across 2 ranks and 2 files. An automatic opening of a 0 would scatter 8 numbers across distant squares, creating immediate visual chaos and disorientation.
- **Player Empowerment:** By making the player physically jump onto the proven-safe squares, the player maintains clear mental tracking of their navigation frontier.

### What to Learn From This
Game mechanics cannot always be blindly copied from classic games when the underlying topology changes. What works for adjacent grid neighbors (orthogonals and diagonals) creates confusion for non-local jump graphs.

---

## Entry 09: Chess Battlefield Identity, Enemy King Objective, and Battlefield Numbering

### Problem
The initial prototype used a maritime / sea-chart aesthetic with open water, depth soundings, buoys, and a harbor star exit. While functional as an art overlay, it created an awkward conceptual mismatch: why was a chess knight navigating an ocean harbor? Furthermore, exposing internal implementation terminology like "Seed" or "Board Seed" forced non-technical players to grapple with mathematical PRNG concepts rather than intuitive game progression.

### Existing Behavior
- Theme: Sea charts, open water, depth soundings, buoy mines, harbor star exit.
- Player-facing text: "Board 42817", "Retry board", "New board".
- Difficulty: Fixed at 10 mines (with fallback easing).

### Decision
1. **Thematic Realignment:** Completely strip all maritime language and motifs. Establish a restrained, elegant **chess battlefield** identity where an 8×8 chessboard is the visual centerpiece.
2. **Objective:** Replace the gold harbor star with the **enemy King ($\text{♔}$)**. The core objective becomes: *Cross the minefield and capture the enemy King.* Reaching the King triggers a capture reaction where the King topples, while in defeat the enemy King remains standing.
3. **Battlefield Terminology:** Rebrand generated puzzles as **Battlefield #42817**, with actions **New Battlefield** and **Retry Battlefield**. The term "seed" is completely removed from player-facing UI and modals while preserved internally in the deterministic PRNG pipeline.
4. **Three-Tier Difficulty Modes (Initial Calibration, see Entry 10 for final 8/16/24):**
   - **Easy:** 8 mines
   - **Medium (Default):** 10 mines (later calibrated to 16)
   - **Hard:** 12 mines (later calibrated to 24)
   The selected difficulty is integrated into the deterministic battlefield reproduction (`seed + difficulty`), with a prominent segmented selector in the UI.

### Reasoning
- **Organic Thematic Harmony:** The game mechanic is fundamentally chess-knight geometry plus Minesweeper deduction. Aligning the visual identity to a mined chess battlefield and setting the objective as capturing the enemy King makes the game immediately intuitive to anyone familiar with chess.
- **Clear Victory/Defeat Semantics:** In chess, capturing the King ends the game. Having the King topple on victory and stand defiant on defeat provides an instant, dramatic visual contrast.
- **Abstraction of Complexity:** Players intuitively grasp "Battlefield #42817" as a level code or challenge number without needing to understand pseudo-random number generator seeds.

### Tradeoffs
- Maintained internal identifiers (`seed`, `exit`, `mines`) in the core domain to avoid unnecessary refactoring churn, while strictly separating player-facing vocabulary from internal implementation names.

### What to Learn From This
Thematic design should emerge directly from the core game mechanic rather than being forced as an arbitrary decorative skin. Furthermore, good UX architecture strictly isolates implementation jargon (like PRNG seeds) from player-facing concepts (like battlefield numbers).

---

## Entry 10: Final Difficulty Calibration (8/16/24 Mines), Tactile Audio Synthesis, and Staged Impact Feel

### Problem
While the functional mechanics were solid, playtesting revealed several areas where game feel and pacing needed refinement:
1. **Difficulty Progression:** The previous 8 / 10 / 12 presets did not offer enough contrast across skill levels; on an 8×8 board (64 squares), 10 and 12 mines were too similar in density (~15.6% vs ~18.8%).
2. **Audio Aesthetic:** Melodic electronic sine-wave beeps felt synthetic and detached from the physical chess battlefield world.
3. **Detonation & Victory Impact:** Mine hits lacked visceral weight (only the single cell shook), and capturing the King felt abrupt rather than celebratory.

### Decision
1. **Final Difficulty Settings:**
   - **Easy:** 8 mines (12.5% density) — accessible entry point for learning knight deduction.
   - **Medium (Default):** 16 mines (25.0% density) — balanced tactical challenge requiring careful multi-step deduction.
   - **Hard:** 24 mines (37.5% density) — dense, high-stakes minefield testing deep knight-graph navigation.
   The solver validation pipeline with automatic fallback easing is preserved; UI counters dynamically reflect the exact generated mine count.
2. **Tactile Physical Sound Design:**
   - Replaced sine sweeps with procedural audio synthesizing real physical materials:
     - **Piece Move:** Filtered noise transient + dual-mode body resonance thud (125Hz down to 55Hz) + hollow overtone (260Hz).
     - **Mine Detonation:** High-amplitude explosive transient, sub-bass pressure drop (145Hz down to 28Hz), and rumbling lowpass debris tail.
     - **King Capture Staged Audio:** Wood-on-wood impact strike (240Hz triangle snap) followed by heavy tumble thud (95Hz to 42Hz) and triumphant rising brass-style fanfare.
     - **Defeat Sting:** Descending somber cadence (185Hz down to 75Hz) leaving the enemy King undefeated.
     - **Tactical Flag:** Mechanical wooden clicks.
3. **Whole-Battlefield Shake:**
   - Detonating a mine jolts the entire `.board-frame` container using CSS keyframes with rotational wobble (`battlefieldJolt`), fully contained within the layout.
4. **Staged King Capture Sequence:**
   - Knight lands on King square -> 90ms hit-stop impact freeze (King sprite recoils and flashes) -> King topples over with physical tumble thud -> gold/ivory particle burst radiates from King square alongside victory fanfare and banner.
5. **Cross-Platform & Accessibility Compliance:**
   - Zero horizontal overflow on mobile viewports (375px); full support for `prefers-reduced-motion: reduce`.

### Reasoning
- **Sensory Cohesion:** Physical chess pieces make tactile wooden thuds, not video game beeps. Grounding the audio in physical acoustics elevates the game feel to match the physical board metaphor.
- **Whole-Board Consequence:** A landmine on a battlefield creates shockwaves. Jolting the entire board conveys the destructive impact far better than a localized cell wiggle.
- **Meaningful Difficulty Spread:** Doubling from Easy (8) to Medium (16) and increasing by 50% to Hard (24) creates distinctly different deduction landscapes that reward mastery.

### What to Learn From This
Game feel is an emergent property of synchronized sensory feedback: physical sound, coordinated camera/container movement, and staged animation timing turn abstract state transitions into a visceral experience.

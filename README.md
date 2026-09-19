# ♞ Knightsweeper

> **Chess + Minesweeper = Knightsweeper.**  
> Command a chess knight across an 8×8 mined battlefield to capture the enemy King. Every number reveals hidden hazards one legal knight jump away.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-success?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## ⚔️ Overview

In standard Minesweeper, numbers count the eight orthogonal and diagonal neighbors. In **Knightsweeper**, the clue shares the exact geometry of your piece:

$$\text{Clue}(k) = \sum_{j \in \text{KnightJumps}(k)} [\text{Square } j \text{ contains a landmine}]$$

You navigate an 8×8 chessboard embedded with hidden landmines, starting on the bottom ranks with a single objective: **reach and capture the enemy King ($\text{♔}$)** on the opponent's back ranks.

---

## ✨ Key Features

- **The Clue Has the Same Shape as the Move:** Every clue counts mines on the up to 8 squares your knight could jump to next.
- **Guaranteed Deductive Solvability:** Procedurally generated using a single-clue constraint propagation solver. Puzzles are guaranteed solvable through pure logic without forced 50/50 guessing.
- **Two-Knight Life System:** You have two knights to spend. Landing on a mine triggers a whole-battlefield jolt, scorches the mine permanently, and respawns your replacement knight on the originating square (zero information leakage).
- **Staged Enemy King Capture:** Reaching the King initiates a 90ms hit-stop impact freeze, physical piece topple, gold/ivory particle celebration, and victory fanfare.
- **Tactile Physical Sound Design:** Zero external audio assets. Real-time procedural audio synthesized via the Web Audio API (wooden piece clacks, sub-bass detonation drops, brass fanfares, mechanical flag clicks).
- **Three-Tier Difficulty Presets:**
  - **Easy:** 8 mines (12.5% density) — gentle on-ramp for learning knight jump geometries.
  - **Medium (Default):** 16 mines (25.0% density) — deep tactical deduction.
  - **Hard:** 24 mines (37.5% density) — high-density minefield demanding disciplined edge navigation.
- **Elevated Presentation & Ambient Vignette:** The board sits in an elevated tray with coordinate border highlights, subtle colored glow, and optional ambient vignette lighting.
- **Deterministic Replayability:** Every board seed generates an identical puzzle. Replay and share challenges via **Battlefield Numbers** (e.g. `MEDIUM · BATTLEFIELD #42817`).
- **Fully Responsive & Accessible:** Plays smoothly on mobile devices down to 375px with dedicated touch Flag Mode, neighborhood reticle inspection, and `prefers-reduced-motion` compliance.

---

## 📚 Product & Engineering Documentation Suite

This repository was developed through a complete Product Management (PM) lifecycle:

1. 📋 **[Product Requirements & Planning](docs/requirements/Knightsweeper%20Game%20Requirements.md):** The original product specification, rules, and build evolution history.
2. 📐 **[System Architecture & Design](docs/ARCHITECTURE.md):** Component boundaries, unidirectional data flows, Mermaid state diagrams, and terminology mapping.
3. 📝 **[Engineering Journal](docs/ENGINEERING-JOURNAL.md):** Detailed architectural decisions, mathematical rationales, performance considerations, and lessons learned.
4. 🎓 **[Computer Science Learning Guide](docs/LEARNING-GUIDE.md):** Textbook-style guide covering 1D coordinate flattening, bipartite movement invariants, BFS distance fields, and constraint satisfaction algorithms.
5. 🧪 **[Verification & Testing Report](docs/TESTING.md):** PM and player-perspective QA verification, playtesting observations, and automated test coverage.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React Server & Client Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling:** Vanilla CSS & CSS Variables (zero utility bloat, dark/light theme tokens)
- **Audio Engine:** Web Audio API (real-time procedural wave synthesis)
- **Testing:** [Vitest](https://vitest.dev/) (28 automated unit tests covering domain models, solver, and state machine)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Krishy-10/knightsweeper.git

# Navigate into the project directory
cd knightsweeper

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play.

### Automated Tests

```bash
npm test
```

### Production Build

```bash
npm run build
npm start
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

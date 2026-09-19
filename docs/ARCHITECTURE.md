# Knightsweeper: Software Architecture & System Design

This document details the system architecture, component boundaries, state models, data flows, and design principles of **Knightsweeper (Chess Battlefield Edition)**.

---

## 1. Architectural Overview

Knightsweeper follows a strict **Unidirectional Data Flow (UDF)** and clean separation of concerns, dividing the application into three decoupled layers:
1. **Core Domain Layer (`src/core/`):** Pure TypeScript mathematical models, graph topology, deterministic algorithms, solver, and state transition functions. 100% free of React, DOM, or audio APIs.
2. **Audio & Infrastructure Layer (`src/audio/`, `src/hooks/`):** Reactive adapters, Web Audio API synthesis engine, and custom React hooks managing lifecycle, storage, and audio event dispatching.
3. **Presentation Layer (`src/components/`, `src/app/`):** React components, responsive CSS grid layout, accessible ARIA announcements, and chess battlefield styling.

```mermaid
graph TD
    subgraph Core Domain ["Core Domain (Pure TypeScript)"]
        Coords["coordinates.ts"]
        Graph["graph.ts (Adjacency Table)"]
        Clues["clues.ts"]
        Random["random.ts (Mulberry32)"]
        Solver["solver.ts (Deduction Logic)"]
        Gen["generator.ts (Rejection Sampling)"]
        Reducer["gameReducer.ts (State Transitions)"]
    end

    subgraph Infrastructure ["Infrastructure & Hooks"]
        Sound["soundEngine.ts (Web Audio API)"]
        HookSound["useSound.ts"]
        HookTheme["useTheme.ts"]
        HookGame["useKnightsweeper.ts"]
    end

    subgraph Presentation ["Presentation (React & CSS)"]
        Page["page.tsx"]
        Header["Header.tsx (Easy | Medium | Hard)"]
        Status["StatusBar.tsx (Knights, Moves, Mines)"]
        Board["Board.tsx (8x8 Chessboard)"]
        Square["Square.tsx (Knight, Enemy King, Landmines)"]
        Controls["Controls.tsx (Retry/New Battlefield)"]
        Msg["GameMessage.tsx"]
        Modals["Modals (Rules & Battlefield Code)"]
    end

    Gen --> Coords
    Gen --> Graph
    Gen --> Random
    Gen --> Solver
    Solver --> Clues
    Solver --> Graph
    Clues --> Graph

    Reducer --> Coords
    Reducer --> Graph
    Reducer --> Clues

    HookGame --> Reducer
    HookGame --> Gen
    HookGame --> HookSound
    HookGame --> Sound

    Page --> HookGame
    Page --> HookSound
    Page --> HookTheme
    Page --> Header
    Page --> Status
    Page --> Board
    Page --> Controls
    Page --> Msg
    Page --> Modals
    Board --> Square
```

---

## 2. Terminology Mapping: Implementation vs. Player-Facing

To preserve technical integrity while providing an intuitive player experience, Knightsweeper maintains a strict mapping between internal implementation variables and player-facing terminology:

| Implementation Concept | Player-Facing Representation | Description |
| --- | --- | --- |
| `seed: number` | **Battlefield #<number>** | 32-bit deterministic PRNG seed displayed as a memorable battlefield code (e.g. `#42817`). |
| `exit: SquareKey` | **Enemy King ($\text{♔}$)** | Target destination on ranks 7..8. Capturing the King triggers victory. |
| `mines: Set<SquareKey>` | **Landmines** | Hidden explosive hazards one knight jump away. Detonating leaves scorch marks. |
| `difficulty: 'easy'\|'medium'\|'hard'` | **Easy (8) \| Medium (16) \| Hard (24)** | Mine density presets (Medium default: 25% density). Part of deterministic board reproduction. |
| `INITIALIZE_GAME` (new seed) | **New Battlefield** | Generates a fresh reproducible battlefield. |
| `INITIALIZE_GAME` (same seed & diff) | **Retry Battlefield** | Replays the exact identical layout from the start. |

---

## 3. Directory Structure & Module Responsibilities

```
knightsweeper/
├── docs/                                # Technical documentation & learning resources
│   ├── ARCHITECTURE.md                  # System architecture & Mermaid specifications
│   ├── ENGINEERING-JOURNAL.md           # Decisions, rationale, tradeoffs, and lessons
│   ├── LEARNING-GUIDE.md                # Computer science textbook-style guide
│   ├── TESTING.md                       # Product management verification & test report
│   └── requirements/                    # Product specifications & planning document
│       └── Knightsweeper Game Requirements.md
├── src/
│   ├── app/                             # Next.js App Router root
│   │   ├── globals.css                  # Chess battlefield design system & CSS variables
│   │   ├── layout.tsx                   # HTML shell, fonts & metadata
│   │   └── page.tsx                     # Main interactive game page
│   ├── audio/
│   │   └── soundEngine.ts               # Web Audio API procedural synthesis
│   ├── components/                      # React UI components
│   │   ├── AmbientBackground.tsx        # Subtle vignette spotlight & ambient lighting
│   │   ├── Board.tsx                    # Elevated chessboard tray & coordinate axes
│   │   ├── Controls.tsx                 # Mode toggles, actions, and settings
│   │   ├── GameMessage.tsx              # Narrative log with aria-live polite
│   │   ├── Header.tsx                   # Title, segmented difficulty, battlefield code
│   │   ├── HowToPlayModal.tsx           # Rules, tips, and mechanics modal
│   │   ├── SeedModal.tsx                # Battlefield Code inspection and input
│   │   ├── Square.tsx                   # Knight, Enemy King, Landmines, Clues
│   │   └── StatusBar.tsx                # Lives, moves, and remaining mines
│   ├── core/                            # Framework-agnostic domain logic
│   │   ├── clues.ts                     # Clue calculation & neighborhood queries
│   │   ├── constants.ts                 # Board dimension, jump vectors, presets
│   │   ├── coordinates.ts               # 1D index conversion & algebraic notation
│   │   ├── gameReducer.ts               # Pure state machine reducer
│   │   ├── generator.ts                 # Procedural battlefield generation pipeline
│   │   ├── graph.ts                     # Knight movement adjacency table & BFS
│   │   ├── random.ts                    # Mulberry32 PRNG & Fisher-Yates shuffle
│   │   ├── solver.ts                    # Single-clue deduction solver
│   │   └── types.ts                     # Domain TypeScript interfaces & types
│   └── hooks/                           # React lifecycle & state hooks
│       ├── useAmbience.ts               # Ambient background toggle & persistence
│       ├── useKnightsweeper.ts          # Main game orchestrator hook
│       ├── useSound.ts                  # Audio toggle & dispatch hook
│       └── useTheme.ts                  # Light / Dark theme persistence hook
└── tests/                               # Automated unit test suite (Vitest)
    ├── clues.test.ts
    ├── coordinates.test.ts
    ├── gameReducer.test.ts
    ├── generator.test.ts
    ├── graph.test.ts
    ├── random.test.ts
    └── solver.test.ts
```

---

## 4. State Architecture: Truth vs. Player Knowledge vs. UI

The state model strictly isolates what the game secretly knows, what the player has uncovered, and temporary UI interactions:

```mermaid
classDiagram
    class GameTruth {
        +number seed
        +DifficultyPreset difficulty
        +SquareKey start
        +SquareKey exit (Enemy King)
        +Set~SquareKey~ mines
        +number mineCount
    }

    class PlayerKnowledge {
        +Set~SquareKey~ opened
        +Set~SquareKey~ flags
        +Set~SquareKey~ hit
    }

    class RuntimeState {
        +SquareKey pos
        +number knights
        +number moves
        +GameStatus status
        +SquareKey lastHit
        +string message
    }

    class UIState {
        +boolean flagMode
        +SquareKey hover
        +SquareKey pin
    }

    class DerivedState {
        +Set~SquareKey~ legalSquares
        +Set~SquareKey~ countedSquares
        +number minesLeft
    }

    GameTruth <|-- GameState : contains
    PlayerKnowledge <|-- GameState : contains
    RuntimeState <|-- GameState : contains
```

### 1. Game Truth (Secret Ground Truth)
- `mines`: Set of square keys containing landmines. Never visible to player until game over or mine detonation.
- `start`, `exit`: Immutable positions for the current battlefield seed (exit represents the stationary enemy King).
- `difficulty`: Selected difficulty preset (`easy` = 8, `medium` = 16, `hard` = 24).
- `mineCount`: Total active mines on the battlefield.

### 2. Player Knowledge (Fog of War)
- `opened`: Squares the knight has landed on. Safe by definition. Shows clue numbers.
- `flags`: Squares marked by the player as suspected mines. Blocks movement.
- `hit`: Mines detonated by the player. Rendered as permanently disabled landmines with scorch marks.

### 3. Runtime & Progress State
- `pos`: Current square key occupied by the active knight piece.
- `knights`: Number of lives remaining (2 down to 0).
- `moves`: Total jump counter.
- `status`: `'playing' | 'won' | 'lost'`.
- `message`: Live narrative status string.

### 4. UI State (Transient)
- `flagMode`: Toggle state for mobile/touch devices.
- `hover`: Square key currently hovered by cursor.
- `pin`: Square key tapped by user to inspect its 8-square neighborhood.

---

## 5. End-to-End Workflow: Anatomy of a Move to Capture the King

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Board as Board / Square (UI)
    participant Hook as useKnightsweeper Hook
    participant Reducer as gameReducer (Pure Domain)
    participant Audio as SoundEngine (Web Audio)
    participant React as React DOM

    User->>Board: Click square K
    Board->>Hook: handleSquareClick(K)
    
    alt Flag Mode is Active
        Hook->>Reducer: dispatch(TOGGLE_FLAG, K)
        Reducer-->>Hook: Return { state, soundEvents: [flag] }
    else Square K is Legal Knight Jump
        Hook->>Reducer: dispatch(JUMP, K)
        alt K is Enemy King (exit)
            Reducer-->>Hook: { status: 'won', message: 'KING CAPTURED', soundEvents: [win] }
        else K is a Mine
            alt knights == 1
                Reducer-->>Hook: { knights: 0, status: 'lost', message: 'King remains standing', soundEvents: [lose] }
            else knights == 2
                Reducer-->>Hook: { knights: 1, pos: from, soundEvents: [mine, respawn] }
            end
        else K is Safe Square
            Reducer-->>Hook: { opened: opened + K, pos: K, soundEvents: [land] }
        end
    else Square K is Opened Square (Not a Jump)
        Hook->>Hook: Toggle pin state (neighborhood reticle)
    else Square K is Blocked / Invalid
        Hook->>Audio: play(nope)
    end

    Hook->>Audio: playSounds(soundEvents)
    Hook->>React: Update GameState & UIState
    React-->>User: Re-render board, King topple reaction on win, sound effects
```

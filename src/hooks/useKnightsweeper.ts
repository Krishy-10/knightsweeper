'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { clueFor } from '../core/clues';
import { DEFAULT_DIFFICULTY } from '../core/constants';
import { nameOf } from '../core/coordinates';
import { createInitialState, gameReducer } from '../core/gameReducer';
import { generateBoard } from '../core/generator';
import { findPathAcrossSquares, jumpsFrom } from '../core/graph';
import { generateRandomSeed } from '../core/random';
import {
  BoardConfig,
  DifficultyPreset,
  GameState,
  KingCaptureStage,
  SquareKey,
  UIState,
} from '../core/types';
import { useSound } from './useSound';

export function useKnightsweeper() {
  const { playSounds, playSound } = useSound();
  const [difficulty, setDifficultyState] = useState<DifficultyPreset>(DEFAULT_DIFFICULTY);

  // Initialize board and state synchronously
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(() =>
    generateBoard({
      seed: generateRandomSeed(),
      difficulty: DEFAULT_DIFFICULTY,
    })
  );

  const [uiState, setUiState] = useState<UIState>({
    flagMode: false,
    hover: null,
    pin: null,
  });

  const [isShaking, setIsShaking] = useState(false);
  const [kingCaptureStage, setKingCaptureStage] = useState<KingCaptureStage>('idle');
  const [victoryCelebration, setVictoryCelebration] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const [gameState, dispatchOriginal] = useReducer(
    (state: GameState, action: Parameters<typeof gameReducer>[1]) => {
      return gameReducer(state, action).state;
    },
    boardConfig,
    (initialBoard) => createInitialState(initialBoard)
  );

  const dispatch = useCallback(
    (action: Parameters<typeof gameReducer>[1]) => {
      const result = gameReducer(gameState, action);

      if (action.type === 'INITIALIZE_GAME') {
        clearTimers();
        setIsShaking(false);
        setKingCaptureStage('idle');
        setVictoryCelebration(false);
        if (result.soundEvents.length > 0) {
          playSounds(result.soundEvents);
        }
        dispatchOriginal(action);
        return;
      }

      // Check for King Capture (Victory sequence)
      if (action.type === 'JUMP' && action.target === gameState.exit) {
        clearTimers();
        // Stage 1: Knight lands on King square
        playSound({ type: 'move' });
        setKingCaptureStage('hit-stop');

        // Stage 2: Hit-stop impact freeze (~90ms)
        const t1 = setTimeout(() => {
          playSound({ type: 'kingImpact' });
        }, 90);

        // Stage 3: King topples / falls over with physical wooden thud (~200ms)
        const t2 = setTimeout(() => {
          playSound({ type: 'kingFall' });
          setKingCaptureStage('toppling');
        }, 200);

        // Stage 4: Victory celebration activates (~450ms)
        const t3 = setTimeout(() => {
          playSound({ type: 'win' });
          setKingCaptureStage('settled');
          setVictoryCelebration(true);
        }, 450);

        timersRef.current.push(t1, t2, t3);
        dispatchOriginal(action);
        return;
      }

      // Check for Mine Detonation
      const hasMine = result.soundEvents.some((ev) => ev.type === 'mine');
      const hasLose = result.soundEvents.some((ev) => ev.type === 'lose');
      const hasRespawn = result.soundEvents.some((ev) => ev.type === 'respawn');

      if (hasMine || hasLose) {
        clearTimers();
        setIsShaking(true);
        playSound({ type: 'mine' });

        const tShake = setTimeout(() => {
          setIsShaking(false);
        }, 240);
        timersRef.current.push(tShake);

        if (hasLose) {
          // Defeat: battlefield shakes, all mines revealed, defeat sting plays, enemy king remains standing
          const tLose = setTimeout(() => {
            playSound({ type: 'lose' });
          }, 280);
          timersRef.current.push(tLose);
        } else if (hasRespawn) {
          // 1 life remaining: 2nd knight steps in
          const tRespawn = setTimeout(() => {
            playSound({ type: 'respawn' });
          }, 220);
          timersRef.current.push(tRespawn);
        }

        dispatchOriginal(action);
        return;
      }

      // Other actions (safe jumps, flags, clues, error nopes)
      if (result.soundEvents.length > 0) {
        playSounds(result.soundEvents);
      }
      dispatchOriginal(action);
    },
    [gameState, clearTimers, playSound, playSounds]
  );

  const startNewGame = useCallback(
    (seed: number = generateRandomSeed(), preset: DifficultyPreset = difficulty) => {
      clearTimers();
      setIsShaking(false);
      setKingCaptureStage('idle');
      setVictoryCelebration(false);
      const board = generateBoard({
        seed,
        difficulty: preset,
      });
      setDifficultyState(preset);
      setBoardConfig(board);
      setUiState((prev) => ({ ...prev, pin: null }));
      dispatch({ type: 'INITIALIZE_GAME', board });
    },
    [difficulty, clearTimers, dispatch]
  );

  const retryBoard = useCallback(() => {
    if (!boardConfig) return;
    clearTimers();
    setIsShaking(false);
    setKingCaptureStage('idle');
    setVictoryCelebration(false);
    setUiState((prev) => ({ ...prev, pin: null }));
    dispatch({ type: 'INITIALIZE_GAME', board: boardConfig });
  }, [boardConfig, clearTimers, dispatch]);

  const setDifficulty = useCallback(
    (preset: DifficultyPreset) => {
      startNewGame(generateRandomSeed(), preset);
    },
    [startNewGame]
  );

  const toggleFlagMode = useCallback(() => {
    setUiState((prev) => {
      const next = !prev.flagMode;
      dispatch({
        type: 'SET_MESSAGE',
        message: next
          ? 'Flag mode is on. Tap any square to place or remove a tactical mine flag.'
          : 'Flag mode is off. Tap a dotted square to jump.',
      });
      return { ...prev, flagMode: next };
    });
  }, []);

  const setHover = useCallback(
    (k: SquareKey | null) => {
      if (!gameState) return;
      const next = k !== null && gameState.opened.has(k) ? k : null;
      setUiState((prev) => (prev.hover === next ? prev : { ...prev, hover: next }));
    },
    [gameState]
  );

  const toggleFlag = useCallback(
    (k: SquareKey) => {
      if (!gameState || gameState.status !== 'playing') return;
      dispatch({ type: 'TOGGLE_FLAG', target: k });
    },
    [gameState]
  );

  const jump = useCallback(
    (target: SquareKey) => {
      if (!gameState || gameState.status !== 'playing') return;
      setUiState((prev) => ({ ...prev, pin: null }));
      dispatch({ type: 'JUMP', target });
    },
    [gameState]
  );

  /**
   * Primary square interaction:
   * 1. In Flag mode: toggles flag.
   * 2. In Jump mode:
   *    - If legal knight move: jumps!
   *    - If flagged: warns user and blocks move.
   *    - If opened square (not legal jump): pins/unpins clue inspection, or auto-walks if distant!
   *    - Otherwise: plays error sound.
   */
  const handleSquareClick = useCallback(
    (k: SquareKey) => {
      if (!gameState || gameState.status !== 'playing') return;

      if (uiState.flagMode) {
        toggleFlag(k);
        return;
      }

      const legalMoves = jumpsFrom(gameState.pos);
      const isLegal = legalMoves.includes(k) && !gameState.hit.has(k);

      if (isLegal) {
        if (gameState.flags.has(k)) {
          dispatch({
            type: 'SET_MESSAGE',
            message: 'That square is flagged. Remove the flag to jump there.',
          });
          playSound({ type: 'nope' });
          return;
        }
        jump(k);
        return;
      }

      // Not an immediate legal jump
      if (gameState.opened.has(k)) {
        // Auto-walk across proven safe opened squares if distant
        if (k !== gameState.pos) {
          const path = findPathAcrossSquares(gameState.pos, k, gameState.opened);
          if (path && path.length > 2) {
            let currentIdx = 1;
            const walkStep = () => {
              if (currentIdx < path.length) {
                jump(path[currentIdx]);
                currentIdx++;
                setTimeout(walkStep, 180);
              }
            };
            walkStep();
            return;
          }
        }

        // Tapping an opened square inspects its counted neighborhood
        setUiState((prev) => {
          const nextPin = prev.pin === k ? null : k;
          if (nextPin !== null) {
            const clue = clueFor(gameState.mines, k);
            dispatch({
              type: 'SET_MESSAGE',
              message: `${nameOf(k)} indicates ${clue} ${clue === 1 ? 'mine' : 'mines'}. Highlighted squares are the ones this clue counts.`,
            });
          }
          return { ...prev, pin: nextPin };
        });
      } else {
        playSound({ type: 'nope' });
      }
    },
    [gameState, uiState.flagMode, toggleFlag, jump, playSound]
  );

  // Legal knight moves from current position
  const legalSquares = new Set<SquareKey>();
  if (gameState && gameState.status === 'playing') {
    for (const k of jumpsFrom(gameState.pos)) {
      if (!gameState.hit.has(k) && !gameState.flags.has(k)) {
        legalSquares.add(k);
      }
    }
  }

  // Counted squares for peek highlight (hovered or pinned opened square)
  const peekSquare = uiState.hover !== null ? uiState.hover : uiState.pin;
  const countedSquares = new Set<SquareKey>(
    peekSquare !== null && gameState?.opened.has(peekSquare)
      ? jumpsFrom(peekSquare)
      : []
  );

  return {
    gameState,
    boardConfig,
    uiState,
    difficulty,
    legalSquares,
    countedSquares,
    isShaking,
    kingCaptureStage,
    victoryCelebration,
    startNewGame,
    retryBoard,
    setDifficulty,
    toggleFlagMode,
    setHover,
    toggleFlag,
    jump,
    handleSquareClick,
  };
}

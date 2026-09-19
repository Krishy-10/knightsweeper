'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { GameMessage } from '../components/GameMessage';
import { Header } from '../components/Header';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { SeedModal } from '../components/SeedModal';
import { StatsModal } from '../components/StatsModal';
import { StatusBar } from '../components/StatusBar';
import { getDailyChallenge } from '../core/daily';
import {
  copyToClipboard,
  generateChallengeText,
  generateDailyShareText,
} from '../core/share';
import {
  calculateUpdatedStats,
  INITIAL_STATS,
  loadPlayerStats,
  PlayerStats,
  savePlayerStats,
} from '../core/stats';
import { DifficultyPreset } from '../core/types';
import { useAmbience } from '../hooks/useAmbience';
import { useKnightsweeper } from '../hooks/useKnightsweeper';
import { useSound } from '../hooks/useSound';
import { useTheme } from '../hooks/useTheme';
import { subscribeToAuth, UserProfile } from '../services/authService';
import { submitDailyScore } from '../services/leaderboardService';
import { pushCareerStatsToCloud, syncCareerStatsWithCloud } from '../services/statsSyncService';

export default function KnightsweeperPage() {
  const {
    gameState,
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
    handleSquareClick,
    movesHistory,
  } = useKnightsweeper();


  const { soundEnabled, toggleSound } = useSound();
  const { theme, cycleTheme } = useTheme();
  const { ambienceEnabled, toggleAmbience, glowState } = useAmbience({
    gameState,
    isShaking,
    kingCaptureStage,
  });

  // Daily Challenge Metadata
  const dailyInfo = useMemo(() => getDailyChallenge(), []);
  const [isDailyActive, setIsDailyActive] = useState<boolean>(false);

  // Player Stats & Streaks (Local-first)
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);

  // User Auth Profile (Firebase Anonymous or Google)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modal States
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Timer & Game Recording References
  const startTimeRef = useRef<number>(Date.now());
  const recordedBattlefieldRef = useRef<string | null>(null);

  // Load stats on mount
  useEffect(() => {
    setStats(loadPlayerStats());
  }, []);

  // Subscribe to Firebase Auth and sync career stats
  useEffect(() => {
    const unsubscribe = subscribeToAuth((profile) => {
      setUserProfile(profile);
      if (profile?.uid && !profile.isAnonymous) {
        syncCareerStatsWithCloud(profile.uid).then((merged) => {
          setStats(merged);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Parse deep-link query parameters on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const dailyParam = params.get('daily');
    const seedParam = params.get('b') || params.get('seed');
    const diffParam = params.get('d') || params.get('difficulty');

    let targetDiff: DifficultyPreset = difficulty;
    if (diffParam === 'easy' || diffParam === 'medium' || diffParam === 'hard') {
      targetDiff = diffParam;
      setDifficulty(diffParam);
    }

    if (dailyParam === 'true') {
      setIsDailyActive(true);
      startNewGame(dailyInfo.seed, targetDiff);
    } else if (seedParam) {
      const parsedSeed = parseInt(seedParam, 10);
      if (!isNaN(parsedSeed) && parsedSeed >= 0) {
        setIsDailyActive(parsedSeed === dailyInfo.seed);
        startNewGame(parsedSeed, targetDiff);
      }
    }
  }, []); // Run once on mount

  // Reset timer on fresh game initialization
  useEffect(() => {
    if (gameState?.moves === 0 && gameState.status === 'playing') {
      startTimeRef.current = Date.now();
    }
  }, [gameState?.seed, gameState?.moves, gameState?.status]);

  // Record stats and submit scores upon match completion
  useEffect(() => {
    if (!gameState) return;

    const recordKey = `${gameState.seed}:${gameState.status}:${gameState.moves}`;
    if (
      (gameState.status === 'won' || gameState.status === 'lost') &&
      recordedBattlefieldRef.current !== recordKey
    ) {
      recordedBattlefieldRef.current = recordKey;
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const won = gameState.status === 'won';

      // Update local career stats
      setStats((prev) => {
        const next = calculateUpdatedStats(prev, {
          won,
          moves: gameState.moves,
          difficulty,
          dailyDateString: isDailyActive ? dailyInfo.dateString : null,
        });
        savePlayerStats(next);
        if (userProfile?.uid && !userProfile.isAnonymous) {
          pushCareerStatsToCloud(userProfile.uid, next);
        }
        return next;
      });

      // Submit to global daily leaderboard if won on Daily Challenge
      if (won && isDailyActive && userProfile) {
        submitDailyScore({
          dateString: dailyInfo.dateString,
          uid: userProfile.uid,
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
          moves: gameState.moves,
          timeSeconds: elapsedSeconds,
          knightsRemaining: gameState.knights,
          difficulty,
          seed: gameState.seed,
          movesHistory,
        });
      }
    }
  }, [
    gameState?.status,
    gameState?.moves,
    gameState?.seed,
    gameState?.knights,
    isDailyActive,
    dailyInfo.dateString,
    difficulty,
    userProfile,
    movesHistory,
  ]);


  // Handle toggling Daily Challenge mode
  const handleToggleDaily = () => {
    if (isDailyActive) {
      // Switch back to custom random generation
      setIsDailyActive(false);
      startNewGame();
    } else {
      // Switch to today's daily
      setIsDailyActive(true);
      startNewGame(dailyInfo.seed, difficulty);
    }
  };

  // Challenge link copying
  const handleShareChallenge = async (): Promise<boolean> => {
    if (!gameState) return false;
    const text = generateChallengeText({
      seed: gameState.seed,
      difficulty,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    return copyToClipboard(text);
  };

  // Result card copying
  const handleShareResult = async (): Promise<boolean> => {
    if (!gameState) return false;
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;

    let text: string;
    if (isDailyActive) {
      text = generateDailyShareText({
        dayNumber: dailyInfo.dayNumber,
        dateString: dailyInfo.dateString,
        difficulty,
        won: gameState.status === 'won',
        moves: gameState.moves,
        knights: gameState.knights,
        timeSeconds: elapsedSeconds,
        origin,
      });
    } else {
      text = generateChallengeText({
        seed: gameState.seed,
        difficulty,
        origin,
      });
    }
    return copyToClipboard(text);
  };

  if (!gameState) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>Preparing the battlefield...</p>
      </div>
    );
  }

  const isDailyDone = stats.completedDailies.includes(dailyInfo.dateString);

  return (
    <>
      <AmbientBackground enabled={ambienceEnabled} glowState={glowState} />
      <main className="app-container">
        <Header
          difficulty={difficulty}
          onSelectDifficulty={(d) => {
            setDifficulty(d);
            if (isDailyActive) {
              startNewGame(dailyInfo.seed, d);
            }
          }}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenSeedModal={() => setIsSeedModalOpen(true)}
          seed={gameState.seed}
          isDailyActive={isDailyActive}
          onToggleDaily={handleToggleDaily}
          dailyDayNumber={dailyInfo.dayNumber}
          isDailyCompleted={isDailyDone}
          onOpenStatsModal={() => setIsStatsModalOpen(true)}
          userProfile={userProfile}
        />

        <StatusBar state={gameState} />

        <Board
          state={gameState}
          legalSquares={legalSquares}
          countedSquares={countedSquares}
          flagMode={uiState.flagMode}
          isShaking={isShaking}
          kingCaptureStage={kingCaptureStage}
          victoryCelebration={victoryCelebration}
          glowState={glowState}
          ambienceEnabled={ambienceEnabled}
          onSquareClick={handleSquareClick}
          onToggleFlag={toggleFlag}
          onSetHover={setHover}
        />

        <GameMessage message={gameState.message} status={gameState.status} />

        <Controls
          flagMode={uiState.flagMode}
          soundEnabled={soundEnabled}
          theme={theme}
          ambienceEnabled={ambienceEnabled}
          onToggleFlagMode={toggleFlagMode}
          onToggleSound={toggleSound}
          onCycleTheme={cycleTheme}
          onToggleAmbience={toggleAmbience}
          onRetryBoard={retryBoard}
          onNewBoard={() => {
            setIsDailyActive(false);
            startNewGame();
          }}
          onShareChallenge={handleShareChallenge}
          onShareResult={handleShareResult}
          gameStatus={gameState.status}
          isDaily={isDailyActive}
        />

        {/* Modals */}
        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
        />

        <SeedModal
          isOpen={isSeedModalOpen}
          currentSeed={gameState.seed}
          onClose={() => setIsSeedModalOpen(false)}
          onApplySeed={(seed) => {
            setIsDailyActive(seed === dailyInfo.seed);
            startNewGame(seed, difficulty);
          }}
        />

        <StatsModal
          isOpen={isStatsModalOpen}
          stats={stats}
          dailyInfo={dailyInfo}
          userProfile={userProfile}
          onClose={() => setIsStatsModalOpen(false)}
          onSelectDaily={() => {
            setIsDailyActive(true);
            startNewGame(dailyInfo.seed, difficulty);
          }}
          onUserProfileUpdated={(updated) => setUserProfile(updated)}
        />
      </main>
    </>
  );
}

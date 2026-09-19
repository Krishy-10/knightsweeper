'use client';

import React, { useState } from 'react';
import { AmbientBackground } from '../components/AmbientBackground';
import { Board } from '../components/Board';
import { Controls } from '../components/Controls';
import { GameMessage } from '../components/GameMessage';
import { Header } from '../components/Header';
import { HowToPlayModal } from '../components/HowToPlayModal';
import { SeedModal } from '../components/SeedModal';
import { StatusBar } from '../components/StatusBar';
import { useAmbience } from '../hooks/useAmbience';
import { useKnightsweeper } from '../hooks/useKnightsweeper';
import { useSound } from '../hooks/useSound';
import { useTheme } from '../hooks/useTheme';

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
  } = useKnightsweeper();

  const { soundEnabled, toggleSound } = useSound();
  const { theme, cycleTheme } = useTheme();
  const { ambienceEnabled, toggleAmbience, glowState } = useAmbience({
    gameState,
    isShaking,
    kingCaptureStage,
  });

  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  if (!gameState) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>Preparing the battlefield...</p>
      </div>
    );
  }

  return (
    <>
      <AmbientBackground enabled={ambienceEnabled} glowState={glowState} />
      <main className="app-container">
        <Header
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenSeedModal={() => setIsSeedModalOpen(true)}
          seed={gameState.seed}
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
          onNewBoard={() => startNewGame()}
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
        onApplySeed={(seed) => startNewGame(seed, difficulty)}
      />
      </main>
    </>
  );
}

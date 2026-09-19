'use client';

import React, { useEffect, useRef } from 'react';
import { AmbienceGlowState } from '../hooks/useAmbience';

interface AmbientBackgroundProps {
  enabled: boolean;
  glowState: AmbienceGlowState;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
  vx: number;
  vy: number;
  phase: number;
  isRightFlank: boolean;
}

export function AmbientBackground({ enabled, glowState }: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate particles restricted strictly to the outer flanks (edges)
    // leaving the center 46% completely clear behind the board
    const PARTICLE_COUNT = 24;
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isRightFlank = i % 2 === 0;
      const x = isRightFlank
        ? width * 0.74 + Math.random() * (width * 0.25)
        : Math.random() * (width * 0.24);

      particles.push({
        x,
        y: Math.random() * height,
        radius: 1.2 + Math.random() * 1.8,
        opacity: 0.12 + Math.random() * 0.16,
        baseOpacity: 0.12 + Math.random() * 0.16,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(0.18 + Math.random() * 0.28), // Very slow upward drift
        phase: Math.random() * Math.PI * 2,
        isRightFlank,
      });
    }

    let isPaused = document.hidden;
    const handleVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let lastTime = performance.now();

    const render = (now: number) => {
      if (isPaused) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Render subtle drifting particles
      for (const p of particles) {
        p.phase += dt * 0.8;
        p.y += p.vy * (dt * 60);
        p.x += Math.sin(p.phase) * 0.25 + p.vx * (dt * 60);

        // Keep strictly on their respective flank
        if (p.isRightFlank) {
          const minX = width * 0.73;
          if (p.x < minX) p.x = minX + 2;
          if (p.x > width + 10) p.x = width - 10;
        } else {
          const maxX = width * 0.27;
          if (p.x > maxX) p.x = maxX - 2;
          if (p.x < -10) p.x = 5;
        }

        // Wrap around vertically
        if (p.y < -10) {
          p.y = height + 10;
          p.x = p.isRightFlank
            ? width * 0.74 + Math.random() * (width * 0.25)
            : Math.random() * (width * 0.24);
        }

        // Draw soft circular particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 220, 205, ${p.opacity})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled]);

  return (
    <div
      className={`ambient-background ${enabled ? 'ambience-active' : 'ambience-disabled'} glow-${glowState}`}
      aria-hidden="true"
    >
      {/* Large dim radial spotlight centered behind the board */}
      <div className="ambient-spotlight" />

      {/* Slow drifting edge particles (canvas) */}
      {enabled && <canvas ref={canvasRef} className="ambient-particles-canvas" />}
    </div>
  );
}

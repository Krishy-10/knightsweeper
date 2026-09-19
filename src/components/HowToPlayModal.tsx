'use client';

import React from 'react';
import { Crown, HelpCircle, X } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="rules-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Crown size={22} className="modal-icon icon-crown" />
            <h2 id="rules-title">Knightsweeper: Rules &amp; Tactics</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close rules">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <section className="rule-item">
            <h3>1. The Objective: Capture the Enemy King</h3>
            <p>
              Your mission is to cross the mined chessboard and <b>capture the enemy King</b>. The King stands stationary on the opponent ranks. Reaching the King&apos;s square via a legal knight jump wins the battlefield.
            </p>
          </section>

          <section className="rule-item">
            <h3>2. Knight-Only Movement</h3>
            <p>
              Your piece navigates strictly like a chess knight: two squares in one direction, then one square sideways (an &quot;L&quot; jump). Dotted squares indicate legal jumps from your current square. They show movement rules only, not safety!
            </p>
          </section>

          <section className="rule-item">
            <h3>3. The Clue Has the Same Shape as the Move</h3>
            <p>
              When you land on a square, its number indicates <b>how many mines exist among the squares one legal knight jump away</b> (0 to 8).
            </p>
            <p>
              A clue of <b>0</b> proves that every square this knight can jump to is safe. No squares open automatically—you jump to them yourself to reveal their numbers.
            </p>
          </section>

          <section className="rule-item">
            <h3>4. Inspecting Clue Squares</h3>
            <p>
              Hover over any opened square (or tap an opened square you cannot currently jump to) to highlight the squares its number counts. This makes complex multi-square deductions easy to verify.
            </p>
          </section>

          <section className="rule-item">
            <h3>5. Tactical Mine Flags</h3>
            <p>
              Right-click an unexplored square (or toggle <b>Flag Mode</b> on mobile/touch screens) to plant a hazard flag. Flagged squares cannot be jumped onto, shielding you from accidental misclicks.
            </p>
          </section>

          <section className="rule-item">
            <h3>6. Two-Knight Life System &amp; Safe Respawn</h3>
            <p>
              You command two knights. If your first knight strikes a mine, the mine is permanently revealed and disabled. Your second knight immediately steps in on the known safe square the first jumped from. If the second knight falls, the battlefield is lost and the enemy King remains standing.
            </p>
          </section>

          <section className="rule-item">
            <h3>7. 100% Solvable by Pure Logic</h3>
            <p>
              Every generated battlefield is tested by an automated deduction solver. Guessing is never required; logical deduction will always yield a safe path to the enemy King.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="ctrl-btn primary" onClick={onClose}>
            Return to Battlefield
          </button>
        </div>
      </div>
    </div>
  );
}

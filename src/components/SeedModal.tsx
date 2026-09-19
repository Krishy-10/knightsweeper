'use client';

import React, { useState } from 'react';
import { Check, Copy, Hash, Swords, X } from 'lucide-react';

interface SeedModalProps {
  isOpen: boolean;
  currentSeed: number;
  onClose: () => void;
  onApplySeed: (seed: number) => void;
}

export function SeedModal({
  isOpen,
  currentSeed,
  onClose,
  onApplySeed,
}: SeedModalProps) {
  const [inputSeed, setInputSeed] = useState<string>(String(currentSeed));
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(currentSeed));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(inputSeed.trim(), 10);
    if (isNaN(num) || num < 0 || num > 4294967295) {
      setError('Please enter a valid battlefield number (0 to 4,294,967,295).');
      return;
    }
    setError(null);
    onApplySeed(num);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="seed-title">
      <div className="modal-card modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Swords size={20} className="modal-icon" />
            <h2 id="seed-title">Battlefield Code &amp; Replay</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="seed-explainer">
            Each battlefield number generates an exact, reproducible layout of the knight&apos;s starting position, mine placements, and the enemy King. Share this code with friends or replay the exact challenge.
          </p>

          <div className="current-seed-box">
            <span className="seed-box-label">Current Battlefield:</span>
            <div className="seed-copy-row">
              <span className="seed-digits">#{currentSeed}</span>
              <button
                type="button"
                className="copy-btn"
                onClick={handleCopy}
                title="Copy battlefield code"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="custom-seed-form">
            <label htmlFor="seed-input" className="form-label">
              Load Battlefield by Number:
            </label>
            <div className="seed-input-row">
              <div className="input-wrap">
                <Hash size={16} className="input-icon" />
                <input
                  id="seed-input"
                  type="number"
                  className="seed-input"
                  value={inputSeed}
                  onChange={(e) => {
                    setInputSeed(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 42817"
                />
              </div>
              <button type="submit" className="ctrl-btn primary">
                Load
              </button>
            </div>
            {error && <p className="form-error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

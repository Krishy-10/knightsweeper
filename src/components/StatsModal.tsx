'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  Flame,
  LogIn,
  LogOut,
  Medal,
  RefreshCw,
  Trophy,
  User as UserIcon,
  X,
} from 'lucide-react';
import { DailyChallengeInfo } from '../core/daily';
import { PlayerStats } from '../core/stats';
import { DifficultyPreset } from '../core/types';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  signInOrLinkWithGoogle,
  signOutAccount,
  UserProfile,
} from '../services/authService';
import {
  fetchDailyLeaderboard,
  LeaderboardEntry,
} from '../services/leaderboardService';

interface StatsModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  dailyInfo: DailyChallengeInfo;
  userProfile: UserProfile | null;
  onClose: () => void;
  onSelectDaily?: () => void;
  onUserProfileUpdated?: (profile: UserProfile | null) => void;
}

type TabKey = 'career' | 'leaderboard' | 'account';

export function StatsModal({
  isOpen,
  stats,
  dailyInfo,
  userProfile,
  onClose,
  onSelectDaily,
  onUserProfileUpdated,
}: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('career');
  const [profile, setProfile] = useState<UserProfile | null>(userProfile);
  const [leaderboardDiff, setLeaderboardDiff] = useState<DifficultyPreset>('medium');
  const [leaderboardScores, setLeaderboardScores] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const hasFirebase = isFirebaseConfigured();

  // Sync profile when prop changes
  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  // Load leaderboard when on the leaderboard tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'leaderboard') return;

    let mounted = true;
    setLoadingLeaderboard(true);

    fetchDailyLeaderboard(dailyInfo.dateString, leaderboardDiff)
      .then((data) => {
        if (mounted) {
          setLeaderboardScores(data);
          setLoadingLeaderboard(false);
        }
      })
      .catch(() => {
        if (mounted) setLoadingLeaderboard(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, activeTab, dailyInfo.dateString, leaderboardDiff]);

  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const isTodayDailyDone = stats.completedDailies.includes(dailyInfo.dateString);

  // Maximum value for move distribution chart scaling
  const maxBucketCount = Math.max(1, ...Object.values(stats.moveDistribution));

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const updated = await signInOrLinkWithGoogle();
      if (updated) {
        setProfile(updated);
        onUserProfileUpdated?.(updated);
      }
    } catch (err: any) {
      console.error('[Knightsweeper] Google sign in error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google. Please check your popup blocker.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOutAccount();
      setProfile(null);
      onUserProfileUpdated?.(null);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign out.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="modal-card stats-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Trophy size={20} className="modal-icon text-gold" />
            <h2 id="stats-modal-title">Career Record &amp; Leaderboard</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="stats-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'career'}
            className={`stats-tab ${activeTab === 'career' ? 'active' : ''}`}
            onClick={() => setActiveTab('career')}
          >
            <BarChart2 size={16} />
            <span>Career Stats</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'leaderboard'}
            className={`stats-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Medal size={16} />
            <span>Daily Leaderboard</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'account'}
            className={`stats-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <UserIcon size={16} />
            <span>Account</span>
            {profile && !profile.isAnonymous && <span className="tab-dot" />}
          </button>
        </div>

        {/* Body */}
        <div className="modal-body stats-modal-body">
          {/* TAB 1: CAREER STATS */}
          {activeTab === 'career' && (
            <div className="stats-panel">
              {/* Metric 4-Card Grid */}
              <div className="stats-metrics-grid">
                <div className="stat-metric-card">
                  <span className="stat-metric-value">{stats.gamesPlayed}</span>
                  <span className="stat-metric-label">Played</span>
                </div>
                <div className="stat-metric-card">
                  <span className="stat-metric-value">{winRate}%</span>
                  <span className="stat-metric-label">Win Rate</span>
                </div>
                <div className="stat-metric-card highlight-streak">
                  <div className="stat-metric-value with-icon">
                    <Flame size={18} className="text-orange" />
                    <span>{stats.currentStreak}</span>
                  </div>
                  <span className="stat-metric-label">Current Streak</span>
                </div>
                <div className="stat-metric-card">
                  <span className="stat-metric-value">{stats.maxStreak}</span>
                  <span className="stat-metric-label">Max Streak</span>
                </div>
              </div>

              {/* Best Moves Section */}
              <div className="stats-section">
                <h3 className="stats-section-title">Fewest Moves to Victory</h3>
                <div className="best-moves-grid">
                  <div className="best-move-pill">
                    <span className="best-move-label">Easy</span>
                    <span className="best-move-val">
                      {stats.bestMoves.easy !== null ? `${stats.bestMoves.easy} moves` : '—'}
                    </span>
                  </div>
                  <div className="best-move-pill">
                    <span className="best-move-label">Medium</span>
                    <span className="best-move-val">
                      {stats.bestMoves.medium !== null ? `${stats.bestMoves.medium} moves` : '—'}
                    </span>
                  </div>
                  <div className="best-move-pill">
                    <span className="best-move-label">Hard</span>
                    <span className="best-move-val">
                      {stats.bestMoves.hard !== null ? `${stats.bestMoves.hard} moves` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Move Distribution Histogram */}
              <div className="stats-section">
                <h3 className="stats-section-title">Move Distribution (Victories)</h3>
                <div className="histogram-list">
                  {Object.entries(stats.moveDistribution).map(([bucket, count]) => {
                    const pct = Math.max(8, Math.round((count / maxBucketCount) * 100));
                    return (
                      <div key={bucket} className="histogram-row">
                        <span className="histogram-label">{bucket}</span>
                        <div className="histogram-track">
                          <div
                            className={`histogram-bar ${count > 0 ? 'has-count' : ''}`}
                            style={{ width: `${count > 0 ? pct : 4}%` }}
                          >
                            <span className="histogram-count">{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Challenge Banner */}
              <div className="daily-cta-card">
                <div className="daily-cta-info">
                  <div className="daily-cta-header">
                    <Calendar size={18} />
                    <span>Daily Challenge #{dailyInfo.dayNumber}</span>
                  </div>
                  <p className="daily-cta-date">{dailyInfo.dateString}</p>
                </div>
                {isTodayDailyDone ? (
                  <div className="daily-completed-badge">
                    <CheckCircle2 size={16} />
                    <span>Completed</span>
                  </div>
                ) : onSelectDaily ? (
                  <button
                    type="button"
                    className="ctrl-btn primary"
                    onClick={() => {
                      onSelectDaily();
                      onClose();
                    }}
                  >
                    Play Today&apos;s Daily
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 2: DAILY LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="leaderboard-panel">
              <div className="leaderboard-header-row">
                <div className="leaderboard-info">
                  <span className="leaderboard-title">Daily #{dailyInfo.dayNumber}</span>
                  <span className="leaderboard-subtitle">{dailyInfo.dateString}</span>
                </div>

                {/* Difficulty Selector */}
                <div className="leaderboard-diff-picker" role="radiogroup">
                  {(['easy', 'medium', 'hard'] as DifficultyPreset[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`diff-tab-btn ${leaderboardDiff === d ? 'active' : ''}`}
                      onClick={() => setLeaderboardDiff(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {!hasFirebase && (
                <div className="firebase-notice-card">
                  <Award size={20} className="notice-icon text-gold" />
                  <div className="notice-text">
                    <strong>Global Cloud Leaderboard Ready:</strong>
                    <p>
                      To view global scores and submit your runs to the world, add your free Firebase keys
                      to <code>.env.local</code>. Local scores and streaks continue to be tracked safely!
                    </p>
                  </div>
                </div>
              )}

              {loadingLeaderboard ? (
                <div className="leaderboard-loading">
                  <RefreshCw size={24} className="spin-icon" />
                  <span>Loading commander scores...</span>
                </div>
              ) : leaderboardScores.length === 0 ? (
                <div className="leaderboard-empty">
                  <Trophy size={36} className="empty-trophy" />
                  <p className="empty-title">No scores yet today for {leaderboardDiff}!</p>
                  <p className="empty-desc">
                    Be the first commander to cross the minefield and capture the King.
                  </p>
                  {onSelectDaily && (
                    <button
                      type="button"
                      className="ctrl-btn primary mt-3"
                      onClick={() => {
                        onSelectDaily();
                        onClose();
                      }}
                    >
                      Play Daily Challenge
                    </button>
                  )}
                </div>
              ) : (
                <div className="leaderboard-table-wrap">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Commander</th>
                        <th>Moves</th>
                        <th>Knights</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardScores.map((entry, idx) => {
                        const isCurrent = profile && profile.uid === entry.uid;
                        const mins = Math.floor(entry.timeSeconds / 60);
                        const secs = entry.timeSeconds % 60;
                        const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

                        return (
                          <tr key={entry.uid} className={isCurrent ? 'my-rank-row' : ''}>
                            <td className="rank-cell">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td className="name-cell">
                              <span className="commander-name">
                                {entry.displayName}
                                {isCurrent && <span className="you-chip">You</span>}
                              </span>
                            </td>
                            <td className="moves-cell font-mono">{entry.moves}</td>
                            <td className="knights-cell">{entry.knightsRemaining}/2</td>
                            <td className="time-cell font-mono">{formattedTime}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT & CLOUD SYNC */}
          {activeTab === 'account' && (
            <div className="account-panel">
              <div className="account-card">
                <div className="account-avatar-wrap">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.displayName}
                      className="account-avatar-img"
                    />
                  ) : (
                    <div className="account-avatar-fallback">
                      <UserIcon size={32} />
                    </div>
                  )}
                </div>

                <div className="account-details">
                  <h3 className="account-name">
                    {profile ? profile.displayName : 'Guest Knight'}
                  </h3>
                  <p className="account-email">
                    {profile?.email || (profile?.isAnonymous ? 'Guest Anonymous Profile' : 'Not signed in')}
                  </p>
                  <span className={`account-badge ${profile?.isAnonymous ? 'guest' : 'verified'}`}>
                    {profile?.isAnonymous ? 'Guest Player' : 'Google Account Verified'}
                  </span>
                </div>
              </div>

              {authError && <p className="auth-error-msg">{authError}</p>}

              <div className="account-action-box">
                {profile?.isAnonymous ? (
                  <>
                    <p className="account-explainer">
                      Link your Google account to secure your battlefield career stats across devices and display
                      your customized name and avatar on the global Daily Leaderboard.
                    </p>
                    <button
                      type="button"
                      className="google-sign-in-btn"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                    >
                      <LogIn size={18} />
                      <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="account-explainer">
                      Your career stats and daily scores are backed up and synced to your Google account.
                    </p>
                    <button
                      type="button"
                      className="ctrl-btn danger"
                      onClick={handleSignOut}
                      disabled={authLoading}
                    >
                      <LogOut size={16} />
                      <span>{authLoading ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

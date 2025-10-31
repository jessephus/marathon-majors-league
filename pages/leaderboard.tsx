/**
 * Leaderboard Page - Optimized with SSR and client-side caching
 * This page shows live standings during the race
 */

import Head from 'next/head';
import { useGameState, useAthleteMap } from '../lib/state/GameStateContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const { standings, athletes, gameId, isLoading } = useGameState();
  const athleteMap = useAthleteMap();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  useEffect(() => {
    // Auto-refresh is handled by SWR polling in the context
    // This is just for UI state
  }, []);
  
  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Leaderboard - Fantasy NY Marathon</title>
        <meta name="description" content="Live standings and leaderboard" />
      </Head>
      
      <div className="container">
        <header>
          <h1>🏆 Live Leaderboard</h1>
          <Link href="/">
            <a className="btn btn-secondary">Back to Home</a>
          </Link>
        </header>
        
        <main>
          <div className="leaderboard-controls">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (every 60s)
            </label>
          </div>
          
          {standings && standings.standings && standings.standings.length > 0 ? (
            <div className="standings-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Races</th>
                    <th>Total Points</th>
                    <th>Avg Points</th>
                    <th>Wins</th>
                    <th>Top 3</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.standings.map((standing: any) => (
                    <tr key={standing.player_code}>
                      <td className="rank">{standing.rank || '-'}</td>
                      <td className="player-name">{standing.player_code}</td>
                      <td>{standing.races_count || 0}</td>
                      <td className="points">{standing.total_points?.toFixed(1) || '0.0'}</td>
                      <td>{standing.average_points?.toFixed(1) || '0.0'}</td>
                      <td>{standing.wins || 0}</td>
                      <td>{standing.top3 || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No standings available yet. Waiting for race results...</p>
            </div>
          )}
          
          {standings && (
            <div className="update-info">
              Last updated: {new Date().toLocaleTimeString()}
              {standings.cached && ' (cached)'}
            </div>
          )}
        </main>
      </div>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .leaderboard-controls {
          margin-bottom: 20px;
        }
        
        .standings-table {
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        th, td {
          padding: 12px;
          text-align: left;
        }
        
        th {
          background: #1a73e8;
          color: white;
          font-weight: 600;
        }
        
        tbody tr:nth-child(even) {
          background: #f5f5f5;
        }
        
        tbody tr:hover {
          background: #e3f2fd;
        }
        
        .rank {
          font-weight: 700;
          font-size: 1.2em;
          color: #1a73e8;
        }
        
        .points {
          font-weight: 600;
          color: #2e7d32;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }
        
        .update-info {
          margin-top: 20px;
          text-align: right;
          color: #666;
          font-size: 0.9em;
        }
        
        .loading {
          text-align: center;
          padding: 60px 20px;
          font-size: 1.2em;
          color: #666;
        }
      `}</style>
    </>
  );
}

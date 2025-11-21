/**
 * Performance Dashboard Component
 * 
 * Displays comprehensive performance metrics:
 * - Web Vitals (CLS, LCP, FID, INP)
 * - Dynamic chunk load times
 * - Leaderboard refresh latency
 * - Cache hit ratios
 * - Feature flag status
 * 
 * Accessible via window.__performanceDashboard.show() in development.
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, PERFORMANCE_BUDGETS } from '@/lib/performance-monitor';
import { featureFlags, FeatureFlag } from '@/lib/feature-flags';

interface PerformanceDashboardProps {
  onClose: () => void;
}

export default function PerformanceDashboard({ onClose }: PerformanceDashboardProps) {
  const [report, setReport] = useState(performanceMonitor.getPerformanceReport());
  const [flags, setFlags] = useState(featureFlags.getAll());

  useEffect(() => {
    // Refresh every 2 seconds
    const interval = setInterval(() => {
      setReport(performanceMonitor.getPerformanceReport());
      setFlags(featureFlags.getAll());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          maxWidth: '1200px',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'auto',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Performance Dashboard</h2>
            {report.thresholdViolations > 0 && (
              <p style={{ margin: '0.25rem 0 0', color: '#ef4444', fontSize: '0.8rem' }}>
                ⚠️ {report.thresholdViolations} threshold violation{report.thresholdViolations > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Web Vitals Section */}
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Core Web Vitals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
            {[
              { name: 'LCP', label: 'Largest Contentful Paint', metric: report.webVitals.lcp, unit: 'ms', threshold: PERFORMANCE_BUDGETS.LCP_THRESHOLD },
              { name: 'INP', label: 'Interaction to Next Paint', metric: report.webVitals.inp, unit: 'ms', threshold: PERFORMANCE_BUDGETS.INP_THRESHOLD },
              { name: 'CLS', label: 'Cumulative Layout Shift', metric: report.webVitals.cls, unit: '', threshold: PERFORMANCE_BUDGETS.CLS_THRESHOLD },
              { name: 'TTFB', label: 'Time to First Byte', metric: report.webVitals.ttfb, unit: 'ms', threshold: 800 },
            ].map(({ name, label, metric, unit, threshold }) => (
              <div
                key={name}
                style={{
                  background: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: `1.5px solid ${
                    !metric ? '#e5e7eb' :
                    metric.rating === 'good' ? '#22c55e' :
                    metric.rating === 'needs-improvement' ? '#f59e0b' : '#ef4444'
                  }`,
                }}
              >
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.15rem' }}>{label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {metric ? `${metric.value.toFixed(name === 'CLS' ? 3 : 0)}${unit}` : 'N/A'}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                  Threshold: {threshold}{unit}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cache Performance Section */}
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Cache Performance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
            {[
              { label: 'Overall', ratio: report.cache.overall },
              { label: 'Athletes', ratio: report.cache.athletes },
              { label: 'Game State', ratio: report.cache.gameState },
              { label: 'Results', ratio: report.cache.results },
              { label: 'Scoring', ratio: report.cache.scoring },
              { label: 'Standings', ratio: report.cache.standings },
              { label: 'Default', ratio: report.cache.default },
            ].map(({ label, ratio }) => {
              const percentage = ratio * 100;
              const meetsThreshold = ratio >= PERFORMANCE_BUDGETS.CACHE_HIT_RATIO_MIN;
              return (
                <div
                  key={label}
                  style={{
                    background: '#f9fafb',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: `1.5px solid ${meetsThreshold ? '#22c55e' : '#f59e0b'}`,
                  }}
                >
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.15rem' }}>{label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                    {percentage.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                    Target: {PERFORMANCE_BUDGETS.CACHE_HIT_RATIO_MIN * 100}%
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
            Total cache accesses: {report.cache.totalAccesses}
          </div>
        </section>

        {/* Leaderboard Performance Section */}
        {report.leaderboard.totalRefreshes > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Leaderboard Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <div
                style={{
                  background: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: `1.5px solid ${
                    report.leaderboard.avgLatency < PERFORMANCE_BUDGETS.LEADERBOARD_REFRESH_MAX ? '#22c55e' : '#f59e0b'
                  }`,
                }}
              >
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.15rem' }}>Avg Refresh Latency</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {report.leaderboard.avgLatency.toFixed(0)}ms
                </div>
                <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                  Threshold: {PERFORMANCE_BUDGETS.LEADERBOARD_REFRESH_MAX}ms
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '4px', border: '1.5px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.15rem' }}>Total Refreshes</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.15rem' }}>
                  {report.leaderboard.totalRefreshes}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#9ca3af' }}>
                  Cache hit: {(report.leaderboard.cacheHitRatio * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Chunk Performance Section */}
        <section style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Dynamic Chunk Performance</h3>
                    
          {report.chunks.summary.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.85rem' }}>No chunks loaded yet. Interact with the app to see metrics.</p>
          ) : (
            <>
              <div style={{ marginBottom: '0.75rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong>Median Load Time:</strong> {report.chunks.medianLoadTime.toFixed(0)}ms
                {' '}
                <span style={{ 
                  color: report.chunks.medianLoadTime < PERFORMANCE_BUDGETS.CHUNK_LOAD_MEDIAN ? '#22c55e' : '#ef4444',
                  fontWeight: 'bold',
                }}>
                  ({report.chunks.medianLoadTime < PERFORMANCE_BUDGETS.CHUNK_LOAD_MEDIAN ? '✓' : '✗'} Target: {PERFORMANCE_BUDGETS.CHUNK_LOAD_MEDIAN}ms)
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Chunk Name</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Loads</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Avg Time</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {report.chunks.summary.map((metric, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {metric.chunkName}
                      </td>
                      <td style={{ padding: '0.5rem' }}>{metric.loadCount}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            color: metric.avgLoadTime < 100 ? '#22c55e' : metric.avgLoadTime < 300 ? '#f59e0b' : '#ef4444',
                            fontWeight: 'bold',
                          }}
                        >
                          {metric.avgLoadTime.toFixed(0)}ms
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            color: metric.successRate === 100 ? '#22c55e' : metric.successRate > 90 ? '#f59e0b' : '#ef4444',
                            fontWeight: 'bold',
                          }}
                        >
                          {metric.successRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        {/* Feature Flags Section */}
        <section>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Feature Flags</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Flag</th>
                <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #ddd', fontSize: '0.75rem' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {flags.map(({ flag, enabled, config }) => (
                <tr key={flag} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {flag}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        background: enabled ? '#dcfce7' : '#fee2e2',
                        color: enabled ? '#166534' : '#991b1b',
                      }}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                    {config.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Export Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button
            onClick={() => {
              const data = {
                performance: performanceMonitor.exportMetrics(),
                featureFlags: featureFlags.export(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              background: '#2C39A2',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
            }}
          >
            Export Metrics (JSON)
          </button>
        </div>
<br></br>
        {/* Help text explaining what's shown */}
        <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '4px', 
            padding: '0.75rem', 
            marginBottom: '0.75rem',
            fontSize: '0.8rem',
            color: '#0c4a6e'
          }}>
            <strong>Performance Thresholds (from Issue #82):</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li><strong>LCP:</strong> &lt;2.5s for leaderboard (Largest Contentful Paint)</li>
              <li><strong>Dynamic chunks:</strong> &lt;800ms median load time</li>
              <li><strong>Cache hit ratio:</strong> &gt;70% during race</li>
              <li><strong>Leaderboard refresh:</strong> &lt;1000ms latency</li>
            </ul>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #bae6fd' }}>
              <strong>Console Commands - Performance:</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.getPerformanceReport()</code> - Full performance report</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.getWebVitals()</code> - View Web Vitals metrics</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.getCacheStats()</code> - View cache hit ratios</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.getChunkPerformance()</code> - View chunk summary</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.getPerformanceEvents()</code> - View threshold violations</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.__performanceMonitor.clear()</code> - Clear all metrics</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.__performanceMonitor.exportMetrics()</code> - Export as JSON</div>
              </div>
              <strong style={{ display: 'block', marginTop: '0.5rem' }}>Console Commands - Feature Flags:</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.getFeatureFlags()</code> - View all flags and status</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.__featureFlags.isEnabled('flag_name')</code> - Check if enabled</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.__featureFlags.override('flag_name', true)</code> - Enable flag</div>
                <div style={{ marginBottom: '0.15rem' }}>• <code>window.__featureFlags.clearOverrides()</code> - Reset all overrides</div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

// Expose dashboard to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  let dashboardOpen = false;
  let setDashboardOpen: ((open: boolean) => void) | null = null;

  (window as any).__performanceDashboard = {
    show: () => {
      if (setDashboardOpen) {
        setDashboardOpen(true);
      } else {
        console.warn('Performance dashboard not mounted yet. Try again in a moment.');
      }
    },
    hide: () => {
      if (setDashboardOpen) {
        setDashboardOpen(false);
      }
    },
    _register: (setter: (open: boolean) => void) => {
      setDashboardOpen = setter;
    },
  };
}

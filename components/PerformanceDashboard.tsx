/**
 * Performance Dashboard Component
 * 
 * Displays chunk load performance metrics and feature flag status.
 * Accessible via window.__performanceDashboard.show() in development.
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { featureFlags, FeatureFlag } from '@/lib/feature-flags';

interface PerformanceDashboardProps {
  onClose: () => void;
}

export default function PerformanceDashboard({ onClose }: PerformanceDashboardProps) {
  const [summary, setSummary] = useState(performanceMonitor.getSummary());
  const [flags, setFlags] = useState(featureFlags.getAll());

  useEffect(() => {
    // Refresh every 2 seconds
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
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
          maxWidth: '900px',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'auto',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Performance Dashboard</h2>
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

        {/* Chunk Performance Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Dynamic Chunk Performance</h3>
          {summary.length === 0 ? (
            <p style={{ color: '#666' }}>No chunks loaded yet. Interact with the app to see metrics.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Chunk Name</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Loads</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Avg Time</th>
                  <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((metric, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {metric.chunkName}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{metric.loadCount}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          color: metric.avgLoadTime < 100 ? '#22c55e' : metric.avgLoadTime < 300 ? '#f59e0b' : '#ef4444',
                          fontWeight: 'bold',
                        }}
                      >
                        {metric.avgLoadTime.toFixed(0)}ms
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
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
          )}
        </section>

        {/* Feature Flags Section */}
        <section>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Feature Flags</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Flag</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {flags.map(({ flag, enabled, config }) => (
                <tr key={flag} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {flag}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        background: enabled ? '#dcfce7' : '#fee2e2',
                        color: enabled ? '#166534' : '#991b1b',
                      }}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                    {config.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Export Button */}
        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
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
              background: '#ff6900',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Export Metrics (JSON)
          </button>
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

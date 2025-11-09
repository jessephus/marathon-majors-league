/**
 * Skeleton Loader Component
 * 
 * Reusable skeleton loader for panel loading states
 */

import React from 'react';

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export default function SkeletonLoader({ lines = 3, className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`skeleton-loader ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
      <style jsx>{`
        .skeleton-loader {
          padding: 1rem;
        }
        .skeleton-line {
          height: 1rem;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }
        .skeleton-line:last-child {
          margin-bottom: 0;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}

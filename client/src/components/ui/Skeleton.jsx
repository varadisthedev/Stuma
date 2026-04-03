import React from 'react';

// Generates an animated skeleton UI pulsing effect
const SkeletonStyle = `
  @keyframes skeletonPulse {
    0% { background-color: #F3F4F6; }
    50% { background-color: #E5E7EB; }
    100% { background-color: #F3F4F6; }
  }
  .skeleton-pulse {
    animation: skeletonPulse 1.5s ease-in-out infinite;
  }
`;

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) {
  return (
    <>
      <style>{SkeletonStyle}</style>
      <div 
        className="skeleton-pulse" 
        style={{ width, height, borderRadius, ...style }} 
      />
    </>
  );
}

// Full page skeleton layouts based on the page type
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '32px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar Skeleton */}
      <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton height="80px" borderRadius="16px" />
        <Skeleton height="200px" borderRadius="16px" />
      </div>
      
      {/* Main Content Skeleton */}
      <div style={{ flex: 1, paddingTop: '8px' }}>
        <Skeleton width="300px" height="40px" style={{ marginBottom: '16px' }} />
        <Skeleton width="200px" height="20px" style={{ marginBottom: '32px' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <Skeleton flex="1" height="120px" borderRadius="16px" />
              <Skeleton flex="1" height="120px" borderRadius="16px" />
              <Skeleton flex="1" height="120px" borderRadius="16px" />
            </div>
            <Skeleton height="300px" borderRadius="16px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <Skeleton height="200px" borderRadius="16px" />
             <Skeleton height="260px" borderRadius="16px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GridPageSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <Skeleton width="240px" height="40px" style={{ marginBottom: '12px' }} />
          <Skeleton width="180px" height="20px" />
        </div>
        <Skeleton width="140px" height="40px" borderRadius="8px" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height="80px" borderRadius="16px" />
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <Skeleton width="240px" height="40px" style={{ marginBottom: '12px' }} />
          <Skeleton width="180px" height="20px" />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="70px" borderRadius="12px" />
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <Skeleton width="280px" height="40px" style={{ marginBottom: '12px' }} />
          <Skeleton width="180px" height="20px" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        <Skeleton flex="1" height="140px" borderRadius="16px" />
        <Skeleton flex="1" height="140px" borderRadius="16px" />
        <Skeleton flex="1" height="140px" borderRadius="16px" />
      </div>
      <Skeleton height="400px" borderRadius="16px" />
    </div>
  );
}

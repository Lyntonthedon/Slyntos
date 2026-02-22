import React from 'react';

const BroadcastIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M16.445 3.555a.75.75 0 00-1.06 1.06 8.5 8.5 0 010 10.77 .75.75 0 001.06 1.06 10 10 0 000-12.89z" />
    <path d="M13.617 6.383a.75.75 0 00-1.06 1.06 4.5 4.5 0 010 5.114.75.75 0 001.06 1.06 6 6 0 000-7.234z" />
    <path d="M11.5 9.25a.75.75 0 01.75.75v0a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v0a.75.75 0 01.75-.75h3z" />
    <path d="M10 2.5a.75.75 0 00-1.5 0V4a.75.75 0 001.5 0V2.5z" />
    <path d="M10 16a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0V16z" />
  </svg>
);

export default BroadcastIcon;

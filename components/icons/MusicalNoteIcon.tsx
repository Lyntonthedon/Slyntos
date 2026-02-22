import React from 'react';

const MusicalNoteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M7 4a1 1 0 011-1h.01a1 1 0 011 1v7.586a1 1 0 01-.293.707l-3.5 3.5a1 1 0 11-1.414-1.414l3.207-3.207V4z" />
      <path d="M10 5a1 1 0 011-1h.01a1 1 0 011 1v5.586a1 1 0 01-.293.707l-2.5 2.5a1 1 0 11-1.414-1.414l2.207-2.207V5z" />
    </svg>
);

export default MusicalNoteIcon;

import React from 'react';

const FileCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path 
      fillRule="evenodd" 
      d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.343a2 2 0 00-.586-1.414l-4.929-4.929A2 2 0 0010.343 2H4zm6 2.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 4.75zM9.25 9.75a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5z" 
      clipRule="evenodd" 
    />
    <path 
      d="M5.22 8.22a.75.75 0 011.06 0l1.25 1.25a.75.75 0 010 1.06l-1.25 1.25a.75.75 0 01-1.06-1.06L5.94 10 5.22 9.28a.75.75 0 010-1.06z" 
    />
  </svg>
);

export default FileCodeIcon;
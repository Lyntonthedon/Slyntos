import React from 'react';

const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path 
        fillRule="evenodd" 
        d="M2 4.75C2 3.784 2.784 3 3.75 3h4.422c.29 0 .575.105.805.29l.865.65A1.75 1.75 0 0010.999 4.5h5.251c.966 0 1.75.784 1.75 1.75v1.5A1.75 1.75 0 0116.25 9.5h-12.5A1.75 1.75 0 012 7.75v-3zm0 5.5v3.25c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 13.5V10.25A1.75 1.75 0 0016.25 8.5h-12.5A1.75 1.75 0 002 10.25z" 
        clipRule="evenodd" 
    />
  </svg>
);

export default FolderIcon;
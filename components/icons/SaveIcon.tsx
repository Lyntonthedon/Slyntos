import React from 'react';

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path d="M3 3.75A1.75 1.75 0 014.75 2h5.586c.464 0 .909.184 1.237.513l4.914 4.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0115.25 18H4.75A1.75 1.75 0 013 16.25V3.75z" />
    <path d="M9.75 14.25a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zM10.5 5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V5z" />
    <path d="M5.5 5.25a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0V5.25z" />
  </svg>
);

export default SaveIcon;

import React from 'react';

const ArrowUturnLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12.5 8.25a.75.75 0 010 1.5H6.31l2.47 2.47a.75.75 0 11-1.06 1.06l-3.75-3.75a.75.75 0 010-1.06l3.75-3.75a.75.75 0 111.06 1.06L6.31 8.25H12.5z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M6.75 6a.75.75 0 00-1.5 0v3.5A2.75 2.75 0 008 12.25h5.25a.75.75 0 000-1.5H8a1.25 1.25 0 01-1.25-1.25V6z"
      clipRule="evenodd"
    />
  </svg>
);

export default ArrowUturnLeftIcon;

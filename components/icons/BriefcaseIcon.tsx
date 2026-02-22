
import React from 'react';

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.795.077 1.58.22 2.365.468A2.75 2.75 0 0118 7.243v8.007A2.75 2.75 0 0115.25 18h-10.5A2.75 2.75 0 012 15.25V7.243a2.75 2.75 0 011.635-2.532c.785-.248 1.57-.39 2.365-.468v-.443zM12.5 4.193v-.443a1.25 1.25 0 00-1.25-1.25h-2.5a1.25 1.25 0 00-1.25 1.25v.443c.833.045 1.667.045 2.5 0z" clipRule="evenodd" />
        <path d="M1 7.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H1.75a.75.75 0 01-.75-.75z" />
    </svg>
);

export default BriefcaseIcon;

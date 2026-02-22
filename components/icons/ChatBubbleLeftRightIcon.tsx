import React from 'react';

const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.89-6.08 2.418a.75.75 0 00.94 1.162A8.501 8.501 0 0110 3.5c1.838 0 3.542.585 4.94 1.58a.75.75 0 00.94-1.162A9.957 9.957 0 0010 2zM3.92 5.582a.75.75 0 00-.94 1.162 8.502 8.502 0 000 7.514.75.75 0 00.94 1.162 9.957 9.957 0 010-9.838z" clipRule="evenodd" />
        <path d="M12.555 7.42a.75.75 0 01.445 1.258l-2.25 1.5a.75.75 0 01-.963-.03l-2.25-1.75a.75.75 0 11.936-1.176l1.628 1.267 1.628-1.085a.75.75 0 011.258.201z" />
        <path d="M16.08 5.582a9.957 9.957 0 010 9.838.75.75 0 00.94-1.162 8.502 8.502 0 000-7.514.75.75 0 00-.94-1.162z" />
    </svg>
);

export default ChatBubbleLeftRightIcon;

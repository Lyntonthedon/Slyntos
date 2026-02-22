import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion } from 'motion/react';
import type { Message as MessageType, User } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import DownloadIcon from './icons/DownloadIcon';
import LinkIcon from './icons/LinkIcon';
import { Page } from '../types';

interface MessageProps {
  message: MessageType;
  currentUser: User;
  onHumanize?: (text: string) => void;
  onVideoComplete?: (url: string) => void;
  page?: Page;
}

// Custom components to enhance markdown rendering
const MarkdownComponents = {
  // Make bold text more visible
  strong: ({ node, ...props }) => (
    <strong className="font-bold text-white" {...props} />
  ),
  // Handle headings
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold text-white mt-4 mb-2 first:mt-0" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold text-white mt-4 mb-2 first:mt-0" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold text-white mt-3 mb-1" {...props} />
  ),
  // Style lists properly
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-inside space-y-1 my-2" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="text-gray-100" {...props} />
  ),
  // Style paragraphs
  p: ({ node, ...props }) => (
    <p className="my-2 text-gray-100" {...props} />
  ),
};

const Message: React.FC<MessageProps> = ({ message, currentUser, page, onVideoComplete }) => {
  const { role, content, images, videoUrl, videoScript, audioUrl, sources } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDocDownload = (type: 'word' | 'excel', docContent: string, filename: string) => {
    let blob;
    if (type === 'excel') {
      blob = new Blob(['\ufeff' + docContent.trim()], { type: 'text/csv;charset=utf-8;' });
      if (!filename.toLowerCase().endsWith('.csv')) {
        filename = filename.replace(/\.(xlsx|xls)$/i, '') + '.csv';
      }
    } else {
      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'></head>
        <body>${docContent}</body>
        </html>
      `;
      blob = new Blob([header], { type: 'application/msword' });
      if (!filename.toLowerCase().endsWith('.doc')) {
        filename = filename.replace(/\.docx$/i, '') + '.doc';
      }
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const renderDocs = () => {
    if (!content) return null;
    const docRegex = /```(word|excel):([\w.-]+)\n([\s\S]*?)\n```/g;
    const docs = [];
    let match;
    while ((match = docRegex.exec(content)) !== null) {
      docs.push({ type: match[1] as 'word' | 'excel', filename: match[2], content: match[3] });
    }
    
    if (docs.length === 0) return null;
    
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {docs.map((doc, idx) => (
          <button
            key={idx}
            onClick={() => handleDocDownload(doc.type, doc.content, doc.filename)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 shadow-lg ${
              isUser ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            {doc.filename}
          </button>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`relative max-w-[85%] group ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`rounded-2xl px-5 py-4 shadow-xl ${
          isUser 
            ? 'bg-gray-800 text-gray-100' // Changed from white to match assistant
            : 'bg-gray-800 text-gray-100'
        }`}>
          <div className={`prose max-w-none text-[15px] leading-relaxed font-medium ${
            isUser 
              ? 'prose-invert prose-slate prose-p:text-gray-100 prose-strong:text-white prose-code:text-emerald-400' 
              : 'prose-invert prose-slate prose-p:text-gray-100 prose-strong:text-white prose-code:text-emerald-400'
          }`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={MarkdownComponents}
            >
              {content ? content.replace(/```(word|excel):[\w.-]+\n[\s\S]*?\n```/g, '') : '...'}
            </ReactMarkdown>
          </div>

          {renderDocs()}

          {images && images.length > 0 && (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <img key={idx} src={`data:image/png;base64,${img}`} alt="Asset" className="max-w-[280px] rounded-xl shadow-lg border border-white/10 transition-all hover:scale-[1.02]" />
              ))}
            </div>
          )}

          {videoUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black max-w-full aspect-video">
              <video 
                key={videoUrl}
                controls 
                playsInline 
                className="w-full h-full object-cover"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {audioUrl && <audio controls src={audioUrl} className={`mt-4 h-8 w-full max-w-xs ${isUser ? 'opacity-80' : 'invert opacity-60'}`} />}

          {sources && sources.length > 0 && (
            <div className={`mt-6 pt-4 border-t space-y-3 ${isUser ? 'border-white/10' : 'border-white/5'}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${isUser ? 'text-slate-500' : 'text-slate-500'}`}>Sources</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all active:scale-95 ${
                      isUser ? 'bg-white/5 text-blue-400 hover:bg-white/10 border border-white/5' : 'bg-white/5 text-blue-400 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isUser && content && (
          <button
            onClick={handleCopy}
            className="absolute -right-10 top-2 p-2 text-slate-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all bg-white/5 hover:bg-white/10 rounded-lg border border-white/5"
            title="Copy Output"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
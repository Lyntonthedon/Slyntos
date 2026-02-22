
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChatInterface from './ChatInterface';
import { Page, User, ChatSession, FileData, GenConfig } from '../types';
import { SYSTEM_INSTRUCTION_WEBSITE } from '../constants';
import DownloadIcon from './icons/DownloadIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import BoltIcon from './icons/BoltIcon';
import DevicePhoneMobileIcon from './icons/DevicePhoneMobileIcon';
import CodeBracketSquareIcon from './icons/CodeBracketSquareIcon';
import RobotIcon from './icons/RobotIcon';
import AdjustmentsHorizontalIcon from './icons/AdjustmentsHorizontalIcon';
import ServerIcon from './icons/ServerIcon';
import FolderIcon from './icons/FolderIcon';
import FileCodeIcon from './icons/FileCodeIcon';
import BroadcastIcon from './icons/BroadcastIcon';
import CheckIcon from './icons/CheckIcon';
import JSZip from 'jszip';

interface WebsiteCreatorPageProps {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
  currentUser: User;
  onUsageIncrement?: (page: Page) => void;
  onUpgradeClick?: () => void;
  isRightSidebarOpen?: boolean;
  setIsRightSidebarOpen?: (val: boolean) => void;
}

type Tab = 'preview' | 'database' | 'files';

const WebsiteCreatorPage: React.FC<WebsiteCreatorPageProps> = ({ 
  session, onSessionUpdate, currentUser, onUsageIncrement, 
  isRightSidebarOpen, setIsRightSidebarOpen 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);

  const [advConfig, setAdvConfig] = useState<GenConfig>(session.sessionConfig || {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    systemInstructionOverride: ''
  });

  const projectFiles = useMemo(() => {
    const lastMessage = session.messages.findLast(m => m.role === 'model');
    if (!lastMessage) return [];
    
    const content = lastMessage.content;
    const blocks: { path: string, content: string, lang: string }[] = [];
    
    // 1. First try the new '---filename---' delimiter
    const customFileRegex = /---([\w./-]+)---\n([\s\S]*?)(?=\n---|$)/g;
    let match;
    while ((match = customFileRegex.exec(content)) !== null) {
      const path = match[1];
      const fileContent = match[2].trim();
      const ext = path.split('.').pop() || 'text';
      blocks.push({ path, content: fileContent, lang: ext });
    }

    // 2. Fallback to standard Markdown blocks if no custom delimiters found
    if (blocks.length === 0) {
      const blockRegex = /```([\w-]*)(?::([\w./-]+))?\n([\s\S]*?)\n```/g;
      while ((match = blockRegex.exec(content)) !== null) {
        const lang = match[1] || 'text';
        const path = match[2] || (lang === 'html' ? 'index.html' : `file_${blocks.length}.${lang}`);
        blocks.push({ lang, path, content: match[3].trim() });
      }
    }
    
    return blocks;
  }, [session.messages]);

  const rawPreviewHtml = useMemo(() => {
    const htmlFile = projectFiles.find(f => f.path === 'index.html' || f.lang === 'html');
    return htmlFile ? htmlFile.content : '';
  }, [projectFiles]);

  const processedHtml = useMemo(() => {
    if (!rawPreviewHtml) return '';
    let result = rawPreviewHtml.trim();
    
    if (!result.toLowerCase().includes('<html')) {
      result = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #050505; color: white; margin: 0; }
    .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
    .glow { box-shadow: 0 0 30px rgba(59, 130, 246, 0.2); }
  </style>
</head>
<body class="antialiased">
  ${result}
</body>
</html>`;
    }
    return result;
  }, [rawPreviewHtml]);

  const handlePublish = async () => {
    if (!processedHtml) return;
    setIsPublishing(true);
    
    // Automatic Launch Protocol
    const blob = new Blob([processedHtml], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Simulate server deploy
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    window.open(blobUrl, '_blank');
    
    const randomHash = Math.random().toString(36).substring(7).toUpperCase();
    setPublishUrl(`https://slyntos.live/${randomHash}`);
    setIsPublishing(false);
  };

  const handleExport = async () => {
    const zip = new JSZip();
    projectFiles.forEach(file => zip.file(file.path, file.content));
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slyntos-architect-v1.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full bg-transparent overflow-hidden relative">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            <div className={`relative transition-all duration-500 w-full md:w-[38%] border-r border-gray-800`}>
            <ChatInterface
                session={session}
                onSessionUpdate={(updated) => onSessionUpdate({ ...updated, sessionConfig: advConfig })}
                page={Page.WebBuilder}
                systemInstruction={SYSTEM_INSTRUCTION_WEBSITE}
                placeholderText={`Describe the website you want to build...`}
                currentUser={currentUser}
                onLoadingStateChange={setIsLoading}
                onUsageIncrement={onUsageIncrement}
                isRightSidebarOpen={isRightSidebarOpen || false}
                setIsRightSidebarOpen={setIsRightSidebarOpen || (() => {})}
                advancedConfig={advConfig}
                setAdvancedConfig={setAdvConfig}
            />
            </div>

            <div className="flex-1 flex flex-col bg-black/20 relative">
            <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-black/40">
                {[
                { id: 'preview', label: 'Preview', icon: <BoltIcon className="w-4 h-4" /> },
                { id: 'database', label: 'Database', icon: <ServerIcon className="w-4 h-4" /> },
                { id: 'files', label: 'Files', icon: <FolderIcon className="w-4 h-4" /> }
                ].map(t => (
                <button
                    key={t.id} onClick={() => setActiveTab(t.id as Tab)}
                    className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest py-2.5 transition-all border-b-2 ${activeTab === t.id ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    {t.icon} <span className="hidden sm:inline">{t.label}</span>
                </button>
                ))}
                
                <div className="ml-auto flex items-center gap-4">
                    {processedHtml && (
                        <button 
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                        >
                          <BroadcastIcon className="w-4 h-4" />
                          {isPublishing ? 'Publishing...' : 'Publish Website'}
                        </button>
                    )}
                    <button onClick={handleExport} className="p-2.5 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 hover:border-white/20" title="Download Files">
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {publishUrl && (
              <div className="bg-emerald-600/10 border-b border-emerald-500/20 px-6 py-3.5 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-emerald-400">Website Published:</span>
                      <span className="text-[10px] font-mono text-gray-500">Live preview opened in new tab</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(publishUrl); alert("Link copied!"); }} className="text-[9px] font-black uppercase text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-500">Copy Link</button>
              </div>
            )}

            <div className="flex-1 relative overflow-hidden bg-black/40">
                {activeTab === 'preview' && (
                <div className="w-full h-full relative">
                    {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl">
                        <div className="relative mb-6">
                            <div className="absolute inset-[-20px] bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                            <RobotIcon className="w-16 h-16 text-white animate-bounce relative z-10" />
                        </div>
                        <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] animate-pulse">Building your website...</p>
                    </div>
                    )}
                    {processedHtml ? (
                    <iframe 
                        key={processedHtml.length}
                        title="Live Preview" className="w-full h-full border-none bg-white" 
                        sandbox="allow-scripts allow-modals allow-same-origin" srcDoc={processedHtml}
                    />
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-[0.03]">
                        <CodeBracketSquareIcon className="w-32 h-32 text-white" />
                        <p className="mt-6 text-sm font-black uppercase tracking-[1em] text-white">Start Building</p>
                    </div>
                    )}
                </div>
                )}

                {activeTab === 'database' && (
                <div className="w-full h-full flex flex-col p-10 overflow-y-auto scrollbar-hide">
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8">Database</h2>
                    <div className="flex-1 flex flex-col items-center justify-center opacity-5">
                        <ServerIcon className="w-24 h-24 mb-6 text-white" />
                        <p className="text-xs font-black uppercase tracking-[0.5em] text-white">No data yet</p>
                    </div>
                </div>
                )}

                {activeTab === 'files' && (
                <div className="w-full h-full flex flex-col p-10 overflow-y-auto scrollbar-hide">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Files</h2>
                        <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-md">{projectFiles.length} Files</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 pb-32">
                        {projectFiles.map((file, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                            <div className="px-6 py-4 bg-white/[0.03] flex justify-between items-center border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <FileCodeIcon className="w-4 h-4 text-blue-500" />
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest font-mono">{file.path}</span>
                                </div>
                            </div>
                            <pre className="p-8 text-[12px] text-gray-500 font-mono overflow-x-auto leading-relaxed">
                                <code>{file.content}</code>
                            </pre>
                        </div>
                        ))}
                    </div>
                </div>
                )}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteCreatorPage;

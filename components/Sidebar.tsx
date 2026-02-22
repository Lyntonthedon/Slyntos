
import React from 'react';
import type { ChatSession, Page, User } from '../types';
import { Page as PageEnum } from '../types';
import TrashIcon from './icons/TrashIcon';
import SlyntosLogo from './icons/SlyntosLogo';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import CodeBracketSquareIcon from './icons/CodeBracketSquareIcon';
import PlayIcon from './icons/PlayIcon';
import RocketIcon from './icons/RocketIcon';
import MenuIcon from './icons/MenuIcon';
import { PLAN_LIMITS } from '../constants';

const Sidebar: React.FC<any> = ({ 
  sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession,
  isOpen, onClose, currentPage, onNavigate, currentUser, onLogout, onUpgradeClick,
  isCollapsed, setIsCollapsed
}) => {
  const NavItem: React.FC<{ page: Page, icon: React.ReactNode, label: string }> = ({ page, icon, label }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-tight transition-all duration-300 ${
        currentPage === page 
          ? 'bg-white text-black shadow-2xl shadow-white/5 scale-[1.02]' 
          : 'text-slate-500 hover:bg-white/5 hover:text-white'
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
      title={label}
    >
      <div className={`transition-colors ${currentPage === page ? 'text-black' : 'text-slate-600'}`}>
        {icon}
      </div>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );

  const globalUsage = currentUser.usageCounts?.global || 0;
  const globalLimit = PLAN_LIMITS[currentUser.plan] || 5;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-[60] md:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <aside className={`fixed top-0 left-0 z-[70] h-full bg-gray-950 border-r border-gray-800 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex flex-col h-full">
          <div className={`p-7 flex items-center gap-3 ${isCollapsed ? 'justify-center p-5' : ''}`}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl flex-shrink-0">
              <SlyntosLogo className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-black text-white tracking-tighter italic text-lg leading-none">Slyntos AI</span>
                <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.4em] mt-1">Universal Assistant</span>
              </div>
            )}
          </div>

          <div className="px-4 mb-4">
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex w-full items-center justify-center p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
             >
                <MenuIcon className="w-5 h-5" />
             </button>
          </div>

          <nav className="px-4 space-y-2">
            <NavItem page={PageEnum.General} icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} label="General Chat" />
            <NavItem page={PageEnum.Edu} icon={<AcademicCapIcon className="w-4 h-4" />} label="Slyntos Edu" />
            <NavItem page={PageEnum.Studio} icon={<PlayIcon className="w-4 h-4" />} label="Slyntos Studio" />
            <NavItem page={PageEnum.WebBuilder} icon={<CodeBracketSquareIcon className="w-4 h-4" />} label="Web Builder" />
          </nav>

          {!isCollapsed && currentUser.plan === 'starter' && (
            <div className="px-4 mt-6">
               <button 
                onClick={onUpgradeClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase italic shadow-2xl hover:bg-gray-200 transition-all active:scale-95 group"
               >
                 <RocketIcon className="w-4 h-4 group-hover:animate-bounce" />
                 Upgrade 😉
               </button>
            </div>
          )}

          <div className={`mt-8 px-7 flex items-center justify-between mb-3 ${isCollapsed ? 'hidden' : ''}`}>
            <h3 className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Chats</h3>
            <button onClick={onNewChat} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto px-4 pb-4 space-y-1 scrollbar-hide ${isCollapsed ? 'hidden' : ''}`}>
            {sessions.map((s: ChatSession) => (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`w-full text-left group flex items-center justify-between px-3.5 py-3 rounded-xl text-[11px] font-bold transition-all ${
                  activeSessionId === s.id ? 'bg-white/5 text-white border-white/10' : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300'
                } border`}
              >
                <span className="truncate flex-1 pr-2">{s.title || 'New Chat'}</span>
                <span onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                  <TrashIcon className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-gray-800 bg-black/40">
            {!isCollapsed && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5 px-3">
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Bandwidth</span>
                    <span className="text-[8px] font-black text-white">{globalUsage} / {globalLimit}</span>
                </div>
                <div className="h-1 mx-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.min((globalUsage / globalLimit) * 100, 100)}%` }} />
                </div>
              </div>
            )}

            <div className={`flex flex-col gap-2`}>
              <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-black text-black text-xs flex-shrink-0">
                  {currentUser.username[0]}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate uppercase">{currentUser.username}</p>
                    <p className="text-[8px] uppercase font-black tracking-widest text-blue-500">{currentUser.plan}</p>
                  </div>
                )}
                
                <button 
                  onClick={onLogout} 
                  className="p-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-75 shadow-lg"
                  title="Log out"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

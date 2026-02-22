
import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, User, Page } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { generateVideo } from '../services/geminiService';
import PlayIcon from './icons/PlayIcon';
import StopIcon from './icons/StopIcon';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';
import Loader from './Loader';

interface Scene {
  text: string;
  background: string;
  textColor: string;
  duration: number; // ms
  animation: 'fade' | 'slide' | 'zoom' | 'none';
}

interface VideoScript {
  title: string;
  scenes: Scene[];
}

interface VideoCreatorPageProps {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
  currentUser: User;
  onUsageIncrement: (page: Page) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (open: boolean) => void;
}

const VideoCreatorPage: React.FC<VideoCreatorPageProps> = ({
  session,
  onSessionUpdate,
  currentUser,
  onUsageIncrement,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setVideoUrl(null);
    setStatus('Initializing Engine...');
    
    try {
      const url = await generateVideo(prompt, '16:9', (msg) => setStatus(msg));
      setVideoUrl(url);
      onUsageIncrement(Page.Studio);
    } catch (error) {
      console.error("Video generation failed", error);
      setStatus('Synthesis Failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Slyntos Studio</h1>
            <p className="text-gray-500 text-sm font-medium">Create amazing videos with Slyntos AI.</p>
          </div>

          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">What do you want to create?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to make..."
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-gray-700 transition-all min-h-[100px] resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader /> : <SparklesIcon className="w-4 h-4" />}
              {isGenerating ? status : 'Create Video'}
            </button>
          </div>

          {videoUrl && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gray-900 aspect-video rounded-3xl border border-gray-800 shadow-2xl overflow-hidden relative group">
                <video 
                  src={videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full h-full object-cover"
                />
              </div>

              <a
                href={videoUrl}
                download="slyntos_asset.mp4"
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/10"
              >
                <DownloadIcon className="w-4 h-4" />
                Export Asset
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCreatorPage;

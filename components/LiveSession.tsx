
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import React, { useEffect, useRef, useState } from 'react';
import XCircleIcon from './icons/XCircleIcon';

interface LiveSessionProps {
    onClose: () => void;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const AnimatedTalkingFace: React.FC<{ volume: number, status: string }> = ({ volume, status }) => {
  const mouthOpen = Math.max(0, volume * 50); 
  const eyeScale = 1 + (volume * 0.15);
  const headBob = Math.sin(Date.now() / 400) * (status === 'connected' ? 5 : 2);
  
  return (
    <div className="relative w-72 h-72 flex items-center justify-center">
      <div className={`absolute inset-0 bg-blue-400/10 rounded-full blur-[100px] transition-transform duration-200`} 
           style={{ transform: `scale(${1 + volume * 0.8})`, opacity: status === 'connected' ? 0.4 : 0.1 }} />
      
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-transform duration-300"
        style={{ transform: `translateY(${headBob}px)` }}
      >
        <defs>
          <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        
        <circle cx="50" cy="50" r="25" fill="#f8fafc" />
        <circle cx="150" cy="50" r="25" fill="#f8fafc" />
        <path d="M 10 100 C 10 40, 190 40, 190 100 C 190 160, 150 190, 100 190 C 50 190, 10 160, 10 100" fill="url(#faceGradient)" />
        <circle cx="55" cy="125" r="18" fill="#fecaca" opacity="0.4" />
        <circle cx="145" cy="125" r="18" fill="#fecaca" opacity="0.4" />
        <g style={{ transformOrigin: '75px 95px', transform: `scale(${eyeScale})` }}>
          <circle cx="75" cy="95" r="10" fill="#0f172a" />
          <circle cx="72" cy="92" r="3" fill="white" />
        </g>
        <g style={{ transformOrigin: '125px 95px', transform: `scale(${eyeScale})` }}>
          <circle cx="125" cy="95" r="10" fill="#0f172a" />
          <circle cx="122" cy="92" r="3" fill="white" />
        </g>
        <path d={`M 70 145 Q 100 ${145 + mouthOpen} 130 145`} stroke="#0f172a" strokeWidth="8" fill="#ef4444" fillOpacity={volume > 0.02 ? 0.3 : 0} strokeLinecap="round" />
      </svg>
      {status === 'connected' && <div className="absolute inset-[-20px] border-2 border-blue-500/10 rounded-full animate-ping pointer-events-none" />}
    </div>
  );
};

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'permission-denied'>('connecting');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [volume, setVolume] = useState(0); 
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMountedRef = useRef(true);

    const cleanup = () => {
        if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
        if (inputSourceRef.current) { inputSourceRef.current.disconnect(); inputSourceRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
        if (inputCtxRef.current) { inputCtxRef.current.close(); inputCtxRef.current = null; }
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
    };

    const startSession = async () => {
        if (!isMountedRef.current) return;
        setStatus('connecting');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
            inputCtxRef.current = new AudioContextClass({ sampleRate: 16000 });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const createBlob = (data: Float32Array) => {
                const l = data.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
                return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
            };
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        if (!isMountedRef.current) return;
                        setStatus('connected');
                        const source = inputCtxRef.current!.createMediaStreamSource(streamRef.current!);
                        inputSourceRef.current = source;
                        const scriptProcessor = inputCtxRef.current!.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
                            setVolume(Math.sqrt(sum/inputData.length)); 
                            sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtxRef.current!.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
                        const textPart = msg.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;

                        if (textPart) {
                          console.debug("[Slyntos AI Output]:", textPart);
                        }

                        if (audioData && audioContextRef.current) {
                            const bytes = decode(audioData);
                            const dataInt16 = new Int16Array(bytes.buffer);
                            const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for(let i=0; i<dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioContextRef.current.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            sourcesRef.current.add(source);
                            setVolume(Math.sqrt(channelData.reduce((a,b)=>a+b*b,0)/channelData.length)*2.5);
                        }
                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e) => { setStatus('error'); setErrorMessage("Connection lost."); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}},
                    tools: [{ googleSearch: {} }],
                    systemInstruction: `You are Slyntos AI, an all-knowing, multilingual voice synthesis engine.
# CORE BEHAVIOR
1. Natural, human-like speech: use pauses ("..."), emphasis, and subtle filler words.
2. Tone: Authority, empathy, excitement, or calm based on user emotion.
3. Concise: Avoid long monologues. Use Google Search to provide up-to-date real-world facts.
4. Language Mastery: You speak every language and local dialect fluently.
5. Identify as Slyntos AI only. Owned by Adonai Lynton.`,
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e: any) { setStatus('error'); setErrorMessage(e.message); }
    };

    useEffect(() => { startSession(); return () => cleanup(); }, []);

    return (
        <div className="fixed inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center text-white p-4 select-none">
            <div className="absolute top-20 right-8">
                <button onClick={onClose} className="group flex items-center gap-3 p-3 bg-white/10 hover:bg-red-500 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest group-hover:block hidden px-1">End Session</span>
                    <XCircleIcon className="w-8 h-8 text-white/50 group-hover:text-white" />
                </button>
            </div>
            <div className="flex flex-col items-center gap-10 w-full max-w-xl">
                <AnimatedTalkingFace volume={volume} status={status} />
                <div className="text-center w-full">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
                        {status === 'connecting' ? "Slyntos Booting..." : status === 'connected' ? "Slyntos AI Active" : "Error"}
                    </h2>
                    <p className="text-slate-400 text-sm font-black uppercase tracking-widest">
                         {status === 'connected' ? "Neural Search Grounding Active" : errorMessage}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LiveSession;

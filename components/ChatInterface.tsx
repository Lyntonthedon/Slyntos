import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Send, Paperclip, Mic, X } from 'lucide-react';
import { generateContentStream } from '../services/geminiService';
import type { Message, FileData, Page, User, ChatSession, Source, GenConfig } from '../types';
import MessageComponent from './Message';
import SlyntosLogo from './icons/SlyntosLogo';
import { Page as PageEnum } from '../types';
import LiveSession from './LiveSession';
import ContextualPanel from './ContextualPanel';
import { PLAN_LIMITS } from '../constants';

interface ChatInterfaceProps {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
  systemInstruction: string;
  placeholderText: string;
  currentUser: User;
  page: Page;
  children?: React.ReactNode;
  onLoadingStateChange?: (isLoading: boolean) => void;
  onUsageIncrement?: (page: Page) => void;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (val: boolean) => void;
  advancedConfig?: GenConfig;
  setAdvancedConfig?: (val: GenConfig) => void;
}

// Pre-defined configs to avoid recreating objects
const DEFAULT_ADV_CONFIG: GenConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
};

// Cache for quick responses
const responseCache = new Map<string, string>();

// Helper function to format response with proper structure
const formatResponse = (text: string): string => {
  // Remove any excessive markdown symbols
  let cleanedText = text
    .replace(/#{3,}/g, '') // Remove ###
    .replace(/\*\*/g, '') // Remove **
    .replace(/\*/g, '') // Remove *
    .replace(/\n{3,}/g, '\n\n'); // Normalize multiple line breaks

  return cleanedText;
};

// STEP 1: Generate raw AI content
const generateRawContent = async (
  userInput: string,
  options: any,
  page: Page
): Promise<string> => {
  const rawPrompt = `
    Write comprehensive content about: ${userInput}
    
    Requirements:
    - Be thorough and detailed
    - Cover all important aspects
    - Structure the information logically
    - Don't worry about making it sound human yet
  `;

  let rawContent = '';
  const stream = generateContentStream(
    [{ role: 'user', content: rawPrompt }],
    "You are a content writer.",
    page,
    options
  );

  for await (const chunk of stream) {
    if (chunk.text) {
      rawContent += chunk.text;
    }
  }

  return rawContent;
};

// STEP 2: Humanize the content (behind the scenes)
const humanizeContent = async (
  rawContent: string,
  tone: string,
  options: any,
  page: Page
): Promise<string> => {
  const humanizerPrompt = `
    Rewrite the following text to sound 100% human-written and undetectable by AI detectors.
    
    CRITICAL HUMANIZATION RULES (APPLY ALL):
    
    1. CONTRACTIONS (MUST USE):
       - don't, can't, won't, wouldn't, shouldn't, couldn't
       - it's, that's, there's, here's, what's
       - I'm, you're, we're, they're
       - I've, you've, we've, they've
       - I'll, you'll, we'll, they'll
    
    2. FILLER WORDS & PHRASES (use naturally):
       - like, well, actually, basically, honestly
       - you know, I mean, sort of, kind of, pretty much
       - the thing is, the truth is, to be honest
    
    3. SENTENCE VARIETY:
       - Mix very short sentences (3-5 words) with longer ones
       - Use occasional fragments: "Really makes you think."
       - Start sentences differently: Not always with "The" or "This"
       - Add rhetorical questions: "Know what I mean?" "Right?"
    
    4. NATURAL LANGUAGE:
       - Use everyday vocabulary, not fancy words
       - Add idioms: "hit the nail on the head", "on the flip side"
       - Use parentheses for asides (like this)
       - Add em-dashes for emphasis—like this
    
    5. AVOID AI PATTERNS:
       - NO "In conclusion" or "First and foremost"
       - NO perfect paragraph lengths
       - NO repetitive sentence structures
       - NO transition words like "however", "therefore", "consequently"
    
    6. ADD HUMAN TOUCHES:
       - Include a personal opinion: "I think", "in my experience"
       - Show some enthusiasm: "It's really fascinating how..."
       - Be slightly informal: "Here's the thing..."
       - Use active voice mostly
    
    TEXT TO HUMANIZE:
    ${rawContent}
    
    Return ONLY the humanized version. No explanations.
  `;

  let humanizedContent = '';
  const stream = generateContentStream(
    [{ role: 'user', content: humanizerPrompt }],
    "You are a humanization expert. Make text undetectable by AI detectors.",
    page,
    options
  );

  for await (const chunk of stream) {
    if (chunk.text) {
      humanizedContent += chunk.text;
    }
  }

  return humanizedContent;
};

// Combined function for EDU page (humanizes behind the scenes)
const generateHumanizedContent = async (
  userInput: string,
  tone: string,
  options: any,
  page: Page,
  onChunk: (text: string) => void
): Promise<string> => {
  // STEP 1: Generate raw content (user never sees this)
  const rawContent = await generateRawContent(userInput, options, page);
  
  // STEP 2: Humanize it (user never sees this intermediate state)
  const humanizedContent = await humanizeContent(rawContent, tone, options, page);
  
  // STEP 3: Stream the final humanized content to user
  // Split into chunks for streaming effect
  const chunkSize = 10;
  for (let i = 0; i < humanizedContent.length; i += chunkSize) {
    const chunk = humanizedContent.substring(i, i + chunkSize);
    onChunk(chunk);
    // Small delay for streaming effect
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return humanizedContent;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  session,
  onSessionUpdate,
  systemInstruction,
  placeholderText,
  currentUser,
  page,
  children,
  onLoadingStateChange,
  onUsageIncrement,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  advancedConfig,
  setAdvancedConfig,
}) => {
  // State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLiteMode, setIsLiteMode] = useState(true);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoDuration, setVideoDuration] = useState<number>(6);
  const [academicTone, setAcademicTone] = useState<'Analytical' | 'Critical' | 'Reflective'>('Analytical');
  const [localAdvConfig, setLocalAdvConfig] = useState<GenConfig>(advancedConfig || session.sessionConfig || DEFAULT_ADV_CONFIG);
  const [typingDots, setTypingDots] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSubmissionRef = useRef<number>(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const typingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Use ref for session to avoid dependency in effects
  const sessionRef = useRef<ChatSession>(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Typing animation effect
  useEffect(() => {
    if (isLoading) {
      typingIntervalRef.current = setInterval(() => {
        setTypingDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 400);
    } else {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = undefined;
      }
      setTypingDots('');
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Memoized values
  const hasMessages = useMemo(() => session.messages.length > 0, [session.messages]);
  const isSubmitDisabled = useMemo(() => 
    isLoading || (!input.trim() && files.length === 0),
    [isLoading, input, files]
  );

  // Effects
  useEffect(() => {
    if (setAdvancedConfig) setAdvancedConfig(localAdvConfig);
  }, [localAdvConfig, setAdvancedConfig]);

  useEffect(() => {
    onLoadingStateChange?.(isLoading);
  }, [isLoading, onLoadingStateChange]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  // Scroll on new messages
  useEffect(() => {
    if (hasMessages) {
      scrollToBottom();
    }
  }, [session.messages, hasMessages, scrollToBottom]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Handlers
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const selectedFiles = Array.from(event.target.files);
    
    const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      alert('Total file size exceeds 10MB');
      return;
    }

    const readFileAsBase64 = (file: File): Promise<FileData> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          resolve({ name: file.name, type: file.type, data: base64Data, size: file.size });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const newFileData = await Promise.all(selectedFiles.map(readFileAsBase64));
      setFiles(prev => [...prev, ...newFileData]);
    } catch (error) {
      console.error('File read error:', error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const checkUsageLimit = useCallback((): boolean => {
    const globalUsage = currentUser.usageCounts.global || 0;
    const limit = PLAN_LIMITS[currentUser.plan] || 5;
    
    if (globalUsage >= limit) {
      onSessionUpdate({
        ...session,
        messages: [...session.messages, {
          role: 'model',
          content: `⚠️ **Daily Limit Reached (${limit}/${limit})**\nYou have used all your requests for today. Please upgrade to get more.`
        }]
      });
      return false;
    }
    return true;
  }, [currentUser, session, onSessionUpdate]);

  // Submit handler - Humanizes behind the scenes for EDU page
  const handleSubmit = useCallback(async (customInput?: string, overrideInstruction?: string) => {
    const finalInput = customInput || input;
    
    // Simple debounce to prevent double submissions
    const now = Date.now();
    if (now - lastSubmissionRef.current < 500) {
      return;
    }
    
    if (isSubmitDisabled) return;
    if (!checkUsageLimit()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    lastSubmissionRef.current = now;

    const userMessage: Message = {
      role: 'user',
      content: finalInput,
      files: files.length > 0 ? [...files] : undefined,
    };

    const messagesWithUser = [...session.messages, userMessage];
    const newTitle = session.messages.length === 0 
      ? finalInput.trim().split(' ').slice(0, 5).join(' ') 
      : session.title;

    // Check cache first for instant responses
    const cacheKey = `${finalInput}-${page}-${isThinkingMode}`;
    const cachedResponse = responseCache.get(cacheKey);
    
    if (cachedResponse) {
      // Instant cached response
      onSessionUpdate({
        ...session,
        messages: [...messagesWithUser, {
          role: 'model',
          content: cachedResponse,
        }],
        title: newTitle,
      });
      
      if (!customInput) {
        setInput('');
        setFiles([]);
      }
      
      onUsageIncrement?.(page);
      return;
    }

    // Only add user message first
    onSessionUpdate({
      ...session,
      messages: messagesWithUser,
      title: newTitle,
    });

    // Clear input immediately
    if (!customInput) {
      setInput('');
      setFiles([]);
    }

    setIsLoading(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      let fullResponse = '';
      let allSources: Source[] = [];
      let allImages: string[] = [];
      let finalVideoUrl: string | undefined;
      let finalVideoScript: any;
      let hasCreatedModelMessage = false;

      const options = {
        useThinking: isThinkingMode,
        useLite: isLiteMode,
        aspectRatio,
        videoDuration,
        advancedConfig: localAdvConfig,
        currentUser: currentUser,
      };

      if (page === PageEnum.Edu) {
        // 🔥 EDU PAGE: Humanize behind the scenes
        // User never sees the AI-generated version
        
        await generateHumanizedContent(
          finalInput,
          academicTone,
          options,
          page,
          (chunk) => {
            // Stream the humanized content chunk by chunk
            fullResponse += chunk;
            const cleanedResponse = formatResponse(fullResponse);

            if (!hasCreatedModelMessage) {
              onSessionUpdate({
                ...sessionRef.current,
                messages: [...messagesWithUser, {
                  role: 'model',
                  content: cleanedResponse,
                  sources: allSources,
                  images: allImages.length > 0 ? allImages : undefined,
                  videoUrl: finalVideoUrl,
                  videoScript: finalVideoScript,
                }],
                title: newTitle,
              });
              hasCreatedModelMessage = true;
            } else {
              onSessionUpdate({
                ...sessionRef.current,
                messages: [...messagesWithUser, {
                  role: 'model',
                  content: cleanedResponse,
                  sources: allSources,
                  images: allImages.length > 0 ? allImages : undefined,
                  videoUrl: finalVideoUrl,
                  videoScript: finalVideoScript,
                }],
                title: newTitle,
              });
            }
          }
        );
      } else {
        // Other pages: Normal streaming
        const formattingInstruction = `
          Format your responses with clear structure:
          - Use ## for main headings (they will appear as bold titles)
          - Use **bold** for key points within sections
          - Use bullet points (•) for listing items under headings
          - Each bullet point should be on its own line
          - Headings and their content should be on separate lines
          - Never put a heading and its explanation on the same line
          - Use paragraphs for longer explanations when needed
        `;

        const finalInstruction = overrideInstruction || 
          systemInstruction + formattingInstruction;

        const stream = generateContentStream(
          messagesWithUser,
          finalInstruction,
          page,
          options
        );

        for await (const chunk of stream) {
          if (abortControllerRef.current?.signal.aborted) break;

          if (chunk.text) {
            fullResponse += chunk.text;
          }
          
          if (chunk.sources) allSources = [...allSources, ...chunk.sources];
          if (chunk.images) allImages = [...allImages, ...chunk.images];
          if (chunk.videoUrl) finalVideoUrl = chunk.videoUrl;
          if (chunk.videoScript) finalVideoScript = chunk.videoScript;

          const cleanedResponse = formatResponse(fullResponse);

          if (!hasCreatedModelMessage) {
            onSessionUpdate({
              ...sessionRef.current,
              messages: [...messagesWithUser, {
                role: 'model',
                content: cleanedResponse,
                sources: allSources,
                images: allImages.length > 0 ? allImages : undefined,
                videoUrl: finalVideoUrl,
                videoScript: finalVideoScript,
              }],
              title: newTitle,
            });
            hasCreatedModelMessage = true;
          } else {
            onSessionUpdate({
              ...sessionRef.current,
              messages: [...messagesWithUser, {
                role: 'model',
                content: cleanedResponse,
                sources: allSources,
                images: allImages.length > 0 ? allImages : undefined,
                videoUrl: finalVideoUrl,
                videoScript: finalVideoScript,
              }],
              title: newTitle,
            });
          }
        }
      }

      // Cache the response
      if (fullResponse.length < 500) {
        responseCache.set(cacheKey, fullResponse);
      }

      onUsageIncrement?.(page);
    } catch (error: any) {
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const msg = error instanceof Error ? error.message : "Synthesis Interrupted";
      onSessionUpdate({
        ...sessionRef.current,
        messages: [...messagesWithUser, {
          role: 'model',
          content: `Error: ${msg}`,
        }],
        title: newTitle,
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    input,
    files,
    isSubmitDisabled,
    checkUsageLimit,
    session,
    onSessionUpdate,
    systemInstruction,
    page,
    isThinkingMode,
    isLiteMode,
    academicTone,
    localAdvConfig,
    currentUser,
    onUsageIncrement,
    aspectRatio,
    videoDuration,
  ]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Optimized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  return (
    <div className="relative flex flex-col h-full bg-transparent overflow-hidden w-full text-white">
      {children}
      
      {isLiveSessionOpen && (
        <LiveSession onClose={() => setIsLiveSessionOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full relative w-full">
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth w-full will-change-transform"
          id="message-list"
        >
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-4 opacity-20">
              <SlyntosLogo className="w-24 h-24 mb-6 grayscale" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.8em] text-white italic">
                Neural Link Ready
              </h2>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-6 pb-40">
              {session.messages.map((msg, index) => (
                <MessageComponent
                  key={`${index}-${msg.content.substring(0, 20)}`}
                  message={msg}
                  currentUser={currentUser}
                  page={page}
                  onVideoComplete={(url) => {
                    const updatedMessages = [...session.messages];
                    updatedMessages[index] = { ...updatedMessages[index], videoUrl: url };
                    onSessionUpdate({ ...session, messages: updatedMessages });
                  }}
                />
              ))}
              
              {/* Typing Indicator */}
              {isLoading && (
                <div className="text-gray-400 text-sm">
                  typing{typingDots}
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Section */}
        <div className="border-t border-gray-800 p-4 bg-gray-950/80 backdrop-blur-xl z-40 w-full">
          <div className="max-w-4xl mx-auto w-full">
            {/* File List */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="px-3 py-1.5 bg-white/10 rounded-full text-[10px] font-bold flex items-center gap-2 border border-white/10"
                  >
                    <span className="truncate max-w-[100px]">{f.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-red-400 hover:text-red-300 p-0.5"
                      aria-label="Remove file"
                      disabled={isLoading}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-center bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden focus-within:border-gray-500 transition-colors">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Attach Files"
                disabled={isLoading}
              >
                <Paperclip size={20} />
              </button>
              
              <button
                type="button"
                onClick={() => setIsLiveSessionOpen(true)}
                className="p-3 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                title="Voice Chat"
                disabled={isLoading}
              >
                <Mic size={20} />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                hidden
              />
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={page === PageEnum.Edu ? "What would you like me to write in a human way?" : placeholderText}
                rows={1}
                className="flex-1 bg-transparent text-white py-3 px-2 resize-none outline-none placeholder-gray-600 text-[15px] font-medium leading-relaxed max-h-48 min-h-[48px]"
                disabled={isLoading}
              />
              
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitDisabled}
                className={`p-3 transition-all ${
                  isSubmitDisabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-white hover:text-white hover:bg-white/5'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Panel */}
      {(page === PageEnum.General || page === PageEnum.Edu || page === PageEnum.WebBuilder) && (
        <ContextualPanel
          page={page}
          currentUser={currentUser}
          isThinkingMode={isThinkingMode}
          setIsThinkingMode={setIsThinkingMode}
          isLiteMode={isLiteMode}
          setIsLiteMode={setIsLiteMode}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          videoDuration={videoDuration}
          setVideoDuration={setVideoDuration}
          academicTone={academicTone}
          setAcademicTone={setAcademicTone}
          onStartLiveSession={() => setIsLiveSessionOpen(true)}
          isGenerating={isLoading}
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          advConfig={localAdvConfig}
          setAdvConfig={setLocalAdvConfig}
        />
      )}
    </div>
  );
};

export default ChatInterface;
import { GoogleGenAI, FunctionCall } from "@google/genai";
import type { Message, FileData, Page, Source, GenConfig, User } from '../types';
import { Page as PageEnum } from '../types';

// SLYNTOS NEURAL ARCHITECTURE
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview';
const TEXT_MODEL_FAST = 'gemini-3-flash-preview';
const TEXT_MODEL_PRO = 'gemini-3.1-pro-preview';

export interface GenerationOptions {
    useThinking?: boolean;
    useLite?: boolean;
    aspectRatio?: string;
    videoDuration?: number;
    advancedConfig?: GenConfig;
    currentUser?: User;
}

// Cache for quick responses
const responseCache = new Map<string, string>();
const CACHE_SIZE_LIMIT = 100;

// Pre-compiled regex patterns for faster matching
const GREETING_PATTERNS = [
    { pattern: /^(hi|hello|hey|greetings|sup|yo)\s*$/i, response: 'Hi! How can I help you today?' },
    { pattern: /^(how are you|howdy|what's up)\s*$/i, response: "I'm doing great! Ready to help you." },
    { pattern: /^(thanks|thank you|thx)\s*$/i, response: "You're welcome! Happy to help." },
    { pattern: /^(bye|goodbye|see you)\s*$/i, response: "Goodbye! Feel free to come back anytime." },
];

// Pre-computed keyword sets for faster lookups
const VIDEO_KEYWORDS = new Set(['generate', 'create', 'make', 'video', 'animation', 'render', 'clip', 'movie', 'film']);
const IMAGE_KEYWORDS = new Set(['generate', 'create', 'make', 'draw', 'image', 'photo', 'picture', 'style', 'painting', 'sketch', 'cartoon', 'anime', 'logo', 'render', 'blueprint', 'portrait']);

// Cache for Gemini instances (reuse instead of recreating)
let geminiInstance: GoogleGenAI | null = null;
const getGeminiInstance = () => {
    if (!geminiInstance) {
        geminiInstance = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    }
    return geminiInstance;
};

const buildGeminiContent = (history: Message[]) => {
    return history.map(msg => {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });

        if (msg.role === 'user' && msg.files?.length) {
            msg.files.forEach(file => {
                parts.push({
                    inlineData: {
                        mimeType: file.type,
                        data: file.data
                    }
                });
            });
        }
        if (parts.length === 0) parts.push({ text: '' });
        return { role: msg.role, parts };
    });
};

export async function generateImage(prompt: string, referenceFiles?: FileData[]): Promise<string[]> {
    const ai = getGeminiInstance();
    const parts: any[] = [{ text: prompt }];
    
    if (referenceFiles?.length) {
        referenceFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                parts.push({ inlineData: { mimeType: file.type, data: file.data } });
            }
        });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: [{ parts }],
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        const images: string[] = [];
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) images.push(part.inlineData.data);
        }
        return images;
    } catch (error) {
        console.error("Image generation error:", error);
        throw error;
    }
}

export async function generateVideo(
    prompt: string, 
    aspectRatio: '16:9' | '9:16' = '16:9',
    onProgress?: (message: string) => void
): Promise<string> {
    const ai = getGeminiInstance();
    
    try {
        onProgress?.("Starting video generation...");
        
        let operation = await ai.models.generateVideos({
            model: VIDEO_MODEL,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        onProgress?.("Creating your video (this usually takes 1-2 minutes)...");
        
        let attempts = 0;
        const maxAttempts = 60;
        const pollInterval = 5000; // Reduced from 10s to 5s for faster updates
        
        while (!operation.done && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            attempts++;
            
            if (attempts % 3 === 0) {
                onProgress?.(`Still working on your video... (${Math.round(attempts * pollInterval / 60)}s)`);
            }
        }

        if (!operation.done) {
            throw new Error("Video generation timed out. Please try again.");
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Could not find the video link.");
        }

        const urlObj = new URL(downloadLink);
        urlObj.searchParams.set('key', process.env.GOOGLE_API_KEY || '');
        const finalUrl = urlObj.toString();
        
        const response = await fetch(finalUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.status}`);
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e: any) {
        console.error("Video generation error:", e);
        throw e;
    }
}

// Optimized greeting detection - O(1) lookup
const getGreetingResponse = (text: string): string | null => {
    const trimmed = text.trim().toLowerCase();
    
    // Quick exact match for common greetings
    if (trimmed === 'hi' || trimmed === 'hello' || trimmed === 'hey') {
        return 'Hi! How can I help you today?';
    }
    
    // Use regex patterns for more complex greetings
    for (const { pattern, response } of GREETING_PATTERNS) {
        if (pattern.test(trimmed)) {
            return response;
        }
    }
    
    return null;
};

// Optimized keyword detection using Sets
const containsKeywords = (text: string, keywordSet: Set<string>): boolean => {
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => keywordSet.has(word));
};

export async function* generateContentStream(
    history: Message[],
    systemInstruction: string,
    page: Page,
    options: GenerationOptions = {}
): AsyncGenerator<{ text?: string, sources?: Source[], functionCalls?: FunctionCall[], images?: string[], videoUrl?: string, videoScript?: any }> {
    const ai = getGeminiInstance();
    const formattedInstruction = (options.advancedConfig?.systemInstructionOverride || systemInstruction);
    const lastUserMsg = history[history.length - 1];
    
    if (!lastUserMsg) {
        yield { text: "How can I help you?" };
        return;
    }
    
    const userPrompt = lastUserMsg.content?.toLowerCase() || "";
    
    // Check cache first (fastest path)
    const cacheKey = `${userPrompt}-${page}-${options.useThinking}-${options.useLite}`;
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
        yield { text: cachedResponse };
        return;
    }

    // Quick greeting detection (instant)
    const greetingResponse = getGreetingResponse(userPrompt);
    if (greetingResponse) {
        // Cache it for future
        if (responseCache.size < CACHE_SIZE_LIMIT) {
            responseCache.set(cacheKey, greetingResponse);
        }
        yield { text: greetingResponse };
        return;
    }

    // Video check - using Set for O(1) lookup
    if (containsKeywords(userPrompt, VIDEO_KEYWORDS) && userPrompt.includes('video')) {
        yield { text: "Starting your video generation..." };
        try {
            const videoUrl = await generateVideo(
                lastUserMsg.content, 
                (options.aspectRatio === '9:16' ? '9:16' : '16:9'),
                (msg) => { /* Optional progress updates */ }
            );
            yield { text: "Your video is ready!", videoUrl };
            return;
        } catch (err: any) {
            yield { text: `\n\nSorry, there was an error: ${err.message}` };
            return;
        }
    }

    // Image check - using Set for O(1) lookup
    const hasImageKeyword = containsKeywords(userPrompt, IMAGE_KEYWORDS);
    const hasImageFile = lastUserMsg.files?.some(f => f.type.startsWith('image/'));
    const isImageRequest = hasImageKeyword && (userPrompt.includes('image') || userPrompt.includes('photo') || hasImageFile);

    if (isImageRequest) {
        yield { text: "Creating your image..." };
        try {
            const images = await generateImage(lastUserMsg.content, lastUserMsg.files);
            yield { text: "Here is your image:", images };
            return;
        } catch (err: any) {
            yield { text: `\n\nSorry, there was an error: ${err.message}` };
            return;
        }
    }

    const contents = buildGeminiContent(history);
    
    try {
        let modelName = options.useLite ? TEXT_MODEL_FAST : TEXT_MODEL_PRO; 
        const config: any = { 
            systemInstruction: formattedInstruction,
            temperature: options.advancedConfig?.temperature ?? (page === PageEnum.Edu ? 0.9 : 0.4),
            topP: options.advancedConfig?.topP ?? 0.9,
            topK: options.advancedConfig?.topK ?? 32,
            tools: [{ googleSearch: {} }],
        };

        if (options.useThinking) {
            config.thinkingConfig = { thinkingBudget: 24576 };
            modelName = TEXT_MODEL_PRO;
        }

        // Start streaming immediately
        const responseStream = await ai.models.generateContentStream({ 
            model: modelName, 
            contents, 
            config 
        });
        
        let fullResponse = '';
        
        for await (const chunk of responseStream) {
            if (chunk.text) {
                fullResponse += chunk.text;
            }
            
            const sources: Source[] = [];
            chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => {
                if (c.web?.uri && c.web?.title) {
                    sources.push({ uri: c.web.uri, title: c.web.title });
                }
            });
            
            // Yield every chunk immediately
            yield { 
                text: chunk.text, 
                sources: sources.length > 0 ? sources : undefined, 
                functionCalls: chunk.functionCalls 
            };
        }
        
        // Cache short responses for future instant replies
        if (fullResponse.length < 200 && responseCache.size < CACHE_SIZE_LIMIT) {
            responseCache.set(cacheKey, fullResponse);
        }
        
    } catch (error: any) {
        yield { text: `\n\nError: ${error.message}` };
    }
}

// Optional: Clear cache periodically to prevent memory leaks
setInterval(() => {
    responseCache.clear();
}, 1000 * 60 * 60); // Clear every hour
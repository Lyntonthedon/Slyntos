import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import SlyntosLogo from './icons/SlyntosLogo';
import ChatBubbleLeftRightIcon from './icons/ChatBubbleLeftRightIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import CodeBracketSquareIcon from './icons/CodeBracketSquareIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import RocketIcon from './icons/RocketIcon';
import PlayIcon from './icons/PlayIcon';
import BoltIcon from './icons/BoltIcon';

interface LandingPageProps {
  onFinish: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFinish }) => {
  // --- Particle background effect (auto, minimal) ---
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    let animationFrame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 15000));
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: Math.random() * 2 + 0.8,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animationFrame = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
      document.body.removeChild(canvas);
    };
  }, []);

  const handleStart = async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      }
    }
    onFinish();
  };

  const capabilities = [
    { icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />, title: "General Chat", desc: "Help with anything." },
    { icon: <AcademicCapIcon className="w-4 h-4" />, title: "Slyntos Edu", desc: "Master any subject." },
    { icon: <CodeBracketSquareIcon className="w-4 h-4" />, title: "Web Builder", desc: "Build and host sites." },
    { icon: <PlayIcon className="w-4 h-4" />, title: "Slyntos Studio", desc: "Create amazing videos." },
    { icon: <MicrophoneIcon className="w-4 h-4" />, title: "Voice", desc: "Talk in real-time." },
    { icon: <RocketIcon className="w-4 h-4" />, title: "Business", desc: "Grow your company." },
  ];

  return (
    <div className="relative z-10 w-full min-h-screen bg-transparent text-white overflow-x-hidden font-sans">
      {/* Particle canvas background is auto-added */}

      {/* Top fixed CTA button — visible at the top as requested */}
      <div className="fixed top-6 right-6 z-50 md:top-8 md:right-8">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          className="group flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <span className="text-sm tracking-wide">Get Started</span>
          <BoltIcon className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Main content with animated entrance */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center w-full max-w-4xl"
        >
          {/* Logo with hover effect */}
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-8 border border-white/10"
          >
            <SlyntosLogo className="w-12 h-12 text-white" />
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-white">
            Slyntos AI
          </h1>
          <p className="text-gray-300 text-base sm:text-lg md:text-xl font-light text-center max-w-xl mb-12 leading-relaxed">
            Intelligence, speed, and minimalism. <br />The most powerful assistant.
          </p>

          {/* Capabilities grid (minimal, clean) */}
          <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {capabilities.map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group p-4 sm:p-5 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl hover:border-white/20 transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-black transition-colors">
                    {cap.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white/90">{cap.title}</h3>
                    <p className="text-[10px] text-gray-400/80">{cap.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Subtle version indicator (bottom) */}
          <p className="text-[0.55rem] font-mono uppercase tracking-[0.4em] text-gray-600 mt-12">
            Version 3.0 // Neural Core
          </p>
        </motion.div>
      </div>

      {/* Very light scanline texture (barely visible) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,transparent_1px,transparent_3px)] z-0" />
    </div>
  );
};

export default LandingPage;
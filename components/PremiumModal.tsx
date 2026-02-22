import React, { useState } from 'react';
import XCircleIcon from './icons/XCircleIcon';
import CheckIcon from './icons/CheckIcon';
import RocketIcon from './icons/RocketIcon';
import SparklesIcon from './icons/SparklesIcon';
import LockIcon from './icons/LockIcon';
import BoltIcon from './icons/BoltIcon';
import { UserPlan } from '../types';
import Loader from './Loader';
import { ACTIVATION_CODES } from '../constants';

interface PremiumModalProps {
  onClose: () => void;
  onSuccess: (plan: UserPlan, endDate: number) => void;
  currentPlan?: UserPlan; // Add current plan prop
}

const PLANS = [
  {
    id: 'starter' as UserPlan,
    name: 'Free Mission',
    price: '0.00',
    features: ['5 Missions / Day', 'Standard Text Core', 'General Knowledge', 'Community Access'],
    color: 'from-slate-600 to-slate-800',
    icon: '⚡'
  },
  {
    id: 'pro' as UserPlan,
    name: 'Basic Operator',
    price: '10.00',
    features: ['20 Missions / Day', 'Image Synthesis', 'Live Voice Access', 'Fast Response Time'],
    color: 'from-blue-600 to-indigo-600',
    icon: '🚀',
    popular: true
  },
  {
    id: 'business' as UserPlan,
    name: 'Pro Architect',
    price: '20.00',
    features: ['60 Missions / Day', 'Video Synthesis', 'Full-Stack Creator', 'Deep Reasoning Mode'],
    color: 'from-purple-600 to-pink-600',
    icon: '⚙️'
  },
  {
    id: 'enterprise' as UserPlan,
    name: 'Unlimited Apex',
    price: '50.00',
    features: ['Unlimited Missions', 'Commercial License', 'Priority Neural Buffer', 'Dedicated Synthesis'],
    color: 'from-amber-500 to-orange-600',
    icon: '👑'
  }
];

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onSuccess, currentPlan = 'starter' }) => {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0]>(PLANS[1]);
  const [accessCode, setAccessCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'success'>('selection');

  // Find current plan details
  const currentPlanDetails = PLANS.find(p => p.id === currentPlan) || PLANS[0];
  const isCurrentPlan = (planId: string) => planId === currentPlan;

  const handleActivate = async () => {
    if (selectedPlan.id === 'starter') {
        onClose();
        return;
    }

    setError(null);
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const expectedCode = (ACTIVATION_CODES as any)[selectedPlan.id];

    if (accessCode === expectedCode) {
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const endDate = Date.now() + thirtyDaysInMs;
        
        setIsProcessing(false);
        setPaymentStep('success');
        onSuccess(selectedPlan.id, endDate);
    } else {
        setIsProcessing(false);
        setError("Invalid Access Code. Verification Failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Upgrade Badge - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] font-black px-4 py-2 rounded-full border border-white/20 uppercase tracking-[0.3em] shadow-lg flex items-center gap-2">
            <BoltIcon className="w-3 h-3" />
            UPGRADE YOUR PLAN
            <BoltIcon className="w-3 h-3" />
          </div>
        </div>

        {/* Left Side: Value Proposition */}
        <div className="md:w-4/12 p-8 bg-gradient-to-b from-blue-600/10 to-transparent border-r border-white/5 flex flex-col">
          <div className="mb-8 mt-12 md:mt-0">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
              <SparklesIcon className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Upgrade Engine</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Select Your Tier</p>
          </div>

          {/* Current Plan Display */}
          <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">CURRENT MISSION</p>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentPlanDetails.color} flex items-center justify-center`}>
                <span className="text-white text-sm">{currentPlanDetails.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentPlanDetails.name}</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-wider">{currentPlanDetails.features[0]}</p>
              </div>
            </div>
          </div>

          {/* Selected Plan Features */}
          <div className="space-y-4 flex-1">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
              {selectedPlan.name} FEATURES:
            </p>
            {selectedPlan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20">
                  <CheckIcon className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-xs font-bold text-slate-300 tracking-tight">{f}</span>
              </div>
            ))}
          </div>

          {/* Upgrade Savings Note */}
          {selectedPlan.id !== 'starter' && (
            <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-[9px] text-emerald-400 font-black text-center uppercase tracking-wider">
                ✦ SAVE 20% WITH ANNUAL BILLING ✦
              </p>
            </div>
          )}

          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-black leading-relaxed">
              Global mission protocol active. Each tier unlocks significantly deeper neural pathways and synthesis speed via manual activation codes.
            </p>
          </div>
        </div>

        {/* Right Side: Plans & Activation */}
        <div className="md:w-8/12 p-8 flex flex-col">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-600 hover:text-white transition-all active:scale-90">
            <XCircleIcon className="w-8 h-8" />
          </button>

          {paymentStep === 'selection' ? (
            <>
              <div className="mb-6 text-center md:text-left mt-12 md:mt-0">
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">Mission Quota Configuration</h3>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Four tiers of universal intelligence</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {PLANS.map((plan) => {
                  const isCurrent = isCurrentPlan(plan.id);
                  const isSelected = selectedPlan.id === plan.id;
                  
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                          setSelectedPlan(plan);
                          setError(null);
                      }}
                      disabled={isCurrent}
                      className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                        isCurrent 
                          ? 'border-green-500/30 bg-green-500/10 cursor-not-allowed opacity-75'
                          : isSelected
                            ? 'bg-white border-white shadow-2xl scale-[1.02]' 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {/* Popular Badge */}
                      {plan.popular && !isCurrent && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[6px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                          POPULAR
                        </div>
                      )}

                      {/* Current Plan Badge */}
                      {isCurrent && (
                        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[6px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                          <CheckIcon className="w-2 h-2" /> CURRENT
                        </div>
                      )}

                      {/* Upgrade Badge */}
                      {!isCurrent && plan.id !== 'starter' && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[6px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
                          UPGRADE
                        </div>
                      )}

                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <span className="text-white text-lg">{plan.icon}</span>
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className={`text-[9px] font-black uppercase tracking-widest truncate ${
                          isSelected ? 'text-black/40' : 'text-slate-600'
                        }`}>{plan.name}</p>
                        <p className={`text-sm font-black ${isSelected ? 'text-black' : 'text-white'}`}>
                          $ {plan.price} <span className="text-[6px] font-normal opacity-50">/month</span>
                        </p>
                      </div>
                      {isSelected && !isCurrent && (
                        <div className="ml-auto w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto space-y-4">
                {selectedPlan.id !== 'starter' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                       <LockIcon className="w-3 h-3" /> Upgrade Activation Code
                    </label>
                    <input 
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter 8-digit Activation Code"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-mono tracking-[0.5em] text-center focus:border-blue-500 outline-none transition-all placeholder:tracking-normal placeholder:text-slate-800"
                    />
                    <p className="text-[8px] text-slate-600 px-1">
                      Enter your upgrade code to unlock {selectedPlan.name} features
                    </p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleActivate}
                  disabled={isProcessing || (selectedPlan.id !== 'starter' && !accessCode.trim())}
                  className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-[0.3em] text-[11px] transition-all flex items-center justify-center gap-3 ${
                    isProcessing ? 'bg-slate-800 text-slate-500' : 
                    selectedPlan.id === 'starter' ? 'bg-slate-700 text-white hover:bg-slate-600' :
                    'bg-white text-black hover:bg-slate-100 active:scale-95 shadow-2xl'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader /> VERIFYING UPGRADE
                    </>
                  ) : selectedPlan.id === 'starter' ? (
                    'CONTINUE WITH FREE'
                  ) : (
                    <>
                      <BoltIcon className="w-4 h-4" />
                      UPGRADE TO {selectedPlan.name.toUpperCase()}
                      <BoltIcon className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Upgrade Summary */}
                {selectedPlan.id !== 'starter' && (
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-[8px] text-slate-500">UPGRADE SUMMARY</p>
                      <p className="text-xs font-bold text-white">{currentPlanDetails.name} → {selectedPlan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 line-through">${currentPlanDetails.price}</p>
                      <p className="text-sm font-bold text-green-400">${selectedPlan.price}</p>
                    </div>
                  </div>
                )}

                <p className="text-[8px] text-center font-black text-slate-700 uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                  <LockIcon className="w-3 h-3" /> NEURAL SECURITY ENCRYPTED
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
                <CheckIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-2">Upgrade Successful!</h3>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mb-8 italic">Apex Level Synthesis Ready</p>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl max-w-xs mx-auto">
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                  Your mission profile has been successfully upgraded from{' '}
                  <span className="font-black uppercase tracking-widest text-white">{currentPlanDetails.name}</span>{' '}
                  to{' '}
                  <span className="font-black uppercase tracking-widest text-white">{selectedPlan.name}</span>.
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <p className="text-[9px] text-emerald-300 uppercase tracking-wider">
                    ✦ 30 DAYS PREMIUM ACCESS ✦
                  </p>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="mt-10 px-10 py-3 bg-white text-black font-black uppercase italic tracking-[0.2em] rounded-xl hover:bg-slate-100 active:scale-95 transition-all text-[10px] flex items-center gap-2"
              >
                <RocketIcon className="w-4 h-4" />
                Return to Mission Control
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
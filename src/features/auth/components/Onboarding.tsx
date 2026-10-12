import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  MessageSquare, 
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Mic, 
  Check, 
  HardHat, 
  Radio
} from 'lucide-react';
import AnimatedLogo from '../../../shared/components/AnimatedLogo';
import { triggerLightHaptic, triggerMediumHaptic, triggerSuccessHaptic } from '../../../shared/lib/haptics';

interface OnboardingProps {
  onComplete: () => void;
  userId?: string;
  onRequestNotifications?: () => Promise<boolean | string | null>;
}

export const ONBOARDING_STORAGE_KEY = 'gsi_onboarding_done';

export default function Onboarding({ onComplete, onRequestNotifications }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Bem-vindo ao GSI PRO',
      subtitle: 'Plataforma Corporativa de Construção Civil',
      description: 'Registo ágil de horas, comunicação instantânea e organização de obras num único aplicativo.',
      icon: <HardHat size={32} className="text-[#d4af37]" />
    },
    {
      title: 'Marcação de Ponto e Folha',
      subtitle: 'Simples, Rápido e Seguro',
      description: 'Marque as suas horas diárias com um toque. Gere relatórios em PDF e imagem com assinatura para a sua empresa.',
      icon: <Clock size={32} className="text-[#d4af37]" />
    },
    {
      title: 'Messenger Corporativo',
      subtitle: 'Mensagens, Áudios e Chamadas',
      description: 'Converse com encarregados e colegas por mensagens diretas, grupos de obra e chamadas de vídeo em tempo real.',
      icon: <MessageSquare size={32} className="text-[#d4af37]" />
    },
    {
      title: 'Notificações em Tempo Real',
      subtitle: 'Fique Sempre a Par',
      description: 'Receba alertas instantâneos de novas mensagens, chamadas e comunicados importantes de obra.',
      icon: <Bell size={32} className="text-[#d4af37]" />
    }
  ];

  const handleNext = async () => {
    await triggerLightHaptic();
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      if (onRequestNotifications) {
        try { await onRequestNotifications(); } catch {}
      }
      await triggerSuccessHaptic();
      try { localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true'); } catch {}
      onComplete();
    }
  };

  const handlePrev = async () => {
    await triggerLightHaptic();
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[200] bg-[#07090e] flex flex-col items-center justify-between p-6 sm:p-10 select-none">
      {/* Top logo & skip */}
      <div className="w-full flex items-center justify-between max-w-md pt-4">
        <div className="flex items-center gap-2">
          <AnimatedLogo className="w-8 h-8" />
          <span className="text-xs font-black text-white tracking-widest uppercase">GSI PRO</span>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
            onComplete();
          }}
          className="text-xs font-bold text-white/40 hover:text-white transition-colors"
        >
          Saltar
        </button>
      </div>

      {/* Main card */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-md flex flex-col items-center text-center my-auto py-8"
      >
        <div className="w-20 h-20 rounded-3xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mb-8 shadow-xl">
          {current.icon}
        </div>

        <h2 className="text-xl font-black text-white mb-2">{current.title}</h2>
        <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-4 block">
          {current.subtitle}
        </span>
        <p className="text-xs text-white/60 leading-relaxed max-w-xs">
          {current.description}
        </p>
      </motion.div>

      {/* Bottom controls */}
      <div className="w-full max-w-md space-y-6 pb-6">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-[#d4af37]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-xs font-bold transition-all"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-xl"
          >
            <span>{currentStep === steps.length - 1 ? 'Começar a Usar' : 'Continuar'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

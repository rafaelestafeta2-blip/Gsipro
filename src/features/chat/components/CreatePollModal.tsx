import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import { PollData } from '../../../shared/types';
import { triggerLightHaptic, triggerSuccessHaptic } from '../../../shared/lib/haptics';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (poll: PollData) => void;
}

export default function CreatePollModal({
  isOpen,
  onClose,
  onCreatePoll
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['Opção 1', 'Opção 2']);
  const [multipleAnswers, setMultipleAnswers] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    triggerLightHaptic();
    if (options.length < 6) {
      setOptions([...options, `Opção ${options.length + 1}`]);
    }
  };

  const handleRemoveOption = (index: number) => {
    triggerLightHaptic();
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return;

    triggerSuccessHaptic();
    onCreatePoll({
      question: question.trim(),
      options: validOptions.map((text, idx) => ({
        id: `opt_${idx}_${Date.now()}`,
        text,
        votes: []
      })),
      multiple_answers: multipleAnswers
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0a0e17] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Criar Sondagem / Enquete</h3>
            <p className="text-xs text-white/50">Faça uma pergunta e receba votos da equipa</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-white/60 mb-1">Pergunta</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Qual o horário ideal para a reunião de obra?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#d4af37]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-white/60">Opções de Resposta</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Opção ${idx + 1}`}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#d4af37]"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            {options.length < 6 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full py-2.5 border border-dashed border-white/20 rounded-2xl text-xs text-white/60 hover:text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus size={14} />
                <span>Adicionar Opção</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-white/70 font-medium">Permitir múltiplas escolhas</span>
            <button
              type="button"
              onClick={() => setMultipleAnswers(!multipleAnswers)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                multipleAnswers ? 'bg-[#d4af37]' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                multipleAnswers ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 rounded-2xl text-xs font-bold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#d4af37] text-black font-black uppercase text-xs rounded-2xl shadow-lg hover:bg-[#e0bb43] transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              <span>Enviar Sondagem</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

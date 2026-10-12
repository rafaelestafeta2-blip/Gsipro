import React, { useState } from 'react';
import { X, Users, Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { createChatGroup } from '../services/chatService';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onGroupCreated: () => void;
  accentColor?: string;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  currentUserId,
  onGroupCreated,
  accentColor = '#d4af37'
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await createChatGroup(name, description, coverUrl, isPrivate, currentUserId);
    setLoading(false);

    if (result) {
      onGroupCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0e17] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Criar Novo Grupo</h3>
            <p className="text-xs text-white/40">Equipe de obra ou setor de trabalho</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/60 block mb-1.5">Nome do Grupo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe Obra Lisboa Norte"
              required
              className="w-full bg-[#1c2431] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white/60 block mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito da equipe..."
              rows={2}
              className="w-full bg-[#1c2431] border border-white/10 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white/60 block mb-1.5">URL da Foto de Capa (Opcional)</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#1c2431] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1c2431]/50 border border-white/5">
            <div className="flex items-center gap-2">
              {isPrivate ? <Lock size={16} className="text-[#d4af37]" /> : <Globe size={16} className="text-white/40" />}
              <div>
                <span className="text-xs font-bold text-white block">Grupo Privado</span>
                <span className="text-[10px] text-white/40">Apenas membros convidados podem ver</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 accent-[#d4af37] cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-black transition-all disabled:opacity-50 mt-2"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? 'Criando Grupo...' : 'Confirmar e Criar'}
          </button>
        </form>
      </div>
    </div>
  );
}

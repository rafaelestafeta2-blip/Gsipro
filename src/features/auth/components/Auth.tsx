import React, { useState } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';
import AnimatedLogo from '../../../shared/components/AnimatedLogo';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user && data.session) {
          setSuccess('Conta criada com sucesso! Redirecionando...');
        } else {
          setSuccess('Verifique seu e-mail para ativar sua conta PRO!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0e131f] border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <AnimatedLogo className="w-16 h-16 mb-4" />
          <h1 className="text-xl font-black text-white tracking-wider uppercase">GSI PRO</h1>
          <p className="text-xs text-white/50 mt-1">Gestão de Horas, Obras e Comunicação Operacional</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white/60 block mb-1.5 uppercase tracking-wider">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@gsipro.pt"
              required
              className="w-full bg-[#161d2d] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white/60 block mb-1.5 uppercase tracking-wider">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#161d2d] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-black font-black text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
            <span>{loading ? 'A processar...' : isSignUp ? 'Criar Conta PRO' : 'Entrar na Plataforma'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-white/50 hover:text-[#d4af37] transition-colors font-bold"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar registo'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

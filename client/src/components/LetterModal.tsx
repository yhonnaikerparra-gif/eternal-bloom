import React from 'react';
import { X, Heart, Calendar, Sparkles, MessageSquare } from 'lucide-react';
import { VisualElement, Letter } from '../services/api.js';

interface LetterModalProps {
  element?: VisualElement | null;
  letter?: Letter | null;
  onClose: () => void;
  signatureName?: string;
}

export const LetterModal: React.FC<LetterModalProps> = ({
  element,
  letter: directLetter,
  onClose,
  signatureName = 'Por siempre tuyo'
}) => {
  const letter = directLetter || element?.letter;

  if (!letter) return null;

  const dateStr = letter.sent_at || (element ? element.created_at : new Date().toISOString());
  const formattedDate = new Date(dateStr).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isStar = element?.element_type === 'STAR';
  const isProtagonist = element?.element_type === 'PROTAGONIST_FLOWER' || letter.id === 'initial-bloom';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Parchment Letter Card */}
      <div className="relative w-full max-w-xl parchment-card rounded-2xl p-8 sm:p-10 text-slate-800 shadow-2xl border border-amber-200/60 z-10 animate-unfold max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Cerrar carta"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Romantic Header */}
        <div className="text-center pb-6 border-b border-rose-200/60">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 border border-rose-200 mb-3 shadow-inner">
            {isStar ? (
              <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            ) : (
              <Heart className="w-6 h-6 text-rose-600 fill-rose-600" />
            )}
          </div>
          <span className="block text-xs uppercase tracking-widest font-semibold text-rose-900/70 font-sans">
            MI VIDA ETERNA {element && `— Carta #${element.birth_order}`}
          </span>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-amber-900/60 font-serif italic">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Letter Title */}
        <div className="mt-6 mb-4">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100/70 text-rose-800 mb-2 font-sans">
            {letter.category}
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-medium text-rose-950 leading-tight">
            {letter.title || 'Para ti, mi amor'}
          </h2>
        </div>

        {/* Letter Body Text */}
        <div className="my-6 space-y-4 font-serif text-lg text-slate-800 leading-relaxed text-justify">
          {letter.content.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Romantic Wax Seal & Signature Footer */}
        <div className="mt-8 pt-6 border-t border-rose-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 3D-styled Wax Seal */}
            <div className="w-12 h-12 rounded-full wax-seal flex items-center justify-center text-white font-serif font-bold text-lg shadow-lg">
              EB
            </div>
            <div className="text-left font-sans text-xs text-slate-500">
              <span className="font-semibold text-rose-900 block">Jardín Eterno</span>
              <span>{isProtagonist ? 'Primera flor sembrada' : isStar ? 'Estrella en el cosmos' : 'Flor florecida'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-amber-900/70 italic font-serif block">Con todo mi amor,</span>
            <span className="font-cursive text-2xl text-rose-900 font-bold block mt-0.5">
              {signatureName} 🌹
            </span>
          </div>
        </div>

        {/* WhatsApp Send Action Button */}
        <div className="mt-6 pt-4 border-t border-rose-200/40 flex justify-center">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `🌸 *MI VIDA ETERNA* 🌸\n_${formattedDate}_\n\n*${letter.title || 'Carta de Amor'}*\n\n"${letter.content}"\n\n🌹 *Una nueva flor ha florecido hoy para ti en nuestro jardín eterno.*\n\nCon todo mi amor,\n*${signatureName}* ❤️`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Enviar esta Carta por WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};

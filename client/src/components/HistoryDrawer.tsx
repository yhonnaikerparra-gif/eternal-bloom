import React, { useState } from 'react';
import { X, Search, Calendar, Heart, Sparkles, BookOpen } from 'lucide-react';
import { Letter } from '../services/api.js';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  letters: Letter[];
  onSelectLetter: (letter: Letter) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  letters,
  onSelectLetter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredLetters = letters.filter((l) => {
    const q = searchTerm.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q) ||
      l.content?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-white">Archivo de Cartas</h2>
              <p className="text-xs text-slate-400">{letters.length} cartas enviadas con amor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, categoría o palabra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>

        {/* Letters List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLetters.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No se encontraron cartas que coincidan con la búsqueda.
            </div>
          ) : (
            filteredLetters.map((letter) => {
              const formattedDate = letter.sent_at
                ? new Date(letter.sent_at).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Fecha no registrada';

              return (
                <div
                  key={letter.id}
                  onClick={() => onSelectLetter(letter)}
                  className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/90 border border-slate-700/40 hover:border-rose-500/40 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/30">
                      {letter.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formattedDate}
                    </span>
                  </div>
                  <h3 className="text-base font-serif font-semibold text-rose-100 line-clamp-1">
                    {letter.title || 'Carta de amor'}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1">
                    {letter.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, Globe, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MilestoneBannerProps {
  stage: string;
  totalSent: number;
  recipientName: string;
}

export const MilestoneBanner: React.FC<MilestoneBannerProps> = ({
  stage,
  totalSent,
  recipientName,
}) => {
  if (stage !== 'STAGE_4_EARTH_ASCENT' && stage !== 'STAGE_5_COSMIC_STARS' && stage !== 'STAGE_6_UNIVERSE_OF_LOVE') {
    return null;
  }

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FB7185', '#F43F5E', '#E11D48', '#FDE047', '#60A5FA']
    });
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-lg animate-fade-in">
      <div className="glass-panel-dark rounded-2xl p-4 sm:p-5 border border-rose-500/30 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-lg">
            {stage === 'STAGE_4_EARTH_ASCENT' ? (
              <Globe className="w-6 h-6 animate-spin-slow" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-rose-400">
                {stage === 'STAGE_4_EARTH_ASCENT' ? 'Hito de 365 Días' : 'Universo del Amor'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                {totalSent} cartas
              </span>
            </div>
            <p className="text-sm font-serif font-medium text-slate-200 mt-0.5">
              {stage === 'STAGE_4_EARTH_ASCENT'
                ? `365 días amándote, ${recipientName}: nuestro amor cubre la Tierra entera.`
                : `Cada nueva carta ahora enciende una estrella eterna en el cosmos.`}
            </p>
          </div>
        </div>

        <button
          onClick={triggerCelebration}
          className="shrink-0 p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
          title="Celebrar hito"
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>Celebrar</span>
        </button>
      </div>
    </div>
  );
};

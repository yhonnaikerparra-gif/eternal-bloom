import React, { useEffect, useRef, useState } from 'react';
import {
  Heart, BookOpen, Settings, Sun, Moon, Sparkles, Send, Flame, Lock
} from 'lucide-react';
import { RomanticScene } from './3d/RomanticScene.js';
import { api, GardenState, VisualElement, Letter, RecipientProfile, RecipientStatus } from './services/api.js';
import { LetterModal } from './components/LetterModal.js';
import { HistoryDrawer } from './components/HistoryDrawer.js';
import { AdminPanel } from './components/AdminPanel.js';
import { MilestoneBanner } from './components/MilestoneBanner.js';
import { AudioPlayer } from './components/AudioPlayer.js';
import { RecipientAccessModal } from './components/RecipientAccessModal.js';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RomanticScene | null>(null);

  // Recipient Authentication State
  const [recipient, setRecipient] = useState<RecipientProfile | null>(api.getStoredRecipient());
  const [recipientStatus, setRecipientStatus] = useState<RecipientStatus | null>(null);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);

  // Data state
  const [gardenState, setGardenState] = useState<GardenState>({
    totalConfirmedSent: 0,
    flowerCount: 1,
    starCount: 0,
    stage: 'STAGE_1_FIRST_BLOOM',
    nextMilestone: { target: 365, label: '365 Días', remaining: 365, progressPercent: 0 },
  });
  const [elements, setElements] = useState<VisualElement[]>([]);
  const [latestLetter, setLatestLetter] = useState<Letter | null>(null);
  const [historyLetters, setHistoryLetters] = useState<Letter[]>([]);
  const [recipientName, setRecipientName] = useState('Mi Amor');

  // Modals & Panels
  const [selectedElement, setSelectedElement] = useState<VisualElement | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);

  // Initialize 3D Scene and Recipient Session
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new RomanticScene(containerRef.current, (element) => {
      setSelectedElement(element);
      setSelectedLetter(null);
      setIsLetterModalOpen(true);
    });
    sceneRef.current = scene;

    loadInitialData();
    checkRecipientAuth();

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  const checkRecipientAuth = async () => {
    try {
      const status = await api.getRecipientStatus();
      setRecipientStatus(status);
      if (status.recipientName) {
        setRecipientName(status.recipientName);
      }

      const verifyRes = await api.verifyRecipient();
      if (verifyRes.valid && verifyRes.recipient) {
        setRecipient(verifyRes.recipient);
      } else {
        // If not authenticated, open login modal
        setIsRecipientModalOpen(true);
      }
    } catch (e) {
      console.warn('Could not check recipient auth:', e);
    }
  };

  const handleRecipientSuccess = (newRecipient: RecipientProfile) => {
    setRecipient(newRecipient);
    setRecipientName(newRecipient.name);
    setIsRecipientModalOpen(false);
    loadInitialData();

    // Focus camera and open today's letter with love
    setTimeout(() => {
      handleOpenLatestLetter();
    }, 600);
  };

  const loadInitialData = async () => {
    try {
      const [state, elemList, latest, hist] = await Promise.all([
        api.getGardenState(),
        api.getGardenElements(),
        api.getLatestLetter().catch(() => null),
        api.getHistoryLetters().catch(() => []),
      ]);

      setGardenState(state);
      setElements(elemList);
      setLatestLetter(latest);
      setHistoryLetters(hist);

      if (sceneRef.current) {
        sceneRef.current.setStage(state.stage, state.flowerCount);
        sceneRef.current.updateElements(elemList);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const handleOpenLatestLetter = () => {
    if (latestLetter) {
      setSelectedLetter(latestLetter);
      setSelectedElement(null);
      setIsLetterModalOpen(true);
    }
  };

  const handleSelectHistoryLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    setSelectedElement(null);
    setIsHistoryOpen(false);
    setIsLetterModalOpen(true);
  };

  const handleToggleNight = () => {
    const nextVal = !isNightMode;
    setIsNightMode(nextVal);
    if (sceneRef.current) {
      sceneRef.current.isNight = nextVal;
    }
  };

  const handlePreviewStageChange = (stage: string, flowerCount: number) => {
    if (sceneRef.current) {
      sceneRef.current.setStage(stage, flowerCount);
    }
  };

  // Stage friendly label
  const getStageBadgeText = (stage: string, count: number) => {
    switch (stage) {
      case 'STAGE_1_FIRST_BLOOM':
        return 'Nuestra Primera Flor';
      case 'STAGE_2_GARDEN_GROWTH':
        return `Jardín en Crecimiento (${count} flores)`;
      case 'STAGE_4_EARTH_ASCENT':
        return 'Hito 365: La Tierra en el Espacio';
      case 'STAGE_5_COSMIC_STARS':
        return `Cosmos de Amor (${count} estrellas)`;
      case 'STAGE_6_UNIVERSE_OF_LOVE':
        return 'Universo Infinito de Amor';
      default:
        return 'Jardín Eterno';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header & Branding */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌸</span>
          <h1 className="text-xl sm:text-2xl font-display font-bold tracking-widest text-white drop-shadow-md">
            MI VIDA ETERNA
          </h1>
        </div>
        <p className="text-xs text-rose-200/80 font-serif italic tracking-wide drop-shadow">
          Una historia de amor que crece cada día
        </p>

        {/* Current Stage Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-xs font-medium text-rose-300 mt-2.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{getStageBadgeText(gardenState.stage, gardenState.flowerCount)}</span>
        </div>
      </div>

      {/* Top Right Utility Controls */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2.5">
        {/* Recipient Profile & Access Pill */}
        {recipient ? (
          <button
            onClick={() => setIsRecipientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-950/70 backdrop-blur-md border border-rose-500/40 text-xs font-medium text-rose-200 hover:text-white hover:bg-rose-900/60 transition-all shadow-lg active:scale-95"
            title="Tu clave está activa. Clic para ver tus datos."
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
            <span className="max-w-[120px] truncate">{recipient.name}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsRecipientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            title="Iniciar sesión con tu número y clave de acceso"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
        )}

        {/* Soft Ambient Chime Player */}
        <AudioPlayer />

        {/* Day / Night Cycle Toggle */}
        <button
          onClick={handleToggleNight}
          className="p-2.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors shadow-lg"
          title={isNightMode ? 'Modo Día' : 'Modo Noche'}
        >
          {isNightMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
        </button>

        {/* Letters Archive / History */}
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="p-2.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors shadow-lg"
          title="Ver todas las cartas recibidas"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Admin Dashboard */}
        <button
          onClick={() => setIsAdminOpen(true)}
          className="p-2.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-slate-700/40 text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 transition-colors shadow-lg"
          title="Panel de administración y programación 5 AM"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 365 Days Milestone Notification Banner */}
      <MilestoneBanner
        stage={gardenState.stage}
        totalSent={gardenState.totalConfirmedSent}
        recipientName={recipientName}
      />

      {/* Bottom Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl">
        <div className="glass-panel-dark rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Progress / Garden Stats */}
          <div className="flex items-center gap-6 w-full sm:w-auto justify-around sm:justify-start">
            <div className="text-center sm:text-left">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                Flores en Jardín
              </span>
              <span className="text-lg font-bold text-rose-400 font-mono">
                {gardenState.flowerCount}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-center sm:text-left">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                Estrellas
              </span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {gardenState.starCount}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div className="text-center sm:text-left">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-sans">
                Meta 365 Días
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${gardenState.nextMilestone.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {gardenState.nextMilestone.progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Read Today's Letter Button */}
          <button
            onClick={handleOpenLatestLetter}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-medium text-xs tracking-wide shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Leer Carta de Hoy</span>
          </button>

        </div>
      </div>

      {/* Romantic Parchment Letter Modal */}
      {isLetterModalOpen && (
        <LetterModal
          element={selectedElement}
          letter={selectedLetter}
          onClose={() => setIsLetterModalOpen(false)}
          recipientName={recipient?.name || recipientName}
          recipientWhatsapp={recipient?.whatsapp || recipientStatus?.recipientWhatsapp || ''}
        />
      )}

      {/* Recipient Login / Setup Modal */}
      <RecipientAccessModal
        isOpen={isRecipientModalOpen}
        onClose={() => setIsRecipientModalOpen(false)}
        onSuccess={handleRecipientSuccess}
        defaultRecipientName={recipient?.name || recipientName}
        defaultWhatsapp={recipient?.whatsapp || recipientStatus?.recipientWhatsapp || ''}
        isInitialConfig={!recipientStatus?.isConfigured}
      />

      {/* Letter Archive Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        letters={historyLetters}
        onSelectLetter={handleSelectHistoryLetter}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        gardenState={gardenState}
        onRefreshState={loadInitialData}
        onPreviewStageChange={handlePreviewStageChange}
      />
    </div>
  );
};
export default App;

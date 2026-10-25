import React, { useState, useEffect } from 'react';
import {
  X, Lock, Settings, Calendar, Heart, Mail, MessageSquare, Sparkles,
  Send, RefreshCw, CheckCircle2, AlertTriangle, Play, Eye, ShieldCheck, LogOut
} from 'lucide-react';
import { api, GardenState } from '../services/api.js';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gardenState: GardenState;
  onRefreshState: () => void;
  onPreviewStageChange: (stage: string, flowerCount: number) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  gardenState,
  onRefreshState,
  onPreviewStageChange,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated());
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'DESTINATARIO' | 'PROGRAMACION' | 'CARTAS' | 'INTEGRACIONES' | 'SIMULACION'>('DESTINATARIO');

  // Form & Telemetry State
  const [settings, setSettings] = useState<any>(null);
  const [schedulerInfo, setSchedulerInfo] = useState<any>(null);
  const [integrationsStatus, setIntegrationsStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual Letter Form
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Amor profundo');
  const [manualContent, setManualContent] = useState('');

  // Confirmation dialogs
  const [confirmManualDispatch, setConfirmManualDispatch] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadData();
    }
  }, [isOpen, isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sett, sched, integ, logList] = await Promise.all([
        api.getSettings(),
        api.getScheduler(),
        api.getIntegrationsStatus(),
        api.getLogs(),
      ]);
      setSettings(sett);
      setSchedulerInfo(sched);
      setIntegrationsStatus(integ);
      setLogs(logList);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('Token')) {
        setIsAuthenticated(false);
        api.logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await api.login(password);
      setIsAuthenticated(true);
      loadData();
    } catch (err: any) {
      setLoginError(err.message || 'Contraseña incorrecta');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.updateSettings(settings);
      setNotification({ type: 'success', message: 'Configuración guardada exitosamente.' });
      loadData();
      onRefreshState();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerDailyDispatch = async () => {
    setIsLoading(true);
    setConfirmManualDispatch(false);
    try {
      const result = await api.triggerDailyDispatch();
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.flowerCreated
            ? '¡Carta diaria enviada con éxito! Se añadió una flor al jardín.'
            : (result.error || 'Proceso completado.')
        });
      } else {
        setNotification({ type: 'error', message: `Envío fallido: ${result.error}` });
      }
      loadData();
      onRefreshState();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestMessage = async (channel: string) => {
    setIsLoading(true);
    try {
      const result = await api.triggerTestDispatch(channel);
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Mensaje de prueba enviado por ${channel}. (No se creó ninguna flor, conforme al protocolo).`
        });
      } else {
        setNotification({ type: 'error', message: `Error en prueba: ${result.error}` });
      }
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManualLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createManualLetter({
        title: manualTitle,
        category: manualCategory,
        content: manualContent,
      });
      setNotification({ type: 'success', message: 'Carta guardada en archivo sin duplicados.' });
      setManualTitle('');
      setManualContent('');
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-100">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Panel de Control MI VIDA ETERNA</h2>
              <p className="text-xs text-slate-400">Administración de envíos a las 5:00 a. m. (America/Bogota)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => { api.logout(); setIsAuthenticated(false); }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`px-5 py-3 text-xs flex items-center justify-between border-b ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/40'
          }`}>
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Authentication View */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-semibold text-white mb-2">Acceso de Administrador</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Introduce la contraseña de administración para configurar el destinatario, programador y credenciales.
            </p>
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Contraseña de acceso"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  autoFocus
                />
                {loginError && <p className="text-xs text-rose-400 mt-1.5 text-left">{loginError}</p>}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-rose-600/30"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 px-4 overflow-x-auto">
              {[
                { id: 'DESTINATARIO', label: 'Destinatario', icon: Heart },
                { id: 'PROGRAMACION', label: 'Programación 5 AM', icon: Calendar },
                { id: 'CARTAS', label: 'Cartas y Redacción', icon: MessageSquare },
                { id: 'INTEGRACIONES', label: 'WhatsApp', icon: MessageSquare },
                { id: 'SIMULACION', label: 'Simulador 3D', icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {isLoading && !settings ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
                </div>
              ) : null}

              {/* TAB 1: DESTINATARIO */}
              {activeTab === 'DESTINATARIO' && settings && (
                <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Destinatario</label>
                      <input
                        type="text"
                        value={settings.recipient_name || ''}
                        onChange={(e) => setSettings({ ...settings, recipient_name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Apodo de Cariño</label>
                      <input
                        type="text"
                        value={settings.recipient_nickname || ''}
                        onChange={(e) => setSettings({ ...settings, recipient_nickname: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Número de WhatsApp (con código de país)</label>
                    <input
                      type="text"
                      value={settings.recipient_whatsapp || ''}
                      onChange={(e) => setSettings({ ...settings, recipient_whatsapp: e.target.value })}
                      placeholder="Ejemplo: +573001234567 o 573001234567"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Este número recibirá los recordatorios diarios de las cartas de amor.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Firma Personal en la Carta</label>
                    <input
                      type="text"
                      value={settings.signature_name || ''}
                      onChange={(e) => setSettings({ ...settings, signature_name: e.target.value })}
                      placeholder="Por siempre tuyo"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                    >
                      Guardar Datos del Destinatario
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: PROGRAMACIÓN */}
              {activeTab === 'PROGRAMACION' && schedulerInfo && settings && (
                <div className="space-y-6 max-w-xl">
                  {/* Cron Health Card */}
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Estado de Automatización:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        settings.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {settings.is_active ? 'ACTIVO Y PROGRAMADO' : 'PAUSADO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Hora de Envío Diario:</span>
                      <span className="font-mono font-semibold text-rose-300">05:00 a. m.</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Zona Horaria:</span>
                      <span className="font-mono text-slate-200">America/Bogota (UTC-5)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Próximo Envío en:</span>
                      <span className="font-semibold text-amber-300">
                        {schedulerInfo.hoursRemaining}h {schedulerInfo.minutesRemaining}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Última Ejecución:</span>
                      <span className="text-slate-300">
                        {schedulerInfo.lastRunTime ? new Date(schedulerInfo.lastRunTime).toLocaleString('es-CO') : 'Sin ejecuciones previas'}
                      </span>
                    </div>
                  </div>

                  {/* Manual Dispatch Trigger */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-2">
                    <h4 className="text-sm font-semibold text-rose-200">Ejecutar Envío Manual del Día</h4>
                    <p className="text-xs text-slate-400">
                      Dispara de inmediato el flujo de envío de la carta de hoy. Si hoy ya se envió una carta, el sistema respetará la idempotencia y no enviará un duplicado.
                    </p>
                    <div className="pt-2">
                      {!confirmManualDispatch ? (
                        <button
                          onClick={() => setConfirmManualDispatch(true)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Enviar Carta de Hoy Ahora</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleTriggerDailyDispatch}
                            className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold"
                          >
                            Confirmar Envío Inmediato
                          </button>
                          <button
                            onClick={() => setConfirmManualDispatch(false)}
                            className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CARTAS */}
              {activeTab === 'CARTAS' && (
                <div className="space-y-6 max-w-xl">
                  {/* Manual Letter Creator */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-white mb-1">Escribir Carta Personalizada</h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Cada carta pasa por un control estricto de huella digital normalizada para evitar duplicados.
                    </p>
                    <form onSubmit={handleCreateManualLetter} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Título poético de la carta"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <select
                          value={manualCategory}
                          onChange={(e) => setManualCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="Amor profundo">Amor profundo</option>
                          <option value="Ternura y cariño">Ternura y cariño</option>
                          <option value="Gratitud por tener a esa persona">Gratitud por tener a esa persona</option>
                          <option value="Promesas de amor">Promesas de amor</option>
                          <option value="Recuerdos y momentos especiales">Recuerdos y momentos especiales</option>
                          <option value="Admiración por su personalidad">Admiración por su personalidad</option>
                          <option value="Apoyo en los días difíciles">Apoyo en los días difíciles</option>
                          <option value="Motivación para comenzar el día">Motivación para comenzar el día</option>
                          <option value="Sueños y planes juntos">Sueños y planes juntos</option>
                          <option value="Mensajes poéticos">Mensajes poéticos</option>
                        </select>
                      </div>
                      <div>
                        <textarea
                          placeholder="Escribe el mensaje con sinceridad y ternura..."
                          rows={4}
                          value={manualContent}
                          onChange={(e) => setManualContent(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium"
                      >
                        Guardar Carta en Archivo
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 4: WHATSAPP */}
              {activeTab === 'INTEGRACIONES' && (
                <div className="space-y-5 max-w-xl">
                  {/* WhatsApp Direct 1-Click Card */}
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">WhatsApp Directo (Sin Configuración)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ¡La forma más rápida y sin complicaciones! Puedes enviar el recordatorio romántico de la carta directamente al WhatsApp de tu persona especial con un solo clic.
                    </p>
                    <a
                      href={`https://api.whatsapp.com/send?${
                        settings.recipient_whatsapp ? `phone=${settings.recipient_whatsapp.replace(/[^0-9]/g, '')}&` : ''
                      }text=${encodeURIComponent(
                        `🌸 *MI VIDA ETERNA* 🌸\n\nQuerida ${settings.recipient_name || 'Mi Amor'},\n\n🌹 *Una nueva flor ha florecido hoy para ti en nuestro jardín eterno.*\n\n✨ Entra a nuestro mundo para verla florecer:\n👉 http://localhost:3001\n\nCon todo mi corazón,\n*${settings.signature_name || 'Por siempre tuyo'}* ❤️`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 transition-transform active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>Abrir WhatsApp con Mensaje de Recordatorio</span>
                    </a>
                  </div>

                  {/* WhatsApp Automated API Card */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Meta WhatsApp Cloud API (Automático a las 5 AM)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        integrationsStatus?.whatsapp?.connected
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {integrationsStatus?.whatsapp?.connected ? 'CONECTADO' : 'MODO DIRECTO ACTIVO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {integrationsStatus?.whatsapp?.connected
                        ? 'Envío automático autónomo a las 5:00 a. m. activo mediante Meta Cloud API.'
                        : 'El sistema está configurado en modo directo de WhatsApp. Si deseas automatización desatendida a las 5:00 a. m., puedes configurar opcionalmente tu token de Meta en .env.'}
                    </p>
                    <button
                      onClick={() => handleSendTestMessage('WHATSAPP')}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium"
                    >
                      Probar Envío por WhatsApp
                    </button>
                  </div>

                  {/* Gemini AI Card */}
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-white">Biblioteca Poética de Cartas</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Más de 100 cartas originales organizadas en 14 categorías románticas sin repetición garantizada.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: SIMULACIÓN & TIME TRAVEL */}
              {activeTab === 'SIMULACION' && (
                <div className="space-y-6 max-w-xl">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Previsualizador de Etapas 3D</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Experimenta de inmediato cómo evoluciona la experiencia visual desde el día 1 hasta los 365 días (La Tierra en el espacio) y el cosmos infinito, sin alterar los datos reales de la base de datos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => onPreviewStageChange('STAGE_1_FIRST_BLOOM', 1)}
                        className="p-3 text-left rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 transition-colors"
                      >
                        <span className="block text-xs font-semibold text-rose-300">Día 1: Primera Flor</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">Enfoque íntimo en la flor inicial</span>
                      </button>

                      <button
                        onClick={() => onPreviewStageChange('STAGE_2_GARDEN_GROWTH', 30)}
                        className="p-3 text-left rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 transition-colors"
                      >
                        <span className="block text-xs font-semibold text-rose-300">Día 30: Jardín Creciente</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">Cámara amplia y 30 flores</span>
                      </button>

                      <button
                        onClick={() => onPreviewStageChange('STAGE_4_EARTH_ASCENT', 365)}
                        className="p-3 text-left rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 transition-colors"
                      >
                        <span className="block text-xs font-semibold text-amber-300">Día 365: La Tierra en el Espacio</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">Ascenso cinematográfico al espacio</span>
                      </button>

                      <button
                        onClick={() => onPreviewStageChange('STAGE_5_COSMIC_STARS', 420)}
                        className="p-3 text-left rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 transition-colors"
                      >
                        <span className="block text-xs font-semibold text-blue-300">Día 400+: Estrellas y Cosmos</span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">Cada carta crea una estrella viva</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onPreviewStageChange(gardenState.stage, gardenState.totalConfirmedSent)}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium"
                    >
                      Restablecer a Estado Real de Producción
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

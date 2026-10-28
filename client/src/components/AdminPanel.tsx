import React, { useState, useEffect } from 'react';
import {
  X, Lock, Settings, Calendar, Heart, Mail, MessageSquare, Sparkles,
  Send, RefreshCw, CheckCircle2, AlertTriangle, Play, Eye, ShieldCheck, LogOut,
  QrCode, Smartphone, Download, Cloud, Upload
} from 'lucide-react';
import { api, GardenState, WhatsAppWebStatusResponse } from '../services/api.js';

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

  // WhatsApp Web State
  const [waWebInfo, setWaWebInfo] = useState<WhatsAppWebStatusResponse | null>(null);
  const [isStartingWaWeb, setIsStartingWaWeb] = useState(false);
  const [isTestingWaWeb, setIsTestingWaWeb] = useState(false);

  // Backup State
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadData();
    }
  }, [isOpen, isAuthenticated]);

  // Refresh WhatsApp status on tab switch
  useEffect(() => {
    if (isOpen && isAuthenticated && activeTab === 'INTEGRACIONES') {
      api.getWhatsAppWebStatus().then(setWaWebInfo).catch(() => null);
    }
  }, [activeTab, isOpen, isAuthenticated]);

  // Polling for QR scan & WhatsApp Web connection status
  useEffect(() => {
    let interval: any = null;
    if (isOpen && isAuthenticated && (waWebInfo?.status === 'QR_READY' || waWebInfo?.status === 'CONNECTING')) {
      interval = setInterval(async () => {
        try {
          const status = await api.getWhatsAppWebStatus();
          setWaWebInfo(status);
          if (status.status === 'CONNECTED') {
            setNotification({ type: 'success', message: '¡WhatsApp Personal conectado exitosamente!' });
          }
        } catch {
          // Ignore polling errors
        }
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isAuthenticated, waWebInfo?.status]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sett, sched, integ, logList, waWeb, bInfo] = await Promise.all([
        api.getSettings(),
        api.getScheduler(),
        api.getIntegrationsStatus(),
        api.getLogs(),
        api.getWhatsAppWebStatus().catch(() => null),
        api.getBackupInfo().catch(() => null)
      ]);
      setSettings(sett);
      setSchedulerInfo(sched);
      setIntegrationsStatus(integ);
      setLogs(logList);
      if (waWeb) setWaWebInfo(waWeb);
      if (bInfo?.backup) setBackupInfo(bInfo.backup);
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

  const handleTriggerDailyDispatch = async (forceResend: boolean = false) => {
    setIsLoading(true);
    setConfirmManualDispatch(false);
    try {
      const result = await api.triggerDailyDispatch(forceResend);
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.flowerCreated
            ? '¡Carta diaria enviada con éxito! Se añadió una flor al jardín.'
            : (result.error || '¡Carta de hoy enviada con éxito a WhatsApp!')
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

  const handleStartWaWeb = async () => {
    setIsStartingWaWeb(true);
    try {
      const status = await api.startWhatsAppWeb();
      setWaWebInfo(status);
      setNotification({ type: 'success', message: 'Iniciando WhatsApp... Escanea el código QR que aparecerá abajo.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al iniciar vinculación' });
    } finally {
      setIsStartingWaWeb(false);
    }
  };

  const handleLogoutWaWeb = async () => {
    try {
      await api.logoutWhatsAppWeb();
      setWaWebInfo({ status: 'DISCONNECTED', hasSavedSession: false });
      setNotification({ type: 'success', message: 'WhatsApp personal desvinculado correctamente.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al desvincular WhatsApp' });
    }
  };

  const handleTestWaWeb = async () => {
    setIsTestingWaWeb(true);
    try {
      // Auto-save settings first so the recipient number is guaranteed in the database
      if (settings) {
        await api.updateSettings(settings);
      }
      const res = await api.testWhatsAppWeb(settings?.recipient_whatsapp);
      setNotification({
        type: 'success',
        message: res.message || '¡Mensaje de prueba enviado exitosamente por WhatsApp al celular de tu pareja!'
      });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al enviar mensaje de prueba por WhatsApp' });
    } finally {
      setIsTestingWaWeb(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await api.createBackup();
      setBackupInfo(res.backup);
      setNotification({ type: 'success', message: '¡Copia de seguridad en la nube generada exitosamente!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al generar copia' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/backup/download', '_blank');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await api.restoreBackup(json);
        setNotification({ type: 'success', message: '¡Proceso y datos restaurados exitosamente desde archivo!' });
        loadData();
        onRefreshState();
      } catch (err: any) {
        setNotification({ type: 'error', message: 'Archivo de respaldo inválido o dañado.' });
      }
    };
    reader.readAsText(file);
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Clave Secreta de Acceso para tu Pareja (mínimo 6 dígitos)
                    </label>
                    <input
                      type="text"
                      value={settings.recipient_access_code || ''}
                      onChange={(e) => setSettings({ ...settings, recipient_access_code: e.target.value })}
                      placeholder="Ejemplo: 123456 o fecha especial"
                      minLength={6}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tu pareja iniciará sesión con su número de WhatsApp y esta clave secreta de mínimo 6 dígitos.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        URL Pública de la Web (para WhatsApp)
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, public_web_url: typeof window !== 'undefined' ? window.location.origin : '' })}
                        className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                      >
                        Usar URL actual
                      </button>
                    </div>
                    <input
                      type="text"
                      value={settings.public_web_url || ''}
                      onChange={(e) => setSettings({ ...settings, public_web_url: e.target.value })}
                      placeholder="https://mi-vida-eterna.onrender.com"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Esta es la URL que tu pareja abrirá en su teléfono al hacer clic en el mensaje de WhatsApp.
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
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {!confirmManualDispatch ? (
                        <>
                          <button
                            onClick={() => setConfirmManualDispatch(true)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Enviar Carta de Hoy Ahora</span>
                          </button>
                          <button
                            onClick={() => handleTriggerDailyDispatch(true)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                            title="Reenvía la carta de hoy por WhatsApp si hubo problemas de desencriptación"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reenviar Carta de Hoy</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTriggerDailyDispatch(false)}
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

                  {/* Cloud Backup & Migration Card */}
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-semibold text-white">Copia de Seguridad en la Nube (GitHub & Local)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        SINCRONIZADO
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      El historial completo de cartas, flores del jardín 3D, configuración y clave de tu pareja se guarda en la nube para que nunca pierdas el progreso al cambiar de computadora.
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Cartas en Respaldo:</span>
                        <span className="font-mono font-bold text-white">{backupInfo?.letterCount || 0} cartas</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Flores Respaldadas:</span>
                        <span className="font-mono font-bold text-rose-300">{backupInfo?.flowerCount || 0} flores</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleCreateBackup}
                        disabled={isBackingUp}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        {isBackingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                        <span>Crear Copia en la Nube Ahora</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadBackup}
                        className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Descargar archivo JSON a tu computadora o celular"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Archivo (.json)</span>
                      </button>

                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Restaurar Archivo</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleRestoreFile}
                          className="hidden"
                        />
                      </label>
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
                  {/* WhatsApp Web Personal QR Linking (100% Autonomous) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Vincular tu WhatsApp Personal (Código QR)</h4>
                          <p className="text-[11px] text-emerald-300 font-medium">Envío 100% automático desatendido a las 5:00 AM</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        waWebInfo?.status === 'CONNECTED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                          : waWebInfo?.status === 'QR_READY'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600/60 animate-pulse'
                          : waWebInfo?.status === 'CONNECTING'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {waWebInfo?.status === 'CONNECTED' ? '🟢 VINCULADO' : waWebInfo?.status === 'QR_READY' ? '🟡 ESCANEAR QR' : waWebInfo?.status === 'CONNECTING' ? '🔵 CONECTANDO...' : '⚪ NO VINCULADO'}
                      </span>
                    </div>

                    {waWebInfo?.status === 'CONNECTED' ? (
                      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-xs text-slate-200 leading-relaxed">
                            <p className="font-semibold text-emerald-300 mb-0.5">
                              ¡Tu WhatsApp personal está vinculado como emisor autónomo!
                            </p>
                            <p>
                              Número emisor conectado: <span className="font-mono font-bold text-white">+{waWebInfo.user?.phone || 'Vinculado'}</span>
                            </p>
                            <p className="text-slate-400 mt-1">
                              Todos los días a las 5:00 AM, el servidor le enviará la carta de amor a tu pareja directamente desde tu propio WhatsApp sin que tengas que tocar el teléfono.
                            </p>
                          </div>
                        </div>

                        {/* Recipient Destination Phone in WhatsApp tab */}
                        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">WhatsApp de tu Pareja (Destinatario):</span>
                            <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                              {settings.recipient_whatsapp ? `+${settings.recipient_whatsapp.replace(/[^\d]/g, '')}` : 'Sin configurar'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={settings.recipient_whatsapp || ''}
                              onChange={(e) => setSettings({ ...settings, recipient_whatsapp: e.target.value })}
                              placeholder="Ej: +57 314 7935338"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={handleSaveSettings}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                            >
                              Guardar
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            A este número llegarán las cartas cada mañana a las 5:00 AM desde tu WhatsApp (+{waWebInfo.user?.phone || 'vinculado'}).
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-emerald-800/40">
                          <button
                            type="button"
                            onClick={handleTestWaWeb}
                            disabled={isTestingWaWeb}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            {isTestingWaWeb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            <span>Enviar Mensaje de Prueba a mi Pareja Ahora</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerDailyDispatch(true)}
                            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                            title="Reenvía la carta de amor programada para hoy directamente a su celular"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Reenviar Carta de Hoy a su WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLogoutWaWeb}
                            className="px-3 py-2 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            Desvincular Dispositivo
                          </button>
                        </div>
                      </div>
                    ) : waWebInfo?.status === 'QR_READY' && waWebInfo.qrCode ? (
                      <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
                          <QrCode className="w-4 h-4" />
                          <span>Escanea este código QR con WhatsApp en tu celular:</span>
                        </div>

                        <div className="inline-block p-3 bg-white rounded-2xl shadow-2xl">
                          <img
                            src={waWebInfo.qrCode}
                            alt="Código QR de WhatsApp"
                            className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                          />
                        </div>

                        <div className="text-left text-xs text-slate-300 bg-slate-800/70 p-3.5 rounded-xl space-y-1.5 max-w-sm mx-auto border border-slate-700/50">
                          <p className="font-semibold text-white">Instrucciones en tu celular:</p>
                          <p>1. Abre la app de <b>WhatsApp</b> en tu celular.</p>
                          <p>2. Ve a <b>Ajustes</b> (o menú de 3 puntos) &gt; <b>Dispositivos vinculados</b>.</p>
                          <p>3. Toca <b>Vincular un dispositivo</b> y apunta la cámara a este código.</p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>Esperando que escanees el código QR...</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleStartWaWeb}
                            disabled={isStartingWaWeb}
                            className="mt-1 text-[11px] text-amber-300/80 hover:text-amber-200 underline inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>¿El código expiró? Haz clic para generar uno nuevo</span>
                          </button>
                        </div>
                      </div>
                    ) : waWebInfo?.status === 'CONNECTING' ? (
                      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center space-y-3">
                        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                        <p className="text-xs font-medium text-white">Conectando sesión de WhatsApp...</p>
                        <p className="text-[11px] text-slate-400">Sincronizando de forma segura...</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Para que las cartas se envíen solas sin que tú estés despierto ni toques nada, vincula tu WhatsApp escaneando un código QR una sola vez (igual que en WhatsApp Web de tu PC).
                        </p>
                        <button
                          type="button"
                          onClick={handleStartWaWeb}
                          disabled={isStartingWaWeb}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-900/30 transition-transform active:scale-95"
                        >
                          {isStartingWaWeb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                          <span>Generar Código QR para Vincular mi WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Direct 1-Click Card (Fallback) */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">Opción Manual: Enlace Directo (1 Clic)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Si en algún momento prefieres enviar el recordatorio manualmente desde cualquier teléfono o navegador, puedes usar este botón de un solo clic.
                    </p>
                    <a
                      href={`https://api.whatsapp.com/send?${
                        settings.recipient_whatsapp ? `phone=${settings.recipient_whatsapp.replace(/[^0-9]/g, '')}&` : ''
                      }text=${encodeURIComponent(
                        `🌸 *MI VIDA ETERNA* 🌸\n\nQuerida ${settings.recipient_name || 'Mi Amor'},\n\n🌹 *Una nueva flor ha florecido hoy para ti en nuestro jardín eterno.*\n\n✨ Entra a nuestro mundo para verla florecer:\n👉 ${settings.public_web_url || (typeof window !== 'undefined' ? window.location.origin : 'https://mi-vida-eterna.onrender.com')}\n\nCon todo mi corazón,\n*${settings.signature_name || 'Por siempre tuyo'}* ❤️`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow-md transition-transform active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>Abrir WhatsApp Web / Móvil Directo</span>
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

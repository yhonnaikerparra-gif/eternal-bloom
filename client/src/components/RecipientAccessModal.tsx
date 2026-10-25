import React, { useState } from 'react';
import { Heart, Lock, Phone, User, Eye, EyeOff, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { api, RecipientProfile } from '../services/api.js';

interface RecipientAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recipient: RecipientProfile) => void;
  defaultRecipientName?: string;
  defaultWhatsapp?: string;
  isInitialConfig?: boolean;
}

export const RecipientAccessModal: React.FC<RecipientAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRecipientName = 'Mi Amor',
  defaultWhatsapp = '',
  isInitialConfig = false,
}) => {
  const [name, setName] = useState(defaultRecipientName === 'Mi Amor' ? '' : defaultRecipientName);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp);
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'LOGIN' | 'SETUP'>(isInitialConfig ? 'SETUP' : 'LOGIN');

  if (!isOpen) return null;

  const codeLengthValid = accessCode.trim().length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = whatsapp.replace(/[^\d]/g, '');
    if (cleanPhone.length < 7) {
      setErrorMsg('Por favor ingresa un número de WhatsApp válido (con código de país, ej. +57 para Colombia).');
      return;
    }

    if (!codeLengthValid) {
      setErrorMsg('La clave secreta debe tener un mínimo de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send origin URL so backend knows the exact public web URL for WhatsApp links
      const publicWebUrl = window.location.origin;

      const result = await api.accessRecipient({
        name: name.trim() || undefined,
        whatsapp: cleanPhone,
        accessCode: accessCode.trim(),
        publicWebUrl,
      });

      onSuccess(result.recipient);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verifica tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-rose-500/30 z-10 animate-unfold">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Romantic Header */}
        <div className="text-center pb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-600/30 mb-3 border border-rose-300/30">
            <Heart className="w-7 h-7 fill-white animate-pulse" />
          </div>
          <span className="block text-xs uppercase tracking-widest font-semibold text-rose-300 font-sans">
            MI VIDA ETERNA
          </span>
          <h2 className="text-2xl font-display font-medium text-white mt-1">
            {mode === 'SETUP' ? 'Configurar Nuestro Acceso' : 'Bienvenida a Nuestro Jardín'}
          </h2>
          <p className="text-xs text-rose-200/80 font-serif italic mt-1.5 max-w-xs mx-auto leading-relaxed">
            {mode === 'SETUP'
              ? 'Ingresa tus datos y tu clave secreta personal (mínimo 6 dígitos) para iniciar nuestra historia eterna.'
              : 'Ingresa tu número de WhatsApp y tu clave secreta para entrar a nuestro universo y leer tu carta de hoy.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
            <span className="font-semibold text-rose-400">Nota:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Access Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SETUP' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tu Nombre o Apodo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ejemplo: Valentina, Mi Princesa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tu Número de WhatsApp <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="Ejemplo: +57 300 123 4567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Con código de país (ej. +57 Colombia). Aquí recibirás tus cartas de amor.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Tu Clave Secreta <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[11px] font-mono ${codeLengthValid ? 'text-emerald-400' : 'text-slate-400'}`}>
                {accessCode.length >= 6 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Válida ({accessCode.length} dígitos)
                  </span>
                ) : (
                  `Mínimo 6 dígitos (${accessCode.length}/6)`
                )}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCode ? 'text' : 'password'}
                placeholder="Ingresa mínimo 6 dígitos"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                minLength={6}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                tabIndex={-1}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !codeLengthValid}
              className={`w-full py-3 rounded-xl font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                codeLengthValid && !isSubmitting
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-rose-300" />
                  <span>Conectando y Preparando tu Jardín...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'SETUP' ? 'Iniciar Nuestro Viaje Eterno' : 'Entrar a Nuestro Jardín'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Switch Mode Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          {mode === 'LOGIN' ? (
            <button
              type="button"
              onClick={() => { setMode('SETUP'); setErrorMsg(''); }}
              className="text-xs text-rose-300/80 hover:text-rose-200 transition-colors underline"
            >
              ¿Deseas configurar o actualizar tu nombre y clave secreta?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setErrorMsg(''); }}
              className="text-xs text-rose-300/80 hover:text-rose-200 transition-colors underline"
            >
              ¿Ya tienes tu clave? Inicia sesión aquí
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Store,
} from 'lucide-react';
import { UserProfile } from '@/types/database';
import { dataStore } from '@/lib/store';
import {
  hashPassword,
  verifyPassword,
  sanitizeMexicanPhone,
  isValidMexicanPhone,
} from '@/lib/security';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery' | 'switch'>('login');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('CDMX');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Recovery form
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  if (!isOpen) return null;

  const users = dataStore.getUsers();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = users.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (found) {
      if (found.is_banned) {
        setLoginError('Esta cuenta está suspendida por acumulación de 3 strikes anti-troll.');
        return;
      }
      // Verificación de hash SHA-256
      if (found.password_hash) {
        const isValid = await verifyPassword(loginPassword, found.password_hash);
        if (!isValid) {
          setLoginError('Contraseña incorrecta. Por favor verifica tus credenciales.');
          return;
        }
      } else {
        // En usuarios demo sin hash previo, inicializar su hash seguro
        const hash = await hashPassword(loginPassword || 'tcg123');
        dataStore.updateUserProfile(found.id, { password_hash: hash });
      }
      dataStore.setCurrentUserId(found.id);
      onUserChange(found);
      onClose();
    } else {
      // Demo login: guardar con hash seguro
      const password_hash = await hashPassword(loginPassword || 'tcg123');
      const newUser = dataStore.addUserProfile({
        name: loginEmail.split('@')[0] || 'Nuevo Usuario',
        email: loginEmail,
        city: 'CDMX',
        password_hash,
        strikes: 0,
        is_banned: false,
        reputation_positive: 10,
        reputation_negative: 0,
        rating: 5.0,
        total_trades: 1,
      });
      onUserChange(newUser);
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Por favor completa tu nombre y correo electrónico.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Validación estricta de celular a 10 dígitos (México +52)
    const sanitizedPhone = sanitizeMexicanPhone(regPhone);
    if (regPhone.trim() && sanitizedPhone.length !== 10) {
      setRegError('El número de celular debe tener exactamente 10 dígitos numéricos (sin lada ni símbolos).');
      return;
    }

    // Hashear contraseña con SHA-256 + Salt
    const password_hash = await hashPassword(regPassword);

    const created = dataStore.addUserProfile({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: sanitizedPhone || undefined,
      city: regCity.trim() || 'CDMX',
      password_hash,
      strikes: 0,
      is_banned: false,
      reputation_positive: 10,
      reputation_negative: 0,
      rating: 5.0,
      total_trades: 0,
      is_verified_store: false,
    });

    setRegSuccess(true);
    setTimeout(() => {
      onUserChange(created);
      onClose();
      setRegSuccess(false);
    }, 1200);
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;
    setRecoverySuccess(true);
  };

  const handleSwitchUser = (user: UserProfile) => {
    dataStore.setCurrentUserId(user.id);
    onUserChange(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cuenta de Usuario TCG
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acceso al Marketplace, Vitrinas y Subastas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current logged-in user summary */}
        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Sesión activa: </span>
              <strong className="text-slate-900 dark:text-white font-bold">{currentUser.name}</strong>
              <span className="text-slate-500 dark:text-slate-400 ml-1">({currentUser.city || 'México'})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('switch')}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Cambiar Perfil
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2.5 text-center transition cursor-pointer ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/40 dark:bg-blue-950/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2.5 text-center transition cursor-pointer ${
              activeTab === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/40 dark:bg-blue-950/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Registro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`py-2.5 text-center transition cursor-pointer ${
              activeTab === 'recovery'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/40 dark:bg-blue-950/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recuperar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('switch')}
            className={`py-2.5 text-center transition cursor-pointer ${
              activeTab === 'switch'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/40 dark:bg-blue-950/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Simulador
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* TAB: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu_correo@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('recovery')}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Crear cuenta nueva
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Iniciar Sesión
              </button>
            </form>
          )}

          {/* TAB: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Cuenta creada con éxito! Iniciando sesión...</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo / Apodo de Jugador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Santiago TCG Master"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="jugador@tcg.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Ubicación
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Ej. CDMX, GDL..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Celular (10 dígitos)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(sanitizeMexicanPhone(e.target.value))}
                    maxLength={10}
                    placeholder="Ej. 5512345678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Sin lada (+52 MX). {regPhone.length}/10 dígitos
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña (Cifrado SHA-256)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Las contraseñas se hashean antes de guardarse para prevenir vulnerabilidades.
                </span>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Completar Registro Protegido
              </button>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cifrado criptográfico SHA-256 + Salt activado</span>
              </div>
            </form>
          )}

          {/* TAB: PASSWORD RECOVERY */}
          {activeTab === 'recovery' && (
            <div className="space-y-4">
              {recoverySuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enlace de recuperación simulado</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Hemos enviado las instrucciones a <strong>{recoveryEmail}</strong>. En este entorno demostrativo puedes iniciar sesión inmediatamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverySuccess(false);
                      setActiveTab('login');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block pt-1"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecovery} className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ingresa el correo electrónico asociado a tu cuenta de jugador o vitrina. Te enviaremos un código para restablecer tu contraseña.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="tu_correo@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    Enviar Código de Recuperación
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB: SWITCH USER SIMULATOR */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona cualquier perfil para simular su perspectiva, reputación y ciudad en el Marketplace:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSwitchUser(u)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            u.is_verified_store
                              ? 'bg-blue-600 text-white'
                              : u.strikes > 0
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {u.is_verified_store ? <Store className="w-4 h-4" /> : u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {u.name}
                            </span>
                            {u.is_verified_store && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                                Tienda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>{u.city || 'México'}</span>
                            <span>•</span>
                            <span className="text-amber-500 font-bold">★ {u.rating ? u.rating.toFixed(1) : '5.0'}</span>
                            {u.strikes > 0 && (
                              <span className="text-red-500 font-semibold font-mono">
                                ({u.strikes} strikes)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

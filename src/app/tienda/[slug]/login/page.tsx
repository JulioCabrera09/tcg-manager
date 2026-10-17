'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { dataStore } from '@/lib/store';
import { verifyPassword, hashPassword } from '@/lib/security';
import { Tenant } from '@/types/database';

export default function StoreStaffLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const foundTenant = dataStore.getTenantBySlug(slug);
    if (foundTenant) {
      setTenant(foundTenant);
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <Store className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tienda no encontrada</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
          No existe una tienda registrada con el identificador &quot;{slug}&quot;. Verifica el enlace proporcionado por tu administrador.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    try {
      const allUsers = dataStore.getUsers();
      const user = allUsers.find(
        (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (!user) {
        setErrorMessage(
          'No se encontró ningún usuario con este correo electrónico. Contacta al administrador de la tienda para que cree tu cuenta de colaborador.'
        );
        setIsAuthenticating(false);
        return;
      }

      // 1. Password verification (checking both hashed or demo raw matches)
      let isPasswordValid = false;
      if (user.password_hash) {
        const passwordMatchesHash = await verifyPassword(password, user.password_hash);
        if (passwordMatchesHash) {
          isPasswordValid = true;
        } else if (user.password_hash === password) {
          isPasswordValid = true;
        }
      } else {
        // Fallback for legacy demo users
        isPasswordValid = password.length >= 4;
      }

      if (!isPasswordValid) {
        setErrorMessage('La contraseña ingresada es incorrecta. Vuelve a intentarlo.');
        setIsAuthenticating(false);
        return;
      }

      // 2. Tenant isolation check:
      // SuperAdmin and Admin can enter any store.
      // Store staff and Store admin must match this tenant.
      if (user.role === 'regular_user') {
        setErrorMessage(
          'Esta cuenta está registrada como "Usuario Común del Marketplace". El acceso a este portal está reservado para personal operativo de la tienda.'
        );
        setIsAuthenticating(false);
        return;
      }

      if (user.role === 'store_staff' || user.role === 'store_admin') {
        if (user.tenant_id && user.tenant_id !== tenant.id) {
          setErrorMessage(
            `Acceso denegado: Esta cuenta pertenece al personal de otra tienda (${user.store_name || user.tenant_id}). No tienes autorización para ingresar a ${tenant.name}.`
          );
          setIsAuthenticating(false);
          return;
        }
      }

      if (user.is_banned) {
        setErrorMessage('Esta cuenta de colaborador se encuentra suspendida.');
        setIsAuthenticating(false);
        return;
      }

      // Success! Set active user and active store
      dataStore.setCurrentUserId(user.id);
      dataStore.setActiveTenantId(tenant.id);

      // Notification of successful staff login
      dataStore.addNotification({
        recipient_id: user.id,
        title: `Sesión iniciada en ${tenant.name}`,
        message: `Has ingresado al panel operativo como ${user.name}.`,
        type: 'system',
        action_url: '/dashboard',
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado durante la autenticación';
      setErrorMessage(msg);
      setIsAuthenticating(false);
    }
  };

  const handleDemoStaffLogin = () => {
    // Quick demo login for testing Miguel Soto
    const staffUser = dataStore.getUsers().find((u) => u.id === 'usr-omega-staff');
    if (staffUser) {
      dataStore.setCurrentUserId(staffUser.id);
      dataStore.setActiveTenantId(tenant.id);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Banner Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/tienda/${tenant.slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda {tenant.name}
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
              Servidor Operativo • {tenant.slug}
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Store Identification Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl mx-auto bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shadow-sm">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Users className="w-3.5 h-3.5" />
                Portal de Colaboradores & Staff
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                {tenant.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ingresa con tu correo y contraseña asignados por la administración
              </p>
            </div>
          </div>

          {/* Important Rule: No Public Register Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Acceso restringido:</strong> En este portal no existe registro público. Las cuentas y permisos de colaboradores son dados de alta exclusivamente por el dueño o administrador de <strong>{tenant.name}</strong>.
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Correo Electrónico de Colaborador
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. miguel@tienda.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Contraseña Asignada
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs mt-2"
            >
              {isAuthenticating ? (
                <>Verificando Credenciales...</>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Iniciar Sesión de Colaborador
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option for testing */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Acceso Rápido para Demostración
            </span>
            <button
              type="button"
              onClick={handleDemoStaffLogin}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Entrar como Miguel Soto (Staff Cajero)
            </button>
          </div>
        </div>
      </main>

      <Footer variant="dashboard" storeName={tenant.name} />
    </div>
  );
}

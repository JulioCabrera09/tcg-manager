'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Store,
  Gavel,
  ShieldCheck,
  ShoppingBag,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  Sun,
  Moon,
  FolderArchive,
  PlusCircle,
  Sparkles,
  User,
  LogIn,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Tenant, UserProfile } from '@/types/database';
import { useTheme } from '@/context/ThemeContext';
import RoleSwitcher from '@/components/RoleSwitcher';
import RegisterStoreModal from '@/components/RegisterStoreModal';
import NotificationCenter from '@/components/NotificationCenter';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [storesDropdownOpen, setStoresDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleUserChanged = () => {
      setCurrentUser(dataStore.getCurrentUser());
      setTenants(dataStore.getTenants());
    };

    setTenants(dataStore.getTenants());
    setCurrentUser(dataStore.getCurrentUser());

    window.addEventListener('tcg_user_changed', handleUserChanged);
    return () => window.removeEventListener('tcg_user_changed', handleUserChanged);
  }, [pathname]);

  const isStorefront = pathname.startsWith('/tienda/');
  const role = currentUser?.role || 'regular_user';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo - Solid Colors, No Gradients */}
          <div className="flex items-center gap-4 lg:gap-8">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm transition">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  TCG<span className="text-blue-600 dark:text-blue-400">Ecosystem</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider block -mt-1">
                  {role === 'regular_user'
                    ? 'MARKETPLACE • SUBASTAS'
                    : role === 'store_admin' || role === 'store_staff'
                    ? `${(currentUser.store_name || 'TIENDA').toUpperCase()} • ERP`
                    : 'ERP • POS • SUBASTAS'}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Role-Based */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* === 1. SUPER ADMIN & SUB-ADMIN NAVIGATION === */}
              {(role === 'superadmin' || role === 'admin') && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      pathname.startsWith('/dashboard')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Panel ERP / POS
                  </Link>

                  {/* Dropdown for Storefronts */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStoresDropdownOpen(!storesDropdownOpen)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isStorefront
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Tiendas Piloto
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {storesDropdownOpen && (
                      <div
                        onMouseLeave={() => setStoresDropdownOpen(false)}
                        className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 animate-fade-in"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Storefronts Generados
                        </div>
                        {tenants.map((t) => (
                          <Link
                            key={t.id}
                            href={`/tienda/${t.slug}`}
                            onClick={() => setStoresDropdownOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: t.theme_color || '#2563EB' }}
                              />
                              <span>{t.name}</span>
                            </div>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/admin"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      pathname.startsWith('/admin')
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {role === 'superadmin' ? 'Super Admin Maestro' : 'Admin Plataforma'}
                  </Link>
                </>
              )}

              {/* === 2. STORE ADMIN & STORE STAFF NAVIGATION === */}
              {(role === 'store_admin' || role === 'store_staff') && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      pathname.startsWith('/dashboard')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {role === 'store_admin'
                        ? `Mi Panel ERP (${currentUser.store_name || 'Mi Tienda'})`
                        : `Panel Tienda (${currentUser.store_name || 'Tienda'})`}
                    </span>
                  </Link>

                  {currentUser.store_slug && (
                    <Link
                      href={`/tienda/${currentUser.store_slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Ver Mi Tienda Pública</span>
                    </Link>
                  )}
                </>
              )}

              {/* === 3. COMMON / REGULAR USER NAVIGATION === */}
              <Link
                href="/marketplace"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  pathname === '/marketplace'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Marketplace TCG</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                  Unificado
                </span>
              </Link>

              <Link
                href="/subastas"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  pathname.startsWith('/subastas')
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Gavel className="w-4 h-4 text-amber-500" />
                <span>Subastas</span>
              </Link>

              <Link
                href="/carpetas"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  pathname === '/carpetas'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <FolderArchive className="w-4 h-4 text-indigo-500" />
                <span>Carpetas Comunitarias</span>
              </Link>

              {/* Dedicated Panel: Mi Carpeta Digital */}
              {role === 'regular_user' && (
                <Link
                  href="/mi-carpeta"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    pathname === '/mi-carpeta'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <FolderArchive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Mi Carpeta Digital</span>
                </Link>
              )}

              {/* Onboarding button for regular users to open a store */}
              {role === 'regular_user' && (
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer flex items-center gap-1.5 ml-1"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>¿Tienes una tienda? Abrir Tienda</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls: Notifications, Role Switcher, Auth Button, Theme Toggle */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Universal Notification Center Tray */}
            <NotificationCenter currentUser={currentUser} />

            {/* Auth / Account Management Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Iniciar sesión o Registrarse con Google/Email"
            >
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="truncate max-w-[110px]">
                {currentUser.alias || currentUser.name.split(' ')[0]}
              </span>
            </button>

            {/* Role Switcher Demo Tool */}
            <RoleSwitcher />

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-semibold"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Noche'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            {/* Role-Specific Primary Action */}
            {role === 'regular_user' ? (
              <Link
                href="/mi-carpeta"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                Mi Carpeta
              </Link>
            ) : role === 'store_admin' ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5" />
                Mi Panel ERP
              </Link>
            ) : role === 'store_staff' ? (
              <Link
                href="/dashboard?tab=pos"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5" />
                Caja / POS
              </Link>
            ) : (
              <Link
                href="/admin"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Admin
              </Link>
            )}
          </div>

          {/* Mobile & Tablet Controls Bar */}
          <div className="flex lg:hidden items-center gap-2">
            <NotificationCenter currentUser={currentUser} />
            <RoleSwitcher />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 animate-fade-in shadow-xl">
            {/* SUPER ADMIN MOBILE LINKS */}
            {(role === 'superadmin' || role === 'admin') && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Panel ERP / POS de Tienda
                </Link>
                <div className="p-2 text-xs font-bold text-slate-400 uppercase">Tiendas Piloto:</div>
                {tenants.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tienda/${t.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2 pl-4 rounded-lg text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span>{t.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                ))}
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Panel Admin Maestro
                </Link>
              </>
            )}

            {/* STORE ADMIN & STAFF MOBILE LINKS */}
            {(role === 'store_admin' || role === 'store_staff') && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Panel ERP ({currentUser.store_name || 'Mi Tienda'})
                </Link>
                {currentUser.store_slug && (
                  <Link
                    href={`/tienda/${currentUser.store_slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Ver Mi Tienda Pública</span>
                    </div>
                  </Link>
                )}
              </>
            )}

            {/* REGULAR USER & ALL ROLES MARKETPLACE LINKS */}
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Marketplace TCG Unificado</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                Vitrina & Tiendas
              </span>
            </Link>

            <Link
              href="/subastas"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Gavel className="w-4 h-4 text-amber-500" />
              Subastas en Vivo
            </Link>

            <Link
              href="/carpetas"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <FolderArchive className="w-4 h-4 text-indigo-500" />
              Carpetas Virtuales Comunitarias
            </Link>

            {role === 'regular_user' && (
              <>
                <Link
                  href="/mi-carpeta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-slate-900 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Mi Carpeta Digital
                </Link>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsRegisterModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    ¿Tienes una tienda? Abrir Mi Tienda
                  </button>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                Mi Cuenta / Iniciar Sesión con Google
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal for Store Registration */}
      <RegisterStoreModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Auth Modal for Google and Email Authentication */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(u) => {
          setCurrentUser(u);
          dataStore.setCurrentUserId(u.id);
        }}
      />
    </>
  );
}

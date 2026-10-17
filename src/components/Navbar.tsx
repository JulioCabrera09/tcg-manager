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
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Tenant } from '@/types/database';
import { useTheme } from '@/context/ThemeContext';
import SupabaseConnectionBadge from '@/components/SupabaseConnectionBadge';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [storesDropdownOpen, setStoresDropdownOpen] = useState(false);

  useEffect(() => {
    setTenants(dataStore.getTenants());
  }, [pathname]);

  const isStorefront = pathname.startsWith('/tienda/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - Solid Colors, No Gradients */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm transition">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                TCG<span className="text-blue-600 dark:text-blue-400">Ecosystem</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider block -mt-1">
                ERP • POS • SUBASTAS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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
              Super Admin
            </Link>

            <Link
              href="/marketplace"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                pathname.startsWith('/marketplace') || pathname.startsWith('/carpetas') || pathname.startsWith('/subastas')
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
          </nav>
        </div>

        {/* Right Controls: Theme Toggle & Primary Action */}
        <div className="hidden md:flex items-center gap-3">
          <SupabaseConnectionBadge />

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Noche'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600" />
                <span>Modo Noche</span>
              </>
            )}
          </button>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            Entrar al ERP de Tienda
          </Link>
        </div>

        {/* Mobile menu and Theme toggle for Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <SupabaseConnectionBadge />
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 animate-fade-in">
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
            Super Admin Maestro
          </Link>
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
              Carpetas & Subastas
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}

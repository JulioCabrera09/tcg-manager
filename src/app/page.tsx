'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  Layers,
  Barcode,
  Gavel,
  ShieldCheck,
  Trophy,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Terminal,
  Database,
  Users,
  CreditCard,
  UtensilsCrossed,
  Check,
  AlertCircle,
  PlusCircle,
  Globe,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Tenant, UserProfile } from '@/types/database';
import Footer from '@/components/Footer';
import RegisterStoreModal from '@/components/RegisterStoreModal';

export default function HomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Anti-Troll interactive demo simulation state
  const [auctionDemoState, setAuctionDemoState] = useState<
    'active' | 'winner_ghosted' | 'reassigned_runnerup' | 'restarted'
  >('active');

  useEffect(() => {
    const handleUserChanged = () => {
      setCurrentUser(dataStore.getCurrentUser());
      setTenants(dataStore.getTenants());
    };

    setTenants(dataStore.getTenants());
    setCurrentUser(dataStore.getCurrentUser());

    window.addEventListener('tcg_user_changed', handleUserChanged);
    return () => window.removeEventListener('tcg_user_changed', handleUserChanged);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Hero Section - Solid, Clean, No Gradients */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 animate-fade-in shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Ecosistema Digital TCG • Marketplace & SaaS Multi-Tenant
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            La plataforma definitiva para{' '}
            <span className="text-blue-600 dark:text-blue-400">
              Tiendas de TCG y Subastas de Cartas
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-5 leading-relaxed">
            Punto de Venta con escáner de códigos de barras, catálogo universal con variaciones de cafetería, torneos, reservas contra entrega y un Marketplace con protección anti-trolls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            {/* Common / Regular User Hero CTAs */}
            {currentUser?.role === 'regular_user' ? (
              <>
                <Link
                  href="/marketplace"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Explorar Marketplace TCG
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  href="/subastas"
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gavel className="w-4 h-4 text-amber-500" />
                  Ver Subastas Activas
                </Link>

                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  ¿Tienes una tienda? Abrir Tienda
                </button>
              </>
            ) : currentUser?.role === 'store_admin' ? (
              /* Store Admin Hero CTAs */
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Store className="w-4 h-4" />
                  Ir a Mi Panel de Tienda ({currentUser.store_name || 'Mi Tienda'})
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>

                {currentUser.store_slug && (
                  <Link
                    href={`/tienda/${currentUser.store_slug}`}
                    target="_blank"
                    className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Ver Mi Tienda Pública
                  </Link>
                )}

                <Link
                  href="/marketplace"
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Marketplace TCG
                </Link>
              </>
            ) : (
              /* Super Admin Hero CTAs */
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Store className="w-4 h-4" />
                  Ingresar al ERP / POS de Tienda
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>

                <Link
                  href="/admin"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Panel Super Admin Maestro
                </Link>

                <Link
                  href="/marketplace"
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Marketplace TCG
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pilot Storefronts Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              Tiendas Piloto Conectadas
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Storefronts Públicos Generados Automáticamente
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Cada tienda suscrita al SaaS obtiene su propia web pública con catálogo, reservas con pago en sucursal y registro a torneos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-13 h-13 rounded-xl p-0.5 flex-shrink-0"
                      style={{ backgroundColor: t.theme_color || '#2563EB' }}
                    >
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-950 rounded-[10px] overflow-hidden flex items-center justify-center">
                        {t.logo_url ? (
                          <Image
                            src={t.logo_url}
                            alt={t.name}
                            width={52}
                            height={52}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-slate-700 dark:text-white" />
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {t.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        /tienda/{t.slug}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Online
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {t.description || t.tagline}
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Reservas Contra Entrega
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 font-medium">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    Torneos Semanales
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 font-medium">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Cafetería & Singles
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href={`/tienda/${t.slug}`}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                >
                  Visitar Tienda Pública
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                {/* Role-Aware ERP action on card */}
                {currentUser?.role === 'superadmin' ? (
                  <Link
                    href="/dashboard"
                    onClick={() => dataStore.setActiveTenantId(t.id)}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Auditar en ERP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : currentUser?.role === 'store_admin' && currentUser.tenant_id === t.id ? (
                  <Link
                    href="/dashboard"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Gestionar Mi Tienda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {t.slug}.localhost:3000
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace & Anti-Troll Section */}
      <section id="marketplace" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Módulo Marketplace de Subastas (C2C)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Sistema de Subastas con Prevención de Trolls
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              En plataformas de subastas tradicionales, cuando un usuario gana y no responde o se arrepiente, el vendedor pierde tiempo y oportunidades. Nuestro motor de intermediación permite transferir la victoria al postor anterior o reiniciar con un solo clic.
            </p>
          </div>

          {/* Interactive Anti-Troll Demo Card */}
          <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold block">
                  Simulador de Subasta en Vivo
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Black Lotus (Edición Beta) - Condición NM
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuctionDemoState('active')}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  Reiniciar Simulación
                </button>
              </div>
            </div>

            {/* Bids Log Simulation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bidder 1 (Winner / Troll) */}
              <div
                className={`p-4 rounded-xl border transition ${
                  auctionDemoState === 'active'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600'
                    : auctionDemoState === 'winner_ghosted'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Usuario &quot;TrollGamer99&quot;</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">$100 USD</span>
                </div>
                <div className="mt-2 text-[11px]">
                  {auctionDemoState === 'active' && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">Oferta más alta actual (Ganador)</span>
                  )}
                  {auctionDemoState === 'winner_ghosted' && (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      No responde tras 24h
                    </span>
                  )}
                  {(auctionDemoState === 'reassigned_runnerup' || auctionDemoState === 'restarted') && (
                    <span className="text-slate-400 dark:text-slate-500 line-through">Descalificado por falta de respuesta</span>
                  )}
                </div>
              </div>

              {/* Bidder 2 (Subcampeón) */}
              <div
                className={`p-4 rounded-xl border transition ${
                  auctionDemoState === 'reassigned_runnerup'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Usuario &quot;ColeccionistaReal&quot;</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">$90 USD</span>
                </div>
                <div className="mt-2 text-[11px]">
                  {auctionDemoState === 'reassigned_runnerup' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ¡Nuevo Ganador Asignado!
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Postor anterior (Subcampeón)</span>
                  )}
                </div>
              </div>

              {/* Bidder 3 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Usuario &quot;ManaVault&quot;</span>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">$80 USD</span>
                </div>
                <span className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 block">Tercera oferta</span>
              </div>
            </div>

            {/* Seller Action Control Bar */}
            <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Panel de Resolución del Vendedor:
              </span>

              {auctionDemoState === 'active' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    La subasta finalizó con &quot;TrollGamer99&quot; como ganador por $100 USD.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuctionDemoState('winner_ghosted')}
                    className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Simular: Comprador no responde
                  </button>
                </div>
              )}

              {auctionDemoState === 'winner_ghosted' && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    El comprador ganador no ha concretado la compra. Como vendedor, tienes el control de cómo proceder:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAuctionDemoState('reassigned_runnerup')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Asignar Victoria al Subcampeón ($90 USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuctionDemoState('restarted')}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reiniciar Subasta desde Cero
                    </button>
                  </div>
                </div>
              )}

              {auctionDemoState === 'reassigned_runnerup' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    Se notificó a <strong>&quot;ColeccionistaReal&quot;</strong> por $90 USD y se abrió el chat directo para coordinar entrega.
                  </span>
                  <span className="font-mono font-bold shrink-0">Chat Listo</span>
                </div>
              )}

              {auctionDemoState === 'restarted' && (
                <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 animate-fade-in flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  La subasta ha sido reiniciada y se documentó en la reputación del postor anterior que la transacción no se concretó.
                </div>
              )}
            </div>

            {/* Direct CTA to Subastas */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Pujas en vivo, cartas de colección y chat de coordinación seguro.
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/subastas"
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Gavel className="w-4 h-4" />
                  Ver Todas las Subastas Activas
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/subastas/nueva"
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Publicar Carta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supabase & Getting Started Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Guía de Conexión a Supabase
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                El sistema actualmente corre con almacenamiento interactivo reactivo local. Para conectar tu Supabase real:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold block">1. Ejecutar Schema SQL</span>
              <p className="text-slate-600 dark:text-slate-400">
                Copia el script creado en <code className="text-slate-900 dark:text-slate-200 font-mono">supabase/schema.sql</code> y ejecútalo en el SQL Editor de tu dashboard de Supabase.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold block">2. Configurar .env.local</span>
              <p className="text-slate-600 dark:text-slate-400">
                Pega tus credenciales en el archivo <code className="text-slate-900 dark:text-slate-200 font-mono">.env.local</code> basándote en <code className="text-slate-900 dark:text-slate-200 font-mono">.env.example</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold block">3. Despliegue en Vercel</span>
              <p className="text-slate-600 dark:text-slate-400">
                Conecta tu repositorio de GitHub a Vercel con las mismas variables de entorno y estará en vivo para tus tiendas piloto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Legal Terms & Privacy Notice */}
      <Footer variant="landing" />

      <RegisterStoreModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}

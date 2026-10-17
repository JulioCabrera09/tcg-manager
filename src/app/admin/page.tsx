'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Barcode,
  Layers,
  AlertTriangle,
  Plus,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  Database,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Tenant, GlobalProduct } from '@/types/database';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [globals, setGlobals] = useState<GlobalProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'tenants' | 'global_catalog'>('tenants');

  // New Tenant Modal
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: '',
    tagline: '',
    phone: '',
    address: '',
    theme_color: '#2563EB',
    storage_limit_items: 500,
  });

  // New Global Barcode Modal
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [newGlobal, setNewGlobal] = useState({
    barcode: '',
    name: '',
    category: 'tcg_sealed' as GlobalProduct['category'],
    tcg_game: 'Pokemon' as GlobalProduct['tcg_game'],
    suggested_price: 110,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTenants(dataStore.getTenants());
    setGlobals(dataStore.getGlobalProducts());
  };

  const handleToggleTenantStatus = (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      newStatus === 'suspended'
        ? `¿Deseas suspender a "${tenant.name}" por falta de pago? Su storefront y ERP quedarán bloqueados.`
        : `¿Reactivar suscripción para "${tenant.name}"?`;

    if (confirm(confirmMsg)) {
      dataStore.updateTenant({ id: tenant.id, status: newStatus });
      loadData();
    }
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug) return;

    dataStore.addTenant({
      name: newTenant.name,
      slug: newTenant.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      tagline: newTenant.tagline,
      phone: newTenant.phone,
      address: newTenant.address,
      theme_color: newTenant.theme_color,
      is_hiring: false,
      status: 'active',
      storage_limit_items: Number(newTenant.storage_limit_items) || 500,
    });

    setIsTenantModalOpen(false);
    setNewTenant({
      name: '',
      slug: '',
      tagline: '',
      phone: '',
      address: '',
      theme_color: '#2563EB',
      storage_limit_items: 500,
    });
    loadData();
  };

  const handleSaveGlobalProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobal.barcode || !newGlobal.name) return;

    dataStore.addGlobalProduct({
      barcode: newGlobal.barcode,
      name: newGlobal.name,
      category: newGlobal.category,
      tcg_game: newGlobal.tcg_game,
      suggested_price: Number(newGlobal.suggested_price) || 0,
      description: newGlobal.description,
    });

    setIsGlobalModalOpen(false);
    setNewGlobal({
      barcode: '',
      name: '',
      category: 'tcg_sealed',
      tcg_game: 'Pokemon',
      suggested_price: 110,
      description: '',
    });
    loadData();
  };

  const totalActiveTenants = tenants.filter((t) => t.status === 'active').length;
  const totalSuspendedTenants = tenants.filter((t) => t.status === 'suspended').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Super Admin Header - Solid Colors */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 dark:text-white">Panel Maestro (Super Admin)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  Control SaaS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de tiendas suscritas, facturación y catálogo maestro universal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Ver ERP de Tienda
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tiendas Activas
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalActiveTenants}</span>
              <Store className="w-5 h-5 text-emerald-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Servicio ininterrumpido</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tiendas Suspendidas
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalSuspendedTenants}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Bloqueadas por falta de pago</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Códigos Globales
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{globals.length}</span>
              <Barcode className="w-5 h-5 text-blue-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Compartidos en toda la plataforma</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Plan / Servidor
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-black text-slate-900 dark:text-white">Tier Gratuito</span>
              <Database className="w-5 h-5 text-blue-500/40" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">2 a 4 tiendas piloto soportadas</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'tenants'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            Gestión de Tiendas Clientes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('global_catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'global_catalog'
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4" />
            Catálogo Global Maestro
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* TAB: TENANTS */}
        {activeTab === 'tenants' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tiendas Suscritas (Tenants)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control de altas, bajas, cuotas de productos y estados de servicio
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTenantModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nueva Tienda
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Tienda</th>
                    <th className="px-4 py-3">Slug URL</th>
                    <th className="px-4 py-3">Estado Suscripción</th>
                    <th className="px-4 py-3">Límite Items</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3 text-right">Acción Suscripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: t.theme_color || '#2563EB' }}
                          />
                          <span>{t.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        <Link
                          href={`/tienda/${t.slug}`}
                          target="_blank"
                          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                        >
                          /{t.slug}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            t.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {t.status === 'active' ? 'ACTIVA / AL DÍA' : 'SUSPENDIDA (MOROSA)'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {t.storage_limit_items} max
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.phone || 'N/A'}</td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleTenantStatus(t)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            t.status === 'active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {t.status === 'active' ? 'Bloquear Acceso' : 'Reactivar Tienda'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: GLOBAL CATALOG */}
        {activeTab === 'global_catalog' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Catálogo Maestro Universal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Códigos de barra universales compartidos para que cualquier tienda los escanee y registre en 1 clic
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registrar Código Global
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Código de Barras</th>
                    <th className="px-4 py-3">Nombre del Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Juego TCG</th>
                    <th className="px-4 py-3">Precio Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {globals.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{g.barcode}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{g.name}</td>
                      <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                        {g.category.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{g.tcg_game || 'N/A'}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        ${g.suggested_price?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* New Tenant Modal */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Dar de Alta Nueva Tienda</h3>
              <button
                type="button"
                onClick={() => setIsTenantModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Nombre de la Tienda *</label>
                <input
                  type="text"
                  required
                  value={newTenant.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    setNewTenant({ ...newTenant, name, slug });
                  }}
                  placeholder="Ej. Pokemart Express"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Slug URL *</label>
                <input
                  type="text"
                  required
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                  placeholder="pokemart-express"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Eslogan</label>
                <input
                  type="text"
                  value={newTenant.tagline}
                  onChange={(e) => setNewTenant({ ...newTenant, tagline: e.target.value })}
                  placeholder="Tu tienda favorita de cartas coleccionables"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  placeholder="+52 55 0000 0000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Límite de Catálogo</label>
                <input
                  type="number"
                  value={newTenant.storage_limit_items}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, storage_limit_items: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Crear Tienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Global Barcode Modal */}
      {isGlobalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registrar Código Global Maestro</h3>
              <button
                type="button"
                onClick={() => setIsGlobalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGlobalProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Código de Barras (EAN / UPC / SKU) *</label>
                <input
                  type="text"
                  required
                  value={newGlobal.barcode}
                  onChange={(e) => setNewGlobal({ ...newGlobal, barcode: e.target.value })}
                  placeholder="Ej. 7501055312345"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={newGlobal.name}
                  onChange={(e) => setNewGlobal({ ...newGlobal, name: e.target.value })}
                  placeholder="Ej. Sobre Sellado Pokémon"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={newGlobal.category}
                    onChange={(e) =>
                      setNewGlobal({
                        ...newGlobal,
                        category: e.target.value as GlobalProduct['category'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="tcg_sealed">Sobre / Sellado</option>
                    <option value="accessory">Accesorio</option>
                    <option value="beverage">Bebida</option>
                    <option value="snack">Botana / Alimento</option>
                    <option value="tcg_single">Carta Individual</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Precio Sugerido ($)</label>
                  <input
                    type="number"
                    value={newGlobal.suggested_price}
                    onChange={(e) =>
                      setNewGlobal({ ...newGlobal, suggested_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGlobalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar en Catálogo Global
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

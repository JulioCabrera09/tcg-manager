'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderArchive,
  Plus,
  Search,
  Filter,
  Store,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Globe,
  CheckCircle2,
  Receipt,
  UserCheck,
  MapPin,
  Sparkles,
  Gavel,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { VirtualBinder, BinderCard, CardLanguage, UserProfile } from '@/types/database';
import AddCardModal from '@/components/AddCardModal';
import OfferNegotiationModal from '@/components/OfferNegotiationModal';

export default function CarpetasMarketplacePage() {
  const [binders, setBinders] = useState<VirtualBinder[]>([]);
  const [cards, setCards] = useState<BinderCard[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Filters
  const [selectedBinderTab, setSelectedBinderTab] = useState<'ALL' | 'STORES' | 'PLAYERS'>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [negotiatingCard, setNegotiatingCard] = useState<BinderCard | null>(null);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

  useEffect(() => {
    loadData();
    const handleUserChanged = () => {
      loadData();
    };
    window.addEventListener('tcg_user_changed', handleUserChanged);
    return () => window.removeEventListener('tcg_user_changed', handleUserChanged);
  }, []);

  const loadData = () => {
    setBinders(dataStore.getBinders());
    setCards(dataStore.getBinderCards());
    setCurrentUser(dataStore.getCurrentUser());
  };

  const handleOpenNegotiate = (card: BinderCard) => {
    setNegotiatingCard(card);
    setIsNegotiationOpen(true);
  };

  // Filtered Cards
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.name_es.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.user_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = selectedLanguage === 'ALL' || card.language === selectedLanguage;

    const matchesTab =
      selectedBinderTab === 'ALL' ||
      (selectedBinderTab === 'STORES' && card.is_store) ||
      (selectedBinderTab === 'PLAYERS' && !card.is_store);

    return matchesSearch && matchesLanguage && matchesTab;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Banner / Marketplace Header */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <FolderArchive className="w-3.5 h-3.5" />
                Carpetas Virtuales y Vitrinas Digitales de Cartas
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Vitrinas de Coleccionistas y Tiendas Oficiales
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                Explora cartas de jugadores y tiendas verificadas. Imágenes oficiales traídas por API, reconocimiento automático de códigos en cualquier idioma, recomendaciones de precios de mercado y chat de negociación con confirmación bilateral.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/carpetas/ventas"
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Control de Mis Ventas</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsAddCardModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Carta a Carpeta</span>
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white mr-1">
                  API Oficial & Reconocimiento de Códigos:
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  Ingresa cualquier código (ej. <strong>LOB-S005</strong> en español, <strong>RA01-EN005</strong> en inglés o <strong>1101-JP001</strong> en japonés). El sistema lo detecta, extrae la imagen oficial y te muestra el rango de precios en Cardmarket y TCGPlayer.
                </span>
              </div>
            </div>

            <Link
              href="/subastas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline flex-shrink-0"
            >
              <Gavel className="w-4 h-4" />
              <span>Ver también Subastas C2C</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Search & Tabs Navigation */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedBinderTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedBinderTab === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todas las Cartas ({cards.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedBinderTab('STORES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedBinderTab === 'STORES'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Tiendas Oficiales
            </button>
            <button
              type="button"
              onClick={() => setSelectedBinderTab('PLAYERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedBinderTab === 'PLAYERS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Coleccionistas
            </button>
          </div>

          {/* Search and Language Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por carta, código o vendedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Cualquier Idioma</option>
              <option value="ES">Español (ES)</option>
              <option value="EN">Inglés (EN)</option>
              <option value="JA">Japonés (JA)</option>
              <option value="IT">Italiano (IT)</option>
              <option value="DE">Alemán (DE)</option>
              <option value="FR">Francés (FR)</option>
            </select>

            <button
              type="button"
              onClick={loadData}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Refrescar vitrinas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cards Vitrina Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map((card) => {
            const isSoldOut = card.copies_count <= 0 || card.status === 'sold_out';

            return (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition flex flex-col justify-between group"
              >
                {/* Official Card Image from API */}
                <div className="relative aspect-3/4 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                  <Image
                    src={card.image_url}
                    alt={card.name_en}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-600 text-white shadow-xs">
                      {card.card_code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white border border-white/20">
                      Idioma: {card.language}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950">
                      {card.rarity}
                    </span>
                  </div>

                  {/* Stock Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isSoldOut ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                        Agotada / Vendida
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                        {card.copies_count} disponible{card.copies_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Data & Pricing */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold truncate">{card.expansion}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {card.condition}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {card.name_es}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                      EN: {card.name_en}
                    </span>
                  </div>

                  {/* Price Block with Recommendation */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Precio de Venta
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        ${card.sale_price.toLocaleString('es-MX')}
                        <span className="text-xs font-bold text-slate-400 ml-1">MXN</span>
                      </span>
                    </div>

                    {card.recommended_price_mxn && (
                      <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold border-t border-slate-200 dark:border-slate-800/60 pt-1">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Recomendación de mercado:
                        </span>
                        <span>~${card.recommended_price_mxn} MXN</span>
                      </div>
                    )}
                  </div>

                  {/* Seller Identifier */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {card.is_store ? (
                        <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {card.user_name}
                      </span>
                    </div>

                    {card.is_store && card.store_slug ? (
                      <Link
                        href={`/tienda/${card.store_slug}`}
                        target="_blank"
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 flex-shrink-0"
                      >
                        <span>Landing</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    ) : (
                      <span className="text-[10px] text-slate-400 truncate">
                        {card.user_location?.split(' ')[0] || 'CDMX'}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => handleOpenNegotiate(card)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isSoldOut ? 'Agotada' : 'Hacer Oferta / Negociar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCards.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <FolderArchive className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No se encontraron cartas en las vitrinas
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta con otro término de búsqueda o añade una nueva carta a tu carpeta virtual.
            </p>
          </div>
        )}
      </main>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onCardAdded={loadData}
        binders={binders}
      />

      {/* Offer & Bilateral Negotiation Modal */}
      <OfferNegotiationModal
        isOpen={isNegotiationOpen}
        onClose={() => {
          setIsNegotiationOpen(false);
          setNegotiatingCard(null);
        }}
        card={negotiatingCard}
        onTransactionUpdated={loadData}
      />
    </div>
  );
}

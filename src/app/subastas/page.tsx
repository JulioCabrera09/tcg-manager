'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gavel,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  MapPin,
  Sparkles,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Auction, TCGGame, CardCondition } from '@/types/database';

export default function SubastasMarketplacePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = () => {
    setAuctions(dataStore.getAuctions());
  };

  const calculateTimeLeft = (endsAt: string, status: Auction['status']) => {
    if (status !== 'active') return 'Finalizada';
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Por cerrar';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h restantes`;
    }
    return `${hours}h ${minutes}m restantes`;
  };

  const filteredAuctions = auctions.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.card_set && a.card_set.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGame = selectedGame === 'ALL' || a.tcg_game === selectedGame;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'active' && a.status === 'active') ||
      (selectedStatus === 'ended' && a.status === 'ended');

    return matchesSearch && matchesGame && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Banner / Marketplace Header */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Gavel className="w-3.5 h-3.5" />
                Marketplace C2C Intermediario • Sin comisiones abusivas
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Subastas de Cartas TCG
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Puja por cartas raras directamente de coleccionistas. Transacciones coordinadas por chat interno con protección activa contra postores fantasmas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/subastas/nueva"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                Publicar Subasta
              </Link>
            </div>
          </div>

          {/* Anti-Troll Explanation Callout */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block sm:inline mr-1">
                  Mecanismo Anti-Trolls Activo:
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  El ganador tiene un plazo de 24 horas para contactar al vendedor. Si no responde, la victoria se transfiere inmediatamente al 2º postor más alto y se sanciona la cuenta del infractor.
                </span>
              </div>
            </div>
            <Link
              href="/subastas/auc-004"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline flex-shrink-0 cursor-pointer"
            >
              <span>Ver caso de prueba en vivo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por carta, set o vendedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los Juegos TCG</option>
              <option value="Pokemon">Pokémon</option>
              <option value="Magic">Magic: The Gathering</option>
              <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
              <option value="One Piece">One Piece</option>
              <option value="Lorcana">Disney Lorcana</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="active">Activas (Pujando)</option>
              <option value="ended">Finalizadas / Resolución</option>
            </select>

            <button
              type="button"
              onClick={loadAuctions}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
              title="Refrescar subastas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => {
            const timeLeft = calculateTimeLeft(auction.ends_at, auction.status);
            const isEnded = auction.status === 'ended';
            const totalBids = auction.bids ? auction.bids.length : 0;

            return (
              <div
                key={auction.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition flex flex-col justify-between group"
              >
                {/* Image and Badges */}
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <Image
                    src={auction.image_url}
                    alt={auction.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                      {auction.tcg_game}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs border border-white/20">
                      {auction.card_condition}
                    </span>
                    {auction.card_rarity && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950 shadow-xs">
                        {auction.card_rarity}
                      </span>
                    )}
                  </div>

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 right-3">
                    {isEnded ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900/90 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-xs">
                        <Clock className="w-3 h-3" />
                        Finalizada
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs backdrop-blur-xs">
                        <TrendingUp className="w-3 h-3" />
                        En Vivo
                      </span>
                    )}
                  </div>

                  {/* Dispute Alert Bar if transferred or reported */}
                  {auction.dispute_status === 'transferred_to_runner_up' && (
                    <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-white px-3 py-1 text-[10px] font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Victoria cedida al 2º postor
                    </div>
                  )}
                  {auction.dispute_status === 'troll_reported' && (
                    <div className="absolute bottom-0 inset-x-0 bg-red-600 text-white px-3 py-1 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Postor fantasma reportado (Strike)
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    {auction.card_set && (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                        {auction.card_set}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {auction.title}
                    </h3>
                  </div>

                  {/* Price & Bids Block */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {isEnded ? 'Precio Final' : 'Puja Actual'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {totalBids} {totalBids === 1 ? 'puja' : 'pujas'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        ${auction.current_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold text-slate-400 ml-1">MXN</span>
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{timeLeft}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {auction.seller_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                        {auction.seller_reputation_positive}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{auction.seller_location.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/subastas/${auction.id}`}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>{isEnded ? 'Ver Resolución / Sala' : 'Pujar en la Sala'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Gavel className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No se encontraron subastas
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay cartas que coincidan con tus filtros actuales. Prueba a buscar con otros términos o crea una nueva subasta.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

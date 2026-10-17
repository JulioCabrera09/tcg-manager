'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gavel,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  UserCheck,
  MapPin,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Send,
  UserX,
  RotateCcw,
  CheckCircle2,
  Package,
  CreditCard,
  Building,
  Info,
  Camera,
  ZoomIn,
  X,
  Loader2,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { Auction, AuctionBid, AuctionMessage, UserProfile } from '@/types/database';
import { useAuctionRealtime } from '@/lib/supabase/useRealtime';
import AuthModal from '@/components/AuthModal';

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [messages, setMessages] = useState<AuctionMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Bidding state
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bidError, setBidError] = useState<string>('');
  const [bidSuccess, setBidSuccess] = useState<string>('');

  // Chat state
  const [chatInput, setChatInput] = useState<string>('');
  const [chatPhoto, setChatPhoto] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Seller Action State
  const [actionNotice, setActionNotice] = useState<string>('');

  useEffect(() => {
    loadAuctionData();
  }, [resolvedParams.id]);

  // Realtime subscription via Supabase / BroadcastChannel
  useAuctionRealtime(resolvedParams.id, {
    onBid: (newBid) => {
      setAuction((prev) => {
        if (!prev) return null;
        if (prev.bids?.some((b) => b.id === newBid.id)) return prev;
        const updatedBids = prev.bids ? [...prev.bids, newBid] : [newBid];
        const nextMin = newBid.amount + (prev.min_increment || 50);
        setBidAmount(nextMin);
        return {
          ...prev,
          current_price: newBid.amount,
          bids: updatedBids,
        };
      });
    },
    onMessage: (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    },
    onAuctionUpdate: (updated) => {
      setAuction((prev) => (prev ? { ...prev, ...updated } : null));
    },
  });

  const loadAuctionData = () => {
    const data = dataStore.getAuctionById(resolvedParams.id);
    if (data) {
      setAuction(data);
      const minNext = data.current_price + (data.min_increment || 50);
      setBidAmount(minNext);
      setMessages(dataStore.getAuctionMessages(data.id));
    }
    setCurrentUser(dataStore.getCurrentUser());
  };

  if (!auction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-md">
          <Gavel className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subasta no encontrada</h2>
          <p className="text-xs text-slate-500">
            La subasta solicitada no existe o fue eliminada del sistema.
          </p>
          <Link
            href="/subastas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo de Subastas
          </Link>
        </div>
      </div>
    );
  }

  const isEnded = auction.status === 'ended';
  const minAllowedBid = auction.current_price + (auction.min_increment || 50);

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    if (!currentUser || currentUser.id === 'usr-guest') {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const bidderDisplayName = currentUser.alias
        ? `${currentUser.name} (@${currentUser.alias})`
        : currentUser.name;
      const updated = dataStore.placeBid(
        auction.id,
        bidAmount,
        bidderDisplayName,
        currentUser.id
      );
      setAuction(updated);
      setBidSuccess(`¡Tu puja de $${bidAmount} MXN ha sido registrada exitosamente!`);
      const nextMin = updated.current_price + (updated.min_increment || 50);
      setBidAmount(nextMin);
    } catch (err: any) {
      setBidError(err.message || 'Error al enviar puja');
    }
  };

  const handleQuickIncrement = (inc: number) => {
    setBidAmount(minAllowedBid + inc);
  };

  // Anti-Troll Action: Transfer to runner up
  const handleTransferToRunnerUp = () => {
    if (!auction.runner_up_name) {
      alert('No hay un segundo postor registrado en esta subasta.');
      return;
    }

    if (
      confirm(
        `¿Deseas transferir la victoria a ${auction.runner_up_name} por $${auction.runner_up_price} MXN debido a que el postor ganador no respondió en el plazo estipulado?`
      )
    ) {
      try {
        const updated = dataStore.transferVictoryToRunnerUp(auction.id);
        setAuction(updated);
        setMessages(dataStore.getAuctionMessages(auction.id));
        setActionNotice(`¡Victoria transferida exitosamente a ${updated.winner_name}! Se le ha abierto el plazo de 24h.`);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Anti-Troll Action: Report ghost bidder
  const handleReportTroll = () => {
    if (!auction.winner_name) return;

    const reason = prompt(
      `Motivo del reporte contra ${auction.winner_name}:`,
      'Postor ganador no responde a mensajes ni concreta el pago tras vencer el plazo de 24 horas.'
    );

    if (reason) {
      try {
        const { auction: updated, reportedUser } = dataStore.reportTrollWinner(auction.id, reason);
        setAuction(updated);
        setMessages(dataStore.getAuctionMessages(auction.id));
        setActionNotice(
          `Reporte ejecutado. El postor ${reportedUser.name} ahora tiene ${reportedUser.strikes}/3 strikes.${
            reportedUser.is_banned ? ' ¡Cuenta suspendida!' : ''
          }`
        );
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se admiten archivos de imagen (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/webp', 0.82);
          setChatPhoto(compressed);
        }
        setIsUploadingPhoto(false);
      };
      img.onerror = () => setIsUploadingPhoto(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsUploadingPhoto(false);
    reader.readAsDataURL(file);
  };

  // Chat message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatPhoto) return;

    const isSeller = currentUser ? currentUser.id === auction.seller_id : false;
    dataStore.sendAuctionMessage(
      auction.id,
      currentUser ? currentUser.name : 'Coleccionista',
      isSeller,
      chatInput.trim() || (chatPhoto ? 'Foto adjunta (comprobante / carta / sucursal)' : ''),
      false,
      chatPhoto || undefined
    );
    setChatInput('');
    setChatPhoto(null);
    setMessages(dataStore.getAuctionMessages(auction.id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Breadcrumb & Status Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/subastas"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Subastas</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">ID: {auction.id}</span>
            {isEnded ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Subasta Finalizada
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Puja Activa en Vivo
              </span>
            )}
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 text-center animate-fade-in flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice('')}
            className="ml-2 text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Card Details & Live Bidding / Resolution */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image & Card Data (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="relative aspect-3/4 w-full bg-slate-950">
              <Image
                src={auction.image_url}
                alt={auction.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain p-4"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs">
                  {auction.tcg_game}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/90 text-white border border-white/20">
                  Condición: {auction.card_condition}
                </span>
                {auction.card_rarity && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow-xs">
                    {auction.card_rarity}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {auction.card_set || 'Edición Oficial Coleccionable'}
                </span>
                <h1 className="text-xl font-black text-slate-900 dark:text-white mt-1 leading-tight">
                  {auction.title}
                </h1>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {auction.description}
              </p>

              {/* Seller Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Vendedor Verificado
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {auction.seller_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {auction.seller_name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {auction.seller_trades_count} transacciones realizadas
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    {auction.seller_reputation_positive}% Positivo
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{auction.seller_location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Engine & Anti-Troll Mechanism & Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Price / Clock Status Hero */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEnded ? 'Precio de Adjudicación' : 'Puja Más Alta Actual'}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
                  ${auction.current_price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  <span className="text-sm font-bold text-slate-400 ml-1.5">MXN</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Incremento Mínimo
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                    +${auction.min_increment} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* IF ENDED: Anti-Troll Winner & Runner-up Resolution Card */}
            {isEnded ? (
              <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Resolución de Venta y Protección Anti-Troll
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        El vendedor cuenta con facultades de reasignación en caso de que el ganador no concrete.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Winner & Runner Up comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Postor Ganador
                      </span>
                      {auction.winner_strikes !== undefined && auction.winner_strikes > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400">
                          {auction.winner_strikes} Strikes
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {auction.winner_name || 'Sin postor'}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                      ${auction.current_price.toLocaleString('es-MX')} MXN
                    </span>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold pt-1">
                      Plazo máximo de respuesta: 24h
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                      2º Postor Más Alto (Runner-up)
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {auction.runner_up_name || 'N/A'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">
                      ${auction.runner_up_price?.toLocaleString('es-MX')} MXN
                    </span>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Candidato directo a heredar la victoria sin reiniciar la subasta.
                    </p>
                  </div>
                </div>

                {/* Seller Actions for dispute */}
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleTransferToRunnerUp}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Ceder Victoria al 2º Postor
                  </button>

                  <button
                    type="button"
                    onClick={handleReportTroll}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    Reportar Ganador Fantasma (+1 Strike)
                  </button>
                </div>
              </div>
            ) : (
              /* IF ACTIVE: Live Bidding Form */
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Ingresar Monto de Puja:</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      Mínimo permitido: <strong className="text-slate-900 dark:text-white font-mono">${minAllowedBid} MXN</strong>
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={minAllowedBid}
                        step={auction.min_increment || 50}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 flex-shrink-0"
                    >
                      <Gavel className="w-4 h-4" />
                      Pujar Ahora
                    </button>
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Incrementos rápidos:</span>
                  {[50, 100, 250, 500].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleQuickIncrement(inc)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer font-mono"
                    >
                      +${inc}
                    </button>
                  ))}
                </div>

                {bidError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{bidError}</span>
                  </div>
                )}

                {bidSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{bidSuccess}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Bids History Log */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Historial de Pujas Registradas
              </h4>
              <span className="text-[11px] text-slate-400">
                {auction.bids?.length || 0} pujas en total
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-52 overflow-y-auto pr-1">
              {auction.bids && auction.bids.length > 0 ? (
                [...auction.bids].reverse().map((bid, idx) => (
                  <div key={bid.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          idx === 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {bid.bidder_name}
                      </span>
                      {bid.bidder_strikes > 0 && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-mono">
                          {bid.bidder_strikes} strike{bid.bidder_strikes > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-[10px] font-mono">
                        {new Date(bid.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ${bid.amount.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  Aún no hay pujas para esta carta. ¡Sé el primer postor!
                </div>
              )}
            </div>
          </div>

          {/* Coordination Chat: Internal negotiation for payment & shipping */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Chat de Coordinación (Comprador - Vendedor)
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Canal Seguro C2C
              </span>
            </div>

            {/* Auto-purge 48h security notice */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Protección de Datos & Optimización de Almacenamiento:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Puedes enviar fotos de comprobantes bancarios, cartas o sucursal. Por política del sistema, las imágenes se <strong>eliminarán automáticamente 48 horas (2 días) después</strong> de que la compra se marque como completada.
                </span>
              </div>
            </div>

            {/* Chat Messages Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 min-h-48 max-h-72 overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs space-y-1.5 ${
                    m.is_system
                      ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200'
                      : m.is_seller
                      ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 ml-4'
                      : 'bg-blue-600 text-white mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-75">
                    <span>{m.sender_name}</span>
                    <span>
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="leading-relaxed">{m.message}</p>

                  {/* Attached photo thumbnail */}
                  {m.image_url && !m.image_purged && (
                    <div className="mt-2">
                      <div
                        onClick={() => setZoomPhoto(m.image_url!)}
                        className="relative rounded-lg overflow-hidden border border-white/20 dark:border-slate-700 bg-slate-900 cursor-pointer max-w-[200px] aspect-4/3 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.image_url}
                          alt="Foto adjunta"
                          className="w-full h-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition gap-1">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Ampliar</span>
                        </div>
                      </div>
                      {m.expires_at && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Expira 48h post-cierre</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purged photo notice */}
                  {m.image_purged && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] flex items-center gap-1.5 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      <span>Foto eliminada automáticamente tras 48h de completada la compra para ahorrar espacio.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Photo preview before send */}
            {chatPhoto && (
              <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chatPhoto} alt="Previa" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white block">Foto adjunta lista</span>
                  <span>Se optimizó a WebP para carga ultra rápida.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatPhoto(null)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
                  title="Quitar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                title="Adjuntar foto (recibo, comprobante o carta)"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                placeholder="Escribe un mensaje o adjunta un comprobante..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Lightbox Modal for Photo Zoom */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-950 text-white text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                Comprobante / Detalle de Carta
              </span>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomPhoto}
                alt="Imagen ampliada"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-2.5 bg-slate-950 text-center text-[10px] text-slate-400 border-t border-slate-800">
              Esta imagen se eliminará automáticamente a las 48 horas de finalizarse la transacción.
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Unauthenticated Bidders */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserAuthenticated={(u: UserProfile) => {
          setCurrentUser(u);
          loadAuctionData();
        }}
      />
    </div>
  );
}

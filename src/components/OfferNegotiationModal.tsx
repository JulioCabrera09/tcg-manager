'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  UserCheck,
  Store,
  ExternalLink,
  MapPin,
  AlertTriangle,
  Receipt,
  Sparkles,
  ArrowRight,
  Camera,
  Paperclip,
  Eye,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { BinderCard, CardOffer, OfferMessage, UserProfile } from '@/types/database';
import { useOfferRealtime } from '@/lib/supabase/useRealtime';

interface OfferNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BinderCard | null;
  existingOfferId?: string;
  onTransactionUpdated: () => void;
}

export default function OfferNegotiationModal({
  isOpen,
  onClose,
  card,
  existingOfferId,
  onTransactionUpdated,
}: OfferNegotiationModalProps) {
  const [offer, setOffer] = useState<CardOffer | null>(null);
  const [messages, setMessages] = useState<OfferMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatPhoto, setChatPhoto] = useState<string | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // New offer form state (if not existing)
  const [offeredPrice, setOfferedPrice] = useState<number>(card?.sale_price || 0);
  const [copiesRequested, setCopiesRequested] = useState<number>(1);
  const [proposalNote, setProposalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supabase / Local Realtime subscription for incoming messages and status changes
  useOfferRealtime(offer?.id || '', {
    onMessage: (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    },
    onOfferUpdate: (updated) => {
      setOffer((prev) => (prev ? { ...prev, ...updated } : null));
      onTransactionUpdated();
    },
  });

  useEffect(() => {
    if (card) {
      setOfferedPrice(card.sale_price);
      setCopiesRequested(1);
    }

    const user = dataStore.getCurrentUser();
    setCurrentUser(user);

    if (existingOfferId) {
      loadOffer(existingOfferId);
    } else if (card) {
      // Check if there is already an existing offer for this card and buyer
      const allOffers = dataStore.getOffers();
      const match = allOffers.find(
        (o) => o.card_id === card.id && o.status !== 'cancelled'
      );
      if (match) {
        setOffer(match);
        setMessages(dataStore.getOfferMessages(match.id));
      } else {
        setOffer(null);
        setMessages([]);
      }
    }
  }, [card, existingOfferId]);

  const loadOffer = (id: string) => {
    const o = dataStore.getOfferById(id);
    if (o) {
      setOffer(o);
      setMessages(dataStore.getOfferMessages(o.id));
    }
  };

  if (!isOpen || !card) return null;

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const created = dataStore.createCardOffer({
        card_id: card.id,
        binder_id: card.binder_id,
        card_name: `${card.name_es} (${card.name_en})`,
        card_code: card.card_code,
        rarity: card.rarity,
        language: card.language,
        card_image_url: card.image_url,
        original_price: card.sale_price,
        offered_price: Number(offeredPrice),
        copies_requested: Number(copiesRequested),
        seller_id: card.user_id,
        seller_name: card.user_name,
        buyer_id: currentUser.id,
        buyer_name: currentUser.name,
        buyer_city: currentUser.city,
        buyer_reputation: 100,
        notes: proposalNote || undefined,
      });

      setOffer(created);
      setMessages(dataStore.getOfferMessages(created.id));
      onTransactionUpdated();
    } catch (err: any) {
      alert(err.message || 'Error al crear oferta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1000;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX) {
          h *= MAX / w;
          w = MAX;
        } else if (h > MAX) {
          w *= MAX / h;
          h = MAX;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const webp = canvas.toDataURL('image/webp', 0.82);
          setChatPhoto(webp);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatPhoto) || !offer || !currentUser) return;

    const isSeller = currentUser.id === offer.seller_id;
    dataStore.sendOfferMessage(
      offer.id,
      currentUser.name,
      isSeller,
      chatInput.trim() || 'Foto adjunta (Comprobante / Detalle de carta)',
      false,
      chatPhoto || undefined
    );

    setChatInput('');
    setChatPhoto(null);
    setMessages(dataStore.getOfferMessages(offer.id));
  };

  // Mutual Acceptance Action
  const handleAcceptTransaction = (asSeller: boolean) => {
    if (!offer) return;

    try {
      const { offer: updated, transactionCompleted } = dataStore.acceptOffer(
        offer.id,
        asSeller
      );
      setOffer(updated);
      setMessages(dataStore.getOfferMessages(offer.id));
      onTransactionUpdated();

      if (transactionCompleted) {
        alert(
          '¡Transacción completada! El inventario ha sido descontado y la venta quedó registrada en el control del vendedor.'
        );
      }
    } catch (err: any) {
      alert(err.message || 'Error al aceptar transacción');
    }
  };

  const isCompleted = offer?.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {offer ? 'Negociación y Transacción en Chat' : 'Ofertar o Comprar Carta'}
              </h2>
              <p className="text-xs text-slate-500">
                Acuerdo de pago y entrega externa con cierre de inventario por doble confirmación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Overview Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-22 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
              <Image
                src={card.image_url}
                alt={card.name_en}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono">
                  {card.card_code}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {card.language}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {card.rarity}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {card.name_es}{' '}
                <span className="text-xs font-normal text-slate-500">({card.name_en})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {card.expansion} • Condición: <strong>{card.condition}</strong> • Stock:{' '}
                <strong>{card.copies_count} copia(s)</strong>
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-6">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Precio Publicado
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              ${card.sale_price.toLocaleString('es-MX')} MXN
            </div>
            {card.recommended_price_mxn && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                Valor mercado: ~${card.recommended_price_mxn} MXN
              </span>
            )}
          </div>
        </div>

        {/* Seller Profile & Buyer Profile Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Seller */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vendedor
              </span>
              {card.is_store ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-bold flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  Tienda Oficial SaaS
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  Coleccionista
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {card.user_name}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {card.user_location || 'México'}
                </span>
              </div>
              {card.is_store && card.store_slug && (
                <Link
                  href={`/tienda/${card.store_slug}`}
                  target="_blank"
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Ver Landing</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Buyer */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Comprador (Tu Perfil)
            </span>
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {currentUser?.name || 'Coleccionista'}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentUser?.city || 'CDMX'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                100% Reputación
              </span>
            </div>
          </div>
        </div>

        {/* If no offer exists yet: Show Offer Proposal Form */}
        {!offer ? (
          <form onSubmit={handleCreateOffer} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ¿Cuánto ofreces por carta? (MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Precio original: ${card.sale_price} MXN
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Número de Copias Solicitadas:
                </label>
                <input
                  type="number"
                  min={1}
                  max={card.copies_count}
                  value={copiesRequested}
                  onChange={(e) => setCopiesRequested(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  Disponibles en vitrina: {card.copies_count}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mensaje inicial de propuesta / condiciones de entrega:
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Te ofrezco este precio para entrega en mano mañana en frikiplaza o te transfiero de inmediato..."
                value={proposalNote}
                onChange={(e) => setProposalNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Oferta y Abrir Chat</span>
              </button>
            </div>
          </form>
        ) : (
          /* Active Offer Negotiation & Mutual Transaction Closing */
          <div className="space-y-4">
            {/* Transaction Mutual Acceptance Status Card */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Estado de la Transacción
                  </span>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    Oferta de ${offer.offered_price.toLocaleString('es-MX')} MXN por{' '}
                    {offer.copies_requested} copia(s)
                  </div>
                </div>

                {isCompleted ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Transacción Cerrada con Éxito!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Buyer Acceptance Status */}
                    <div
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                        offer.buyer_accepted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Comprador: {offer.buyer_accepted ? 'Aceptado' : 'Pendiente'}</span>
                    </div>

                    {/* Seller Acceptance Status */}
                    <div
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                        offer.seller_accepted
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Vendedor: {offer.seller_accepted ? 'Aceptado' : 'Pendiente'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Mutual Acceptance */}
              {!isCompleted && (
                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Ambos deben pulsar <strong>&quot;Transacción Aceptada&quot;</strong> para que se descuente del inventario y se registre la venta.
                  </p>

                  <div className="flex gap-2">
                    {/* Buyer Action Button */}
                    <button
                      type="button"
                      disabled={offer.buyer_accepted}
                      onClick={() => handleAcceptTransaction(false)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{offer.buyer_accepted ? 'Comprador Aceptó' : 'Aceptar como Comprador'}</span>
                    </button>

                    {/* Seller Action Button */}
                    <button
                      type="button"
                      disabled={offer.seller_accepted}
                      onClick={() => handleAcceptTransaction(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{offer.seller_accepted ? 'Vendedor Aceptó' : 'Aceptar como Vendedor'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Negotiation Chat Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>Historial de Mensajes y Acuerdos</span>
                <span>Canal C2C</span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-48 max-h-60 overflow-y-auto space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      m.is_system
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
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

                    {m.image_url && (
                      <div className="my-1.5">
                        <img
                          src={m.image_url}
                          alt="Adjunto de carta/recibo"
                          onClick={() => setSelectedPhotoForZoom(m.image_url || null)}
                          className="max-h-40 rounded-xl object-contain cursor-pointer hover:opacity-90 border border-black/10 transition shadow-xs"
                        />
                        <span className="text-[9px] block mt-0.5 opacity-75 cursor-pointer">
                          Ver foto ampliada
                        </span>
                      </div>
                    )}

                    {m.image_purged && (
                      <div className="my-1 p-2 rounded-lg bg-black/10 text-[10px] italic">
                        [Foto eliminada automáticamente tras 48h de la compra para liberar espacio en base de datos]
                      </div>
                    )}

                    <p className="leading-relaxed">{m.message}</p>
                  </div>
                ))}
              </div>

              {/* Photo preview bar if selected */}
              {chatPhoto && (
                <div className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={chatPhoto}
                      alt="Vista previa"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                        Foto lista para enviar
                      </span>
                      <span className="text-[10px] text-slate-500">Comprobante SPEI / Carta (Compresión WebP)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatPhoto(null)}
                    className="p-1 hover:text-rose-500 text-slate-400 cursor-pointer"
                    title="Quitar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Privacy auto-deletion notice */}
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-950 rounded-lg text-[10px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Las fotos se eliminan automáticamente 48h tras completarse la compra para ahorrar espacio en base de datos.
                </span>
              </div>

              {/* Chat Input */}
              {!isCompleted && (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adjuntar foto de comprobante o detalle de carta"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Pacta hora de entrega, ubicación o método de pago..."
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for zooming photo */}
      {selectedPhotoForZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPhotoForZoom(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedPhotoForZoom(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhotoForZoom}
              alt="Detalle ampliado"
              className="max-h-[85vh] max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

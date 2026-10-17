'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gavel,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { TCGGame, CardCondition } from '@/types/database';

export default function NuevaSubastaPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    tcg_game: 'Pokemon' as TCGGame,
    card_condition: 'NM' as CardCondition,
    card_rarity: 'Ultra Rare',
    card_set: '',
    starting_price: 500,
    min_increment: 50,
    duration_days: 3,
    image_url: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&auto=format&fit=crop&q=80',
    description: '',
    seller_location: 'CDMX (Entrega Frikiplaza o Envíos)',
  });

  const [acceptTerms, setAcceptTerms] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.starting_price) return;

    const currentUser = dataStore.getCurrentUser();
    const endsAt = new Date(Date.now() + 86400000 * formData.duration_days).toISOString();

    const created = dataStore.createAuction({
      seller_id: currentUser.id,
      seller_name: currentUser.name,
      seller_reputation_positive: 100,
      seller_trades_count: 5,
      seller_location: formData.seller_location,
      title: formData.title,
      tcg_game: formData.tcg_game,
      card_condition: formData.card_condition,
      card_rarity: formData.card_rarity,
      card_set: formData.card_set,
      image_url: formData.image_url,
      description: formData.description,
      starting_price: Number(formData.starting_price),
      min_increment: Number(formData.min_increment) || 50,
      ends_at: endsAt,
    });

    router.push(`/subastas/${created.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/subastas"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
          <span className="text-xs font-bold text-slate-500">Publicación de Carta C2C</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Gavel className="w-3.5 h-3.5" />
            Nueva Subasta
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Publicar Carta a Subasta
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Completa los datos de tu carta coleccionable. Las subastas cuentan con respaldo anti-trolls con reasignación al segundo postor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Card Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Datos de la Carta
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Título de la Subasta / Nombre de la Carta *
              </label>
              <input
                type="text"
                placeholder="Ej. Charizard ex Teracristal - Ilustración Especial Rara"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Juego TCG
                </label>
                <select
                  value={formData.tcg_game}
                  onChange={(e) => setFormData({ ...formData, tcg_game: e.target.value as TCGGame })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Pokemon">Pokémon TCG</option>
                  <option value="Magic">Magic: The Gathering</option>
                  <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                  <option value="One Piece">One Piece Card Game</option>
                  <option value="Lorcana">Disney Lorcana</option>
                  <option value="Otro">Otro TCG</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Condición de la Carta
                </label>
                <select
                  value={formData.card_condition}
                  onChange={(e) =>
                    setFormData({ ...formData, card_condition: e.target.value as CardCondition })
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="NM">Near Mint (NM) - Como nueva</option>
                  <option value="LP">Lightly Played (LP) - Ligero desgaste</option>
                  <option value="MP">Moderately Played (MP)</option>
                  <option value="HP">Heavily Played (HP)</option>
                  <option value="Damaged">Damaged - Dañada</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rareza
                </label>
                <input
                  type="text"
                  placeholder="Ej. Secret Rare / SIR / Foil"
                  value={formData.card_rarity}
                  onChange={(e) => setFormData({ ...formData, card_rarity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Set o Expansión
              </label>
              <input
                type="text"
                placeholder="Ej. Escarlata y Púrpura: Llamas Obsidianas (2023)"
                value={formData.card_set}
                onChange={(e) => setFormData({ ...formData, card_set: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                URL de la Imagen de la Carta
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Descripción detallada & Estado físico
              </label>
              <textarea
                rows={3}
                placeholder="Detalla si incluye toploader, centrado, si tiene blanqueamiento en las esquinas o si ha sido jugada en torneos..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Auction Pricing & Duration */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              2. Reglas Económicas y Duración
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Precio de Salida (MXN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Incremento Mínimo (MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={formData.min_increment}
                    onChange={(e) => setFormData({ ...formData, min_increment: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duración de la Subasta
                </label>
                <select
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 Día (Cierre Rápido)</option>
                  <option value={3}>3 Días (Recomendado)</option>
                  <option value={5}>5 Días</option>
                  <option value={7}>7 Días (Semana Completa)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ubicación / Modalidad de Entrega
              </label>
              <input
                type="text"
                placeholder="Ej. CDMX (Entrega personal en Plaza Friki o envíos por FedEx asegurado)"
                value={formData.seller_location}
                onChange={(e) => setFormData({ ...formData, seller_location: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Anti-Troll Checkbox Agreement */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <strong>Compromiso Anti-Trolls:</strong> Acepto que si el ganador de la subasta no responde en un plazo de 24 horas tras el cierre, tendré el derecho de ceder la compra directamente al segundo postor más alto o reportar una penalización por strike al infractor.
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/subastas"
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!acceptTerms}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              Publicar Subasta Ahora
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

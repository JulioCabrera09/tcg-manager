'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Globe,
  Loader2,
  DollarSign,
  Plus,
} from 'lucide-react';
import { dataStore } from '@/lib/store';
import { CardLanguage, CardCondition, TCGGame, VirtualBinder } from '@/types/database';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardAdded: () => void;
  binders: VirtualBinder[];
  defaultBinderId?: string;
}

export default function AddCardModal({
  isOpen,
  onClose,
  onCardAdded,
  binders,
  defaultBinderId,
}: AddCardModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  // Form Fields
  const [targetBinderId, setTargetBinderId] = useState(defaultBinderId || binders[0]?.id || '');
  const [cardCode, setCardCode] = useState('');
  const [language, setLanguage] = useState<CardLanguage>('ES');
  const [rarity, setRarity] = useState('Ultra Rare');
  const [expansion, setExpansion] = useState('');
  const [condition, setCondition] = useState<CardCondition>('NM');
  const [copiesCount, setCopiesCount] = useState(1);
  const [salePrice, setSalePrice] = useState<number>(100);

  useEffect(() => {
    if (defaultBinderId) {
      setTargetBinderId(defaultBinderId);
    } else if (binders.length > 0 && !targetBinderId) {
      setTargetBinderId(binders[0].id);
    }
  }, [defaultBinderId, binders, targetBinderId]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/yugioh/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success && data.cards) {
        setApiResults(data.cards);
        if (data.cards.length > 0) {
          selectCard(data.cards[0]);
        }
      }
    } catch (err) {
      console.error('Error buscando cartas:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCard = (card: any) => {
    setSelectedCard(card);
    setCardCode(card.card_code || '');
    setLanguage(card.detected_language || 'ES');
    setRarity(card.default_rarity || 'Ultra Rare');
    setExpansion(card.default_set_name || 'Colección Oficial Yu-Gi-Oh!');
    setSalePrice(card.recommended_price_mxn || 100);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !targetBinderId) return;

    const binder = binders.find((b) => b.id === targetBinderId);
    const currentUser = dataStore.getCurrentUser();

    dataStore.addCardToBinder({
      binder_id: targetBinderId,
      user_id: binder?.user_id || currentUser.id,
      user_name: binder?.owner_name || currentUser.name,
      is_store: binder?.is_store || false,
      store_slug: binder?.store_slug,
      user_location: binder?.owner_location || currentUser.city || 'México',
      yugioh_card_id: selectedCard.id,
      card_code: cardCode.trim() || selectedCard.card_code,
      name_en: selectedCard.name_en,
      name_es: selectedCard.name_es,
      language,
      tcg_game: 'Yu-Gi-Oh!',
      rarity,
      expansion,
      condition,
      copies_count: Number(copiesCount) || 1,
      sale_price: Number(salePrice) || 50,
      recommended_price_mxn: selectedCard.recommended_price_mxn,
      recommended_price_usd: selectedCard.recommended_price_usd,
      image_url: selectedCard.image_url,
      status: 'available',
    });

    onCardAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Añadir Carta a Carpeta Virtual
              </h2>
              <p className="text-xs text-slate-500">
                Buscador conectado a la API oficial de Yu-Gi-Oh! con reconocimiento de códigos multilingües
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

        {/* Search Bar with Code Recognition Notice */}
        <div className="space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ingresa nombre de carta (ej. Mago Oscuro, Ash Blossom) o código (ej. LOB-S005, RA01-EN005)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Consultar API</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Reconoce códigos en cualquier idioma (ej. <strong>LOB-S005</strong> en español, <strong>LOB-E005</strong> en inglés, <strong>1101-JP001</strong> en japonés). La imagen oficial se traerá en inglés desde la API.
          </p>
        </div>

        {/* API Results Row if multiple */}
        {apiResults.length > 1 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Coincidencias de la API ({apiResults.length}):
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {apiResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCard(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    selectedCard?.id === c.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.name_es} ({c.name_en})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Card Form */}
        {selectedCard && (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Left Col: Official Card Image & Market Price Benchmarks */}
            <div className="md:col-span-5 space-y-4">
              <div className="relative aspect-3/4 w-full bg-slate-950 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
                <Image
                  src={selectedCard.image_url}
                  alt={selectedCard.name_en}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-contain p-2"
                />
                <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs border border-white/20">
                  API Oficial YGOPRODeck
                </div>
              </div>

              {/* Price Recommendation Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <TrendingUp className="w-4 h-4" />
                  <span>Recomendación de Precios de Mercado:</span>
                </div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  ~${selectedCard.recommended_price_mxn} MXN{' '}
                  <span className="text-xs font-bold text-slate-500">
                    (${selectedCard.recommended_price_usd?.toFixed(2)} USD)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <div>
                    <strong>TCGPlayer:</strong> ${selectedCard.tcgplayer_price_usd} USD
                  </div>
                  <div>
                    <strong>Cardmarket:</strong> €{selectedCard.cardmarket_price_eur} EUR
                  </div>
                  <div>
                    <strong>eBay promedio:</strong> ${selectedCard.ebay_price_usd} USD
                  </div>
                  <div>
                    <strong>Referencia:</strong> Base de mercado
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Custom Card Details & Price Definition */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Nombre en Español:
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedCard.name_es}
                </h3>
                <span className="text-xs text-slate-500 font-mono block">
                  Original (EN): {selectedCard.name_en}
                </span>
              </div>

              {/* Target Binder Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Carpeta o Vitrina Destino:
                </label>
                <select
                  value={targetBinderId}
                  onChange={(e) => setTargetBinderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  {binders.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.is_store ? 'Tienda Oficial' : b.owner_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Code & Language Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Código Físico de la Carta:
                  </label>
                  <input
                    type="text"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    placeholder="Ej. LOB-S005"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Idioma de la Carta Física:
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as CardLanguage)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ES">Español (ES / SP)</option>
                    <option value="EN">Inglés (EN / E)</option>
                    <option value="JA">Japonés (JA / JP)</option>
                    <option value="IT">Italiano (IT / I)</option>
                    <option value="DE">Alemán (DE / G)</option>
                    <option value="FR">Francés (FR / F)</option>
                    <option value="PT">Portugués (PT / P)</option>
                  </select>
                </div>
              </div>

              {/* Rarity & Expansion Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rareza:
                  </label>
                  {selectedCard.available_sets && selectedCard.available_sets.length > 0 ? (
                    <select
                      value={rarity}
                      onChange={(e) => {
                        setRarity(e.target.value);
                        const matchedSet = selectedCard.available_sets.find(
                          (s: any) => s.rarity === e.target.value
                        );
                        if (matchedSet) {
                          setExpansion(matchedSet.setName);
                          setCardCode(matchedSet.setCode);
                          if (matchedSet.priceMxn > 0) setSalePrice(matchedSet.priceMxn);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {Array.from(new Set(selectedCard.available_sets.map((s: any) => s.rarity))).map(
                        (r: any) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Expansión:
                  </label>
                  <input
                    type="text"
                    value={expansion}
                    onChange={(e) => setExpansion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Condition, Copies Count & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Condición:
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as CardCondition)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="NM">Near Mint (NM)</option>
                    <option value="LP">Lightly Played (LP)</option>
                    <option value="MP">Moderately Played (MP)</option>
                    <option value="HP">Heavily Played (HP)</option>
                    <option value="Damaged">Damaged (DMG)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Copias Disponibles:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={copiesCount}
                    onChange={(e) => setCopiesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Precio de Venta (MXN):
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar en mi Carpeta</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

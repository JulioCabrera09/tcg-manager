'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  TrendingUp,
  Search,
  Gavel,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ArrowUpRight,
  Filter,
  Plus,
  MessageCircle,
  ExternalLink,
  Store,
  Layers,
  CheckCircle2,
  AlertTriangle,
  User,
  ArrowRight,
  FolderArchive,
  RefreshCw,
  X,
  Send,
  Truck,
  CreditCard,
  Package,
  Check,
  Camera,
  Paperclip,
  Eye,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { dataStore } from '@/lib/store';
import { sanitizeMexicanPhone, isValidMexicanPhone } from '@/lib/security';
import {
  UserProfile,
  VirtualBinder,
  BinderCard,
  Auction,
  Tenant,
  TenantProduct,
  Order,
  CardOffer,
} from '@/types/database';
import AddCardModal from '@/components/AddCardModal';
import OfferNegotiationModal from '@/components/OfferNegotiationModal';
import AuthModal from '@/components/AuthModal';

export default function UnifiedMarketplacePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);

  // Core Data
  const [binders, setBinders] = useState<VirtualBinder[]>([]);
  const [allCards, setAllCards] = useState<BinderCard[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [topSellers, setTopSellers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [storeProducts, setStoreProducts] = useState<TenantProduct[]>([]);

  // Marketplace Mode Tabs: Singles Vitrina vs Store Official Products
  const [marketplaceTab, setMarketplaceTab] = useState<'singles' | 'store_products'>('singles');
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<string>('all');

  // 4 Columns Data
  const [mostSearched, setMostSearched] = useState<ReturnType<typeof dataStore.getMostSearchedCards>>([]);
  const [mostSold, setMostSold] = useState<ReturnType<typeof dataStore.getMostSoldCards>>([]);

  // Filters for Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'stores' | 'collectors' | 'auctions'>('all');
  const [selectedGame, setSelectedGame] = useState<string>('all');

  // Interactive Offer Negotiation
  const [selectedCardForOffer, setSelectedCardForOffer] = useState<BinderCard | null>(null);
  const [activeOffer, setActiveOffer] = useState<CardOffer | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  // Direct Contact / Chat Modal with Seller
  const [directChatSeller, setDirectChatSeller] = useState<UserProfile | null>(null);
  const [directChatMsg, setDirectChatMsg] = useState('');
  const [directChatSent, setDirectChatSent] = useState(false);

  // Direct Store Product Purchase & Shipping Modal State
  const [selectedStoreProduct, setSelectedStoreProduct] = useState<TenantProduct | null>(null);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseDeliveryType, setPurchaseDeliveryType] = useState<'store_pickup' | 'shipping'>('store_pickup');
  const [purchaseAddress, setPurchaseAddress] = useState('');
  const [purchaseName, setPurchaseName] = useState(currentUser.name || '');
  const [purchasePhone, setPurchasePhone] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseOrderResult, setPurchaseOrderResult] = useState<Order | null>(null);
  const [purchaseChatOpen, setPurchaseChatOpen] = useState(false);
  const [purchaseChatMessages, setPurchaseChatMessages] = useState<
    Array<{ sender: 'customer' | 'store'; text: string; time: string; image_url?: string; expires_at?: string; image_purged?: boolean }>
  >([]);
  const [purchaseChatInput, setPurchaseChatInput] = useState('');
  const [purchaseChatImage, setPurchaseChatImage] = useState<string | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<string | null>(null);
  const chatFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const loadData = () => {
    setCurrentUser(dataStore.getCurrentUser());
    setBinders(dataStore.getBinders());
    setAllCards(dataStore.getBinderCards());
    setAuctions(dataStore.getAuctions().filter((a) => a.status === 'active'));
    setTopSellers(dataStore.getTopSellers());
    setTenants(dataStore.getTenants());
    setMostSearched(dataStore.getMostSearchedCards());
    setMostSold(dataStore.getMostSoldCards());
    setStoreProducts(dataStore.getMarketplaceStoreProducts());
  };

  useEffect(() => {
    loadData();
    const handleUserChanged = () => {
      setCurrentUser(dataStore.getCurrentUser());
      loadData();
    };
    window.addEventListener('tcg_user_changed', handleUserChanged);
    return () => window.removeEventListener('tcg_user_changed', handleUserChanged);
  }, []);

  const handleUserChange = (user: UserProfile) => {
    setCurrentUser(user);
    loadData();
  };

  const handleOpenOfferModal = (card: BinderCard) => {
    if (!currentUser || currentUser.id === 'usr-guest') {
      setIsAuthModalOpen(true);
      return;
    }

    // Check if user already has an offer for this card
    const existingOffers = dataStore.getOffers();
    const existing = existingOffers.find(
      (o) => o.card_id === card.id && o.buyer_id === currentUser.id && o.status === 'pending'
    );

    setSelectedCardForOffer(card);
    if (existing) {
      setActiveOffer(existing);
    } else {
      // Create new draft offer
      const newOffer = dataStore.createCardOffer({
        card_id: card.id,
        binder_id: card.binder_id,
        card_name: card.name_es ? `${card.name_es} (${card.name_en})` : card.name_en,
        card_code: card.card_code,
        rarity: card.rarity,
        language: card.language,
        card_image_url: card.image_url,
        original_price: card.sale_price,
        offered_price: card.sale_price,
        copies_requested: 1,
        seller_id: card.user_id,
        seller_name: card.user_name,
        buyer_id: currentUser.id,
        buyer_name: currentUser.alias ? `${currentUser.name} (@${currentUser.alias})` : currentUser.name,
        buyer_city: currentUser.city,
        buyer_reputation: currentUser.reputation_positive,
      });
      setActiveOffer(newOffer);
    }
    setIsOfferModalOpen(true);
  };

  const handleStartChatWithSeller = (seller: UserProfile) => {
    if (!currentUser || currentUser.id === 'usr-guest') {
      setIsAuthModalOpen(true);
      return;
    }
    setDirectChatSeller(seller);
  };

  const handleStartPurchaseStoreProduct = (prod: TenantProduct) => {
    if (!currentUser || currentUser.id === 'usr-guest') {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedStoreProduct(prod);
    setPurchaseQty(1);
    setPurchaseDeliveryType('store_pickup');
    setPurchaseAddress('');
    setPurchaseName(currentUser.name || '');
    setPurchasePhone(currentUser.whatsapp_phone || '');
  };

  const handleSendDirectChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directChatMsg.trim() || !directChatSeller) return;
    setDirectChatSent(true);
    setTimeout(() => {
      setDirectChatMsg('');
      setDirectChatSent(false);
      setDirectChatSeller(null);
    }, 1500);
  };

  const handlePurchaseStoreProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreProduct || !purchaseName.trim() || !purchasePhone.trim()) return;

    // Validación estricta de 10 dígitos numéricos
    const cleanPhone = sanitizeMexicanPhone(purchasePhone);
    if (!isValidMexicanPhone(cleanPhone)) {
      alert('El número de celular debe contener exactamente 10 dígitos numéricos (sin lada ni caracteres especiales).');
      return;
    }

    if (purchaseDeliveryType === 'shipping' && !purchaseAddress.trim()) {
      alert('Por favor introduce la dirección completa para el envío.');
      return;
    }

    setIsPurchasing(true);
    try {
      const order = dataStore.createReservation(
        selectedStoreProduct.tenant_id,
        purchaseName.trim(),
        cleanPhone,
        [{ product: selectedStoreProduct, quantity: purchaseQty }],
        purchaseNotes.trim() || undefined,
        currentUser.email || undefined,
        purchaseDeliveryType,
        purchaseDeliveryType === 'shipping' ? purchaseAddress.trim() : undefined
      );

      setPurchaseOrderResult(order);
      loadData(); // Immediately deducts stock in real time across the ecosystem!

      if (purchaseDeliveryType === 'shipping') {
        const storeObj = tenants.find((t) => t.id === selectedStoreProduct.tenant_id);
        const storeName = storeObj ? storeObj.name : 'Tienda Oficial';
        const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setPurchaseChatMessages([
          {
            sender: 'customer',
            text: `¡Hola ${storeName}! Acabo de ordenar ${purchaseQty}x "${selectedStoreProduct.name}" con envío a "${purchaseAddress.trim()}" (Orden #${order.reservation_code}). ¿Me pasan su CLABE interbancaria para hacer la transferencia?`,
            time: now,
          },
          {
            sender: 'store',
            text: `¡Hola ${purchaseName.trim()}! Excelente elección. Datos de transferencia bancaria SPEI: CLABE 012180001234567890 (BBVA) a nombre de ${storeName}. En cuanto transfieras compártenos el comprobante aquí mismo y te generamos tu guía de paquetería express.`,
            time: now,
          },
        ]);
        setPurchaseChatOpen(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar la compra';
      alert(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleChatPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setPurchaseChatImage(webp);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSendPurchaseChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseChatInput.trim() && !purchaseChatImage) return;
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const textToSend = purchaseChatInput.trim();
    const imageToSend = purchaseChatImage;

    setPurchaseChatMessages((prev) => [
      ...prev,
      {
        sender: 'customer',
        text: textToSend,
        time: now,
        image_url: imageToSend || undefined,
      },
    ]);
    setPurchaseChatInput('');
    setPurchaseChatImage(null);

    setTimeout(() => {
      setPurchaseChatMessages((prev) => [
        ...prev,
        {
          sender: 'store',
          text: imageToSend
            ? '¡Comprobante recibido con éxito! El encargado de sucursal está validando el depósito en portal bancario para programar el envío express.'
            : `Enterado: "${textToSend.substring(0, 30)}...". El almacén de la tienda ya apartó tu producto y lo está protegiendo para envío.`,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  // Filtered Cards
  const filteredCards = allCards.filter((card) => {
    if (card.status === 'sold_out') return false;
    if (selectedGame !== 'all' && card.tcg_game !== selectedGame) return false;
    if (filterType === 'stores' && !card.is_store) return false;
    if (filterType === 'collectors' && card.is_store) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNameEn = card.name_en.toLowerCase().includes(q);
      const matchNameEs = card.name_es?.toLowerCase().includes(q);
      const matchCode = card.card_code.toLowerCase().includes(q);
      const matchRarity = card.rarity.toLowerCase().includes(q);
      const matchExpansion = card.expansion.toLowerCase().includes(q);
      if (!matchNameEn && !matchNameEs && !matchCode && !matchRarity && !matchExpansion) {
        return false;
      }
    }
    return true;
  });

  // Filtered Store Products (Boxes, Sleeves, Mats, Dice, Board Games)
  const filteredStoreProducts = storeProducts.filter((p) => {
    if (selectedStoreCategory !== 'all' && p.category !== selectedStoreCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchBarcode) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col">
      {/* Top Bar / Marketplace Header */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  Ecosistema C2C & B2C Unificado
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  • Sin comisiones ocultas • Cierre directo
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Marketplace TCG: Vitrinas, Carpetas & Subastas
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                Encuentra cartas coleccionables de tiendas verificadas y jugadores particulares. Oferta en vivo, compra singles y gestiona tus carpetas virtuales en una sola plataforma.
              </p>
            </div>

            {/* Profile & Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              {/* User badge */}
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer flex items-center gap-2 text-xs"
                title="Administrar cuenta"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUser.alias ? `@${currentUser.alias}` : currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>{currentUser.city || 'México'}</span>
                    <span>•</span>
                    <span className="text-amber-500 font-bold">
                      ★ {currentUser.rating ? currentUser.rating.toFixed(1) : '5.0'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Mi Carpeta Digital Link for regular users and collectors */}
              <Link
                href="/mi-carpeta"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FolderArchive className="w-4 h-4" />
                <span>Mi Carpeta Digital</span>
              </Link>

              {/* If user is Store Owner or Staff, quick shortcut to their private ERP */}
              {(currentUser.role === 'store_admin' || currentUser.role === 'store_staff') && (
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Panel ERP Tienda</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!currentUser || currentUser.id === 'usr-guest') {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsAddCardModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Publicar Carta
              </button>

              <Link
                href="/subastas/nueva"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <Gavel className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Nueva Subasta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Welcome & Registration Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Comunidad de Coleccionistas y Tiendas Oficiales TCG
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explora cartas de Pokémon, Yu-Gi-Oh!, Magic y One Piece. Inicia sesión con Google para ofertar, participar en subastas o apartar artículos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Acceso Rápido con Google / Correo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4 PROMINENT COLUMNS (AUDIO 5 MAIN REQUIREMENT) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Destacados del Ecosistema
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Actualización en tiempo real • Precios en MXN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* COLUMNA 1: CARTAS MÁS BUSCADAS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Más Buscadas
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Esta semana</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                Tendencias
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {mostSearched.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSearchQuery(card.name_en)}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-950/40 transition cursor-pointer flex items-center gap-3 group"
                >
                  <div className="w-12 h-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                    <Image
                      src={card.image_url}
                      alt={card.name_en}
                      fill
                      sizes="48px"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {card.name_es}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate italic">
                      {card.name_en}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 truncate max-w-[90px]">
                        {card.rarity}
                      </span>
                      <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                        ${card.market_price_mxn.toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMNA 2: CARTAS MÁS VENDIDAS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Más Vendidas
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Mayor rotación</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                Volumen
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {mostSold.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSearchQuery(card.name_en)}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/40 transition cursor-pointer flex items-center gap-3 group"
                >
                  <div className="w-12 h-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                    <Image
                      src={card.image_url}
                      alt={card.name_en}
                      fill
                      sizes="48px"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {card.name_es}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate italic">
                      {card.name_en}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                        ${card.sold_price_mxn.toLocaleString('es-MX')} MXN
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {card.weekly_volume} ventas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMNA 3: SUBASTAS ACTIVAS EN VIVO */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <Gavel className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Subastas en Vivo
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Anti-Troll Activo</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded animate-pulse">
                EN VIVO
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {auctions.map((auc) => (
                <div
                  key={auc.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 bg-slate-50/50 dark:bg-slate-950/40 transition flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                      <Image
                        src={auc.image_url}
                        alt={auc.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {auc.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span>Cierra en 24h</span>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-1">
                        Puja: <span className="text-red-600 dark:text-red-400">${auc.current_price.toLocaleString('es-MX')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {auc.bids?.length || 0} pujas
                    </span>
                    <Link
                      href={`/subastas/${auc.id}`}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Pujar / Entrar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMNA 4: MEJORES VENDEDORES (0.0 A 5.0 ESTRELLAS) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Top Vendedores
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Reputación 0.0 - 5.0</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                5.0 Máx
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {topSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          seller.is_verified_store
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {seller.is_verified_store ? <Store className="w-3.5 h-3.5" /> : seller.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span className="truncate max-w-[110px]">{seller.name}</span>
                          {seller.is_verified_store && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{seller.city || 'México'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-amber-500 flex items-center justify-end gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{seller.rating ? seller.rating.toFixed(1) : '5.0'}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {seller.total_trades || 10} tratos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {seller.is_verified_store && seller.store_slug ? (
                      <Link
                        href={`/tienda/${seller.store_slug}`}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Visitar Tienda</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-[10px] text-slate-400">Coleccionista</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartChatWithSeller(seller)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE MODE TABS: SINGLES VS TIENDAS OFICIALES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setMarketplaceTab('singles')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
              marketplaceTab === 'singles'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Vitrina de Cartas Sueltas & Carpetas ({filteredCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMarketplaceTab('store_products')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
              marketplaceTab === 'store_products'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <div className="flex items-center gap-1.5">
              <span>Productos de Tiendas Oficiales ({filteredStoreProducts.length})</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                Cajas • Micas • Tapetes
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* TAB 1: EXPLORADOR DE SINGLES & CARPETAS */}
      {marketplaceTab === 'singles' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full space-y-6 animate-fade-in">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cartas por nombre (ES/EN), código de set (LOB-S005, RA01-EN005), rareza o expansión..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todas ({filteredCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('stores')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    filterType === 'stores'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Vitrinas de Tiendas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('collectors')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    filterType === 'collectors'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  Carpetas de Jugadores
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Singles Disponibles para Trato Directo</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {filteredCards.length} cartas
              </span>
            </div>

            {filteredCards.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <FolderArchive className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No se encontraron cartas con esos criterios
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Intenta buscar por otro código o juego, o sé el primero en publicar una carta.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddCardModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Publicar en Mi Carpeta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition shadow-xs overflow-hidden flex flex-col group"
                  >
                    {/* Card Image Container */}
                    <div className="relative aspect-4/5 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <Image
                        src={card.image_url}
                        alt={card.name_en}
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-contain p-2 group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900/80 text-white">
                          {card.card_code}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white">
                          {card.language}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white">
                          {card.condition}
                        </span>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {card.name_es || card.name_en}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                          {card.name_en}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded truncate">
                            {card.rarity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({card.copies_count} u.)
                          </span>
                        </div>
                      </div>

                      {/* Seller and Price */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                            {card.user_name}
                          </span>
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                            ${card.sale_price.toLocaleString('es-MX')} MXN
                          </span>
                        </div>

                        {card.recommended_price_mxn && (
                          <div className="text-[9px] text-slate-400 font-mono mb-2">
                            Sugerido: ${card.recommended_price_mxn.toLocaleString('es-MX')}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenOfferModal(card)}
                          className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Comprar / Ofertar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: SECCIÓN DE PRODUCTOS DE TIENDAS OFICIALES */}
      {marketplaceTab === 'store_products' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full space-y-6 animate-fade-in">
          {/* Header & Filter Bar for Store Products */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cajas selladas, micas, tapetes, dados o juegos de mesa..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedStoreCategory('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedStoreCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Todos ({storeProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStoreCategory('tcg_sealed')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    selectedStoreCategory === 'tcg_sealed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Cajas & Sobres Sellados
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStoreCategory('accessory')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    selectedStoreCategory === 'accessory'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Micas & Tapetes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStoreCategory('board_game')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedStoreCategory === 'board_game'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Juegos de Mesa
                </button>
              </div>
            </div>
          </div>

          {/* Store Products Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Artículos & Accesorios de Tiendas Oficiales</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inventario conectado en tiempo real. Compra para recoger en sucursal o coordina envío a domicilio por chat.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredStoreProducts.length} productos
              </span>
            </div>

            {filteredStoreProducts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No hay productos disponibles en esta categoría
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Las tiendas oficiales están actualizando su catálogo de cajas selladas, micas y tapetes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStoreProducts.map((prod) => {
                  const store = tenants.find((t) => t.id === prod.tenant_id);
                  return (
                    <div
                      key={prod.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition shadow-xs overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image */}
                        <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                          ) : (
                            <Package className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                          )}
                          <div className="absolute top-2 left-2 flex gap-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white uppercase">
                              {prod.category === 'tcg_sealed'
                                ? 'Caja Sellada'
                                : prod.category === 'accessory'
                                ? 'Accesorio'
                                : prod.category === 'board_game'
                                ? 'Juego de Mesa'
                                : 'Producto'}
                            </span>
                          </div>
                          <div className="absolute bottom-2 right-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white font-mono shadow-xs">
                              {prod.stock_quantity} en existencias
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 space-y-2">
                          {store && (
                            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
                              <Link
                                href={`/tienda/${store.slug}`}
                                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                              >
                                <Store className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{store.name}</span>
                              </Link>
                              <span className="text-slate-400 text-[10px] shrink-0">
                                {store.address?.split(',')[0] || 'México'}
                              </span>
                            </div>
                          )}

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                            {prod.name}
                          </h4>

                          {prod.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {prod.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price & Buy Button */}
                      <div className="p-4 pt-0">
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mb-3">
                          <span className="text-xs text-slate-500">Precio Unitario:</span>
                          <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                            ${prod.price.toFixed(2)} MXN
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartPurchaseStoreProduct(prod)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>Comprar / Apartar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* STORE PRODUCT PURCHASE MODAL (Immediate Stock Deduction & Pickup vs Shipping) */}
      {selectedStoreProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Apartar Producto en Tienda Oficial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStoreProduct(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseStoreProduct} className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]">
              {/* Product Brief */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white text-sm block">
                  {selectedStoreProduct.name}
                </span>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Precio: <strong>${selectedStoreProduct.price.toFixed(2)} MXN</strong></span>
                  <span>Stock disponible: <strong>{selectedStoreProduct.stock_quantity} u.</strong></span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cantidad a comprar *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedStoreProduct.stock_quantity}
                  value={purchaseQty}
                  onChange={(e) =>
                    setPurchaseQty(Math.min(selectedStoreProduct.stock_quantity, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Delivery Selector */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Forma de Entrega:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseDeliveryType('store_pickup')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      purchaseDeliveryType === 'store_pickup'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      <span>En Sucursal</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Pagas al recoger
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseDeliveryType('shipping')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                      purchaseDeliveryType === 'shipping'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Envío a Domicilio</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Chat para transferencia
                    </span>
                  </button>
                </div>
              </div>

              {purchaseDeliveryType === 'shipping' && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-1.5">
                  <label className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Dirección completa de entrega *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={purchaseAddress}
                    onChange={(e) => setPurchaseAddress(e.target.value)}
                    placeholder="Calle, número, colonia, CP, ciudad y estado..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Customer Contact */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseName}
                    onChange={(e) => setPurchaseName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono Celular (10 dígitos) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={purchasePhone}
                    onChange={(e) => setPurchasePhone(sanitizeMexicanPhone(e.target.value))}
                    maxLength={10}
                    placeholder="Ej. 5512345678"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Sin lada (+52 MX asumido). {purchasePhone.length}/10 dígitos
                  </span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm font-bold">
                <span>Total a Pagar:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base">
                  ${(selectedStoreProduct.price * purchaseQty).toFixed(2)} MXN
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStoreProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPurchasing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  {isPurchasing
                    ? 'Procesando...'
                    : purchaseDeliveryType === 'shipping'
                    ? 'Continuar al Chat'
                    : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE CONFIRMATION MODAL (PICKUP) */}
      {purchaseOrderResult && purchaseDeliveryType === 'store_pickup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 text-center shadow-2xl">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                ¡Apartado Confirmado!
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Código: <span className="font-mono text-blue-600 dark:text-blue-400">{purchaseOrderResult.reservation_code}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                El stock se ha descontado de la tienda. Puedes pasar a recoger tu pedido y pagar en mostrador.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span>Total a pagar:</span>
                <span className="font-bold">${purchaseOrderResult.total.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between">
                <span>Modalidad:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pago en sucursal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPurchaseOrderResult(null);
                setSelectedStoreProduct(null);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Listo, Cerrar
            </button>
          </div>
        </div>
      )}

      {/* BILATERAL CHAT MODAL FOR SHIPPING & SPEI PAYMENT */}
      {purchaseChatOpen && purchaseOrderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg h-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Coordinación de Envío con la Tienda
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pedido #{purchaseOrderResult.reservation_code} • {purchaseAddress.substring(0, 30)}...
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPurchaseChatOpen(false);
                  setPurchaseOrderResult(null);
                  setSelectedStoreProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50/70 dark:bg-blue-950/40 px-4 py-2 border-b border-blue-200 dark:border-blue-900/40 text-[11px] flex items-center justify-between text-blue-950 dark:text-blue-200 shrink-0">
              <span>
                <strong>Total a Liquidar:</strong> ${purchaseOrderResult.total.toFixed(2)} MXN
              </span>
              <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">
                Envío por Paquetería
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                Chat privado entre cliente y tienda. Transfiere vía SPEI y compártenos el comprobante aquí mismo para recibir tu número de rastreo.
              </div>

              {purchaseChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.sender === 'customer' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === 'customer'
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.image_url && (
                      <div className="mb-2">
                        <img
                          src={msg.image_url}
                          alt="Adjunto de chat"
                          onClick={() => setSelectedPhotoForZoom(msg.image_url || null)}
                          className="max-h-48 max-w-full rounded-xl object-contain cursor-pointer hover:opacity-90 border border-black/10 transition shadow-xs"
                        />
                        <span className={`text-[9px] block mt-0.5 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-slate-400'}`}>
                          Ver foto ampliada
                        </span>
                      </div>
                    )}
                    {msg.image_purged && (
                      <div className="mb-2 p-2 rounded-lg bg-black/10 text-[10px] italic">
                        [Foto eliminada automáticamente tras 48h de la compra para liberar espacio en base de datos]
                      </div>
                    )}
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        msg.sender === 'customer' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo Preview bar if selected */}
            {purchaseChatImage && (
              <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <img
                    src={purchaseChatImage}
                    alt="Vista previa"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      Foto adjunta lista
                    </span>
                    <span className="text-[10px] text-slate-500">Comprobante SPEI / Carta (Compresión WebP)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPurchaseChatImage(null)}
                  className="p-1 hover:text-rose-500 text-slate-400 cursor-pointer"
                  title="Quitar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Privacy auto-deletion notice */}
            <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-950 text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Las fotos se eliminan automáticamente 48h tras completarse la compra para ahorrar espacio en base de datos.
              </span>
            </div>

            <form
              onSubmit={handleSendPurchaseChatMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
            >
              <input
                ref={chatFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChatPhotoUpload}
              />
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                title="Adjuntar foto de comprobante o carta"
                className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={purchaseChatInput}
                onChange={(e) => setPurchaseChatInput(e.target.value)}
                placeholder="Escribe tu mensaje a la tienda..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition shadow-xs shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR ZOOMING CHAT PHOTOS */}
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

      {/* DIRECT CHAT MODAL WITH SELLER / STORE */}
      {directChatSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    directChatSeller.is_verified_store
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-white'
                  }`}
                >
                  {directChatSeller.is_verified_store ? <Store className="w-4 h-4" /> : directChatSeller.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span>{directChatSeller.name}</span>
                    {directChatSeller.is_verified_store && (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {directChatSeller.city || 'México'} • Reputación: ★ {directChatSeller.rating || '5.0'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDirectChatSeller(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {directChatSent ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Mensaje enviado al vendedor! Te contactará pronto.</span>
                </div>
              ) : (
                <form onSubmit={handleSendDirectChat} className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Envía un mensaje directo a {directChatSeller.name} para acordar entrega personal en sucursal o envío por paquetería.
                  </p>

                  <textarea
                    required
                    rows={4}
                    value={directChatMsg}
                    onChange={(e) => setDirectChatMsg(e.target.value)}
                    placeholder={`Hola ${directChatSeller.name}, me interesan tus cartas disponibles. ¿Haces entregas en ${currentUser.city || 'tu ciudad'}?`}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-hidden focus:border-blue-500 resize-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDirectChatSeller(null)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar Mensaje
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />

      {/* ADD CARD MODAL */}
      <AddCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        binders={binders}
        onCardAdded={() => loadData()}
      />

      {/* OFFER NEGOTIATION MODAL (BILATERAL CHAT & DEDUCTION) */}
      <OfferNegotiationModal
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setSelectedCardForOffer(null);
          setActiveOffer(null);
          loadData();
        }}
        card={selectedCardForOffer}
        existingOfferId={activeOffer?.id}
        onTransactionUpdated={() => loadData()}
      />

      {/* FOOTER WITH TERMS & PRIVACY POLICY MODAL */}
      <Footer variant="marketplace" />
    </div>
  );
}

'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Briefcase,
  Trophy,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertCircle,
  Truck,
  Send,
  CreditCard,
  Camera,
  Paperclip,
  Eye,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { dataStore } from '@/lib/store';
import { sanitizeMexicanPhone, isValidMexicanPhone } from '@/lib/security';
import {
  Tenant,
  TenantProduct,
  Tournament,
  ProductCategory,
  TCGGame,
  Order,
} from '@/types/database';

export default function TenantStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<TenantProduct[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Reservation State
  type CartItem = {
    product: TenantProduct;
    quantity: number;
    variationText?: string;
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Reservation checkout modal & Delivery Method
  const [deliveryType, setDeliveryType] = useState<'store_pickup' | 'shipping'>('store_pickup');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer-Store Direct Shipping Negotiation Chat State
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'customer' | 'store'; text: string; time: string; image_url?: string; expires_at?: string; image_purged?: boolean }>
  >([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<string | null>(null);
  const chatFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Variation Selection Modal
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<TenantProduct | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string>('');

  useEffect(() => {
    const foundTenant = dataStore.getTenantBySlug(slug);
    if (foundTenant) {
      setTenant(foundTenant);
      setProducts(dataStore.getProducts(foundTenant.id));
      setTournaments(dataStore.getTournaments(foundTenant.id));
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <Store className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tienda no encontrada</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
          No existe una tienda registrada con el identificador &quot;{slug}&quot;. Verifica la URL o visita el portal principal.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (!p.is_active) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedGame !== 'all' && p.tcg_game !== selectedGame) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      const matchSet = p.card_set?.toLowerCase().includes(q);
      if (!matchName && !matchBarcode && !matchSet) return false;
    }
    return true;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: TenantProduct) => {
    if (product.variations && product.variations.length > 0) {
      setSelectedProductForVariation(product);
      setSelectedVariationId(product.variations[0].id);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && !i.variationText);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleAddVariationToCart = () => {
    if (!selectedProductForVariation) return;
    const variation = selectedProductForVariation.variations?.find(
      (v) => v.id === selectedVariationId
    );
    const variationText = variation ? `${variation.name}: ${variation.option_value}` : undefined;

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product.id === selectedProductForVariation.id && i.variationText === variationText
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product: selectedProductForVariation, quantity: 1, variationText }];
    });

    setSelectedProductForVariation(null);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((it, i) => (i === index ? { ...it, quantity: newQty } : it));
    });
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || cart.length === 0) return;

    // Validación estricta de 10 dígitos numéricos
    const cleanPhone = sanitizeMexicanPhone(customerPhone);
    if (!isValidMexicanPhone(cleanPhone)) {
      alert('El número de celular debe contener exactamente 10 dígitos numéricos (sin lada ni caracteres especiales).');
      return;
    }

    if (deliveryType === 'shipping' && !shippingAddress.trim()) {
      alert('Por favor introduce tu dirección completa de entrega.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = dataStore.createReservation(
        tenant.id,
        customerName.trim(),
        cleanPhone,
        cart,
        reservationNotes.trim() || undefined,
        customerEmail.trim() || undefined,
        deliveryType,
        deliveryType === 'shipping' ? shippingAddress.trim() : undefined
      );
      setCreatedOrder(order);
      setCart([]);
      setProducts(dataStore.getProducts(tenant.id));

      if (deliveryType === 'shipping') {
        const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        setChatMessages([
          {
            sender: 'customer',
            text: `¡Hola ${tenant.name}! Acabo de generar el pedido ${order.reservation_code} con envío a mi domicilio: "${shippingAddress.trim()}". ¿Podrían indicarme los datos bancarios para transferencia y opciones de paquetería?`,
            time: now,
          },
          {
            sender: 'store',
            text: `¡Hola ${customerName.trim()}! Con gusto coordinamos tu envío. Tenemos convenio con DHL y FedEx ($150 MXN a todo el país). Datos bancarios: CLABE BBVA 012180001234567890 a nombre de ${tenant.name}. Por favor envíanos la captura de tu transferencia aquí mismo para despachar tu paquete.`,
            time: now,
          },
        ]);
        setIsDirectChatOpen(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la reserva';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStorefrontPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setChatImage(webp);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() && !chatImage) return;
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const textToSend = newChatMessage.trim();
    const imageToSend = chatImage;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'customer',
        text: textToSend,
        time: now,
        image_url: imageToSend || undefined,
      },
    ]);
    setNewChatMessage('');
    setChatImage(null);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'store',
          text: imageToSend
            ? '¡Comprobante de transferencia recibido con éxito! El cajero está verificando los fondos en portal bancario para entregarte el número de guía.'
            : `Enterado: "${textToSend.substring(0, 35)}...". El encargado de envíos está preparando tu paquete con micas protectoras de burbuja.`,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Banner / Store Header - Solid colors, no gradients */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl p-0.5 shadow-sm flex-shrink-0"
                style={{ backgroundColor: tenant.theme_color || '#2563EB' }}
              >
                <div className="w-full h-full rounded-[14px] bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                  {tenant.logo_url ? (
                    <Image
                      src={tenant.logo_url}
                      alt={tenant.name}
                      width={88}
                      height={88}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-10 h-10 text-slate-700 dark:text-white" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {tenant.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Tienda Verificada TCG
                  </span>
                </div>
                {tenant.tagline && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl font-medium">
                    {tenant.tagline}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {tenant.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {tenant.address}
                    </span>
                  )}
                  {tenant.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {tenant.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {tenant.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer relative"
              >
                <ShoppingBag className="w-4 h-4" />
                Mi Reserva
                {cartItemCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-white text-blue-700 text-[10px] font-black rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Hiring Callout Banner if enabled */}
          {tenant.is_hiring && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    {tenant.hiring_title || '¡Estamos Contratando!'}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-slate-300">
                    {tenant.hiring_description || 'Pregunta en mostrador o mándanos tu currículum por WhatsApp.'}
                  </p>
                </div>
              </div>
              {tenant.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}?text=Hola,%20me%20interesa%20la%20vacante%20de%20empleo.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Postularme
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* Navigation Tabs within Store */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Catálogo de Productos y Cartas</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({filteredProducts.length} disponibles)</span>
          </div>
          <span className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full font-medium">
            Reserva en línea • Paga al recoger en mostrador
          </span>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código de barras o set..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* Category filter */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              <option value="tcg_single">Cartas Sueltas (Singles)</option>
              <option value="tcg_sealed">Producto Sellado (Sobres / Cajas)</option>
              <option value="accessory">Accesorios (Micas, Cajas, Playmats)</option>
              <option value="snack">Cafetería & Botanas</option>
              <option value="beverage">Bebidas & Refrescos</option>
            </select>
          </div>

          {/* TCG Game filter */}
          <div className="md:col-span-3">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
            >
              <option value="all">Todos los Juegos TCG</option>
              <option value="Pokemon">Pokémon TCG</option>
              <option value="Magic">Magic: The Gathering</option>
              <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
              <option value="One Piece">One Piece Card Game</option>
              <option value="Lorcana">Disney Lorcana</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <Sparkles className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No se encontraron productos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prueba cambiando los filtros o buscando con otro término.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-xs hover:shadow-md"
              >
                {/* Product Image preview */}
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-2">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 dark:text-slate-600">
                      <ShoppingBag className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-mono">Sin imagen</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {p.tcg_game && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                        {p.tcg_game}
                      </span>
                    )}
                    {p.card_condition && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500 text-slate-950 shadow-xs">
                        {p.card_condition}
                      </span>
                    )}
                  </div>

                  {p.barcode && (
                    <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-white/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {p.barcode}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                      {p.name}
                    </h3>
                    {p.card_set && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Set: {p.card_set}
                      </p>
                    )}
                    {p.card_rarity && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 font-semibold">
                        {p.card_rarity}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Precio</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        ${p.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Stock</span>
                      <span
                        className={`text-xs font-bold ${
                          p.stock_quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {p.stock_quantity > 0 ? `${p.stock_quantity} disp.` : 'Agotado'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={p.stock_quantity <= 0}
                    onClick={() => handleAddToCart(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      p.stock_quantity > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-[0.98]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {p.variations && p.variations.length > 0
                      ? 'Elegir opciones'
                      : 'Reservar en tienda'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tournaments Section (Audio 1 & Audio 4) */}
        <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Torneos Oficiales & Comunidad</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Convocatorias semanales, premios garantizados y memorias de campeones
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {tournaments.filter((t) => t.status === 'upcoming').length} activos
            </span>
          </div>

          {tournaments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-xs">
              <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sin torneos programados actualmente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No hay fechas de juego programadas esta semana. Consulta con el personal de la tienda o contáctanos por WhatsApp para sugerir un formato.
              </p>
              {tenant.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}?text=Hola,%20quisiera%20saber%20cuándo%20tendrán%20próximos%20torneos.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar próximas fechas
                </a>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tournaments.map((t) => {
                const isCompleted = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition space-y-3.5 shadow-xs ${
                      isCompleted
                        ? 'border-slate-200 dark:border-slate-800 opacity-90'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {t.game}
                          </span>
                          {isCompleted ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Finalizado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              Inscripciones Abiertas
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                          {t.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Formato: {t.format}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          {t.entry_fee > 0 ? `$${t.entry_fee.toFixed(2)} MXN` : 'Entrada Libre'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Inscripción</span>
                      </div>
                    </div>

                    {/* Schedule & Location */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <div>
                          <div>
                            {new Date(t.event_date).toLocaleDateString('es-MX', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {t.start_time || '16:00'} {t.end_time ? `- ${t.end_time}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{t.location_name || tenant.name}</span>
                      </div>
                    </div>

                    {/* Structured Prizes Breakdown */}
                    {(t.first_place_prize || t.prizes_description) && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                        <strong className="text-amber-600 dark:text-amber-400 font-bold block text-[11px] uppercase tracking-wider">
                          Estructura de Premiación:
                        </strong>
                        {t.first_place_prize && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                            <span className="font-bold text-amber-500">1º Lugar:</span>
                            <span>{t.first_place_prize}</span>
                          </div>
                        )}
                        {t.second_place_prize && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                            <span className="font-bold text-slate-400">2º Lugar:</span>
                            <span>{t.second_place_prize}</span>
                          </div>
                        )}
                        {t.third_place_prize && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                            <span className="font-bold text-amber-700">3º Lugar:</span>
                            <span>{t.third_place_prize}</span>
                          </div>
                        )}
                        {t.top_cut_prizes && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                            {t.top_cut_prizes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Past Winners Memories (Audio 1) */}
                    {t.winners_info && (
                      <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-300">
                        <span className="font-bold block mb-0.5">Resultados / Ganadores:</span>
                        {t.winners_info}
                      </div>
                    )}

                    {!isCompleted && tenant.whatsapp && (
                      <a
                        href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}?text=Hola,%20deseo%20inscribirme%20al%20torneo:%20${encodeURIComponent(t.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl text-center block transition cursor-pointer"
                      >
                        Inscribirme vía WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Store Photo Gallery Section (Audio 1) */}
        {tenant.gallery_images && tenant.gallery_images.length > 0 && (
          <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Galería & Recuerdos de Comunidad
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instalaciones, vitrinas de cartas y momentos destacados de torneos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tenant.gallery_images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative group"
                >
                  <Image
                    src={imgUrl}
                    alt={`Foto de sucursal ${tenant.name} ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
                    <span className="text-[10px] text-white font-semibold">
                      {idx === 0
                        ? 'Zona de Duelo'
                        : idx === 1
                        ? 'Mesas de Torneo'
                        : idx === 2
                        ? 'Vitrina de Singles'
                        : 'Ambiente Familiar'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Location & Contact Section */}
        <section className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Ubicación y Horarios de Atención
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {tenant.address || 'Consulta en mostrador'}
            </p>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white">Horarios Oficiales:</div>
              <p>{tenant.business_hours || 'Lunes a Viernes: 12:00 PM - 8:30 PM | Sábados y Domingos: 11:00 AM - 9:00 PM'}</p>
            </div>
            {tenant.phone && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                Teléfono de atención: {tenant.phone}
              </p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Garantía y Sistema de Reserva
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Tus cartas y productos se apartan automáticamente con tu número de reserva por hasta 48 horas. Pagas en efectivo, tarjeta o transferencia directamente al recoger en la tienda física. Sin cargos ocultos ni necesidad de registrar tarjetas en línea.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>¿Eres administrador de esta tienda? Ingresar al ERP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Variation Selection Modal */}
      {selectedProductForVariation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Seleccionar opción para: {selectedProductForVariation.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProductForVariation(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Variación disponible:</label>
              {selectedProductForVariation.variations?.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedVariationId === v.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="variation"
                      checked={selectedVariationId === v.id}
                      onChange={() => setSelectedVariationId(v.id)}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="font-medium">
                      {v.name}: {v.option_value}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {v.price_modifier > 0 ? `+ $${v.price_modifier.toFixed(2)}` : 'Incluido'}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProductForVariation(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddVariationToCart}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirmar y Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Reservation Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Mi Carrito de Reserva</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <ShoppingBag className="w-12 h-12 stroke-1" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tu carrito está vacío</p>
                <p className="text-xs">Agrega cartas, sobres o botanas para reservarlos.</p>
              </div>
            ) : (
              <div className="flex-1 py-4 space-y-4">
                <div className="space-y-2.5">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                        {item.variationText && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-mono">
                            {item.variationText}
                          </span>
                        )}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                          ${item.product.price.toFixed(2)} c/u
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="p-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="p-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, -item.quantity)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total a Pagar en Tienda</span>
                    <span className="text-emerald-600 dark:text-emerald-400">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout form */}
                <form onSubmit={handleCreateReservation} className="space-y-3.5 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Método de Entrega:
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('store_pickup')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                        deliveryType === 'store_pickup'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>En Sucursal</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Pagas al recoger en mostrador
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('shipping')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                        deliveryType === 'shipping'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Envío a Domicilio</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Chat directo para transferencia
                      </span>
                    </button>
                  </div>

                  {deliveryType === 'shipping' && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
                      <label className="text-[11px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Dirección completa para envío *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Calle, Número, Colonia, Código Postal, Municipio / Estado"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Al confirmar, se descontarán los productos de tienda y se abrirá el chat para acordar la paquetería y CLABE de transferencia bancaria.
                      </p>
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pt-1">
                    Datos del Cliente:
                  </h4>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Teléfono Celular (10 dígitos) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(sanitizeMexicanPhone(e.target.value))}
                      maxLength={10}
                      placeholder="Ej. 5512345678"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Sin lada (+52 MX asumido). {customerPhone.length}/10 dígitos
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1">
                      Notas adicionales (opcional)
                    </label>
                    <input
                      type="text"
                      value={reservationNotes}
                      onChange={(e) => setReservationNotes(e.target.value)}
                      placeholder="Ej. Paso mañana por la tarde o indicaciones especiales"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer mt-4 flex items-center justify-center gap-2"
                  >
                    {deliveryType === 'store_pickup' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {isSubmitting ? 'Generando reserva...' : 'Confirmar Apartado en Tienda'}
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        {isSubmitting ? 'Iniciando chat...' : 'Continuar al Chat de Envío y Pago'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservation Success Modal (Store Pickup) */}
      {createdOrder && deliveryType === 'store_pickup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 text-center shadow-2xl">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                ¡Reserva Confirmada!
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Código: <span className="font-mono text-blue-600 dark:text-blue-400">{createdOrder.reservation_code}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                Hola <strong>{createdOrder.customer_name}</strong>, tus productos han sido apartados en{' '}
                <strong>{tenant.name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total a liquidar:</span>
                <span className="text-slate-900 dark:text-white font-bold">${createdOrder.total.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Modalidad:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">Recoger y pagar en sucursal</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Dirección de tienda:</span>
                <span className="text-slate-800 dark:text-slate-200 truncate">{tenant.address}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Muestra este código al llegar a mostrador para que te entreguen tu pedido de inmediato.
            </p>

            <button
              type="button"
              onClick={() => {
                setCreatedOrder(null);
                setIsCartOpen(false);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Entendido, Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Direct Bilateral Chat Modal (Shipping & Payment Coordination) */}
      {isDirectChatOpen && createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg h-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {tenant.name}
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pedido #{createdOrder.reservation_code} • Coordinación de Envío
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDirectChatOpen(false);
                  setCreatedOrder(null);
                  setIsCartOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Brief Pill */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 px-4 py-2 border-b border-blue-200 dark:border-blue-900/40 text-[11px] flex items-center justify-between text-blue-950 dark:text-blue-200 shrink-0">
              <span>
                <strong>Total Pedido:</strong> ${createdOrder.total.toFixed(2)} MXN
              </span>
              <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded font-bold">
                {deliveryType === 'shipping' ? 'Envío a Domicilio' : 'Retiro en Sucursal'}
              </span>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50 text-xs">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                Chat privado entre cliente y tienda. Coordina el pago por transferencia bancaria (SPEI) y el número de guía de paquetería.
              </div>

              {chatMessages.map((msg, idx) => (
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
            {chatImage && (
              <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <img
                    src={chatImage}
                    alt="Vista previa"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      Comprobante / Foto lista
                    </span>
                    <span className="text-[10px] text-slate-500">Comprobante SPEI (Compresión WebP)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChatImage(null)}
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

            {/* Chat Input */}
            <form
              onSubmit={handleSendChatMessage}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
            >
              <input
                ref={chatFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStorefrontPhotoUpload}
              />
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                title="Adjuntar foto de comprobante de transferencia"
                className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
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

      {/* Storefront Footer with Terms & Privacy Policy */}
      <Footer variant="storefront" storeName={tenant.name} />
    </div>
  );
}

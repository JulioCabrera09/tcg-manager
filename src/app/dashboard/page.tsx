'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  Layers,
  Barcode,
  ShoppingBag,
  Trophy,
  Users,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Coffee,
  Sparkles,
  Camera,
  ChevronDown,
  RefreshCw,
  X,
  Calendar,
  Share2,
  Download,
  Copy,
  FileText,
  Check,
  Eye,
  PieChart,
  Tag,
  MapPin,
  Printer,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Swords,
  UserCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { dataStore } from '@/lib/store';
import { playBeep } from '@/lib/audio';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import { sanitizeMexicanPhone, isValidMexicanPhone } from '@/lib/security';
import { useStoreRealtime } from '@/lib/supabase/useRealtime';
import {
  Tenant,
  TenantProduct,
  Tournament,
  TournamentMatch,
  Order,
  TenantMember,
  GlobalProduct,
  ProductCategory,
  TCGGame,
  CardCondition,
  TenantRole,
} from '@/types/database';

export default function DashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'pos' | 'reservations' | 'tournaments' | 'reports' | 'team' | 'settings'
  >('inventory');

  // Loaded Data for current tenant
  const [products, setProducts] = useState<TenantProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Search & Filters in Inventory
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState<string>('all');
  const [invFilterStock, setInvFilterStock] = useState<'all' | 'low_stock'>('all');

  // Calendar Reports State (Audio 3)
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'biweek' | 'month'>('day');
  const [reportSelectedDate, setReportSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Order | null>(null);

  // Tournament Flyer Modal State (Audio 4)
  const [selectedTournForFlyer, setSelectedTournForFlyer] = useState<Tournament | null>(null);
  const [flyerCopied, setFlyerCopied] = useState(false);

  // Modal: Add / Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<TenantProduct> | null>(null);
  const [hasVariations, setHasVariations] = useState(false);
  const [tempVariations, setTempVariations] = useState<
    { name: string; option_value: string; price_modifier: number }[]
  >([]);

  // POS State
  type POSItem = { product: TenantProduct; quantity: number };
  const [posCart, setPosCart] = useState<POSItem[]>([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [posSuccessTicket, setPosSuccessTicket] = useState<{
    code: string;
    total: number;
    items: POSItem[];
  } | null>(null);

  // Modal: Create Tournament
  const [isTournModalOpen, setIsTournModalOpen] = useState(false);
  const [newTourn, setNewTourn] = useState({
    name: '',
    game: 'Yu-Gi-Oh!',
    format: 'Avanzado',
    event_date: '',
    start_time: '16:00',
    end_time: '21:00',
    location_name: '',
    entry_fee: 100,
    budget_cost: 1000,
    max_participants: 24,
    prizes_description: '1er Lugar: Booster Box + Tapete Champion. 2do Lugar: 12 Sobres.',
    first_place_prize: '1 Booster Box Sellada + Tapete Champion',
    second_place_prize: '12 Sobres sellados',
    third_place_prize: '6 Sobres sellados',
    top_cut_prizes: 'Top 8: 2 Sobres c/u',
    round_duration_minutes: 45,
    poster_image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
  });
  const [editingTournId, setEditingTournId] = useState<string | null>(null);
  const [selectedTournForBracket, setSelectedTournForBracket] = useState<Tournament | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantDeck, setNewParticipantDeck] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Live countdown timer for round in bracket view
  useEffect(() => {
    if (!selectedTournForBracket || !selectedTournForBracket.timer_is_running) return;

    const interval = setInterval(() => {
      setSelectedTournForBracket((prev) => {
        if (!prev) return null;
        const currentSeconds = prev.timer_seconds_left ?? (prev.round_duration_minutes || 45) * 60;
        if (currentSeconds <= 1) {
          clearInterval(interval);
          dataStore.updateTournamentTimer(prev.id, 0, false);
          return { ...prev, timer_seconds_left: 0, timer_is_running: false };
        }
        const nextSeconds = currentSeconds - 1;
        if (nextSeconds % 5 === 0) {
          dataStore.updateTournamentTimer(prev.id, nextSeconds, true);
        }
        return { ...prev, timer_seconds_left: nextSeconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedTournForBracket?.timer_is_running, selectedTournForBracket?.id]);

  // Client-side WebP image compression for tournament banners
  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 675;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          setNewTourn((prev) => ({ ...prev, poster_image_url: webpDataUrl }));
        }
        setIsCompressingImage(false);
      };
      img.onerror = () => setIsCompressingImage(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsCompressingImage(false);
    reader.readAsDataURL(file);
  };

  // Modal: Add Team Member
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    user_name: '',
    user_email: '',
    role: 'editor' as TenantRole,
    can_delete_inventory: false,
    can_edit_inventory: true,
    can_manage_tournaments: true,
    can_view_finance: false,
    can_create_tickets: true,
  });

  // Settings Phone / WhatsApp strict 10 digits
  const [settingsPhone, setSettingsPhone] = useState<string>('');
  const [settingsWhatsapp, setSettingsWhatsapp] = useState<string>('');

  // Load initial data
  useEffect(() => {
    const allTenants = dataStore.getTenants();
    setTenants(allTenants);
    if (allTenants.length > 0) {
      const activeId = dataStore.getActiveTenantId() || allTenants[0].id;
      setCurrentTenantId(activeId);
      loadTenantData(activeId);
      const found = allTenants.find((t) => t.id === activeId) || allTenants[0];
      if (found) {
        setSettingsPhone(sanitizeMexicanPhone(found.phone || ''));
        setSettingsWhatsapp(sanitizeMexicanPhone(found.whatsapp || ''));
      }
    }
  }, []);

  const loadTenantData = (tenantId: string) => {
    setProducts(dataStore.getProducts(tenantId));
    setOrders(dataStore.getOrders(tenantId));
    setTournaments(dataStore.getTournaments(tenantId));
    setMembers(dataStore.getMembers(tenantId));
  };

  const handleSwitchTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    dataStore.setActiveTenantId(tenantId);
    loadTenantData(tenantId);
    setPosCart([]);
    const found = tenants.find((t) => t.id === tenantId);
    if (found) {
      setSettingsPhone(sanitizeMexicanPhone(found.phone || ''));
      setSettingsWhatsapp(sanitizeMexicanPhone(found.whatsapp || ''));
    }
  };

  const currentTenant = tenants.find((t) => t.id === currentTenantId) || tenants[0];

  const refreshCurrentData = () => {
    if (currentTenantId) {
      loadTenantData(currentTenantId);
    }
  };

  // Realtime subscription via Supabase & Local BroadcastChannel for live reservations and stock changes
  useStoreRealtime(currentTenantId, {
    onNewOrder: (newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
      playBeep();
    },
    onProductUpdate: (updProd) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === updProd.id ? { ...p, ...updProd } : p))
      );
    },
  });

  // Low Stock products calculation (Audio 2 & 3)
  const lowStockProducts = products.filter((p) => {
    if (p.low_stock_alert_enabled === false) return false;
    const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5;
    return p.stock_quantity <= threshold;
  });

  // Inventory logic
  const filteredProducts = products.filter((p) => {
    if (invFilterStock === 'low_stock') {
      const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5;
      if (p.stock_quantity > threshold || p.low_stock_alert_enabled === false) {
        return false;
      }
    }
    if (invCategory !== 'all' && p.category !== invCategory) return false;
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      if (!matchName && !matchBarcode) return false;
    }
    return true;
  });

  const handleOpenAddProduct = (prefillBarcode?: string, globalItem?: GlobalProduct) => {
    setEditingProduct({
      tenant_id: currentTenantId,
      barcode: prefillBarcode || globalItem?.barcode || '',
      name: globalItem?.name || '',
      category: globalItem?.category || 'tcg_single',
      tcg_game: globalItem?.tcg_game || 'Pokemon',
      price: globalItem?.suggested_price || 0,
      cost_price: 0,
      stock_quantity: 1,
      is_active: true,
      card_condition: 'NM',
      description: globalItem?.description || '',
    });
    setHasVariations(false);
    setTempVariations([]);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    try {
      if (editingProduct.id) {
        dataStore.updateProduct({
          ...editingProduct,
          id: editingProduct.id,
          price: Number(editingProduct.price) || 0,
          cost_price: Number(editingProduct.cost_price) || 0,
          stock_quantity: Number(editingProduct.stock_quantity) || 0,
          low_stock_threshold: Number(editingProduct.low_stock_threshold) || 5,
          low_stock_alert_enabled: editingProduct.low_stock_alert_enabled !== false,
          show_in_marketplace: editingProduct.show_in_marketplace !== false,
        });
      } else {
        const variationsToSave = hasVariations
          ? tempVariations.map((v, i) => ({
              id: `var-${Date.now()}-${i}`,
              tenant_product_id: '',
              name: v.name,
              option_value: v.option_value,
              price_modifier: Number(v.price_modifier) || 0,
              stock_quantity: 10,
            }))
          : undefined;

        dataStore.addProduct({
          tenant_id: currentTenantId,
          barcode: editingProduct.barcode || undefined,
          sku: editingProduct.sku || undefined,
          name: editingProduct.name,
          category: (editingProduct.category as ProductCategory) || 'tcg_single',
          tcg_game: editingProduct.tcg_game as TCGGame,
          card_condition: editingProduct.card_condition as CardCondition,
          card_rarity: editingProduct.card_rarity,
          card_set: editingProduct.card_set,
          price: Number(editingProduct.price) || 0,
          cost_price: Number(editingProduct.cost_price) || 0,
          stock_quantity: Number(editingProduct.stock_quantity) || 0,
          low_stock_threshold: Number(editingProduct.low_stock_threshold) || 5,
          low_stock_alert_enabled: editingProduct.low_stock_alert_enabled !== false,
          show_in_marketplace: editingProduct.show_in_marketplace !== false,
          is_active: editingProduct.is_active ?? true,
          image_url: editingProduct.image_url,
          description: editingProduct.description,
          variations: variationsToSave,
        });
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      refreshCurrentData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el producto';
      alert(message);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto del inventario?')) {
      dataStore.deleteProduct(id);
      refreshCurrentData();
    }
  };

  const handleScanSuccess = (
    barcode: string,
    matchedProduct?: TenantProduct,
    matchedGlobal?: GlobalProduct
  ) => {
    if (activeTab === 'pos') {
      if (matchedProduct) {
        addToPosCart(matchedProduct);
      } else {
        alert(`El código ${barcode} no existe en el inventario de esta tienda.`);
      }
    } else {
      if (matchedProduct) {
        setEditingProduct(matchedProduct);
        setIsProductModalOpen(true);
      } else {
        handleOpenAddProduct(barcode, matchedGlobal);
      }
    }
  };

  // POS Logic
  const addToPosCart = (product: TenantProduct) => {
    playBeep('success');
    setPosCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updatePosQty = (productId: string, delta: number) => {
    setPosCart((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i));
    });
  };

  const posTotal = posCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCompletePosSale = () => {
    if (posCart.length === 0) return;

    const saleCode = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      tenant_id: currentTenantId,
      reservation_code: saleCode,
      customer_name: 'Venta Mostrador',
      customer_phone: 'N/A',
      order_type: 'pos_direct',
      status: 'completed',
      payment_method: posPaymentMethod,
      subtotal: posTotal,
      total: posTotal,
      items: posCart.map((i) => ({
        id: `pos-item-${Math.random().toString(36).substring(2, 7)}`,
        order_id: '',
        tenant_product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price,
        subtotal: i.product.price * i.quantity,
      })),
      created_at: new Date().toISOString(),
    };

    posCart.forEach((item) => {
      const p = dataStore.getProductById(item.product.id);
      if (p) {
        dataStore.updateProduct({
          id: p.id,
          stock_quantity: Math.max(0, p.stock_quantity - item.quantity),
        });
      }
    });

    dataStore.createReservation(
      currentTenantId,
      'Venta Mostrador',
      'Mostrador',
      posCart.map((i) => ({ product: i.product, quantity: i.quantity }))
    );

    setPosSuccessTicket({
      code: saleCode,
      total: posTotal,
      items: [...posCart],
    });
    setPosCart([]);
    refreshCurrentData();
  };

  const resetNewTournForm = () => {
    setEditingTournId(null);
    setNewTourn({
      name: '',
      game: 'Yu-Gi-Oh!',
      format: 'Avanzado',
      event_date: '',
      start_time: '16:00',
      end_time: '21:00',
      location_name: '',
      entry_fee: 100,
      budget_cost: 1000,
      max_participants: 24,
      prizes_description: '1er Lugar: Booster Box + Tapete Champion. 2do Lugar: 12 Sobres.',
      first_place_prize: '1 Booster Box Sellada + Tapete Champion',
      second_place_prize: '12 Sobres sellados',
      third_place_prize: '6 Sobres sellados',
      top_cut_prizes: 'Top 8: 2 Sobres c/u',
      round_duration_minutes: 45,
      poster_image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    });
  };

  const handleOpenEditTournament = (tourn: Tournament) => {
    setEditingTournId(tourn.id);
    setNewTourn({
      name: tourn.name,
      game: tourn.game,
      format: tourn.format,
      event_date: tourn.event_date ? tourn.event_date.split('T')[0] : '',
      start_time: tourn.start_time || '16:00',
      end_time: tourn.end_time || '21:00',
      location_name: tourn.location_name || '',
      entry_fee: tourn.entry_fee,
      budget_cost: tourn.budget_cost || 0,
      max_participants: tourn.max_participants,
      prizes_description: tourn.prizes_description || '',
      first_place_prize: tourn.first_place_prize || '',
      second_place_prize: tourn.second_place_prize || '',
      third_place_prize: tourn.third_place_prize || '',
      top_cut_prizes: tourn.top_cut_prizes || '',
      round_duration_minutes: tourn.round_duration_minutes || 45,
      poster_image_url: tourn.poster_image_url || '',
    });
    setIsTournModalOpen(true);
  };

  const handleDeleteTournament = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este torneo?')) {
      dataStore.deleteTournament(id);
      if (selectedTournForBracket?.id === id) {
        setSelectedTournForBracket(null);
      }
      refreshCurrentData();
    }
  };

  const handleAddParticipant = (tournamentId: string) => {
    if (!newParticipantName.trim()) return;
    const tourn = dataStore.getTournamentById(tournamentId);
    if (!tourn) return;
    const currentList = tourn.participants_list || [];
    const updatedList = [
      ...currentList,
      {
        id: `part-${Date.now()}`,
        name: newParticipantName.trim(),
        deck: newParticipantDeck.trim() || undefined,
        deck_name: newParticipantDeck.trim() || undefined,
        paid: true,
      },
    ];
    dataStore.updateTournament({ id: tourn.id, participants_list: updatedList });
    const updatedTourn = dataStore.getTournamentById(tournamentId);
    setSelectedTournForBracket(updatedTourn || null);
    setNewParticipantName('');
    setNewParticipantDeck('');
    refreshCurrentData();
  };

  const handleStartTournament = (tournamentId: string) => {
    const updated = dataStore.startTournamentAndGenerateBracket(tournamentId);
    if (updated) {
      setSelectedTournForBracket(updated);
      refreshCurrentData();
    }
  };

  const handleAdvanceMatch = (tournamentId: string, matchId: string, winnerId: string | 'double_loss') => {
    const updated = dataStore.advanceTournamentMatchWinner(tournamentId, matchId, winnerId);
    if (updated) {
      setSelectedTournForBracket(updated);
      refreshCurrentData();
    }
  };

  const handleToggleTimer = (tournamentId: string) => {
    if (!selectedTournForBracket) return;
    const isRunning = !selectedTournForBracket.timer_is_running;
    const currentSeconds = selectedTournForBracket.timer_seconds_left ?? (selectedTournForBracket.round_duration_minutes || 45) * 60;
    dataStore.updateTournamentTimer(tournamentId, currentSeconds, isRunning);
    setSelectedTournForBracket((prev) => prev ? { ...prev, timer_is_running: isRunning, timer_seconds_left: currentSeconds } : null);
    refreshCurrentData();
  };

  const handleResetTimer = (tournamentId: string) => {
    if (!selectedTournForBracket) return;
    const roundSeconds = (selectedTournForBracket.round_duration_minutes || 45) * 60;
    dataStore.updateTournamentTimer(tournamentId, roundSeconds, false);
    setSelectedTournForBracket((prev) => prev ? { ...prev, timer_seconds_left: roundSeconds, timer_is_running: false } : null);
    refreshCurrentData();
  };

  const handleSaveTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTournId) {
      dataStore.updateTournament({
        id: editingTournId,
        name: newTourn.name,
        game: newTourn.game,
        format: newTourn.format,
        event_date: newTourn.event_date || new Date().toISOString(),
        start_time: newTourn.start_time,
        end_time: newTourn.end_time,
        location_name: newTourn.location_name || currentTenant.address || 'Tienda Principal',
        entry_fee: Number(newTourn.entry_fee) || 0,
        budget_cost: Number(newTourn.budget_cost) || 0,
        max_participants: Number(newTourn.max_participants) || 24,
        prizes_description: newTourn.prizes_description,
        first_place_prize: newTourn.first_place_prize,
        second_place_prize: newTourn.second_place_prize,
        third_place_prize: newTourn.third_place_prize,
        top_cut_prizes: newTourn.top_cut_prizes,
        round_duration_minutes: Number(newTourn.round_duration_minutes) || 45,
        poster_image_url: newTourn.poster_image_url,
      });
      setEditingTournId(null);
    } else {
      dataStore.addTournament({
        tenant_id: currentTenantId,
        name: newTourn.name,
        game: newTourn.game,
        format: newTourn.format,
        event_date: newTourn.event_date || new Date().toISOString(),
        start_time: newTourn.start_time,
        end_time: newTourn.end_time,
        location_name: newTourn.location_name || currentTenant.address || 'Tienda Principal',
        entry_fee: Number(newTourn.entry_fee) || 0,
        budget_cost: Number(newTourn.budget_cost) || 0,
        max_participants: Number(newTourn.max_participants) || 24,
        prizes_description: newTourn.prizes_description,
        first_place_prize: newTourn.first_place_prize,
        second_place_prize: newTourn.second_place_prize,
        third_place_prize: newTourn.third_place_prize,
        top_cut_prizes: newTourn.top_cut_prizes,
        round_duration_minutes: Number(newTourn.round_duration_minutes) || 45,
        poster_image_url: newTourn.poster_image_url,
        status: 'upcoming',
        participants_list: [],
      });
    }
    setIsTournModalOpen(false);
    resetNewTournForm();
    refreshCurrentData();
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.addMember({
      tenant_id: currentTenantId,
      user_id: `usr-${Date.now()}`,
      role: newMember.role,
      user_name: newMember.user_name,
      user_email: newMember.user_email,
      can_delete_inventory: newMember.can_delete_inventory,
      can_edit_inventory: newMember.can_edit_inventory,
      can_manage_tournaments: newMember.can_manage_tournaments,
      can_view_finance: newMember.can_view_finance,
      can_create_tickets: newMember.can_create_tickets,
    });
    setIsMemberModalOpen(false);
    setNewMember({
      user_name: '',
      user_email: '',
      role: 'editor',
      can_delete_inventory: false,
      can_edit_inventory: true,
      can_manage_tournaments: true,
      can_view_finance: false,
      can_create_tickets: true,
    });
    refreshCurrentData();
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    dataStore.updateOrderStatus(orderId, status);
    refreshCurrentData();
  };

  if (!currentTenant) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header / Store Selector - Solid colors, no gradients */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Panel de Tienda (SaaS ERP)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {currentTenant.status === 'active' ? 'Tienda Activa' : 'Suspendida'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <select
                  value={currentTenantId}
                  onChange={(e) => handleSwitchTenant(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>

                <Link
                  href={`/tienda/${currentTenant.slug}`}
                  target="_blank"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition font-medium cursor-pointer"
                >
                  Ver Storefront Público
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics / Storage quota badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-right">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                Límite de Catálogo (Tier Piloto)
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                <span className="text-blue-600 dark:text-blue-400">{products.length}</span> /{' '}
                {currentTenant.storage_limit_items} productos
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
              Escanear Código
            </button>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 py-2">
          {[
            { id: 'inventory', label: 'Inventario Universal', icon: Layers },
            { id: 'pos', label: 'Punto de Venta (POS)', icon: DollarSign },
            {
              id: 'reservations',
              label: `Reservas Web (${orders.filter((o) => o.status === 'pending_pickup').length})`,
              icon: ShoppingBag,
            },
            { id: 'tournaments', label: `Torneos (${tournaments.length})`, icon: Trophy },
            { id: 'reports', label: 'Finanzas & Tickets', icon: TrendingUp },
            { id: 'team', label: `Empleados y Roles (${members.length})`, icon: Users },
            { id: 'settings', label: 'Ajustes de Tienda', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: INVENTARIO UNIVERSAL */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-fade-in">
            {/* Low-Stock Alert Warning Banner (Audio 2 & 3) */}
            {lowStockProducts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                      Alerta de Resurtido: {lowStockProducts.length} producto(s) con stock bajo
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-slate-300">
                      Unidades llegaron al límite crítico configurado (tapetes, sellado, micas, dados o accesorios).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvFilterStock(invFilterStock === 'low_stock' ? 'all' : 'low_stock')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                      invFilterStock === 'low_stock'
                        ? 'bg-amber-700 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                    }`}
                  >
                    {invFilterStock === 'low_stock' ? 'Ver todo el catálogo' : 'Filtrar solo stock bajo'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Buscar por nombre o código de barras..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
                <select
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
                >
                  <option value="all">Todas las Categorías</option>
                  <option value="tcg_single">Singles TCG</option>
                  <option value="tcg_sealed">Sellado / Sobres & Cajas</option>
                  <option value="accessory">Accesorios (Tapetes, Micas, Dados)</option>
                  <option value="board_game">Juegos de Mesa</option>
                  <option value="apparel">Ropa & Mochilas</option>
                  <option value="poster">Pósters de Colección</option>
                  <option value="snack">Cafetería & Snacks</option>
                  <option value="beverage">Refrescos & Bebidas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddProduct()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Producto
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Categoría / Juego</th>
                      <th className="px-4 py-3">Código de Barras</th>
                      <th className="px-4 py-3">Precio Venta</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Variaciones</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                          No se encontraron productos en el inventario.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {p.image_url ? (
                                  <Image
                                    src={p.image_url}
                                    alt={p.name}
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Layers className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                                {p.card_set && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    Set: {p.card_set}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                                {p.category.replace('_', ' ')}
                              </span>
                              {p.tcg_game && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                  {p.tcg_game}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {p.barcode ? (
                              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                {p.barcode}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Sin código</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              ${p.price.toFixed(2)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {(() => {
                              const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5;
                              const isLow = p.low_stock_alert_enabled !== false && p.stock_quantity <= threshold;
                              return (
                                <div className="flex flex-col gap-1 items-start">
                                  <span
                                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                      isLow
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                        : p.stock_quantity > 0
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                    }`}
                                  >
                                    {p.stock_quantity} unidades
                                  </span>
                                  {isLow && (
                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      Mínimo: {threshold} u
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          <td className="px-4 py-3">
                            {p.variations && p.variations.length > 0 ? (
                              <span className="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 px-2 py-0.5 rounded-md">
                                {p.variations.length} opciones (ej.{' '}
                                {p.variations.map((v) => v.option_value).join(', ')})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Estándar</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PUNTO DE VENTA (POS) */}
        {/* ========================================================================= */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left: Quick Item Selector & Scan */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Caja Registradora / POS</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Escanea o haz clic para agregar al ticket</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Barcode className="w-4 h-4" />
                  Escanear a Ticket
                </button>
              </div>

              {/* Fast Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToPosCart(p)}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl text-left transition cursor-pointer flex flex-col justify-between h-28 group shadow-xs hover:shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                        {p.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Stock: {p.stock_quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ${p.price.toFixed(2)}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Ticket Cart */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[480px] shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Ticket Actual
                  </h4>
                  {posCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPosCart([])}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {posCart.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                    El ticket está vacío. Escanea o selecciona artículos.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {posCart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                          <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                            ${item.product.price.toFixed(2)} c/u
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => updatePosQty(item.product.id, -1)}
                            className="p-1 hover:text-blue-600 text-slate-500 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-900 dark:text-white px-1">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updatePosQty(item.product.id, 1)}
                            className="p-1 hover:text-blue-600 text-slate-500 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-emerald-600 dark:text-emerald-400 pl-3">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom: Payment selector & total */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Método de Pago:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Efectivo' },
                      { id: 'card', label: 'Terminal / Tarjeta' },
                      { id: 'transfer', label: 'Transferencia' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPosPaymentMethod(m.id as typeof posPaymentMethod)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                          posPaymentMethod === m.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-base font-black text-slate-900 dark:text-white pt-2">
                  <span>Total Cobro:</span>
                  <span className="text-2xl text-emerald-600 dark:text-emerald-400 font-mono">
                    ${posTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={handleCompletePosSale}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    posCart.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completar Cobro Mostrador
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POS Success Ticket Modal */}
        {posSuccessTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center shadow-2xl">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">¡Venta Registrada!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ticket <span className="font-mono text-blue-600 dark:text-blue-400">{posSuccessTicket.code}</span>
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-left text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
                {posSuccessTicket.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>
                      {i.quantity}x {i.product.name}
                    </span>
                    <span>${(i.product.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Total Cobrado:</span>
                  <span>${posSuccessTicket.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPosSuccessTicket(null)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Ticket
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RESERVAS WEB Y PEDIDOS */}
        {/* ========================================================================= */}
        {activeTab === 'reservations' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reservas Web de Clientes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apartados en línea listos para entrega y pago en mostrador
                </p>
              </div>
              <button
                type="button"
                onClick={refreshCurrentData}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
                title="Actualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                        {o.reservation_code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{o.customer_name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{o.customer_phone}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : o.status === 'ready_for_pickup'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {o.status === 'pending_pickup'
                        ? 'Pendiente Entrega'
                        : o.status === 'ready_for_pickup'
                        ? 'Listo en Mostrador'
                        : o.status === 'completed'
                        ? 'Entregado y Pagado'
                        : 'Cancelado'}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    {o.items?.map((it, i) => (
                      <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>
                          {it.quantity}x {it.product_name}
                        </span>
                        <span className="font-mono">${it.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total Apartado:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">${o.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {o.notes && (
                    <p className="text-[11px] text-slate-500 italic">Nota del cliente: &quot;{o.notes}&quot;</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {o.status === 'pending_pickup' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(o.id, 'ready_for_pickup')}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Marcar Listo en Mostrador
                      </button>
                    )}
                    {o.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus(o.id, 'completed')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Cobrar y Entregar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TORNEOS */}
        {/* ========================================================================= */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Gestión de Torneos</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Crea eventos, define formatos y controla inscripciones
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTournModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo Torneo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {t.game} • {t.format}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                              : t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {t.status === 'in_progress' ? 'En Curso (Ronda Activa)' : t.status === 'completed' ? 'Finalizado' : 'Inscripciones Abiertas'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{t.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTournament(t)}
                          title="Editar Torneo"
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTournament(t.id)}
                          title="Eliminar Torneo"
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {new Date(t.event_date).toLocaleDateString('es-MX', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {t.start_time || '16:00'} - {t.end_time || '21:00'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {t.location_name || currentTenant.address || 'Tienda Principal'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        Inscritos: <strong className="text-slate-900 dark:text-white">{t.participants_list?.length || t.registered_count || 0}</strong> /{' '}
                        {t.max_participants}
                      </span>
                    </div>

                    {/* Structured Prizes Breakdown (Audio 4) */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-amber-600 dark:text-amber-400">
                          Estructura de Premios Oficiales:
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {t.entry_fee > 0 ? `$${t.entry_fee.toFixed(2)} MXN` : 'Gratuito'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-amber-500 font-bold block">1er Lugar</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {t.first_place_prize || t.prizes_description || 'Premio Campeón'}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block">2do Lugar</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {t.second_place_prize || '6 Sobres Sellados'}
                          </span>
                        </div>
                      </div>
                      {(t.third_place_prize || t.top_cut_prizes) && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          {t.third_place_prize && <span>3er Lugar: {t.third_place_prize} • </span>}
                          {t.top_cut_prizes && <span>{t.top_cut_prizes}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Live Brackets + Flyer Generator */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Ronda: {t.round_duration_minutes || 45} min
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTournForBracket(t)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        Brackets & Llaves
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTournForFlyer(t)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Flyer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: REPORTES FINANCIEROS Y AUDITORÍA DE TICKETS (Audio 3) */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (() => {
          const report = dataStore.getFinancialReport(currentTenantId, reportPeriod, reportSelectedDate);
          return (
            <div className="space-y-6 animate-fade-in">
              {/* Header with Date Picker & Period Selector */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Auditoría de Tickets & Reportes de Venta
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Consulta individual de tickets por día en calendario, margen de ganancia y rotación de inventario
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Calendar Date Picker */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Fecha Calendario:</span>
                    <input
                      type="date"
                      value={reportSelectedDate}
                      onChange={(e) => setReportSelectedDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-2 py-1 rounded-lg font-mono text-xs cursor-pointer focus:outline-none"
                    />
                  </div>

                  {/* Period Switcher */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setReportPeriod('day')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reportPeriod === 'day'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Día Específico
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportPeriod('week')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reportPeriod === 'week'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Semana
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportPeriod('biweek')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reportPeriod === 'biweek'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Quincena
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportPeriod('month')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reportPeriod === 'month'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Mes
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Cards (Including Tournaments Accounting) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <span>Ingresos Totales (POS + Torneos)</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      ${report.totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Catálogo/POS:</span>
                        <strong className="text-slate-700 dark:text-slate-300">${report.productRevenue.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Inscripciones Torneos:</span>
                        <strong className="text-blue-600 dark:text-blue-400">${report.tournamentRevenue.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    Período:{' '}
                    {report.period === 'day'
                      ? 'DÍA'
                      : report.period === 'week'
                      ? 'SEMANA'
                      : report.period === 'biweek'
                      ? 'QUINCENA'
                      : 'MES'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <span>Costos Totales</span>
                      <Layers className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      ${report.totalCost.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Costo Inventario:</span>
                        <strong className="text-slate-700 dark:text-slate-300">${report.productCost.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Premios de Torneo:</span>
                        <strong className="text-amber-600 dark:text-amber-400">${report.tournamentCost.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    Reposición + Premios invertidos
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <span>Ganancia Neta Global</span>
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                      ${report.grossProfit.toFixed(2)}
                    </div>
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Margen: {report.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    Utilidad de tienda y eventos
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <span>Transacciones & Duelistas</span>
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {report.totalOrdersCount} <span className="text-xs font-normal text-slate-400">tickets</span>
                    </div>
                    <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {report.totalTournamentParticipants} duelistas en torneos
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {report.tournamentsSummary?.length || 0} torneo(s) en este período
                  </p>
                </div>
              </div>

              {/* Smart Recommendations Box */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-5 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Consejos y Recomendaciones Inteligentes de Negocio
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tickets Table & Product Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets Table (2 cols) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Tickets de Venta ({report.tickets.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Selecciona un ticket para auditar los productos vendidos y desglose
                      </p>
                    </div>
                  </div>

                  {report.tickets.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No se encontraron tickets registrados para la fecha o período seleccionado ({reportSelectedDate}).
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Código</th>
                            <th className="px-3 py-2">Hora</th>
                            <th className="px-3 py-2">Tipo / Pago</th>
                            <th className="px-3 py-2">Items</th>
                            <th className="px-3 py-2 text-right">Total</th>
                            <th className="px-3 py-2 text-right">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                          {report.tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {t.reservation_code}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                                {new Date(t.created_at).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                                  {t.payment_method || 'Efectivo'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                {t.items?.reduce((s, it) => s + it.quantity, 0) || 1} unid.
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                ${t.total.toFixed(2)}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTicketForDetail(t)}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 ml-auto"
                                >
                                  <Eye className="w-3 h-3" />
                                  Ver Ticket
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Column: Top Sellers & Stagnant Products */}
                <div className="space-y-4">
                  {/* Top Selling Products */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Productos Estrella del Período
                    </h4>
                    {report.topSelling.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Sin datos suficientes en esta fecha.</p>
                    ) : (
                      <div className="space-y-2">
                        {report.topSelling.map((p, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {p.quantity} ventas registradas
                              </span>
                            </div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ${p.revenue.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stagnant Products (Sin movimiento) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Inventario Sin Movimiento
                    </h4>
                    {report.stagnantProducts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Todo el inventario tiene rotación activa.</p>
                    ) : (
                      <div className="space-y-2">
                        {report.stagnantProducts.map((p, i) => (
                          <div
                            key={i}
                            className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                0 ventas en el período
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              {p.stock_quantity} en bodega
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tournament Financial Accounting Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Contabilidad de Torneos e Inscripciones ({report.tournamentsSummary?.length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Recaudación directa por cuotas de inscripción de jugadores y costos de premios asignados
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold px-3 py-1 rounded-lg">
                      Recaudado: ${report.tournamentRevenue.toFixed(2)} MXN
                    </span>
                    <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold px-3 py-1 rounded-lg">
                      Utilidad Neta: ${(report.tournamentRevenue - report.tournamentCost).toFixed(2)} MXN
                    </span>
                  </div>
                </div>

                {!report.tournamentsSummary || report.tournamentsSummary.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No hay torneos registrados para el período seleccionado ({reportSelectedDate}). Las inscripciones de nuevos torneos se contabilizarán automáticamente aquí.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Torneo / Juego</th>
                          <th className="px-3 py-2">Fecha Evento</th>
                          <th className="px-3 py-2 text-center">Inscritos Pagados</th>
                          <th className="px-3 py-2 text-right">Cuota Entrada</th>
                          <th className="px-3 py-2 text-right">Recaudación Total</th>
                          <th className="px-3 py-2 text-right">Gasto en Premios</th>
                          <th className="px-3 py-2 text-right">Ganancia Neta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                        {report.tournamentsSummary.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-slate-900 dark:text-white block">{t.name}</span>
                              <span className="text-[10px] text-slate-500">{t.game} • {t.format}</span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                              {new Date(t.event_date).toLocaleDateString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                              {t.paid_participants} duelistas
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                              ${t.entry_fee.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              ${t.revenue.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                              ${t.prize_budget.toFixed(2)}
                            </td>
                            <td className={`px-3 py-2.5 text-right font-mono font-bold ${
                              t.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              ${t.net_profit.toFixed(2)} MXN
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 5: EMPLEADOS Y ROLES */}
        {/* ========================================================================= */}
        {activeTab === 'team' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Control de Personal y Roles</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Asigna permisos a cajeros, administradores y jueces
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar Empleado
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol / Permisos</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{m.user_name || 'Empleado'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{m.user_email || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase font-bold">
                            {m.role}
                          </span>
                          {m.can_delete_inventory && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              Eliminar Stock
                            </span>
                          )}
                          {m.can_edit_inventory && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Editar Stock
                            </span>
                          )}
                          {m.can_manage_tournaments && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Torneos
                            </span>
                          )}
                          {m.can_view_finance && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Finanzas
                            </span>
                          )}
                          {m.can_create_tickets && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              Cobro POS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            dataStore.removeMember(m.id);
                            refreshCurrentData();
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: AJUSTES DE TIENDA */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in max-w-3xl shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Configuración de la Tienda</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Información visible en tu Storefront público y reservas
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (settingsPhone && !isValidMexicanPhone(settingsPhone)) {
                  alert('El teléfono debe tener exactamente 10 dígitos numéricos (México +52).');
                  return;
                }
                if (settingsWhatsapp && !isValidMexicanPhone(settingsWhatsapp)) {
                  alert('El WhatsApp debe tener exactamente 10 dígitos numéricos (México +52).');
                  return;
                }
                alert('Ajustes guardados con éxito.');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Nombre de la Tienda</label>
                <input
                  type="text"
                  defaultValue={currentTenant.name}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Eslogan / Tagline</label>
                <input
                  type="text"
                  defaultValue={currentTenant.tagline}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Dirección Física</label>
                <input
                  type="text"
                  defaultValue={currentTenant.address}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Teléfono Celular</label>
                    <span className="text-[10px] text-slate-400 font-mono">{settingsPhone.length}/10</span>
                  </div>
                  <input
                    type="tel"
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(sanitizeMexicanPhone(e.target.value))}
                    maxLength={10}
                    placeholder="10 dígitos (ej. 5512345678)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Solo números, 10 dígitos (sin lada +52 ni caracteres especiales).</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">WhatsApp de Tienda</label>
                    <span className="text-[10px] text-slate-400 font-mono">{settingsWhatsapp.length}/10</span>
                  </div>
                  <input
                    type="tel"
                    value={settingsWhatsapp}
                    onChange={(e) => setSettingsWhatsapp(sanitizeMexicanPhone(e.target.value))}
                    maxLength={10}
                    placeholder="10 dígitos (ej. 5587654321)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Solo números, 10 dígitos (sin lada +52 ni caracteres especiales).</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Sección de Contrataciones</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Muestra un banner de &quot;Buscamos personal&quot; en tu tienda online
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={currentTenant.is_hiring}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Título de la vacante"
                  defaultValue={currentTenant.hiring_title}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        tenantId={currentTenantId}
        onScanSuccess={handleScanSuccess}
      />

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct.id ? 'Editar Producto' : 'Dar de Alta Producto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Ej. Charizard ex o Refresco Coca-Cola"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Código de Barras</label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, barcode: e.target.value })
                    }
                    placeholder="Ej. 0820650853412"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Categoría *</label>
                  <select
                    value={editingProduct.category || 'tcg_single'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="tcg_single">Singles TCG (Cartas sueltas)</option>
                    <option value="tcg_sealed">Producto Sellado / Sobres & Cajas</option>
                    <option value="accessory">Accesorios (Tapetes, Micas, Dados)</option>
                    <option value="board_game">Juegos de Mesa</option>
                    <option value="apparel">Ropa & Mochilas</option>
                    <option value="poster">Pósters de Colección</option>
                    <option value="snack">Cafetería & Snacks</option>
                    <option value="beverage">Bebidas & Refrescos</option>
                  </select>
                </div>
              </div>

              {editingProduct.category === 'tcg_single' && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Juego TCG</label>
                    <select
                      value={editingProduct.tcg_game || 'Pokemon'}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, tcg_game: e.target.value as TCGGame })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="Pokemon">Pokémon</option>
                      <option value="Magic">Magic</option>
                      <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                      <option value="One Piece">One Piece</option>
                      <option value="Lorcana">Lorcana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Condición</label>
                    <select
                      value={editingProduct.card_condition || 'NM'}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          card_condition: e.target.value as CardCondition,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="NM">Near Mint (NM)</option>
                      <option value="LP">Lightly Played (LP)</option>
                      <option value="MP">Moderately Played (MP)</option>
                      <option value="HP">Heavily Played (HP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Set / Edición</label>
                    <input
                      type="text"
                      value={editingProduct.card_set || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, card_set: e.target.value })
                      }
                      placeholder="Ej. Obsidian Flames"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Precio Venta ($) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editingProduct.price ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Precio Costo ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingProduct.cost_price ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Stock Cantidad *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock_quantity ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Low Stock Alert Settings (Audio 2 & 3) */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Alerta de Stock Bajo Configurable
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Activa una notificación visual cuando las existencias alcancen este nivel
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingProduct.low_stock_alert_enabled !== false}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        low_stock_alert_enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                {editingProduct.low_stock_alert_enabled !== false && (
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Avisar cuando queden menos o igual a:
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.low_stock_threshold ?? 5}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          low_stock_threshold: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs font-bold"
                    />
                    <span className="text-xs text-slate-500">unidades</span>
                  </div>
                )}
              </div>

              {/* Public Marketplace Sync Toggle (Audio 1 & User Request) */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Publicar en Marketplace TCG
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Muestra este producto en el Marketplace público (cartas sueltas, cajas selladas, micas, tapetes, dados, etc.)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editingProduct.show_in_marketplace !== false}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      show_in_marketplace: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={editingProduct.image_url || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, image_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              {/* Variations section for Snacks/Cafeteria */}
              {!editingProduct.id && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ¿Tiene variaciones? (Ej. hamburguesa sencilla/doble, sabor refresco)
                    </span>
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => {
                        setHasVariations(e.target.checked);
                        if (e.target.checked && tempVariations.length === 0) {
                          setTempVariations([
                            { name: 'Opción', option_value: 'Estándar', price_modifier: 0 },
                          ]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {hasVariations && (
                    <div className="space-y-2 pt-2">
                      {tempVariations.map((v, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Ej. Sabor"
                            value={v.name}
                            onChange={(e) => {
                              const copy = [...tempVariations];
                              copy[i].name = e.target.value;
                              setTempVariations(copy);
                            }}
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Ej. Manzana o Doble"
                            value={v.option_value}
                            onChange={(e) => {
                              const copy = [...tempVariations];
                              copy[i].option_value = e.target.value;
                              setTempVariations(copy);
                            }}
                            className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          />
                          <input
                            type="number"
                            placeholder="+$"
                            value={v.price_modifier}
                            onChange={(e) => {
                              const copy = [...tempVariations];
                              copy[i].price_modifier = parseFloat(e.target.value) || 0;
                              setTempVariations(copy);
                            }}
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setTempVariations(tempVariations.filter((_, idx) => idx !== i))
                            }
                            className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setTempVariations([
                            ...tempVariations,
                            { name: 'Opción', option_value: '', price_modifier: 0 },
                          ])
                        }
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline block pt-1 cursor-pointer"
                      >
                        + Agregar otra variación
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tournament Creation / Edit Modal */}
      {isTournModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTournId ? 'Editar Torneo' : 'Nuevo Torneo'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsTournModalOpen(false);
                  resetNewTournForm();
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTournament} className="space-y-3 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Nombre del Torneo *</label>
                <input
                  type="text"
                  required
                  value={newTourn.name}
                  onChange={(e) => setNewTourn({ ...newTourn, name: e.target.value })}
                  placeholder="Ej. Torneo Regional Yu-Gi-Oh!"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Juego *</label>
                  <select
                    value={newTourn.game}
                    onChange={(e) => setNewTourn({ ...newTourn, game: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                    <option value="Pokemon">Pokémon</option>
                    <option value="Magic">Magic</option>
                    <option value="One Piece">One Piece</option>
                    <option value="Lorcana">Lorcana</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Formato *</label>
                  <input
                    type="text"
                    required
                    value={newTourn.format}
                    onChange={(e) => setNewTourn({ ...newTourn, format: e.target.value })}
                    placeholder="Avanzado, Standard..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newTourn.event_date}
                    onChange={(e) => setNewTourn({ ...newTourn, event_date: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Hora Inicio</label>
                  <input
                    type="time"
                    value={newTourn.start_time}
                    onChange={(e) => setNewTourn({ ...newTourn, start_time: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Hora Cierre</label>
                  <input
                    type="time"
                    value={newTourn.end_time}
                    onChange={(e) => setNewTourn({ ...newTourn, end_time: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Sede / Ubicación</label>
                <input
                  type="text"
                  value={newTourn.location_name}
                  onChange={(e) => setNewTourn({ ...newTourn, location_name: e.target.value })}
                  placeholder={currentTenant.address || 'Local Principal'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Inscripción ($)</label>
                  <input
                    type="number"
                    value={newTourn.entry_fee}
                    onChange={(e) =>
                      setNewTourn({ ...newTourn, entry_fee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Cupo Máx.</label>
                  <input
                    type="number"
                    value={newTourn.max_participants}
                    onChange={(e) =>
                      setNewTourn({
                        ...newTourn,
                        max_participants: parseInt(e.target.value) || 24,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Ronda (Min)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={newTourn.round_duration_minutes || 45}
                    onChange={(e) =>
                      setNewTourn({
                        ...newTourn,
                        round_duration_minutes: parseInt(e.target.value) || 45,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Structured Prizes Form */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block text-amber-600 dark:text-amber-400">
                  Estructura de Premios para Flyer y Storefront:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 text-[10px] block">Premio 1er Lugar</label>
                    <input
                      type="text"
                      value={newTourn.first_place_prize}
                      onChange={(e) => setNewTourn({ ...newTourn, first_place_prize: e.target.value })}
                      placeholder="1 Booster Box + Tapete"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] block">Premio 2do Lugar</label>
                    <input
                      type="text"
                      value={newTourn.second_place_prize}
                      onChange={(e) => setNewTourn({ ...newTourn, second_place_prize: e.target.value })}
                      placeholder="12 Sobres Sellados"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 text-[10px] block">Premio 3er Lugar</label>
                    <input
                      type="text"
                      value={newTourn.third_place_prize}
                      onChange={(e) => setNewTourn({ ...newTourn, third_place_prize: e.target.value })}
                      placeholder="6 Sobres Sellados"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px] block">Top Cut / Otros</label>
                    <input
                      type="text"
                      value={newTourn.top_cut_prizes}
                      onChange={(e) => setNewTourn({ ...newTourn, top_cut_prizes: e.target.value })}
                      placeholder="Top 8: 2 Sobres c/u"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Upload with Client-Side WebP Compression */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-slate-700 dark:text-slate-300 block font-semibold">
                  Banner / Imagen del Torneo (Subir archivo o URL)
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    {isCompressingImage ? 'Optimizando a WebP...' : 'Subir Imagen (Auto WebP)'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileUpload}
                      className="hidden"
                      disabled={isCompressingImage}
                    />
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Se comprime y adapta en WebP (85%) automáticamente
                  </span>
                </div>

                <input
                  type="url"
                  value={newTourn.poster_image_url}
                  onChange={(e) => setNewTourn({ ...newTourn, poster_image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-[11px]"
                />

                {newTourn.poster_image_url && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mt-1 bg-slate-100 dark:bg-slate-900">
                    <img
                      src={newTourn.poster_image_url}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsTournModalOpen(false);
                    resetNewTournForm();
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {editingTournId ? 'Guardar Cambios' : 'Crear Torneo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Member Creation Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nuevo Miembro del Equipo</h3>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newMember.user_name}
                  onChange={(e) => setNewMember({ ...newMember, user_name: e.target.value })}
                  placeholder="Ej. Luis Ramírez"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Correo Electrónico</label>
                <input
                  type="email"
                  value={newMember.user_email}
                  onChange={(e) => setNewMember({ ...newMember, user_email: e.target.value })}
                  placeholder="luis@tienda.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-semibold">Rol Base</label>
                <select
                  value={newMember.role}
                  onChange={(e) =>
                    setNewMember({ ...newMember, role: e.target.value as TenantRole })
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="admin">Administrador (Acceso general)</option>
                  <option value="editor">Cajero / Operador de Tienda</option>
                  <option value="viewer">Juez / Solo Lectura</option>
                </select>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                  Permisos Específicos Delegables:
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMember.can_delete_inventory}
                    onChange={(e) => setNewMember({ ...newMember, can_delete_inventory: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Puede eliminar productos de inventario</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMember.can_edit_inventory}
                    onChange={(e) => setNewMember({ ...newMember, can_edit_inventory: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Puede editar precios y existencias</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMember.can_manage_tournaments}
                    onChange={(e) => setNewMember({ ...newMember, can_manage_tournaments: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Puede organizar torneos y eventos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMember.can_view_finance}
                    onChange={(e) => setNewMember({ ...newMember, can_view_finance: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Puede ver finanzas, costos y auditoría</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMember.can_create_tickets}
                    onChange={(e) => setNewMember({ ...newMember, can_create_tickets: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Puede cobrar en mostrador y emitir tickets</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tournament Flyer Modal (Audio 4) */}
      {selectedTournForFlyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Generador de Flyer para Redes Sociales
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTournForFlyer(null);
                  setFlyerCopied(false);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flyer Preview Card - Solid colors, premium layout */}
            <div className="p-6 bg-slate-950 text-white space-y-4">
              {/* Top Banner Image if uploaded */}
              {selectedTournForFlyer.poster_image_url && (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <img
                    src={selectedTournForFlyer.poster_image_url}
                    alt={selectedTournForFlyer.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  {currentTenant.logo_url ? (
                    <img
                      src={currentTenant.logo_url}
                      alt={currentTenant.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-900"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                      {currentTenant.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-black tracking-widest uppercase text-blue-400 font-mono">
                    {currentTenant.name}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {selectedTournForFlyer.game} • {selectedTournForFlyer.format}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {selectedTournForFlyer.name}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedTournForFlyer.location_name || currentTenant.address || 'Tienda Principal'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fecha</span>
                    <span className="text-xs font-bold">
                      {new Date(selectedTournForFlyer.event_date).toLocaleDateString('es-MX', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Horario</span>
                    <span className="text-xs font-bold">
                      {selectedTournForFlyer.start_time || '16:00'} a {selectedTournForFlyer.end_time || '21:00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prizes Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase text-amber-400 block">
                  Premios del Torneo
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-amber-400 font-bold">1er Lugar:</span>
                    <span className="font-semibold text-white">
                      {selectedTournForFlyer.first_place_prize || selectedTournForFlyer.prizes_description}
                    </span>
                  </div>
                  {selectedTournForFlyer.second_place_prize && (
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-300 font-bold">2do Lugar:</span>
                      <span className="font-medium text-slate-200">
                        {selectedTournForFlyer.second_place_prize}
                      </span>
                    </div>
                  )}
                  {selectedTournForFlyer.third_place_prize && (
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">3er Lugar:</span>
                      <span className="text-slate-300">{selectedTournForFlyer.third_place_prize}</span>
                    </div>
                  )}
                  {selectedTournForFlyer.top_cut_prizes && (
                    <div className="text-[11px] text-slate-400 pt-1 text-center">
                      {selectedTournForFlyer.top_cut_prizes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">Inscripción</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {selectedTournForFlyer.entry_fee > 0 ? `$${selectedTournForFlyer.entry_fee} MXN` : 'GRATUITO'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Cupo</span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedTournForFlyer.max_participants} Jugadores
                  </span>
                </div>
              </div>
            </div>

            {/* Actions for Sharing */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 text-[11px]">
                Listo para compartir en Instagram Stories, WhatsApp y Facebook
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `🏆 ¡TORNEO EN ${currentTenant.name}! 🏆\n\n🎯 ${selectedTournForFlyer.name} (${selectedTournForFlyer.game} - ${selectedTournForFlyer.format})\n📅 Fecha: ${new Date(selectedTournForFlyer.event_date).toLocaleDateString('es-MX')}\n⏰ Horario: ${selectedTournForFlyer.start_time || '16:00'} a ${selectedTournForFlyer.end_time || '21:00'}\n📍 Lugar: ${selectedTournForFlyer.location_name || currentTenant.address}\n\n🎁 PREMIOS:\n🥇 1er Lugar: ${selectedTournForFlyer.first_place_prize || selectedTournForFlyer.prizes_description}\n🥈 2do Lugar: ${selectedTournForFlyer.second_place_prize || '6 Sobres'}\n🥉 3er Lugar: ${selectedTournForFlyer.third_place_prize || '3 Sobres'}\n\n🎟️ Inscripción: $${selectedTournForFlyer.entry_fee} MXN\n👥 Cupo: ${selectedTournForFlyer.max_participants} jugadores\n\n¡Aparta tu lugar en ${currentTenant.slug}!`;
                    navigator.clipboard.writeText(text);
                    setFlyerCopied(true);
                    setTimeout(() => setFlyerCopied(false), 3000);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {flyerCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {flyerCopied ? '¡Copiado al Portapapeles!' : 'Copiar Texto Redes'}
                </button>
                <button
                  type="button"
                  onClick={() => alert('Flyer guardado en formato compatible con redes sociales.')}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Live Brackets & Countdown Clock Modal */}
      {selectedTournForBracket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedTournForBracket.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {selectedTournForBracket.game} • {selectedTournForBracket.format}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedTournForBracket.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : selectedTournForBracket.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {selectedTournForBracket.status === 'in_progress'
                        ? 'Torneo en Curso'
                        : selectedTournForBracket.status === 'completed'
                        ? 'Torneo Concluido'
                        : 'Fase de Inscripciones'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control de tiempo por ronda, gestión de inscripciones y avance de llaves eliminatorias
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTournForBracket(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Countdown Clock & Status Bar */}
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-black/60 px-5 py-2 rounded-2xl border border-slate-700 font-mono text-3xl font-black tracking-wider text-emerald-400 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-amber-400" />
                  <span>
                    {String(
                      Math.floor(
                        (selectedTournForBracket.timer_seconds_left ??
                          (selectedTournForBracket.round_duration_minutes || 45) * 60) /
                          60
                      )
                    ).padStart(2, '0')}
                    :
                    {String(
                      (selectedTournForBracket.timer_seconds_left ??
                        (selectedTournForBracket.round_duration_minutes || 45) * 60) %
                        60
                    ).padStart(2, '0')}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-300 block">
                    {selectedTournForBracket.timer_is_running
                      ? 'Ronda Activa (Tiempo Corriendo)'
                      : (selectedTournForBracket.timer_seconds_left === 0
                      ? '¡Tiempo Terminado!'
                      : 'Reloj en Pausa')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Duración oficial: {selectedTournForBracket.round_duration_minutes || 45} minutos por ronda
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleTimer(selectedTournForBracket.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    selectedTournForBracket.timer_is_running
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {selectedTournForBracket.timer_is_running ? (
                    <>
                      <Pause className="w-4 h-4" /> Pausar Ronda
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Iniciar Ronda
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleResetTimer(selectedTournForBracket.id)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Reiniciar Tiempo
                </button>
              </div>
            </div>

            {/* Scrollable Body: Participants and Bracket */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Registration & Participants Banner */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Participantes Registrados ({selectedTournForBracket.participants_list?.length || 0} /{' '}
                      {selectedTournForBracket.max_participants})
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Inscribe a los duelistas y genera automáticamente el cuadro de eliminación directa
                    </p>
                  </div>

                  {selectedTournForBracket.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleStartTournament(selectedTournForBracket.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
                    >
                      <UserCheck className="w-4 h-4" />
                      Cerrar Inscripciones y Comenzar Torneo
                    </button>
                  )}
                </div>

                {/* Quick Add Participant Input */}
                {selectedTournForBracket.status !== 'completed' && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Nombre del duelista..."
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      className="flex-1 min-w-[160px] px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Mazo / Arquetipo (Ej. Kashtira)..."
                      value={newParticipantDeck}
                      onChange={(e) => setNewParticipantDeck(e.target.value)}
                      className="flex-1 min-w-[160px] px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddParticipant(selectedTournForBracket.id)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      + Inscribir
                    </button>
                  </div>
                )}

                {/* List of Enrolled Players Pills */}
                {selectedTournForBracket.participants_list &&
                  selectedTournForBracket.participants_list.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedTournForBracket.participants_list.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex items-center gap-1.5"
                        >
                          <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">{p.name}</span>
                          {p.deck_name && (
                            <span className="text-[10px] text-slate-400">({p.deck_name})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Real-time Bracket Tree (3 Columns: Cuartos -> Semis -> Final) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Llaves del Torneo en Vivo (Eliminatoria Directa)
                  </h4>
                  <span className="text-xs text-slate-500">
                    Regla oficial: Si la ronda expira sin ganador, el juez puede declarar Doble Derrota.
                  </span>
                </div>

                {(!selectedTournForBracket.bracket_matches ||
                  selectedTournForBracket.bracket_matches.length === 0) ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <Swords className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Aún no se han generado las llaves de este torneo.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Haz clic en "Cerrar Inscripciones y Comenzar Torneo" para iniciar los emparejamientos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Round 1: Cuartos de Final */}
                    <div className="space-y-3">
                      <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Cuartos de Final (Ronda 1)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {selectedTournForBracket.bracket_matches
                          .filter((m) => m.round === 1)
                          .map((match) => (
                            <div
                              key={match.id}
                              className={`p-3.5 rounded-2xl border transition shadow-xs space-y-2.5 ${
                                match.status === 'completed'
                                  ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                                  : 'bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-900/60 ring-1 ring-blue-500/10'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                <span className="font-bold">Mesa #{match.match_number}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-semibold ${
                                    match.status === 'completed'
                                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                  }`}
                                >
                                  {match.status === 'completed'
                                    ? match.winner_id === 'double_loss'
                                      ? 'Doble Derrota'
                                      : 'Finalizada'
                                    : 'En Curso'}
                                </span>
                              </div>

                              {/* Player 1 */}
                              <div
                                className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                                  match.winner_id === match.player1.id
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300'
                                    : match.winner_id === 'double_loss' || (match.winner_id && match.winner_id !== match.player1.id)
                                    ? 'opacity-50 text-slate-400'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="truncate pr-1">
                                  <span className="block truncate">{match.player1.name}</span>
                                  {match.player1.deck_name && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      {match.player1.deck_name}
                                    </span>
                                  )}
                                </div>
                                {match.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdvanceMatch(
                                        selectedTournForBracket.id,
                                        match.id,
                                        match.player1.id
                                      )
                                    }
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                                  >
                                    Gana
                                  </button>
                                ) : match.winner_id === match.player1.id ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : null}
                              </div>

                              {/* Player 2 */}
                              <div
                                className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                                  match.winner_id === match.player2.id
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300'
                                    : match.winner_id === 'double_loss' || (match.winner_id && match.winner_id !== match.player2.id)
                                    ? 'opacity-50 text-slate-400'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="truncate pr-1">
                                  <span className="block truncate">{match.player2.name}</span>
                                  {match.player2.deck_name && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      {match.player2.deck_name}
                                    </span>
                                  )}
                                </div>
                                {match.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdvanceMatch(
                                        selectedTournForBracket.id,
                                        match.id,
                                        match.player2.id
                                      )
                                    }
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                                  >
                                    Gana
                                  </button>
                                ) : match.winner_id === match.player2.id ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : null}
                              </div>

                              {/* Double Loss Button if match active */}
                              {match.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdvanceMatch(
                                      selectedTournForBracket.id,
                                      match.id,
                                      'double_loss'
                                    )
                                  }
                                  className="w-full py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                >
                                  Ambos Pierden (Tiempo Excedido)
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Round 2: Semifinales */}
                    <div className="space-y-3">
                      <div className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Semifinales (Ronda 2)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {selectedTournForBracket.bracket_matches
                          .filter((m) => m.round === 2)
                          .map((match) => (
                            <div
                              key={match.id}
                              className={`p-3.5 rounded-2xl border transition shadow-xs space-y-2.5 ${
                                match.status === 'completed'
                                  ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                                  : 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-900/60 ring-1 ring-indigo-500/10'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                <span className="font-bold">Mesa #{match.match_number}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-semibold ${
                                    match.status === 'completed'
                                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                  }`}
                                >
                                  {match.status === 'completed'
                                    ? match.winner_id === 'double_loss'
                                      ? 'Doble Derrota'
                                      : 'Finalizada'
                                    : 'En Curso'}
                                </span>
                              </div>

                              {/* Player 1 */}
                              <div
                                className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                                  match.winner_id === match.player1.id
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300'
                                    : match.winner_id === 'double_loss' || (match.winner_id && match.winner_id !== match.player1.id)
                                    ? 'opacity-50 text-slate-400'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="truncate pr-1">
                                  <span className="block truncate">{match.player1.name}</span>
                                  {match.player1.deck_name && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      {match.player1.deck_name}
                                    </span>
                                  )}
                                </div>
                                {match.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdvanceMatch(
                                        selectedTournForBracket.id,
                                        match.id,
                                        match.player1.id
                                      )
                                    }
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                                  >
                                    Gana
                                  </button>
                                ) : match.winner_id === match.player1.id ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : null}
                              </div>

                              {/* Player 2 */}
                              <div
                                className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                                  match.winner_id === match.player2.id
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300'
                                    : match.winner_id === 'double_loss' || (match.winner_id && match.winner_id !== match.player2.id)
                                    ? 'opacity-50 text-slate-400'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="truncate pr-1">
                                  <span className="block truncate">{match.player2.name}</span>
                                  {match.player2.deck_name && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      {match.player2.deck_name}
                                    </span>
                                  )}
                                </div>
                                {match.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdvanceMatch(
                                        selectedTournForBracket.id,
                                        match.id,
                                        match.player2.id
                                      )
                                    }
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shrink-0"
                                  >
                                    Gana
                                  </button>
                                ) : match.winner_id === match.player2.id ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : null}
                              </div>

                              {/* Double Loss */}
                              {match.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdvanceMatch(
                                      selectedTournForBracket.id,
                                      match.id,
                                      'double_loss'
                                    )
                                  }
                                  className="w-full py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                >
                                  Ambos Pierden (Tiempo Excedido)
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Round 3: Gran Final & Champion Crown */}
                    <div className="space-y-3">
                      <div className="bg-amber-100 dark:bg-amber-950/80 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          Gran Final (Ronda 3)
                        </span>
                      </div>

                      <div className="space-y-3">
                        {selectedTournForBracket.bracket_matches
                          .filter((m) => m.round === 3)
                          .map((match) => (
                            <div
                              key={match.id}
                              className={`p-4 rounded-2xl border transition shadow-sm space-y-3 ${
                                match.status === 'completed'
                                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                                  : 'bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/20'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  Duelo Definitivo por el Título
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-semibold ${
                                    match.status === 'completed'
                                      ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  }`}
                                >
                                  {match.status === 'completed' ? 'Finalizado' : 'En Curso'}
                                </span>
                              </div>

                              {/* Finalist 1 */}
                              <div
                                className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                                  match.winner_id === match.player1.id
                                    ? 'bg-amber-100 dark:bg-amber-950 border border-amber-400 font-black text-amber-900 dark:text-amber-200'
                                    : match.winner_id
                                    ? 'opacity-40'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div>
                                  <span className="block font-bold">{match.player1.name}</span>
                                  {match.player1.deck_name && (
                                    <span className="text-[10px] text-slate-400">{match.player1.deck_name}</span>
                                  )}
                                </div>
                                {match.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdvanceMatch(
                                        selectedTournForBracket.id,
                                        match.id,
                                        match.player1.id
                                      )
                                    }
                                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                                  >
                                    ¡CAMPEÓN!
                                  </button>
                                ) : match.winner_id === match.player1.id ? (
                                  <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                                ) : null}
                              </div>

                              {/* Finalist 2 */}
                              <div
                                className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                                  match.winner_id === match.player2.id
                                    ? 'bg-amber-100 dark:bg-amber-950 border border-amber-400 font-black text-amber-900 dark:text-amber-200'
                                    : match.winner_id
                                    ? 'opacity-40'
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div>
                                  <span className="block font-bold">{match.player2.name}</span>
                                  {match.player2.deck_name && (
                                    <span className="text-[10px] text-slate-400">{match.player2.deck_name}</span>
                                  )}
                                </div>
                                {match.status !== 'completed' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdvanceMatch(
                                        selectedTournForBracket.id,
                                        match.id,
                                        match.player2.id
                                      )
                                    }
                                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                                  >
                                    ¡CAMPEÓN!
                                  </button>
                                ) : match.winner_id === match.player2.id ? (
                                  <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                                ) : null}
                              </div>

                              {/* Champion announcement box */}
                              {match.status === 'completed' && match.winner_id && (
                                <div className="p-3 bg-amber-500 text-white rounded-xl text-center space-y-1 shadow-md">
                                  <span className="text-[10px] uppercase font-bold tracking-wider block">
                                    ¡Campeón Oficial del Torneo!
                                  </span>
                                  <div className="text-sm font-black">
                                    {match.winner_id === match.player1.id
                                      ? match.player1.name
                                      : match.player2.name}
                                  </div>
                                  <p className="text-[10px] text-amber-100">
                                    Premio: {selectedTournForBracket.first_place_prize || 'Booster Box + Tapete'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal (Audio 3) */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm">
                  {currentTenant.name}
                </h4>
                <p className="text-[10px] text-slate-500">{currentTenant.address || 'Tienda Oficial'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer font-sans"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>TICKET:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {selectedTicketForDetail.reservation_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{new Date(selectedTicketForDetail.created_at).toLocaleString('es-MX')}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span>{selectedTicketForDetail.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>PAGO:</span>
                <span className="uppercase">{selectedTicketForDetail.payment_method || 'Efectivo'}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 dark:border-slate-800 py-2 space-y-1">
              <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase">
                <span>Prod / Cant</span>
                <span>Subtotal</span>
              </div>
              {selectedTicketForDetail.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-800 dark:text-slate-200">
                  <span className="truncate pr-2">
                    {it.quantity}x {it.product_name}
                  </span>
                  <span className="shrink-0">${it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>TOTAL:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ${selectedTicketForDetail.total.toFixed(2)} MXN
                </span>
              </div>
              <p className="text-[9px] text-center text-slate-400 pt-2 font-sans">
                ¡Gracias por tu compra en {currentTenant.name}!
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-sans">
              <button
                type="button"
                onClick={() => setSelectedTicketForDetail(null)}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Footer with Legal & Privacy Modals */}
      <Footer variant="dashboard" storeName={currentTenant.name} />
    </div>
  );
}

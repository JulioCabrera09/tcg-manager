'use client';

import {
  Tenant,
  TenantProduct,
  GlobalProduct,
  Tournament,
  TournamentMatch,
  Order,
  TenantMember,
  OrderItem,
  Auction,
  AuctionBid,
  AuctionMessage,
  UserProfile,
  VirtualBinder,
  BinderCard,
  CardOffer,
  OfferMessage,
  SalesRecord,
} from '@/types/database';
import {
  INITIAL_TENANTS,
  INITIAL_PRODUCTS,
  INITIAL_GLOBAL_PRODUCTS,
  INITIAL_TOURNAMENTS,
  INITIAL_ORDERS,
  INITIAL_MEMBERS,
  INITIAL_AUCTIONS,
  INITIAL_AUCTION_MESSAGES,
  INITIAL_USERS,
  INITIAL_BINDERS,
  INITIAL_BINDER_CARDS,
  INITIAL_OFFERS,
  INITIAL_OFFER_MESSAGES,
  INITIAL_SALES_RECORDS,
} from './mockData';
import { syncService } from '@/lib/supabase/syncService';

const STORAGE_KEYS = {
  TENANTS: 'tcg_tenants_v1',
  PRODUCTS: 'tcg_products_v1',
  GLOBAL_PRODUCTS: 'tcg_global_products_v1',
  TOURNAMENTS: 'tcg_tournaments_v1',
  ORDERS: 'tcg_orders_v1',
  MEMBERS: 'tcg_members_v1',
  ACTIVE_TENANT: 'tcg_active_tenant_id',
  AUCTIONS: 'tcg_auctions_v1',
  AUCTION_MESSAGES: 'tcg_auction_messages_v1',
  USERS: 'tcg_users_v1',
  BINDERS: 'tcg_binders_v1',
  BINDER_CARDS: 'tcg_binder_cards_v1',
  OFFERS: 'tcg_offers_v1',
  OFFER_MESSAGES: 'tcg_offer_messages_v1',
  SALES_RECORDS: 'tcg_sales_records_v1',
  CURRENT_USER_ID: 'tcg_current_user_id_v1',
};

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

export const dataStore = {
  // TENANTS
  getTenants(): Tenant[] {
    return getStorage<Tenant[]>(STORAGE_KEYS.TENANTS, INITIAL_TENANTS);
  },

  getTenantBySlug(slug: string): Tenant | undefined {
    const tenants = this.getTenants();
    return tenants.find((t) => t.slug.toLowerCase() === slug.toLowerCase());
  },

  getTenantById(id: string): Tenant | undefined {
    const tenants = this.getTenants();
    return tenants.find((t) => t.id === id);
  },

  updateTenant(updated: Partial<Tenant> & { id: string }): Tenant {
    const list = this.getTenants();
    const index = list.findIndex((t) => t.id === updated.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...updated };
      setStorage(STORAGE_KEYS.TENANTS, list);
      return list[index];
    }
    throw new Error('Tenant no encontrado');
  },

  addTenant(newTenant: Omit<Tenant, 'id' | 'created_at'>): Tenant {
    const list = this.getTenants();
    const created: Tenant = {
      ...newTenant,
      id: `tenant-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.push(created);
    setStorage(STORAGE_KEYS.TENANTS, list);
    return created;
  },

  getActiveTenantId(): string {
    return getStorage<string>(STORAGE_KEYS.ACTIVE_TENANT, INITIAL_TENANTS[0].id);
  },

  setActiveTenantId(id: string) {
    setStorage(STORAGE_KEYS.ACTIVE_TENANT, id);
  },

  // PRODUCTS (TENANT INVENTORY)
  getProducts(tenantId?: string): TenantProduct[] {
    const all = getStorage<TenantProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return tenantId ? all.filter((p) => p.tenant_id === tenantId) : all;
  },

  getProductByBarcode(tenantId: string, barcode: string): TenantProduct | undefined {
    const products = this.getProducts(tenantId);
    return products.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === barcode.trim().toLowerCase()
    );
  },

  addProduct(product: Omit<TenantProduct, 'id' | 'created_at'>): TenantProduct {
    const tenant = this.getTenantById(product.tenant_id);
    const currentProducts = this.getProducts(product.tenant_id);
    
    // Check tier limit (e.g. 500 items max)
    const limit = tenant?.storage_limit_items || 500;
    if (currentProducts.length >= limit) {
      throw new Error(`Límite alcanzado: Tu plan piloto permite un máximo de ${limit} productos.`);
    }

    const all = getStorage<TenantProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const created: TenantProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    all.unshift(created);
    setStorage(STORAGE_KEYS.PRODUCTS, all);
    return created;
  },

  updateProduct(updated: Partial<TenantProduct> & { id: string }): TenantProduct {
    const all = getStorage<TenantProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = all.findIndex((p) => p.id === updated.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updated };
      setStorage(STORAGE_KEYS.PRODUCTS, all);
      if (updated.stock_quantity !== undefined) {
        syncService.syncProductStock(all[idx].id, all[idx].tenant_id, all[idx].stock_quantity);
      }
      return all[idx];
    }
    throw new Error('Producto no encontrado');
  },

  deleteProduct(id: string) {
    const all = getStorage<TenantProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = all.filter((p) => p.id !== id);
    setStorage(STORAGE_KEYS.PRODUCTS, filtered);
  },

  // GLOBAL PRODUCTS (MAESTRO DE CÓDIGOS DE BARRA)
  getGlobalProducts(): GlobalProduct[] {
    return getStorage<GlobalProduct[]>(STORAGE_KEYS.GLOBAL_PRODUCTS, INITIAL_GLOBAL_PRODUCTS);
  },

  getGlobalProductByBarcode(barcode: string): GlobalProduct | undefined {
    const list = this.getGlobalProducts();
    return list.find(
      (g) => g.barcode && g.barcode.trim().toLowerCase() === barcode.trim().toLowerCase()
    );
  },

  addGlobalProduct(item: Omit<GlobalProduct, 'id'>): GlobalProduct {
    const list = this.getGlobalProducts();
    const created: GlobalProduct = {
      ...item,
      id: `glob-${Date.now()}`,
    };
    list.unshift(created);
    setStorage(STORAGE_KEYS.GLOBAL_PRODUCTS, list);
    return created;
  },

  // TOURNAMENTS
  getTournaments(tenantId?: string): Tournament[] {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    return tenantId ? all.filter((t) => t.tenant_id === tenantId) : all;
  },

  getTournamentById(id: string): Tournament | undefined {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    return all.find((t) => t.id === id);
  },

  addTournament(tourn: Omit<Tournament, 'id' | 'created_at'>): Tournament {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const created: Tournament = {
      ...tourn,
      id: `tourn-${Date.now()}`,
      registered_count: 0,
      created_at: new Date().toISOString(),
    };
    all.unshift(created);
    setStorage(STORAGE_KEYS.TOURNAMENTS, all);
    return created;
  },

  updateTournament(updated: Partial<Tournament> & { id: string }): Tournament {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const idx = all.findIndex((t) => t.id === updated.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updated };
      setStorage(STORAGE_KEYS.TOURNAMENTS, all);
      return all[idx];
    }
    throw new Error('Torneo no encontrado');
  },

  deleteTournament(id: string) {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const filtered = all.filter((t) => t.id !== id);
    setStorage(STORAGE_KEYS.TOURNAMENTS, filtered);
  },

  startTournamentAndGenerateBracket(tournamentId: string): Tournament {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const idx = all.findIndex((t) => t.id === tournamentId);
    if (idx < 0) throw new Error('Torneo no encontrado');

    const tourn = { ...all[idx] };
    const defaultParticipants = [
      { id: 'p1', name: 'Gabriel "Kaiba" Méndez', deck: 'Lugia VSTAR / Archeops', paid: true },
      { id: 'p2', name: 'Andrea Ruiz', deck: 'Gardevoir ex', paid: true },
      { id: 'p3', name: 'Carlos "Yugi" Vega', deck: 'Miraidon ex Turbo', paid: true },
      { id: 'p4', name: 'Sofía Ramos', deck: 'Charizard ex Pidgeot', paid: true },
      { id: 'p5', name: 'Fernando Morales', deck: 'Roaring Moon ex', paid: true },
      { id: 'p6', name: 'Daniela Castro', deck: 'Giratina VSTAR Lost', paid: true },
      { id: 'p7', name: 'Mateo Jiménez', deck: 'Iron Valiant ex', paid: true },
      { id: 'p8', name: 'Valentina Ortiz', deck: 'Lost Box Sableye', paid: true },
    ];

    const participants = tourn.participants_list && tourn.participants_list.length >= 2 
      ? tourn.participants_list 
      : defaultParticipants;

    // Generate bracket matches (Cuartos -> Semis -> Final)
    const matches: TournamentMatch[] = [
      {
        id: `m-${tournamentId}-1`,
        round: 1,
        round_name: 'Cuartos de Final (Mesa 1)',
        match_number: 1,
        player1: { id: participants[0]?.id || 'p1', name: participants[0]?.name || 'Jugador 1', score: 0 },
        player2: { id: participants[1]?.id || 'p2', name: participants[1]?.name || 'Jugador 2', score: 0 },
        status: 'in_progress',
      },
      {
        id: `m-${tournamentId}-2`,
        round: 1,
        round_name: 'Cuartos de Final (Mesa 2)',
        match_number: 2,
        player1: { id: participants[2]?.id || 'p3', name: participants[2]?.name || 'Jugador 3', score: 0 },
        player2: { id: participants[3]?.id || 'p4', name: participants[3]?.name || 'Jugador 4', score: 0 },
        status: 'in_progress',
      },
      {
        id: `m-${tournamentId}-3`,
        round: 1,
        round_name: 'Cuartos de Final (Mesa 3)',
        match_number: 3,
        player1: { id: participants[4]?.id || 'p5', name: participants[4]?.name || 'Jugador 5', score: 0 },
        player2: { id: participants[5]?.id || 'p6', name: participants[5]?.name || 'Jugador 6', score: 0 },
        status: 'in_progress',
      },
      {
        id: `m-${tournamentId}-4`,
        round: 1,
        round_name: 'Cuartos de Final (Mesa 4)',
        match_number: 4,
        player1: { id: participants[6]?.id || 'p7', name: participants[6]?.name || 'Jugador 7', score: 0 },
        player2: { id: participants[7]?.id || 'p8', name: participants[7]?.name || 'Jugador 8', score: 0 },
        status: 'in_progress',
      },
      // Semifinales (Round 2)
      {
        id: `m-${tournamentId}-5`,
        round: 2,
        round_name: 'Semifinal A (Mesa 1)',
        match_number: 5,
        player1: { id: '', name: 'Ganador Cuartos 1', score: 0 },
        player2: { id: '', name: 'Ganador Cuartos 2', score: 0 },
        status: 'pending',
      },
      {
        id: `m-${tournamentId}-6`,
        round: 2,
        round_name: 'Semifinal B (Mesa 2)',
        match_number: 6,
        player1: { id: '', name: 'Ganador Cuartos 3', score: 0 },
        player2: { id: '', name: 'Ganador Cuartos 4', score: 0 },
        status: 'pending',
      },
      // Gran Final (Round 3)
      {
        id: `m-${tournamentId}-7`,
        round: 3,
        round_name: 'Gran Final Championship (Mesa Principal)',
        match_number: 7,
        player1: { id: '', name: 'Ganador Semifinal A', score: 0 },
        player2: { id: '', name: 'Ganador Semifinal B', score: 0 },
        status: 'pending',
      },
    ];

    const roundDuration = tourn.round_duration_minutes || 45;
    tourn.status = 'in_progress';
    tourn.current_round = 1;
    tourn.round_duration_minutes = roundDuration;
    tourn.timer_seconds_left = roundDuration * 60;
    tourn.timer_is_running = true;
    tourn.participants_list = participants;
    tourn.bracket_matches = matches;
    tourn.registered_count = participants.length;

    all[idx] = tourn;
    setStorage(STORAGE_KEYS.TOURNAMENTS, all);
    return tourn;
  },

  advanceTournamentMatchWinner(
    tournamentId: string,
    matchId: string,
    winnerId: string | 'double_loss' | 'draw'
  ): Tournament {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const idx = all.findIndex((t) => t.id === tournamentId);
    if (idx < 0) throw new Error('Torneo no encontrado');

    const tourn = { ...all[idx] };
    if (!tourn.bracket_matches) return tourn;

    const matches = [...tourn.bracket_matches];
    const matchIdx = matches.findIndex((m) => m.id === matchId);
    if (matchIdx < 0) return tourn;

    const match = { ...matches[matchIdx] };
    match.winner_id = winnerId;
    match.status = 'completed';
    matches[matchIdx] = match;

    const winnerName =
      winnerId === match.player1.id
        ? match.player1.name
        : winnerId === match.player2.id
        ? match.player2.name
        : 'Ambos Pierden (Tiempo Excedido)';

    // Advance to Semifinals
    if (match.round === 1) {
      if (match.match_number === 1) {
        matches[4] = { ...matches[4], player1: { id: winnerId, name: winnerName, score: 0 } };
      } else if (match.match_number === 2) {
        matches[4] = { ...matches[4], player2: { id: winnerId, name: winnerName, score: 0 } };
      } else if (match.match_number === 3) {
        matches[5] = { ...matches[5], player1: { id: winnerId, name: winnerName, score: 0 } };
      } else if (match.match_number === 4) {
        matches[5] = { ...matches[5], player2: { id: winnerId, name: winnerName, score: 0 } };
      }
      if (matches[4].player1.id && matches[4].player2.id) {
        matches[4] = { ...matches[4], status: 'in_progress' };
      }
      if (matches[5].player1.id && matches[5].player2.id) {
        matches[5] = { ...matches[5], status: 'in_progress' };
      }
      tourn.current_round = 2;
    } else if (match.round === 2) {
      // Advance to Final
      if (match.match_number === 5) {
        matches[6] = { ...matches[6], player1: { id: winnerId, name: winnerName, score: 0 } };
      } else if (match.match_number === 6) {
        matches[6] = { ...matches[6], player2: { id: winnerId, name: winnerName, score: 0 } };
      }
      if (matches[6].player1.id && matches[6].player2.id) {
        matches[6] = { ...matches[6], status: 'in_progress' };
      }
      tourn.current_round = 3;
    } else if (match.round === 3) {
      tourn.status = 'completed';
      tourn.winners_info = `¡Campeón Oficial: ${winnerName}!`;
      tourn.timer_is_running = false;
    }

    tourn.bracket_matches = matches;
    all[idx] = tourn;
    setStorage(STORAGE_KEYS.TOURNAMENTS, all);
    return tourn;
  },

  updateTournamentTimer(tournamentId: string, secondsLeft: number, isRunning: boolean) {
    const all = getStorage<Tournament[]>(STORAGE_KEYS.TOURNAMENTS, INITIAL_TOURNAMENTS);
    const idx = all.findIndex((t) => t.id === tournamentId);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        timer_seconds_left: secondsLeft,
        timer_is_running: isRunning,
      };
      setStorage(STORAGE_KEYS.TOURNAMENTS, all);
    }
  },

  // STORE PRODUCTS PUBLISHED IN MARKETPLACE
  getMarketplaceStoreProducts(): (TenantProduct & { store_name: string; store_slug: string; store_logo?: string })[] {
    const products = getStorage<TenantProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const tenants = this.getTenants();
    const activeTenantsMap = new Map(tenants.filter((t) => t.status === 'active').map((t) => [t.id, t]));

    return products
      .filter((p) => p.is_active && p.show_in_marketplace !== false && p.stock_quantity > 0)
      .map((p) => {
        const tenant = activeTenantsMap.get(p.tenant_id);
        return {
          ...p,
          store_name: tenant?.name || 'Tienda Oficial',
          store_slug: tenant?.slug || 'tienda',
          store_logo: tenant?.logo_url,
        };
      });
  },

  // ORDERS & RESERVATIONS
  getOrders(tenantId?: string): Order[] {
    const all = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    return tenantId ? all.filter((o) => o.tenant_id === tenantId) : all;
  },

  createReservation(
    tenantId: string,
    customerName: string,
    customerPhone: string,
    items: { product: TenantProduct; quantity: number; variationText?: string }[],
    notes?: string,
    customerEmail?: string,
    deliveryType: 'store_pickup' | 'shipping' = 'store_pickup',
    shippingAddress?: string
  ): Order {
    const orderItems: OrderItem[] = items.map((i) => ({
      id: `item-${Math.random().toString(36).substring(2, 9)}`,
      order_id: '',
      tenant_product_id: i.product.id,
      product_name: i.product.name,
      variation_info: i.variationText,
      quantity: i.quantity,
      unit_price: i.product.price,
      subtotal: i.product.price * i.quantity,
    }));

    const total = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
    const randomCode = deliveryType === 'shipping' 
      ? `ENV-${Math.floor(1000 + Math.random() * 9000)}` 
      : `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tenant_id: tenantId,
      reservation_code: randomCode,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      order_type: 'web_reservation',
      delivery_type: deliveryType,
      shipping_address: shippingAddress,
      status: 'pending_pickup',
      payment_method: deliveryType === 'shipping' ? 'transfer' : 'cash_on_pickup',
      subtotal: total,
      total: total,
      notes,
      items: orderItems,
      created_at: new Date().toISOString(),
    };

    const all = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    all.unshift(newOrder);
    setStorage(STORAGE_KEYS.ORDERS, all);
    syncService.syncOrder(newOrder);

    // Decrement stock for the reserved items in store inventory immediately
    items.forEach((item) => {
      const prod = this.getProductById(item.product.id);
      if (prod) {
        this.updateProduct({
          id: prod.id,
          stock_quantity: Math.max(0, prod.stock_quantity - item.quantity),
        });
      }
    });

    return newOrder;
  },

  getProductById(id: string): TenantProduct | undefined {
    const all = getStorage<TenantProduct[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return all.find((p) => p.id === id);
  },

  updateOrderStatus(orderId: string, status: Order['status']): Order {
    const all = getStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const idx = all.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], status };
      setStorage(STORAGE_KEYS.ORDERS, all);
      return all[idx];
    }
    throw new Error('Orden no encontrada');
  },

  // MEMBERS & ROLES
  getMembers(tenantId?: string): TenantMember[] {
    const all = getStorage<TenantMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    return tenantId ? all.filter((m) => m.tenant_id === tenantId) : all;
  },

  addMember(member: Omit<TenantMember, 'id' | 'created_at'>): TenantMember {
    const all = getStorage<TenantMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const created: TenantMember = {
      ...member,
      id: `mem-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    all.push(created);
    setStorage(STORAGE_KEYS.MEMBERS, all);
    return created;
  },

  removeMember(id: string) {
    const all = getStorage<TenantMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    const filtered = all.filter((m) => m.id !== id);
    setStorage(STORAGE_KEYS.MEMBERS, filtered);
  },

  // USERS, PROFILES & TOP SELLERS (0.0 - 5.0 RATING)
  getUsers(): UserProfile[] {
    return getStorage<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getCurrentUser(): UserProfile {
    const users = this.getUsers();
    const currentId = getStorage<string>(STORAGE_KEYS.CURRENT_USER_ID, 'usr-current');
    return users.find((u) => u.id === currentId) || users[0] || INITIAL_USERS[0];
  },

  setCurrentUserId(id: string) {
    setStorage(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  addUserProfile(user: Omit<UserProfile, 'id'>): UserProfile {
    const users = this.getUsers();
    const created: UserProfile = {
      ...user,
      id: `usr-${Date.now()}`,
    };
    users.push(created);
    setStorage(STORAGE_KEYS.USERS, users);
    this.setCurrentUserId(created.id);
    return created;
  },

  updateUserProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      setStorage(STORAGE_KEYS.USERS, users);
      return users[idx];
    }
    throw new Error('Usuario no encontrado');
  },

  getTopSellers(): UserProfile[] {
    const users = this.getUsers();
    // Return verified stores and top community sellers with rating 0.0 - 5.0
    return [...users]
      .filter((u) => !u.is_banned && (u.rating || 0) >= 4.0)
      .sort((a, b) => {
        // Verified stores first, then highest rating, then total trades
        if (a.is_verified_store && !b.is_verified_store) return -1;
        if (!a.is_verified_store && b.is_verified_store) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
  },

  // C2C AUCTIONS MARKETPLACE
  getAuctions(): Auction[] {
    return getStorage<Auction[]>(STORAGE_KEYS.AUCTIONS, INITIAL_AUCTIONS);
  },

  getAuctionById(id: string): Auction | undefined {
    const list = this.getAuctions();
    return list.find((a) => a.id === id);
  },

  createAuction(newAuction: Omit<Auction, 'id' | 'current_price' | 'status' | 'created_at' | 'bids'>): Auction {
    const list = this.getAuctions();
    const created: Auction = {
      ...newAuction,
      id: `auc-${Date.now()}`,
      current_price: newAuction.starting_price,
      status: 'active',
      bids: [],
      created_at: new Date().toISOString(),
    };
    list.unshift(created);
    setStorage(STORAGE_KEYS.AUCTIONS, list);
    return created;
  },

  placeBid(auctionId: string, amount: number, bidderName: string, bidderId: string = 'usr-current'): Auction {
    const list = this.getAuctions();
    const idx = list.findIndex((a) => a.id === auctionId);
    if (idx < 0) throw new Error('Subasta no encontrada');

    const auction = list[idx];
    if (auction.status !== 'active') throw new Error('La subasta ya no está activa');

    const minAllowed = auction.current_price + (auction.min_increment || 50);
    if (amount < minAllowed) {
      throw new Error(`La puja mínima debe ser de $${minAllowed}`);
    }

    // Check user strikes
    const users = this.getUsers();
    const user = users.find((u) => u.id === bidderId);
    if (user && user.is_banned) {
      throw new Error('Tu cuenta está suspendida por acumulación de strikes anti-troll.');
    }

    const previousWinnerId = auction.bids && auction.bids.length > 0 ? auction.bids[auction.bids.length - 1].bidder_id : undefined;
    const previousWinnerName = auction.bids && auction.bids.length > 0 ? auction.bids[auction.bids.length - 1].bidder_name : undefined;
    const previousWinnerPrice = auction.current_price;

    const newBid: AuctionBid = {
      id: `bid-${Date.now()}`,
      auction_id: auctionId,
      bidder_id: bidderId,
      bidder_name: bidderName,
      bidder_strikes: user ? user.strikes : 0,
      amount,
      created_at: new Date().toISOString(),
    };

    const bids = auction.bids ? [...auction.bids, newBid] : [newBid];

    list[idx] = {
      ...auction,
      current_price: amount,
      runner_up_id: previousWinnerId || auction.runner_up_id,
      runner_up_name: previousWinnerName || auction.runner_up_name,
      runner_up_price: previousWinnerPrice,
      bids,
    };

    setStorage(STORAGE_KEYS.AUCTIONS, list);
    syncService.syncBid(newBid, list[idx]);
    return list[idx];
  },

  // ANTI-TROLL MECHANISM: Transfer victory to runner up
  transferVictoryToRunnerUp(auctionId: string): Auction {
    const list = this.getAuctions();
    const idx = list.findIndex((a) => a.id === auctionId);
    if (idx < 0) throw new Error('Subasta no encontrada');

    const auction = list[idx];
    if (!auction.runner_up_id || !auction.runner_up_name) {
      throw new Error('No existe un segundo postor registrado para transferir la victoria.');
    }

    const oldWinner = auction.winner_name || 'Postor anterior';
    const newWinnerName = auction.runner_up_name;
    const newWinnerPrice = auction.runner_up_price || auction.current_price;

    list[idx] = {
      ...auction,
      winner_id: auction.runner_up_id,
      winner_name: newWinnerName,
      winner_strikes: 0,
      current_price: newWinnerPrice,
      dispute_status: 'transferred_to_runner_up',
      deal_status: 'pending_contact',
      winner_claim_deadline: new Date(Date.now() + 86400000).toISOString(), // 24h for runner up
    };

    setStorage(STORAGE_KEYS.AUCTIONS, list);

    // Send system message in chat
    this.sendAuctionMessage(
      auctionId,
      'Sistema Anti-Troll TCG',
      false,
      `Victoria transferida al 2º postor (${newWinnerName}) por incumplimiento de ${oldWinner}. Nuevo precio fijado en $${newWinnerPrice} MXN. El nuevo comprador tiene 24h para coordinar.`,
      true
    );

    return list[idx];
  },

  // ANTI-TROLL MECHANISM: Report ghost bidder & apply strike
  reportTrollWinner(auctionId: string, reason: string): { auction: Auction; reportedUser: UserProfile } {
    const list = this.getAuctions();
    const idx = list.findIndex((a) => a.id === auctionId);
    if (idx < 0) throw new Error('Subasta no encontrada');

    const auction = list[idx];
    const winnerId = auction.winner_id;
    if (!winnerId) throw new Error('No hay postor ganador asignado para reportar.');

    // Apply strike in users
    const users = this.getUsers();
    let userIndex = users.findIndex((u) => u.id === winnerId);
    let targetUser: UserProfile;

    if (userIndex >= 0) {
      const currentStrikes = users[userIndex].strikes + 1;
      const isBanned = currentStrikes >= 3;
      users[userIndex] = {
        ...users[userIndex],
        strikes: currentStrikes,
        is_banned: isBanned,
        reputation_negative: users[userIndex].reputation_negative + 1,
      };
      targetUser = users[userIndex];
    } else {
      targetUser = {
        id: winnerId,
        name: auction.winner_name || 'Usuario desconocido',
        email: 'user@example.com',
        strikes: 1,
        is_banned: false,
        reputation_positive: 0,
        reputation_negative: 1,
      };
      users.push(targetUser);
    }
    setStorage(STORAGE_KEYS.USERS, users);

    // Update auction status
    list[idx] = {
      ...auction,
      dispute_status: 'troll_reported',
    };
    setStorage(STORAGE_KEYS.AUCTIONS, list);

    // Log system message
    this.sendAuctionMessage(
      auctionId,
      'Sistema Anti-Troll TCG',
      false,
      `Reporte por postor fantasma aplicado contra ${targetUser.name}. Se le sumó 1 STRIKE (Total: ${targetUser.strikes}/3). ${
        targetUser.is_banned ? '¡El usuario ha sido suspendido del Marketplace por acumular 3 faltas!' : ''
      } Motivo: ${reason}`,
      true
    );

    return { auction: list[idx], reportedUser: targetUser };
  },

  // CHAT SYSTEM
  getAuctionMessages(auctionId: string): AuctionMessage[] {
    const all = getStorage<AuctionMessage[]>(STORAGE_KEYS.AUCTION_MESSAGES, INITIAL_AUCTION_MESSAGES);
    return all.filter((m) => m.auction_id === auctionId);
  },

  sendAuctionMessage(
    auctionId: string,
    senderName: string,
    isSeller: boolean,
    message: string,
    isSystem: boolean = false,
    imageUrl?: string
  ): AuctionMessage {
    const all = getStorage<AuctionMessage[]>(STORAGE_KEYS.AUCTION_MESSAGES, INITIAL_AUCTION_MESSAGES);
    const created: AuctionMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      auction_id: auctionId,
      sender_id: isSystem ? 'system' : isSeller ? 'usr-seller' : 'usr-buyer',
      sender_name: senderName,
      is_seller: isSeller,
      message,
      image_url: imageUrl,
      is_system: isSystem,
      created_at: new Date().toISOString(),
    };
    all.push(created);
    setStorage(STORAGE_KEYS.AUCTION_MESSAGES, all);
    syncService.syncAuctionMessage(created);
    return created;
  },

  updateDealStatus(auctionId: string, status: Auction['deal_status']): Auction {
    const list = this.getAuctions();
    const idx = list.findIndex((a) => a.id === auctionId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], deal_status: status };
      setStorage(STORAGE_KEYS.AUCTIONS, list);

      // Si la transacción se completó, programar borrado de fotos en 48 horas (2 días)
      if (status === 'completed') {
        const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        const allMsgs = getStorage<AuctionMessage[]>(STORAGE_KEYS.AUCTION_MESSAGES, INITIAL_AUCTION_MESSAGES);
        let updated = false;
        allMsgs.forEach((m) => {
          if (m.auction_id === auctionId && m.image_url && !m.expires_at) {
            m.expires_at = expiresAt;
            updated = true;
          }
        });
        if (updated) {
          setStorage(STORAGE_KEYS.AUCTION_MESSAGES, allMsgs);
        }
      }

      return list[idx];
    }
    throw new Error('Subasta no encontrada');
  },

  // VIRTUAL BINDERS (CARPETAS VIRTUALES)
  getBinders(): VirtualBinder[] {
    return getStorage<VirtualBinder[]>(STORAGE_KEYS.BINDERS, INITIAL_BINDERS);
  },

  getBinderById(id: string): VirtualBinder | undefined {
    const list = this.getBinders();
    return list.find((b) => b.id === id);
  },

  createBinder(newBinder: Omit<VirtualBinder, 'id' | 'created_at'>): VirtualBinder {
    const list = this.getBinders();
    const created: VirtualBinder = {
      ...newBinder,
      id: `bin-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.push(created);
    setStorage(STORAGE_KEYS.BINDERS, list);
    return created;
  },

  // BINDER CARDS
  getBinderCards(binderId?: string): BinderCard[] {
    const all = getStorage<BinderCard[]>(STORAGE_KEYS.BINDER_CARDS, INITIAL_BINDER_CARDS);
    return binderId ? all.filter((c) => c.binder_id === binderId) : all;
  },

  getCardById(cardId: string): BinderCard | undefined {
    const all = this.getBinderCards();
    return all.find((c) => c.id === cardId);
  },

  addCardToBinder(cardData: Omit<BinderCard, 'id' | 'created_at'>): BinderCard {
    const all = this.getBinderCards();
    const created: BinderCard = {
      ...cardData,
      id: `bcard-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    all.unshift(created);
    setStorage(STORAGE_KEYS.BINDER_CARDS, all);

    // Update binder card count
    const binders = this.getBinders();
    const binderIdx = binders.findIndex((b) => b.id === cardData.binder_id);
    if (binderIdx >= 0) {
      binders[binderIdx].cards_count = (binders[binderIdx].cards_count || 0) + 1;
      setStorage(STORAGE_KEYS.BINDERS, binders);
    }

    return created;
  },

  updateCard(cardId: string, updates: Partial<BinderCard>): BinderCard {
    const all = this.getBinderCards();
    const idx = all.findIndex((c) => c.id === cardId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates };
      setStorage(STORAGE_KEYS.BINDER_CARDS, all);
      return all[idx];
    }
    throw new Error('Carta no encontrada');
  },

  removeCardFromBinder(cardId: string) {
    const all = this.getBinderCards();
    const filtered = all.filter((c) => c.id !== cardId);
    setStorage(STORAGE_KEYS.BINDER_CARDS, filtered);
  },

  // CARD OFFERS & MUTUAL TRANSACTION ACCEPTANCE
  getOffers(): CardOffer[] {
    return getStorage<CardOffer[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
  },

  getOfferById(id: string): CardOffer | undefined {
    const list = this.getOffers();
    return list.find((o) => o.id === id);
  },

  createCardOffer(offerData: Omit<CardOffer, 'id' | 'status' | 'seller_accepted' | 'buyer_accepted' | 'created_at'>): CardOffer {
    const list = this.getOffers();
    const created: CardOffer = {
      ...offerData,
      id: `off-${Date.now()}`,
      seller_accepted: false,
      buyer_accepted: true, // Initiator accepts their own offer
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(created);
    setStorage(STORAGE_KEYS.OFFERS, list);

    // Log initial system message
    this.sendOfferMessage(
      created.id,
      'Sistema de Vitrinas TCG',
      false,
      `Oferta abierta: ${offerData.buyer_name} ofrece $${offerData.offered_price.toLocaleString('es-MX')} MXN (Precio lista: $${offerData.original_price.toLocaleString('es-MX')} MXN) por ${offerData.copies_requested} copia(s). Cuando ambos confirmen "Transacción Aceptada", se descontará del inventario.`,
      true
    );

    return created;
  },

  getOfferMessages(offerId: string): OfferMessage[] {
    const all = getStorage<OfferMessage[]>(STORAGE_KEYS.OFFER_MESSAGES, INITIAL_OFFER_MESSAGES);
    return all.filter((m) => m.offer_id === offerId);
  },

  sendOfferMessage(
    offerId: string,
    senderName: string,
    isSeller: boolean,
    message: string,
    isSystem: boolean = false,
    imageUrl?: string
  ): OfferMessage {
    const all = getStorage<OfferMessage[]>(STORAGE_KEYS.OFFER_MESSAGES, INITIAL_OFFER_MESSAGES);
    const created: OfferMessage = {
      id: `omsg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      offer_id: offerId,
      sender_id: isSystem ? 'system' : isSeller ? 'usr-seller' : 'usr-buyer',
      sender_name: senderName,
      is_seller: isSeller,
      message,
      image_url: imageUrl,
      is_system: isSystem,
      created_at: new Date().toISOString(),
    };
    all.push(created);
    setStorage(STORAGE_KEYS.OFFER_MESSAGES, all);
    syncService.syncOfferMessage(created);
    return created;
  },

  // ACCEPT TRANSACTION WITH MUTUAL CONFIRMATION & INVENTORY DEDUCTION
  acceptOffer(offerId: string, asSeller: boolean): { offer: CardOffer; transactionCompleted: boolean } {
    const list = this.getOffers();
    const idx = list.findIndex((o) => o.id === offerId);
    if (idx < 0) throw new Error('Oferta no encontrada');

    const offer = list[idx];
    let newSellerAccepted = offer.seller_accepted;
    let newBuyerAccepted = offer.buyer_accepted;

    if (asSeller) {
      newSellerAccepted = true;
    } else {
      newBuyerAccepted = true;
    }

    const bothAccepted = newSellerAccepted && newBuyerAccepted;

    if (bothAccepted) {
      // 1. Mark offer as completed
      list[idx] = {
        ...offer,
        seller_accepted: true,
        buyer_accepted: true,
        status: 'completed',
      };
      setStorage(STORAGE_KEYS.OFFERS, list);
      syncService.syncOfferUpdate(list[idx]);

      // 2. DEDUCT INVENTORY from the BinderCard
      const allCards = this.getBinderCards();
      const cardIdx = allCards.findIndex((c) => c.id === offer.card_id);
      if (cardIdx >= 0) {
        const remainingCopies = Math.max(0, allCards[cardIdx].copies_count - offer.copies_requested);
        allCards[cardIdx] = {
          ...allCards[cardIdx],
          copies_count: remainingCopies,
          status: remainingCopies === 0 ? 'sold_out' : 'available',
        };
        setStorage(STORAGE_KEYS.BINDER_CARDS, allCards);
      }

      // 3. RECORD IN SALES CONTROL
      const sales = this.getSalesRecords();
      const newSale: SalesRecord = {
        id: `sale-${Date.now()}`,
        seller_id: offer.seller_id,
        seller_name: offer.seller_name,
        buyer_id: offer.buyer_id,
        buyer_name: offer.buyer_name,
        card_id: offer.card_id,
        card_name: offer.card_name,
        card_code: offer.card_code,
        rarity: offer.rarity,
        language: offer.language,
        copies_sold: offer.copies_requested,
        final_price: offer.offered_price,
        completed_at: new Date().toISOString(),
      };
      sales.unshift(newSale);
      setStorage(STORAGE_KEYS.SALES_RECORDS, sales);

      // 4. PROGRAMAR BORRADO DE FOTOS EN 48 HORAS (2 DÍAS) TRAS COMPLETAR COMPRA
      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      const allOfferMsgs = getStorage<OfferMessage[]>(STORAGE_KEYS.OFFER_MESSAGES, INITIAL_OFFER_MESSAGES);
      let msgsUpdated = false;
      allOfferMsgs.forEach((m) => {
        if (m.offer_id === offerId && m.image_url && !m.expires_at) {
          m.expires_at = expiresAt;
          msgsUpdated = true;
        }
      });
      if (msgsUpdated) {
        setStorage(STORAGE_KEYS.OFFER_MESSAGES, allOfferMsgs);
      }

      // 5. LOG SYSTEM MESSAGE
      this.sendOfferMessage(
        offerId,
        'Sistema de Vitrinas TCG',
        false,
        `¡TRANSACCIÓN ACEPTADA Y CERRADA POR AMBAS PARTES! Se descontaron ${offer.copies_requested} copia(s) del inventario del vendedor y se registró en su control de ventas por $${offer.offered_price.toLocaleString('es-MX')} MXN. Las fotos de recibos/cartas se eliminarán en 48h para proteger tu privacidad. ¡Felicidades!`,
        true
      );

      return { offer: list[idx], transactionCompleted: true };
    } else {
      // Only one party accepted so far
      list[idx] = {
        ...offer,
        seller_accepted: newSellerAccepted,
        buyer_accepted: newBuyerAccepted,
        status: 'accepted',
      };
      setStorage(STORAGE_KEYS.OFFERS, list);
      syncService.syncOfferUpdate(list[idx]);

      this.sendOfferMessage(
        offerId,
        'Sistema de Vitrinas TCG',
        false,
        `${asSeller ? offer.seller_name : offer.buyer_name} ha marcado "Transacción Aceptada". Esperando confirmación de la otra parte para cerrar inventario.`,
        true
      );

      return { offer: list[idx], transactionCompleted: false };
    }
  },

  // SALES RECORDS (CONTROL DE VENTAS DEL VENDEDOR)
  getSalesRecords(sellerId?: string): SalesRecord[] {
    const all = getStorage<SalesRecord[]>(STORAGE_KEYS.SALES_RECORDS, INITIAL_SALES_RECORDS);
    return sellerId ? all.filter((s) => s.seller_id === sellerId) : all;
  },

  // INVENTORY LOW-STOCK ALERTS (AUDIO 2 & 3)
  getProductAlerts(tenantId: string): TenantProduct[] {
    const products = this.getProducts(tenantId);
    return products.filter((p) => {
      if (p.low_stock_alert_enabled === false) return false;
      const threshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : 5;
      return p.stock_quantity <= threshold;
    });
  },

  // AUTO-PURGE CHAT PHOTOS (2 DÍAS DESPUÉS DE COMPLETADA LA COMPRA)
  purgeExpiredChatPhotos(): { purgedOfferPhotos: number; purgedAuctionPhotos: number } {
    let purgedOfferPhotos = 0;
    let purgedAuctionPhotos = 0;
    const now = Date.now();

    // 1. Limpieza en mensajes de ofertas de vitrina/marketplace
    const offerMessages = getStorage<OfferMessage[]>(STORAGE_KEYS.OFFER_MESSAGES, INITIAL_OFFER_MESSAGES);
    let offerChanged = false;
    offerMessages.forEach((m) => {
      if (m.image_url && m.expires_at && new Date(m.expires_at).getTime() <= now) {
        m.image_url = undefined;
        m.image_purged = true;
        offerChanged = true;
        purgedOfferPhotos++;
      }
    });
    if (offerChanged) {
      setStorage(STORAGE_KEYS.OFFER_MESSAGES, offerMessages);
    }

    // 2. Limpieza en mensajes de subastas
    const auctionMessages = getStorage<AuctionMessage[]>(STORAGE_KEYS.AUCTION_MESSAGES, INITIAL_AUCTION_MESSAGES);
    let auctionChanged = false;
    auctionMessages.forEach((m) => {
      if (m.image_url && m.expires_at && new Date(m.expires_at).getTime() <= now) {
        m.image_url = undefined;
        m.image_purged = true;
        auctionChanged = true;
        purgedAuctionPhotos++;
      }
    });
    if (auctionChanged) {
      setStorage(STORAGE_KEYS.AUCTION_MESSAGES, auctionMessages);
    }

    return { purgedOfferPhotos, purgedAuctionPhotos };
  },

  // FINANCIAL & TICKETS REPORT ENGINE (AUDIO 3 + CONTABILIZACIÓN DE TORNEOS)
  getFinancialReport(
    tenantId: string,
    period: 'day' | 'week' | 'biweek' | 'month',
    selectedDateStr?: string
  ) {
    // Purga proactiva de fotos expiradas en cada consulta financiera
    this.purgeExpiredChatPhotos();

    const allOrders = this.getOrders(tenantId);
    const targetDate = selectedDateStr ? new Date(selectedDateStr) : new Date();

    const filteredTickets = allOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (period === 'day') {
        return (
          orderDate.getFullYear() === targetDate.getFullYear() &&
          orderDate.getMonth() === targetDate.getMonth() &&
          orderDate.getDate() === targetDate.getDate()
        );
      } else if (period === 'week') {
        const diffDays = Math.abs((targetDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 7;
      } else if (period === 'biweek') {
        const diffDays = Math.abs((targetDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 15;
      } else {
        // month
        return (
          orderDate.getFullYear() === targetDate.getFullYear() &&
          orderDate.getMonth() === targetDate.getMonth()
        );
      }
    });

    const productRevenue = filteredTickets.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrdersCount = filteredTickets.length;

    // Aggregate items sold
    const itemSalesMap: Record<
      string,
      { id: string; name: string; quantity: number; revenue: number; cost: number }
    > = {};

    filteredTickets.forEach((order) => {
      order.items?.forEach((item) => {
        if (!itemSalesMap[item.product_name]) {
          itemSalesMap[item.product_name] = {
            id: item.tenant_product_id || '',
            name: item.product_name,
            quantity: 0,
            revenue: 0,
            cost: 0,
          };
        }
        itemSalesMap[item.product_name].quantity += item.quantity;
        itemSalesMap[item.product_name].revenue += item.subtotal;
      });
    });

    const tenantProducts = this.getProducts(tenantId);
    let productCost = 0;

    // Calculate actual cost where available
    Object.values(itemSalesMap).forEach((item) => {
      const matchProd = tenantProducts.find(
        (p) => p.name.toLowerCase() === item.name.toLowerCase() || p.id === item.id
      );
      const unitCost = matchProd?.cost_price || item.revenue * 0.55;
      item.cost = unitCost * item.quantity;
      productCost += item.cost;
    });

    // If no cost calculated, approximate 58% of revenue
    if (productCost === 0 && productRevenue > 0) {
      productCost = productRevenue * 0.58;
    }

    // =========================================================================
    // CONTABILIZACIÓN DE TORNEOS E INSCRIPCIONES (NUEVO REQUERIMIENTO)
    // =========================================================================
    const allTournaments = this.getTournaments(tenantId);
    const filteredTournaments = allTournaments.filter((tourn) => {
      const tournDate = new Date(tourn.event_date || tourn.created_at);
      if (period === 'day') {
        return (
          tournDate.getFullYear() === targetDate.getFullYear() &&
          tournDate.getMonth() === targetDate.getMonth() &&
          tournDate.getDate() === targetDate.getDate()
        );
      } else if (period === 'week') {
        const diffDays = Math.abs((targetDate.getTime() - tournDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 7;
      } else if (period === 'biweek') {
        const diffDays = Math.abs((targetDate.getTime() - tournDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 15;
      } else {
        return (
          tournDate.getFullYear() === targetDate.getFullYear() &&
          tournDate.getMonth() === targetDate.getMonth()
        );
      }
    });

    let tournamentRevenue = 0;
    let tournamentCost = 0;
    let totalTournamentParticipants = 0;

    const tournamentsSummary = filteredTournaments.map((t) => {
      const paidParticipants = t.participants_list && t.participants_list.length > 0
        ? t.participants_list.filter((p) => p.paid).length
        : (t.registered_count || (t.status !== 'upcoming' ? 8 : 4));

      const entryFee = t.entry_fee || 0;
      const tIncome = paidParticipants * entryFee;
      const tExpenses = t.budget_cost || 0;

      tournamentRevenue += tIncome;
      tournamentCost += tExpenses;
      totalTournamentParticipants += paidParticipants;

      return {
        id: t.id,
        name: t.name,
        game: t.game,
        format: t.format,
        event_date: t.event_date,
        entry_fee: entryFee,
        paid_participants: paidParticipants,
        revenue: tIncome,
        prize_budget: tExpenses,
        net_profit: tIncome - tExpenses,
        status: t.status,
      };
    });

    // Total Combined Revenue and Costs
    const totalRevenue = productRevenue + tournamentRevenue;
    const totalCost = productCost + tournamentCost;
    const grossProfit = Math.max(0, totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const topSelling = Object.values(itemSalesMap).sort((a, b) => b.quantity - a.quantity);
    const soldProductNames = new Set(topSelling.map((s) => s.name.toLowerCase()));

    const stagnantProducts = tenantProducts
      .filter((p) => !soldProductNames.has(p.name.toLowerCase()) && p.stock_quantity > 0)
      .slice(0, 5);

    // Smart Recommendations (Audio 3)
    const recommendations: string[] = [];
    if (tournamentRevenue > 0) {
      recommendations.push(
        `Inscripciones de Torneos: Se recaudaron $${tournamentRevenue.toLocaleString('es-MX')} MXN de ${totalTournamentParticipants} duelistas en ${filteredTournaments.length} torneo(s). Los eventos atraen jugadores presenciales que compran micas, bebidas y sobres.`
      );
    }
    if (topSelling.length > 0) {
      const best = topSelling[0];
      recommendations.push(
        `Producto Estrella: "${best.name}" lidera las ventas con ${best.quantity} unidades vendidas ($${best.revenue.toLocaleString('es-MX')} MXN). Se recomienda resurtir con anticipación para evitar quiebre de stock.`
      );
    }
    if (stagnantProducts.length > 0) {
      const st = stagnantProducts[0];
      recommendations.push(
        `Producto Estancado: "${st.name}" tiene ${st.stock_quantity} unidades en inventario sin rotación en este periodo. Considera armar paquetes de torneo, exhibirlo en mostrador o descontinuar resurtidos futuros.`
      );
    }
    if (totalOrdersCount > 0) {
      const avgTicket = productRevenue / totalOrdersCount;
      recommendations.push(
        `Ticket Promedio en Tienda: $${avgTicket.toFixed(2)} MXN por venta. Ofrecer accesorios (micas, dados, bebidas) en mostrador puede elevar el ticket medio hasta un 18%.`
      );
    }

    return {
      period,
      targetDate: targetDate.toISOString(),
      tickets: filteredTickets,
      totalOrdersCount,
      totalRevenue,
      productRevenue,
      tournamentRevenue,
      totalCost,
      productCost,
      tournamentCost,
      grossProfit,
      profitMargin,
      totalTournamentParticipants,
      tournamentsSummary,
      topSelling,
      stagnantProducts,
      recommendations,
    };
  },

  // WEEKLY MOST SEARCHED & MOST SOLD CARDS (AUDIO 5)
  getMostSearchedCards() {
    return [
      {
        id: 'search-01',
        card_code: 'RA01-EN005',
        name_en: 'Ash Blossom & Joyous Spring',
        name_es: 'Flor de Ceniza & Primavera Feliz',
        rarity: 'Quarter Century Secret Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/14558127.jpg',
        market_price_mxn: 1150.0,
        weekly_searches: 1420,
        game: 'Yu-Gi-Oh!',
      },
      {
        id: 'search-02',
        card_code: 'LOB-S005',
        name_en: 'Dark Magician',
        name_es: 'Mago Oscuro',
        rarity: 'Ultra Rare 1st Edition Vintage',
        image_url: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
        market_price_mxn: 950.0,
        weekly_searches: 1290,
        game: 'Yu-Gi-Oh!',
      },
      {
        id: 'search-03',
        card_code: 'LOB-S001',
        name_en: 'Blue-Eyes White Dragon',
        name_es: 'Dragón Blanco de Ojos Azules',
        rarity: 'Prismatic Secret Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
        market_price_mxn: 1650.0,
        weekly_searches: 1180,
        game: 'Yu-Gi-Oh!',
      },
      {
        id: 'search-04',
        card_code: 'BLTR-EN011',
        name_en: 'Triple Tactics Thrust',
        name_es: 'Empuje de Tácticas Triples',
        rarity: 'Secret Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/90884403.jpg',
        market_price_mxn: 890.0,
        weekly_searches: 940,
        game: 'Yu-Gi-Oh!',
      },
    ];
  },

  getMostSoldCards() {
    return [
      {
        id: 'sold-01',
        card_code: 'RA01-EN019',
        name_en: 'Effect Veiler',
        name_es: 'Ocultador de Efectos',
        rarity: 'Collector Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/97268402.jpg',
        sold_price_mxn: 280.0,
        weekly_volume: 38,
        game: 'Yu-Gi-Oh!',
      },
      {
        id: 'sold-02',
        card_code: 'RA01-EN052',
        name_en: 'Infinite Impermanence',
        name_es: 'Impermanencia Infinita',
        rarity: 'Ultra Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/10045474.jpg',
        sold_price_mxn: 320.0,
        weekly_volume: 34,
        game: 'Yu-Gi-Oh!',
      },
      {
        id: 'sold-03',
        card_code: 'BLTR-EN044',
        name_en: 'S:P Little Knight',
        name_es: 'Caballera Menor S:P',
        rarity: 'Secret Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/29301450.jpg',
        sold_price_mxn: 1450.0,
        weekly_volume: 22,
        game: 'Yu-Gi-Oh!',
      },
      {
        id: 'sold-04',
        card_code: 'LEDE-EN035',
        name_en: 'Tenpai Dragon Chundra',
        name_es: 'Dragón Tenpai Chundra',
        rarity: 'Super Rare',
        image_url: 'https://images.ygoprodeck.com/images/cards/38167722.jpg',
        sold_price_mxn: 180.0,
        weekly_volume: 45,
        game: 'Yu-Gi-Oh!',
      },
    ];
  },
};

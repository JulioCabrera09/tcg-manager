import { createClient, isSupabaseConfigured } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AuctionBid, AuctionMessage, Auction, TenantProduct, Order, OfferMessage, CardOffer } from '@/types/database';

// Canal local BroadcastChannel para fallback en entorno local o cuando Supabase aún no tiene credenciales
const localBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('tcg_local_realtime') 
  : null;

/**
 * Emite un evento en tiempo real (Supabase si está activo, BroadcastChannel local de respaldo)
 */
export function emitRealtimeEvent(topic: string, event: string, payload: any) {
  const supabase = createClient();

  if (supabase) {
    try {
      const channel = supabase.channel(`broadcast:${topic}`);
      channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    } catch (e) {
      console.warn('Error emitiendo por Supabase Realtime:', e);
    }
  }

  // Siempre emitir localmente para pestañas abiertas en el mismo navegador
  if (localBroadcast) {
    try {
      localBroadcast.postMessage({ topic, event, payload, timestamp: Date.now() });
    } catch {}
  }
}

/**
 * Suscripción en tiempo real a una subasta específica (pujas, chat, cambios de precio/estado)
 */
export function subscribeToAuctionRealtime(
  auctionId: string,
  handlers: {
    onBid?: (bid: AuctionBid) => void;
    onMessage?: (message: AuctionMessage) => void;
    onAuctionUpdate?: (auction: Partial<Auction>) => void;
  }
): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;

  if (supabase) {
    channel = supabase
      .channel(`auction-room-${auctionId}`)
      // Escuchar nuevas pujas en la base de datos
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          if (handlers.onBid) handlers.onBid(payload.new as AuctionBid);
        }
      )
      // Escuchar nuevos mensajes del chat
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_messages',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          if (handlers.onMessage) handlers.onMessage(payload.new as AuctionMessage);
        }
      )
      // Escuchar cambios de estado o precio en la subasta
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          if (handlers.onAuctionUpdate) handlers.onAuctionUpdate(payload.new as Partial<Auction>);
        }
      )
      // Broadcast fallback para mensajes instantáneos
      .on('broadcast', { event: 'new_bid' }, (event) => {
        if (handlers.onBid && event.payload?.auction_id === auctionId) {
          handlers.onBid(event.payload);
        }
      })
      .on('broadcast', { event: 'new_message' }, (event) => {
        if (handlers.onMessage && event.payload?.auction_id === auctionId) {
          handlers.onMessage(event.payload);
        }
      })
      .on('broadcast', { event: 'auction_updated' }, (event) => {
        if (handlers.onAuctionUpdate && event.payload?.id === auctionId) {
          handlers.onAuctionUpdate(event.payload);
        }
      })
      .subscribe();
  }

  // Listener local de BroadcastChannel (para pruebas multi-pestaña)
  const handleLocalMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.topic !== `auction-${auctionId}`) return;

    if (data.event === 'new_bid' && handlers.onBid) {
      handlers.onBid(data.payload);
    } else if (data.event === 'new_message' && handlers.onMessage) {
      handlers.onMessage(data.payload);
    } else if (data.event === 'auction_updated' && handlers.onAuctionUpdate) {
      handlers.onAuctionUpdate(data.payload);
    }
  };

  if (localBroadcast) {
    localBroadcast.addEventListener('message', handleLocalMessage);
  }

  // Función de limpieza
  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    if (localBroadcast) {
      localBroadcast.removeEventListener('message', handleLocalMessage);
    }
  };
}

/**
 * Suscripción en tiempo real a una tienda específica (nuevas reservas web / tickets y cambios de stock)
 */
export function subscribeToStoreRealtime(
  tenantId: string,
  handlers: {
    onNewOrder?: (order: Order) => void;
    onProductUpdate?: (product: Partial<TenantProduct>) => void;
  }
): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;

  if (supabase) {
    channel = supabase
      .channel(`store-room-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (handlers.onNewOrder) handlers.onNewOrder(payload.new as Order);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenant_products',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (handlers.onProductUpdate) handlers.onProductUpdate(payload.new as Partial<TenantProduct>);
        }
      )
      .subscribe();
  }

  const handleLocalMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.topic !== `store-${tenantId}`) return;

    if (data.event === 'new_order' && handlers.onNewOrder) {
      handlers.onNewOrder(data.payload);
    } else if (data.event === 'product_updated' && handlers.onProductUpdate) {
      handlers.onProductUpdate(data.payload);
    }
  };

  if (localBroadcast) {
    localBroadcast.addEventListener('message', handleLocalMessage);
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    if (localBroadcast) {
      localBroadcast.removeEventListener('message', handleLocalMessage);
    }
  };
}

/**
 * Suscripción en tiempo real a ofertas de carpetas virtuales y negociación
 */
export function subscribeToOfferRealtime(
  offerId: string,
  handlers: {
    onMessage?: (message: OfferMessage) => void;
    onOfferUpdate?: (offer: Partial<CardOffer>) => void;
  }
): () => void {
  const supabase = createClient();
  let channel: RealtimeChannel | null = null;

  if (supabase) {
    channel = supabase
      .channel(`offer-room-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offer_messages',
          filter: `offer_id=eq.${offerId}`,
        },
        (payload) => {
          if (handlers.onMessage) handlers.onMessage(payload.new as OfferMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'card_offers',
          filter: `id=eq.${offerId}`,
        },
        (payload) => {
          if (handlers.onOfferUpdate) handlers.onOfferUpdate(payload.new as Partial<CardOffer>);
        }
      )
      .subscribe();
  }

  const handleLocalMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.topic !== `offer-${offerId}`) return;

    if (data.event === 'new_offer_message' && handlers.onMessage) {
      handlers.onMessage(data.payload);
    } else if (data.event === 'offer_updated' && handlers.onOfferUpdate) {
      handlers.onOfferUpdate(data.payload);
    }
  };

  if (localBroadcast) {
    localBroadcast.addEventListener('message', handleLocalMessage);
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    if (localBroadcast) {
      localBroadcast.removeEventListener('message', handleLocalMessage);
    }
  };
}

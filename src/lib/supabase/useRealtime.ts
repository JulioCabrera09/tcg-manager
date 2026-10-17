'use client';

import { useEffect, useState } from 'react';
import {
  subscribeToAuctionRealtime,
  subscribeToStoreRealtime,
  subscribeToOfferRealtime,
} from './realtime';
import { isSupabaseConfigured } from './client';
import type { AuctionBid, AuctionMessage, Auction, Order, TenantProduct, OfferMessage, CardOffer } from '@/types/database';

/**
 * Hook para monitorear el estado de conexión con Supabase
 */
export function useSupabaseStatus() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  return { isConfigured };
}

/**
 * Hook para escuchar eventos en tiempo real de una subasta (pujas y chat)
 */
export function useAuctionRealtime(
  auctionId: string,
  handlers: {
    onBid?: (bid: AuctionBid) => void;
    onMessage?: (message: AuctionMessage) => void;
    onAuctionUpdate?: (auction: Partial<Auction>) => void;
  }
) {
  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = subscribeToAuctionRealtime(auctionId, handlers);
    return () => {
      unsubscribe();
    };
  }, [auctionId, handlers.onBid, handlers.onMessage, handlers.onAuctionUpdate]);
}

/**
 * Hook para escuchar órdenes e inventario en tiempo real en la tienda / ERP
 */
export function useStoreRealtime(
  tenantId: string,
  handlers: {
    onNewOrder?: (order: Order) => void;
    onProductUpdate?: (product: Partial<TenantProduct>) => void;
  }
) {
  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = subscribeToStoreRealtime(tenantId, handlers);
    return () => {
      unsubscribe();
    };
  }, [tenantId, handlers.onNewOrder, handlers.onProductUpdate]);
}

/**
 * Hook para escuchar mensajes de ofertas C2C en tiempo real
 */
export function useOfferRealtime(
  offerId: string,
  handlers: {
    onMessage?: (message: OfferMessage) => void;
    onOfferUpdate?: (offer: Partial<CardOffer>) => void;
  }
) {
  useEffect(() => {
    if (!offerId) return;

    const unsubscribe = subscribeToOfferRealtime(offerId, handlers);
    return () => {
      unsubscribe();
    };
  }, [offerId, handlers.onMessage, handlers.onOfferUpdate]);
}

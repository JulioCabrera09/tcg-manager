'use client';

import { useEffect, useState, useRef } from 'react';
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
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!auctionId) return;

    const unsubscribe = subscribeToAuctionRealtime(auctionId, {
      onBid: (bid) => handlersRef.current.onBid?.(bid),
      onMessage: (msg) => handlersRef.current.onMessage?.(msg),
      onAuctionUpdate: (auc) => handlersRef.current.onAuctionUpdate?.(auc),
    });
    return () => {
      unsubscribe();
    };
  }, [auctionId]);
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
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!tenantId) return;

    const unsubscribe = subscribeToStoreRealtime(tenantId, {
      onNewOrder: (order) => handlersRef.current.onNewOrder?.(order),
      onProductUpdate: (prod) => handlersRef.current.onProductUpdate?.(prod),
    });
    return () => {
      unsubscribe();
    };
  }, [tenantId]);
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
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!offerId) return;

    const unsubscribe = subscribeToOfferRealtime(offerId, {
      onMessage: (msg) => handlersRef.current.onMessage?.(msg),
      onOfferUpdate: (off) => handlersRef.current.onOfferUpdate?.(off),
    });
    return () => {
      unsubscribe();
    };
  }, [offerId]);
}


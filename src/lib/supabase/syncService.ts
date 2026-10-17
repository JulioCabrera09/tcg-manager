import { createClient, isSupabaseConfigured } from './client';
import { emitRealtimeEvent } from './realtime';
import type { AuctionBid, AuctionMessage, Auction, Order, TenantProduct, OfferMessage, CardOffer } from '@/types/database';

/**
 * Servicio de sincronización en la nube (Supabase + Realtime)
 * Realiza escrituras asíncronas no bloqueantes para mantener rendimiento óptimo (Optimistic UI)
 */
export const syncService = {
  /**
   * Sincroniza una nueva puja de subasta
   */
  async syncBid(bid: AuctionBid, updatedAuction: Auction) {
    // 1. Emitir inmediatamente por Realtime para respuesta instantánea (<50ms)
    emitRealtimeEvent(`auction-${bid.auction_id}`, 'new_bid', bid);
    emitRealtimeEvent(`auction-${bid.auction_id}`, 'auction_updated', updatedAuction);

    const supabase = createClient();
    if (!supabase) return;

    try {
      // 2. Persistir puja en Supabase
      await supabase.from('auction_bids').insert({
        id: bid.id,
        auction_id: bid.auction_id,
        bidder_id: bid.bidder_id,
        bidder_name: bid.bidder_name,
        bidder_strikes: bid.bidder_strikes,
        amount: bid.amount,
        created_at: bid.created_at,
      });

      // 3. Actualizar precio actual y postores en la subasta
      await supabase.from('auctions').update({
        current_price: updatedAuction.current_price,
        runner_up_id: updatedAuction.runner_up_id,
        runner_up_name: updatedAuction.runner_up_name,
        runner_up_price: updatedAuction.runner_up_price,
      }).eq('id', bid.auction_id);
    } catch (err) {
      console.warn('Error sincronizando puja con Supabase:', err);
    }
  },

  /**
   * Sincroniza un mensaje de chat de subasta (incluye foto y expiración de 48h)
   */
  async syncAuctionMessage(message: AuctionMessage) {
    emitRealtimeEvent(`auction-${message.auction_id}`, 'new_message', message);

    const supabase = createClient();
    if (!supabase) return;

    try {
      await supabase.from('auction_messages').insert({
        id: message.id,
        auction_id: message.auction_id,
        sender_id: message.sender_id,
        sender_name: message.sender_name,
        is_seller: message.is_seller,
        message: message.message,
        image_url: message.image_url,
        expires_at: message.expires_at,
        image_purged: message.image_purged,
        is_system: message.is_system,
        created_at: message.created_at,
      });
    } catch (err) {
      console.warn('Error sincronizando mensaje de subasta con Supabase:', err);
    }
  },

  /**
   * Sincroniza un mensaje de negociación de oferta C2C
   */
  async syncOfferMessage(message: OfferMessage) {
    emitRealtimeEvent(`offer-${message.offer_id}`, 'new_offer_message', message);

    const supabase = createClient();
    if (!supabase) return;

    try {
      await supabase.from('offer_messages').insert({
        id: message.id,
        offer_id: message.offer_id,
        sender_id: message.sender_id,
        sender_name: message.sender_name,
        is_seller: message.is_seller,
        message: message.message,
        image_url: message.image_url,
        expires_at: message.expires_at,
        image_purged: message.image_purged,
        is_system: message.is_system,
        created_at: message.created_at,
      });
    } catch (err) {
      console.warn('Error sincronizando mensaje de oferta con Supabase:', err);
    }
  },

  /**
   * Sincroniza un cambio de estado en una oferta C2C
   */
  async syncOfferUpdate(offer: CardOffer) {
    emitRealtimeEvent(`offer-${offer.id}`, 'offer_updated', offer);

    const supabase = createClient();
    if (!supabase) return;

    try {
      await supabase.from('card_offers').update({
        status: offer.status,
        seller_accepted: offer.seller_accepted,
        buyer_accepted: offer.buyer_accepted,
      }).eq('id', offer.id);
    } catch (err) {
      console.warn('Error sincronizando estado de oferta con Supabase:', err);
    }
  },

  /**
   * Sincroniza una nueva orden / reserva web
   */
  async syncOrder(order: Order) {
    emitRealtimeEvent(`store-${order.tenant_id}`, 'new_order', order);

    const supabase = createClient();
    if (!supabase) return;

    try {
      await supabase.from('orders').insert({
        id: order.id,
        tenant_id: order.tenant_id,
        reservation_code: order.reservation_code,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        order_type: order.order_type,
        delivery_type: order.delivery_type,
        shipping_address: order.shipping_address,
        status: order.status,
        payment_method: order.payment_method,
        subtotal: order.subtotal,
        total: order.total,
        notes: order.notes,
        created_at: order.created_at,
      });

      if (order.items && order.items.length > 0) {
        await supabase.from('order_items').insert(
          order.items.map((it) => ({
            id: it.id,
            order_id: order.id,
            tenant_product_id: it.tenant_product_id,
            product_name: it.product_name,
            variation_info: it.variation_info,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal: it.subtotal,
          }))
        );
      }
    } catch (err) {
      console.warn('Error sincronizando orden con Supabase:', err);
    }
  },

  /**
   * Sincroniza actualización de inventario / stock
   */
  async syncProductStock(productId: string, tenantId: string, newStock: number) {
    emitRealtimeEvent(`store-${tenantId}`, 'product_updated', { id: productId, stock_quantity: newStock });

    const supabase = createClient();
    if (!supabase) return;

    try {
      await supabase.from('tenant_products').update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      }).eq('id', productId);
    } catch (err) {
      console.warn('Error sincronizando inventario con Supabase:', err);
    }
  },
};

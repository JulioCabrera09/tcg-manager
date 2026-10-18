export type ProductCategory = 
  | 'tcg_single' 
  | 'tcg_sealed' 
  | 'accessory' 
  | 'snack' 
  | 'beverage' 
  | 'merchandise' 
  | 'board_game'
  | 'apparel'
  | 'poster'
  | 'other';

export type TCGGame = 
  | 'Pokemon' 
  | 'Magic' 
  | 'Yu-Gi-Oh!' 
  | 'One Piece' 
  | 'Lorcana' 
  | 'Otro';

export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'Damaged';

export type TenantRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  theme_color?: string;
  address?: string;
  map_lat?: number;
  map_lng?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  business_hours?: string;
  gallery_images?: string[];
  hiring_title?: string;
  hiring_description?: string;
  is_hiring: boolean;
  status: 'active' | 'suspended' | 'trial';
  storage_limit_items: number;
  rating?: number; // 0.0 - 5.0
  rating_count?: number;
  created_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  user_name?: string;
  user_email?: string;
  can_delete_inventory?: boolean;
  can_edit_inventory?: boolean;
  can_manage_tournaments?: boolean;
  can_view_finance?: boolean;
  can_create_tickets?: boolean;
  can_edit_landing?: boolean;
  created_at: string;
}

export interface GlobalProduct {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  tcg_game?: TCGGame;
  description?: string;
  image_url?: string;
  suggested_price?: number;
}

export interface TenantProductVariation {
  id: string;
  tenant_product_id: string;
  name: string; // e.g., "Sabor", "Tamaño"
  option_value: string; // e.g., "Manzana", "Doble"
  price_modifier: number;
  stock_quantity: number;
}

export interface TenantProduct {
  id: string;
  tenant_id: string;
  global_product_id?: string;
  barcode?: string;
  sku?: string;
  name: string;
  category: ProductCategory;
  tcg_game?: TCGGame;
  card_condition?: CardCondition;
  card_rarity?: string;
  card_language?: string;
  card_set?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  low_stock_threshold?: number; // Configurable: e.g. warn if < 5 playmats or < 2 boxes
  low_stock_alert_enabled?: boolean;
  show_in_marketplace?: boolean; // Decidir si se publica en el Marketplace TCG unificado
  is_active: boolean;
  is_featured?: boolean;
  image_url?: string;
  description?: string;
  variations?: TenantProductVariation[];
  created_at: string;
}

export interface TournamentMatch {
  id: string;
  round: number; // 1 = Cuartos de Final, 2 = Semifinales, 3 = Gran Final
  round_name: string; // "Cuartos de Final", "Semifinal", "Gran Final"
  match_number: number;
  player1: { id: string; name: string; score: number; deck_name?: string };
  player2: { id: string; name: string; score: number; deck_name?: string };
  winner_id?: string | 'double_loss' | 'draw';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Tournament {
  id: string;
  tenant_id: string;
  name: string;
  game: TCGGame | string;
  format: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  is_multi_day?: boolean;
  location_name?: string;
  poster_image_url?: string;
  entry_fee: number;
  max_participants: number;
  budget_cost?: number; // Precios y gastos invertidos en premios
  prizes_description?: string;
  first_place_prize?: string;
  second_place_prize?: string;
  third_place_prize?: string;
  top_cut_prizes?: string;
  winners_info?: string; // Para mostrar ganadores de torneos pasados en landing
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  registered_count?: number;
  round_duration_minutes?: number; // Duración en minutos de la ronda
  current_round?: number;
  timer_seconds_left?: number;
  timer_is_running?: boolean;
  participants_list?: { id: string; name: string; deck?: string; deck_name?: string; paid: boolean }[];
  bracket_matches?: TournamentMatch[];
  created_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_name: string;
  contact_phone?: string;
  paid: boolean;
  decklist_info?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  tenant_product_id?: string;
  product_name: string;
  variation_info?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  reservation_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: 'web_reservation' | 'pos_direct';
  delivery_type?: 'store_pickup' | 'shipping'; // Retiro en sucursal o Envío a domicilio
  shipping_address?: string;
  status: 'pending_pickup' | 'ready_for_pickup' | 'completed' | 'cancelled';
  payment_method: 'cash_on_pickup' | 'cash' | 'card' | 'transfer';
  subtotal: number;
  total: number;
  discount_amount?: number;
  discount_percent?: number;
  amount_paid?: number;
  change_given?: number;
  cashier_name?: string;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
}

// C2C AUCTION MARKETPLACE & ANTI-TROLL SYSTEM TYPES
export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_name: string;
  bidder_strikes: number; // 0, 1, 2, 3 (3 = blocked)
  amount: number;
  created_at: string;
}

export interface AuctionMessage {
  id: string;
  auction_id: string;
  sender_id: string;
  sender_name: string;
  is_seller: boolean;
  message: string;
  image_url?: string;
  expires_at?: string; // Fecha de expiración (2 días después de completarse la transacción)
  image_purged?: boolean;
  is_system?: boolean;
  created_at: string;
}

export interface Auction {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_reputation_positive: number;
  seller_trades_count: number;
  seller_location: string;
  title: string;
  tcg_game: TCGGame;
  card_condition: CardCondition;
  card_rarity?: string;
  card_set?: string;
  image_url: string;
  description: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  ends_at: string;
  status: 'active' | 'ended' | 'completed' | 'cancelled';
  // Anti-Troll & Transfer resolution
  winner_id?: string;
  winner_name?: string;
  winner_strikes?: number;
  winner_claim_deadline?: string; // 24h deadline
  runner_up_id?: string;
  runner_up_name?: string;
  runner_up_price?: number;
  dispute_status?: 'none' | 'troll_reported' | 'transferred_to_runner_up';
  deal_status?: 'pending_contact' | 'coordinating_payment' | 'shipped_delivered' | 'completed';
  bids?: AuctionBid[];
  created_at: string;
}

export type UserRole = 'superadmin' | 'admin' | 'store_admin' | 'store_staff' | 'regular_user';

export interface StaffPermissions {
  can_manage_inventory: boolean;
  can_use_pos: boolean;
  can_manage_tournaments: boolean;
  can_view_finances: boolean;
  can_edit_landing: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  alias?: string; // Nombre público visible en vitrinas y subastas
  email: string;
  phone?: string;
  whatsapp_phone?: string;
  city?: string;
  avatar_url?: string;
  strikes: number; // Max 3
  is_banned: boolean;
  reputation_positive: number;
  reputation_negative: number;
  rating?: number; // 0.0 to 5.0
  total_trades?: number;
  password_hash?: string; // Hash SHA-256 seguro (nunca texto plano)
  auth_provider?: 'email' | 'google';
  is_verified_store?: boolean;
  store_slug?: string;
  store_name?: string;
  role?: UserRole;
  tenant_id?: string;
  staff_permissions?: StaffPermissions;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string; // ID del usuario o tenant_id
  recipient_type?: 'user' | 'store';
  title: string;
  message: string;
  type:
    | 'auction_won'
    | 'auction_outbid'
    | 'new_message'
    | 'offer_received'
    | 'order_created'
    | 'tournament_alert'
    | 'system';
  link_url?: string;
  action_url?: string;
  read: boolean;
  created_at: string;
}

export interface AdminSupportMessage {
  id: string;
  store_id: string;
  store_name: string;
  store_slug?: string;
  sender_id?: string;
  sender_name: string;
  sender_email?: string;
  sender_role: 'store_admin' | 'superadmin' | 'admin';
  subject?: string;
  message?: string;
  content?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  admin_reply?: string;
  admin_replied_at?: string;
  admin_replied_by?: string;
  created_at: string;
}

// VIRTUAL BINDERS (CARPETAS VIRTUALES), CARD SHOWCASE, OFFERS & SALES
export type CardLanguage = 'ES' | 'EN' | 'JA' | 'IT' | 'DE' | 'FR' | 'PT';

export interface VirtualBinder {
  id: string;
  user_id: string;
  owner_name: string;
  is_store: boolean;
  store_slug?: string;
  owner_location?: string;
  owner_reputation?: number;
  name: string;
  tcg_game: TCGGame;
  description?: string;
  is_public: boolean;
  cards_count?: number;
  created_at: string;
}

export interface BinderCard {
  id: string;
  binder_id: string;
  user_id: string;
  user_name: string;
  is_store: boolean;
  store_slug?: string;
  user_location?: string;
  yugioh_card_id?: string;
  card_code: string; // e.g. LOB-S005, RA01-EN005
  name_en: string;
  name_es: string;
  language: CardLanguage;
  tcg_game: TCGGame;
  rarity: string;
  expansion: string;
  condition: CardCondition;
  copies_count: number; // stock
  sale_price: number; // in MXN
  recommended_price_mxn?: number;
  recommended_price_usd?: number;
  image_url: string; // official API card image (English)
  status: 'available' | 'reserved' | 'sold_out';
  created_at: string;
}

export interface CardOffer {
  id: string;
  card_id: string;
  binder_id: string;
  card_name: string;
  card_code: string;
  rarity: string;
  language: CardLanguage;
  card_image_url: string;
  original_price: number;
  offered_price: number;
  copies_requested: number;
  seller_id: string;
  seller_name: string;
  buyer_id: string;
  buyer_name: string;
  buyer_city?: string;
  buyer_reputation?: number;
  seller_accepted: boolean;
  buyer_accepted: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface OfferMessage {
  id: string;
  offer_id: string;
  sender_id: string;
  sender_name: string;
  is_seller: boolean;
  message: string;
  image_url?: string;
  expires_at?: string; // Fecha de expiración (2 días después de completarse la transacción)
  image_purged?: boolean;
  is_system?: boolean;
  created_at: string;
}

export interface SalesRecord {
  id: string;
  seller_id: string;
  seller_name: string;
  buyer_id: string;
  buyer_name: string;
  card_id: string;
  card_name: string;
  card_code: string;
  rarity: string;
  language: CardLanguage;
  copies_sold: number;
  final_price: number; // total in MXN
  completed_at: string;
}

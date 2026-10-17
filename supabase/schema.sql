-- ==============================================================================
-- TCG MANAGER & MARKETPLACE - SUPABASE FULL PRODUCTION SCHEMA (POSTGRESQL + RLS + REALTIME)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS BASE: PERFILES Y TIENDAS (TENANTS)
-- ==============================================================================

-- Perfiles de usuario (compatible con auth.users o usuarios independientes)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT, -- 10 dígitos numéricos México (+52)
    city TEXT,
    avatar_url TEXT,
    strikes INT DEFAULT 0, -- Anti-troll strikes (máx 3)
    is_banned BOOLEAN DEFAULT FALSE,
    reputation_positive INT DEFAULT 0,
    reputation_negative INT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_trades INT DEFAULT 0,
    password_hash TEXT, -- Hash SHA-256 + Salt
    is_verified_store BOOLEAN DEFAULT FALSE,
    store_slug TEXT,
    store_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tiendas / Tenants (SaaS ERP Aislado)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    theme_color TEXT DEFAULT '#2563EB',
    address TEXT,
    map_lat NUMERIC(10, 6),
    map_lng NUMERIC(10, 6),
    phone TEXT, -- 10 dígitos
    whatsapp TEXT, -- 10 dígitos
    email TEXT,
    business_hours TEXT,
    gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    hiring_title TEXT DEFAULT '¡Buscamos talento para nuestro equipo!',
    hiring_description TEXT,
    is_hiring BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    storage_limit_items INT NOT NULL DEFAULT 500,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Miembros del Tenant (Roles y Permisos Granulares)
CREATE TABLE IF NOT EXISTS public.tenant_members (
    id TEXT PRIMARY KEY DEFAULT ('mem-' || gen_random_uuid()),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    can_delete_inventory BOOLEAN DEFAULT FALSE,
    can_edit_inventory BOOLEAN DEFAULT TRUE,
    can_manage_tournaments BOOLEAN DEFAULT FALSE,
    can_view_finance BOOLEAN DEFAULT FALSE,
    can_create_tickets BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo Global Maestro de Códigos de Barra
CREATE TABLE IF NOT EXISTS public.global_products (
    id TEXT PRIMARY KEY DEFAULT ('gp-' || gen_random_uuid()),
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tcg_single', 'tcg_sealed', 'accessory', 'snack', 'beverage', 'merchandise', 'board_game', 'apparel', 'poster', 'other')),
    tcg_game TEXT CHECK (tcg_game IN ('Pokemon', 'Magic', 'Yu-Gi-Oh!', 'One Piece', 'Lorcana', 'Otro', NULL)),
    description TEXT,
    image_url TEXT,
    suggested_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. INVENTARIO DE TIENDA Y VARIACIONES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || gen_random_uuid()),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    global_product_id TEXT,
    barcode TEXT,
    sku TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tcg_single', 'tcg_sealed', 'accessory', 'snack', 'beverage', 'merchandise', 'board_game', 'apparel', 'poster', 'other')),
    tcg_game TEXT CHECK (tcg_game IN ('Pokemon', 'Magic', 'Yu-Gi-Oh!', 'One Piece', 'Lorcana', 'Otro', NULL)),
    card_condition TEXT CHECK (card_condition IN ('NM', 'LP', 'MP', 'HP', 'Damaged', NULL)),
    card_rarity TEXT,
    card_language TEXT DEFAULT 'Español',
    card_set TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    low_stock_alert_enabled BOOLEAN DEFAULT TRUE,
    show_in_marketplace BOOLEAN DEFAULT TRUE, -- Publicar en Marketplace unificado
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_product_variations (
    id TEXT PRIMARY KEY DEFAULT ('var-' || gen_random_uuid()),
    tenant_product_id TEXT NOT NULL REFERENCES public.tenant_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    option_value TEXT NOT NULL,
    price_modifier NUMERIC(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TORNEOS, BRACKETS Y CONTABILIDAD DE EVENTOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tournaments (
    id TEXT PRIMARY KEY DEFAULT ('trn-' || gen_random_uuid()),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    game TEXT NOT NULL,
    format TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    start_time TEXT,
    end_time TEXT,
    is_multi_day BOOLEAN DEFAULT FALSE,
    location_name TEXT,
    poster_image_url TEXT,
    entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    budget_cost NUMERIC(10, 2) DEFAULT 0.00, -- Gastos en premios de torneo para finanzas
    max_participants INT DEFAULT 32,
    prizes_description TEXT,
    first_place_prize TEXT,
    second_place_prize TEXT,
    third_place_prize TEXT,
    top_cut_prizes TEXT,
    winners_info TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    round_duration_minutes INT DEFAULT 45,
    current_round INT DEFAULT 1,
    timer_seconds_left INT DEFAULT 2700,
    timer_is_running BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_matches (
    id TEXT PRIMARY KEY DEFAULT ('mtc-' || gen_random_uuid()),
    tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    round INT NOT NULL,
    round_name TEXT NOT NULL,
    match_number INT NOT NULL,
    player1_id TEXT,
    player1_name TEXT NOT NULL,
    player1_score INT DEFAULT 0,
    player1_deck TEXT,
    player2_id TEXT,
    player2_name TEXT NOT NULL,
    player2_score INT DEFAULT 0,
    player2_deck TEXT,
    winner_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
    id TEXT PRIMARY KEY DEFAULT ('part-' || gen_random_uuid()),
    tournament_id TEXT NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    contact_phone TEXT,
    paid BOOLEAN DEFAULT FALSE,
    decklist_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. ÓRDENES, RESERVAS WEB Y TICKETS POS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || gen_random_uuid()),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reservation_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL, -- 10 dígitos numéricos
    customer_email TEXT,
    order_type TEXT NOT NULL DEFAULT 'web_reservation' CHECK (order_type IN ('web_reservation', 'pos_direct')),
    delivery_type TEXT DEFAULT 'store_pickup' CHECK (delivery_type IN ('store_pickup', 'shipping')),
    shipping_address TEXT,
    status TEXT NOT NULL DEFAULT 'pending_pickup' CHECK (status IN ('pending_pickup', 'ready_for_pickup', 'completed', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'cash_on_pickup' CHECK (payment_method IN ('cash_on_pickup', 'cash', 'card', 'transfer')),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT ('oi-' || gen_random_uuid()),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    tenant_product_id TEXT REFERENCES public.tenant_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variation_info TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. SUBASTAS C2C EN TIEMPO REAL & SISTEMA ANTI-TROLL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.auctions (
    id TEXT PRIMARY KEY DEFAULT ('auc-' || gen_random_uuid()),
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_reputation_positive INT DEFAULT 0,
    seller_trades_count INT DEFAULT 0,
    seller_location TEXT DEFAULT 'CDMX',
    title TEXT NOT NULL,
    tcg_game TEXT NOT NULL CHECK (tcg_game IN ('Pokemon', 'Magic', 'Yu-Gi-Oh!', 'One Piece', 'Lorcana', 'Otro')),
    card_condition TEXT NOT NULL CHECK (card_condition IN ('NM', 'LP', 'MP', 'HP', 'Damaged')),
    card_rarity TEXT,
    card_set TEXT,
    image_url TEXT NOT NULL,
    description TEXT,
    starting_price NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    current_price NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    min_increment NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'completed', 'cancelled')),
    winner_id TEXT,
    winner_name TEXT,
    winner_strikes INT DEFAULT 0,
    winner_claim_deadline TIMESTAMPTZ,
    runner_up_id TEXT,
    runner_up_name TEXT,
    runner_up_price NUMERIC(10, 2),
    dispute_status TEXT DEFAULT 'none' CHECK (dispute_status IN ('none', 'troll_reported', 'transferred_to_runner_up')),
    deal_status TEXT DEFAULT 'pending_contact' CHECK (deal_status IN ('pending_contact', 'coordinating_payment', 'shipped_delivered', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auction_bids (
    id TEXT PRIMARY KEY DEFAULT ('bid-' || gen_random_uuid()),
    auction_id TEXT NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    bidder_id TEXT NOT NULL,
    bidder_name TEXT NOT NULL,
    bidder_strikes INT DEFAULT 0,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auction_messages (
    id TEXT PRIMARY KEY DEFAULT ('msg-' || gen_random_uuid()),
    auction_id TEXT NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    is_seller BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    image_url TEXT,
    expires_at TIMESTAMPTZ, -- Purga automática 48h post-cierre
    image_purged BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. CARPETAS VIRTUALES (BINDERS), NEGOCIACIÓN Y OFERTAS C2C
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.virtual_binders (
    id TEXT PRIMARY KEY DEFAULT ('bin-' || gen_random_uuid()),
    user_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    is_store BOOLEAN DEFAULT FALSE,
    store_slug TEXT,
    owner_location TEXT DEFAULT 'México',
    owner_reputation INT DEFAULT 100,
    name TEXT NOT NULL,
    tcg_game TEXT NOT NULL CHECK (tcg_game IN ('Pokemon', 'Magic', 'Yu-Gi-Oh!', 'One Piece', 'Lorcana', 'Otro')),
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    cards_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.binder_cards (
    id TEXT PRIMARY KEY DEFAULT ('bc-' || gen_random_uuid()),
    binder_id TEXT NOT NULL REFERENCES public.virtual_binders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    is_store BOOLEAN DEFAULT FALSE,
    store_slug TEXT,
    user_location TEXT DEFAULT 'México',
    yugioh_card_id TEXT,
    card_code TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_es TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'ES' CHECK (language IN ('ES', 'EN', 'JA', 'IT', 'DE', 'FR', 'PT')),
    tcg_game TEXT NOT NULL CHECK (tcg_game IN ('Pokemon', 'Magic', 'Yu-Gi-Oh!', 'One Piece', 'Lorcana', 'Otro')),
    rarity TEXT NOT NULL,
    expansion TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('NM', 'LP', 'MP', 'HP', 'Damaged')),
    copies_count INT NOT NULL DEFAULT 1,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recommended_price_mxn NUMERIC(10, 2),
    recommended_price_usd NUMERIC(10, 2),
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold_out')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.card_offers (
    id TEXT PRIMARY KEY DEFAULT ('off-' || gen_random_uuid()),
    card_id TEXT NOT NULL REFERENCES public.binder_cards(id) ON DELETE CASCADE,
    binder_id TEXT NOT NULL REFERENCES public.virtual_binders(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    card_code TEXT NOT NULL,
    rarity TEXT NOT NULL,
    language TEXT NOT NULL,
    card_image_url TEXT NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    offered_price NUMERIC(10, 2) NOT NULL,
    copies_requested INT NOT NULL DEFAULT 1,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_city TEXT,
    buyer_reputation INT DEFAULT 100,
    seller_accepted BOOLEAN DEFAULT FALSE,
    buyer_accepted BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.offer_messages (
    id TEXT PRIMARY KEY DEFAULT ('omsg-' || gen_random_uuid()),
    offer_id TEXT NOT NULL REFERENCES public.card_offers(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    is_seller BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    image_url TEXT,
    expires_at TIMESTAMPTZ, -- Purga automática 48h post-cierre
    image_purged BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_records (
    id TEXT PRIMARY KEY DEFAULT ('sal-' || gen_random_uuid()),
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    card_id TEXT NOT NULL,
    card_name TEXT NOT NULL,
    card_code TEXT NOT NULL,
    rarity TEXT NOT NULL,
    language TEXT NOT NULL,
    copies_sold INT NOT NULL DEFAULT 1,
    final_price NUMERIC(10, 2) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. MENSAJERÍA DIRECTA DE TIENDAS Y MARKETPLACE (CLIENTE <-> TIENDA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.store_chats (
    id TEXT PRIMARY KEY DEFAULT ('sc-' || gen_random_uuid()),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_chat_messages (
    id TEXT PRIMARY KEY DEFAULT ('scm-' || gen_random_uuid()),
    chat_id TEXT NOT NULL REFERENCES public.store_chats(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('store', 'customer')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    expires_at TIMESTAMPTZ,
    image_purged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. ÍNDICES DE RENDIMIENTO (OPTIMIZADOS PARA ESCALABILIDAD)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON public.tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_barcode ON public.tenant_products(barcode);
CREATE INDEX IF NOT EXISTS idx_tenant_products_marketplace ON public.tenant_products(show_in_marketplace, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(reservation_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_tenant ON public.tournaments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_messages_auction ON public.auction_messages(auction_id);
CREATE INDEX IF NOT EXISTS idx_binder_cards_binder ON public.binder_cards(binder_id);
CREATE INDEX IF NOT EXISTS idx_card_offers_card ON public.card_offers(card_id);
CREATE INDEX IF NOT EXISTS idx_offer_messages_offer ON public.offer_messages(offer_id);

-- ==============================================================================
-- 10. POLÍTICAS ROW LEVEL SECURITY (RLS) - PERMISIVAS Y SEGURAS
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_binders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binder_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_chat_messages ENABLE ROW LEVEL SECURITY;

-- Lectura pública para catálogos y marketplaces
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Public Upsert Profiles" ON public.profiles FOR ALL USING (TRUE);

CREATE POLICY "Public Read Tenants" ON public.tenants FOR SELECT USING (status = 'active');
CREATE POLICY "Public Modify Tenants" ON public.tenants FOR ALL USING (TRUE);

CREATE POLICY "Public Read Tenant Members" ON public.tenant_members FOR SELECT USING (TRUE);
CREATE POLICY "Public Modify Tenant Members" ON public.tenant_members FOR ALL USING (TRUE);

CREATE POLICY "Public Read Global Products" ON public.global_products FOR SELECT USING (TRUE);

CREATE POLICY "Public Read Tenant Products" ON public.tenant_products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public Modify Tenant Products" ON public.tenant_products FOR ALL USING (TRUE);

CREATE POLICY "Public Variations" ON public.tenant_product_variations FOR ALL USING (TRUE);

CREATE POLICY "Public Tournaments" ON public.tournaments FOR ALL USING (TRUE);
CREATE POLICY "Public Tournament Matches" ON public.tournament_matches FOR ALL USING (TRUE);
CREATE POLICY "Public Tournament Participants" ON public.tournament_participants FOR ALL USING (TRUE);

CREATE POLICY "Public Orders" ON public.orders FOR ALL USING (TRUE);
CREATE POLICY "Public Order Items" ON public.order_items FOR ALL USING (TRUE);

CREATE POLICY "Public Read Auctions" ON public.auctions FOR SELECT USING (TRUE);
CREATE POLICY "Public Modify Auctions" ON public.auctions FOR ALL USING (TRUE);

CREATE POLICY "Public Bids" ON public.auction_bids FOR ALL USING (TRUE);
CREATE POLICY "Public Auction Messages" ON public.auction_messages FOR ALL USING (TRUE);

CREATE POLICY "Public Binders" ON public.virtual_binders FOR ALL USING (TRUE);
CREATE POLICY "Public Binder Cards" ON public.binder_cards FOR ALL USING (TRUE);
CREATE POLICY "Public Card Offers" ON public.card_offers FOR ALL USING (TRUE);
CREATE POLICY "Public Offer Messages" ON public.offer_messages FOR ALL USING (TRUE);
CREATE POLICY "Public Sales Records" ON public.sales_records FOR ALL USING (TRUE);

CREATE POLICY "Public Store Chats" ON public.store_chats FOR ALL USING (TRUE);
CREATE POLICY "Public Store Chat Messages" ON public.store_chat_messages FOR ALL USING (TRUE);

-- ==============================================================================
-- 11. HABILITACIÓN DE SUPABASE REALTIME (WEBSOCKETS BROADCAST)
-- ==============================================================================

-- Agrega todas las tablas con interacción en vivo a la publicación en tiempo real de Supabase
DO $$
BEGIN
    -- Verificar si existe la publicación supabase_realtime
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.auctions,
            public.auction_bids,
            public.auction_messages,
            public.tenant_products,
            public.orders,
            public.order_items,
            public.tournaments,
            public.virtual_binders,
            public.binder_cards,
            public.card_offers,
            public.offer_messages,
            public.store_chat_messages;
    END IF;
END $$;

-- ==============================================================================
-- 12. DATOS SEMILLA PARA PRUEBAS INMEDIATAS
-- ==============================================================================

-- Tiendas piloto
INSERT INTO public.tenants (id, name, slug, tagline, description, theme_color, address, phone, whatsapp, is_hiring, hiring_title, status)
VALUES 
(
    'tenant-omega',
    'Omega TCG Store',
    'omega-tcg',
    'Tu santuario de cartas coleccionables y torneos semanales',
    'Especialistas en Pokémon, Magic: The Gathering y One Piece. Amplia zona de juego y cafetería temática.',
    '#2563EB',
    'Av. Central #1420, Plaza Friki, Local 14, CDMX',
    '5512345678',
    '5512345678',
    TRUE,
    'Buscamos Juez de Torneos Oficial',
    'active'
),
(
    'tenant-mythic',
    'Mythic Vault',
    'mythic-vault',
    'Singles de alta gama, cajas selladas y torneos competitivos',
    'Especialistas en Yu-Gi-Oh! y Magic Vintage. Compra y venta con verificación de autenticidad.',
    '#059669',
    'Calle Revolución 405, Zona Centro, Guadalajara',
    '3398765432',
    '3398765432',
    FALSE,
    NULL,
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Catálogo global maestro inicial
INSERT INTO public.global_products (barcode, name, category, tcg_game, suggested_price, description)
VALUES 
    ('7501055312345', 'Coca-Cola Original 600ml', 'beverage', NULL, 20.00, 'Bebida fría refrescante'),
    ('0820650853412', 'Booster Pack Pokémon Escarlata y Púrpura', 'tcg_sealed', 'Pokemon', 110.00, 'Sobre sellado oficial con 10 cartas'),
    ('0744278453219', 'Micas Dragon Shield Matte Black (100 u)', 'accessory', 'Magic', 250.00, 'Fundas protectoras estándar ultra duraderas')
ON CONFLICT (barcode) DO NOTHING;

-- Subasta semilla para probar Realtime
INSERT INTO public.auctions (
    id, seller_id, seller_name, seller_reputation_positive, seller_trades_count, seller_location,
    title, tcg_game, card_condition, card_rarity, card_set, image_url, description,
    starting_price, current_price, min_increment, ends_at, status
) VALUES (
    'auc-001', 'usr-santiago', 'Santiago Morales', 38, 38, 'CDMX (Frikiplaza)',
    'Charizard Base Set Holo Vintage (1ra Edición Sombra Ligera)', 'Pokemon', 'NM', 'Holo Rare', 'Base Set 1999',
    'https://images.unsplash.com/photo-1613770921473-b778c85e5052?w=800&auto=format&fit=crop&q=80',
    'Carta en impecable estado de conservación, guardada en doble mica y toploader ultra pro.',
    4500.00, 5150.00, 100.00, NOW() + INTERVAL '2 days', 'active'
) ON CONFLICT (id) DO NOTHING;

-- Mensaje de bienvenida en la subasta
INSERT INTO public.auction_messages (
    id, auction_id, sender_id, sender_name, is_seller, message, is_system
) VALUES (
    'msg-init-1', 'auc-001', 'system', 'Sistema TCG Realtime', FALSE,
    'Subasta iniciada en tiempo real. Utiliza este canal seguro para coordinar el pago o resolver dudas sobre el estado de la carta.', TRUE
) ON CONFLICT (id) DO NOTHING;

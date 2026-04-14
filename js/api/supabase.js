/* ============================================================
   BOBtheBAGEL — js/api/supabase.js
   Client Supabase — PRÊT À BRANCHER

   Pour activer :
   1. Créer un projet sur https://supabase.com
   2. Remplacer SUPABASE_URL et SUPABASE_ANON_KEY ci-dessous
   3. Importer ce fichier dans les modules qui en ont besoin
   4. Remplacer les appels localStorage par les fonctions Supabase

   ⚠️ Ne pas committer les clés en dur dans le dépôt.
      Utiliser des variables d'environnement ou un .env local.
   ============================================================ */

// ── Configuration ──────────────────────────────────────────
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// ── Client (chargé via CDN dans index.html) ────────────────
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
let _client = null;

export function getSupabase() {
  if (!_client && typeof window.supabase !== 'undefined') {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

// ── Auth ───────────────────────────────────────────────────
export async function signIn(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const sb = getSupabase();
  await sb.auth.signOut();
}

export async function getSession() {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  return data.session;
}

// ── Orders ─────────────────────────────────────────────────
export async function fetchOrders(shopId = null) {
  const sb = getSupabase();
  let query = sb.from('orders').select('*').order('created_at', { ascending: false });
  if (shopId) query = query.eq('shop_id', shopId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createOrder(order) {
  const sb = getSupabase();
  const { data, error } = await sb.from('orders').insert(order).select().single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId, status, updatedBy) {
  const sb = getSupabase();
  const { error } = await sb.from('orders').update({
    status,
    updated_at:   new Date().toISOString(),
    modified_by:  updatedBy,
  }).eq('id', orderId);
  if (error) throw error;
}

// ── Realtime Orders ────────────────────────────────────────
export function subscribeOrders(callback) {
  const sb = getSupabase();
  return sb
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe();
}

// ── Stock ──────────────────────────────────────────────────
export async function fetchStock(entityId) {
  const sb = getSupabase();
  const { data, error } = await sb.from('stock').select('*').eq('entity_id', entityId);
  if (error) throw error;
  return data;
}

export async function updateStock(entityId, productId, field, value) {
  const sb = getSupabase();
  const { error } = await sb.from('stock').upsert({
    entity_id:   entityId,
    product_id:  productId,
    [field]:     value,
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'entity_id,product_id' });
  if (error) throw error;
}

// ── Messages (chat) ────────────────────────────────────────
export async function fetchMessages(conversationId, limit = 50) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function sendMessage(conversationId, senderId, content, priority = 'normal', photoUrl = null) {
  const sb = getSupabase();
  const { data, error } = await sb.from('messages').insert({
    conversation_id: conversationId,
    sender_id:       senderId,
    content,
    priority,
    photo_url:       photoUrl,
    created_at:      new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
}

export function subscribeMessages(conversationId, callback) {
  const sb = getSupabase();
  return sb
    .channel(`messages-${conversationId}`)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, callback)
    .subscribe();
}

// ── Storage photos ─────────────────────────────────────────
export async function uploadPhoto(file, path) {
  const sb = getSupabase();
  const { data, error } = await sb.storage
    .from('chat-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data: urlData } = sb.storage.from('chat-photos').getPublicUrl(path);
  return urlData.publicUrl;
}

// ── Schema SQL de référence ────────────────────────────────
/*
  À exécuter dans Supabase SQL Editor pour créer les tables :

  -- Boutiques
  CREATE TABLE shops (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    color      TEXT DEFAULT '#1B5E3B',
    address    TEXT,
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Accès utilisateurs aux boutiques
  CREATE TABLE user_shop_access (
    user_id              UUID REFERENCES auth.users,
    shop_id              UUID REFERENCES shops,
    can_access_kitchen   BOOLEAN DEFAULT false,
    PRIMARY KEY (user_id, shop_id)
  );

  -- Produits
  CREATE TABLE products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    sub_category TEXT,
    unit         TEXT DEFAULT 'pcs',
    step         INTEGER DEFAULT 1,
    is_active    BOOLEAN DEFAULT true,
    price        NUMERIC DEFAULT 0
  );

  -- Commandes
  CREATE TABLE orders (
    id             TEXT PRIMARY KEY,
    shop_id        UUID REFERENCES shops,
    shop_name      TEXT,
    shop_color     TEXT,
    items          JSONB,
    note           TEXT,
    status         TEXT DEFAULT 'pending',
    delivery       DATE,
    delivery_time  TIME,
    ordered_by     TEXT,
    validated_by   TEXT,
    modified_by    TEXT,
    comment        TEXT,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
  );

  -- Stock
  CREATE TABLE stock (
    entity_id         TEXT NOT NULL,
    product_id        UUID REFERENCES products,
    qty               NUMERIC DEFAULT 0,
    alert_threshold   NUMERIC DEFAULT 10,
    updated_at        TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (entity_id, product_id)
  );

  -- Réceptions fournisseur
  CREATE TABLE receipts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id   TEXT NOT NULL,
    supplier    TEXT,
    items       JSONB,
    received_by TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
  );

  -- Conversations
  CREATE TABLE conversations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type       TEXT DEFAULT 'general',
    order_id   TEXT REFERENCES orders,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Messages
  CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID REFERENCES conversations,
    sender_id        UUID REFERENCES auth.users,
    content          TEXT,
    priority         TEXT DEFAULT 'normal',
    photo_url        TEXT,
    read_by          JSONB DEFAULT '[]',
    created_at       TIMESTAMPTZ DEFAULT now()
  );

  -- Événements calendrier
  CREATE TABLE events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    event_date  DATE NOT NULL,
    event_time  TIME,
    location    TEXT,
    shops       JSONB,
    status      TEXT DEFAULT 'planned',
    notes       TEXT,
    created_by  UUID REFERENCES auth.users,
    created_at  TIMESTAMPTZ DEFAULT now()
  );

  -- Rapports qualité
  CREATE TABLE quality_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id      UUID REFERENCES shops,
    inspector_id UUID REFERENCES auth.users,
    report_date  DATE NOT NULL,
    score        INTEGER,
    criteria     JSONB,
    observations TEXT,
    actions      TEXT,
    status       TEXT DEFAULT 'open',
    created_at   TIMESTAMPTZ DEFAULT now()
  );

  -- Activer Realtime sur orders et messages
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
*/

/* ============================================================
   BOBtheBAGEL — js/api/supabase.js
   Client Supabase — CONFIGURÉ
   ============================================================ */

// ── Configuration ──────────────────────────────────────────
// NOTE : ces valeurs sont publiques (clé "anon"), conçues pour le front.
// La sécurité repose sur les règles RLS côté base (voir migration 02).
const SUPABASE_URL      = 'https://wznalartaqvcehpohfsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bmFsYXJ0YXF2Y2VocG9oZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzAzMzgsImV4cCI6MjA5MjAwNjMzOH0.MqomT4WEX5dMXpgEisG8S_0h165fmbsI70sfEtG8cl0';

// ── Client (chargé via CDN dans index.html) ────────────────
let _client = null;

export function getSupabase() {
  if (!_client && typeof window !== 'undefined' && typeof window.supabase !== 'undefined') {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession:      true,
        autoRefreshToken:    true,
        detectSessionInUrl:  false,
      },
    });
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

export async function getCurrentProfile() {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (error) { console.warn('[BOB] getCurrentProfile:', error.message); return null; }
  return { ...data, email: user.email };
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
    updated_at:  new Date().toISOString(),
    modified_by: updatedBy,
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

// ── Shops ──────────────────────────────────────────────────
export async function fetchShops() {
  const sb = getSupabase();
  const { data, error } = await sb.from('shops').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return data;
}

// ── Products ───────────────────────────────────────────────
export async function fetchProducts() {
  const sb = getSupabase();
  const { data, error } = await sb.from('products').select('*').eq('is_active', true);
  if (error) throw error;
  return data;
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
    entity_id:  entityId,
    product_id: productId,
    [field]:    value,
    updated_at: new Date().toISOString(),
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

export async function sendMessageApi(conversationId, senderId, content, priority = 'normal', photoUrl = null) {
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
  const { error } = await sb.storage
    .from('chat-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  const { data: urlData } = sb.storage.from('chat-photos').getPublicUrl(path);
  return urlData.publicUrl;
}

// ── Test de connexion (dev only) ───────────────────────────
export async function pingSupabase() {
  try {
    const sb = getSupabase();
    if (!sb) return { ok: false, reason: 'client-null' };
    const { data, error } = await sb.from('shops').select('id, name').limit(1);
    if (error) return { ok: false, reason: error.message };
    return { ok: true, sample: data };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

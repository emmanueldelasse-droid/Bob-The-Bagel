/* ============================================================
   BOBtheBAGEL — js/api/supabase.js
   Client Supabase — CONFIGURÉ
   ============================================================ */

import { A, SHOPS, setRuntimeFlag } from '../state.js';

const SUPABASE_URL      = 'https://wznalartaqvcehpohfsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bmFsYXJ0YXF2Y2VocG9oZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzAzMzgsImV4cCI6MjA5MjAwNjMzOH0.MqomT4WEX5dMXpgEisG8S_0h165fmbsI70sfEtG8cl0';

let _client = null;

export function getSupabase() {
  if (!_client && typeof window !== 'undefined' && typeof window.supabase !== 'undefined') {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

function pickFirst(...values) {
  return values.find((v) => v !== undefined && v !== null);
}

function compactObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

function parseItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fallbackShop(shopId) {
  return SHOPS.find((shop) => shop.id === shopId) || null;
}

export function normalizeOrderRow(row) {
  if (!row) return null;

  const shopId = pickFirst(row.shop_id, row.shopId);
  const shop = fallbackShop(shopId);

  return {
    id: pickFirst(row.id),
    shopId,
    shopName: pickFirst(row.shop_name, row.shopName, row.shop?.name, row.shops?.name, shop?.name, shopId),
    shopColor: pickFirst(row.shop_color, row.shopColor, row.shop?.color, row.shops?.color, shop?.color, '#888'),
    items: parseItems(row.items),
    note: pickFirst(row.note, ''),
    status: pickFirst(row.status, 'pending'),
    createdAt: pickFirst(row.created_at, row.createdAt, new Date().toISOString()),
    updatedAt: pickFirst(row.updated_at, row.updatedAt, row.created_at, row.createdAt, new Date().toISOString()),
    delivery: pickFirst(row.delivery_date, row.delivery, row.deliveryDate, ''),
    deliveryTime: pickFirst(row.delivery_time, row.deliveryTime, ''),
    orderedBy: pickFirst(row.ordered_by, row.orderedBy, ''),
    validatedBy: pickFirst(row.validated_by, row.validatedBy, null),
    modifiedBy: pickFirst(row.modified_by, row.modifiedBy, null),
    comment: pickFirst(row.comment, null),
  };
}

function sortOrdersDesc(list) {
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function normalizeStockRow(row) {
  if (!row) return null;
  return {
    entityId: pickFirst(row.entity_id, row.entityId),
    productId: pickFirst(row.product_id, row.productId),
    qty: Number(pickFirst(row.qty, 0)) || 0,
    alert: Number(pickFirst(row.alert, 0)) || 0,
  };
}

function applyStockRowsToState(nextStock, rows) {
  (rows || []).map(normalizeStockRow).filter(Boolean).forEach((row) => {
    if (!row.entityId || !row.productId) return;
    if (!nextStock[row.entityId]) nextStock[row.entityId] = {};
    nextStock[row.entityId][row.productId] = {
      qty: row.qty,
      alert: row.alert,
    };
  });
}

async function tryQueries(builders) {
  let lastError = null;
  for (const build of builders) {
    const { data, error } = await build();
    if (!error) return data;
    lastError = error;
  }
  throw lastError || new Error('Requête Supabase impossible');
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
  if (error) {
    console.warn('[BOB] getCurrentProfile:', error.message);
    return null;
  }
  return { ...data, email: user.email };
}

// ── Orders ─────────────────────────────────────────────────
export async function fetchOrders(shopId = null) {
  const sb = getSupabase();
  const rows = await tryQueries([
    () => {
      let q = sb.from('orders').select('*').order('created_at', { ascending: false });
      if (shopId) q = q.eq('shop_id', shopId);
      return q;
    },
    () => {
      let q = sb.from('orders').select('*').order('createdAt', { ascending: false });
      if (shopId) q = q.eq('shopId', shopId);
      return q;
    },
    () => sb.from('orders').select('*'),
  ]);

  return sortOrdersDesc((rows || []).map(normalizeOrderRow).filter(Boolean));
}

function buildOrderInsertVariants(order) {
  const common = {
    id: order.id,
    status: order.status || 'pending',
    items: order.items || [],
    note: order.note || '',
    comment: order.comment || null,
  };

  return [
    compactObject({
      ...common,
      shop_id: order.shopId,
      shop_name: order.shopName,
      shop_color: order.shopColor,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      delivery_date: order.delivery,
      delivery_time: order.deliveryTime || null,
      ordered_by: order.orderedBy,
      validated_by: order.validatedBy || null,
      modified_by: order.modifiedBy || null,
    }),
    compactObject({
      ...common,
      shop_id: order.shopId,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      delivery: order.delivery,
      delivery_time: order.deliveryTime || null,
      ordered_by: order.orderedBy,
      validated_by: order.validatedBy || null,
      modified_by: order.modifiedBy || null,
    }),
    compactObject({
      ...common,
      shopId: order.shopId,
      shopName: order.shopName,
      shopColor: order.shopColor,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      delivery: order.delivery,
      deliveryTime: order.deliveryTime || null,
      orderedBy: order.orderedBy,
      validatedBy: order.validatedBy || null,
      modifiedBy: order.modifiedBy || null,
    }),
    compactObject({
      id: order.id,
      shop_id: order.shopId,
      items: order.items || [],
      status: order.status || 'pending',
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }),
  ];
}

export async function createOrder(order) {
  const sb = getSupabase();
  let lastError = null;

  for (const payload of buildOrderInsertVariants(order)) {
    const { data, error } = await sb.from('orders').insert(payload).select('*').single();
    if (!error) return normalizeOrderRow(data || payload);
    lastError = error;
  }

  throw lastError || new Error('Création de commande impossible');
}

function buildOrderPatchVariants(patch) {
  const updatedAt = patch.updatedAt || new Date().toISOString();

  return [
    compactObject({
      status: patch.status,
      items: patch.items,
      note: patch.note,
      comment: patch.comment,
      delivery_date: patch.delivery,
      delivery_time: patch.deliveryTime,
      validated_by: patch.validatedBy,
      modified_by: patch.modifiedBy,
      updated_at: updatedAt,
    }),
    compactObject({
      status: patch.status,
      items: patch.items,
      note: patch.note,
      comment: patch.comment,
      delivery: patch.delivery,
      delivery_time: patch.deliveryTime,
      validated_by: patch.validatedBy,
      modified_by: patch.modifiedBy,
      updated_at: updatedAt,
    }),
    compactObject({
      status: patch.status,
      items: patch.items,
      note: patch.note,
      comment: patch.comment,
      delivery: patch.delivery,
      deliveryTime: patch.deliveryTime,
      validatedBy: patch.validatedBy,
      modifiedBy: patch.modifiedBy,
      updatedAt,
    }),
  ].filter((payload) => Object.keys(payload).length > 0);
}

export async function patchOrder(orderId, patch) {
  const sb = getSupabase();
  let lastError = null;

  for (const payload of buildOrderPatchVariants(patch)) {
    const { data, error } = await sb.from('orders').update(payload).eq('id', orderId).select('*').single();
    if (!error) return normalizeOrderRow(data || { id: orderId, ...patch });
    lastError = error;
  }

  throw lastError || new Error('Mise à jour commande impossible');
}

export async function updateOrderStatus(orderId, status, updatedBy) {
  return patchOrder(orderId, { status, modifiedBy: updatedBy, updatedAt: new Date().toISOString() });
}

export async function loadOrdersIntoState(shopId = null) {
  setRuntimeFlag('ordersLoading', true);
  setRuntimeFlag('ordersError', '');
  try {
    const orders = await fetchOrders(shopId);
    A.orders = orders;
    setRuntimeFlag('ordersHydrated', true);
    setRuntimeFlag('lastOrdersSyncAt', new Date().toISOString());
    return orders;
  } catch (error) {
    const msg = error?.message || 'Chargement des commandes impossible';
    setRuntimeFlag('ordersError', msg);
    console.warn('[BOB] loadOrdersIntoState:', error);
    return A.orders;
  } finally {
    setRuntimeFlag('ordersLoading', false);
  }
}

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
  const rows = await tryQueries([
    () => sb.from('stock').select('*').eq('entity_id', entityId),
    () => sb.from('stock').select('*').eq('entityId', entityId),
  ]);
  return (rows || []).map(normalizeStockRow).filter(Boolean);
}

function buildStockPayloadVariants(entityId, productId, field, value) {
  const ts = new Date().toISOString();
  const base = field === 'qty' ? { qty: value } : { alert: value };
  return [
    compactObject({ entity_id: entityId, product_id: productId, ...base, updated_at: ts }),
    compactObject({ entity_id: entityId, productId: productId, ...base, updated_at: ts }),
    compactObject({ entityId, product_id: productId, ...base, updated_at: ts }),
    compactObject({ entityId, productId, ...base, updatedAt: ts }),
  ];
}

export async function updateStock(entityId, productId, field, value) {
  const sb = getSupabase();
  let lastError = null;
  for (const payload of buildStockPayloadVariants(entityId, productId, field, value)) {
    const { error } = await sb.from('stock').upsert(payload, { onConflict: 'entity_id,product_id' });
    if (!error) return true;
    lastError = error;
  }
  throw lastError || new Error('Mise à jour stock impossible');
}

export async function loadStockIntoState(entityIds = null) {
  setRuntimeFlag('stockLoading', true);
  setRuntimeFlag('stockError', '');

  const ids = Array.isArray(entityIds) && entityIds.length
    ? entityIds
    : ['kitchen', ...SHOPS.map((shop) => shop.id)];

  try {
    const nextStock = JSON.parse(JSON.stringify(A.stock || {}));
    ids.forEach((id) => {
      if (!nextStock[id]) nextStock[id] = {};
    });

    for (const entityId of ids) {
      const rows = await fetchStock(entityId);
      applyStockRowsToState(nextStock, rows);
    }

    A.stock = nextStock;
    setRuntimeFlag('stockHydrated', true);
    setRuntimeFlag('lastStockSyncAt', new Date().toISOString());
    return nextStock;
  } catch (error) {
    const msg = error?.message || 'Chargement du stock impossible';
    setRuntimeFlag('stockError', msg);
    console.warn('[BOB] loadStockIntoState:', error);
    return A.stock;
  } finally {
    setRuntimeFlag('stockLoading', false);
  }
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
    sender_id: senderId,
    content,
    priority,
    photo_url: photoUrl,
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  return data;
}

export function subscribeMessages(conversationId, callback) {
  const sb = getSupabase();
  return sb
    .channel(`messages-${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, callback)
    .subscribe();
}

// ── Storage photos ─────────────────────────────────────────
export async function uploadPhoto(file, path) {
  const sb = getSupabase();
  const { error } = await sb.storage.from('chat-photos').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = sb.storage.from('chat-photos').getPublicUrl(path);
  return urlData.publicUrl;
}

// ── Test connexion ─────────────────────────────────────────
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

/* ============================================================
   BOBtheBAGEL — js/api/supabase.js
   Client Supabase — CONFIGURÉ
   ============================================================ */

import { A, SHOPS, setRuntimeFlag, sv } from '../state.js';

const SUPABASE_URL      = 'https://wznalartaqvcehpohfsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFsYXJ0YXF2Y2VocG9oZnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzAzMzgsImV4cCI6MjA5MjAwNjMzOH0.MqomT4WEX5dMXpgEisG8S_0h165fmbsI70sfEtG8cl0';

let _client = null;
let _ordersChannel = null;
let _stockChannel = null;
let _refreshOrdersTimer = null;
let _refreshStockTimer = null;

function isTestMode() {
  return !!A.testProfile;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function persistLocalOrders(orders) {
  const nextOrders = sortOrdersDesc(clone(orders || []));
  A.orders = nextOrders;
  sv('or', nextOrders);
  return nextOrders;
}

function persistLocalStock(stock) {
  const nextStock = clone(stock || {});
  A.stock = nextStock;
  sv('st', nextStock);
  return nextStock;
}

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
  return (A.shops || SHOPS).find((shop) => shop.id === shopId) || SHOPS.find((shop) => shop.id === shopId) || null;
}

function debounce(fn, wait, timerKey) {
  clearTimeout(timerKey.current);
  timerKey.current = setTimeout(fn, wait);
}

const ordersDebounceRef = { current: null };
const stockDebounceRef = { current: null };

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

async function removeChannelSafe(channel) {
  const sb = getSupabase();
  if (!sb || !channel) return;
  try {
    await sb.removeChannel(channel);
  } catch {
    try {
      await channel.unsubscribe();
    } catch {
      // ignore
    }
  }
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

// ── Profiles (Manager CRUD) ────────────────────────────────
export async function fetchProfiles() {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb.from('profiles').select('*').order('name');
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name || row.email || '',
    role: row.role || 'user',
    photo: row.photo_url || null,
    email: row.email || null,
    shopIds: Array.isArray(row.shop_ids) ? row.shop_ids : [],
  }));
}

export async function upsertProfile(profile) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const payload = compactObject({
    id: profile.id,
    name: profile.name,
    role: profile.role || 'user',
    photo_url: profile.photo || null,
    email: profile.email || null,
    shop_ids: profile.shopIds || [],
  });
  const { error } = await sb.from('profiles').upsert(payload);
  if (error) throw error;
}

export async function deleteProfile(id) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { error } = await sb.from('profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function loadProfilesIntoState() {
  setRuntimeFlag('usersLoading', true);
  setRuntimeFlag('usersError', '');
  try {
    if (isTestMode()) {
      setRuntimeFlag('usersHydrated', true);
      return A.users;
    }
    const rows = await fetchProfiles();
    if (rows.length) {
      A.users = rows;
      sv('us', rows);
    }
    setRuntimeFlag('usersHydrated', true);
    return A.users;
  } catch (error) {
    setRuntimeFlag('usersError', error?.message || 'Chargement profils impossible');
    console.warn('[BOB] loadProfilesIntoState:', error);
    return A.users;
  } finally {
    setRuntimeFlag('usersLoading', false);
  }
}

// ── Shops (Manager CRUD) ───────────────────────────────────
export async function upsertShop(shop) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const payload = compactObject({
    id: shop.id,
    name: shop.name,
    color: shop.color || '#1A7A4A',
    is_active: shop.isActive !== false,
  });
  const { error } = await sb.from('shops').upsert(payload);
  if (error) throw error;
}

export async function deleteShop(id) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { error } = await sb.from('shops').delete().eq('id', id);
  if (error) throw error;
}

// ── Orders ─────────────────────────────────────────────────
export async function fetchOrders(shopId = null) {
  if (isTestMode()) {
    const orders = clone(A.orders || []);
    return sortOrdersDesc(shopId ? orders.filter((order) => order.shopId === shopId) : orders);
  }

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
  if (isTestMode()) {
    const nextOrders = persistLocalOrders([normalizeOrderRow(order), ...(A.orders || [])].filter(Boolean));
    return nextOrders.find((item) => item.id === order.id) || normalizeOrderRow(order);
  }

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
  if (isTestMode()) {
    const nextOrders = (A.orders || []).map((order) => (
      order.id === orderId
        ? normalizeOrderRow({ ...order, ...patch, id: orderId })
        : order
    ));
    const persisted = persistLocalOrders(nextOrders);
    return persisted.find((order) => order.id === orderId) || normalizeOrderRow({ id: orderId, ...patch });
  }

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
    if (isTestMode()) {
      const orders = await fetchOrders(shopId);
      A.orders = orders;
      setRuntimeFlag('ordersHydrated', true);
      setRuntimeFlag('lastOrdersSyncAt', new Date().toISOString());
      return orders;
    }

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

function normalizeShopRow(row) {
  if (!row) return null;
  return {
    id: pickFirst(row.id, row.slug),
    name: pickFirst(row.name, row.label, row.id),
    color: pickFirst(row.color, row.brand_color, '#888'),
  };
}

function fallbackShops() {
  return clone(A.shops && A.shops.length ? A.shops : SHOPS);
}

export async function loadShopsIntoState() {
  setRuntimeFlag('shopsLoading', true);
  setRuntimeFlag('shopsError', '');

  try {
    if (isTestMode()) {
      A.shops = fallbackShops();
      sv('sh', A.shops);
      setRuntimeFlag('shopsHydrated', true);
      setRuntimeFlag('lastShopsSyncAt', new Date().toISOString());
      return A.shops;
    }

    const rows = await fetchShops();
    const mapped = (rows || []).map(normalizeShopRow).filter((shop) => shop && shop.id);

    if (mapped.length) {
      A.shops = mapped;
      sv('sh', mapped);
    } else {
      A.shops = fallbackShops();
      sv('sh', A.shops);
    }

    setRuntimeFlag('shopsHydrated', true);
    setRuntimeFlag('lastShopsSyncAt', new Date().toISOString());
    return A.shops;
  } catch (error) {
    const msg = error?.message || 'Chargement des boutiques impossible';
    setRuntimeFlag('shopsError', msg);
    console.warn('[BOB] loadShopsIntoState:', error);
    if (!A.shops || !A.shops.length) {
      A.shops = fallbackShops();
      sv('sh', A.shops);
    }
    return A.shops;
  } finally {
    setRuntimeFlag('shopsLoading', false);
  }
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
  if (isTestMode()) {
    return Object.entries(A.stock?.[entityId] || {}).map(([productId, stock]) => ({
      entityId,
      productId,
      qty: Number(stock?.qty || 0),
      alert: Number(stock?.alert || 0),
    }));
  }

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
  if (isTestMode()) {
    const nextStock = clone(A.stock || {});
    if (!nextStock[entityId]) nextStock[entityId] = {};
    if (!nextStock[entityId][productId]) nextStock[entityId][productId] = { qty: 0, alert: 0 };
    nextStock[entityId][productId][field] = value;
    persistLocalStock(nextStock);
    return true;
  }

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

  const shopsList = (A.shops && A.shops.length) ? A.shops : SHOPS;
  const ids = Array.isArray(entityIds) && entityIds.length
    ? entityIds
    : ['kitchen', ...shopsList.map((shop) => shop.id)];

  try {
    if (isTestMode()) {
      const nextStock = clone(A.stock || {});
      ids.forEach((id) => {
        if (!nextStock[id]) nextStock[id] = {};
      });
      persistLocalStock(nextStock);
      setRuntimeFlag('stockHydrated', true);
      setRuntimeFlag('lastStockSyncAt', new Date().toISOString());
      return nextStock;
    }

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

export function subscribeStock(callback) {
  const sb = getSupabase();
  return sb
    .channel('stock-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, callback)
    .subscribe();
}

export async function stopRealtimeSync() {
  clearTimeout(ordersDebounceRef.current);
  clearTimeout(stockDebounceRef.current);
  ordersDebounceRef.current = null;
  stockDebounceRef.current = null;
  await removeChannelSafe(_ordersChannel);
  await removeChannelSafe(_stockChannel);
  _ordersChannel = null;
  _stockChannel = null;
}

export async function startRealtimeSync() {
  if (isTestMode()) return;

  const sb = getSupabase();
  if (!sb || !A.cUser) return;

  await stopRealtimeSync();

  _ordersChannel = subscribeOrders(() => {
    debounce(() => {
      loadOrdersIntoState().catch((error) => console.warn('[BOB] realtime orders refresh failed:', error));
    }, 250, ordersDebounceRef);
  });

  _stockChannel = subscribeStock(() => {
    debounce(() => {
      loadStockIntoState().catch((error) => console.warn('[BOB] realtime stock refresh failed:', error));
    }, 250, stockDebounceRef);
  });
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
export async function uploadPhoto(file, path, bucket = 'chat-photos') {
  const sb = getSupabase();
  const { error } = await sb.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// ── Planning ───────────────────────────────────────────────
function planningRowToState(row) {
  if (!row) return null;
  return {
    id: row.id,
    shopId: row.shop_id || row.shopId,
    staffId: row.staff_id || row.staffId || null,
    staffName: row.staff_name || row.staffName || 'Équipe',
    date: row.date,
    start: row.start_time || row.start || '08:00',
    end: row.end_time || row.end || '16:00',
    role: row.role || 'Matin',
    note: row.note || '',
    createdBy: row.created_by || row.createdBy || null,
    updatedAt: row.updated_at || row.updatedAt || null,
    createdAt: row.created_at || row.createdAt || null,
  };
}

function planningStateToRow(shift) {
  return compactObject({
    id: shift.id,
    shop_id: shift.shopId,
    staff_id: shift.staffId,
    staff_name: shift.staffName,
    date: shift.date,
    start_time: shift.start,
    end_time: shift.end,
    role: shift.role,
    note: shift.note,
    updated_at: shift.updatedAt || new Date().toISOString(),
  });
}

export async function fetchPlanning() {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb.from('planning').select('*').order('date').order('start_time');
  if (error) throw error;
  return (data || []).map(planningRowToState).filter(Boolean);
}

export async function upsertPlanningShift(shift) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const payload = planningStateToRow(shift);
  if (A.cUser?.id && !payload.created_by) payload.created_by = A.cUser.id;
  const { data, error } = await sb.from('planning').upsert(payload).select('*').single();
  if (error) throw error;
  return planningRowToState(data);
}

export async function deletePlanningShiftApi(id) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { error } = await sb.from('planning').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function loadPlanningIntoState() {
  setRuntimeFlag('planningLoading', true);
  setRuntimeFlag('planningError', '');
  try {
    if (isTestMode()) {
      setRuntimeFlag('planningHydrated', true);
      setRuntimeFlag('lastPlanningSyncAt', new Date().toISOString());
      return A.planning || [];
    }
    const rows = await fetchPlanning();
    A.planning = rows;
    sv('pl', rows);
    setRuntimeFlag('planningHydrated', true);
    setRuntimeFlag('lastPlanningSyncAt', new Date().toISOString());
    return rows;
  } catch (error) {
    setRuntimeFlag('planningError', error?.message || 'Chargement planning impossible');
    console.warn('[BOB] loadPlanningIntoState:', error);
    return A.planning || [];
  } finally {
    setRuntimeFlag('planningLoading', false);
  }
}

// ── Notifications ──────────────────────────────────────────
function notifRowToState(row) {
  if (!row) return null;
  let seenBy = {};
  if (row.seen_by) {
    if (typeof row.seen_by === 'string') {
      try { seenBy = JSON.parse(row.seen_by); } catch { seenBy = {}; }
    } else if (typeof row.seen_by === 'object') {
      seenBy = row.seen_by;
    }
  }
  return {
    id: row.id,
    type: row.type || 'info',
    role: row.role || 'admin',
    title: row.title || '',
    body: row.body || '',
    shopId: row.shop_id || null,
    orderId: row.order_id || null,
    createdBy: row.created_by || null,
    seenBy,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function notifStateToRow(notif) {
  return compactObject({
    id: notif.id,
    type: notif.type,
    role: notif.role || 'admin',
    title: notif.title,
    body: notif.body,
    shop_id: notif.shopId || null,
    order_id: notif.orderId || null,
    created_by: notif.createdBy || A.cUser?.id || null,
    seen_by: notif.seenBy || {},
    created_at: notif.createdAt,
  });
}

export async function fetchNotifications(limit = 200) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(notifRowToState).filter(Boolean);
}

export async function insertNotification(notif) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb.from('notifications').insert(notifStateToRow(notif)).select('*').single();
  if (error) throw error;
  return notifRowToState(data);
}

export async function updateNotificationSeen(id, seenBy) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { error } = await sb.from('notifications').update({ seen_by: seenBy }).eq('id', id);
  if (error) throw error;
}

export async function deleteNotificationApi(id) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { error } = await sb.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

export async function loadNotificationsIntoState() {
  setRuntimeFlag('notifsLoading', true);
  setRuntimeFlag('notifsError', '');
  try {
    if (isTestMode()) {
      setRuntimeFlag('notifsHydrated', true);
      setRuntimeFlag('lastNotifsSyncAt', new Date().toISOString());
      return A.notifications || [];
    }
    const rows = await fetchNotifications();
    A.notifications = rows;
    sv('nt', rows);
    setRuntimeFlag('notifsHydrated', true);
    setRuntimeFlag('lastNotifsSyncAt', new Date().toISOString());
    return rows;
  } catch (error) {
    setRuntimeFlag('notifsError', error?.message || 'Chargement notifs impossible');
    console.warn('[BOB] loadNotificationsIntoState:', error);
    return A.notifications || [];
  } finally {
    setRuntimeFlag('notifsLoading', false);
  }
}

// ── Calendar events ────────────────────────────────────────
function calRowToState(row) {
  if (!row) return null;
  let shopIds = [];
  if (row.shop_ids) {
    if (Array.isArray(row.shop_ids)) shopIds = row.shop_ids;
    else if (typeof row.shop_ids === 'string') {
      try { shopIds = JSON.parse(row.shop_ids); } catch { shopIds = []; }
    }
  }
  let checklist = [];
  if (row.checklist) {
    if (Array.isArray(row.checklist)) checklist = row.checklist;
    else if (typeof row.checklist === 'string') {
      try { checklist = JSON.parse(row.checklist); } catch { checklist = []; }
    }
  }
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    date: row.date,
    time: row.time || '',
    endTime: row.end_time || '',
    status: row.status || 'planned',
    colorTag: row.color_tag || null,
    eventType: row.event_type || 'generic',
    shops: shopIds,
    checklist,
    authorId: row.author_id || null,
    authorName: row.author_name || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function calStateToRow(evt) {
  return compactObject({
    id: evt.id,
    title: evt.title,
    description: evt.description || '',
    date: evt.date,
    time: evt.time || null,
    end_time: evt.endTime || null,
    status: evt.status || 'planned',
    color_tag: evt.colorTag || null,
    event_type: evt.eventType || 'generic',
    shop_ids: evt.shops || [],
    checklist: evt.checklist || [],
    author_id: evt.authorId || A.cUser?.id || null,
    author_name: evt.authorName || A.cUser?.name || '',
    updated_at: evt.updatedAt || new Date().toISOString(),
  });
}

export async function fetchCalendarEvents() {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb.from('calendar_events').select('*').order('date');
  if (error) throw error;
  return (data || []).map(calRowToState).filter(Boolean);
}

export async function upsertCalendarEvent(evt) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb.from('calendar_events').upsert(calStateToRow(evt)).select('*').single();
  if (error) throw error;
  return calRowToState(data);
}

export async function deleteCalendarEventApi(id) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { error } = await sb.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}

export async function loadCalendarIntoState() {
  setRuntimeFlag('eventsLoading', true);
  setRuntimeFlag('eventsError', '');
  try {
    if (isTestMode()) {
      setRuntimeFlag('eventsHydrated', true);
      setRuntimeFlag('lastEventsSyncAt', new Date().toISOString());
      return A.events || [];
    }
    const rows = await fetchCalendarEvents();
    A.events = rows;
    sv('ev', rows);
    setRuntimeFlag('eventsHydrated', true);
    setRuntimeFlag('lastEventsSyncAt', new Date().toISOString());
    return rows;
  } catch (error) {
    setRuntimeFlag('eventsError', error?.message || 'Chargement calendrier impossible');
    console.warn('[BOB] loadCalendarIntoState:', error);
    return A.events || [];
  } finally {
    setRuntimeFlag('eventsLoading', false);
  }
}

// ── Audits (save + delete + list) ─────────────────────────
export async function upsertAuditApi(audit) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const payload = compactObject({
    id: audit.id,
    shop_id: audit.shopId,
    shop_name: audit.shopName,
    auditor_id: audit.auditorId || A.cUser?.id || null,
    auditor_name: audit.auditorName || A.cUser?.name || '',
    status: audit.status,
    note: audit.note || '',
    photos: audit.photos || [],
    sections: audit.sections || [],
    score: typeof audit.score === 'number' ? audit.score : null,
    completed_at: audit.completedAt || null,
  });
  const { data, error } = await sb.from('audits').upsert(payload).select('*').single();
  if (error) throw error;
  return data;
}

// ── Realtime subscriptions (batch) ─────────────────────────
let _planningChannel = null;
let _notifsChannel = null;
let _eventsChannel = null;
let _auditsChannel = null;

export async function startExtraRealtime(refetchers = {}) {
  const sb = getSupabase();
  if (!sb) return;
  await stopExtraRealtime();
  const debPlan = { current: null };
  const debNot = { current: null };
  const debEv = { current: null };
  const debAud = { current: null };

  if (refetchers.planning) {
    _planningChannel = sb.channel('planning-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planning' }, () => debounce(refetchers.planning, 200, debPlan))
      .subscribe();
  }
  if (refetchers.notifications) {
    _notifsChannel = sb.channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => debounce(refetchers.notifications, 200, debNot))
      .subscribe();
  }
  if (refetchers.events) {
    _eventsChannel = sb.channel('calendar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => debounce(refetchers.events, 200, debEv))
      .subscribe();
  }
  if (refetchers.audits) {
    _auditsChannel = sb.channel('audits-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audits' }, () => debounce(refetchers.audits, 200, debAud))
      .subscribe();
  }
}

export async function stopExtraRealtime() {
  await removeChannelSafe(_planningChannel); _planningChannel = null;
  await removeChannelSafe(_notifsChannel);   _notifsChannel = null;
  await removeChannelSafe(_eventsChannel);   _eventsChannel = null;
  await removeChannelSafe(_auditsChannel);   _auditsChannel = null;
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

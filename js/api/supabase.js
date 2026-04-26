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

// Liste tous les profils (pour la vue Utilisateurs côté admin/boss). RLS sur la
// table profiles doit autoriser SELECT pour les rôles concernés.
export async function fetchProfiles() {
  const sb = getSupabase();
  const { data, error } = await sb.from('profiles').select('*').order('name');
  if (error) throw error;
  return data || [];
}

// Crée un compte Supabase Auth + ligne dans `profiles`, en restaurant la
// session de l'admin qui a déclenché l'opération (sinon signUp connecte
// automatiquement le nouveau compte). Idempotent : si l'email existe déjà,
// remonte l'erreur Supabase.
export async function createUserAccount({ email, password, name, role }) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');

  const trimmedEmail = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();
  if (!trimmedEmail || !password || !trimmedName || !role) {
    throw new Error('Champs requis : nom, email, mot de passe, rôle');
  }

  // 1) Sauvegarder la session admin pour pouvoir la restaurer.
  const { data: { session: adminSession } } = await sb.auth.getSession();

  // 2) Créer le compte. signUp() pose la session du nouveau user dans le
  //    client — on la défait ensuite.
  const { data: signUpData, error: signUpError } = await sb.auth.signUp({
    email: trimmedEmail,
    password,
    options: { data: { name: trimmedName, role } },
  });
  if (signUpError) {
    // Si l'admin avait une session, on la remet en place avant de remonter.
    if (adminSession) {
      try { await sb.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token }); } catch {}
    }
    throw signUpError;
  }

  const newUser = signUpData?.user;
  if (!newUser?.id) {
    throw new Error('Création du compte impossible (pas de user retourné)');
  }

  // 3) Inscrire le profil applicatif. Si la ligne existe déjà (trigger
  //    Supabase qui crée automatiquement la ligne profiles via auth hook),
  //    on bascule en update.
  const profilePayload = { id: newUser.id, name: trimmedName, role };
  let { error: insertError } = await sb.from('profiles').insert(profilePayload);
  if (insertError && /duplicate|already exists|conflict/i.test(insertError.message || '')) {
    const { error: updateError } = await sb.from('profiles').update({ name: trimmedName, role }).eq('id', newUser.id);
    if (updateError) {
      console.warn('[BOB] createUserAccount profile update fallback:', updateError);
    }
  } else if (insertError) {
    console.warn('[BOB] createUserAccount profile insert:', insertError);
  }

  // 4) Restaurer la session admin si elle existait.
  if (adminSession) {
    try {
      await sb.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    } catch (e) {
      console.warn('[BOB] createUserAccount restore admin session:', e);
    }
  } else {
    // Pas d'admin connecté au moment de la création (cas rare en mode test) :
    // on déconnecte le nouveau compte pour éviter un atterrissage inattendu.
    try { await sb.auth.signOut(); } catch {}
  }

  return {
    id: newUser.id,
    email: trimmedEmail,
    name: trimmedName,
    role,
    needs_email_confirmation: !signUpData.session,
  };
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
  return clone(Array.isArray(A.shops) && A.shops.length ? A.shops : SHOPS);
}

function ensureShops() {
  if (!Array.isArray(A.shops) || !A.shops.length) {
    A.shops = clone(SHOPS);
    sv('sh', A.shops);
  }
}

// Fusionne la liste Supabase avec la liste SHOPS par defaut pour qu'on
// affiche toujours les 3 boutiques canoniques (CARL BERNER, BJORVIKA,
// BOUTIQUE 3) meme quand la table `shops` distante n'a pas ete provisionnee
// completement. Les entrees Supabase prennent la priorite sur les SHOPS de
// meme id, et toute boutique Supabase supplementaire est conservee.
function mergeWithDefaultShops(remote) {
  const byId = new Map();
  SHOPS.forEach((shop) => byId.set(shop.id, clone(shop)));
  (remote || []).forEach((shop) => {
    if (shop && shop.id) byId.set(shop.id, clone(shop));
  });
  return Array.from(byId.values());
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
      ensureShops();
      return A.shops;
    }

    const rows = await fetchShops();
    const mapped = (rows || []).map(normalizeShopRow).filter((shop) => shop && shop.id);

    const merged = mergeWithDefaultShops(mapped);
    A.shops = merged;
    sv('sh', merged);

    setRuntimeFlag('shopsHydrated', true);
    setRuntimeFlag('lastShopsSyncAt', new Date().toISOString());
    ensureShops();
    return A.shops;
  } catch (error) {
    const msg = error?.message || 'Chargement des boutiques impossible';
    setRuntimeFlag('shopsError', msg);
    console.warn('[BOB] loadShopsIntoState:', error);
    ensureShops();
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

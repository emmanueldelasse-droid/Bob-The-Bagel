/* ============================================================
   BOBtheBAGEL — js/modules/chat.js
   Chat Supabase : conversations, messages, synchro live, états runtime
   ============================================================ */

import { A, sv, setRuntimeFlag } from '../state.js';
import { nISO, render, toast } from '../utils.js';
import { getSupabase } from '../api/supabase.js';

let _messagesChannel = null;
let _conversationsChannel = null;
const chatDebounceRef = { current: null };

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function debounce(fn, wait = 250) {
  clearTimeout(chatDebounceRef.current);
  chatDebounceRef.current = setTimeout(fn, wait);
}

function persistChatSeen() {
  sv('chat_seen', A.chatSeen);
}

function orderForConversation(orderId) {
  if (!orderId) return null;
  return A.orders.find((order) => order.id === orderId) || null;
}

function conversationIcon(type) {
  if (type === 'order') return '📦';
  if (type === 'shop') return '🏪';
  return '📢';
}

function conversationLabel(row) {
  const order = orderForConversation(row.order_id);
  if (row.label?.trim()) return row.label;
  if (order) return `${order.shopName || 'Commande'} · ${order.id}`;
  if (row.type === 'general') return 'Général';
  if (row.order_id) return `Commande ${row.order_id}`;
  return 'Conversation';
}

function normalizeConversation(row) {
  return {
    id: row.id,
    type: row.type || 'general',
    label: conversationLabel(row),
    orderId: row.order_id || null,
    shopId: row.shop_id || null,
    icon: conversationIcon(row.type),
    createdAt: row.created_at || nISO(),
  };
}

function normalizeMessage(row) {
  const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
  const me = row.sender_id === A.cUser?.id ? A.cUser : null;
  return {
    id: row.id,
    convId: row.conversation_id,
    senderId: row.sender_id,
    senderName: sender?.name || me?.name || '?',
    senderRole: sender?.role || me?.role || 'user',
    content: row.content || '',
    priority: row.priority || 'normal',
    photoUrl: row.photo_url || null,
    readBy: Array.isArray(row.read_by) ? row.read_by : [],
    createdAt: row.created_at || nISO(),
  };
}

async function fetchConversationsDb() {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const { data, error } = await sb
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeConversation);
}

async function ensureGeneralConversationDb() {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');

  const { data, error } = await sb
    .from('conversations')
    .select('*')
    .eq('type', 'general')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  if (data?.length) return normalizeConversation(data[0]);

  const { data: inserted, error: insertError } = await sb
    .from('conversations')
    .insert({ type: 'general', label: 'Général' })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return normalizeConversation(inserted);
}

async function fetchMessagesDb(conversationIds) {
  if (!conversationIds?.length) return [];
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');

  let data = null;
  let error = null;

  ({ data, error } = await sb
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id,name,role,photo_url)')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true })
    .limit(500));

  if (error) {
    ({ data, error } = await sb
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true })
      .limit(500));
  }

  if (error) throw error;
  return (data || []).map(normalizeMessage);
}

function currentActiveConversationId(conversations) {
  if (A.chatConvId && conversations.some((conv) => conv.id === A.chatConvId)) {
    return A.chatConvId;
  }
  return conversations[0]?.id || null;
}

function markConversationSeen(convId) {
  if (!convId) return;
  const latest = messagesForConv(convId).slice(-1)[0]?.createdAt || nISO();
  A.chatSeen = { ...A.chatSeen, [convId]: latest };
  persistChatSeen();
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

// ── Hydratation runtime ────────────────────────────────────
export async function loadChatIntoState() {
  setRuntimeFlag('chatLoading', true);
  setRuntimeFlag('chatError', '');

  try {
    let conversations = await fetchConversationsDb();
    if (!conversations.length) {
      await ensureGeneralConversationDb();
      conversations = await fetchConversationsDb();
    }

    const messages = await fetchMessagesDb(conversations.map((conv) => conv.id));

    A.conversations = conversations;
    A.messages = messages;
    A.chatConvId = currentActiveConversationId(conversations);

    setRuntimeFlag('chatHydrated', true);
    setRuntimeFlag('lastChatSyncAt', nISO());
    return { conversations, messages };
  } catch (error) {
    const msg = error?.message || 'Chargement du chat impossible';
    setRuntimeFlag('chatError', msg);
    console.warn('[BOB] loadChatIntoState:', error);
    return { conversations: A.conversations, messages: A.messages };
  } finally {
    setRuntimeFlag('chatLoading', false);
  }
}

// ── Sélection conversation ─────────────────────────────────
export function selectConv(convId) {
  A.chatConvId = convId;
  markConversationSeen(convId);
  render();

  setTimeout(() => {
    const feed = document.getElementById('chat-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, 50);
}

// ── Créer ou retrouver une conv liée à une commande ────────
export async function getOrCreateOrderConv(orderId, orderLabel) {
  const existing = A.conversations.find((conv) => conv.orderId === orderId);
  if (existing) {
    selectConv(existing.id);
    return existing.id;
  }

  const sb = getSupabase();
  if (!sb) {
    toast('Client Supabase indisponible', 'error');
    return null;
  }

  const order = orderForConversation(orderId);
  const payload = {
    type: 'order',
    label: orderLabel || (order ? `${order.shopName || 'Commande'} · ${order.id}` : `Commande ${orderId}`),
    order_id: orderId,
  };

  if (order?.shopId && isUuid(order.shopId)) {
    payload.shop_id = order.shopId;
  }

  try {
    let { data, error } = await sb
      .from('conversations')
      .select('*')
      .eq('order_id', orderId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      await loadChatIntoState();
      selectConv(data.id);
      return data.id;
    }

    ({ data, error } = await sb
      .from('conversations')
      .insert(payload)
      .select('*')
      .single());

    if (error) throw error;

    await loadChatIntoState();
    selectConv(data.id);
    return data.id;
  } catch (error) {
    console.warn('[BOB] getOrCreateOrderConv:', error);
    toast(error?.message || 'Conversation commande impossible', 'error');
    return null;
  }
}

// ── Envoi message ──────────────────────────────────────────
export async function sendMessage() {
  const text = (A.chatInput || '').trim();
  const convId = A.chatConvId || A.conversations[0]?.id;

  if (!text) return;
  if (!convId) {
    toast('Aucune conversation disponible', 'warn');
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    toast('Client Supabase indisponible', 'error');
    return;
  }

  try {
    const { error } = await sb.from('messages').insert({
      conversation_id: convId,
      sender_id: A.cUser?.id,
      content: text,
      priority: A.chatPriority || 'normal',
      read_by: A.cUser?.id ? [A.cUser.id] : [],
      created_at: nISO(),
    });

    if (error) throw error;

    A.chatInput = '';
    A.chatPriority = 'normal';
    await loadChatIntoState();
    markConversationSeen(convId);
    render();

    setTimeout(() => {
      const feed = document.getElementById('chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 50);
  } catch (error) {
    console.warn('[BOB] sendMessage:', error);
    toast(error?.message || 'Envoi du message impossible', 'error');
    render();
  }
}

export function setChatInput(v) {
  A.chatInput = v;
}

export function setChatPriority(v) {
  A.chatPriority = v;
  render();
}

// ── Non-lus (calcul local) ─────────────────────────────────
export function unreadForConv(convId) {
  const uid = A.cUser?.id;
  if (!uid) return 0;
  const seenAt = A.chatSeen?.[convId];
  return messagesForConv(convId).filter((msg) => {
    if (msg.senderId === uid) return false;
    if (!seenAt) return true;
    return new Date(msg.createdAt) > new Date(seenAt);
  }).length;
}

export function totalUnread() {
  return A.conversations.reduce((sum, conv) => sum + unreadForConv(conv.id), 0);
}

// ── Messages d'une conversation ────────────────────────────
export function messagesForConv(convId) {
  return A.messages
    .filter((msg) => msg.convId === convId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// ── Suppression non branchée côté base ─────────────────────
export function deleteMessage() {
  toast('Suppression de message non branchée côté base', 'warn');
}

// ── Ouvrir conv commande ───────────────────────────────────
export async function openOrderChat(orderId, orderLabel) {
  return getOrCreateOrderConv(orderId, orderLabel);
}

// ── Synchro live chat ──────────────────────────────────────
export async function stopChatRealtimeSync() {
  clearTimeout(chatDebounceRef.current);
  chatDebounceRef.current = null;
  await removeChannelSafe(_messagesChannel);
  await removeChannelSafe(_conversationsChannel);
  _messagesChannel = null;
  _conversationsChannel = null;
}

export async function startChatRealtimeSync() {
  const sb = getSupabase();
  if (!sb || !A.cUser) return;

  await stopChatRealtimeSync();

  _conversationsChannel = sb
    .channel('chat-conversations-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
      debounce(() => {
        loadChatIntoState().then(() => render()).catch((error) => console.warn('[BOB] realtime conversations refresh failed:', error));
      });
    })
    .subscribe();

  _messagesChannel = sb
    .channel('chat-messages-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      debounce(() => {
        loadChatIntoState().then(() => render()).catch((error) => console.warn('[BOB] realtime messages refresh failed:', error));
      });
    })
    .subscribe();
}

/* ============================================================
   BOBtheBAGEL — js/modules/chat.js
   Chat Supabase : conversations, messages, synchro live, états runtime
   ============================================================ */

import { A, sv, setRuntimeFlag } from '../state.js';
import { nISO, render, toast, gId } from '../utils.js';
import { getSupabase, uploadPhoto } from '../api/supabase.js';
import { createNotification } from './notifications.js';

const CHAT_PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 Mo

let _messagesChannel = null;
let _conversationsChannel = null;
let _presenceChannel = null;
let _presenceConvId = null;
let _typingClearTimer = null;
let _typingThrottleAt = 0;
const chatDebounceRef = { current: null };

function isTestMode() {
  return !!A.testProfile;
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function ensureLocalGeneralConv() {
  const existing = A.conversations.find((conv) => conv.type === 'general');
  if (existing) return existing;
  const local = {
    id: 'local-general',
    type: 'general',
    label: 'Général',
    orderId: null,
    shopId: null,
    icon: '📢',
    createdAt: nISO(),
  };
  A.conversations = [local, ...A.conversations];
  return local;
}

function debounce(fn, wait = 250) {
  clearTimeout(chatDebounceRef.current);
  chatDebounceRef.current = setTimeout(fn, wait);
}

function persistChatSeen() {
  sv('chat_seen', A.chatSeen);
}

const MENTION_REGEX = /@([\p{L}0-9][\p{L}0-9_-]{0,23})/gu;

export function parseMentions(text) {
  if (!text) return [];
  const normalize = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const found = new Set();
  const hits = [];
  let match;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    const nRaw = normalize(raw);
    let user = null;
    if (nRaw === 'manager' || nRaw === 'managers') {
      user = { id: '@manager', name: 'Manager', role: 'admin' };
    } else if (nRaw === 'team' || nRaw === 'team-btb' || nRaw === 'teambtb') {
      user = { id: '@user', name: 'Team BTB', role: 'user' };
    } else {
      user = A.users.find((u) => normalize(u.name) === nRaw || normalize(u.name).startsWith(nRaw));
    }
    if (user && !found.has(user.id)) {
      found.add(user.id);
      hits.push({ id: user.id, name: user.name, role: user.role, raw: match[0] });
    }
  }
  return hits;
}

function notifyMentions(message, mentions, convLabel) {
  if (!mentions.length) return;
  const sender = message.senderName || '?';
  const senderId = A.cUser?.id;
  const senderRole = A.cUser?.role;
  const rolesTargeted = new Set();
  mentions.forEach((m) => {
    if (m.id === senderId) return;
    if (m.id === '@manager' && senderRole === 'admin') return;
    if (m.id === '@user' && senderRole === 'user') return;
    const body = `${sender} · ${convLabel || 'Chat'}\n${message.content}`.slice(0, 400);
    if (m.id === '@manager') {
      if (rolesTargeted.has('admin')) return;
      rolesTargeted.add('admin');
      createNotification({ type: 'chat-mention', role: 'admin', title: `Mention @Manager`, body });
    } else if (m.id === '@user') {
      if (rolesTargeted.has('user')) return;
      rolesTargeted.add('user');
      createNotification({ type: 'chat-mention', role: 'user', title: `Mention @Team BTB`, body });
    } else {
      createNotification({ type: 'chat-mention', role: m.role || 'user', title: `@${m.name} mentionné(e)`, body });
    }
  });
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
  markMessagesReadBy(convId);
}

function markMessagesReadBy(convId) {
  const uid = A.cUser?.id;
  if (!uid || !convId) return;
  let changed = false;
  A.messages = A.messages.map((msg) => {
    if (msg.convId !== convId) return msg;
    if (msg.senderId === uid) return msg;
    const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
    if (readBy.includes(uid)) return msg;
    changed = true;
    return { ...msg, readBy: [...readBy, uid] };
  });
  if (!changed) return;

  if (!isTestMode()) {
    const sb = getSupabase();
    if (sb) {
      const ids = A.messages
        .filter((m) => m.convId === convId && m.senderId !== uid && Array.isArray(m.readBy) && m.readBy.includes(uid))
        .map((m) => m.id)
        .filter((id) => typeof id === 'string' && !id.startsWith('local-'));
      ids.forEach(async (messageId) => {
        try {
          const msg = A.messages.find((m) => m.id === messageId);
          await sb.from('messages').update({ read_by: msg.readBy }).eq('id', messageId);
        } catch (error) {
          console.warn('[BOB] read_by update failed:', error);
        }
      });
    }
  }
}

export function readersForMessage(message) {
  const ids = Array.isArray(message?.readBy) ? message.readBy : [];
  return ids
    .map((uid) => A.users.find((u) => u.id === uid) || (A.cUser?.id === uid ? A.cUser : null))
    .filter(Boolean);
}

export function expectedReadersForConv(convId) {
  const conv = A.conversations.find((c) => c.id === convId);
  const senderIds = new Set(A.messages.filter((m) => m.convId === convId).map((m) => m.senderId));
  const users = A.users.filter((u) => u.role !== 'kitchen' || conv?.type !== 'shop');
  const union = new Map();
  users.forEach((u) => union.set(u.id, u));
  senderIds.forEach((id) => {
    if (!union.has(id)) {
      const s = A.users.find((u) => u.id === id);
      if (s) union.set(id, s);
    }
  });
  return Array.from(union.values());
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
    if (isTestMode()) {
      ensureLocalGeneralConv();
      A.chatConvId = currentActiveConversationId(A.conversations);
      setRuntimeFlag('chatHydrated', true);
      setRuntimeFlag('lastChatSyncAt', nISO());
      return { conversations: A.conversations, messages: A.messages };
    }

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
    if (!A.conversations.length) ensureLocalGeneralConv();
    A.chatConvId = currentActiveConversationId(A.conversations);
    return { conversations: A.conversations, messages: A.messages };
  } finally {
    setRuntimeFlag('chatLoading', false);
  }
}

// ── Sélection conversation ─────────────────────────────────
export function selectConv(convId) {
  A.chatConvId = convId;
  A.typingUsers = [];
  markConversationSeen(convId);
  ensurePresenceChannel(convId);
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

  if (isTestMode()) {
    const order = orderForConversation(orderId);
    const local = {
      id: `local-order-${orderId}`,
      type: 'order',
      label: orderLabel || (order ? `${order.shopName || 'Commande'} · ${order.id}` : `Commande ${orderId}`),
      orderId,
      shopId: order?.shopId || null,
      icon: '📦',
      createdAt: nISO(),
    };
    A.conversations = [...A.conversations, local];
    selectConv(local.id);
    return local.id;
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

  const mentions = parseMentions(text);

  if (isTestMode()) {
    const msg = {
      id: `local-msg-${gId()}`,
      convId,
      senderId: A.cUser?.id,
      senderName: A.cUser?.name || '?',
      senderRole: A.cUser?.role || 'user',
      content: text,
      priority: A.chatPriority || 'normal',
      photoUrl: null,
      mentions,
      readBy: A.cUser?.id ? [A.cUser.id] : [],
      createdAt: nISO(),
    };
    A.messages = [...A.messages, msg];
    A.chatInput = '';
    A.chatPriority = 'normal';
    markConversationSeen(convId);
    const conv = A.conversations.find((c) => c.id === convId);
    notifyMentions(msg, mentions, conv?.label);
    render();
    setTimeout(() => {
      const feed = document.getElementById('chat-feed');
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, 50);
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
      mentions: mentions.length ? mentions : null,
      read_by: A.cUser?.id ? [A.cUser.id] : [],
      created_at: nISO(),
    });

    if (error) throw error;

    A.chatInput = '';
    A.chatPriority = 'normal';
    await loadChatIntoState();
    markConversationSeen(convId);
    const conv = A.conversations.find((c) => c.id === convId);
    notifyMentions({
      senderName: A.cUser?.name || '?',
      content: text,
    }, mentions, conv?.label);
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Lecture fichier impossible'));
    reader.readAsDataURL(file);
  });
}

// ── Envoi photo ────────────────────────────────────────────
export async function sendChatPhoto(file) {
  if (!file) return;
  const convId = A.chatConvId || A.conversations[0]?.id;
  if (!convId) {
    toast('Aucune conversation disponible', 'warn');
    return;
  }
  if (!file.type?.startsWith('image/')) {
    toast('Fichier non image', 'error');
    return;
  }
  if (file.size > CHAT_PHOTO_MAX_BYTES) {
    toast('Image trop lourde (max 2 Mo)', 'error');
    return;
  }

  const caption = (A.chatInput || '').trim();
  const priority = A.chatPriority || 'normal';

  if (isTestMode()) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      A.messages = [...A.messages, {
        id: `local-msg-${gId()}`,
        convId,
        senderId: A.cUser?.id,
        senderName: A.cUser?.name || '?',
        senderRole: A.cUser?.role || 'user',
        content: caption,
        priority,
        photoUrl: dataUrl,
        readBy: A.cUser?.id ? [A.cUser.id] : [],
        createdAt: nISO(),
      }];
      A.chatInput = '';
      A.chatPriority = 'normal';
      markConversationSeen(convId);
      render();
      setTimeout(() => {
        const feed = document.getElementById('chat-feed');
        if (feed) feed.scrollTop = feed.scrollHeight;
      }, 50);
    } catch (error) {
      console.warn('[BOB] sendChatPhoto local:', error);
      toast('Envoi photo impossible', 'error');
    }
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    toast('Client Supabase indisponible', 'error');
    return;
  }

  try {
    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `chat/${convId}/${Date.now()}-${gId('P')}.${ext}`;
    const publicUrl = await uploadPhoto(file, path);

    const { error } = await sb.from('messages').insert({
      conversation_id: convId,
      sender_id: A.cUser?.id,
      content: caption,
      priority,
      photo_url: publicUrl,
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
    console.warn('[BOB] sendChatPhoto:', error);
    toast(error?.message || 'Envoi photo impossible', 'error');
  }
}

export function triggerChatPhotoInput() {
  document.getElementById('chat-photo-input')?.click();
}

export async function handleChatPhotoChange(event) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;
  try {
    await sendChatPhoto(file);
  } finally {
    if (input) input.value = '';
  }
}

export function setChatInput(v) {
  A.chatInput = v;
  if (v && v.trim()) broadcastTyping(true);
  else broadcastTyping(false);
}

export function toggleMentionPicker() {
  A.mentionPickerOpen = !A.mentionPickerOpen;
  render();
}

export function insertMention(token) {
  if (!token) return;
  const current = A.chatInput || '';
  const trimmed = current.replace(/\s+$/, '');
  const sep = trimmed.length ? ' ' : '';
  A.chatInput = `${trimmed}${sep}${token} `;
  A.mentionPickerOpen = false;
  render();
  setTimeout(() => {
    const input = document.getElementById('chat-input');
    if (input) {
      input.focus();
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(A.chatInput.length, A.chatInput.length);
      }
    }
  }, 20);
}

function broadcastTyping(isTyping) {
  const sb = getSupabase();
  if (!sb || !_presenceChannel || isTestMode() || !A.cUser) return;

  const now = Date.now();
  if (isTyping && now - _typingThrottleAt < 800) {
    clearTimeout(_typingClearTimer);
    _typingClearTimer = setTimeout(() => broadcastTyping(false), 4000);
    return;
  }
  if (isTyping) _typingThrottleAt = now;

  try {
    _presenceChannel.track({
      userId: A.cUser.id,
      name: A.cUser.name,
      role: A.cUser.role,
      typing: !!isTyping,
      at: nISO(),
    });
  } catch (error) {
    console.warn('[BOB] presence track failed:', error);
  }
  if (isTyping) {
    clearTimeout(_typingClearTimer);
    _typingClearTimer = setTimeout(() => broadcastTyping(false), 4000);
  } else {
    _typingThrottleAt = 0;
  }
}

async function ensurePresenceChannel(convId) {
  const sb = getSupabase();
  if (!sb || !convId || isTestMode()) return;
  if (_presenceChannel && _presenceConvId === convId) return;

  _presenceConvId = convId;
  const oldChannel = _presenceChannel;
  _presenceChannel = null;
  if (oldChannel) {
    try { await sb.removeChannel(oldChannel); } catch { /* ignore */ }
  }
  // Guard against another selectConv racing us while we awaited above.
  if (_presenceConvId !== convId) return;

  _presenceChannel = sb.channel(`chat-presence-${convId}`, {
    config: { presence: { key: A.cUser?.id || `anon-${Math.random().toString(36).slice(2, 8)}` } },
  });

  _presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = _presenceChannel.presenceState();
      const typing = [];
      Object.keys(state || {}).forEach((key) => {
        const entries = state[key];
        entries.forEach((e) => {
          if (e.typing && e.userId !== A.cUser?.id) {
            typing.push({ id: e.userId, name: e.name, role: e.role });
          }
        });
      });
      A.typingUsers = typing;
      render();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        _presenceChannel.track({ userId: A.cUser?.id, name: A.cUser?.name, role: A.cUser?.role, typing: false, at: nISO() });
      }
    });
}

export function typingUsersForActiveConv() {
  return Array.isArray(A.typingUsers) ? A.typingUsers : [];
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
  clearTimeout(_typingClearTimer);
  _typingClearTimer = null;
  await removeChannelSafe(_messagesChannel);
  await removeChannelSafe(_conversationsChannel);
  await removeChannelSafe(_presenceChannel);
  _messagesChannel = null;
  _conversationsChannel = null;
  _presenceChannel = null;
  _presenceConvId = null;
}

export async function startChatRealtimeSync() {
  if (isTestMode()) return;

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

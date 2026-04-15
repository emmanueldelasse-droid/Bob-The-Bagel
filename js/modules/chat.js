/* ============================================================
   BOBtheBAGEL — js/modules/chat.js
   Logique messagerie interne
   Prototype localStorage — migration Supabase Realtime prévue
   ============================================================ */

import { A, sv } from '../state.js';
import { nISO, gId, render, toast } from '../utils.js';

// ── Sélection conversation ─────────────────────────────────
export function selectConv(convId) {
  A.chatConvId = convId;
  // Marquer tous les messages de cette conv comme lus
  A.messages = A.messages.map(m =>
    m.convId === convId && !m.readBy.includes(A.cUser?.id)
      ? { ...m, readBy: [...m.readBy, A.cUser?.id] }
      : m
  );
  sv('msg', A.messages);
  render();
}

// ── Créer ou retrouver une conv liée à une commande ────────
export function getOrCreateOrderConv(orderId, orderLabel) {
  const existing = A.conversations.find(c => c.orderId === orderId);
  if (existing) {
    selectConv(existing.id);
    return existing.id;
  }
  const conv = {
    id:      'conv-' + gId(),
    type:    'order',
    orderId,
    label:   orderLabel,
    icon:    '📦',
  };
  A.conversations = [...A.conversations, conv];
  sv('conv', A.conversations);
  selectConv(conv.id);
  return conv.id;
}

// ── Envoi message ──────────────────────────────────────────
export function sendMessage() {
  const text = (A.chatInput || '').trim();
  if (!text) return;

  const msg = {
    id:       gId('MSG'),
    convId:   A.chatConvId,
    senderId: A.cUser?.id,
    senderName: A.cUser?.name || '?',
    senderRole: A.cUser?.role || 'user',
    content:  text,
    priority: A.chatPriority || 'normal',
    createdAt: nISO(),
    readBy:   [A.cUser?.id],
  };

  A.messages = [...A.messages, msg];
  sv('msg', A.messages);
  A.chatInput    = '';
  A.chatPriority = 'normal';
  render();

  // Scroll vers le bas après render
  setTimeout(() => {
    const feed = document.getElementById('chat-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, 50);
}

export function setChatInput(v)    { A.chatInput = v; }
export function setChatPriority(v) { A.chatPriority = v; render(); }

// ── Non-lus ────────────────────────────────────────────────
/**
 * Retourne le nombre de messages non lus toutes conversations confondues
 * pour l'utilisateur courant.
 */
export function totalUnread() {
  const uid = A.cUser?.id;
  if (!uid) return 0;
  return A.messages.filter(m => !m.readBy.includes(uid)).length;
}

/**
 * Non-lus pour une conversation précise.
 */
export function unreadForConv(convId) {
  const uid = A.cUser?.id;
  if (!uid) return 0;
  return A.messages.filter(m => m.convId === convId && !m.readBy.includes(uid)).length;
}

// ── Messages d'une conversation ────────────────────────────
export function messagesForConv(convId) {
  return A.messages
    .filter(m => m.convId === convId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// ── Supprimer un message (admin seulement) ─────────────────
export function deleteMessage(msgId) {
  A.messages = A.messages.filter(m => m.id !== msgId);
  sv('msg', A.messages);
  render();
}

// ── Ouvrir ou créer conv liée à une commande ──────────────
/**
 * Appelé depuis les fiches commande (boutique + cuisine).
 * Crée la conversation si elle n'existe pas, la sélectionne,
 * et bascule automatiquement sur l'onglet chat.
 */
export function openOrderChat(orderId, orderLabel) {
  // Cherche une conv existante pour cette commande
  const existing = A.conversations.find(c => c.orderId === orderId);
  if (existing) {
    selectConv(existing.id);
    return;
  }
  // Crée la conv
  const conv = {
    id:      'conv-' + gId(),
    type:    'order',
    orderId,
    label:   orderLabel,
    icon:    '📦',
  };
  A.conversations = [...A.conversations, conv];
  sv('conv', A.conversations);
  selectConv(conv.id);
}

/* ============================================================
   BOBtheBAGEL - views/chat.js
   Interface messagerie interne
   ============================================================ */

import { A } from '../state.js';
import { escHtml, fD, fT, safeImageUrl, textToHtml } from '../utils.js';
import {
  messagesForConv,
  unreadForConv,
  totalUnread,
  readersForMessage,
  expectedReadersForConv,
} from '../modules/chat.js';

function roleColor(role) {
  if (role === 'admin') return '#E8294B';
  if (role === 'kitchen') return '#D97706';
  return '#2563EB';
}

function roleLabel(role) {
  if (role === 'admin') return 'Manager';
  if (role === 'kitchen') return 'Cuisine';
  return 'Team BTB';
}

function runtimePanel({ kind = 'info', title, text, meta = '' }) {
  const tones = {
    info: {
      bg: A.dark ? '#1C2433' : '#EFF6FF',
      border: A.dark ? '#2E4C77' : '#BFDBFE',
      color: A.dark ? '#BFDBFE' : '#1D4ED8',
      icon: '⏳',
    },
    warn: {
      bg: A.dark ? '#2D1B00' : '#FFF7ED',
      border: A.dark ? '#7C4A03' : '#FED7AA',
      color: A.dark ? '#FCD34D' : '#9A3412',
      icon: '⚠️',
    },
    ok: {
      bg: A.dark ? '#10261A' : '#ECFDF5',
      border: A.dark ? '#1F5C3A' : '#BBF7D0',
      color: A.dark ? '#86EFAC' : '#166534',
      icon: '✓',
    },
  };
  const tone = tones[kind] || tones.info;

  return `
    <div style="background:${tone.bg};border:1px solid ${tone.border};border-radius:8px;padding:10px 12px;margin:0 14px 12px;color:${tone.color}">
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="font-size:14px;line-height:1.2">${tone.icon}</div>
        <div style="min-width:0">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;letter-spacing:.2px">${escHtml(title)}</div>
          <div style="font-size:12px;line-height:1.45;margin-top:2px">${textToHtml(text)}</div>
          ${meta ? `<div style="font-size:11px;opacity:.85;margin-top:4px">${textToHtml(meta)}</div>` : ''}
        </div>
      </div>
    </div>`;
}

function chatRuntimeNotice() {
  const r = A.runtime || {};
  if (r.chatLoading && !r.chatHydrated) {
    return runtimePanel({
      kind: 'info',
      title: 'Chargement des messages',
      text: 'Les conversations sont en cours de synchronisation avec Supabase.',
    });
  }
  if (r.chatError) {
    return runtimePanel({
      kind: 'warn',
      title: 'Synchronisation chat incomplète',
      text: r.chatError,
      meta: r.lastChatSyncAt ? `Dernière synchro OK : ${fD(r.lastChatSyncAt)} · ${fT(r.lastChatSyncAt)}` : 'Aucune synchro confirmée pour le moment.',
    });
  }
  if (r.chatHydrated && r.lastChatSyncAt) {
    return runtimePanel({
      kind: 'ok',
      title: 'Chat synchronisé',
      text: 'Les conversations et messages affichés proviennent de Supabase.',
      meta: `Dernière synchro : ${fD(r.lastChatSyncAt)} · ${fT(r.lastChatSyncAt)}`,
    });
  }
  return '';
}

function readReceipt(message, isMe) {
  if (!isMe) return '';
  const readers = readersForMessage(message).filter((u) => u.id !== message.senderId);
  const expected = expectedReadersForConv(message.convId).filter((u) => u.id !== message.senderId);
  if (!expected.length) return '';
  const readCount = readers.length;

  if (readCount === 0) {
    return `<div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;text-align:right">Envoyé</div>`;
  }

  const chips = readers.slice(0, 4).map((u) => {
    const initial = escHtml((u.name || '?').charAt(0).toUpperCase());
    return `<span title="${escHtml(u.name)}" style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:${roleColor(u.role)};color:#fff;font-size:8px;font-weight:700;border:1px solid var(--txt)">${initial}</span>`;
  }).join('');
  const more = readers.length > 4 ? `<span style="font-size:9px;color:rgba(255,255,255,.6);margin-left:2px">+${readers.length - 4}</span>` : '';

  const prefix = readCount === expected.length
    ? `<span style="font-size:10px;color:rgba(255,255,255,.75);font-weight:700">Vu par tous</span>`
    : `<span style="font-size:10px;color:rgba(255,255,255,.65)">Vu · ${readCount}/${expected.length}</span>`;

  return `
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:3px">
      ${prefix}
      <span style="display:inline-flex;gap:2px">${chips}${more}</span>
    </div>`;
}

function msgBubble(message) {
  const isMe = message.senderId === A.cUser?.id;
  const isUrgent = message.priority === 'urgent';
  const senderName = message.senderName || '?';
  const senderInitial = senderName.trim().charAt(0).toUpperCase() || '?';
  const photoUrl = safeImageUrl(message.photoUrl);

  const bubbleBg = isMe
    ? 'var(--txt)'
    : isUrgent
      ? (A.dark ? '#3D1515' : '#FFF1F1')
      : 'var(--bg2)';

  const bubbleClr = isMe ? 'var(--bg2)' : 'var(--txt)';
  const align = isMe ? 'flex-end' : 'flex-start';

  return `
    <div style="display:flex;flex-direction:column;align-items:${align};margin-bottom:10px;max-width:100%">
      ${!isMe ? `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;padding:0 2px">
          <div style="width:20px;height:20px;border-radius:6px;background:${roleColor(message.senderRole)};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${escHtml(senderInitial)}</div>
          <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px;color:var(--txt2)">${escHtml(senderName)}</span>
          <span style="font-size:10px;color:var(--txt3)">${roleLabel(message.senderRole)}</span>
        </div>
      ` : ''}

      <div style="max-width:72%;padding:9px 13px;border-radius:${isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px'};background:${bubbleBg};color:${bubbleClr};box-shadow:var(--sh);border:1px solid ${isUrgent && !isMe ? '#FECACA' : 'transparent'};word-break:break-word;position:relative">
        ${isUrgent ? `
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:${isMe ? 'rgba(255,255,255,.6)' : '#E8294B'};margin-bottom:4px;display:flex;align-items:center;gap:4px">🚨 URGENT</div>
        ` : ''}
        <div style="font-size:13px;line-height:1.5">${textToHtml(message.content)}</div>
        ${photoUrl ? `
          <div style="margin-top:8px">
            <img src="${escHtml(photoUrl)}" alt="Photo message" style="max-width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.12);display:block" />
          </div>
        ` : ''}
        <div style="font-size:10px;color:${isMe ? 'rgba(255,255,255,.5)' : 'var(--txt3)'};margin-top:4px;text-align:right">${fT(message.createdAt)}</div>
        ${readReceipt(message, isMe)}
      </div>
    </div>`;
}

function convList() {
  const conversations = A.conversations;
  if (!conversations.length) {
    return `<div style="padding:16px;font-size:12px;color:var(--txt3)">Aucune conversation disponible.</div>`;
  }

  return conversations.map((conv) => {
    const unread = unreadForConv(conv.id);
    const isActive = A.chatConvId === conv.id;
    const lastMsg = [...A.messages.filter((msg) => msg.convId === conv.id)]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const label = escHtml(conv.label);
    const preview = lastMsg ? escHtml(`${lastMsg.senderName} : ${lastMsg.content}`) : '';

    return `
      <button
        onclick="window.__BOB__.selectConv('${conv.id}')"
        style="width:100%;text-align:left;padding:11px 14px;border:none;cursor:pointer;background:${isActive ? 'var(--bg3)' : 'transparent'};border-left:3px solid ${isActive ? 'var(--txt)' : 'transparent'};transition:all .12s;display:flex;align-items:center;gap:10px"
        onmouseover="if(!${isActive})this.style.background='var(--bg3)'"
        onmouseout="if(!${isActive})this.style.background='transparent'"
      >
        <div style="width:36px;height:36px;border-radius:10px;background:${conv.type === 'general' ? 'var(--txt)' : 'var(--bg)'};border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${conv.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt);display:flex;align-items:center;justify-content:space-between;gap:6px">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</span>
            ${unread > 0 ? `<span style="background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0">${unread}</span>` : ''}
          </div>
          ${lastMsg ? `
            <div style="font-size:11px;color:var(--txt3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${preview}</div>
          ` : `
            <div style="font-size:11px;color:var(--txt3);margin-top:2px">Aucun message</div>
          `}
        </div>
      </button>`;
  }).join('');
}

function inputZone(activeConv) {
  const isUrgent = A.chatPriority === 'urgent';
  const disabled = !activeConv;

  return `
    <div style="padding:10px 14px;background:var(--bg2);border-top:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <button
          onclick="${disabled ? '' : `window.__BOB__.setChatPriority(${isUrgent ? "'normal'" : "'urgent'"})` }"
          style="height:26px;padding:0 10px;border-radius:20px;border:1.5px solid ${isUrgent ? 'var(--red)' : 'var(--border)'};background:${isUrgent ? 'var(--red)' : 'transparent'};color:${isUrgent ? '#fff' : 'var(--txt3)'};font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:.5px;cursor:${disabled ? 'default' : 'pointer'};transition:all .12s;display:flex;align-items:center;gap:4px;opacity:${disabled ? '.5' : '1'}"
        >🚨 URGENT</button>
        ${isUrgent && !disabled ? `<span style="font-size:11px;color:var(--red);font-weight:600">Mode urgent activé</span>` : ''}
      </div>

      <div style="display:flex;gap:8px;align-items:flex-end">
        <input type="file" id="chat-photo-input" accept="image/*" style="display:none" onchange="window.__BOB__.handleChatPhotoChange(event)" />
        <button
          onclick="${disabled ? '' : 'window.__BOB__.triggerChatPhotoInput()'}"
          title="Envoyer une photo"
          style="width:40px;height:40px;flex-shrink:0;background:transparent;color:var(--txt2);border:1.5px solid var(--border);border-radius:10px;font-size:16px;cursor:${disabled ? 'default' : 'pointer'};display:flex;align-items:center;justify-content:center;transition:all .12s;opacity:${disabled ? '.5' : '1'}"
          onmouseover="if(!${disabled}){this.style.borderColor='var(--txt)';this.style.color='var(--txt)'}"
          onmouseout="if(!${disabled}){this.style.borderColor='var(--border)';this.style.color='var(--txt2)'}"
        >📎</button>

        <textarea
          id="chat-input"
          placeholder="${disabled ? 'Aucune conversation disponible…' : 'Écrire un message…'}"
          ${disabled ? 'disabled' : ''}
          oninput="window.__BOB__.setChatInput(this.value)"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window.__BOB__.sendMessage()}"
          style="flex:1;min-height:40px;max-height:120px;padding:10px 12px;border:1.5px solid ${isUrgent ? 'var(--red)' : 'var(--border)'};border-radius:10px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;resize:none;outline:none;line-height:1.5;transition:border-color .15s;opacity:${disabled ? '.6' : '1'}"
          onfocus="this.style.borderColor='var(--txt)'"
          onblur="this.style.borderColor='${isUrgent ? 'var(--red)' : 'var(--border)'}'"
        >${A.chatInput || ''}</textarea>

        <button
          onclick="${disabled ? '' : 'window.__BOB__.sendMessage()'}"
          style="width:40px;height:40px;flex-shrink:0;background:var(--txt);color:var(--bg2);border:none;border-radius:10px;font-size:18px;cursor:${disabled ? 'default' : 'pointer'};display:flex;align-items:center;justify-content:center;transition:opacity .12s;opacity:${disabled ? '.5' : '1'}"
          onmouseover="if(!${disabled})this.style.opacity='.8'"
          onmouseout="this.style.opacity='${disabled ? '.5' : '1'}'"
        >↑</button>
      </div>
      <div style="font-size:10px;color:var(--txt3);margin-top:5px;padding:0 2px">Entrée pour envoyer · 📎 pour joindre une photo · Shift+Entrée pour sauter une ligne</div>
    </div>`;
}

export function bChat() {
  const activeConv = A.conversations.find((conv) => conv.id === A.chatConvId) || A.conversations[0] || null;
  const msgs = activeConv ? messagesForConv(activeConv.id) : [];
  const notice = chatRuntimeNotice();
  const loadingOnly = A.runtime.chatLoading && !A.runtime.chatHydrated;

  return `
    <div style="max-width:720px;width:100%;margin:0 auto;display:flex;flex-direction:column;height:calc(100vh - 140px);min-height:400px">
      <div style="padding-top:14px">${notice}</div>
      <div style="display:flex;flex:1;overflow:hidden;border:1px solid var(--border);border-radius:10px;background:var(--bg2);margin:0 14px 14px">
        <div style="width:220px;flex-shrink:0;border-right:1px solid var(--border);overflow-y:auto;display:flex;flex-direction:column">
          <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);letter-spacing:-.2px">Messages</div>
          ${convList()}
        </div>

        <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">
          ${activeConv ? `
            <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0">
              <div style="width:32px;height:32px;border-radius:8px;background:${activeConv.type === 'general' ? 'var(--txt)' : 'var(--bg3)'};border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px">${activeConv.icon}</div>
              <div>
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt)">${escHtml(activeConv.label)}</div>
                <div style="font-size:11px;color:var(--txt3)">${msgs.length} message${msgs.length > 1 ? 's' : ''}</div>
              </div>
            </div>

            <div id="chat-feed" style="flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;-webkit-overflow-scrolling:touch;scroll-behavior:smooth">
              ${loadingOnly && !msgs.length ? `
                <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--txt2)">Synchronisation du fil en cours…</div>
              ` : msgs.length === 0 ? `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center">
                  <div style="font-size:32px;margin-bottom:10px">${activeConv.icon}</div>
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt);margin-bottom:4px">${escHtml(activeConv.label)}</div>
                  <div style="font-size:13px;color:var(--txt2)">Aucun message pour l'instant.<br>Soyez le premier à écrire.</div>
                </div>
              ` : `
                ${msgs.map((message, index) => {
                  const prev = msgs[index - 1];
                  const showDate = !prev || fD(message.createdAt) !== fD(prev.createdAt);
                  return `
                    ${showDate ? `
                      <div style="text-align:center;margin:8px 0 14px;font-size:11px;font-weight:600;color:var(--txt3);display:flex;align-items:center;gap:8px">
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                        ${fD(message.createdAt)}
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                      </div>
                    ` : ''}
                    ${msgBubble(message)}`;
                }).join('')}
              `}
            </div>

            ${inputZone(activeConv)}
          ` : `
            <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;color:var(--txt3);font-size:13px">
              ${loadingOnly ? 'Chargement des conversations…' : 'Aucune conversation disponible pour le moment.'}
            </div>
            ${inputZone(null)}
          `}
        </div>
      </div>
    </div>`;
}

export function chatBadge() {
  const n = totalUnread();
  if (n === 0) return '';
  return `<span style="background:var(--red);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;margin-left:4px;vertical-align:middle">${n > 9 ? '9+' : n}</span>`;
}

/* ============================================================
   BOBtheBAGEL — views/chat.js
   Interface messagerie interne
   ============================================================ */

import { A }  from '../state.js';
import { fD, fT } from '../utils.js';
import { isAdmin } from '../auth.js';
import {
  messagesForConv,
  unreadForConv,
  totalUnread,
  selectConv,
} from '../modules/chat.js';

// ─────────────────────────────────────────────────────────────
// COULEURS RÔLES
// ─────────────────────────────────────────────────────────────
function roleColor(role) {
  if (role === 'admin')   return '#E8294B';
  if (role === 'kitchen') return '#D97706';
  return '#2563EB';
}

function roleLabel(role) {
  if (role === 'admin')   return 'Admin';
  if (role === 'kitchen') return 'Cuisine';
  return 'Boutique';
}

// ─────────────────────────────────────────────────────────────
// BULLE MESSAGE
// ─────────────────────────────────────────────────────────────
function msgBubble(m) {
  const isMe    = m.senderId === A.cUser?.id;
  const isUrgent = m.priority === 'urgent';

  const bubbleBg  = isMe
    ? 'var(--txt)'
    : isUrgent
      ? (A.dark ? '#3D1515' : '#FFF1F1')
      : 'var(--bg2)';

  const bubbleClr = isMe ? 'var(--bg2)' : 'var(--txt)';
  const align     = isMe ? 'flex-end' : 'flex-start';

  return `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:${align};
      margin-bottom:10px;
      max-width:100%
    ">
      <!-- Expéditeur (affiché seulement si pas moi) -->
      ${!isMe ? `
        <div style="
          display:flex;align-items:center;gap:6px;
          margin-bottom:3px;padding:0 2px
        ">
          <div style="
            width:20px;height:20px;border-radius:6px;
            background:${roleColor(m.senderRole)};
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:700;color:#fff;flex-shrink:0
          ">${m.senderName?.[0] || '?'}</div>
          <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px;color:var(--txt2)">${m.senderName}</span>
          <span style="font-size:10px;color:var(--txt3)">${roleLabel(m.senderRole)}</span>
        </div>
      ` : ''}

      <!-- Bulle -->
      <div style="
        max-width:72%;
        padding:9px 13px;
        border-radius:${isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px'};
        background:${bubbleBg};
        color:${bubbleClr};
        box-shadow:var(--sh);
        border:1px solid ${isUrgent && !isMe ? '#FECACA' : 'transparent'};
        word-break:break-word;
        position:relative
      ">
        ${isUrgent ? `
          <div style="
            font-family:'Syne',sans-serif;font-weight:700;
            font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
            color:${isMe ? 'rgba(255,255,255,.6)' : '#E8294B'};
            margin-bottom:4px;display:flex;align-items:center;gap:4px
          ">🚨 URGENT</div>
        ` : ''}
        <div style="font-size:13px;line-height:1.5">${m.content}</div>
        <div style="
          font-size:10px;
          color:${isMe ? 'rgba(255,255,255,.5)' : 'var(--txt3)'};
          margin-top:4px;text-align:right
        ">${fT(m.createdAt)}</div>
      </div>

      <!-- Supprimer (admin) -->
      ${isAdmin() ? `
        <button
          onclick="window.__BOB__.deleteMessage('${m.id}')"
          style="
            font-size:10px;color:var(--txt3);background:none;border:none;
            cursor:pointer;padding:2px 4px;margin-top:2px;opacity:.5
          "
          onmouseover="this.style.opacity='1';this.style.color='var(--red)'"
          onmouseout="this.style.opacity='.5';this.style.color='var(--txt3)'"
        >✕</button>
      ` : ''}
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// LISTE DES CONVERSATIONS (sidebar)
// ─────────────────────────────────────────────────────────────
function convList() {
  const convs = A.conversations;

  return convs.map(conv => {
    const unread   = unreadForConv(conv.id);
    const isActive = A.chatConvId === conv.id;
    const lastMsg  = [...(A.messages.filter(m => m.convId === conv.id))]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    return `
      <button
        onclick="window.__BOB__.selectConv('${conv.id}')"
        style="
          width:100%;text-align:left;
          padding:11px 14px;border:none;cursor:pointer;
          background:${isActive ? 'var(--bg3)' : 'transparent'};
          border-left:3px solid ${isActive ? 'var(--txt)' : 'transparent'};
          transition:all .12s;
          display:flex;align-items:center;gap:10px
        "
        onmouseover="if(!${isActive})this.style.background='var(--bg3)'"
        onmouseout="if(!${isActive})this.style.background='transparent'"
      >
        <!-- Icône -->
        <div style="
          width:36px;height:36px;border-radius:10px;
          background:${conv.type === 'general' ? 'var(--txt)' : 'var(--bg)'};
          border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          font-size:16px;flex-shrink:0
        ">${conv.icon}</div>

        <!-- Infos -->
        <div style="flex:1;min-width:0">
          <div style="
            font-family:'Syne',sans-serif;font-weight:700;font-size:13px;
            color:var(--txt);
            display:flex;align-items:center;justify-content:space-between;gap:6px
          ">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${conv.label}</span>
            ${unread > 0 ? `
              <span style="
                background:var(--red);color:#fff;
                font-size:10px;font-weight:700;
                padding:1px 6px;border-radius:10px;flex-shrink:0
              ">${unread}</span>
            ` : ''}
          </div>
          ${lastMsg ? `
            <div style="font-size:11px;color:var(--txt3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${lastMsg.senderName} : ${lastMsg.content}
            </div>
          ` : `
            <div style="font-size:11px;color:var(--txt3);margin-top:2px">Aucun message</div>
          `}
        </div>
      </button>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────
// ZONE SAISIE
// ─────────────────────────────────────────────────────────────
function inputZone() {
  const isUrgent = A.chatPriority === 'urgent';

  return `
    <div style="
      padding:10px 14px;
      background:var(--bg2);
      border-top:1px solid var(--border)
    ">
      <!-- Toggle urgence -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <button
          onclick="window.__BOB__.setChatPriority(${isUrgent ? "'normal'" : "'urgent'"})"
          style="
            height:26px;padding:0 10px;border-radius:20px;
            border:1.5px solid ${isUrgent ? 'var(--red)' : 'var(--border)'};
            background:${isUrgent ? 'var(--red)' : 'transparent'};
            color:${isUrgent ? '#fff' : 'var(--txt3)'};
            font-family:'Syne',sans-serif;font-weight:700;font-size:10px;
            letter-spacing:.5px;cursor:pointer;transition:all .12s;
            display:flex;align-items:center;gap:4px
          "
        >🚨 URGENT</button>
        ${isUrgent ? `<span style="font-size:11px;color:var(--red);font-weight:600">Mode urgent activé</span>` : ''}
      </div>

      <!-- Saisie + bouton -->
      <div style="display:flex;gap:8px;align-items:flex-end">
        <textarea
          id="chat-input"
          placeholder="Écrire un message…"
          oninput="window.__BOB__.setChatInput(this.value)"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window.__BOB__.sendMessage()}"
          style="
            flex:1;
            min-height:40px;max-height:120px;
            padding:10px 12px;
            border:1.5px solid ${isUrgent ? 'var(--red)' : 'var(--border)'};
            border-radius:10px;
            background:var(--bg);color:var(--txt);
            font-family:'Space Grotesk',sans-serif;font-size:13px;
            resize:none;outline:none;line-height:1.5;
            transition:border-color .15s
          "
          onfocus="this.style.borderColor='var(--txt)'"
          onblur="this.style.borderColor='${isUrgent ? 'var(--red)' : 'var(--border)'}'"
        >${A.chatInput || ''}</textarea>

        <button
          onclick="window.__BOB__.sendMessage()"
          style="
            width:40px;height:40px;flex-shrink:0;
            background:var(--txt);color:var(--bg2);
            border:none;border-radius:10px;
            font-size:18px;cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            transition:opacity .12s
          "
          onmouseover="this.style.opacity='.8'"
          onmouseout="this.style.opacity='1'"
        >↑</button>
      </div>
      <div style="font-size:10px;color:var(--txt3);margin-top:5px;padding:0 2px">
        Entrée pour envoyer · Shift+Entrée pour sauter une ligne
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// VUE CHAT PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function bChat() {
  const activeConv = A.conversations.find(c => c.id === A.chatConvId) || A.conversations[0];
  const msgs       = activeConv ? messagesForConv(activeConv.id) : [];

  // Sur mobile : si une conv est sélectionnée, on affiche le fil
  // Sur desktop : sidebar + fil côte à côte

  return `
    <div style="
      max-width:720px;width:100%;margin:0 auto;
      display:flex;flex-direction:column;
      height:calc(100vh - 140px);
      min-height:400px
    ">

      <!-- Layout desktop : sidebar + feed -->
      <div style="display:flex;flex:1;overflow:hidden;border:1px solid var(--border);border-radius:10px;background:var(--bg2);margin:14px">

        <!-- SIDEBAR conversations -->
        <div style="
          width:220px;flex-shrink:0;
          border-right:1px solid var(--border);
          overflow-y:auto;
          display:flex;flex-direction:column
        ">
          <div style="
            padding:12px 14px;
            border-bottom:1px solid var(--border);
            font-family:'Syne',sans-serif;font-weight:800;font-size:13px;
            color:var(--txt);letter-spacing:-.2px
          ">Messages</div>
          ${convList()}
        </div>

        <!-- CONTENU : fil + saisie -->
        <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">

          ${activeConv ? `
            <!-- Header conversation -->
            <div style="
              padding:12px 14px;
              border-bottom:1px solid var(--border);
              display:flex;align-items:center;gap:10px;
              flex-shrink:0
            ">
              <div style="
                width:32px;height:32px;border-radius:8px;
                background:${activeConv.type === 'general' ? 'var(--txt)' : 'var(--bg3)'};
                border:1px solid var(--border);
                display:flex;align-items:center;justify-content:center;font-size:14px
              ">${activeConv.icon}</div>
              <div>
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--txt)">${activeConv.label}</div>
                <div style="font-size:11px;color:var(--txt3)">${msgs.length} message${msgs.length > 1 ? 's' : ''}</div>
              </div>
            </div>

            <!-- Fil messages -->
            <div
              id="chat-feed"
              style="
                flex:1;overflow-y:auto;
                padding:16px 14px;
                display:flex;flex-direction:column;
                -webkit-overflow-scrolling:touch;
                scroll-behavior:smooth
              "
            >
              ${msgs.length === 0 ? `
                <div style="
                  flex:1;display:flex;flex-direction:column;
                  align-items:center;justify-content:center;
                  padding:40px 20px;text-align:center
                ">
                  <div style="font-size:32px;margin-bottom:10px">${activeConv.icon}</div>
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt);margin-bottom:4px">
                    ${activeConv.label}
                  </div>
                  <div style="font-size:13px;color:var(--txt2)">
                    Aucun message pour l'instant.<br>Soyez le premier à écrire.
                  </div>
                </div>
              ` : `
                ${msgs.map((m, i) => {
                  // Afficher la date si c'est un nouveau jour
                  const prev = msgs[i - 1];
                  const showDate = !prev || fD(m.createdAt) !== fD(prev.createdAt);
                  return `
                    ${showDate ? `
                      <div style="
                        text-align:center;margin:8px 0 14px;
                        font-size:11px;font-weight:600;color:var(--txt3);
                        display:flex;align-items:center;gap:8px
                      ">
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                        ${fD(m.createdAt)}
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                      </div>
                    ` : ''}
                    ${msgBubble(m)}`;
                }).join('')}
              `}
            </div>

            <!-- Zone saisie -->
            ${inputZone()}

          ` : `
            <div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--txt3);font-size:13px">
              Sélectionnez une conversation
            </div>
          `}

        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// BADGE NON-LUS pour les tabs (exporté)
// ─────────────────────────────────────────────────────────────
export function chatBadge() {
  const n = totalUnread();
  if (n === 0) return '';
  return `<span style="
    background:var(--red);color:#fff;
    font-size:9px;font-weight:700;
    padding:1px 5px;border-radius:10px;
    margin-left:4px;vertical-align:middle
  ">${n > 9 ? '9+' : n}</span>`;
}

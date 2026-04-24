/* ============================================================
   BOBtheBAGEL — views/modals.js v2
   ============================================================ */

import { A }              from '../state.js';
import { gP, fDl, cSec, fD, fT, escHtml } from '../utils.js';
import { notificationsForRole } from '../modules/notifications.js';

export function bCfm() {
  return `
    <div class="overlay" onclick="if(event.target===this)window.__BOB__.cxCf()">
      <div class="modal fade">
        <div class="modal-title">${A.confirm.msg}</div>
        <p style="font-size:13px;color:var(--txt2);margin:8px 0 24px">Cette action ne peut pas être annulée.</p>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-full" onclick="window.__BOB__.okCf()">Confirmer</button>
          <button class="btn btn-ghost btn-full" onclick="window.__BOB__.cxCf()">Annuler</button>
        </div>
      </div>
    </div>`;
}

export function bSum() {
  const s = A.summary;
  if (!s) return '';

  const items = s.items || [];
  const cats  = [...new Set(items.map(i => gP(i.id)?.cat).filter(Boolean))];
  const total = items.reduce((sum, i) => sum + (gP(i.id)?.price || 0) * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return `
    <div class="sheet-overlay" onclick="if(event.target===this)window.__BOB__.cxSum()">
      <div class="sheet">
        <div class="sheet-handle"></div>

        <!-- Header -->
        <div style="margin-bottom:20px">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--txt);letter-spacing:-.3px;margin-bottom:4px">
            Confirmer la commande
          </div>
          <div style="font-size:13px;color:var(--txt2)">
            📦 ${fDl(s.del)}${s.delT ? ` · ⏰ ${s.delT}` : ''} · ${count} article${count > 1 ? 's' : ''}
          </div>
        </div>

        <!-- Items groupés par catégorie -->
        ${cats.map(cat => `
          <div style="margin-bottom:12px">
            <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);padding:4px 0 8px;font-family:'Syne',sans-serif">
              ${cat}
            </div>
            ${items.filter(i => gP(i.id)?.cat === cat).map(item => {
              const p = gP(item.id);
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:13px;color:var(--txt);font-weight:500">${p?.name}</span>
                  <span style="font-size:13px;font-weight:700;color:var(--txt)">${item.qty} <span style="font-weight:400;color:var(--txt3)">${p?.unit}</span></span>
                </div>`;
            }).join('')}
          </div>
        `).join('')}

        ${total > 0 ? `
          <div style="padding:12px 0;border-top:2px solid var(--txt);margin-top:4px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600;color:var(--txt)">Total estimé</span>
            <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--txt)">${total} kr</span>
          </div>
        ` : ''}

        ${s.note ? `
          <div style="background:var(--bg3);border-radius:var(--r2);padding:10px 12px;font-size:13px;color:var(--txt2);margin-top:12px">
            💬 ${s.note}
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display:flex;gap:8px;margin-top:20px">
          <button class="btn btn-primary btn-lg" style="flex:2" onclick="window.__BOB__.sbO()">
            Envoyer la commande →
          </button>
          <button class="btn btn-ghost btn-lg" style="flex:1" onclick="window.__BOB__.cxSum()">Annuler</button>
        </div>
      </div>
    </div>`;
}

export function bReserve() {
  const d = A.reserveDraft;
  if (!d) return '';
  const order = A.orders.find((o) => o.id === d.orderId);
  if (!order) return '';

  return `
    <div class="sheet-overlay" onclick="if(event.target===this)window.__BOB__.cancelReserveDraft()">
      <div class="sheet">
        <div class="sheet-handle"></div>

        <div style="margin-bottom:18px">
          <div class="display" style="font-size:20px;color:var(--txt);margin-bottom:4px">Signaler une réserve</div>
          <div style="font-size:13px;color:var(--txt2)">${order.id} · Indique ce qui manque ou est anormal — le Manager sera notifié.</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px">
          ${d.items.map((it) => {
            const p = gP(it.id);
            const delta = (it.actual || 0) - (it.expected || 0);
            return `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg2)">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--txt)">${p?.name || it.id}</div>
                  <div style="font-size:11px;color:var(--txt3)">Attendu : ${it.expected} ${p?.unit || ''}</div>
                </div>
                <input type="number" min="0" value="${it.actual}"
                  oninput="window.__BOB__.setReserveItem('${it.id}','actual',this.value)"
                  style="width:72px;height:34px;padding:0 8px;border:1.5px solid var(--border);border-radius:6px;background:var(--bg2);color:var(--txt);font-size:13px;outline:none;text-align:right"/>
                <span style="font-size:11px;font-weight:700;min-width:28px;text-align:right;color:${delta === 0 ? 'var(--txt3)' : delta < 0 ? 'var(--red)' : 'var(--green)'}">
                  ${delta === 0 ? '—' : delta > 0 ? `+${delta}` : delta}
                </span>
              </div>`;
          }).join('')}
        </div>

        <div style="margin-top:14px">
          <div class="label" style="margin-bottom:6px">Note / anomalie</div>
          <textarea class="textarea" rows="3" placeholder="Ex: 2 bagels écrasés, pain oignon absent…"
            oninput="window.__BOB__.setReserveNote(this.value)">${escHtml(d.note || '')}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:18px">
          <button class="btn btn-primary btn-lg" style="flex:2;background:var(--amber);border-color:var(--amber)" onclick="window.__BOB__.submitReserve()">
            Envoyer la réserve ⚠
          </button>
          <button class="btn btn-ghost btn-lg" style="flex:1" onclick="window.__BOB__.cancelReserveDraft()">Annuler</button>
        </div>
      </div>
    </div>`;
}

export function bNotifCenter() {
  if (!A.showNotifs || !A.cUser) return '';
  const list = notificationsForRole(A.cUser.role);

  return `
    <div class="sheet-overlay" onclick="if(event.target===this)window.__BOB__.toggleNotifs()">
      <div class="sheet" style="max-width:480px">
        <div class="sheet-handle"></div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div class="display" style="font-size:18px;color:var(--txt)">Notifications</div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.markAllNotifsSeen(window.__BOB__.A.cUser)">Tout marquer lu</button>
            <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleNotifs()">✕</button>
          </div>
        </div>

        ${list.length === 0 ? `
          <div style="padding:40px 10px;text-align:center;color:var(--txt3);font-size:13px">Aucune notification</div>
        ` : list.slice(0, 40).map((n) => {
          const seen = n.seenBy?.[A.cUser.id];
          return `
            <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);${seen ? 'opacity:.65' : ''}">
              <div style="width:6px;align-self:stretch;border-radius:3px;background:${seen ? 'var(--border)' : 'var(--amber)'};flex-shrink:0"></div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px;color:var(--txt)">${escHtml(n.title)}</div>
                <div style="font-size:12px;color:var(--txt2);white-space:pre-wrap;margin-top:2px">${escHtml(n.body)}</div>
                <div style="font-size:10px;color:var(--txt3);margin-top:4px">${fD(n.createdAt)} · ${fT(n.createdAt)}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                ${seen ? '' : `<button class="btn btn-ghost btn-sm" onclick="window.__BOB__.markNotificationSeen('${n.id}',window.__BOB__.A.cUser)">Lu</button>`}
                <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--red)" onclick="window.__BOB__.removeNotification('${n.id}')">✕</button>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

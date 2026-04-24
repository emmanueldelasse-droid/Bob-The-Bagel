/* ============================================================
   BOBtheBAGEL — views/select.js v2
   ============================================================ */

import { A, ROLE_LABELS } from '../state.js';
import { canAccessKitchen, isAdmin } from '../auth.js';
import { unseenCountForUser } from '../modules/notifications.js';

export function bSelect() {
  const u = A.cUser;

  return `
    <div class="center-page">
      <!-- Actions top right -->
      <div style="position:absolute;top:16px;right:16px;display:flex;gap:6px;align-items:center">
        ${(() => {
          const n = unseenCountForUser(A.cUser);
          return `
            <button class="btn btn-ghost btn-sm btn-icon" style="position:relative;font-size:15px" onclick="window.__BOB__.toggleNotifs()">
              🔔
              ${n > 0 ? `<span style="position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:8px;display:flex;align-items:center;justify-content:center;line-height:1">${n > 9 ? '9+' : n}</span>` : ''}
            </button>`;
        })()}
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.toggleDark()" style="font-size:15px">◑</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.logout()">Déconnexion</button>
      </div>

      <div style="width:100%;max-width:380px" class="fade">
        <!-- User -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:36px">
          <div style="width:52px;height:52px;border-radius:12px;background:var(--txt);display:flex;align-items:center;justify-content:center;color:var(--bg2);font-size:20px;font-weight:700;flex-shrink:0;overflow:hidden">
            ${u?.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : (u?.name?.[0] || '?')}
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--txt);letter-spacing:-.3px">
              Bonjour, ${u?.name || ''} 👋
            </div>
            <div class="label" style="margin-top:2px">${(ROLE_LABELS[u?.role] || u?.role || '').toUpperCase()}</div>
          </div>
        </div>

        <!-- Titre -->
        <div class="label" style="margin-bottom:12px">Choisir un espace</div>

        <!-- Boutiques -->
        <div style="display:flex;flex-direction:column;gap:8px">
          ${(A.shops || []).map(sh => `
            <button
              onclick="window.__BOB__.goShop('${sh.id}')"
              style="
                background:var(--bg2);
                border:1.5px solid var(--border);
                border-radius:var(--r);
                padding:16px 18px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                text-align:left;
                transition:border-color .12s, box-shadow .12s;
              "
              onmouseover="this.style.borderColor='${sh.color}';this.style.boxShadow='0 0 0 3px ${sh.color}22'"
              onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'"
            >
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:10px;height:10px;border-radius:50%;background:${sh.color};flex-shrink:0"></div>
                <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.2px;color:var(--txt)">
                  ${sh.name}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color:var(--txt3)">
                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          `).join('')}

          ${canAccessKitchen() ? `
            <button
              onclick="window.__BOB__.goKit()"
              style="
                background:var(--txt);
                border:1.5px solid var(--txt);
                border-radius:var(--r);
                padding:16px 18px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-top:4px;
              "
            >
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:10px;height:10px;border-radius:50%;background:var(--amber);flex-shrink:0"></div>
                <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.2px;color:var(--bg2)">
                  Cuisine centrale
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color:rgba(255,255,255,.5)">
                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : ''}

          ${isAdmin() ? `
            <button
              onclick="window.__BOB__.goAdm()"
              style="
                background:var(--red);
                border:1.5px solid var(--red);
                border-radius:var(--r);
                padding:16px 18px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                margin-top:4px;
              "
            >
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:10px;height:10px;border-radius:50%;background:#fff;flex-shrink:0"></div>
                <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.2px;color:#fff">
                  Panneau admin
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color:rgba(255,255,255,.5)">
                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : ''}
        </div>
      </div>
    </div>`;
}

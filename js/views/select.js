/* ============================================================
   BOBtheBAGEL — js/views/select.js
   Sélection du contexte : boutique ou cuisine centrale
   ============================================================ */

import { A }       from '../state.js';
import { SHOPS }   from '../state.js';
import { isAdmin, canAccessKitchen } from '../auth.js';

export function bSelect() {
  const u = A.cUser;

  return `
    <div class="cp">
      <div style="position:absolute;top:16px;right:16px;display:flex;gap:8px;align-items:center">
        <button class="bgh" style="font-size:12px" onclick="window.__BOB__.toggleDark()">
          ${A.dark ? '☀️' : '🌙'}
        </button>
        <button class="bgh" style="font-size:12px" onclick="window.__BOB__.logout()">
          Déconnexion
        </button>
      </div>

      <div style="text-align:center;margin-bottom:32px">
        <div style="width:60px;height:60px;border-radius:50%;background:var(--gn);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;margin:0 auto 14px;overflow:hidden">
          ${u?.photo ? `<img src="${u.photo}" style="width:100%;height:100%;object-fit:cover">` : (u?.name?.[0] || '?')}
        </div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:18px;color:var(--bk);letter-spacing:1px">
          Bonjour, ${u?.name || ''} 👋
        </div>
        <div style="font-size:12px;color:var(--mt);margin-top:4px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:2px">
          ${(u?.role || '').toUpperCase()}
        </div>
      </div>

      <div style="width:100%;max-width:340px">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:11px;letter-spacing:4px;color:var(--mt);text-align:center;margin-bottom:14px">
          CHOISIR UN ESPACE
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          ${SHOPS.map(sh => `
            <button
              onclick="window.__BOB__.goShop('${sh.id}')"
              style="
                background:var(--bg2);
                border:2px solid ${sh.color};
                border-radius:14px;
                padding:18px 20px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                min-height:64px;
                transition:all .15s;
              "
            >
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:12px;height:12px;border-radius:50%;background:${sh.color};flex-shrink:0"></div>
                <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:2px;color:var(--bk)">
                  ${sh.name}
                </span>
              </div>
              <span style="color:var(--mt);font-size:18px">→</span>
            </button>
          `).join('')}

          ${canAccessKitchen() ? `
            <button
              onclick="window.__BOB__.goKit()"
              style="
                background:#111;
                border:2px solid #111;
                border-radius:14px;
                padding:18px 20px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                min-height:64px;
                margin-top:4px;
              "
            >
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:12px;height:12px;border-radius:50%;background:var(--yl);flex-shrink:0"></div>
                <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:2px;color:#fff">
                  CUISINE CENTRALE
                </span>
              </div>
              <span style="color:#fff;font-size:18px">→</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>`;
}

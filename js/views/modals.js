/* ============================================================
   BOBtheBAGEL — js/views/modals.js
   Modales : confirmation, résumé commande
   ============================================================ */

import { A }    from '../state.js';
import { gP, fDl, cSec } from '../utils.js';

// ── Dialog de confirmation générique ──────────────────────
export function bCfm() {
  return `
    <div class="mo" onclick="if(event.target===this)window.__BOB__.cxCf()">
      <div class="mb fade">
        <div style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:16px;line-height:1.5;margin-bottom:22px;color:var(--bk)">
          ${A.confirm.msg}
        </div>
        <div style="display:flex;gap:10px">
          <button class="bgn" style="flex:1;min-height:50px" onclick="window.__BOB__.okCf()">OUI</button>
          <button
            style="flex:1;background:var(--gy);border:none;padding:14px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;cursor:pointer;min-height:50px;color:var(--bk)"
            onclick="window.__BOB__.cxCf()"
          >NON</button>
        </div>
      </div>
    </div>`;
}

// ── Bottom sheet résumé commande avant envoi ───────────────
export function bSum() {
  const s = A.summary;
  if (!s) return '';

  const items = s.items || [];
  const cats  = [...new Set(items.map(i => gP(i.id)?.cat).filter(Boolean))];
  const total = items.reduce((sum, i) => {
    const p = gP(i.id);
    return sum + (p?.price || 0) * i.qty;
  }, 0);

  return `
    <div class="bs" onclick="if(event.target===this)window.__BOB__.cxSum()">
      <div class="bsc fade">
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:22px;color:var(--gn);letter-spacing:2px;margin-bottom:4px">
          CONFIRMER L'ENVOI
        </div>
        <div style="font-family:'DM Sans',sans-serif;font-size:12px;color:var(--mt);margin-bottom:16px">
          📦 ${fDl(s.del)}${s.delT ? ` · ⏰ ${s.delT}` : ''}
        </div>

        ${cats.map(cat => `
          <div style="margin-bottom:12px">
            ${cSec(cat)}
            ${items
              .filter(i => gP(i.id)?.cat === cat)
              .map(item => {
                const p = gP(item.id);
                return `
                  <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--br)">
                    <span style="font-family:'DM Sans',sans-serif;font-size:13px;color:var(--bk)">${p?.name}</span>
                    <span style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;color:var(--bk)">${item.qty} ${p?.unit}</span>
                  </div>`;
              }).join('')}
          </div>
        `).join('')}

        ${total > 0 ? `
          <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;color:var(--gn);margin-top:8px">
            💰 Total : ${total} kr
          </div>
        ` : ''}

        ${s.note ? `
          <div style="background:#FFFBF0;border:1px solid #F0E8C0;padding:10px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:12px;color:#666;margin-top:10px">
            💬 ${s.note}
          </div>
        ` : ''}

        <div style="display:flex;gap:10px;margin-top:18px">
          <button class="bgn" style="flex:2;min-height:52px;font-size:16px;letter-spacing:2px" onclick="window.__BOB__.sbO()">
            ENVOYER →
          </button>
          <button
            style="flex:1;background:var(--gy);border:none;padding:14px;border-radius:10px;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;cursor:pointer;min-height:52px;color:var(--bk)"
            onclick="window.__BOB__.cxSum()"
          >ANNULER</button>
        </div>
      </div>
    </div>`;
}

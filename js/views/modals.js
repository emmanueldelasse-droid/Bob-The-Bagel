/* ============================================================
   BOBtheBAGEL — views/modals.js v2
   ============================================================ */

import { A }              from '../state.js';
import { gP, fDl, cSec } from '../utils.js';

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

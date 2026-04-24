/* ============================================================
   BOBtheBAGEL - views/planning.js
   Section Planning reutilisable (admin global + contextuel shop)
   ============================================================ */

import { A } from '../state.js';
import { isAdmin } from '../auth.js';
import { shiftsForShop, weekRange, SHIFT_ROLES } from '../modules/planning.js';
import { fDl } from '../utils.js';

function shopColor(shopId) {
  return A.shops?.find((s) => s.id === shopId)?.color || 'var(--green)';
}

function shopName(shopId) {
  return A.shops?.find((s) => s.id === shopId)?.name || shopId;
}

function controls() {
  const isShopCtx = A.planContext === 'shop';
  const activeShopId = isShopCtx ? (A.selShop?.id || A.planShop) : A.planShop;
  const refDate = A.planRefDate || new Date().toISOString().split('T')[0];

  return `
    <div style="
      padding:12px 14px;
      background:var(--bg2);
      border-bottom:1px solid var(--border);
      display:flex;flex-wrap:wrap;gap:8px;align-items:center
    ">
      <div style="display:flex;align-items:center;gap:4px">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.shiftPlanRef(-7)">‹</button>
        <input type="date" value="${refDate}"
          onchange="window.__BOB__.setPlanRefDate(this.value)"
          style="height:32px;padding:0 10px;border:1.5px solid var(--border);border-radius:6px;background:var(--bg2);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none"
        />
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.shiftPlanRef(7)">›</button>
        <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.planToday()" style="margin-left:4px">Aujourd'hui</button>
      </div>

      <div style="display:flex;gap:4px">
        <button class="tab ${A.planTab === 'week' ? 'on' : ''}" style="font-size:12px;padding:0 12px;height:32px"
          onclick="window.__BOB__.setPlanTab('week')">Semaine</button>
        <button class="tab ${A.planTab === 'list' ? 'on' : ''}" style="font-size:12px;padding:0 12px;height:32px"
          onclick="window.__BOB__.setPlanTab('list')">Liste</button>
      </div>

      ${!isShopCtx && (A.shops || []).length > 1 ? `
        <select class="select" style="height:32px"
          onchange="window.__BOB__.setPlanShopFilter(this.value)">
          <option value="">Toutes boutiques</option>
          ${A.shops.map((s) => `<option value="${s.id}" ${A.planShop === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      ` : ''}

      ${isAdmin() ? `
        <button class="btn btn-primary btn-sm" style="margin-left:auto"
          onclick="window.__BOB__.openPlanDraft('${activeShopId || ''}')">+ Nouveau shift</button>
      ` : ''}
    </div>`;
}

function draftForm() {
  const d = A.planDraft;
  if (!d) return '';

  const shopOptions = (A.shops || []).map((s) => `<option value="${s.id}" ${d.shopId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
  const staffOptions = (A.users || []).map((u) => `<option value="${u.id}" ${d.staffId === u.id ? 'selected' : ''}>${u.name}</option>`).join('');
  const roleOptions = SHIFT_ROLES.map((r) => `<option value="${r}" ${d.role === r ? 'selected' : ''}>${r}</option>`).join('');
  const isShopCtx = A.planContext === 'shop';

  return `
    <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);letter-spacing:.3px">
        ${d.id ? 'Modifier un shift' : 'Nouveau shift'}
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:180px">
          <span class="label">Boutique</span>
          <select class="select" style="height:38px" ${isShopCtx ? 'disabled' : ''}
            onchange="window.__BOB__.setPlanDraft('shopId',this.value)">
            ${shopOptions}
          </select>
        </div>

        <div style="display:flex;flex-direction:column;gap:4px;min-width:180px">
          <span class="label">Membre equipe</span>
          <select class="select" style="height:38px"
            onchange="window.__BOB__.setPlanDraft('staffId',this.value)">
            <option value="">Saisie libre</option>
            ${staffOptions}
          </select>
        </div>

        <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:180px">
          <span class="label">Nom affiche</span>
          <input class="input" value="${d.staffName || ''}" placeholder="Prenom / alias"
            oninput="window.__BOB__.setPlanDraft('staffName',this.value)"/>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:150px">
          <span class="label">Date</span>
          <input type="date" class="input" value="${d.date}"
            onchange="window.__BOB__.setPlanDraft('date',this.value)"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;min-width:110px">
          <span class="label">Debut</span>
          <input type="time" class="input" value="${d.start}"
            onchange="window.__BOB__.setPlanDraft('start',this.value)"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;min-width:110px">
          <span class="label">Fin</span>
          <input type="time" class="input" value="${d.end}"
            onchange="window.__BOB__.setPlanDraft('end',this.value)"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;min-width:150px">
          <span class="label">Poste</span>
          <select class="select" style="height:38px"
            onchange="window.__BOB__.setPlanDraft('role',this.value)">
            ${roleOptions}
          </select>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px">
        <span class="label">Note (optionnel)</span>
        <textarea class="textarea" rows="2" placeholder="Ex: remplace Y, formation, etc."
          oninput="window.__BOB__.setPlanDraft('note',this.value)">${d.note || ''}</textarea>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="window.__BOB__.savePlanDraft()">${d.id ? 'Enregistrer' : 'Ajouter'}</button>
        <button class="btn btn-ghost" onclick="window.__BOB__.cancelPlanDraft()">Annuler</button>
      </div>
    </div>`;
}

function shiftChip(s) {
  const color = shopColor(s.shopId);
  const canEdit = isAdmin();
  return `
    <div style="
      display:flex;align-items:flex-start;gap:10px;
      padding:10px 12px;margin:6px 0;
      background:var(--bg2);
      border:1px solid var(--border);
      border-left:3px solid ${color};
      border-radius:8px
    ">
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt)">${s.staffName}</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:${color}22;color:${color};font-weight:700">${s.role}</span>
          ${A.planContext !== 'shop' ? `<span style="font-size:11px;color:var(--txt3)">· ${shopName(s.shopId)}</span>` : ''}
        </div>
        <div style="font-size:12px;color:var(--txt2);margin-top:2px">
          ${s.start} → ${s.end}${s.note ? ` · ${s.note}` : ''}
        </div>
      </div>
      ${canEdit ? `
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.editPlanShift('${s.id}')">✎</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.deletePlanShift('${s.id}')" style="color:var(--red)">✕</button>
        </div>
      ` : ''}
    </div>`;
}

function weekView() {
  const days = weekRange(A.planRefDate);
  const from = days[0];
  const to = days[6];
  const isShopCtx = A.planContext === 'shop';
  const shops = isShopCtx
    ? [A.shops.find((s) => s.id === A.selShop?.id) || A.shops[0]].filter(Boolean)
    : (A.planShop ? [A.shops.find((s) => s.id === A.planShop)].filter(Boolean) : A.shops);

  return `
    <div style="padding:14px">
      ${shops.map((shop) => {
        const shifts = shiftsForShop(shop.id, from, to);
        return `
          <div style="margin-bottom:18px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <div style="width:10px;height:10px;border-radius:50%;background:${shop.color}"></div>
              <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);letter-spacing:.3px">${shop.name}</span>
              <span style="font-size:11px;color:var(--txt3)">${shifts.length} shift${shifts.length > 1 ? 's' : ''}</span>
            </div>
            ${days.map((d) => {
              const ds = shifts.filter((s) => s.date === d);
              return `
                <div style="border-top:1px solid var(--border);padding:8px 0">
                  <div style="font-size:11px;color:var(--txt3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px">${fDl(d)}</div>
                  ${ds.length === 0
                    ? `<div style="font-size:12px;color:var(--txt3);padding:6px 0">Aucun shift</div>`
                    : ds.map(shiftChip).join('')}
                </div>`;
            }).join('')}
          </div>`;
      }).join('')}
    </div>`;
}

function listView() {
  const isShopCtx = A.planContext === 'shop';
  const all = (A.planning || []).slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const filtered = all.filter((s) => {
    if (isShopCtx) return s.shopId === A.selShop?.id;
    if (A.planShop) return s.shopId === A.planShop;
    return true;
  });

  if (!filtered.length) {
    return `
      <div style="padding:50px 20px;text-align:center;color:var(--txt2)">
        <div style="font-size:28px;margin-bottom:8px">📆</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt)">Aucun shift planifie</div>
        <div style="font-size:12px;margin-top:4px">Utilise "+ Nouveau shift" pour commencer.</div>
      </div>`;
  }

  return `<div style="padding:14px">${filtered.map(shiftChip).join('')}</div>`;
}

export function bPlanningSection() {
  return `
    ${controls()}
    ${draftForm()}
    ${A.planTab === 'list' ? listView() : weekView()}
  `;
}

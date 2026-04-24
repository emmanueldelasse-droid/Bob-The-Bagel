/* ============================================================
   BOBtheBAGEL - views/planning.js
   Section Planning reutilisable (admin global + contextuel shop)
   ============================================================ */

import { A } from '../state.js';
import { isAdmin } from '../auth.js';
import { shiftsForShop, weekRange, monthRange, SHIFT_ROLES } from '../modules/planning.js';
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
        <button class="tab ${A.planTab === 'month' ? 'on' : ''}" style="font-size:12px;padding:0 12px;height:32px"
          onclick="window.__BOB__.setPlanTab('month')">Mois</button>
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
        <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.duplicateWeekToNext()">↻ Copier semaine</button>
          <button class="btn btn-primary btn-sm" onclick="window.__BOB__.openPlanDraft('${activeShopId || ''}')">+ Nouveau shift</button>
        </div>
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

      ${!d.id ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="tab ${d.mode !== 'week' ? 'on' : ''}" style="font-size:12px;padding:0 14px;height:36px"
            onclick="window.__BOB__.setPlanDraftMode('day')">Un jour</button>
          <button class="tab ${d.mode === 'week' ? 'on' : ''}" style="font-size:12px;padding:0 14px;height:36px"
            onclick="window.__BOB__.setPlanDraftMode('week')">Semaine complète</button>
        </div>
      ` : ''}

      ${d.mode === 'week' && !d.id ? (() => {
        const days = Array.isArray(d.weekDates) ? d.weekDates : [];
        const week = (function () {
          const ref = new Date(d.date || new Date().toISOString().split('T')[0]);
          const dow = (ref.getDay() + 6) % 7;
          const from = new Date(ref);
          from.setDate(ref.getDate() - dow);
          const out = [];
          for (let i = 0; i < 7; i += 1) {
            const dd = new Date(from);
            dd.setDate(from.getDate() + i);
            out.push(dd.toISOString().split('T')[0]);
          }
          return out;
        })();
        const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        return `
          <div style="display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="label">Jours de la semaine</span>
              <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.resetPlanDraftWeek()">Tous</button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${week.map((iso, i) => {
                const on = days.includes(iso);
                const short = iso.slice(5).replace('-', '/');
                return `<button onclick="window.__BOB__.togglePlanDraftDay('${iso}')"
                  aria-pressed="${on}"
                  style="min-width:58px;height:48px;padding:4px 8px;border-radius:8px;border:1.5px solid ${on ? 'var(--green)' : 'var(--border)'};background:${on ? 'var(--green)' : 'transparent'};color:${on ? '#fff' : 'var(--txt)'};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px">
                  <span style="font-size:11px;font-weight:700;letter-spacing:.5px">${labels[i]}</span>
                  <span style="font-size:10px;opacity:${on ? '.9' : '.6'}">${short}</span>
                </button>`;
              }).join('')}
            </div>
            <div style="font-size:11px;color:var(--txt3)">${days.length} jour${days.length > 1 ? 's' : ''} sélectionné${days.length > 1 ? 's' : ''} · tu peux modifier chaque jour ensuite individuellement</div>
          </div>
        `;
      })() : `
        <div style="display:flex;flex-direction:column;gap:4px;min-width:150px">
          <span class="label">Date</span>
          <input type="date" class="input" value="${d.date}"
            onchange="window.__BOB__.setPlanDraft('date',this.value)"/>
        </div>
      `}

      <div style="display:flex;flex-wrap:wrap;gap:8px">
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

function monthView() {
  const isShopCtx = A.planContext === 'shop';
  const { days, month, year } = monthRange(A.planRefDate);
  const from = days[0].iso;
  const to = days[days.length - 1].iso;

  const filterShop = isShopCtx ? (A.selShop?.id || A.planShop) : A.planShop;
  const shifts = (A.planning || []).filter((s) => {
    if (s.date < from || s.date > to) return false;
    if (filterShop && s.shopId !== filterShop) return false;
    return true;
  });

  const byDate = {};
  shifts.forEach((s) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });
  Object.values(byDate).forEach((list) => list.sort((a, b) => a.start.localeCompare(b.start)));

  const monthName = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const dowLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const todayIso = new Date().toISOString().split('T')[0];

  return `
    <div style="padding:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.shiftPlanRef(-30)">‹</button>
        <div class="display" style="flex:1;font-size:14px;color:var(--txt);text-transform:capitalize">${monthName}</div>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="window.__BOB__.shiftPlanRef(30)">›</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-bottom:4px">
        ${dowLabels.map((l) => `<div style="font-size:10px;font-weight:800;letter-spacing:1px;color:var(--txt3);text-align:center;padding:4px 0;text-transform:uppercase">${l}</div>`).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">
        ${days.map((d) => {
          const list = byDate[d.iso] || [];
          const isToday = d.iso === todayIso;
          const bg = !d.inMonth ? 'transparent' : (isToday ? 'var(--lgreen)' : 'var(--bg2)');
          const border = isToday ? 'var(--green)' : 'var(--border)';
          const color = d.inMonth ? 'var(--txt)' : 'var(--txt3)';
          const chips = list.slice(0, 3).map((s) => {
            const shopColor = A.shops?.find((x) => x.id === s.shopId)?.color || 'var(--green)';
            return `<div style="display:flex;flex-direction:column;gap:0;padding:3px 5px;border-radius:4px;background:${shopColor}22;color:${shopColor};line-height:1.15;cursor:pointer;overflow:hidden"
              onclick="window.__BOB__.editPlanShift('${s.id}')"
              title="${s.staffName} · ${s.start}-${s.end}${s.note ? ' · ' + s.note : ''}">
              <span style="font-size:10px;font-weight:800;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.start}-${s.end}</span>
              <span style="font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9">${s.staffName}</span>
            </div>`;
          }).join('');
          const more = list.length > 3 ? `<div style="font-size:10px;color:var(--txt3);text-align:center">+${list.length - 3}</div>` : '';
          return `
            <div style="min-height:96px;border:1px solid ${border};border-radius:6px;background:${bg};padding:4px;display:flex;flex-direction:column;gap:3px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:11px;font-weight:${isToday ? '800' : '600'};color:${color}">${d.day}</span>
                ${d.inMonth ? `<button class="btn btn-ghost" style="height:18px;padding:0 4px;min-width:18px;font-size:11px;border:none" onclick="window.__BOB__.setPlanRefDate('${d.iso}');window.__BOB__.setPlanTab('week')" title="Voir cette semaine">→</button>` : ''}
              </div>
              ${chips}
              ${more}
            </div>`;
        }).join('')}
      </div>

      <div style="margin-top:10px;font-size:11px;color:var(--txt3);text-align:center">Clic sur un shift pour l'éditer · flèche → pour ouvrir la semaine dans l'onglet Semaine</div>
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
    ${A.planTab === 'list' ? listView() : A.planTab === 'month' ? monthView() : weekView()}
  `;
}

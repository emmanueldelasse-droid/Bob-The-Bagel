/* ============================================================
   BOBtheBAGEL — js/views/audit.js
   Section audit boutique : liste, formulaire, détail
   ============================================================ */

import { A } from '../state.js';
import { escHtml, fD, fT, safeImageUrl, textToHtml } from '../utils.js';
import { computeAuditScore, AUDIT_SECTIONS } from '../modules/audit.js';

function statusBadge(status) {
  if (status === 'completed') {
    return `<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;letter-spacing:.3px">CLÔTURÉ</span>`;
  }
  return `<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;letter-spacing:.3px">BROUILLON</span>`;
}

function scoreBadge(pct) {
  let color = '#1A7A4A';
  let bg = '#D1FAE5';
  if (pct < 90 && pct >= 75) { color = '#92400E'; bg = '#FEF3C7'; }
  if (pct < 75) { color = '#991B1B'; bg = '#FEE2E2'; }
  return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:10px;font-size:11px;font-weight:800;font-family:'Syne',sans-serif;letter-spacing:.3px">${pct}%</span>`;
}

function shopChip(shopId) {
  const shop = (A.shops || []).find((s) => s.id === shopId);
  const name = shop?.name || shopId || '—';
  const color = shop?.color || '#888';
  return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:${color};font-family:'Syne',sans-serif;letter-spacing:.3px">
    <span style="width:8px;height:8px;border-radius:50%;background:${color}"></span>${escHtml(name)}
  </span>`;
}

function filterButtons() {
  const shops = A.shops || [];
  const current = A.auditFilter || 'all';
  const items = [{ id: 'all', name: 'Toutes', color: 'var(--txt)' }, ...shops];
  return `
    <div style="display:flex;gap:5px;overflow-x:auto;scrollbar-width:none">
      ${items.map((s) => {
        const active = current === s.id;
        const bg = active ? (s.color || 'var(--txt)') : 'transparent';
        const txt = active ? '#fff' : (s.color || 'var(--txt2)');
        const border = s.color || 'var(--border)';
        return `<button onclick="window.__BOB__.setAuditFilter('${s.id}')"
          style="height:26px;padding:0 11px;border-radius:20px;white-space:nowrap;flex-shrink:0;border:1.5px solid ${border};background:${bg};color:${txt};font-family:'Syne',sans-serif;font-weight:700;font-size:10px;cursor:pointer;letter-spacing:.3px"
        >${escHtml(s.name)}</button>`;
      }).join('')}
    </div>`;
}

function auditRow(audit) {
  const score = computeAuditScore(audit);
  const nok = score.nok;
  return `
    <button onclick="window.__BOB__.openAuditDetail('${audit.id}')"
      style="width:100%;text-align:left;padding:12px 16px;border:none;border-bottom:1px solid var(--border);background:transparent;cursor:pointer;display:flex;align-items:center;gap:12px;transition:background .12s"
      onmouseover="this.style.background='var(--bg3)'"
      onmouseout="this.style.background='transparent'"
    >
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
          ${shopChip(audit.shopId)}
          ${statusBadge(audit.status)}
          ${audit.status === 'completed' ? scoreBadge(score.pct) : ''}
        </div>
        <div style="font-size:12px;color:var(--txt2)">
          ${escHtml(audit.auditorName || '—')} · ${fD(audit.completedAt || audit.createdAt)} ${fT(audit.completedAt || audit.createdAt)}
        </div>
        <div style="font-size:11px;color:var(--txt3);margin-top:2px">
          ${score.ok} OK · ${nok} KO · ${score.na} N/A
        </div>
      </div>
      <div style="color:var(--txt3);font-size:14px">›</div>
    </button>`;
}

function viewList() {
  const isShopCtx = A.auditContext === 'shop';
  const shops = A.shops || [];
  const ctxShop = isShopCtx ? shops.find((s) => s.id === A.auditFilter) : null;
  const filter = isShopCtx ? (A.auditFilter || 'all') : (A.auditFilter || 'all');

  const list = A.audits
    .filter((a) => filter === 'all' || a.shopId === filter)
    .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));

  return `
    <div>
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt)">
            ${isShopCtx && ctxShop ? `Audits · ${escHtml(ctxShop.name)}` : 'Audits boutique'}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${isShopCtx && ctxShop ? `
              <button class="btn btn-primary btn-sm" onclick="window.__BOB__.openAuditDraft('${ctxShop.id}')"
                style="background:${ctxShop.color};border-color:${ctxShop.color}">+ Nouvel audit</button>
            ` : shops.map((s) => `
              <button class="btn btn-primary btn-sm" onclick="window.__BOB__.openAuditDraft('${s.id}')"
                style="background:${s.color};border-color:${s.color}">+ ${escHtml(s.name)}</button>
            `).join('')}
          </div>
        </div>
        ${isShopCtx ? '' : filterButtons()}
      </div>

      ${list.length === 0 ? `
        <div style="padding:50px 20px;text-align:center;color:var(--txt2);font-size:13px">
          Aucun audit ${filter === 'all' ? '' : 'pour cette boutique'} pour le moment.<br>
          Lancez-en un avec le bouton ci-dessus.
        </div>
      ` : list.map(auditRow).join('')}
    </div>`;
}

function itemStatusButton(sectionId, itemId, current, target, label, bg, color) {
  const active = current === target;
  return `<button onclick="window.__BOB__.setItemStatus('${sectionId}','${itemId}','${target}')"
    style="flex:1;min-height:32px;padding:0 10px;border:1.5px solid ${active ? color : 'var(--border)'};background:${active ? bg : 'transparent'};color:${active ? color : 'var(--txt3)'};border-radius:20px;font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:.5px;cursor:pointer;transition:all .12s"
  >${label}</button>`;
}

function itemPhotoGallery(sectionId, itemId, photos) {
  if (!photos?.length) return '';
  return `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      ${photos.map((photo, idx) => {
        const src = safeImageUrl(photo);
        if (!src) return '';
        return `
          <div style="position:relative;width:70px;height:70px;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--bg3)">
            <img src="${escHtml(src)}" alt="Photo audit" style="width:100%;height:100%;object-fit:cover;display:block" />
            <button onclick="window.__BOB__.removeDraftPhoto('${sectionId}','${itemId}',${idx})"
              title="Supprimer"
              style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:10px;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
          </div>`;
      }).join('')}
    </div>`;
}

function itemBlock(section, item) {
  const inputId = `audit-photo-${section.id}-${item.id}`;
  return `
    <div style="padding:10px 0;border-bottom:1px dashed var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
        <div style="font-size:13px;color:var(--txt);font-weight:500;flex:1;min-width:0">${escHtml(item.label)}</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:6px">
        ${itemStatusButton(section.id, item.id, item.status, 'ok',  '✓ OK',  '#D1FAE5', '#065F46')}
        ${itemStatusButton(section.id, item.id, item.status, 'nok', '✗ KO',  '#FEE2E2', '#991B1B')}
        ${itemStatusButton(section.id, item.id, item.status, 'na',  '— N/A', 'var(--bg3)', 'var(--txt3)')}
      </div>
      <textarea
        placeholder="Commentaire (optionnel)…"
        oninput="window.__BOB__.setItemComment('${section.id}','${item.id}',this.value)"
        style="width:100%;min-height:36px;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:12px;resize:vertical;outline:none"
      >${escHtml(item.comment || '')}</textarea>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
        <input type="file" id="${inputId}" accept="image/*" capture="environment" style="display:none"
          onchange="window.__BOB__.handleAuditPhotoChange(event,'${section.id}','${item.id}')" />
        <button onclick="window.__BOB__.triggerAuditPhotoInput('${section.id}','${item.id}')"
          style="height:28px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--txt2);font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px"
        >📷 Photo</button>
        ${(item.photos || []).length ? `<span style="font-size:11px;color:var(--txt3)">${(item.photos || []).length} photo${(item.photos || []).length > 1 ? 's' : ''}</span>` : ''}
      </div>
      ${itemPhotoGallery(section.id, item.id, item.photos)}
    </div>`;
}

function sectionBlock(section) {
  const itemCount = section.items.length;
  const okCount = section.items.filter((i) => i.status === 'ok').length;
  const nokCount = section.items.filter((i) => i.status === 'nok').length;

  return `
    <div style="border:1px solid var(--border);border-radius:10px;margin:10px 14px;background:var(--bg2)">
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">${section.icon}</span>
          <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);letter-spacing:-.2px">${escHtml(section.name)}</span>
        </div>
        <span style="font-size:11px;color:var(--txt3)">${okCount}✓ · ${nokCount}✗ / ${itemCount}</span>
      </div>
      <div style="padding:4px 14px 10px">
        ${section.items.map((item) => itemBlock(section, item)).join('')}
      </div>
    </div>`;
}

function viewEdit() {
  const draft = A.auditDraft;
  if (!draft) return viewList();
  const shops = A.shops || [];
  const score = computeAuditScore(draft);
  const inputGlobalId = 'audit-photo-global';

  return `
    <div>
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.cancelAuditDraft()">← Retour</button>
          <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt)">${A.auditCurrentId ? 'Modifier audit' : 'Nouvel audit'}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.saveAuditDraft(false)">💾 Enregistrer</button>
          <button class="btn btn-primary btn-sm" onclick="window.__BOB__.saveAuditDraft(true)">✓ Clôturer</button>
        </div>
      </div>

      <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <label style="font-size:11px;color:var(--txt3);font-weight:700;font-family:'Syne',sans-serif;letter-spacing:.5px">BOUTIQUE</label>
          ${A.auditContext === 'shop' ? `
            ${shopChip(draft.shopId)}
          ` : `
            <select onchange="window.__BOB__.setDraftShop(this.value)" class="select" style="height:36px">
              ${shops.map((s) => `<option value="${s.id}" ${draft.shopId === s.id ? 'selected' : ''}>${escHtml(s.name)}</option>`).join('')}
            </select>
          `}
          <div style="margin-left:auto;display:flex;gap:10px;align-items:center">
            <span style="font-size:11px;color:var(--txt3)">Score provisoire</span>
            ${scoreBadge(score.pct)}
          </div>
        </div>
        <div>
          <label style="font-size:11px;color:var(--txt3);font-weight:700;font-family:'Syne',sans-serif;letter-spacing:.5px;display:block;margin-bottom:4px">COMMENTAIRE GÉNÉRAL</label>
          <textarea
            placeholder="Observations générales, points marquants, actions à suivre…"
            oninput="window.__BOB__.setDraftNote(this.value)"
            style="width:100%;min-height:60px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;resize:vertical;outline:none"
          >${escHtml(draft.note || '')}</textarea>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="file" id="${inputGlobalId}" accept="image/*" capture="environment" style="display:none"
              onchange="window.__BOB__.handleAuditPhotoChange(event,null,null)" />
            <button onclick="window.__BOB__.triggerAuditPhotoInput(null,null)"
              style="height:32px;padding:0 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--txt2);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px"
            >📷 Photo générale</button>
            ${(draft.photos || []).length ? `<span style="font-size:11px;color:var(--txt3)">${draft.photos.length} photo${draft.photos.length > 1 ? 's' : ''}</span>` : ''}
          </div>
          ${(draft.photos || []).length ? `
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
              ${draft.photos.map((photo, idx) => {
                const src = safeImageUrl(photo);
                if (!src) return '';
                return `
                  <div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--bg3)">
                    <img src="${escHtml(src)}" alt="Photo audit" style="width:100%;height:100%;object-fit:cover;display:block" />
                    <button onclick="window.__BOB__.removeDraftPhoto(null,null,${idx})"
                      style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:10px;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
                  </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      ${draft.sections.map(sectionBlock).join('')}

      <div style="padding:16px;display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="window.__BOB__.cancelAuditDraft()">Annuler</button>
        <button class="btn btn-ghost" onclick="window.__BOB__.saveAuditDraft(false)">Enregistrer brouillon</button>
        <button class="btn btn-primary" onclick="window.__BOB__.saveAuditDraft(true)">Clôturer l'audit</button>
      </div>
    </div>`;
}

function detailSection(section) {
  return `
    <div style="border:1px solid var(--border);border-radius:10px;margin:10px 14px;background:var(--bg2)">
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">${section.icon}</span>
        <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:var(--txt);letter-spacing:-.2px">${escHtml(section.name)}</span>
      </div>
      <div style="padding:6px 14px 12px">
        ${section.items.map((item) => {
          const color = item.status === 'ok' ? '#065F46' : item.status === 'nok' ? '#991B1B' : 'var(--txt3)';
          const mark = item.status === 'ok' ? '✓' : item.status === 'nok' ? '✗' : '—';
          const photos = (item.photos || []).map((p) => safeImageUrl(p)).filter(Boolean);
          return `
            <div style="padding:8px 0;border-bottom:1px dashed var(--border)">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="color:${color};font-weight:800;font-size:14px;width:16px">${mark}</span>
                <span style="font-size:13px;color:var(--txt);flex:1">${escHtml(item.label)}</span>
              </div>
              ${item.comment ? `<div style="font-size:12px;color:var(--txt2);margin-top:4px;padding-left:24px">${textToHtml(item.comment)}</div>` : ''}
              ${photos.length ? `
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;padding-left:24px">
                  ${photos.map((src) => `
                    <a href="${escHtml(src)}" target="_blank" rel="noopener noreferrer"
                      style="display:block;width:64px;height:64px;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--bg3)">
                      <img src="${escHtml(src)}" alt="Photo audit" style="width:100%;height:100%;object-fit:cover;display:block" />
                    </a>`).join('')}
                </div>
              ` : ''}
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function viewDetail() {
  const audit = A.audits.find((a) => a.id === A.auditCurrentId);
  if (!audit) return viewList();
  const score = computeAuditScore(audit);
  const photos = (audit.photos || []).map((p) => safeImageUrl(p)).filter(Boolean);

  return `
    <div>
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.setAuditTab('list')">← Retour</button>
          <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt)">Audit ${escHtml(audit.shopName || '')}</span>
          ${statusBadge(audit.status)}
          ${audit.status === 'completed' ? scoreBadge(score.pct) : ''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.editAudit('${audit.id}')">✎ Modifier</button>
          <button class="btn btn-ghost btn-sm" onclick="window.__BOB__.deleteAudit('${audit.id}')">🗑 Supprimer</button>
        </div>
      </div>

      <div style="padding:14px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--txt2)">
          <div><b style="color:var(--txt)">Auditeur :</b> ${escHtml(audit.auditorName || '—')}</div>
          <div><b style="color:var(--txt)">Créé :</b> ${fD(audit.createdAt)} ${fT(audit.createdAt)}</div>
          ${audit.completedAt ? `<div><b style="color:var(--txt)">Clôturé :</b> ${fD(audit.completedAt)} ${fT(audit.completedAt)}</div>` : ''}
          <div><b style="color:var(--txt)">Score :</b> ${score.ok} OK · ${score.nok} KO · ${score.na} N/A</div>
        </div>
        ${audit.note ? `<div style="font-size:13px;color:var(--txt);line-height:1.5;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px">${textToHtml(audit.note)}</div>` : ''}
        ${photos.length ? `
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${photos.map((src) => `
              <a href="${escHtml(src)}" target="_blank" rel="noopener noreferrer"
                style="display:block;width:90px;height:90px;border-radius:8px;overflow:hidden;border:1px solid var(--border);background:var(--bg3)">
                <img src="${escHtml(src)}" alt="Photo audit" style="width:100%;height:100%;object-fit:cover;display:block" />
              </a>`).join('')}
          </div>
        ` : ''}
      </div>

      ${audit.sections.map(detailSection).join('')}
    </div>`;
}

export function bAuditSection() {
  if (A.auditTab === 'edit')   return viewEdit();
  if (A.auditTab === 'detail') return viewDetail();
  return viewList();
}

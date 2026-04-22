/* ============================================================
   BOBtheBAGEL — js/modules/audit.js
   Audits boutique : création, édition, photos, score, persistance
   ============================================================ */

import { A, sv, setRuntimeFlag } from '../state.js';
import { gId, nISO, render, toast, alog } from '../utils.js';
import { getSupabase, uploadPhoto } from '../api/supabase.js';

const AUDIT_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export const AUDIT_SECTIONS = [
  {
    id: 'cleanliness',
    name: 'Propreté',
    icon: '🧹',
    items: [
      { id: 'floor',       label: 'Sol propre'                           },
      { id: 'surfaces',    label: 'Surfaces et plans de travail'         },
      { id: 'equipment',   label: 'Équipements (four, trancheuse, frigo)' },
      { id: 'restroom',    label: 'Toilettes propres et approvisionnées' },
      { id: 'customer',    label: 'Zone client (tables, vitrines)'       },
    ],
  },
  {
    id: 'stock',
    name: 'Stock',
    icon: '📦',
    items: [
      { id: 'fridge',      label: 'Frigo : niveaux corrects'             },
      { id: 'dry',         label: 'Stock sec : niveaux corrects'         },
      { id: 'bagels',      label: 'Bagels : quantité et fraîcheur'       },
      { id: 'dates',       label: 'Dates de péremption vérifiées'        },
      { id: 'fifo',        label: 'Rotation FIFO respectée'              },
    ],
  },
  {
    id: 'equipment',
    name: 'Équipements',
    icon: '🔧',
    items: [
      { id: 'oven',        label: 'Four fonctionne correctement'         },
      { id: 'slicer',      label: 'Trancheuse propre et opérationnelle'  },
      { id: 'fridge-temp', label: 'Température frigo ≤ 4°C'              },
      { id: 'freezer',     label: 'Congélateur ≤ -18°C'                  },
      { id: 'pos',         label: 'Caisse et TPE opérationnels'          },
    ],
  },
  {
    id: 'hygiene',
    name: 'Hygiène',
    icon: '🧤',
    items: [
      { id: 'uniform',     label: 'Tenue propre et complète'             },
      { id: 'gloves',      label: 'Gants utilisés correctement'          },
      { id: 'hands',       label: 'Lavage des mains conforme'            },
      { id: 'haccp',       label: 'Plan HACCP affiché et à jour'         },
      { id: 'pest',        label: 'Aucun signe de nuisibles'             },
    ],
  },
  {
    id: 'service',
    name: 'Service',
    icon: '💼',
    items: [
      { id: 'welcome',     label: 'Accueil client chaleureux'            },
      { id: 'presentation',label: 'Présentation produit soignée'         },
      { id: 'speed',       label: 'Rapidité de service'                  },
      { id: 'upsell',      label: 'Proposition additionnelle'            },
    ],
  },
];

function emptyAudit(shopId) {
  const shop = (A.shops || []).find((s) => s.id === shopId) || null;
  return {
    id: `audit-${gId('A')}`,
    shopId,
    shopName: shop?.name || shopId || '',
    auditorId: A.cUser?.id || null,
    auditorName: A.cUser?.name || '',
    createdAt: nISO(),
    completedAt: null,
    status: 'draft',
    note: '',
    photos: [],
    sections: AUDIT_SECTIONS.map((section) => ({
      id: section.id,
      name: section.name,
      icon: section.icon,
      items: section.items.map((item) => ({
        id: item.id,
        label: item.label,
        status: 'na',
        comment: '',
        photos: [],
      })),
    })),
  };
}

function isTestMode() {
  return !!A.testProfile;
}

function persistAudits() {
  sv('au', A.audits);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Lecture fichier impossible'));
    reader.readAsDataURL(file);
  });
}

export function computeAuditScore(audit) {
  if (!audit?.sections?.length) return { ok: 0, nok: 0, na: 0, total: 0, pct: 0 };
  let ok = 0;
  let nok = 0;
  let na = 0;
  audit.sections.forEach((section) => {
    (section.items || []).forEach((item) => {
      if (item.status === 'ok') ok += 1;
      else if (item.status === 'nok') nok += 1;
      else na += 1;
    });
  });
  const total = ok + nok + na;
  const judged = ok + nok;
  const pct = judged > 0 ? Math.round((ok / judged) * 100) : 0;
  return { ok, nok, na, total, pct };
}

// ── Navigation / UI state ──────────────────────────────────
export function setAuditTab(tab) {
  A.auditTab = tab;
  render();
}

export function setAuditFilter(shopId) {
  A.auditFilter = shopId;
  render();
}

export function enterAdminAuditContext() {
  A.auditContext = 'admin';
  if (A.auditTab !== 'edit' && A.auditTab !== 'detail') {
    A.auditTab = 'list';
  }
}

export function enterShopAuditContext(shopId) {
  A.auditContext = 'shop';
  A.auditFilter = shopId;
  if (A.auditTab !== 'edit' && A.auditTab !== 'detail') {
    A.auditTab = 'list';
  }
}

export function openAuditDraft(shopId) {
  const targetShopId = shopId || (A.shops || [])[0]?.id || null;
  if (!targetShopId) {
    toast('Aucune boutique disponible', 'error');
    return;
  }
  A.auditDraft = emptyAudit(targetShopId);
  A.auditCurrentId = null;
  A.auditTab = 'edit';
  render();
}

export function openAuditDetail(auditId) {
  A.auditCurrentId = auditId;
  A.auditDraft = null;
  A.auditTab = 'detail';
  render();
}

export function editAudit(auditId) {
  const audit = A.audits.find((a) => a.id === auditId);
  if (!audit) {
    toast('Audit introuvable', 'error');
    return;
  }
  A.auditDraft = JSON.parse(JSON.stringify(audit));
  A.auditCurrentId = auditId;
  A.auditTab = 'edit';
  render();
}

export function cancelAuditDraft() {
  A.auditDraft = null;
  A.auditCurrentId = null;
  A.auditTab = 'list';
  render();
}

// ── Edition du brouillon ───────────────────────────────────
export function setDraftShop(shopId) {
  if (!A.auditDraft) return;
  const shop = (A.shops || []).find((s) => s.id === shopId) || null;
  A.auditDraft.shopId = shopId;
  A.auditDraft.shopName = shop?.name || shopId;
  render();
}

export function setDraftNote(value) {
  if (!A.auditDraft) return;
  A.auditDraft.note = value;
}

export function setItemStatus(sectionId, itemId, status) {
  if (!A.auditDraft) return;
  const section = A.auditDraft.sections.find((s) => s.id === sectionId);
  if (!section) return;
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return;
  item.status = status;
  render();
}

export function setItemComment(sectionId, itemId, value) {
  if (!A.auditDraft) return;
  const section = A.auditDraft.sections.find((s) => s.id === sectionId);
  if (!section) return;
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return;
  item.comment = value;
}

// ── Photos ─────────────────────────────────────────────────
async function resolvePhotoUrl(file, auditId, scopeKey) {
  if (isTestMode()) {
    return readFileAsDataUrl(file);
  }
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `audits/${auditId}/${scopeKey}/${Date.now()}-${gId('AP')}.${ext}`;
  return uploadPhoto(file, path);
}

async function handlePhotoFile(file, scopeKey, onUrl) {
  if (!file) return;
  if (!file.type?.startsWith('image/')) {
    toast('Fichier non image', 'error');
    return;
  }
  if (file.size > AUDIT_PHOTO_MAX_BYTES) {
    toast('Image trop lourde (max 2 Mo)', 'error');
    return;
  }
  if (!A.auditDraft) return;
  try {
    const url = await resolvePhotoUrl(file, A.auditDraft.id, scopeKey);
    onUrl(url);
    render();
  } catch (error) {
    console.warn('[BOB] audit photo failed:', error);
    toast(error?.message || 'Envoi photo impossible', 'error');
  }
}

export function triggerAuditPhotoInput(sectionId, itemId) {
  const inputId = itemId ? `audit-photo-${sectionId}-${itemId}` : `audit-photo-${sectionId || 'global'}`;
  document.getElementById(inputId)?.click();
}

export async function handleAuditPhotoChange(event, sectionId, itemId) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;

  const scope = sectionId && itemId ? `${sectionId}/${itemId}` : (sectionId || 'global');

  await handlePhotoFile(file, scope, (url) => {
    if (!A.auditDraft) return;
    if (sectionId && itemId) {
      const section = A.auditDraft.sections.find((s) => s.id === sectionId);
      const item = section?.items.find((i) => i.id === itemId);
      if (item) item.photos = [...(item.photos || []), url];
    } else {
      A.auditDraft.photos = [...(A.auditDraft.photos || []), url];
    }
  });

  if (input) input.value = '';
}

export function removeDraftPhoto(sectionId, itemId, index) {
  if (!A.auditDraft) return;
  if (sectionId && itemId) {
    const section = A.auditDraft.sections.find((s) => s.id === sectionId);
    const item = section?.items.find((i) => i.id === itemId);
    if (item) item.photos = (item.photos || []).filter((_, i) => i !== index);
  } else {
    A.auditDraft.photos = (A.auditDraft.photos || []).filter((_, i) => i !== index);
  }
  render();
}

// ── Sauvegarde ─────────────────────────────────────────────
function upsertLocalAudit(audit) {
  const idx = A.audits.findIndex((a) => a.id === audit.id);
  if (idx >= 0) {
    A.audits = A.audits.map((a) => (a.id === audit.id ? audit : a));
  } else {
    A.audits = [audit, ...A.audits];
  }
  persistAudits();
}

async function upsertRemoteAudit(audit) {
  const sb = getSupabase();
  if (!sb) throw new Error('Client Supabase indisponible');
  const payload = {
    id: audit.id,
    shop_id: audit.shopId,
    shop_name: audit.shopName,
    auditor_id: audit.auditorId,
    auditor_name: audit.auditorName,
    status: audit.status,
    note: audit.note,
    photos: audit.photos,
    sections: audit.sections,
    score: computeAuditScore(audit).pct,
    created_at: audit.createdAt,
    completed_at: audit.completedAt,
  };
  const { error } = await sb.from('audits').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function saveAuditDraft(complete = false) {
  if (!A.auditDraft) return;
  const audit = { ...A.auditDraft };
  audit.status = complete ? 'completed' : 'draft';
  if (complete) audit.completedAt = nISO();

  upsertLocalAudit(audit);

  if (!isTestMode()) {
    try {
      await upsertRemoteAudit(audit);
    } catch (error) {
      console.warn('[BOB] upsertRemoteAudit failed (kept local):', error);
      setRuntimeFlag('auditsError', error?.message || 'Sauvegarde audit distante impossible');
    }
  }

  alog(complete ? `Audit clôturé: ${audit.shopName}` : `Audit sauvegardé: ${audit.shopName}`);
  toast(complete ? 'Audit clôturé ✓' : 'Audit sauvegardé ✓');

  A.auditDraft = null;
  A.auditCurrentId = audit.id;
  A.auditTab = complete ? 'list' : 'detail';
  render();
}

export function deleteAudit(auditId) {
  A.confirm = {
    msg: 'Supprimer cet audit ?',
    fn: async () => {
      A.audits = A.audits.filter((a) => a.id !== auditId);
      persistAudits();

      if (!isTestMode()) {
        try {
          const sb = getSupabase();
          if (sb) {
            const { error } = await sb.from('audits').delete().eq('id', auditId);
            if (error) throw error;
          }
        } catch (error) {
          console.warn('[BOB] deleteAudit remote failed:', error);
        }
      }

      alog(`Audit supprimé: ${auditId}`);
      toast('Audit supprimé', 'error');
      if (A.auditCurrentId === auditId) {
        A.auditCurrentId = null;
        A.auditTab = 'list';
      }
      render();
    },
  };
  render();
}

// ── Hydratation ────────────────────────────────────────────
function normalizeAuditRow(row) {
  if (!row) return null;
  const sections = Array.isArray(row.sections) ? row.sections : (() => {
    try { return JSON.parse(row.sections || '[]'); } catch { return []; }
  })();
  const photos = Array.isArray(row.photos) ? row.photos : (() => {
    try { return JSON.parse(row.photos || '[]'); } catch { return []; }
  })();
  return {
    id: row.id,
    shopId: row.shop_id || row.shopId,
    shopName: row.shop_name || row.shopName || '',
    auditorId: row.auditor_id || row.auditorId || null,
    auditorName: row.auditor_name || row.auditorName || '',
    status: row.status || 'draft',
    note: row.note || '',
    photos,
    sections,
    createdAt: row.created_at || row.createdAt || nISO(),
    completedAt: row.completed_at || row.completedAt || null,
  };
}

export async function loadAuditsIntoState() {
  setRuntimeFlag('auditsLoading', true);
  setRuntimeFlag('auditsError', '');

  try {
    if (isTestMode()) {
      setRuntimeFlag('auditsHydrated', true);
      setRuntimeFlag('lastAuditsSyncAt', nISO());
      return A.audits;
    }

    const sb = getSupabase();
    if (!sb) throw new Error('Client Supabase indisponible');
    const { data, error } = await sb
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const audits = (data || []).map(normalizeAuditRow).filter(Boolean);
    A.audits = audits;
    persistAudits();

    setRuntimeFlag('auditsHydrated', true);
    setRuntimeFlag('lastAuditsSyncAt', nISO());
    return audits;
  } catch (error) {
    const msg = error?.message || 'Chargement des audits impossible';
    setRuntimeFlag('auditsError', msg);
    console.warn('[BOB] loadAuditsIntoState:', error);
    return A.audits;
  } finally {
    setRuntimeFlag('auditsLoading', false);
  }
}

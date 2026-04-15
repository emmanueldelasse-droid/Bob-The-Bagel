/* ============================================================
   BOBtheBAGEL — views/calendar.js v2
   Vue liste · Vue semaine · Vue mois · Navigation · Checklist
   ============================================================ */

import { A, SHOPS }      from '../state.js';
import { isAdmin }       from '../auth.js';
import { fD, fT }        from '../utils.js';
import {
  EVENT_STATUSES, filteredEvents, upcomingCount,
  shopName, shopColor,
} from '../modules/calendar.js';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function statusBadge(status) {
  const s = EVENT_STATUSES[status] || EVENT_STATUSES.planned;
  return `<span style="display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:${s.bg};color:${s.color};white-space:nowrap;flex-shrink:0">${s.label}</span>`;
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)   return `<span style="color:var(--txt3);font-size:11px">Passé</span>`;
  if (diff === 0)  return `<span style="color:var(--red);font-weight:700;font-size:11px">Aujourd'hui !</span>`;
  if (diff === 1)  return `<span style="color:var(--amber);font-weight:700;font-size:11px">Demain</span>`;
  if (diff <= 7)   return `<span style="color:var(--amber);font-size:11px">Dans ${diff} j</span>`;
  return `<span style="color:var(--txt3);font-size:11px">Dans ${diff} j</span>`;
}

function formatDate(dateStr, timeStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
    return timeStr ? `${label} · ${timeStr}` : label;
  } catch { return dateStr; }
}

function eventColor(ev) {
  if (A.calColorMode === 'shop' && ev.shops?.length) {
    return shopColor(ev.shops[0]);
  }
  return (EVENT_STATUSES[ev.status] || EVENT_STATUSES.planned).color;
}

function eventBg(ev) {
  if (A.calColorMode === 'shop' && ev.shops?.length) {
    return shopColor(ev.shops[0]) + '22';
  }
  return (EVENT_STATUSES[ev.status] || EVENT_STATUSES.planned).bg;
}

// ─────────────────────────────────────────────────────────────
// FORMULAIRE
// ─────────────────────────────────────────────────────────────
function calForm() {
  const f = A.calForm;
  if (!f) return '';
  const isEditing = !!f._editing;
  const checks = f.checklist || [];

  return `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(2px)"
      onclick="if(event.target===this)window.__BOB__.closeCalForm()">
      <div style="background:var(--bg2);border-radius:16px 16px 0 0;padding:24px;max-width:640px;width:100%;max-height:92vh;overflow-y:auto;border-top:1px solid var(--border)">

        <div style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 18px"></div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:var(--txt);margin-bottom:18px;letter-spacing:-.3px">
          ${isEditing ? "Modifier l'événement" : 'Nouvel événement catering'}
        </div>

        <div style="display:flex;flex-direction:column;gap:13px">

          <!-- Titre -->
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:5px">Titre *</div>
            <input value="${f.title || ''}" placeholder="Ex: Catering mariage Dupont"
              oninput="window.__BOB__.setCalField('title',this.value)"
              style="width:100%;height:42px;padding:0 12px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:14px;outline:none"
              onfocus="this.style.borderColor='var(--txt)'" onblur="this.style.borderColor='var(--border)'"
            />
          </div>

          <!-- Date + heure -->
          <div style="display:flex;gap:10px">
            <div style="flex:1">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:5px">Date *</div>
              <input type="date" value="${f.date || ''}" onchange="window.__BOB__.setCalField('date',this.value)"
                style="width:100%;height:42px;padding:0 12px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none"/>
            </div>
            <div style="width:115px">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:5px">Heure</div>
              <input type="time" value="${f.time || ''}" onchange="window.__BOB__.setCalField('time',this.value)"
                style="width:100%;height:42px;padding:0 10px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none"/>
            </div>
          </div>

          <!-- Lieu + couverts -->
          <div style="display:flex;gap:10px">
            <div style="flex:1">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:5px">Lieu</div>
              <input value="${f.location || ''}" placeholder="Adresse ou salle"
                oninput="window.__BOB__.setCalField('location',this.value)"
                style="width:100%;height:42px;padding:0 12px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none"
                onfocus="this.style.borderColor='var(--txt)'" onblur="this.style.borderColor='var(--border)'"
              />
            </div>
            <div style="width:95px">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:5px">Couverts</div>
              <input type="number" value="${f.covers || ''}" placeholder="0" min="0"
                oninput="window.__BOB__.setCalField('covers',this.value)"
                style="width:100%;height:42px;padding:0 10px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none;-moz-appearance:textfield"/>
            </div>
          </div>

          <!-- Boutiques -->
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:7px">Boutiques concernées</div>
            <div style="display:flex;gap:7px;flex-wrap:wrap">
              ${SHOPS.map(s => {
                const sel = (f.shops || []).includes(s.id);
                return `<button onclick="window.__BOB__.toggleCalShop('${s.id}')"
                  style="height:30px;padding:0 13px;border-radius:20px;border:1.5px solid ${sel ? s.color : 'var(--border)'};background:${sel ? s.color : 'transparent'};color:${sel ? '#fff' : 'var(--txt2)'};font-family:'Syne',sans-serif;font-weight:700;font-size:11px;cursor:pointer;transition:all .12s"
                >${s.name}</button>`;
              }).join('')}
            </div>
          </div>

          <!-- Statut -->
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:7px">Statut</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${Object.entries(EVENT_STATUSES).map(([key, s]) => `
                <button onclick="window.__BOB__.setCalField('status','${key}')"
                  style="height:28px;padding:0 11px;border-radius:20px;border:1.5px solid ${f.status===key?s.color:'var(--border)'};background:${f.status===key?s.bg:'transparent'};color:${f.status===key?s.color:'var(--txt3)'};font-size:11px;font-weight:600;cursor:pointer;transition:all .12s"
                >${s.label}</button>`).join('')}
            </div>
          </div>

          <!-- Notes -->
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:5px">Notes logistiques</div>
            <textarea rows="3" placeholder="Besoins spécifiques, allergènes, matériel…"
              oninput="window.__BOB__.setCalField('notes',this.value)"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;resize:none;outline:none;line-height:1.5"
              onfocus="this.style.borderColor='var(--txt)'" onblur="this.style.borderColor='var(--border)'"
            >${f.notes || ''}</textarea>
          </div>

          <!-- Checklist -->
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:7px">Checklist</div>

            ${checks.map(i => `
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
                <div style="width:16px;height:16px;border:2px solid var(--border);border-radius:4px;flex-shrink:0"></div>
                <span style="flex:1;font-size:13px;color:var(--txt)">${i.label}</span>
                <button onclick="window.__BOB__.removeCheckItem('${i.id}')"
                  style="background:none;border:none;color:var(--txt3);cursor:pointer;font-size:14px;padding:0 4px"
                  onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--txt3)'"
                >✕</button>
              </div>
            `).join('')}

            <div style="display:flex;gap:8px;margin-top:8px">
              <input id="check-input" placeholder="Ajouter une tâche…"
                onkeydown="if(event.key==='Enter'){event.preventDefault();window.__BOB__.addCheckItem()}"
                style="flex:1;height:36px;padding:0 10px;border:1.5px solid var(--border);border-radius:7px;background:var(--bg);color:var(--txt);font-family:'Space Grotesk',sans-serif;font-size:13px;outline:none"
                onfocus="this.style.borderColor='var(--txt)'" onblur="this.style.borderColor='var(--border)'"
              />
              <button onclick="window.__BOB__.addCheckItem()"
                style="height:36px;padding:0 12px;background:var(--bg3);border:1px solid var(--border);border-radius:7px;font-size:13px;cursor:pointer;color:var(--txt)"
              >+</button>
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:8px;margin-top:4px">
            <button onclick="window.__BOB__.saveEvent()"
              style="flex:1;height:46px;background:var(--txt);color:var(--bg2);border:none;border-radius:8px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;letter-spacing:.5px;cursor:pointer"
            >${isEditing ? 'Enregistrer' : "Créer l'événement"}</button>
            <button onclick="window.__BOB__.closeCalForm()"
              style="height:46px;padding:0 16px;background:transparent;color:var(--txt2);border:1px solid var(--border);border-radius:8px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;cursor:pointer"
            >Annuler</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// CARTE ÉVÉNEMENT
// ─────────────────────────────────────────────────────────────
function eventCard(ev) {
  const open    = A['oEv_' + ev.id];
  const checks  = ev.checklist || [];
  const done    = checks.filter(i => i.done).length;
  const color   = eventColor(ev);
  const isPast  = ev.date < new Date().toISOString().split('T')[0];

  return `
    <div style="background:var(--bg2);border:1px solid var(--border);border-left:3px solid ${color};border-radius:10px;margin-bottom:10px;overflow:hidden;box-shadow:var(--sh);opacity:${isPast && ev.status !== 'done' ? '.65' : '1'}">

      <!-- Header -->
      <div onclick="window.__BOB__._toggleEv('${ev.id}')"
        style="padding:12px 14px;cursor:pointer;display:flex;align-items:flex-start;gap:10px;justify-content:space-between">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:3px">
            <span style="font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:var(--txt);letter-spacing:-.2px">${ev.title}</span>
            ${statusBadge(ev.status)}
          </div>
          <div style="font-size:12px;color:var(--txt2);margin-bottom:2px">📅 ${formatDate(ev.date, ev.time)}</div>
          ${ev.location ? `<div style="font-size:12px;color:var(--txt2)">📍 ${ev.location}</div>` : ''}
          <div style="display:flex;align-items:center;gap:7px;margin-top:5px;flex-wrap:wrap">
            ${(ev.shops||[]).map(sid=>`<span style="font-size:10px;font-weight:700;font-family:'Syne',sans-serif;padding:2px 7px;border-radius:20px;background:${shopColor(sid)}22;color:${shopColor(sid)}">${shopName(sid)}</span>`).join('')}
            ${ev.covers ? `<span style="font-size:11px;color:var(--txt3)">👥 ${ev.covers} couvert${ev.covers>1?'s':''}</span>` : ''}
            ${checks.length ? `<span style="font-size:11px;color:var(--txt3)">✓ ${done}/${checks.length}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
          ${daysUntil(ev.date)}
          <span style="font-size:11px;color:var(--txt3)">${open?'▲':'▼'}</span>
        </div>
      </div>

      <!-- Détail déplié -->
      ${open ? `
        <div style="border-top:1px solid var(--border);padding:12px 14px">

          ${ev.notes ? `
            <div style="background:var(--bg3);border-radius:7px;padding:10px 12px;margin-bottom:12px">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:4px">Notes</div>
              <div style="font-size:13px;color:var(--txt);line-height:1.5">${ev.notes}</div>
            </div>
          ` : ''}

          <!-- Checklist interactive -->
          ${checks.length ? `
            <div style="margin-bottom:12px">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:7px">
                Checklist · ${done}/${checks.length}
              </div>
              <!-- Barre de progression -->
              <div style="height:4px;background:var(--border);border-radius:2px;margin-bottom:10px;overflow:hidden">
                <div style="height:100%;width:${checks.length?Math.round(done/checks.length*100):0}%;background:var(--green);border-radius:2px;transition:width .3s"></div>
              </div>
              ${checks.map(i=>`
                <div onclick="window.__BOB__.toggleCheckItem('${ev.id}','${i.id}')"
                  style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);cursor:pointer">
                  <div style="width:18px;height:18px;border:2px solid ${i.done?'var(--green)':'var(--border)'};border-radius:5px;background:${i.done?'var(--green)':'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .12s">
                    ${i.done?'<span style="color:#fff;font-size:11px;line-height:1">✓</span>':''}
                  </div>
                  <span style="font-size:13px;color:${i.done?'var(--txt3)':'var(--txt)'};text-decoration:${i.done?'line-through':'none'}">${i.label}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Statut rapide -->
          <div style="margin-bottom:12px">
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:6px">Avancement</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              ${Object.entries(EVENT_STATUSES).map(([key,s])=>`
                <button onclick="window.__BOB__.setEventStatus('${ev.id}','${key}')"
                  style="height:27px;padding:0 10px;border-radius:20px;border:1.5px solid ${ev.status===key?s.color:'var(--border)'};background:${ev.status===key?s.bg:'transparent'};color:${ev.status===key?s.color:'var(--txt3)'};font-size:10px;font-weight:600;cursor:pointer;transition:all .12s"
                >${s.label}</button>`).join('')}
            </div>
          </div>

          <div style="font-size:11px;color:var(--txt3);margin-bottom:12px">Créé par ${ev.createdBy}</div>

          <!-- Actions -->
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            <button onclick="window.__BOB__.editEvent('${ev.id}')"
              style="height:34px;padding:0 13px;background:transparent;color:var(--txt);border:1px solid var(--border);border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer"
            >✏ Modifier</button>
            <button onclick="window.__BOB__.duplicateEvent('${ev.id}')"
              style="height:34px;padding:0 13px;background:transparent;color:var(--blue);border:1px solid #BFDBFE;border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer"
            >⧉ Dupliquer</button>
            <button onclick="window.__BOB__.exportEventPDF('${ev.id}')"
              style="height:34px;padding:0 13px;background:transparent;color:var(--txt2);border:1px solid var(--border);border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer"
            >📄 PDF</button>
            <button onclick="window.__BOB__.deleteEvent('${ev.id}')"
              style="height:34px;padding:0 13px;background:transparent;color:var(--red);border:1px solid #FECACA;border-radius:7px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;cursor:pointer"
            >Supprimer</button>
          </div>
        </div>
      ` : ''}
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// VUE LISTE
// ─────────────────────────────────────────────────────────────
function viewList() {
  const evs   = filteredEvents();
  const today = new Date().toISOString().split('T')[0];
  const upcoming = evs.filter(e => e.date >= today && e.status !== 'cancelled');
  const past     = evs.filter(e => e.date < today || e.status === 'done' || e.status === 'cancelled');

  if (!evs.length) return `
    <div style="padding:60px 20px;text-align:center">
      <div style="font-size:32px;margin-bottom:10px">📅</div>
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--txt);margin-bottom:6px">Aucun événement</div>
      <div style="font-size:13px;color:var(--txt2)">Créez votre premier événement catering.</div>
    </div>`;

  return `
    <div style="padding:14px">
      ${upcoming.length ? `
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin-bottom:10px">À venir · ${upcoming.length}</div>
        ${upcoming.map(e => eventCard(e)).join('')}
      ` : ''}
      ${past.length ? `
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt3);margin:${upcoming.length?'20px':0} 0 10px">Passés · ${past.length}</div>
        ${past.map(e => eventCard(e)).join('')}
      ` : ''}
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// VUE SEMAINE
// ─────────────────────────────────────────────────────────────
function viewWeek() {
  // Semaine courante (lun → dim)
  const now     = new Date(); now.setHours(0,0,0,0);
  const day     = (now.getDay() + 6) % 7; // lundi = 0
  const monday  = new Date(now); monday.setDate(now.getDate() - day);
  const today   = now.toISOString().split('T')[0];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const byDate = {};
  filteredEvents().forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  const dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  return `
    <div style="padding:14px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--txt);margin-bottom:12px;text-align:center">
        Semaine du ${days[0].toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} au ${days[6].toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
      </div>

      ${days.map((d, i) => {
        const dateStr = d.toISOString().split('T')[0];
        const evs     = byDate[dateStr] || [];
        const isToday = dateStr === today;

        return `
          <div style="display:flex;gap:10px;margin-bottom:10px;min-height:44px">
            <!-- Colonne jour -->
            <div style="width:42px;flex-shrink:0;text-align:center;padding-top:4px">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--txt3)">${dayNames[i]}</div>
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:${isToday?'var(--green)':'var(--txt)'};line-height:1.2">${d.getDate()}</div>
              ${isToday?`<div style="width:6px;height:6px;border-radius:50%;background:var(--green);margin:2px auto"></div>`:''}
            </div>

            <!-- Événements du jour -->
            <div style="flex:1;min-width:0">
              ${evs.length === 0 ? `
                <div style="height:40px;border:1px dashed var(--border);border-radius:7px;display:flex;align-items:center;justify-content:center">
                  <span style="font-size:11px;color:var(--txt3)">Rien de prévu</span>
                </div>
              ` : evs.map(ev => {
                const color = eventColor(ev);
                const bg    = eventBg(ev);
                return `
                  <div onclick="window.__BOB__._toggleEv('${ev.id}')"
                    style="padding:8px 11px;background:${bg};border:1px solid ${color}33;border-left:3px solid ${color};border-radius:7px;margin-bottom:5px;cursor:pointer">
                    <div style="font-weight:700;font-size:13px;color:var(--txt)">${ev.title}</div>
                    <div style="font-size:11px;color:var(--txt2);margin-top:2px">
                      ${ev.time?ev.time+' · ':''}${ev.location||''}
                      ${(ev.shops||[]).map(sid=>`<span style="color:${shopColor(sid)};font-weight:700">${shopName(sid)}</span>`).join(', ')}
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// VUE MOIS avec navigation
// ─────────────────────────────────────────────────────────────
function viewMonth() {
  const year  = A.calYear  ?? new Date().getFullYear();
  const month = A.calMonth ?? new Date().getMonth();
  const today = new Date().toISOString().split('T')[0];

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // lundi=0
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const byDate = {};
  filteredEvents().forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  const dayNames = ['L','M','M','J','V','S','D'];
  let cells = '';

  for (let i = 0; i < firstDayOfWeek; i++) cells += `<div></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const evs     = byDate[dateStr] || [];

    cells += `
      <div style="min-height:60px;border:1px solid var(--border);border-radius:6px;padding:4px;background:${isToday?'var(--lgreen)':'var(--bg2)'}">
        <div style="font-family:'Syne',sans-serif;font-weight:${isToday?'800':'600'};font-size:11px;color:${isToday?'var(--green)':'var(--txt)'};margin-bottom:2px">${d}</div>
        ${evs.slice(0,2).map(e=>{
          const c=eventColor(e);const bg=eventBg(e);
          return `<div onclick="window.__BOB__._toggleEv('${e.id}')"
            style="font-size:9px;font-weight:600;padding:2px 4px;border-radius:3px;background:${bg};color:${c};margin-bottom:2px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
            title="${e.title}">${e.title}</div>`;
        }).join('')}
        ${evs.length>2?`<div style="font-size:9px;color:var(--txt3)">+${evs.length-2}</div>`:''}
      </div>`;
  }

  return `
    <div style="padding:14px">
      <!-- Navigation -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <button onclick="window.__BOB__.calNavPrev()"
          style="width:32px;height:32px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--txt);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center"
        >‹</button>
        <div style="text-align:center">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:var(--txt);text-transform:capitalize">${monthLabel}</div>
          <button onclick="window.__BOB__.calNavToday()"
            style="font-size:10px;color:var(--txt3);background:none;border:none;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;text-decoration:underline;padding:0;margin-top:2px"
          >Aujourd'hui</button>
        </div>
        <button onclick="window.__BOB__.calNavNext()"
          style="width:32px;height:32px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--txt);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center"
        >›</button>
      </div>

      <!-- En-têtes jours -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:3px">
        ${dayNames.map(d=>`<div style="text-align:center;font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:1px;color:var(--txt3);padding:3px 0">${d}</div>`).join('')}
      </div>

      <!-- Grille -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells}</div>

      <!-- Légende -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
        ${A.calColorMode === 'shop'
          ? SHOPS.map(s=>`<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;border-radius:3px;background:${s.color}22;border:1px solid ${s.color}"></div><span style="font-size:10px;color:var(--txt2);font-weight:500">${s.name}</span></div>`).join('')
          : Object.values(EVENT_STATUSES).map(s=>`<div style="display:flex;align-items:center;gap:4px"><div style="width:10px;height:10px;border-radius:3px;background:${s.bg};border:1px solid ${s.color}"></div><span style="font-size:10px;color:var(--txt2);font-weight:500">${s.label}</span></div>`).join('')
        }
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// VUE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function bCalendar() {
  const tabs = [
    { id: 'list',  icon: '☰', label: 'Liste'   },
    { id: 'week',  icon: '▤', label: 'Semaine' },
    { id: 'month', icon: '▦', label: 'Mois'    },
  ];

  let content = '';
  switch (A.calTab) {
    case 'list':  content = viewList();  break;
    case 'week':  content = viewWeek();  break;
    case 'month': content = viewMonth(); break;
    default:      content = viewList();
  }

  return `
    <div style="max-width:720px;width:100%;margin:0 auto">

      <!-- Toolbar -->
      <div style="padding:10px 14px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">

        <!-- Filtres boutiques -->
        <div style="display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0">
          <button onclick="window.__BOB__.setCalFilter('all')"
            style="height:26px;padding:0 11px;border-radius:20px;white-space:nowrap;flex-shrink:0;border:1.5px solid ${A.calFilter==='all'?'var(--txt)':'var(--border)'};background:${A.calFilter==='all'?'var(--txt)':'transparent'};color:${A.calFilter==='all'?'var(--bg2)':'var(--txt2)'};font-family:'Syne',sans-serif;font-weight:700;font-size:10px;cursor:pointer"
          >Toutes</button>
          ${SHOPS.map(s=>`
            <button onclick="window.__BOB__.setCalFilter('${s.id}')"
              style="height:26px;padding:0 11px;border-radius:20px;white-space:nowrap;flex-shrink:0;border:1.5px solid ${A.calFilter===s.id?s.color:'var(--border)'};background:${A.calFilter===s.id?s.color:'transparent'};color:${A.calFilter===s.id?'#fff':'var(--txt2)'};font-family:'Syne',sans-serif;font-weight:700;font-size:10px;cursor:pointer"
            >${s.name}</button>`).join('')}
        </div>

        <!-- Droite : couleur + vues + créer -->
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">

          <!-- Toggle couleur par statut/boutique -->
          <button onclick="window.__BOB__.setCalColorMode(${A.calColorMode==='status'?"'shop'":"'status'"})"
            title="Colorier par ${A.calColorMode==='status'?'boutique':'statut'}"
            style="height:28px;padding:0 10px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--txt2);font-size:11px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif"
          >${A.calColorMode==='status'?'🏪 Boutique':'🎨 Statut'}</button>

          <!-- Toggle vues -->
          <div style="display:flex;border:1px solid var(--border);border-radius:7px;overflow:hidden">
            ${tabs.map(t=>`
              <button onclick="window.__BOB__.setCalTab('${t.id}')"
                style="height:28px;padding:0 9px;border:none;border-${t.id!=='list'?'left':'right'}:${t.id!=='list'?'1px':'0'} solid var(--border);background:${A.calTab===t.id?'var(--txt)':'transparent'};color:${A.calTab===t.id?'var(--bg2)':'var(--txt2)'};font-size:12px;cursor:pointer;transition:all .12s;white-space:nowrap;font-family:'Space Grotesk',sans-serif"
                title="${t.label}"
              >${t.icon}</button>`).join('')}
          </div>

          <button onclick="window.__BOB__.openCalForm()"
            style="height:28px;padding:0 13px;background:var(--txt);color:var(--bg2);border:none;border-radius:7px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.5px;cursor:pointer"
          >+ Événement</button>
        </div>
      </div>

      <!-- Contenu -->
      ${content}

    </div>

    ${A.calForm ? calForm() : ''}`;
}

// ─────────────────────────────────────────────────────────────
// BADGE tab + ENCART DASHBOARD
// ─────────────────────────────────────────────────────────────
export function calBadge() {
  const n = upcomingCount();
  if (!n) return '';
  return `<span style="background:var(--amber);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;margin-left:4px;vertical-align:middle">${n}</span>`;
}

export function calDashboardWidget() {
  const { thisWeekEvents } = (() => {
    // inline pour éviter import circulaire
    const today = new Date(); today.setHours(0,0,0,0);
    const in7   = new Date(today); in7.setDate(in7.getDate()+7);
    const t = today.toISOString().split('T')[0];
    const l = in7.toISOString().split('T')[0];
    const evs = A.events.filter(e=>e.date>=t&&e.date<=l&&e.status!=='cancelled'&&e.status!=='done').sort((a,b)=>a.date.localeCompare(b.date));
    return { thisWeekEvents: evs };
  })();

  if (!thisWeekEvents.length) return '';

  return `
    <div style="margin:10px 14px 0;background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
      <div style="padding:9px 12px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--txt2)">
          📅 Cette semaine · ${thisWeekEvents.length} événement${thisWeekEvents.length>1?'s':''}
        </div>
        <button onclick="window.__BOB__.sSTb('calendar')"
          style="font-size:10px;color:var(--blue);background:none;border:none;cursor:pointer;font-weight:600;font-family:'Space Grotesk',sans-serif"
        >Voir tout →</button>
      </div>
      ${thisWeekEvents.slice(0,3).map(ev=>{
        const st = EVENT_STATUSES[ev.status]||EVENT_STATUSES.planned;
        const d  = new Date(ev.date+'T00:00:00');
        const dayLabel = d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
        return `
          <div style="padding:8px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
            <div style="width:3px;height:32px;border-radius:2px;background:${st.color};flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:13px;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ev.title}</div>
              <div style="font-size:11px;color:var(--txt2);margin-top:1px">${dayLabel}${ev.time?' · '+ev.time:''}${ev.location?' · '+ev.location:''}</div>
            </div>
            <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:${st.bg};color:${st.color};flex-shrink:0">${st.label}</span>
          </div>`;
      }).join('')}
    </div>`;
}

/* ============================================================
   BOBtheBAGEL — js/state.js
   État global · Constantes · Données initiales
   ============================================================ */

// ── Constantes métier ──────────────────────────────────────

export const SHOPS = [
  { id: 'carl-berner', name: 'CARL BERNER', color: '#E8B84B' },
  { id: 'bjorvika',    name: 'BJØRVIKA',    color: '#E87B4B' },
  { id: 'shop3',       name: 'BOUTIQUE 3',  color: '#4B8BE8' },
];

export const CATEGORY_ICONS = {
  'PAINS':                    '🥖',
  'VIANDES & POISSONS':       '🥩',
  'CRUDITÉS':                 '🥗',
  'FROMAGES & CREAM CHEESE':  '🧀',
  'SAUCES':                   '🥣',
  'DESSERTS':                 '🍰',
  'BOISSONS':                 '🥤',
};

export const CATEGORY_ORDER = [
  'PAINS',
  'VIANDES & POISSONS',
  'CRUDITÉS',
  'FROMAGES & CREAM CHEESE',
  'SAUCES',
  'DESSERTS',
  'BOISSONS',
];

export const ORDER_STATUSES = {
  pending:    { label: 'En attente',     color: '#E8B84B', dot: '#E8B84B' },
  preparing:  { label: 'En préparation', color: '#E87B4B', dot: '#E87B4B' },
  delivering: { label: 'En livraison',   color: '#4B8BE8', dot: '#4B8BE8' },
  validated:  { label: 'Validée',        color: '#1B5E3B', dot: '#1B5E3B' },
  received:   { label: 'Reçue',          color: '#1B5E3B', dot: '#1B5E3B' },
  rejected:   { label: 'Refusée',        color: '#E8294B', dot: '#E8294B' },
};

export const INIT_USERS = [
  { id: 'u1', name: 'Admin',   role: 'admin',   photo: null },
  { id: 'u2', name: 'User',    role: 'user',    photo: null },
  { id: 'u3', name: 'Kitchen', role: 'kitchen', photo: null },
];

// NOTE SÉCURITÉ : les mots de passe ne seront plus stockés en clair.
// En production, utiliser Supabase Auth. Pour le prototype local :
// les credentials sont définis dans auth.js uniquement.
export const INIT_CREDENTIALS = [
  { id: 'u1', password: 'Admin' },
  { id: 'u2', password: 'User'  },
  { id: 'u3', password: 'Kitchen' },
];

export const INIT_PRODUCTS = [
  // PAINS
  { id: 'p-plain',       cat: 'PAINS',               sub: null,           name: 'PLAIN',                    unit: 'pcs', step: 1   },
  { id: 'p-sesame',      cat: 'PAINS',               sub: null,           name: 'SÉSAME',                   unit: 'pcs', step: 1   },
  { id: 'p-pavot',       cat: 'PAINS',               sub: null,           name: 'PAVOT',                    unit: 'pcs', step: 1   },
  { id: 'p-everything',  cat: 'PAINS',               sub: null,           name: 'EVERYTHING',               unit: 'pcs', step: 1   },
  { id: 'p-oignon',      cat: 'PAINS',               sub: null,           name: 'OIGNON',                   unit: 'pcs', step: 1   },
  // VIANDES
  { id: 'vp-ham',        cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'HAM',                      unit: 'g',   step: 100 },
  { id: 'vp-sh',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'SMOKED HAM',               unit: 'g',   step: 100 },
  { id: 'vp-cc',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'CAJUN CHICKEN',            unit: 'g',   step: 100 },
  { id: 'vp-rc',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'ROASTED CHICKEN',          unit: 'g',   step: 100 },
  { id: 'vp-vh',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'VEGAN HAM',                unit: 'g',   step: 100 },
  { id: 'vp-ba',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'BACON',                    unit: 'g',   step: 100 },
  { id: 'vp-co',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'COPPA',                    unit: 'g',   step: 100 },
  { id: 'vp-sa',         cat: 'VIANDES & POISSONS',  sub: 'POISSONS',     name: 'SMOKED SALMON',            unit: 'g',   step: 100 },
  // CRUDITÉS
  { id: 'cr-tom',        cat: 'CRUDITÉS',            sub: null,           name: 'TOMATO',                   unit: 'g',   step: 1   },
  { id: 'cr-spi',        cat: 'CRUDITÉS',            sub: null,           name: 'SPINACH',                  unit: 'g',   step: 1   },
  { id: 'cr-ruc',        cat: 'CRUDITÉS',            sub: null,           name: 'RUCCOLA',                  unit: 'g',   step: 1   },
  { id: 'cr-ron',        cat: 'CRUDITÉS',            sub: null,           name: 'RED ONIONS',               unit: 'g',   step: 1   },
  { id: 'cr-pon',        cat: 'CRUDITÉS',            sub: null,           name: 'PICKLED ONIONS',           unit: 'g',   step: 1   },
  { id: 'cr-cor',        cat: 'CRUDITÉS',            sub: null,           name: 'FRENCH PICKLES',           unit: 'g',   step: 1   },
  { id: 'cr-cap',        cat: 'CRUDITÉS',            sub: null,           name: 'CAPERS',                   unit: 'g',   step: 1   },
  { id: 'cr-lem',        cat: 'CRUDITÉS',            sub: null,           name: 'LEMON JUICE',              unit: 'g',   step: 1   },
  { id: 'cr-oeu',        cat: 'CRUDITÉS',            sub: null,           name: 'ŒUFS',                     unit: 'pcs', step: 1   },
  // FROMAGES
  { id: 'fc-j',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'JALAPEÑO CREAM CHEESE',    unit: 'bac', step: 1   },
  { id: 'fc-h',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'HERBS & GARLIC CREAM CHEESE', unit: 'bac', step: 1 },
  { id: 'fc-n',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'NATURE',                   unit: 'bac', step: 1   },
  { id: 'fc-s',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'SAUMON',                   unit: 'bac', step: 1   },
  { id: 'fc-he',         cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'HERBES',                   unit: 'bac', step: 1   },
  { id: 'fc-c',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'CIBOULETTE',               unit: 'bac', step: 1   },
  { id: 'fc-ch',         cat: 'FROMAGES & CREAM CHEESE', sub: 'FROMAGES',     name: 'CHEDDAR',                  unit: 'g',   step: 100 },
  { id: 'fc-pa',         cat: 'FROMAGES & CREAM CHEESE', sub: 'FROMAGES',     name: 'PARMIGIANO',               unit: 'g',   step: 100 },
  { id: 'fc-mo',         cat: 'FROMAGES & CREAM CHEESE', sub: 'FROMAGES',     name: 'MOZZARELLA DI BUFFALA',    unit: 'g',   step: 100 },
  // SAUCES
  { id: 's-ma',          cat: 'SAUCES',              sub: null,           name: 'MAYONNAISE',               unit: 'pcs', step: 1   },
  { id: 's-vm',          cat: 'SAUCES',              sub: null,           name: 'VEGAN MAYONNAISE',         unit: 'pcs', step: 1   },
  { id: 's-mu',          cat: 'SAUCES',              sub: null,           name: 'SWEET MUSTARD',            unit: 'pcs', step: 1   },
  { id: 's-pe',          cat: 'SAUCES',              sub: null,           name: 'PESTO',                    unit: 'pcs', step: 1   },
  { id: 's-ba',          cat: 'SAUCES',              sub: null,           name: 'BALSAMIC GLAZE',           unit: 'pcs', step: 1   },
  { id: 's-bu',          cat: 'SAUCES',              sub: null,           name: 'BUTTER',                   unit: 'pcs', step: 1   },
  // DESSERTS
  { id: 'd-co',          cat: 'DESSERTS',            sub: null,           name: 'COOKIE',                   unit: 'pcs', step: 1   },
  // BOISSONS
  { id: 'b-aj',          cat: 'BOISSONS',            sub: null,           name: 'APPLE JUICE BY HOVELSRUD', unit: 'pcs', step: 1   },
  { id: 'b-ca',          cat: 'BOISSONS',            sub: null,           name: 'CAFÉ',                     unit: 'pcs', step: 1   },
  { id: 'b-li',          cat: 'BOISSONS',            sub: null,           name: 'LIMONADE',                 unit: 'pcs', step: 1   },
];

// ── État global ────────────────────────────────────────────
// NOTE : en production, remplacer localStorage par Supabase.
// Les fonctions ld/sv sont conservées pour le prototype.

function ld(k, fb) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }
  catch { return fb; }
}

function initStock() {
  const s = { kitchen: {} };
  INIT_PRODUCTS.forEach(p => {
    s.kitchen[p.id] = {
      qty:   p.unit === 'g' ? 5000 : 100,
      alert: p.unit === 'g' ? 1000 : 20,
    };
  });
  SHOPS.forEach(sh => {
    s[sh.id] = {};
    INIT_PRODUCTS.forEach(p => {
      s[sh.id][p.id] = {
        qty:   p.unit === 'g' ? 2000 : 50,
        alert: p.unit === 'g' ? 400  : 10,
      };
    });
  });
  return s;
}

export const A = {
  // Navigation
  view: 'login',

  // Préférences
  dark: ld('dk', false),
  lang: ld('lg', 'fr'),

  // Données
  users:    ld('us', INIT_USERS),
  orders:   ld('or', []),
  ksends:   ld('ks', []),
  products: ld('pr', INIT_PRODUCTS.map(p => ({ ...p, active: true, price: 0 }))),
  stock:    ld('st', initStock()),
  receipts: ld('rc', []),
  events:   ld('ev', []),            // événements calendrier
  messages: ld('msg', []),          // tous les messages
  conversations: ld('conv', [      // conversations prédéfinies
    { id: 'general', type: 'general', label: 'Général', icon: '📢' },
  ]),

  // Logs
  sLog: ld('sl', []),
  aLog: ld('al', []),
  cLog: ld('cl', []),

  // UI
  banner:   ld('bn', ''),
  seen:     ld('sn', {}),

  // Session
  cUser:   null,
  selShop: null,

  // Tabs
  sTab:  'order',
  kTab:  'orders',
  sCat:  'PAINS',
  rcCat: 'PAINS',

  // Calendrier
  calTab:       'list',
  calFilter:    'all',
  calForm:      null,
  calMonth:     new Date().getMonth(),
  calYear:      new Date().getFullYear(),
  calColorMode: 'status',   // 'status' | 'shop'

  // Chat
  chatConvId: 'general',  // conversation active
  chatInput:  '',

  // Panier boutique
  cart:  {},
  note:  '',
  del:   '',
  delT:  '',

  // UI states
  search:   '',
  confirm:  null,
  summary:  null,
  toasts:   [],

  // Login
  lAttempts: 0,
  lLocked:   false,

  // Formulaires
  addU:    false,
  addP:    false,
  addRc:   false,
  showSL:  false,
  admTab:  'banner',
  nU:      { name: '', password: '', role: 'user' },
  nP:      { name: '', cat: 'PAINS', unit: 'pcs', step: 1, price: 0 },
  rcForm:  { sup: '', cart: {} },
};

// ── Persistance ────────────────────────────────────────────
// NOTE SÉCURITÉ : en production, ne jamais persister les mots de passe côté client.
export function sv(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch (e) { console.warn('[BOB] localStorage write failed:', k, e); }
}

export function clearAll() {
  ['dk','lg','us','or','ks','pr','st','rc','sl','al','cl','bn','sn','msg','conv','ev'].forEach(k => {
    localStorage.removeItem(k);
  });
}

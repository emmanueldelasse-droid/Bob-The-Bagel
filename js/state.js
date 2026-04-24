/* ============================================================
   BOBtheBAGEL — js/state.js
   État global · Constantes · Données initiales
   ============================================================ */

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
  { id: 'u1', name: 'Manager',  role: 'admin',   photo: null },
  { id: 'u2', name: 'Team BTB', role: 'user',    photo: null },
  { id: 'u3', name: 'Kitchen',  role: 'kitchen', photo: null },
];

export const ROLE_LABELS = {
  admin:   'Manager',
  user:    'Team BTB',
  kitchen: 'Kitchen',
};

export const INIT_PRODUCTS = [
  { id: 'p-plain',       cat: 'PAINS',               sub: null,           name: 'PLAIN',                    unit: 'pcs', step: 1   },
  { id: 'p-sesame',      cat: 'PAINS',               sub: null,           name: 'SÉSAME',                   unit: 'pcs', step: 1   },
  { id: 'p-pavot',       cat: 'PAINS',               sub: null,           name: 'PAVOT',                    unit: 'pcs', step: 1   },
  { id: 'p-everything',  cat: 'PAINS',               sub: null,           name: 'EVERYTHING',               unit: 'pcs', step: 1   },
  { id: 'p-oignon',      cat: 'PAINS',               sub: null,           name: 'OIGNON',                   unit: 'pcs', step: 1   },
  { id: 'vp-ham',        cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'HAM',                      unit: 'g',   step: 100 },
  { id: 'vp-sh',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'SMOKED HAM',               unit: 'g',   step: 100 },
  { id: 'vp-cc',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'CAJUN CHICKEN',            unit: 'g',   step: 100 },
  { id: 'vp-rc',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'ROASTED CHICKEN',          unit: 'g',   step: 100 },
  { id: 'vp-vh',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'VEGAN HAM',                unit: 'g',   step: 100 },
  { id: 'vp-ba',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'BACON',                    unit: 'g',   step: 100 },
  { id: 'vp-co',         cat: 'VIANDES & POISSONS',  sub: 'VIANDES',      name: 'COPPA',                    unit: 'g',   step: 100 },
  { id: 'vp-sa',         cat: 'VIANDES & POISSONS',  sub: 'POISSONS',     name: 'SMOKED SALMON',            unit: 'g',   step: 100 },
  { id: 'cr-tom',        cat: 'CRUDITÉS',            sub: null,           name: 'TOMATO',                   unit: 'g',   step: 1   },
  { id: 'cr-spi',        cat: 'CRUDITÉS',            sub: null,           name: 'SPINACH',                  unit: 'g',   step: 1   },
  { id: 'cr-ruc',        cat: 'CRUDITÉS',            sub: null,           name: 'RUCCOLA',                  unit: 'g',   step: 1   },
  { id: 'cr-ron',        cat: 'CRUDITÉS',            sub: null,           name: 'RED ONIONS',               unit: 'g',   step: 1   },
  { id: 'cr-pon',        cat: 'CRUDITÉS',            sub: null,           name: 'PICKLED ONIONS',           unit: 'g',   step: 1   },
  { id: 'cr-cor',        cat: 'CRUDITÉS',            sub: null,           name: 'FRENCH PICKLES',           unit: 'g',   step: 1   },
  { id: 'cr-cap',        cat: 'CRUDITÉS',            sub: null,           name: 'CAPERS',                   unit: 'g',   step: 1   },
  { id: 'cr-lem',        cat: 'CRUDITÉS',            sub: null,           name: 'LEMON JUICE',              unit: 'g',   step: 1   },
  { id: 'cr-oeu',        cat: 'CRUDITÉS',            sub: null,           name: 'ŒUFS',                     unit: 'pcs', step: 1   },
  { id: 'fc-j',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'JALAPEÑO CREAM CHEESE',    unit: 'bac', step: 1   },
  { id: 'fc-h',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'HERBS & GARLIC CREAM CHEESE', unit: 'bac', step: 1 },
  { id: 'fc-n',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'NATURE',                   unit: 'bac', step: 1   },
  { id: 'fc-s',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'SAUMON',                   unit: 'bac', step: 1   },
  { id: 'fc-he',         cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'HERBES',                   unit: 'bac', step: 1   },
  { id: 'fc-c',          cat: 'FROMAGES & CREAM CHEESE', sub: 'CREAM CHEESE', name: 'CIBOULETTE',               unit: 'bac', step: 1   },
  { id: 'fc-ch',         cat: 'FROMAGES & CREAM CHEESE', sub: 'FROMAGES',     name: 'CHEDDAR',                  unit: 'g',   step: 100 },
  { id: 'fc-pa',         cat: 'FROMAGES & CREAM CHEESE', sub: 'FROMAGES',     name: 'PARMIGIANO',               unit: 'g',   step: 100 },
  { id: 'fc-mo',         cat: 'FROMAGES & CREAM CHEESE', sub: 'FROMAGES',     name: 'MOZZARELLA DI BUFFALA',    unit: 'g',   step: 100 },
  { id: 's-ma',          cat: 'SAUCES',              sub: null,           name: 'MAYONNAISE',               unit: 'pcs', step: 1   },
  { id: 's-vm',          cat: 'SAUCES',              sub: null,           name: 'VEGAN MAYONNAISE',         unit: 'pcs', step: 1   },
  { id: 's-mu',          cat: 'SAUCES',              sub: null,           name: 'SWEET MUSTARD',            unit: 'pcs', step: 1   },
  { id: 's-pe',          cat: 'SAUCES',              sub: null,           name: 'PESTO',                    unit: 'pcs', step: 1   },
  { id: 's-ba',          cat: 'SAUCES',              sub: null,           name: 'BALSAMIC GLAZE',           unit: 'pcs', step: 1   },
  { id: 's-bu',          cat: 'SAUCES',              sub: null,           name: 'BUTTER',                   unit: 'pcs', step: 1   },
  { id: 'd-co',          cat: 'DESSERTS',            sub: null,           name: 'COOKIE',                   unit: 'pcs', step: 1   },
  { id: 'b-aj',          cat: 'BOISSONS',            sub: null,           name: 'APPLE JUICE BY HOVELSRUD', unit: 'pcs', step: 1   },
  { id: 'b-ca',          cat: 'BOISSONS',            sub: null,           name: 'CAFÉ',                     unit: 'pcs', step: 1   },
  { id: 'b-li',          cat: 'BOISSONS',            sub: null,           name: 'LIMONADE',                 unit: 'pcs', step: 1   },
];

function ld(k, fb) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
}

function initStock() {
  const s = { kitchen: {} };
  INIT_PRODUCTS.forEach((p) => {
    s.kitchen[p.id] = { qty: p.unit === 'g' ? 5000 : 100, alert: p.unit === 'g' ? 1000 : 20 };
  });
  SHOPS.forEach((sh) => {
    s[sh.id] = {};
    INIT_PRODUCTS.forEach((p) => {
      s[sh.id][p.id] = { qty: p.unit === 'g' ? 2000 : 50, alert: p.unit === 'g' ? 400 : 10 };
    });
  });
  return s;
}

export const A = {
  view: 'login',
  dark: ld('dk', false),
  lang: ld('lg', 'fr'),

  users:    ld('us', INIT_USERS),
  shops:    ld('sh', SHOPS),
  orders:   ld('or', []),
  ksends:   ld('ks', []),
  products: ld('pr', INIT_PRODUCTS.map((p) => ({ ...p, active: true, price: 0 }))),
  stock:    ld('st', initStock()),
  audits:   ld('au', []),
  planning: ld('pl', []),
  receipts: ld('rc', []),
  events:   ld('ev', []),
  messages: [],
  conversations: [],
  chatSeen: ld('chat_seen', {}),
  notifications: ld('nt', []),

  sLog: ld('sl', []),
  aLog: ld('al', []),
  cLog: ld('cl', []),

  banner: ld('bn', ''),
  seen:   ld('sn', {}),

  cUser:   null,
  testProfile: ld('tp', null),
  selShop: null,

  loginStep: 'profile',
  loginRole: null,
  loginIdent: '',
  loginPwd:   '',
  loginError: '',

  sTab:  'order',
  kTab:  'orders',
  sCat:  'PAINS',
  rcCat: 'PAINS',

  calTab:       'list',
  calFilter:    'all',
  calForm:      null,
  calMonth:     new Date().getMonth(),
  calYear:      new Date().getFullYear(),
  calColorMode: 'status',

  chatConvId: 'general',
  chatInput:  '',
  chatPriority: 'normal',

  auditTab:       'list',
  auditFilter:    'all',
  auditCurrentId: null,
  auditDraft:     null,
  auditContext:   'admin',

  planTab:      'week',
  planShop:     null,
  planRefDate:  new Date().toISOString().split('T')[0],
  planDraft:    null,
  planContext:  'admin',

  reserveDraft: null,
  showNotifs:   false,

  cart: {},
  note: '',
  del:  '',
  delT: '',

  search:  '',
  confirm: null,
  summary: null,
  toasts:  [],

  lAttempts: 0,
  lLocked:   false,

  addU:   false,
  addP:   false,
  addRc:  false,
  showSL: false,
  admTab: 'banner',
  nU:     { name: '', password: '', role: 'user' },
  nP:     { name: '', cat: 'PAINS', unit: 'pcs', step: 1, price: 0 },
  rcForm: { sup: '', cart: {} },

  runtime: {
    booting: true,
    ordersLoading: false,
    ordersHydrated: false,
    ordersError: '',
    lastOrdersSyncAt: null,
    stockLoading: false,
    stockHydrated: false,
    stockError: '',
    lastStockSyncAt: null,
    chatLoading: false,
    chatHydrated: false,
    chatError: '',
    lastChatSyncAt: null,
    shopsLoading: false,
    shopsHydrated: false,
    shopsError: '',
    lastShopsSyncAt: null,
    auditsLoading: false,
    auditsHydrated: false,
    auditsError: '',
    lastAuditsSyncAt: null,
  },
};

export function setRuntimeFlag(key, value) {
  A.runtime[key] = value;
}

export function resetOrdersRuntime() {
  A.runtime.ordersLoading = false;
  A.runtime.ordersHydrated = false;
  A.runtime.ordersError = '';
  A.runtime.lastOrdersSyncAt = null;
}

export function resetStockRuntime() {
  A.runtime.stockLoading = false;
  A.runtime.stockHydrated = false;
  A.runtime.stockError = '';
  A.runtime.lastStockSyncAt = null;
}

export function resetChatRuntime() {
  A.runtime.chatLoading = false;
  A.runtime.chatHydrated = false;
  A.runtime.chatError = '';
  A.runtime.lastChatSyncAt = null;
}

export function resetShopsRuntime() {
  A.runtime.shopsLoading = false;
  A.runtime.shopsHydrated = false;
  A.runtime.shopsError = '';
  A.runtime.lastShopsSyncAt = null;
}

export function resetAuditsRuntime() {
  A.runtime.auditsLoading = false;
  A.runtime.auditsHydrated = false;
  A.runtime.auditsError = '';
  A.runtime.lastAuditsSyncAt = null;
}

export function sv(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.warn('[BOB] localStorage write failed:', k, e);
  }
}

export function clearAll() {
  ['dk','lg','us','sh','or','ks','pr','st','rc','sl','al','cl','bn','sn','msg','conv','ev','chat_seen','tp','au','pl','nt'].forEach((k) => {
    localStorage.removeItem(k);
  });
  A.orders = [];
  A.messages = [];
  A.conversations = [];
  A.chatSeen = {};
  A.testProfile = null;
  resetOrdersRuntime();
  resetStockRuntime();
  resetChatRuntime();
}

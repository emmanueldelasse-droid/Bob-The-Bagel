# SESSION — BOBtheBAGEL
> Fichier de continuité universel.
> À lire en premier dans toute nouvelle session IA.
> Objectif : reprise rapide avec un minimum de tokens.

---

## 1) IDENTITÉ
- Projet : BOBtheBAGEL
- Repo : `emmanueldelasse-droid/Bob-The-Bagel`
- Branche : `main`
- Déploiement : Vercel
- Dernière mise à jour : 2026-04-24
- Dernière IA : Claude (Opus 4.7)

## 2) RÉSUMÉ ULTRA-COURT
- Runtime réel : app statique `index.html` + modules JS ES6, **pas React**.
- Backend cible : Supabase comme **source de vérité unique**.
- État réel : commandes, stock et chat sont branchés à Supabase avec hydratation, synchro live et états UI visibles ; en mode test local, commandes, stock ET chat retombent en local. Les profils sont renommés Team BTB (user) et Manager (admin). Flow login en 2 étapes : choix profil → stub identifiant/mot de passe → select boutique. Le Manager est un superset de Team BTB + tâches admin (planning équipe, audit, stock, produits, bannière). Nouveau module planning personnel par boutique (admin + onglet contextuel shop). Réserve à la réception de commande avec notification Manager (pastille cloche dans headers). Chat : read receipts (vu par qui, initiales). Thème adapté au site bobthebagel.com (vert brand `#0E4B30`, police display Archivo Black).

## 3) ÉTAT ACTUEL RÉEL
### Ce qui existe déjà
- Login
- Sélection d'espace
- Vue boutique
- Vue cuisine
- Vue admin
- Commandes front
- Stock front
- Chat front
- Calendrier front
- Bannière admin
- Profil front
- Audit boutique (admin → onglet Audit : liste, création, sections propreté/stock/équipements/hygiène/service, photos par item + photo générale, score auto OK/KO/N/A)
- Login en 2 étapes (profil → identifiant stub → select)
- Planning personnel par boutique (section admin + onglet contextuel dans la vue boutique, vue semaine ou liste, CRUD shifts Manager uniquement)
- Réserve sur réception commande (Team BTB signale manquant/anomalie, item par item + note, notification Manager créée)
- Centre de notifications (cloche + badge non lus, sheet dédiée, mark seen / mark all seen)
- Read receipts chat (vu par N/M, initiales des lecteurs sur messages envoyés)
- Pastille sur onglet `Commandes` (nombre de commandes en attente de réception pour la boutique active)
- Thème BOBtheBAGEL : fond clair, vert brand `#0E4B30` en accent primaire, police display Archivo Black sur logo / boutons / labels

### Ce qui est déjà branché côté Supabase
- Auth email / mot de passe toujours disponible côté backend cible
- Accueil login basculé en accès test direct par boutons Admin/User sans mot de passe
- Commandes et stock retombent en persistance locale en mode test si l'anon key front est invalide
- Profil utilisateur
- API : orders, shops, products, stock, messages, upload photo
- Realtime : orders, messages
- Hydratation des commandes au login / restore session
- Création et mises à jour principales de commandes via helpers Supabase avec mapping défensif
- Hydratation du stock au login / restore session
- Écritures de stock critiques via helpers Supabase (mise à jour stock, réception commande, réception fournisseur)
- Synchro live minimale commandes + stock démarrée au login / restore session et arrêtée au logout
- États visuels loading/error/sync ajoutés dans les vues boutique et cuisine pour commandes/stock
- Chat principal branché à Supabase : conversations + messages chargés au login / restore session, synchro live dédiée, runtime loading/error/sync dans la vue chat
- Chat en mode test : conversations/messages gardés en mémoire locale (conversation "general" auto-créée), envoi texte et photo en data URL, aucune tentative Supabase
- Photos chat : envoi branché via Supabase Storage (bucket `chat-photos`) avec fallback data URL en mode test, bouton 📎 dans la zone de saisie
- Boutiques hydratées via `loadShopsIntoState` : `A.shops = ld('sh', SHOPS)` au boot, remplacé par le résultat de `fetchShops()` en prod, fallback local en test ou si la requête échoue

### Ce qui reste faux / incomplet
- Calendrier encore local
- Admin users faux : création locale alors que login réel = Supabase Auth
- Mot de passe profil/admin non réellement branché
- Droits par boutique non réellement appliqués côté front
- Admin ne gère pas encore ajout/suppression boutiques
- Couches commandes/stock/chat encore à fiabiliser selon le vrai schéma Supabase en production
- `A.shops` est rempli depuis Supabase mais l'admin ne propose pas encore de CRUD boutiques
- Photos chat en mode test = data URL en mémoire (perdue au rechargement)
- Audits : table Supabase `audits` attendue (id, shop_id, shop_name, auditor_id, auditor_name, status, note, photos jsonb, sections jsonb, score, created_at, completed_at) + bucket `audit-photos` ; non provisionnés côté base à date. En mode test, audits + photos restent locaux (localStorage + data URL).

## 4) STACK RÉELLE
- Frontend : HTML + CSS + JavaScript ES6 modulaire
- Entrée : `index.html`
- State : `js/state.js` (`A`)
- Router : `js/router.js`
- Backend : Supabase
- Auth : Supabase Auth
- Persistance actuelle : commandes + stock + chat principal branchés à Supabase, reste encore mixte avec `localStorage`

## 5) DÉCISION CADRE
- Ne **pas** lancer de réécriture React maintenant.
- Stabiliser la base actuelle d'abord.
- Problème principal : absence de source de vérité unique.
- Cible : Supabase = vérité métier unique.
- `localStorage` seulement pour préférences UI non critiques si utile.

## 6) FICHIERS CRITIQUES
- `index.html`
- `js/state.js`
- `js/router.js`
- `js/utils.js`
- `js/auth.js`
- `js/api/supabase.js`
- `js/modules/orders.js`
- `js/modules/stock.js`
- `js/modules/chat.js`
- `js/modules/admin.js`
- `js/modules/calendar.js`
- `js/modules/audit.js`
- `js/views/login.js`
- `js/views/select.js`
- `js/views/shop.js`
- `js/views/kitchen.js`
- `js/views/admin.js`
- `js/views/chat.js`
- `js/views/audit.js`
- `js/modules/planning.js`
- `js/views/planning.js`
- `js/modules/notifications.js`

## 7) PROCHAINE ACTION UNIQUE
**NEXT_ACTION** : brancher le mot de passe profil sur Supabase Auth après les tests (G1, P0), puis provisionner les tables `planning`, `notifications`, `audits` + bucket `audit-photos` (RLS Manager) et appliquer les droits par boutique (I1).

## 8) BLOCAGES / RISQUES
- App encore hybride = comportement non totalement fiable en multi-utilisateur réel
- Mapping Supabase encore partiellement défensif car schéma distant pas encore totalement reflété dans le front
- Faux sentiment de “fini” sur admin / calendrier / photos chat
- Référentiel visuel ancien possiblement contradictoire avec le runtime actuel
- La clé Supabase front actuelle répond `Invalid API key`, donc le mode test doit continuer à contourner la base

## 9) PLANNING D'AMÉLIORATION VIVANT
> À mettre à jour à chaque session. Garder court. Mettre un seul statut par ligne.
>
> Statuts autorisés : `TODO` / `DOING` / `DONE` / `BLOCKED` / `DECIDE`

| ID | Sujet | Statut | Priorité | Résultat attendu |
|----|-------|--------|----------|------------------|
| A1 | Corriger `README.md` | DONE | P0 | Repo cohérent avec le vrai projet |
| A2 | Garder `SESSION.md` compact et à jour | DOING | P0 | Reprise rapide inter-IA |
| B1 | Geler la base actuelle HTML/JS comme base officielle | TODO | P0 | Pas de réécriture prématurée |
| C1 | Faire de Supabase la source de vérité unique | DOING | P0 | Fin du mix Supabase/localStorage |
| D1 | Reprendre `state.js` + boot + séparation UI/données métier | DOING | P0 | Noyau propre |
| E1 | Brancher les commandes réellement sur Supabase | DOING | P0 | Commandes cohérentes boutique/cuisine |
| F1 | Brancher le stock réellement sur Supabase | DOING | P0 | Stock partagé fiable |
| G1 | Refaire l'admin utilisateurs avec vrai flux Supabase Auth | TODO | P0 | Création de comptes réellement utilisables |
| H1 | Sortir les boutiques du hardcode `SHOPS` | DOING | P1 | Boutiques dynamiques |
| I1 | Appliquer les vrais droits par boutique | TODO | P1 | Accès filtrés correctement |
| J1 | Brancher le chat réellement sur Supabase | DONE | P1 | Messagerie multi-utilisateur réelle |
| K1 | Ajouter les photos dans le chat | DOING | P1 | Échange de photos opérationnel |
| L1 | Brancher le calendrier réellement sur Supabase | TODO | P1 | Calendrier partagé fiable |
| M1 | Nettoyer logs et traçabilité | TODO | P2 | Audit utile |
| N1 | Trancher l'identité visuelle cible officielle | DECIDE | P2 | Plus de contradiction design/référentiel |
| O1 | Supprimer les faux écrans “finis” | TODO | P1 | Produit plus honnête et plus propre |
| P1 | Ajouter des états loading/error visibles sur commandes/stock | DONE | P1 | UX plus fiable et moins trompeuse |
| Q1 | Section audit admin (propreté/stock/équipements/hygiène/service) | DOING | P1 | Manager peut auditer une boutique avec photos + score |
| R1 | Renommer profils Team BTB / Manager + flow login 2 étapes | DONE | P0 | Profils clairs + vraie saisie identifiant |
| S1 | Planning personnel par boutique (CRUD Manager) | DOING | P1 | Manager planifie les shifts, Team BTB consulte |
| T1 | Réserve sur réception commande + notif Manager | DONE | P1 | Anomalie/manquant tracée et remontée |
| U1 | Pastilles notifications (cloche) + read receipts chat | DONE | P1 | Visibilité non lus / qui a lu quoi |
| V1 | Adapter thème au site bobthebagel.com (vert brand + Archivo Black) | DONE | P2 | Cohérence de marque |
| W1 | Brancher planning / réserve / notifications sur Supabase | TODO | P1 | Fin du mode local pour ces modules |

## 10) DERNIÈRES DÉCISIONS VALIDÉES
- Runtime officiel de reprise = app actuelle HTML/JS modulaire
- Pas de réécriture React immédiate
- Supabase = cible unique pour la donnée métier
- Le planning ci-dessus est le backlog officiel à maintenir
- Le `README.md` doit rester aligné avec la réalité du projet
- Les commandes et le stock passent désormais par une couche Supabase défensive avant d'attaquer chat / admin / calendrier
- La fiabilité passe maintenant aussi par la synchro live minimale et par des états UI visibles loading/error
- Le chat principal passe désormais par Supabase avec conversations/messages réels, synchro live dédiée et runtime visuel
- Le rendu chat ne doit jamais injecter brut les champs texte ou URL issus de Supabase
- L'accueil login passe en mode test direct avec boutons Admin/User et persistance locale du profil choisi
- En mode test, commandes, stock ET chat doivent fonctionner localement si Supabase renvoie `Invalid API key`
- Les photos chat transitent par `uploadPhoto` (bucket `chat-photos`) en prod, et par data URL en mode test, avec une limite de 2 Mo côté front
- Les boutiques exposées à l'UI viennent de `A.shops` (hydraté via `loadShopsIntoState`) ; le hardcode `SHOPS` reste en seed/fallback uniquement dans `state.js` et `api/supabase.js`
- Audits boutique : section dédiée côté admin avec sections prédéfinies (propreté/stock/équipements/hygiène/service), items ok/nok/na + commentaire + photos multiples, photo générale, score OK/KO auto, brouillon ou clôturé. Persistance locale (`A.audits`, clé `au`), upsert Supabase `audits` en prod (fallback silencieux vers local si erreur)
- Rôle admin = superset du rôle user : au login, l'admin atterrit désormais sur la page `select` comme un user (accès boutiques + cuisine + chat + calendrier via les onglets) et dispose en plus d'un bouton "Panneau admin" rouge sur `select` qui mène à `bAdmin` (bannière, utilisateurs, produits, audit, logs)
- Audit contextuel : un onglet 🔍 Audit apparaît dans la vue boutique uniquement si l'utilisateur est admin. En contexte "shop" (`A.auditContext = 'shop'`), la liste est filtrée sur `A.selShop`, les filtres inter-boutiques sont masqués et le dropdown boutique de l'édition est remplacé par une puce figée. Le panneau admin garde la vue audit globale (`A.auditContext = 'admin'`) avec filtres + bouton par boutique.

## 11) DERNIÈRE SESSION
- Date : 2026-04-24
- IA : Claude (Opus 4.7)
- Fait : renommage profils (User → Team BTB, Admin → Manager) + flow login en 2 étapes (profil → identifiant stub → select) + section Planning personnel (module + vue + tab admin + tab contextuel shop, CRUD Manager) + adaptation thème bobthebagel.com (vert brand `#0E4B30`, police Archivo Black display, fond clair) + réserve sur réception commande (Team BTB signale manquant/anomalie avec delta qty + note) + centre de notifications Manager avec cloche + badge unseen + sheet dédiée + pastille `Commandes` pour attente réception + read receipts chat (vu par N/M, initiales)
- Fichiers inspectés : `SESSION.md`, `index.html`, `js/state.js`, `js/auth.js`, `js/router.js`, `js/utils.js`, `js/views/login.js`, `js/views/select.js`, `js/views/shop.js`, `js/views/admin.js`, `js/views/chat.js`, `js/views/modals.js`, `js/views/calendar.js`, `js/modules/chat.js`, `js/modules/admin.js`, `js/modules/orders.js`, `js/modules/calendar.js`, `css/base.css`, `css/components.css`, `css/layout.css`
- Fichiers modifiés : `js/state.js`, `js/auth.js`, `js/router.js`, `js/views/login.js`, `js/views/select.js`, `js/views/shop.js`, `js/views/admin.js`, `js/views/chat.js`, `js/views/modals.js`, `js/modules/chat.js`, `js/modules/admin.js`, `js/modules/orders.js`, `css/base.css`, `css/components.css`, `css/layout.css`, `index.html`, `SESSION.md`
- Fichiers créés : `js/modules/planning.js`, `js/views/planning.js`, `js/modules/notifications.js`
- Points ouverts : G1 (brancher mot de passe Supabase Auth après tests), I1 (droits par boutique), brancher planning + notifications + réserve sur Supabase (W1), valider visuellement sur tous écrans que le thème brand ne casse pas de contraste (bannières, toasts, statuts)

## 12) FORMAT OBLIGATOIRE POUR TOUTE IA
### Au démarrage
1. Lire ce fichier seulement en premier.
2. Résumer en 3 lignes max : projet / état / next action.
3. Ne pas inventer l'avancement.
4. Si l'utilisateur donne une nouvelle priorité, l'appliquer puis mettre à jour ce fichier à la fin.

### En fin de session
Mettre à jour uniquement ces blocs si nécessaire :
- `Dernière mise à jour`
- `Dernière IA`
- `Résumé ultra-court` si l'état réel change
- `État actuel réel` si quelque chose devient vrai ou faux
- `NEXT_ACTION`
- le tableau `PLANNING D'AMÉLIORATION VIVANT`
- `DERNIÈRES DÉCISIONS VALIDÉES`
- `DERNIÈRE SESSION`

### Règles d'écriture
- Écrire court, factuel, vérifié
- Pas de roman
- Pas de répétition
- Pas de blabla produit/marketing
- Pas de “fini” si la donnée métier est encore locale
- Une ligne backlog = un sujet clair
- Toujours faire évoluer les statuts du backlog au fur et à mesure

## 13) MINI-TEMPLATE DE MISE À JOUR
```md
- Dernière mise à jour : YYYY-MM-DD
- Dernière IA : NOM
- NEXT_ACTION : ...

| ID | Sujet | Statut | Priorité | Résultat attendu |
|----|-------|--------|----------|------------------|
| X1 | ... | DOING | P1 | ... |

- Dernières décisions validées : ...
- Dernière session : fait / fichiers modifiés / points ouverts
```

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
- Dernière mise à jour : 2026-04-21
- Dernière IA : ChatGPT (GPT-5.4 Thinking)

## 2) RÉSUMÉ ULTRA-COURT
- Runtime réel : app statique `index.html` + modules JS ES6, **pas React**.
- Backend cible : Supabase comme **source de vérité unique**.
- État réel : commandes + stock sont déjà branchés à Supabase avec hydratation, synchro live minimale et états UI visibles, et le chat principal passe maintenant par Supabase pour les conversations/messages, avec synchro live et runtime visuel, mais photos, calendrier, admin users et boutiques restent encore à finaliser.

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

### Ce qui est déjà branché côté Supabase
- Auth email / mot de passe
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

### Ce qui reste faux / incomplet
- Photos chat non branchées dans l'UI finale
- Calendrier encore local
- Admin users faux : création locale alors que login réel = Supabase Auth
- Mot de passe profil/admin non réellement branché
- Boutiques encore codées en dur dans `SHOPS`
- Droits par boutique non réellement appliqués côté front
- Admin ne gère pas encore ajout/suppression boutiques
- Couches commandes/stock/chat encore à fiabiliser selon le vrai schéma Supabase en production

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
- `js/views/login.js`
- `js/views/select.js`
- `js/views/shop.js`
- `js/views/kitchen.js`
- `js/views/admin.js`
- `js/views/chat.js`

## 7) PROCHAINE ACTION UNIQUE
**NEXT_ACTION** : fiabiliser le chat sur le vrai schéma Supabase (conversations/messages), puis brancher les photos du chat ou attaquer les boutiques/accès réels selon priorité.

## 8) BLOCAGES / RISQUES
- App encore hybride = comportement non totalement fiable en multi-utilisateur réel
- Mapping Supabase encore partiellement défensif car schéma distant pas encore totalement reflété dans le front
- Faux sentiment de “fini” sur admin / calendrier / photos chat
- Référentiel visuel ancien possiblement contradictoire avec le runtime actuel

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
| H1 | Sortir les boutiques du hardcode `SHOPS` | TODO | P1 | Boutiques dynamiques |
| I1 | Appliquer les vrais droits par boutique | TODO | P1 | Accès filtrés correctement |
| J1 | Brancher le chat réellement sur Supabase | DOING | P1 | Messagerie multi-utilisateur réelle |
| K1 | Ajouter les photos dans le chat | TODO | P1 | Échange de photos opérationnel |
| L1 | Brancher le calendrier réellement sur Supabase | TODO | P1 | Calendrier partagé fiable |
| M1 | Nettoyer logs et traçabilité | TODO | P2 | Audit utile |
| N1 | Trancher l'identité visuelle cible officielle | DECIDE | P2 | Plus de contradiction design/référentiel |
| O1 | Supprimer les faux écrans “finis” | TODO | P1 | Produit plus honnête et plus propre |
| P1 | Ajouter des états loading/error visibles sur commandes/stock | DONE | P1 | UX plus fiable et moins trompeuse |

## 10) DERNIÈRES DÉCISIONS VALIDÉES
- Runtime officiel de reprise = app actuelle HTML/JS modulaire
- Pas de réécriture React immédiate
- Supabase = cible unique pour la donnée métier
- Le planning ci-dessus est le backlog officiel à maintenir
- Le `README.md` doit rester aligné avec la réalité du projet
- Les commandes et le stock passent désormais par une couche Supabase défensive avant d'attaquer chat / admin / calendrier
- La fiabilité passe maintenant aussi par la synchro live minimale et par des états UI visibles loading/error
- Le chat principal passe désormais par Supabase avec conversations/messages réels, synchro live dédiée et runtime visuel

## 11) DERNIÈRE SESSION
- Date : 2026-04-21
- IA : ChatGPT (GPT-5.4 Thinking)
- Fait : audit réel du repo + réécriture du référentiel + création du backlog vivant + correction du `README.md` + première bascule commandes vers Supabase + première bascule stock vers Supabase + synchro live minimale commandes/stock + états UI loading/error visibles commandes/stock + première bascule chat vers Supabase
- Fichiers inspectés : `SESSION.md`, `js/state.js`, `js/auth.js`, `js/modules/chat.js`, `js/views/chat.js`
- Fichiers modifiés : `js/state.js`, `js/auth.js`, `js/modules/chat.js`, `js/views/chat.js`, `SESSION.md`
- Points ouverts : valider le chat sur la vraie base, puis photos chat ou boutiques/accès

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

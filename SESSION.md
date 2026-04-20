# SESSION – BOBtheBAGEL
> **Fichier de continuité de session — à lire en PREMIER à chaque nouvelle session IA**
>
> **Référentiel officiel de reprise du projet** : l'état réel ci-dessous remplace les anciennes hypothèses. Toute nouvelle session doit partir de ce document et suivre le planning A → Z sans inventer d'avancement.

---

## Métadonnées
| Champ | Valeur |
|-------|--------|
| **Dernière mise à jour** | 2026-04-21 |
| **IA utilisée** | ChatGPT (GPT-5.4 Thinking) |
| **Branche active** | main |
| **Repo GitHub** | emmanueldelasse-droid/Bob-The-Bagel |
| **Déployé sur** | Vercel |

---

## Réalité actuelle du projet

### Ce que le code montre réellement
- Le runtime actuel n'est **pas** une V2 React : c'est une application **statique `index.html` + modules JS ES6**.
- Le projet a déjà un **client Supabase** branché côté front.
- Le **login** passe par **Supabase Auth** avec récupération d'un profil utilisateur.
- Une partie du backend est **prévue ou partiellement branchée** dans `js/api/supabase.js` : auth, orders, shops, products, stock, messages, storage photos, realtime orders/messages.
- Mais le cœur métier reste encore **majoritairement piloté en `localStorage`** via `state.js` et `sv(...)`.

### Conséquence directe
Le projet est aujourd'hui **hybride et incohérent** :
- une partie vit dans Supabase,
- une partie vit dans le navigateur,
- donc l'application n'est **pas encore fiable en multi-utilisateur réel**.

---

## Stack technique réelle
- **Frontend runtime réel** : HTML + CSS + JavaScript modulaire ES6
- **Point d'entrée** : `index.html`
- **State management actuel** : état global `A` dans `js/state.js`
- **Routing actuel** : `js/router.js`
- **Backend réel en cours de branchement** : Supabase
- **Authentification réelle** : Supabase Auth
- **Persistance actuelle mixte** : Supabase + localStorage
- **Temps réel disponible côté API** : prévu / partiellement câblé via Supabase Realtime

---

## Rôles utilisateurs visés
- `boutique` — passe commandes, suit stock, confirme réception
- `cuisine` — prépare, ajuste, valide, expédie, suit stock central
- `admin` — administre utilisateurs, produits, boutiques, accès, bannière, référentiel

---

## Audit synthétique — état réel

### Ce qui fonctionne déjà côté produit
- Écran de login
- Sélection d'espace
- Vue boutique
- Vue cuisine
- Vue admin
- Cycle de base d'une commande côté front
- Stock boutique et cuisine côté front
- Chat côté front
- Calendrier côté front
- Bannière admin côté front
- Profil utilisateur côté front

### Ce qui est déjà branché côté Supabase
- Authentification email / mot de passe
- Récupération du profil utilisateur
- Fonctions API pour orders / shops / products / stock / messages / upload photo
- Fonctions de subscription realtime pour orders et messages

### Ce qui est faux, incomplet ou trompeur aujourd'hui
- Le `README.md` du repo ne correspond pas au projet BOBtheBAGEL
- L'ancien `SESSION.md` décrivait une V2 React alors que le runtime réel est HTML/JS modulaire
- Les commandes restent gérées en localStorage dans `js/modules/orders.js`
- Le stock reste géré en localStorage dans `js/modules/stock.js`
- Le chat reste géré en localStorage dans `js/modules/chat.js`
- Le calendrier reste géré en localStorage dans `js/modules/calendar.js`
- L'admin crée des utilisateurs localement alors que le login réel dépend de Supabase Auth
- Le changement de mot de passe admin/profil n'est pas réellement branché
- Les boutiques sont encore codées en dur dans `SHOPS`
- Les accès par boutique ne sont pas réellement appliqués
- L'ajout/suppression de boutiques par admin n'est pas en place
- Les photos dans le chat ne sont pas branchées dans l'UI finale

### Diagnostic global
- **Matière existante : oui**
- **Base exploitable pour reprise propre : oui**
- **Produit proprement terminé : non**
- **Fiable multi-utilisateur réel : non**

---

## Décision de reprise validée

### Ligne de conduite obligatoire
- **Ne pas lancer de réécriture React maintenant**.
- **Stabiliser et terminer proprement la base actuelle** avant toute réécriture éventuelle.
- Le problème principal n'est pas le framework.
- Le problème principal est **l'absence de source de vérité unique**.

### Source de vérité cible
- **Supabase devient la source de vérité métier unique**.
- `localStorage` doit être conservé uniquement pour des préférences locales non critiques si nécessaire.

---

## Planning officiel de reprise A → Z
> **Ce planning est le référentiel à suivre dans l'ordre.**
> Ne pas sauter d'étape sans raison clairement documentée dans ce fichier.

### A — Assainir le référentiel du repo
**Objectif** : remettre le dépôt en vérité avant de continuer.

À faire :
- Corriger `README.md`
- Corriger `SESSION.md`
- Corriger les descriptions de stack, d'état et de priorités
- Stopper toute confusion entre « React prévu » et « runtime réellement présent »

Résultat attendu :
- toute nouvelle IA comprend immédiatement le vrai projet
- plus de documentation mensongère ou obsolète

**Statut** : EN COURS

---

### B — Geler l'architecture actuelle et éviter la réécriture prématurée
**Objectif** : reprendre proprement sans repartir de zéro.

À faire :
- considérer l'architecture actuelle `index.html` + `js/` comme base officielle de reprise
- ne pas introduire de refonte framework tant que la logique métier n'est pas finalisée
- documenter cette règle dans chaque session

Résultat attendu :
- reprise rapide
- pas de dette créée par une réécriture inutile

**Statut** : À FAIRE

---

### C — Faire de Supabase la source de vérité métier unique
**Objectif** : supprimer l'hybride localStorage + Supabase.

À faire :
- charger les données métier depuis Supabase au boot
- arrêter de piloter les données critiques depuis `A` + `sv(...)`
- réserver `localStorage` au strict minimum non critique

Données concernées :
- commandes
- stock
- messages
- événements calendrier
- boutiques
- affectations utilisateur/boutique
- logs métier si conservés

Résultat attendu :
- une seule vérité
- comportement cohérent entre plusieurs utilisateurs

**Statut** : À FAIRE

---

### D — Reprendre le socle `state.js` / boot / render
**Objectif** : nettoyer le noyau applicatif.

À faire :
- revoir `js/state.js`
- distinguer clairement état UI local vs données métier distantes
- revoir le boot dans `index.html`
- ajouter un chargement initial fiable
- documenter ce qui reste local et ce qui vient du backend

Résultat attendu :
- noyau lisible
- moins de comportements implicites

**Statut** : À FAIRE

---

### E — Brancher réellement les commandes sur Supabase
**Objectif** : sortir `orders` du localStorage.

Fichiers clés :
- `js/modules/orders.js`
- `js/views/shop.js`
- `js/views/kitchen.js`
- `js/api/supabase.js`

À faire :
- création réelle d'une commande en base
- chargement réel des commandes
- mise à jour réelle des statuts
- réception réelle côté boutique
- cohérence boutique/cuisine sur les mêmes données
- utiliser realtime si utile

Résultat attendu :
- une commande créée par une boutique est visible et modifiable proprement côté cuisine

**Statut** : À FAIRE

---

### F — Brancher réellement le stock sur Supabase
**Objectif** : sortir `stock` du localStorage.

Fichiers clés :
- `js/modules/stock.js`
- `js/views/shop.js`
- `js/views/kitchen.js`
- `js/api/supabase.js`

À faire :
- stock cuisine en base
- stock boutique en base
- alertes calculées sur données réelles
- mouvements liés aux réceptions et commandes
- cohérence inter-utilisateurs

Résultat attendu :
- le stock ne dépend plus du navigateur local

**Statut** : À FAIRE

---

### G — Réparer l'admin utilisateurs pour qu'il soit vrai
**Objectif** : supprimer les faux flux admin.

Fichiers clés :
- `js/modules/admin.js`
- `js/views/admin.js`
- `js/auth.js`

À faire :
- création d'utilisateur via vrai flux Supabase Auth
- ajout de l'email dans le formulaire admin
- gestion réelle du rôle et du profil
- suppression propre des faux credentials locaux
- changement de mot de passe réellement branché

Résultat attendu :
- un utilisateur créé dans l'admin peut vraiment se connecter

**Statut** : À FAIRE

---

### H — Mettre en place les vraies boutiques dynamiques
**Objectif** : supprimer `SHOPS` hardcodé comme source de vérité métier.

Fichiers clés :
- `js/state.js`
- `js/views/select.js`
- `js/views/shop.js`
- `js/views/admin.js`
- `js/api/supabase.js`

À faire :
- charger les boutiques depuis la base
- permettre création / désactivation / suppression selon règles métier
- ne plus dépendre d'une liste codée en dur pour l'exploitation

Résultat attendu :
- les boutiques deviennent administrables

**Statut** : À FAIRE

---

### I — Mettre en place les droits réels par boutique
**Objectif** : arrêter l'accès implicite à toutes les boutiques.

Fichiers clés :
- `js/auth.js`
- `js/views/select.js`
- backend Supabase / tables d'affectation

À faire :
- table d'affectation user ↔ shop
- filtrage réel de la liste des espaces visibles
- accès cuisine/admin distincts
- suppression du `return true` provisoire dans les droits

Résultat attendu :
- chaque utilisateur ne voit que ce qu'il doit voir

**Statut** : À FAIRE

---

### J — Brancher réellement le chat sur Supabase
**Objectif** : sortir les messages du localStorage.

Fichiers clés :
- `js/modules/chat.js`
- `js/views/chat.js`
- `js/api/supabase.js`

À faire :
- chargement réel des conversations/messages
- envoi réel des messages
- lecture / non-lu cohérents
- realtime sur nouvelles conversations utiles

Résultat attendu :
- une vraie messagerie multi-utilisateur exploitable

**Statut** : À FAIRE

---

### K — Ajouter les photos dans la messagerie
**Objectif** : rendre opérationnelle la conversation avec médias.

Fichiers clés :
- `js/views/chat.js`
- `js/modules/chat.js`
- `js/api/supabase.js`

À faire :
- bouton d'upload image
- upload Supabase Storage
- envoi du message avec `photo_url`
- affichage des photos dans le fil
- règles simples de sécurité et de poids

Résultat attendu :
- possibilité d'échanger des photos utiles à l'exploitation

**Statut** : À FAIRE

---

### L — Brancher réellement le calendrier
**Objectif** : sortir `events` du localStorage.

Fichiers clés :
- `js/modules/calendar.js`
- vues calendrier
- `js/api/supabase.js`

À faire :
- créer / modifier / supprimer en base
- partager les événements utiles selon boutiques
- garder checklist / statut / PDF seulement si la base suit

Résultat attendu :
- calendrier fiable entre utilisateurs

**Statut** : À FAIRE

---

### M — Nettoyer les logs et la traçabilité
**Objectif** : rendre l'audit utile et sérieux.

À faire :
- distinguer logs UI, logs métier et logs sécurité
- décider ce qui reste local et ce qui doit être persistant
- ne pas laisser une fausse traçabilité purement locale si l'usage est multi-utilisateur

Résultat attendu :
- audit utile en exploitation

**Statut** : À FAIRE

---

### N — Recaler l'identité visuelle réelle vs l'identité cible
**Objectif** : remettre le produit en cohérence visuelle sans redéveloppement inutile.

Constat :
- l'ancien référentiel mentionnait Barlow Condensed + vert `#1B5E3B` + bannière jaune
- le runtime observé utilise Space Grotesk / Syne / Dancing Script avec une direction graphique plus marquée

À faire :
- décider si l'identité cible officielle reste l'ancienne ou si le runtime actuel devient la base officielle
- ne pas redesigner massivement sans décision claire
- documenter cette décision ici avant toute refonte visuelle

Résultat attendu :
- plus de contradiction entre le référentiel et l'interface réelle

**Statut** : À DÉCIDER APRÈS STABILISATION DATA

---

### O — Durcir la qualité produit avant nouvelles fonctions
**Objectif** : éviter d'empiler des features sur une base incohérente.

À faire :
- supprimer les écrans qui donnent une illusion de fonctionnalité finie si le backend n'est pas branché
- garder uniquement les flux vrais
- simplifier avant d'ajouter

Résultat attendu :
- moins de faux positif produit
- moins de confusion pour les utilisateurs

**Statut** : À FAIRE

---

## Ordre de travail recommandé par lots

### Lot 1 — Assainissement référentiel
- `README.md`
- `SESSION.md`
- cadrage stack / état réel

### Lot 2 — Socle technique
- `index.html`
- `js/state.js`
- `js/router.js`
- `js/utils.js`
- `js/api/supabase.js`

### Lot 3 — Commandes + stock
- `js/modules/orders.js`
- `js/modules/stock.js`
- `js/views/shop.js`
- `js/views/kitchen.js`

### Lot 4 — Auth + admin + accès
- `js/auth.js`
- `js/modules/admin.js`
- `js/views/admin.js`
- `js/views/login.js`
- `js/views/select.js`

### Lot 5 — Chat + photos
- `js/modules/chat.js`
- `js/views/chat.js`
- storage Supabase

### Lot 6 — Calendrier
- `js/modules/calendar.js`
- vues calendrier

---

## Règles de travail obligatoires pour les prochaines sessions
- Toujours lire ce fichier avant de reprendre.
- Toujours partir de l'état réel observé dans le code, jamais d'une hypothèse ancienne.
- Toujours distinguer :
  - ce qui est déjà vrai,
  - ce qui est partiellement branché,
  - ce qui est faux ou trompeur,
  - ce qui reste à faire.
- Toujours mettre à jour ce fichier à la fin d'une session importante.
- Ne jamais annoncer « fini » si la donnée métier vit encore uniquement dans `localStorage`.
- Ne jamais relancer une réécriture framework sans justification forte documentée ici.

---

## Dernière session
**Date** : 2026-04-21
**IA** : ChatGPT (GPT-5.4 Thinking)

### Tâches accomplies
- Audit du repo et du runtime réel
- Vérification des fichiers clés du produit
- Identification des écarts entre documentation et code réel
- Construction d'un planning de reprise A → Z
- Réécriture complète de ce `SESSION.md` comme référentiel officiel

### Décisions techniques prises
- Le runtime officiel de reprise est l'app actuelle HTML/JS modulaire
- Pas de réécriture React immédiate
- Supabase devient la source de vérité métier cible
- Le planning A → Z ci-dessus est le cadre de reprise officiel

### Fichiers inspectés pendant l'audit
- `SESSION.md`
- `README.md`
- `index.html`
- `css/base.css`
- `js/state.js`
- `js/utils.js`
- `js/router.js`
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

### Fichiers modifiés
| Fichier | Changement |
|---------|------------|
| `SESSION.md` | Réécriture complète avec état réel + planning officiel A → Z |

---

## Prochaine étape prioritaire
> **TODO #1** : terminer le lot A proprement en corrigeant aussi `README.md`, puis lancer le lot C/D pour sortir le cœur métier du `localStorage`.

---

## Contraintes métier importantes
- Application utilisée en réseau multi-utilisateurs simultanés
- Prévention des conflits d'écriture obligatoire
- Traçabilité des actions utile et honnête
- Pas de faux écrans finis
- Pas de confusion entre prototype local et système réellement partagé
- Ne pas inventer l'avancement : documenter uniquement ce qui est vérifié

---

## Historique des sessions
| Date | IA | Résumé |
|------|----|--------|
| 2026-04-21 | ChatGPT (GPT-5.4 Thinking) | Audit réel du repo, constat des incohérences, création du référentiel officiel de reprise A → Z dans `SESSION.md` |

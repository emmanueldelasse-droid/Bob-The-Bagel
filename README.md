# BOBtheBAGEL

Application interne de gestion logistique pour plusieurs boutiques reliées à une cuisine centrale.

## État réel du projet

Le dépôt contient aujourd'hui une application **statique `index.html` + modules JavaScript ES6**.
Ce n'est **pas** une base React.

Le projet est déjà **partiellement branché à Supabase** :
- authentification email / mot de passe,
- récupération du profil utilisateur,
- API prévues pour commandes, stock, boutiques, messages et upload photo,
- realtime partiel.

Mais le cœur métier reste encore **trop dépendant du `localStorage`**.
Donc l'application n'est **pas encore proprement fiable en multi-utilisateur réel**.

## Objectif produit

Permettre à trois types d'utilisateurs de travailler ensemble :
- **boutique** : passer des commandes, suivre son stock, confirmer les réceptions,
- **cuisine** : préparer, ajuster, valider et expédier,
- **admin** : gérer utilisateurs, produits, boutiques, accès et référentiel.

## Ce qui existe déjà

- écran de login,
- sélection d'espace,
- vue boutique,
- vue cuisine,
- vue admin,
- cycle de commande côté front,
- stock côté front,
- chat côté front,
- calendrier côté front,
- bannière admin,
- profil utilisateur.

## Problèmes connus

- une partie des données métier vit encore dans le navigateur,
- les commandes ne sont pas encore totalement branchées sur Supabase,
- le stock n'est pas encore totalement branché sur Supabase,
- le chat et le calendrier ne sont pas encore totalement branchés sur Supabase,
- l'admin utilisateurs n'est pas encore cohérent avec le vrai flux Supabase Auth,
- les boutiques sont encore en partie codées en dur,
- les droits par boutique ne sont pas encore réellement appliqués,
- l'upload photo existe côté API mais n'est pas encore finalisé dans l'UI du chat.

## Décision de reprise

La reprise officielle du projet suit cette ligne :
- **pas de réécriture React immédiate**, 
- stabiliser et terminer proprement la base actuelle,
- faire de **Supabase la source de vérité métier unique**,
- limiter `localStorage` aux préférences UI non critiques si nécessaire.

## Fichiers clés

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

## Référentiel de continuité

Le fichier **`SESSION.md`** est le référentiel officiel de reprise.
Toute IA ou toute reprise humaine doit le lire en premier.

Il contient :
- l'état réel du projet,
- la prochaine action à exécuter,
- le backlog d'amélioration vivant,
- les décisions techniques validées,
- les règles obligatoires de mise à jour.

## Priorité actuelle

Priorité actuelle : **sortir progressivement le cœur métier du `localStorage`**, en commençant par le socle (`state.js` / boot) puis les commandes.

## Important

Ce README décrit volontairement la **réalité actuelle** du projet.
Il ne doit pas vendre une version plus avancée qu'elle ne l'est vraiment.

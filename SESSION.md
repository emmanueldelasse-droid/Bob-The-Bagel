# SESSION – BOBtheBAGEL
> **Fichier de continuité de session — à lire en PREMIER à chaque nouvelle session IA**

---

## Métadonnées
| Champ | Valeur |
|-------|--------|
| **Dernière mise à jour** | À REMPLIR |
| **IA utilisée** | À REMPLIR (Claude / ChatGPT / Codex) |
| **Branche active** | main |
| **Repo GitHub** | emmanueldelasse-droid/BobTheBagel |
| **Déployé sur** | Vercel |

---

## Stack technique
- **Frontend** : React JSX (V2 — réécriture de V1)
- **Hébergement** : Vercel via GitHub (`emmanueldelasse-droid/BobTheBagel`)
- **État actuel backend** : Pas encore de backend réel — données en mémoire/mock
- **Identité visuelle** : Barlow Condensed, `#1B5E3B` vert, bannière jaune
- **Sync** : Polling optimiste (pas encore de WebSocket)

## Rôles utilisateurs
- `boutique` — passe commandes
- `cuisine` — prépare et valide
- `admin` — panel d'administration complet

## Fonctionnalités implémentées (V2)
- [x] Accès par rôle
- [x] UI optimiste avec sync par polling
- [x] Gestion du cycle de vie des commandes
- [x] Alertes de stock
- [x] Panel admin
- [ ] Backend persistant (PROCHAINE ÉTAPE MAJEURE)

---

## État actuel du projet
<!-- ✏️ À mettre à jour à chaque fin de session -->

### Ce qui fonctionne
- [ ] À compléter

### Ce qui est cassé / en cours
- [ ] À compléter

---

## Dernière session
<!-- ✏️ Écraser à chaque nouvelle fin de session -->

**Date** : À REMPLIR
**IA** : À REMPLIR

### Tâches accomplies
- 

### Décisions techniques prises
- 

### Fichiers modifiés
| Fichier | Changement |
|---------|------------|
| | |

---

## Prochaine étape prioritaire
<!-- ✏️ La chose la plus importante à faire au prochain démarrage -->

> **TODO #1** : Connecter un backend réel pour la persistance des données

**Options backend envisagées** :
- Supabase (déjà connecté en MCP)
- Cloudflare KV / D1
- Firebase

---

## Contraintes métier importantes
<!-- Ne pas oublier ces règles même en changeant d'IA -->

- Application utilisée en réseau multi-utilisateurs simultanés (plusieurs boutiques + cuisine en même temps)
- Prévention des conflits d'écriture obligatoire
- Traçabilité des actions (audit log) requise
- L'identité visuelle (vert `#1B5E3B`, jaune, Barlow Condensed) doit être préservée impérativement
- Ne JAMAIS redesigner l'interface — améliorer sans changer l'identité

---

## Historique des sessions

| Date | IA | Résumé |
|------|----|--------|
| | | |

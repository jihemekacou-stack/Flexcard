# FlexCard - Carte de visite digitale

## Description
FlexCard est une plateforme SaaS de cartes de visite digitales permettant aux utilisateurs de créer, personnaliser et partager leurs coordonnées via QR code, NFC ou lien direct.

## Architecture

### Frontend (React)
- `/app/frontend/src/index.js` - Point d'entrée, AuthProvider avec tokens Bearer
- `/app/frontend/src/App.js` - Pages principales (Landing, Login, Register)
- `/app/frontend/src/Dashboard.js` - Dashboard utilisateur avec actions rapides
- `/app/frontend/src/PublicProfile.js` - Pages de profil public (3 variantes)
- `/app/frontend/src/CardActivation.js` - Système QR code pour cartes physiques

### Backend (FastAPI + PostgreSQL/Supabase)
- `/app/backend/server.py` - API principale (Emergent)
- `/app/api/index.py` - API serverless pour Vercel
- `/app/backend/email_service.py` - Service email via Resend
- `/app/backend/supabase_db.py` - Opérations base de données

### Authentification
- **Système Bearer Token** (pas de cookies pour éviter les problèmes cross-origin)
- Token stocké dans `localStorage` et envoyé via header `Authorization: Bearer <token>`
- Intercepteur axios global pour ajouter le token automatiquement

## Déploiement Vercel

### Fichiers de Configuration
- `/app/vercel.json` - Configuration Vercel (rewrites, headers, functions)
- `/app/api/index.py` - API FastAPI serverless avec Mangum
- `/app/api/requirements.txt` - Dépendances Python pour Vercel
- `/app/VERCEL_DEPLOYMENT.md` - Guide de déploiement détaillé

### Variables d'Environnement Requises sur Vercel
```
SUPABASE_DB_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
SUPABASE_JWT_SECRET=xxx
RESEND_API_KEY=re_xxx
SENDER_EMAIL=FlexCard <contact@flexcardci.com>
FRONTEND_URL=https://www.flexcardci.com
```

## Fonctionnalités Implémentées

### Core
- [x] Inscription/Connexion avec email
- [x] Connexion Google OAuth (via Emergent Auth)
- [x] Dashboard avec statistiques
- [x] Édition de profil (photo, cover, informations)
- [x] Liens sociaux configurables
- [x] Téléchargement VCF avec photo
- [x] Mot de passe oublié avec email

### Système URL avec Card_ID
- [x] **URL de profil** : `/u/{username}/{card_id}`
- [x] **Validation du card_id** : Vérifie que le card_id est associé au bon profil
- [x] **Colonne public_url** : Stockée en base de données
- [x] **QR Code personnalisé** : Utilise l'URL avec card_id
- [x] **Design responsive** : Mobile/tablet/desktop

### Cartes Physiques
- [x] 200 cartes générées avec codes uniques (5 caractères)
- [x] Route `/c/{card_id}` pour scanner les cartes physiques
- [x] Page d'activation `/activate/{card_id}`
- [x] Endpoints API complets

### Dashboard Actions Rapides
- [x] "Voir ma carte" → Ouvre le profil avec URL incluant card_id
- [x] "Copier le lien" → Copie l'URL avec feedback visuel
- [x] "Partager" → Web Share API
- [x] "QR Code" → Télécharge le QR code PNG

### Corrections de Bugs
- [x] Bug de scintillement mobile (migration vers Bearer Token)
- [x] Liens de site web sans protocole (ajout automatique https://)
- [x] Favicon personnalisé

## Intégrations
- **Supabase** : Base de données PostgreSQL
- **Resend** : Emails transactionnels (domaine: flexcardci.com)
- **Emergent Auth** : Connexion Google OAuth

## Routes Frontend
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Page de connexion |
| `/register` | Page d'inscription |
| `/dashboard` | Dashboard utilisateur |
| `/u/:username/:cardId` | Profil public avec validation card_id |
| `/u/:username` | Profil public (sans card_id) |
| `/profile/:userId` | Profil public par user_id |
| `/c/:cardId` | Scanner QR code carte physique |
| `/activate/:cardId` | Page d'activation carte |

## À Faire
- [ ] Intégration Stripe pour paiements
- [ ] Mode équipe (dashboard admin)
- [ ] PWA pour accès offline
- [ ] Support multilingue
- [ ] Page Analytics complète avec graphiques
- [ ] Intégration NFC

## Historique des Modifications
- **13 Fév 2026**: Préparation déploiement Vercel
  - Création API serverless `/app/api/index.py`
  - Configuration `vercel.json`
  - Documentation `VERCEL_DEPLOYMENT.md`
- **9 Fév 2026**: Correction bug liens sans protocole
- **2 Fév 2026**: Ajout colonne `public_url` en base de données
- **30 Jan 2026**: URL de profil avec card_id, boutons dashboard fonctionnels
- **29 Jan 2026**: Migration vers Bearer Token, correction scintillement mobile

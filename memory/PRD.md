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
- `/app/backend/server.py` - API principale
- `/app/backend/email_service.py` - Service email via Resend
- `/app/backend/supabase_db.py` - Opérations base de données

### Authentification
- **Système Bearer Token** (pas de cookies pour éviter les problèmes cross-origin)
- Token stocké dans `localStorage` et envoyé via header `Authorization: Bearer <token>`
- Intercepteur axios global pour ajouter le token automatiquement

## Fonctionnalités Implémentées

### Core
- [x] Inscription/Connexion avec email
- [x] Connexion Google OAuth (via Emergent Auth)
- [x] Dashboard avec statistiques
- [x] Édition de profil (photo, cover, informations)
- [x] Liens sociaux configurables
- [x] Téléchargement VCF avec photo
- [x] Mot de passe oublié avec email

### Système URL avec Card_ID (30 Jan 2026)
- [x] **Nouvelle URL de profil** : `/u/{username}/{card_id}` (ex: `/u/kounapster/25PXK`)
- [x] **Validation du card_id** : Le système vérifie que le card_id est associé au bon profil
- [x] **3 états de la page** :
  1. **Profil valide** : Affiche le profil si username + card_id correspondent
  2. **Card_id invalide** : Message "Ce profil n'existe pas ou le code de carte est invalide"
  3. **Card_id non associé** : Message "Cette carte n'est pas associée à ce profil"
- [x] **QR Code personnalisé** : Le QR code dans le dashboard utilise l'URL avec card_id
- [x] **Lien de partage** : Contient automatiquement le card_id de l'utilisateur
- [x] **Design responsive** : Toutes les pages sont optimisées mobile/tablet/desktop

### Cartes Physiques
- [x] 200 cartes générées avec codes uniques (5 caractères, ex: D5H5T)
- [x] Route `/c/{card_id}` pour scanner les cartes physiques
- [x] Page d'activation `/activate/{card_id}`
- [x] Endpoint `POST /api/cards/generate` pour générer des cartes
- [x] Endpoint `GET /api/cards/{card_id}` pour vérifier le statut
- [x] Endpoint `POST /api/cards/{card_id}/activate` pour activer une carte
- [x] Endpoint `GET /api/public/{username}/card/{card_id}` pour valider profil + carte

### Dashboard Actions Rapides
- [x] "Voir ma carte" → Ouvre le profil avec URL incluant card_id
- [x] "Copier le lien" → Copie l'URL avec card_id et feedback visuel
- [x] "Partager" → Web Share API avec URL incluant card_id
- [x] "QR Code" → Télécharge le QR code avec URL incluant card_id

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

## API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/public/{username}/card/{card_id}` | Récupère profil avec validation card_id |
| `GET /api/public/{username}` | Récupère profil sans validation |
| `POST /api/cards/{card_id}/activate` | Active une carte pour l'utilisateur connecté |
| `GET /api/cards/{card_id}` | Vérifie le statut d'une carte |
| `GET /api/cards/user/my-cards` | Liste les cartes de l'utilisateur |

## À Faire
- [ ] Intégration Stripe pour paiements
- [ ] Mode équipe (dashboard admin)
- [ ] PWA pour accès offline
- [ ] Support multilingue
- [ ] Page Analytics complète avec graphiques
- [ ] Intégration NFC

## Historique des Modifications
- **30 Jan 2026**: 
  - URL de profil avec card_id `/u/{username}/{card_id}`
  - QR code et liens de partage utilisent automatiquement le card_id
  - Validation du card_id côté serveur
  - Messages d'erreur appropriés pour cards invalides/non associées
  - Design responsive complet
- **29 Jan 2026**: Correction bug de clignotement mobile, migration vers Bearer Token

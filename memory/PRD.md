# FlexCard - Carte de visite digitale

## Description
FlexCard est une plateforme SaaS de cartes de visite digitales permettant aux utilisateurs de créer, personnaliser et partager leurs coordonnées via QR code, NFC ou lien direct.

## Architecture

### Frontend (React)
- `/app/frontend/src/index.js` - Point d'entrée, AuthProvider avec tokens Bearer
- `/app/frontend/src/App.js` - Pages principales (Landing, Login, Register)
- `/app/frontend/src/Dashboard.js` - Dashboard utilisateur avec actions rapides
- `/app/frontend/src/PublicProfile.js` - Page de profil public
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
- [x] QR Code unique par utilisateur (basé sur user_id)
- [x] Page de profil public `/u/{username}` et `/profile/{user_id}`
- [x] Téléchargement VCF avec photo
- [x] Mot de passe oublié avec email

### Cartes Physiques (Nouveau - 30 Jan 2026)
- [x] Système QR code pour 200 cartes physiques
- [x] Route `/c/{card_id}` pour scanner les cartes
- [x] Page d'activation `/activate/{card_id}`
- [x] 3 états: Profil activé, Carte non activée, Carte invalide
- [x] Endpoint `POST /api/cards/generate` pour générer des cartes
- [x] Endpoint `GET /api/cards/{card_id}` pour vérifier le statut
- [x] Endpoint `POST /api/cards/{card_id}/activate` pour activer une carte

### Dashboard Actions Rapides (Nouveau - 30 Jan 2026)
- [x] "Voir ma carte" - Ouvre le profil dans un nouvel onglet
- [x] "Copier le lien" - Copie l'URL avec feedback visuel
- [x] "Partager" - Utilise Web Share API ou fallback copie
- [x] "QR Code" - Télécharge le QR code en PNG

## Intégrations
- **Supabase** : Base de données PostgreSQL
- **Resend** : Emails transactionnels (domaine: flexcardci.com)
- **Emergent Auth** : Connexion Google OAuth

## Données des Cartes Physiques
- 200 cartes générées (batch: initial_batch)
- Format du code: 5 caractères alphanumériques (ex: D5H5T)
- Caractères: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (sans 0/O, 1/I/L)

## À Faire
- [ ] Intégration Stripe pour paiements
- [ ] Mode équipe (dashboard admin)
- [ ] PWA pour accès offline
- [ ] Support multilingue
- [ ] Page Analytics complète avec graphiques
- [ ] Intégration NFC

## Historique des Modifications
- **30 Jan 2026**: Implémentation système QR code cartes physiques + boutons dashboard fonctionnels
- **29 Jan 2026**: Correction bug de clignotement mobile, migration vers Bearer Token

# FlexCard - Carte de visite digitale

## Description
FlexCard est une plateforme SaaS de cartes de visite digitales permettant aux utilisateurs de créer, personnaliser et partager leurs coordonnées via QR code, NFC ou lien direct.

## Architecture

### Frontend (React)
- `/app/frontend/src/index.js` - Point d'entrée, AuthProvider avec tokens Bearer
- `/app/frontend/src/App.js` - Pages principales (Landing, Login, Register)
- `/app/frontend/src/Dashboard.js` - Dashboard utilisateur
- `/app/frontend/src/PublicProfile.js` - Page de profil public

### Backend (FastAPI + PostgreSQL/Supabase)
- `/app/backend/server.py` - API principale
- `/app/backend/email_service.py` - Service email via Resend

### Authentification
- **Système Bearer Token** (pas de cookies pour éviter les problèmes cross-origin)
- Token stocké dans `localStorage` et envoyé via header `Authorization: Bearer <token>`
- Intercepteur axios global pour ajouter le token automatiquement

## Fonctionnalités Implémentées
- [x] Inscription/Connexion avec email
- [x] Dashboard avec statistiques
- [x] Édition de profil (photo, cover, informations)
- [x] Liens sociaux configurables
- [x] QR Code unique par utilisateur (basé sur user_id)
- [x] Page de profil public `/u/{username}` et `/profile/{user_id}`
- [x] Téléchargement VCF avec photo
- [x] Mot de passe oublié avec email
- [x] Activation de cartes physiques
- [x] Responsive mobile optimisé

## Corrections Récentes (30 Janvier 2026)
- [x] Bug de clignotement mobile corrigé
- [x] Migration vers authentification Bearer Token (au lieu de cookies)
- [x] Suppression de PostHog pour optimiser les performances
- [x] Suppression du badge "Made with Emergent"

## Intégrations
- **Supabase** : Base de données PostgreSQL
- **Resend** : Emails transactionnels (domaine: flexcardci.com)

## À Faire
- [ ] Intégration Stripe pour paiements
- [ ] Mode équipe (dashboard admin)
- [ ] PWA pour accès offline
- [ ] Support multilingue

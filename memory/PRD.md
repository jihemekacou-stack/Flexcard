# FlexCard - Digital Business Card Platform PRD

## Project Overview
FlexCard est une plateforme SaaS pour créer et partager des cartes de visite digitales avec QR code, support NFC, et profils personnalisables.

## Brand Colors
- Primary: #8645D6 (Violet)

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL) ✅ MIGRÉ le 26 Janvier 2026
- **Auth**: JWT + Google OAuth (Emergent Auth)
- **Images**: Stockage local, servi via `/api/uploads/`

## What's Been Implemented (January 2025-2026)

### Phase 1 - MVP Complete ✅
- [x] Landing page avec couleur violet #8645D6
- [x] Branding FlexCard avec logo personnalisé
- [x] Authentification (email/mot de passe + Google OAuth)
- [x] Dashboard utilisateur
- [x] Éditeur de profil (prénom, nom, titre, entreprise, bio)
- [x] Upload/suppression photo de profil (120px)
- [x] Upload/suppression image de couverture (150px)
- [x] Choix couleur de couverture
- [x] Gestion multiple emails avec labels
- [x] Gestion multiple téléphones avec labels et codes pays (drapeaux)
- [x] Liens réseaux sociaux avec vrais logos
- [x] Générateur QR Code (noir uniquement, pas d'options de couleur)
- [x] Page profil public (/u/username) avec avatar/cover centrés

### Phase 2 - Cartes Physiques ✅
- [x] Génération de cartes physiques avec ID unique (FC...)
- [x] API /api/cards/generate - Générer des cartes
- [x] API /api/cards/{cardId} - Vérifier le status d'une carte
- [x] Route /c/{cardId} - Redirection QR code
- [x] Route /activate/{cardId} - Page d'activation
- [x] API /api/cards/{cardId}/activate - Activer une carte
- [x] API /api/cards/user/my-cards - Cartes de l'utilisateur
- [x] Flux d'activation: scan QR → connexion/inscription → liaison profil

### Phase 3 - Commandes & Gestion ✅
- [x] **Formulaire de commande Pro/Elite** avec envoi WhatsApp au +2250100640854
- [x] **Formule Elite mise à jour**: "Personnalisation de la carte complète"
- [x] **Bouton Supprimer ma carte** dans Paramètres avec confirmation
- [x] **Modification des liens existants** (icône crayon)
- [x] **WhatsApp: numéro au lieu d'URL** - Champ téléphone dédié
- [x] **Profil public amélioré** - Affiche titre + plateforme, pas l'URL

### Phase 4 - Migration Supabase ✅ (26 Janvier 2026)
- [x] Configuration projet Supabase avec tables et RLS
- [x] Migration des données de MongoDB vers PostgreSQL
- [x] Refactorisation complète du backend server.py
- [x] Module supabase_db.py avec opérations CRUD
- [x] Compatibilité pgbouncer (statement_cache_size=0)
- [x] Parsing JSON pour emails/phones
- [x] Tests complets passés (20/20 backend, 100% frontend)

## Bug Fixes (2026)
- [x] **CRITIQUE**: Bug d'upload d'images corrigé (route `/api/uploads/`)
- [x] QR Code: Toujours noir (#000000) sur fond blanc
- [x] Profil public: Avatar et nom correctement centrés
- [x] pgbouncer: Erreur prepared statements corrigée
- [x] JSON parsing: emails/phones convertis en listes Python

## Pricing Plans

### Pro - 15 000 FCFA
- 1 carte physique NFC + QR
- Profil digital personnalisé
- Liens illimités
- Analytics complets
- Support prioritaire
- Mises à jour gratuites

### Elite - 20 000 FCFA
- Tout du plan Pro
- Design premium personnalisé
- **Personnalisation de la carte complète**
- Support VIP 24/7
- Fonctionnalités exclusives
- Accès anticipé nouveautés

## WhatsApp Order System
- Numéro de commande: **+2250100640854**
- Formulaire: Nom, Téléphone, Email, Adresse, Ville, Notes
- Message formaté automatiquement envoyé via WhatsApp

## Physical Card System

### Fonctionnement
1. Les cartes sont générées avec un ID unique (ex: FC1A2B3C4D)
2. Chaque carte physique a un QR code imprimé pointant vers /c/{cardId}
3. Quand quelqu'un scanne le QR:
   - Si la carte n'est pas activée → redirect vers /activate/{cardId}
   - Si la carte est activée → redirect vers le profil /u/{username}
4. Sur la page d'activation:
   - L'utilisateur se connecte ou crée un compte
   - La carte est liée à son profil
   - Les futurs scans redirigent directement vers son profil

### API Endpoints

#### Cartes Physiques
- `POST /api/cards/generate?count=10&batch_name=...` - Générer des cartes
- `GET /api/cards/{cardId}` - Status de la carte
- `POST /api/cards/{cardId}/activate` - Activer (auth requise)
- `GET /api/cards/user/my-cards` - Mes cartes (auth requise)
- `DELETE /api/cards/{cardId}/unlink` - Délier une carte (auth requise)

#### Images
- `POST /api/upload/avatar` - Upload photo de profil (base64)
- `DELETE /api/upload/avatar` - Supprimer photo de profil
- `POST /api/upload/cover` - Upload image de couverture (base64)
- `DELETE /api/upload/cover` - Supprimer image de couverture
- Images servies via `GET /api/uploads/{filename}`

#### Profil
- `GET /api/profile` - Obtenir mon profil
- `PUT /api/profile` - Mettre à jour mon profil
- `PUT /api/profile/username` - Changer mon username
- `DELETE /api/profile` - **Supprimer mon compte et toutes mes données**

#### Liens
- `GET /api/links` - Mes liens
- `POST /api/links` - Créer un lien
- `PUT /api/links/{link_id}` - **Modifier un lien**
- `DELETE /api/links/{link_id}` - Supprimer un lien

## Database Schema (Supabase PostgreSQL)

### Tables
- **users**: user_id, email, name, password, auth_type, google_id, picture, created_at, updated_at
- **profiles**: profile_id, user_id, username, first_name, last_name, title, company, bio, location, website, emails (JSON), phones (JSON), avatar, cover_image, cover_type, cover_color, views, created_at, updated_at
- **links**: link_id, profile_id, type, platform, url, title, clicks, position, is_active, created_at
- **contacts**: contact_id, profile_id, name, email, phone, message, created_at
- **analytics**: id, profile_id, event_type, referrer, timestamp
- **physical_cards**: card_id, user_id, profile_id, status, batch_name, activated_at, created_at
- **user_sessions**: session_id, user_id, token, created_at, expires_at

### Row Level Security (RLS)
- Toutes les tables ont des policies RLS activées
- Les utilisateurs peuvent voir leurs propres données via le dashboard Supabase

## Assets
- Logo: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/piv4nx35_PP.jpg
- Favicon: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/peu7e95f_Favicon-01.png

## Test Accounts
- Test user: `testsupabase1769416346@test.com` / `test123`
- Demo profile: `/u/demo`
- Nouveaux comptes: Créer via `/register`

## Next Action Items (P1)
1. **Corriger les liens non-réactifs sur mobile** - Les clics sur les liens sociaux ne fonctionnent pas bien
2. **Intégration Stripe** pour paiements automatisés (optionnel - WhatsApp fonctionne)
3. **Mode équipe/Business** - Dashboard admin pour gérer les membres

## Future Tasks (P2)
1. Intégration NFC complète
2. Page analytique complète avec graphiques
3. PWA pour accès offline
4. Support multilingue (EN, ES, DE)
5. Générateur de signature email
6. Statistiques détaillées par carte physique

# FlexCard - Digital Business Card Platform PRD

## Project Overview
FlexCard est une plateforme SaaS pour créer et partager des cartes de visite digitales avec QR code, support NFC, et profils personnalisables.

## Brand Colors
- Primary: #8645D6 (Violet)

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT + Google OAuth (Emergent Auth)
- **Images**: Stockage local, servi via `/api/uploads/`

## What's Been Implemented (January 2025)

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

### Bug Fixes (20 Janvier 2026)
- [x] **CRITIQUE**: Corrigé bug d'upload d'images - les images s'affichent maintenant correctement
  - Cause: Les fichiers `/uploads/` étaient interceptés par le router frontend
  - Solution: Changé la route à `/api/uploads/` pour passer par le proxy API
  - Support rétrocompatible des anciens chemins `/uploads/`
- [x] QR Code: Supprimé les options de couleur - maintenant toujours noir (#000000) sur fond blanc
- [x] Profil public: Avatar et nom sont correctement centrés

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

### API Endpoints Cartes Physiques
- `POST /api/cards/generate?count=10&batch_name=...` - Générer des cartes
- `GET /api/cards/{cardId}` - Status de la carte
- `POST /api/cards/{cardId}/activate` - Activer (auth requise)
- `GET /api/cards/user/my-cards` - Mes cartes (auth requise)
- `DELETE /api/cards/{cardId}/unlink` - Délier une carte (auth requise)

### API Endpoints Images
- `POST /api/upload/avatar` - Upload photo de profil (base64)
- `DELETE /api/upload/avatar` - Supprimer photo de profil
- `POST /api/upload/cover` - Upload image de couverture (base64)
- `DELETE /api/upload/cover` - Supprimer image de couverture
- Images servies via `GET /api/uploads/{filename}`

## Assets
- Logo: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/piv4nx35_PP.jpg
- Favicon: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/peu7e95f_Favicon-01.png

## Test Accounts
- Profiles avec images: `/u/jihemekacou` (avatar), `/u/kounapster` (avatar + cover)
- Nouveaux comptes: Créer via `/register`

## Next Action Items (P1)
1. **Intégration Stripe** pour achat de plans Pro (15,000 Fr) et Elite (20,000 Fr)
2. **Mode équipe/Business** - Dashboard admin pour gérer les membres
3. Statistiques détaillées par carte physique

## Future Tasks (P2)
1. Intégration NFC
2. Page analytique complète avec graphiques
3. PWA pour accès offline
4. Support multilingue (EN, ES, DE)
5. Générateur de signature email

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
- **Images**: Stockage local (/uploads)

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
- [x] Gestion multiple téléphones avec labels
- [x] Liens réseaux sociaux avec vrais logos
- [x] Générateur QR Code personnalisable
- [x] Page profil public (/u/username)

### Phase 2 - Cartes Physiques ✅
- [x] Génération de cartes physiques avec ID unique (FC...)
- [x] API /api/cards/generate - Générer des cartes
- [x] API /api/cards/{cardId} - Vérifier le status d'une carte
- [x] Route /c/{cardId} - Redirection QR code
- [x] Route /activate/{cardId} - Page d'activation
- [x] API /api/cards/{cardId}/activate - Activer une carte
- [x] API /api/cards/user/my-cards - Cartes de l'utilisateur
- [x] Flux d'activation: scan QR → connexion/inscription → liaison profil

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

## Assets
- Logo: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/piv4nx35_PP.jpg
- Favicon: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/peu7e95f_Favicon-01.png

## Next Action Items
1. Interface admin pour générer et gérer les lots de cartes
2. Dashboard pour voir toutes ses cartes physiques liées
3. Possibilité de transférer une carte à un autre utilisateur
4. Intégration Stripe pour achat de cartes physiques
5. Statistiques par carte physique

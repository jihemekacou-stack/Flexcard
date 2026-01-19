# FlexCard - Digital Business Card Platform PRD

## Project Overview
FlexCard est une plateforme SaaS pour créer et partager des cartes de visite digitales avec QR code, support NFC, et profils personnalisables.

## Original Problem Statement
Créer une plateforme SaaS complète de cartes de visite digitales avec NFC/QR, incluant un site vitrine moderne, un système d'authentification, un back-office complet pour les utilisateurs, et des profils publics personnalisables.

## User Personas
1. **Professionnels**: Entrepreneurs, consultants, freelances
2. **Équipes commerciales**: Entreprises avec équipes de vente
3. **Créatifs**: Designers, artistes avec portfolios

## Core Requirements (Static)
- Landing page moderne avec animations
- Authentification (Email/Mot de passe + Google OAuth)
- Dashboard avec analytics
- Éditeur de carte (prénom/nom, infos perso, réseaux sociaux)
- Profils publics (/u/username)
- Générateur QR code
- Upload d'images (avatar + cover)
- Formulaire de contact et capture de leads
- Analytics (vues, clics, contacts)

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: JWT + Google OAuth (Emergent Auth)
- **Images**: Stockage local (/uploads)

## What's Been Implemented (January 2025)

### Phase 1 - MVP Complete ✅
- [x] Landing page avec hero, fonctionnalités, tarifs, FAQ
- [x] Branding FlexCard avec logo personnalisé
- [x] Inscription email/mot de passe
- [x] Google OAuth (Emergent Auth)
- [x] Dashboard avec navigation sidebar
- [x] Éditeur de profil (prénom, nom, titre, entreprise, bio)
- [x] Upload/suppression photo de profil (120px / ~12cm)
- [x] Upload/suppression image de couverture (150px / ~15cm)
- [x] Choix couleur de couverture
- [x] Gestion multiple emails avec labels
- [x] Gestion multiple téléphones avec labels
- [x] Liens réseaux sociaux avec vrais logos:
  - LinkedIn, Instagram, Facebook, Twitter/X
  - TikTok, YouTube, GitHub, WhatsApp
  - Telegram, Pinterest, Twitch, Discord
  - Spotify, Behance, Dribbble, Snapchat
- [x] Générateur QR Code personnalisable
- [x] Page profil public (/u/username)
- [x] Avatar 120px centré + Cover 150px
- [x] Téléchargement vCard
- [x] Formulaire de contact
- [x] Suivi des clics sur liens
- [x] Analytics de base

### P1 (Priorité haute - À venir)
- [ ] Drag & drop pour réordonner les liens
- [ ] Notifications email nouveaux contacts
- [ ] Templates de design multiples
- [ ] Mode sombre

### P2 (Priorité moyenne)
- [ ] Intégration Stripe pour abonnements Pro
- [ ] Export contacts CSV
- [ ] Générateur signature email
- [ ] Domaines personnalisés

## API Endpoints
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/session` - OAuth session
- `GET /api/auth/me` - Utilisateur actuel
- `POST /api/auth/logout` - Déconnexion
- `GET /api/profile` - Profil utilisateur
- `PUT /api/profile` - MAJ profil
- `PUT /api/profile/username` - MAJ username
- `POST /api/upload/avatar` - Upload avatar (base64)
- `DELETE /api/upload/avatar` - Supprimer avatar
- `POST /api/upload/cover` - Upload cover (base64)
- `DELETE /api/upload/cover` - Supprimer cover
- `GET /api/links` - Liens utilisateur
- `POST /api/links` - Créer lien
- `PUT /api/links/{id}` - MAJ lien
- `DELETE /api/links/{id}` - Supprimer lien
- `GET /api/contacts` - Contacts collectés
- `GET /api/analytics` - Analytics
- `GET /api/public/{username}` - Profil public
- `POST /api/public/{username}/click/{link_id}` - Enregistrer clic
- `POST /api/public/{username}/contact` - Soumettre contact

## Assets
- Logo: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/piv4nx35_PP.jpg
- Favicon: https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/peu7e95f_Favicon-01.png

## Next Action Items
1. Ajouter drag & drop pour réordonner les liens
2. Implémenter notifications email pour nouveaux contacts
3. Créer templates de design additionnels
4. Ajouter mode sombre/clair toggle
5. Intégrer Stripe pour abonnements Pro

# FlexCard - Digital Business Card Platform PRD

## Project Overview
FlexCard est une plateforme SaaS pour créer et partager des cartes de visite digitales avec QR code, support NFC, et profils personnalisables.

## Brand Colors
- Primary: #8645D6 (Violet)

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT sessions + Google OAuth (Emergent Auth)
- **Email**: Resend (transactional emails)
- **Images**: Stockage local, servi via `/api/uploads/`

## What's Been Implemented (January 2026)

### Phase 1 - MVP Complete ✅
- [x] Landing page avec couleur violet #8645D6
- [x] Branding FlexCard avec logo personnalisé
- [x] Dashboard utilisateur
- [x] Éditeur de profil (prénom, nom, titre, entreprise, bio)
- [x] Upload/suppression photo de profil
- [x] Upload/suppression image de couverture
- [x] Gestion multiple emails et téléphones avec labels
- [x] Liens réseaux sociaux avec vrais logos
- [x] Générateur QR Code
- [x] Page profil public (/u/username)

### Phase 2 - Cartes Physiques ✅
- [x] Génération de cartes physiques avec ID unique (5 caractères)
- [x] Système d'activation par code
- [x] Popup d'activation quand clic sur "Ma carte" sans carte

### Phase 3 - Service Email (Resend) ✅ (26 Janvier 2026)
- [x] **Intégration Resend** - Service email transactionnel
- [x] **Email de bienvenue** - Envoyé à l'inscription
- [x] **Mot de passe oublié** - Lien de réinitialisation par email
- [x] **Templates email** - Design aux couleurs FlexCard (violet)
- [x] **Page réinitialisation** - /auth/reset-password?token=xxx
- [x] **Lien "Mot de passe oublié"** - Positionné SOUS le champ mot de passe

### Corrections de bugs (26 Janvier 2026)
- [x] CORS corrigé pour permettre les credentials
- [x] Liens sociaux normalisés avec https://
- [x] VCF avec photo de profil
- [x] Position du lien "Mot de passe oublié" corrigée

## Pricing Plans

### Pro - 15 000 FCFA
- 1 carte physique NFC + QR
- Profil digital personnalisé
- Liens illimités
- Analytics complets
- Support prioritaire

### Elite - 20 000 FCFA
- Tout du plan Pro
- Design premium personnalisé
- Personnalisation de la carte complète
- Support VIP 24/7

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription (envoie email de bienvenue)
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/forgot-password` - Demande réinitialisation (envoie email)
- `POST /api/auth/reset-password` - Réinitialise le mot de passe avec token
- `POST /api/auth/verify-email` - Vérifie l'email avec token

### Cartes Physiques
- `POST /api/cards/generate` - Générer des cartes
- `GET /api/cards/{cardId}` - Status de la carte
- `POST /api/cards/{cardId}/activate` - Activer une carte

### Profil
- `GET /api/profile` - Mon profil
- `PUT /api/profile` - Mettre à jour
- `DELETE /api/profile` - Supprimer compte

### Liens
- `GET /api/links` - Mes liens
- `POST /api/links` - Créer (URLs normalisées avec https://)
- `PUT /api/links/{link_id}` - Modifier
- `DELETE /api/links/{link_id}` - Supprimer

## Configuration Resend

### Variables d'environnement Backend (.env)
```
RESEND_API_KEY=re_xxxxxxxx
SENDER_EMAIL=FlexCard <onboarding@resend.dev>
FRONTEND_URL=https://cardlink-9.preview.emergentagent.com
```

### Limitations mode test
- Resend nécessite un domaine vérifié pour envoyer à des tiers
- En mode test, seul l'email du propriétaire peut recevoir
- Pour la production: vérifier un domaine dans Resend Dashboard

## Database Schema

### Tables
- **users**: user_id, email, name, password, auth_type, email_verified, supabase_user_id
- **profiles**: profile_id, user_id, username, first_name, last_name, etc.
- **links**: link_id, profile_id, type, platform, url, title, clicks
- **password_reset_tokens**: user_id, token, expires_at, used
- **email_verification_tokens**: user_id, token, expires_at, used
- **physical_cards**: card_id, user_id, profile_id, status

## Test Accounts
- Demo profile: `/u/demo` (Aminata Koné)
- Test user: `testlogin@flexcard.co` / `password123`

## Next Action Items (P1)
1. **Vérifier domaine Resend** - Pour envoyer des emails à tous les utilisateurs
2. **Intégration Stripe** - Paiements automatisés
3. **Mode équipe/Business** - Dashboard admin

## Future Tasks (P2)
1. Intégration NFC complète
2. Page analytique avec graphiques
3. PWA pour accès offline
4. Support multilingue

## Notes pour production
- Vérifier un domaine dans Resend pour l'envoi d'emails
- Configurer Google OAuth dans Emergent Auth si besoin
- Mettre à jour FRONTEND_URL dans .env

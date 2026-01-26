# FlexCard - Digital Business Card Platform PRD

## Project Overview
FlexCard est une plateforme SaaS pour créer et partager des cartes de visite digitales avec QR code, support NFC, et profils personnalisables.

## Brand Colors
- Primary: #8645D6 (Violet)

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + @supabase/supabase-js
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password + Google OAuth) ✅ INTÉGRÉ
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

### Phase 3 - Authentification Supabase ✅ (26 Janvier 2026)
- [x] **Inscription avec email** - Envoi automatique d'email de confirmation par Supabase
- [x] **Connexion avec email/mot de passe** - Via Supabase Auth
- [x] **Mot de passe oublié** - Email de réinitialisation envoyé par Supabase
- [x] **Page de réinitialisation** - /auth/reset-password
- [x] **Page de confirmation email** - /auth/confirm
- [x] **OAuth Google** - Configuration prête (nécessite activation dans Supabase Dashboard)
- [x] **Synchronisation utilisateurs** - Les nouveaux utilisateurs Supabase sont synchronisés avec notre table users
- [x] **Session persistante** - L'utilisateur reste connecté grâce à Supabase

### Fonctionnalités Email (Supabase - GRATUIT)
- ✅ Email de confirmation d'inscription
- ✅ Email de réinitialisation de mot de passe
- ✅ Email de changement d'email
- ⚠️ Note: Les adresses @test.com sont rejetées par Supabase (validation anti-spam)

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

### Authentification (Supabase)
- `POST /api/auth/supabase-sync` - Synchronise un utilisateur Supabase avec notre base
- `GET /api/auth/me` - Utilisateur courant (supporte JWT Supabase)
- `POST /api/auth/logout` - Déconnexion

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

## Database Schema

### Tables
- **users**: user_id, supabase_user_id (NEW), email, name, auth_type, created_at
- **profiles**: profile_id, user_id, username, first_name, last_name, title, company, bio, etc.
- **links**: link_id, profile_id, type, platform, url, title, clicks
- **contacts**: contact_id, profile_id, name, email, phone, message
- **analytics**: profile_id, event_type, timestamp
- **physical_cards**: card_id, user_id, profile_id, status
- **user_sessions**: session_id, user_id, token

## Configuration Supabase

### Variables d'environnement Frontend (.env)
```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

### Variables d'environnement Backend (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_JWT_SECRET=xxx
SUPABASE_DB_URL=postgresql://...
```

### Pour activer Google OAuth
1. Aller dans Supabase Dashboard > Authentication > Providers
2. Activer Google
3. Ajouter les Client ID et Secret de Google Cloud Console
4. Configurer les URLs de redirection

## Test Accounts
- Demo profile: `/u/demo` (Aminata Koné)
- Nouveaux comptes: Créer via `/register` avec une vraie adresse email

## Next Action Items (P1)
1. **Configurer Google OAuth dans Supabase Dashboard** - Pour activer la connexion Google
2. **Personnaliser les templates d'email Supabase** - Pour les mettre en français et aux couleurs FlexCard
3. **Intégration Stripe** - Paiements automatisés

## Future Tasks (P2)
1. Mode équipe/Business
2. Intégration NFC complète
3. Page analytique avec graphiques
4. PWA pour accès offline
5. Support multilingue

## Notes Importantes
- L'authentification utilise maintenant Supabase Auth (gratuit)
- Les emails sont envoyés automatiquement par Supabase
- Les adresses email de test (@test.com) sont rejetées - utiliser de vraies adresses
- La colonne `supabase_user_id` a été ajoutée pour lier les utilisateurs

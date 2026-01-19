# TapCard - Digital Business Card Platform PRD

## Project Overview
TapCard is a SaaS platform for creating and sharing digital business cards with QR code, NFC support, and customizable profiles.

## Original Problem Statement
Créer une plateforme SaaS complète de cartes de visite digitales avec NFC/QR, incluant un site vitrine moderne, un système d'authentification, un back-office complet pour les utilisateurs, et des profils publics personnalisables.

## User Personas
1. **Professional Users**: Entrepreneurs, consultants, freelancers wanting to modernize their networking
2. **Sales Teams**: Businesses wanting digital cards for their sales teams
3. **Creative Professionals**: Designers, artists wanting to showcase portfolios

## Core Requirements (Static)
- Modern landing page with animations
- User authentication (Email/Password + Google OAuth)
- Dashboard with analytics
- Card editor (personal info, social links, quick actions)
- Public profile pages (/u/username)
- QR code generator with customization
- Contact form and lead capture
- Analytics tracking (views, clicks, contacts)

## Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Google OAuth (Emergent Auth)

## What's Been Implemented (January 2025)

### MVP Phase 1 - Complete ✅
- [x] Landing page with hero, features, pricing, FAQ, testimonials
- [x] User registration with email/password
- [x] User login with email/password  
- [x] Google OAuth integration (Emergent Auth)
- [x] Protected dashboard with sidebar navigation
- [x] Profile editor (personal info, contact details)
- [x] Social links management (add, edit, delete, reorder)
- [x] QR code generator with color customization
- [x] Analytics dashboard (views, clicks, contacts)
- [x] Settings page (username change)
- [x] Public profile page (/u/username)
- [x] vCard download functionality
- [x] Contact form on public profiles
- [x] Click tracking on links
- [x] View tracking on profiles
- [x] Responsive mobile-first design
- [x] Modern UI with gradients and animations

## Prioritized Backlog

### P0 (Critical for Launch)
- [x] Core card creation flow - DONE
- [x] Public profile sharing - DONE
- [x] QR code generation - DONE

### P1 (High Priority)
- [ ] Avatar/image upload functionality
- [ ] Theme customization (colors, fonts)
- [ ] Email notifications for new contacts
- [ ] Drag & drop link reordering
- [ ] Multiple card templates

### P2 (Medium Priority)
- [ ] Stripe payment integration for Pro plans
- [ ] Team/organization management
- [ ] Export contacts to CSV
- [ ] Email signature generator
- [ ] Custom domain support

### P3 (Nice to Have)
- [ ] NFC card ordering integration
- [ ] API access for developers
- [ ] White-label solution
- [ ] Advanced analytics (geo, devices)
- [ ] A/B testing for profiles

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/session` - OAuth session exchange
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/username` - Update username
- `GET /api/links` - Get user links
- `POST /api/links` - Create link
- `PUT /api/links/{id}` - Update link
- `DELETE /api/links/{id}` - Delete link
- `GET /api/contacts` - Get collected contacts
- `GET /api/analytics` - Get analytics data
- `GET /api/public/{username}` - Get public profile
- `POST /api/public/{username}/click/{link_id}` - Record click
- `POST /api/public/{username}/contact` - Submit contact form

## Next Action Items
1. Add image upload for avatars
2. Implement drag & drop for link reordering
3. Add more social platform options
4. Create multiple card templates
5. Add email notifications

# FlexCard - Déploiement Vercel

## Prérequis

1. Un compte [Vercel](https://vercel.com)
2. Une base de données [Supabase](https://supabase.com) configurée
3. Un compte [Resend](https://resend.com) pour les emails

## Configuration de la Base de Données Supabase

Avant le déploiement, assurez-vous que les tables suivantes existent dans Supabase :

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255),
    auth_type VARCHAR(50) DEFAULT 'email',
    google_id VARCHAR(255),
    picture TEXT,
    supabase_user_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    profile_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    title VARCHAR(255),
    company VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    emails JSONB DEFAULT '[]',
    phones JSONB DEFAULT '[]',
    avatar TEXT,
    cover_image TEXT,
    cover_type VARCHAR(50) DEFAULT 'color',
    cover_color VARCHAR(50) DEFAULT '#8645D6',
    public_url TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    link_id VARCHAR(255) UNIQUE NOT NULL,
    profile_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'social',
    platform VARCHAR(100),
    url TEXT,
    title VARCHAR(255),
    clicks INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Physical cards table
CREATE TABLE IF NOT EXISTS physical_cards (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(10) UNIQUE NOT NULL,
    batch_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'unactivated',
    user_id VARCHAR(255),
    profile_id VARCHAR(255),
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    contact_id VARCHAR(255) UNIQUE NOT NULL,
    profile_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    message TEXT,
    source VARCHAR(50) DEFAULT 'form',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    profile_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50),
    referrer TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Déploiement sur Vercel

### Option 1: Via l'interface Vercel

1. Connectez votre repository GitHub à Vercel
2. Sélectionnez le projet et cliquez sur "Deploy"
3. Configurez les variables d'environnement (voir ci-dessous)

### Option 2: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Variables d'Environnement

Configurez ces variables dans le dashboard Vercel (Settings > Environment Variables) :

### Variables Backend (API)

| Variable | Description |
|----------|-------------|
| `SUPABASE_DB_URL` | URL de connexion PostgreSQL Supabase |
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service Supabase |
| `SUPABASE_JWT_SECRET` | Secret JWT Supabase |
| `RESEND_API_KEY` | Clé API Resend |
| `SENDER_EMAIL` | Email d'envoi (ex: FlexCard <contact@domain.com>) |
| `FRONTEND_URL` | URL du frontend (votre domaine Vercel) |

### Variables Frontend

| Variable | Description |
|----------|-------------|
| `REACT_APP_BACKEND_URL` | Laisser vide (sera relatif) |
| `REACT_APP_SUPABASE_URL` | URL de votre projet Supabase |
| `REACT_APP_SUPABASE_ANON_KEY` | Clé anonyme Supabase |

## Structure du Projet

```
/
├── api/
│   ├── index.py          # API FastAPI serverless
│   └── requirements.txt  # Dépendances Python
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── vercel.json           # Configuration Vercel
└── .env.example          # Variables d'environnement exemple
```

## Domaine Personnalisé

1. Dans Vercel Dashboard > Settings > Domains
2. Ajoutez votre domaine (ex: flexcardci.com)
3. Configurez les DNS chez votre registrar :
   - Type A: `76.76.21.21`
   - Type CNAME: `cname.vercel-dns.com`

## Dépannage

### L'API retourne des erreurs 500
- Vérifiez que `SUPABASE_DB_URL` est correct
- Vérifiez les logs dans Vercel Dashboard > Deployments > Logs

### Les emails ne s'envoient pas
- Vérifiez que `RESEND_API_KEY` est configuré
- Vérifiez que le domaine d'envoi est vérifié dans Resend

### Le frontend ne charge pas
- Vérifiez que le build React réussit
- Consultez les logs de build dans Vercel

"""
Supabase Database Connection Module
"""
import os
import asyncpg
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from contextlib import asynccontextmanager

# Database URL from environment
DATABASE_URL = os.environ.get("SUPABASE_DB_URL", "")

# Connection pool
_pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    """Get or create the connection pool"""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
    return _pool

async def close_pool():
    """Close the connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

@asynccontextmanager
async def get_connection():
    """Get a connection from the pool"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn

# ==================== USER OPERATIONS ====================

async def create_user(user_id: str, email: str, name: str, password: str = None, 
                      auth_type: str = "email", google_id: str = None, picture: str = None) -> Dict:
    """Create a new user"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO users (user_id, email, name, password, auth_type, google_id, picture, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
            ON CONFLICT (email) DO NOTHING
        """, user_id, email, name, password, auth_type, google_id, picture, datetime.now(timezone.utc))
        
        return await get_user_by_email(email)

async def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return dict(row) if row else None

async def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
        return dict(row) if row else None

async def delete_user(user_id: str) -> bool:
    """Delete a user"""
    async with get_connection() as conn:
        result = await conn.execute("DELETE FROM users WHERE user_id = $1", user_id)
        return "DELETE 1" in result

# ==================== SESSION OPERATIONS ====================

async def create_session(session_id: str, user_id: str, token: str, expires_at: datetime) -> Dict:
    """Create a new session"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO user_sessions (session_id, user_id, token, created_at, expires_at)
            VALUES ($1, $2, $3, $4, $5)
        """, session_id, user_id, token, datetime.now(timezone.utc), expires_at)
        return {"session_id": session_id, "user_id": user_id, "token": token}

async def get_session_by_token(token: str) -> Optional[Dict]:
    """Get session by token"""
    async with get_connection() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM user_sessions WHERE token = $1 AND expires_at > $2
        """, token, datetime.now(timezone.utc))
        return dict(row) if row else None

async def delete_session(token: str) -> bool:
    """Delete a session"""
    async with get_connection() as conn:
        result = await conn.execute("DELETE FROM user_sessions WHERE token = $1", token)
        return "DELETE 1" in result

async def delete_user_sessions(user_id: str) -> bool:
    """Delete all sessions for a user"""
    async with get_connection() as conn:
        await conn.execute("DELETE FROM user_sessions WHERE user_id = $1", user_id)
        return True

# ==================== PROFILE OPERATIONS ====================

async def create_profile(profile_data: Dict) -> Dict:
    """Create a new profile"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO profiles (
                profile_id, user_id, username, first_name, last_name, title, company,
                bio, location, website, emails, phones, avatar, cover_image, cover_type,
                cover_color, views, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18)
        """, 
            profile_data.get("profile_id"),
            profile_data.get("user_id"),
            profile_data.get("username"),
            profile_data.get("first_name"),
            profile_data.get("last_name"),
            profile_data.get("title"),
            profile_data.get("company"),
            profile_data.get("bio"),
            profile_data.get("location"),
            profile_data.get("website"),
            profile_data.get("emails", []),
            profile_data.get("phones", []),
            profile_data.get("avatar"),
            profile_data.get("cover_image"),
            profile_data.get("cover_type", "color"),
            profile_data.get("cover_color", "#8645D6"),
            profile_data.get("views", 0),
            datetime.now(timezone.utc)
        )
        return await get_profile_by_username(profile_data.get("username"))

async def get_profile_by_user_id(user_id: str) -> Optional[Dict]:
    """Get profile by user ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM profiles WHERE user_id = $1", user_id)
        if row:
            result = dict(row)
            # Convert JSONB to Python lists
            result["emails"] = result.get("emails") or []
            result["phones"] = result.get("phones") or []
            return result
        return None

async def get_profile_by_username(username: str) -> Optional[Dict]:
    """Get profile by username"""
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM profiles WHERE username = $1", username)
        if row:
            result = dict(row)
            result["emails"] = result.get("emails") or []
            result["phones"] = result.get("phones") or []
            return result
        return None

async def update_profile(user_id: str, updates: Dict) -> Optional[Dict]:
    """Update profile"""
    async with get_connection() as conn:
        # Build dynamic update query
        set_clauses = []
        values = []
        idx = 1
        
        for key, value in updates.items():
            if key not in ["profile_id", "user_id", "created_at"]:
                set_clauses.append(f"{key} = ${idx}")
                values.append(value)
                idx += 1
        
        if set_clauses:
            set_clauses.append(f"updated_at = ${idx}")
            values.append(datetime.now(timezone.utc))
            idx += 1
            
            values.append(user_id)
            query = f"UPDATE profiles SET {', '.join(set_clauses)} WHERE user_id = ${idx}"
            await conn.execute(query, *values)
        
        return await get_profile_by_user_id(user_id)

async def delete_profile(profile_id: str) -> bool:
    """Delete a profile"""
    async with get_connection() as conn:
        result = await conn.execute("DELETE FROM profiles WHERE profile_id = $1", profile_id)
        return "DELETE 1" in result

async def increment_profile_views(profile_id: str) -> None:
    """Increment profile views"""
    async with get_connection() as conn:
        await conn.execute("UPDATE profiles SET views = views + 1 WHERE profile_id = $1", profile_id)

async def check_username_exists(username: str, exclude_user_id: str = None) -> bool:
    """Check if username exists"""
    async with get_connection() as conn:
        if exclude_user_id:
            row = await conn.fetchrow(
                "SELECT 1 FROM profiles WHERE username = $1 AND user_id != $2", 
                username, exclude_user_id
            )
        else:
            row = await conn.fetchrow("SELECT 1 FROM profiles WHERE username = $1", username)
        return row is not None

# ==================== LINKS OPERATIONS ====================

async def create_link(link_data: Dict) -> Dict:
    """Create a new link"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO links (link_id, profile_id, type, platform, url, title, clicks, position, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """,
            link_data.get("link_id"),
            link_data.get("profile_id"),
            link_data.get("type", "social"),
            link_data.get("platform"),
            link_data.get("url"),
            link_data.get("title"),
            link_data.get("clicks", 0),
            link_data.get("position", 0),
            link_data.get("is_active", True),
            datetime.now(timezone.utc)
        )
        return await get_link_by_id(link_data.get("link_id"))

async def get_link_by_id(link_id: str) -> Optional[Dict]:
    """Get link by ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM links WHERE link_id = $1", link_id)
        return dict(row) if row else None

async def get_links_by_profile_id(profile_id: str, active_only: bool = False) -> List[Dict]:
    """Get all links for a profile"""
    async with get_connection() as conn:
        if active_only:
            rows = await conn.fetch(
                "SELECT * FROM links WHERE profile_id = $1 AND is_active = TRUE ORDER BY position",
                profile_id
            )
        else:
            rows = await conn.fetch(
                "SELECT * FROM links WHERE profile_id = $1 ORDER BY position",
                profile_id
            )
        return [dict(row) for row in rows]

async def update_link(link_id: str, updates: Dict) -> Optional[Dict]:
    """Update a link"""
    async with get_connection() as conn:
        set_clauses = []
        values = []
        idx = 1
        
        for key, value in updates.items():
            if key not in ["link_id", "profile_id", "created_at"]:
                set_clauses.append(f"{key} = ${idx}")
                values.append(value)
                idx += 1
        
        if set_clauses:
            values.append(link_id)
            query = f"UPDATE links SET {', '.join(set_clauses)} WHERE link_id = ${idx}"
            await conn.execute(query, *values)
        
        return await get_link_by_id(link_id)

async def delete_link(link_id: str) -> bool:
    """Delete a link"""
    async with get_connection() as conn:
        result = await conn.execute("DELETE FROM links WHERE link_id = $1", link_id)
        return "DELETE 1" in result

async def increment_link_clicks(link_id: str) -> None:
    """Increment link clicks"""
    async with get_connection() as conn:
        await conn.execute("UPDATE links SET clicks = clicks + 1 WHERE link_id = $1", link_id)

# ==================== CONTACTS OPERATIONS ====================

async def create_contact(contact_data: Dict) -> Dict:
    """Create a new contact"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO contacts (contact_id, profile_id, name, email, phone, message, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
            contact_data.get("contact_id"),
            contact_data.get("profile_id"),
            contact_data.get("name"),
            contact_data.get("email"),
            contact_data.get("phone"),
            contact_data.get("message"),
            datetime.now(timezone.utc)
        )
        return contact_data

async def get_contacts_by_profile_id(profile_id: str) -> List[Dict]:
    """Get all contacts for a profile"""
    async with get_connection() as conn:
        rows = await conn.fetch(
            "SELECT * FROM contacts WHERE profile_id = $1 ORDER BY created_at DESC",
            profile_id
        )
        return [dict(row) for row in rows]

# ==================== ANALYTICS OPERATIONS ====================

async def create_analytics_event(profile_id: str, event_type: str, referrer: str = None) -> None:
    """Create an analytics event"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO analytics (profile_id, event_type, referrer, timestamp)
            VALUES ($1, $2, $3, $4)
        """, profile_id, event_type, referrer, datetime.now(timezone.utc))

async def get_analytics_by_profile_id(profile_id: str, days: int = 30) -> List[Dict]:
    """Get analytics for a profile"""
    async with get_connection() as conn:
        rows = await conn.fetch("""
            SELECT * FROM analytics 
            WHERE profile_id = $1 AND timestamp > NOW() - INTERVAL '%s days'
            ORDER BY timestamp DESC
        """ % days, profile_id)
        return [dict(row) for row in rows]

# ==================== PHYSICAL CARDS OPERATIONS ====================

async def create_physical_card(card_data: Dict) -> Dict:
    """Create a physical card"""
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO physical_cards (card_id, status, batch_name, created_at)
            VALUES ($1, $2, $3, $4)
        """,
            card_data.get("card_id"),
            card_data.get("status", "unactivated"),
            card_data.get("batch_name"),
            datetime.now(timezone.utc)
        )
        return await get_physical_card(card_data.get("card_id"))

async def get_physical_card(card_id: str) -> Optional[Dict]:
    """Get physical card by ID"""
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM physical_cards WHERE card_id = $1", card_id)
        return dict(row) if row else None

async def activate_physical_card(card_id: str, user_id: str, profile_id: str) -> Optional[Dict]:
    """Activate a physical card"""
    async with get_connection() as conn:
        await conn.execute("""
            UPDATE physical_cards 
            SET user_id = $1, profile_id = $2, status = 'activated', activated_at = $3
            WHERE card_id = $4
        """, user_id, profile_id, datetime.now(timezone.utc), card_id)
        return await get_physical_card(card_id)

async def get_user_physical_cards(user_id: str) -> List[Dict]:
    """Get all physical cards for a user"""
    async with get_connection() as conn:
        rows = await conn.fetch(
            "SELECT * FROM physical_cards WHERE user_id = $1 ORDER BY activated_at DESC",
            user_id
        )
        return [dict(row) for row in rows]

async def unlink_physical_card(card_id: str) -> bool:
    """Unlink a physical card from user"""
    async with get_connection() as conn:
        result = await conn.execute("""
            UPDATE physical_cards 
            SET user_id = NULL, profile_id = NULL, status = 'unactivated', activated_at = NULL
            WHERE card_id = $1
        """, card_id)
        return "UPDATE 1" in result

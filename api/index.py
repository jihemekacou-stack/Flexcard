"""
Vercel Serverless Function - FastAPI Backend
This file serves as the entry point for Vercel's serverless deployment
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from mangum import Mangum
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import hashlib
import secrets
import base64
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Frontend URL for email links
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.flexcardci.com")

# Database connection string from environment
DATABASE_URL = os.environ.get("SUPABASE_DB_URL", "")

# ==================== DATABASE CONNECTION ====================
import asyncpg
from contextlib import asynccontextmanager

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=5,
            command_timeout=60,
            statement_cache_size=0
        )
    return _pool

@asynccontextmanager
async def get_connection():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ContactInfo(BaseModel):
    type: str
    value: str
    label: Optional[str] = None

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    cover_image: Optional[str] = None
    cover_color: Optional[str] = None
    cover_type: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None
    emails: Optional[List[ContactInfo]] = None
    phones: Optional[List[ContactInfo]] = None

class LinkCreate(BaseModel):
    type: str = "social"
    platform: str
    url: str
    title: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    source: str = "form"

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header[7:]
    
    async with get_connection() as conn:
        session = await conn.fetchrow(
            "SELECT * FROM user_sessions WHERE token = $1 AND expires_at > $2",
            token, datetime.now(timezone.utc)
        )
        
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE user_id = $1",
            session["user_id"]
        )
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_dict = dict(user)
        user_dict.pop("password", None)
        user_dict.pop("id", None)
        return user_dict

# ==================== DATABASE OPERATIONS ====================

async def get_user_by_email(email: str):
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return dict(row) if row else None

async def get_user_by_id(user_id: str):
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
        return dict(row) if row else None

async def create_user(user_id: str, email: str, name: str, password: str = None, auth_type: str = "email", google_id: str = None, picture: str = None):
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO users (user_id, email, name, password, auth_type, google_id, picture, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
            ON CONFLICT (email) DO NOTHING
        """, user_id, email, name, password, auth_type, google_id, picture, datetime.now(timezone.utc))
        return await get_user_by_email(email)

async def create_session(session_id: str, user_id: str, token: str, expires_at: datetime):
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO user_sessions (session_id, user_id, token, created_at, expires_at)
            VALUES ($1, $2, $3, $4, $5)
        """, session_id, user_id, token, datetime.now(timezone.utc), expires_at)
        return {"session_id": session_id, "user_id": user_id, "token": token}

async def get_profile_by_user_id(user_id: str):
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM profiles WHERE user_id = $1", user_id)
        if row:
            result = dict(row)
            emails = result.get("emails")
            phones = result.get("phones")
            if isinstance(emails, str):
                try:
                    result["emails"] = json.loads(emails)
                except:
                    result["emails"] = []
            else:
                result["emails"] = emails or []
            if isinstance(phones, str):
                try:
                    result["phones"] = json.loads(phones)
                except:
                    result["phones"] = []
            else:
                result["phones"] = phones or []
            return result
        return None

async def get_profile_by_username(username: str):
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM profiles WHERE username = $1", username)
        if row:
            result = dict(row)
            emails = result.get("emails")
            phones = result.get("phones")
            if isinstance(emails, str):
                try:
                    result["emails"] = json.loads(emails)
                except:
                    result["emails"] = []
            else:
                result["emails"] = emails or []
            if isinstance(phones, str):
                try:
                    result["phones"] = json.loads(phones)
                except:
                    result["phones"] = []
            else:
                result["phones"] = phones or []
            return result
        return None

async def check_username_exists(username: str, exclude_user_id: str = None) -> bool:
    async with get_connection() as conn:
        if exclude_user_id:
            row = await conn.fetchrow(
                "SELECT 1 FROM profiles WHERE username = $1 AND user_id != $2", 
                username, exclude_user_id
            )
        else:
            row = await conn.fetchrow("SELECT 1 FROM profiles WHERE username = $1", username)
        return row is not None

async def create_profile(profile_data: dict):
    async with get_connection() as conn:
        emails = profile_data.get("emails", "[]")
        if isinstance(emails, list):
            emails = json.dumps(emails)
        phones = profile_data.get("phones", "[]")
        if isinstance(phones, list):
            phones = json.dumps(phones)
            
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
            emails,
            phones,
            profile_data.get("avatar"),
            profile_data.get("cover_image"),
            profile_data.get("cover_type", "color"),
            profile_data.get("cover_color", "#8645D6"),
            profile_data.get("views", 0),
            datetime.now(timezone.utc)
        )
        return await get_profile_by_username(profile_data.get("username"))

async def update_profile(user_id: str, updates: dict):
    async with get_connection() as conn:
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

async def update_public_url(user_id: str, public_url: str):
    async with get_connection() as conn:
        await conn.execute(
            "UPDATE profiles SET public_url = $1, updated_at = $2 WHERE user_id = $3",
            public_url, datetime.now(timezone.utc), user_id
        )

async def get_links_by_profile_id(profile_id: str, active_only: bool = False):
    async with get_connection() as conn:
        if active_only:
            rows = await conn.fetch(
                "SELECT * FROM links WHERE profile_id = $1 AND is_active = true ORDER BY position",
                profile_id
            )
        else:
            rows = await conn.fetch(
                "SELECT * FROM links WHERE profile_id = $1 ORDER BY position",
                profile_id
            )
        return [dict(row) for row in rows]

async def increment_profile_views(profile_id: str):
    async with get_connection() as conn:
        await conn.execute("UPDATE profiles SET views = views + 1 WHERE profile_id = $1", profile_id)

async def increment_link_clicks(link_id: str):
    async with get_connection() as conn:
        await conn.execute("UPDATE links SET clicks = clicks + 1 WHERE link_id = $1", link_id)

async def get_physical_card(card_id: str):
    async with get_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM physical_cards WHERE card_id = $1", card_id)
        return dict(row) if row else None

async def activate_physical_card(card_id: str, user_id: str, profile_id: str):
    async with get_connection() as conn:
        await conn.execute("""
            UPDATE physical_cards 
            SET status = 'activated', user_id = $1, profile_id = $2, activated_at = $3
            WHERE card_id = $4
        """, user_id, profile_id, datetime.now(timezone.utc), card_id)

async def get_user_physical_cards(user_id: str):
    async with get_connection() as conn:
        rows = await conn.fetch(
            "SELECT * FROM physical_cards WHERE user_id = $1 ORDER BY activated_at DESC",
            user_id
        )
        return [dict(row) for row in rows]

async def get_analytics_by_profile_id(profile_id: str):
    async with get_connection() as conn:
        views = await conn.fetchval(
            "SELECT views FROM profiles WHERE profile_id = $1", profile_id
        ) or 0
        
        clicks = await conn.fetchval(
            "SELECT COALESCE(SUM(clicks), 0) FROM links WHERE profile_id = $1", profile_id
        ) or 0
        
        contacts = await conn.fetchval(
            "SELECT COUNT(*) FROM contacts WHERE profile_id = $1", profile_id
        ) or 0
        
        return {
            "total_views": views,
            "total_clicks": clicks,
            "total_contacts": contacts
        }

# ==================== FASTAPI APP ====================

app = FastAPI(title="FlexCard API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent session_id for our session token (Google OAuth)"""
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id with Emergent auth
    async with httpx.AsyncClient() as client_http:
        try:
            emergent_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if emergent_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = emergent_response.json()
        except Exception as e:
            logger.error(f"Emergent auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    name_parts = user_data["name"].split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    existing_user = await get_user_by_email(user_data["email"])
    if existing_user:
        user_id = existing_user["user_id"]
        async with get_connection() as conn:
            await conn.execute(
                "UPDATE users SET name = $1, picture = $2, updated_at = $3 WHERE user_id = $4",
                user_data["name"], user_data.get("picture"), now, user_id
            )
    else:
        await create_user(
            user_id=user_id,
            email=user_data["email"],
            name=user_data["name"],
            auth_type="google",
            picture=user_data.get("picture")
        )
        
        username = user_data["email"].split("@")[0].lower().replace(".", "")[:20]
        if await check_username_exists(username):
            username = f"{username}{uuid.uuid4().hex[:4]}"
        
        await create_profile({
            "profile_id": f"profile_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "avatar": user_data.get("picture"),
            "cover_color": "#8645D6",
            "cover_type": "color",
            "emails": json.dumps([{"type": "email", "value": user_data["email"], "label": "Principal"}]),
            "phones": json.dumps([]),
            "views": 0
        })
        
        initial_public_url = f"{FRONTEND_URL}/u/{username}"
        await update_public_url(user_id, initial_public_url)
    
    session_token = secrets.token_urlsafe(32)
    session_id_new = f"session_{uuid.uuid4().hex[:12]}"
    expires_at = now + timedelta(days=7)
    
    await create_session(session_id_new, user_id, session_token, expires_at)
    
    user = await get_user_by_id(user_id)
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    user_dict["session_token"] = session_token
    return user_dict

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    existing = await get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    name_parts = user_data.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    await create_user(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        password=hash_password(user_data.password),
        auth_type="email"
    )
    
    username = user_data.email.split("@")[0].lower().replace(".", "")[:20]
    if await check_username_exists(username):
        username = f"{username}{uuid.uuid4().hex[:4]}"
    
    await create_profile({
        "profile_id": f"profile_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "cover_color": "#8645D6",
        "cover_type": "color",
        "emails": json.dumps([{"type": "email", "value": user_data.email, "label": "Principal"}]),
        "phones": json.dumps([]),
        "views": 0
    })
    
    initial_public_url = f"{FRONTEND_URL}/u/{username}"
    await update_public_url(user_id, initial_public_url)
    
    session_token = secrets.token_urlsafe(32)
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    expires_at = now + timedelta(days=7)
    
    await create_session(session_id, user_id, session_token, expires_at)
    
    user = await get_user_by_id(user_id)
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    user_dict["session_token"] = session_token
    return user_dict

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("auth_type") == "google":
        raise HTTPException(status_code=400, detail="Please use Google to sign in")
    
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = secrets.token_urlsafe(32)
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)
    
    await create_session(session_id, user["user_id"], session_token, expires_at)
    
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    user_dict["session_token"] = session_token
    return user_dict

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ==================== PROFILE ROUTES ====================

@api_router.get("/profile")
async def get_my_profile(user: dict = Depends(get_current_user)):
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    return profile_dict

@api_router.put("/profile")
async def update_my_profile(update_data: ProfileUpdate, user: dict = Depends(get_current_user)):
    update_dict = {}
    for k, v in update_data.dict().items():
        if v is not None:
            if k == "emails" or k == "phones":
                update_dict[k] = json.dumps([item.dict() if hasattr(item, 'dict') else item for item in v])
            else:
                update_dict[k] = v
    
    profile = await update_profile(user["user_id"], update_dict)
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    return profile_dict

@api_router.put("/profile/username")
async def update_username(request: Request, user: dict = Depends(get_current_user)):
    """Update username"""
    data = await request.json()
    new_username = data.get("username", "").lower().strip()
    
    if not new_username or len(new_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    
    if not new_username.isalnum():
        raise HTTPException(status_code=400, detail="Username must be alphanumeric")
    
    if await check_username_exists(new_username, exclude_user_id=user["user_id"]):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    profile = await update_profile(user["user_id"], {"username": new_username})
    
    # Update public_url with new username
    cards = await get_user_physical_cards(user["user_id"])
    if cards and len(cards) > 0:
        new_public_url = f"{FRONTEND_URL}/u/{new_username}/{cards[0]['card_id']}"
    else:
        new_public_url = f"{FRONTEND_URL}/u/{new_username}"
    await update_public_url(user["user_id"], new_public_url)
    
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    profile_dict["public_url"] = new_public_url
    return profile_dict

@api_router.post("/auth/logout")
async def logout(request: Request):
    """Logout user"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        async with get_connection() as conn:
            await conn.execute("DELETE FROM user_sessions WHERE token = $1", token)
    return {"message": "Logged out"}

# ==================== PUBLIC PROFILE ROUTES ====================

@api_router.get("/public/{username}")
async def get_public_profile(username: str, request: Request):
    profile = await get_profile_by_username(username.lower())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    links = await get_links_by_profile_id(profile["profile_id"], active_only=True)
    await increment_profile_views(profile["profile_id"])
    
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    
    return {
        "profile": profile_dict,
        "links": [{"link_id": l["link_id"], "profile_id": l["profile_id"], "type": l["type"], 
                   "platform": l["platform"], "url": l["url"], "title": l["title"],
                   "clicks": l.get("clicks", 0), "position": l.get("position", 0), 
                   "is_active": l.get("is_active", True), "created_at": l["created_at"]} for l in links]
    }

@api_router.get("/public/{username}/card/{card_id}")
async def get_public_profile_with_card(username: str, card_id: str, request: Request):
    card = await get_physical_card(card_id.upper())
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    profile = await get_profile_by_username(username.lower())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if card["status"] != "activated" or card.get("profile_id") != profile["profile_id"]:
        raise HTTPException(status_code=403, detail="Card not linked to this profile")
    
    links = await get_links_by_profile_id(profile["profile_id"], active_only=True)
    await increment_profile_views(profile["profile_id"])
    
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    
    return {
        "profile": profile_dict,
        "links": [{"link_id": l["link_id"], "profile_id": l["profile_id"], "type": l["type"], 
                   "platform": l["platform"], "url": l["url"], "title": l["title"],
                   "clicks": l.get("clicks", 0), "position": l.get("position", 0), 
                   "is_active": l.get("is_active", True), "created_at": l["created_at"]} for l in links],
        "card_id": card_id.upper()
    }

@api_router.post("/public/{username}/click/{link_id}")
async def record_click(username: str, link_id: str):
    profile = await get_profile_by_username(username.lower())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    await increment_link_clicks(link_id)
    return {"message": "Click recorded"}

# ==================== CARDS ROUTES ====================

@api_router.get("/cards/{card_id}")
async def get_card_status(card_id: str):
    card = await get_physical_card(card_id.upper())
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card["status"] == "activated":
        profile = await get_profile_by_user_id(card["user_id"])
        if profile:
            return {
                "status": "activated",
                "card_id": card["card_id"],
                "redirect_to": f"/u/{profile['username']}/{card['card_id']}"
            }
    
    return {
        "status": "unactivated",
        "card_id": card["card_id"],
        "redirect_to": f"/activate/{card['card_id']}"
    }

@api_router.post("/cards/{card_id}/activate")
async def activate_card(card_id: str, user: dict = Depends(get_current_user)):
    card = await get_physical_card(card_id.upper())
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card["status"] == "activated":
        raise HTTPException(status_code=400, detail="Card already activated")
    
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    await activate_physical_card(card_id.upper(), user["user_id"], profile["profile_id"])
    
    public_url = f"{FRONTEND_URL}/u/{profile['username']}/{card_id.upper()}"
    await update_public_url(user["user_id"], public_url)
    
    return {
        "message": "Card activated successfully",
        "card_id": card_id.upper(),
        "profile_username": profile["username"],
        "public_url": public_url
    }

@api_router.get("/cards/user/my-cards")
async def get_my_cards(user: dict = Depends(get_current_user)):
    cards = await get_user_physical_cards(user["user_id"])
    return {"cards": [{"card_id": c["card_id"], "status": c["status"], 
                       "activated_at": c.get("activated_at"), "created_at": c["created_at"]} for c in cards]}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    analytics = await get_analytics_by_profile_id(profile["profile_id"])
    return analytics

# ==================== LINKS ROUTES ====================

@api_router.get("/links")
async def get_my_links(user: dict = Depends(get_current_user)):
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    links = await get_links_by_profile_id(profile["profile_id"])
    return links

@api_router.post("/links")
async def create_link(link_data: LinkCreate, user: dict = Depends(get_current_user)):
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    link_id = f"link_{uuid.uuid4().hex[:12]}"
    
    async with get_connection() as conn:
        max_pos = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) FROM links WHERE profile_id = $1",
            profile["profile_id"]
        )
        
        await conn.execute("""
            INSERT INTO links (link_id, profile_id, type, platform, url, title, clicks, position, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """,
            link_id,
            profile["profile_id"],
            link_data.type,
            link_data.platform,
            link_data.url,
            link_data.title or link_data.platform.title(),
            0,
            (max_pos or 0) + 1,
            True,
            datetime.now(timezone.utc)
        )
    
    return {"link_id": link_id, "message": "Link created"}

@api_router.delete("/links/{link_id}")
async def delete_link(link_id: str, user: dict = Depends(get_current_user)):
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    async with get_connection() as conn:
        result = await conn.execute(
            "DELETE FROM links WHERE link_id = $1 AND profile_id = $2",
            link_id, profile["profile_id"]
        )
    
    return {"message": "Link deleted"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "FlexCard API", "version": "2.0.0", "platform": "Vercel"}

# Include router
app.include_router(api_router)

# Vercel handler
handler = Mangum(app, lifespan="off")

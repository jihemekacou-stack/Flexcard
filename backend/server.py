from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
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
import aiofiles
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Supabase database operations
from supabase_db import (
    get_pool, close_pool, get_connection,
    create_user, get_user_by_email, get_user_by_id, delete_user,
    create_session, get_session_by_token, delete_session, delete_user_sessions,
    create_profile, get_profile_by_user_id, get_profile_by_username, 
    update_profile, delete_profile, increment_profile_views, check_username_exists,
    create_link, get_link_by_id, get_links_by_profile_id, 
    update_link, delete_link, increment_link_clicks,
    create_contact, get_contacts_by_profile_id,
    create_analytics_event, get_analytics_by_profile_id,
    create_physical_card, get_physical_card, activate_physical_card,
    get_user_physical_cards, unlink_physical_card
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve static uploads via /api/uploads to avoid frontend route conflicts
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class ContactInfo(BaseModel):
    type: str  # email or phone
    value: str
    label: Optional[str] = None  # e.g. "Personnel", "Travail"

class ProfileBase(BaseModel):
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    cover_image: Optional[str] = None
    cover_color: Optional[str] = "#8645D6"
    cover_type: str = "color"  # "color" or "image"
    phone: Optional[str] = None
    email: Optional[str] = None
    emails: List[ContactInfo] = []
    phones: List[ContactInfo] = []
    website: Optional[str] = None
    location: Optional[str] = None
    theme: str = "modern"
    primary_color: str = "#8645D6"
    background_style: str = "gradient"

class ProfileCreate(ProfileBase):
    pass

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
    phone: Optional[str] = None
    email: Optional[str] = None
    emails: Optional[List[ContactInfo]] = None
    phones: Optional[List[ContactInfo]] = None
    website: Optional[str] = None
    location: Optional[str] = None
    theme: Optional[str] = None
    primary_color: Optional[str] = None
    background_style: Optional[str] = None

class ProfileResponse(ProfileBase):
    profile_id: str
    user_id: str
    views: int = 0
    created_at: datetime
    updated_at: datetime

class LinkBase(BaseModel):
    type: str  # social, website, action, payment
    platform: Optional[str] = None  # linkedin, instagram, etc.
    url: str
    title: str
    icon: Optional[str] = None
    position: int = 0
    is_active: bool = True

class LinkCreate(LinkBase):
    pass

class LinkUpdate(BaseModel):
    type: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    icon: Optional[str] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None

class LinkResponse(LinkBase):
    link_id: str
    profile_id: str
    clicks: int = 0
    created_at: datetime

class ContactBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None
    source: str = "form"

class ContactCreate(ContactBase):
    pass

class ContactResponse(ContactBase):
    contact_id: str
    profile_id: str
    created_at: datetime

class AnalyticsEvent(BaseModel):
    event_type: str  # view, click, contact_save
    metadata: Optional[Dict[str, Any]] = None

class LinksReorder(BaseModel):
    link_ids: List[str]

# ==================== PHYSICAL CARD MODELS ====================

class PhysicalCardCreate(BaseModel):
    batch_name: Optional[str] = None  # For admin to track batches

class PhysicalCardActivate(BaseModel):
    card_id: str

class PhysicalCardResponse(BaseModel):
    card_id: str
    status: str  # "unactivated", "activated"
    user_id: Optional[str] = None
    profile_id: Optional[str] = None
    activated_at: Optional[datetime] = None
    created_at: datetime

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

async def get_current_user(request: Request) -> dict:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await get_session_by_token(session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user = await get_user_by_id(session["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Convert to dict and remove sensitive fields
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    
    return user_dict

# ==================== APP LIFECYCLE ====================

@app.on_event("startup")
async def startup():
    """Initialize the database connection pool"""
    logger.info("Starting up - initializing Supabase connection pool...")
    await get_pool()
    logger.info("Supabase connection pool initialized")

@app.on_event("shutdown")
async def shutdown():
    """Close the database connection pool"""
    logger.info("Shutting down - closing Supabase connection pool...")
    await close_pool()
    logger.info("Supabase connection pool closed")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent session_id for our session token"""
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
    
    # Parse name into first/last
    name_parts = user_data["name"].split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Check if user exists
    existing_user = await get_user_by_email(user_data["email"])
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        async with get_connection() as conn:
            await conn.execute(
                "UPDATE users SET name = $1, picture = $2, updated_at = $3 WHERE user_id = $4",
                user_data["name"], user_data.get("picture"), now, user_id
            )
    else:
        # Create new user
        await create_user(
            user_id=user_id,
            email=user_data["email"],
            name=user_data["name"],
            auth_type="google",
            picture=user_data.get("picture")
        )
        
        # Create default profile
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
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session_id_new = f"session_{uuid.uuid4().hex[:12]}"
    expires_at = now + timedelta(days=7)
    
    await create_session(session_id_new, user_id, session_token, expires_at)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await get_user_by_id(user_id)
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    return user_dict

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    """Register with email/password"""
    existing = await get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Parse name into first/last
    name_parts = user_data.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Create user with hashed password
    await create_user(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        password=hash_password(user_data.password),
        auth_type="email"
    )
    
    # Create default profile
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
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    expires_at = now + timedelta(days=7)
    
    await create_session(session_id, user_id, session_token, expires_at)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await get_user_by_id(user_id)
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    return user_dict

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("auth_type") == "google":
        raise HTTPException(status_code=400, detail="Please use Google to sign in")
    
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)
    
    await create_session(session_id, user["user_id"], session_token, expires_at)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_dict = dict(user)
    user_dict.pop("password", None)
    user_dict.pop("id", None)
    return user_dict

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user"""
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await delete_session(session_token)
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== PROFILE ROUTES ====================

@api_router.get("/profile")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    return profile_dict

@api_router.put("/profile")
async def update_my_profile(update_data: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Update current user's profile"""
    update_dict = {}
    for k, v in update_data.dict().items():
        if v is not None:
            if k == "emails" or k == "phones":
                # Convert to JSON for storage
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
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    return profile_dict

@api_router.delete("/profile")
async def delete_profile_route(user: dict = Depends(get_current_user)):
    """Delete user profile and all associated data"""
    profile = await get_profile_by_user_id(user["user_id"])
    
    if profile:
        profile_id = profile["profile_id"]
        
        # Delete associated data using raw SQL
        async with get_connection() as conn:
            await conn.execute("DELETE FROM links WHERE profile_id = $1", profile_id)
            await conn.execute("DELETE FROM contacts WHERE profile_id = $1", profile_id)
            await conn.execute("DELETE FROM analytics WHERE profile_id = $1", profile_id)
            
            # Unlink physical cards
            await conn.execute("""
                UPDATE physical_cards 
                SET status = 'unactivated', user_id = NULL, profile_id = NULL, activated_at = NULL 
                WHERE user_id = $1
            """, user["user_id"])
        
        # Delete uploaded files
        if profile.get("avatar") and profile["avatar"].startswith("/"):
            filename = profile["avatar"].replace("/api/uploads/", "").replace("/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
        
        if profile.get("cover_image") and profile["cover_image"].startswith("/"):
            filename = profile["cover_image"].replace("/api/uploads/", "").replace("/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
        
        # Delete profile
        await delete_profile(profile_id)
    
    # Delete user sessions and user
    await delete_user_sessions(user["user_id"])
    await delete_user(user["user_id"])
    
    return {"message": "Profile and account deleted successfully"}

# ==================== IMAGE UPLOAD ROUTES ====================

@api_router.post("/upload/avatar")
async def upload_avatar(request: Request, user: dict = Depends(get_current_user)):
    """Upload avatar image (base64)"""
    data = await request.json()
    image_data = data.get("image")
    
    if not image_data:
        raise HTTPException(status_code=400, detail="Image data required")
    
    # Handle base64 data
    if "base64," in image_data:
        image_data = image_data.split("base64,")[1]
    
    # Generate unique filename
    filename = f"avatar_{user['user_id']}_{uuid.uuid4().hex[:8]}.jpg"
    filepath = UPLOADS_DIR / filename
    
    # Save image
    try:
        image_bytes = base64.b64decode(image_data)
        async with aiofiles.open(filepath, 'wb') as f:
            await f.write(image_bytes)
    except Exception as e:
        logger.error(f"Error saving avatar: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")
    
    # Return URL path that will be served via /api/uploads
    image_url = f"/api/uploads/{filename}"
    
    # Update profile
    await update_profile(user["user_id"], {"avatar": image_url})
    
    return {"avatar": image_url}

@api_router.delete("/upload/avatar")
async def delete_avatar(user: dict = Depends(get_current_user)):
    """Delete avatar image"""
    profile = await get_profile_by_user_id(user["user_id"])
    
    if profile and profile.get("avatar"):
        avatar_path = profile["avatar"]
        if avatar_path.startswith("/api/uploads/"):
            filename = avatar_path.replace("/api/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
        elif avatar_path.startswith("/uploads/"):
            filename = avatar_path.replace("/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
    
    await update_profile(user["user_id"], {"avatar": None})
    
    return {"message": "Avatar deleted"}

@api_router.post("/upload/cover")
async def upload_cover(request: Request, user: dict = Depends(get_current_user)):
    """Upload cover image (base64)"""
    data = await request.json()
    image_data = data.get("image")
    
    if not image_data:
        raise HTTPException(status_code=400, detail="Image data required")
    
    # Handle base64 data
    if "base64," in image_data:
        image_data = image_data.split("base64,")[1]
    
    # Generate unique filename
    filename = f"cover_{user['user_id']}_{uuid.uuid4().hex[:8]}.jpg"
    filepath = UPLOADS_DIR / filename
    
    # Save image
    try:
        image_bytes = base64.b64decode(image_data)
        async with aiofiles.open(filepath, 'wb') as f:
            await f.write(image_bytes)
    except Exception as e:
        logger.error(f"Error saving cover: {e}")
        raise HTTPException(status_code=500, detail="Failed to save image")
    
    image_url = f"/api/uploads/{filename}"
    
    # Update profile
    await update_profile(user["user_id"], {"cover_image": image_url, "cover_type": "image"})
    
    return {"cover_image": image_url}

@api_router.delete("/upload/cover")
async def delete_cover(user: dict = Depends(get_current_user)):
    """Delete cover image"""
    profile = await get_profile_by_user_id(user["user_id"])
    
    if profile and profile.get("cover_image"):
        cover_path = profile["cover_image"]
        if cover_path.startswith("/api/uploads/"):
            filename = cover_path.replace("/api/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
        elif cover_path.startswith("/uploads/"):
            filename = cover_path.replace("/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
    
    await update_profile(user["user_id"], {"cover_image": None, "cover_type": "color"})
    
    return {"message": "Cover deleted"}

# ==================== LINKS ROUTES ====================

@api_router.get("/links")
async def get_my_links(user: dict = Depends(get_current_user)):
    """Get current user's links"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    links = await get_links_by_profile_id(profile["profile_id"])
    # Remove internal id field
    return [{"link_id": l["link_id"], "profile_id": l["profile_id"], "type": l["type"], 
             "platform": l["platform"], "url": l["url"], "title": l["title"],
             "clicks": l.get("clicks", 0), "position": l.get("position", 0), 
             "is_active": l.get("is_active", True), "created_at": l["created_at"]} for l in links]

@api_router.post("/links")
async def create_link_route(link_data: LinkCreate, user: dict = Depends(get_current_user)):
    """Create a new link"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get max position
    links = await get_links_by_profile_id(profile["profile_id"])
    position = max([l.get("position", 0) for l in links], default=-1) + 1
    
    link_id = f"link_{uuid.uuid4().hex[:12]}"
    
    link_doc = {
        "link_id": link_id,
        "profile_id": profile["profile_id"],
        "type": link_data.type,
        "platform": link_data.platform,
        "url": link_data.url,
        "title": link_data.title,
        "position": position,
        "clicks": 0,
        "is_active": link_data.is_active
    }
    
    link = await create_link(link_doc)
    link_dict = dict(link)
    link_dict.pop("id", None)
    return link_dict

@api_router.put("/links/{link_id}")
async def update_link_route(link_id: str, update_data: LinkUpdate, user: dict = Depends(get_current_user)):
    """Update a link"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    link = await get_link_by_id(link_id)
    if not link or link["profile_id"] != profile["profile_id"]:
        raise HTTPException(status_code=404, detail="Link not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    updated_link = await update_link(link_id, update_dict)
    link_dict = dict(updated_link)
    link_dict.pop("id", None)
    return link_dict

@api_router.delete("/links/{link_id}")
async def delete_link_route(link_id: str, user: dict = Depends(get_current_user)):
    """Delete a link"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    link = await get_link_by_id(link_id)
    if not link or link["profile_id"] != profile["profile_id"]:
        raise HTTPException(status_code=404, detail="Link not found")
    
    await delete_link(link_id)
    return {"message": "Link deleted"}

@api_router.put("/links/reorder")
async def reorder_links(reorder: LinksReorder, user: dict = Depends(get_current_user)):
    """Reorder links"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    async with get_connection() as conn:
        for i, link_id in enumerate(reorder.link_ids):
            await conn.execute(
                "UPDATE links SET position = $1 WHERE link_id = $2 AND profile_id = $3",
                i, link_id, profile["profile_id"]
            )
    
    links = await get_links_by_profile_id(profile["profile_id"])
    return [{"link_id": l["link_id"], "profile_id": l["profile_id"], "type": l["type"], 
             "platform": l["platform"], "url": l["url"], "title": l["title"],
             "clicks": l.get("clicks", 0), "position": l.get("position", 0), 
             "is_active": l.get("is_active", True), "created_at": l["created_at"]} for l in links]

# ==================== CONTACTS ROUTES ====================

@api_router.get("/contacts")
async def get_my_contacts(user: dict = Depends(get_current_user)):
    """Get contacts collected by user's profile"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    contacts = await get_contacts_by_profile_id(profile["profile_id"])
    return [{"contact_id": c["contact_id"], "profile_id": c["profile_id"], 
             "name": c["name"], "email": c.get("email"), "phone": c.get("phone"),
             "message": c.get("message"), "created_at": c["created_at"]} for c in contacts]

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    """Delete a contact"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    async with get_connection() as conn:
        result = await conn.execute(
            "DELETE FROM contacts WHERE contact_id = $1 AND profile_id = $2",
            contact_id, profile["profile_id"]
        )
        if "DELETE 0" in result:
            raise HTTPException(status_code=404, detail="Contact not found")
    
    return {"message": "Contact deleted"}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    """Get analytics for user's profile"""
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get total views
    total_views = profile.get("views", 0)
    
    # Get total link clicks
    links = await get_links_by_profile_id(profile["profile_id"])
    total_clicks = sum(link.get("clicks", 0) for link in links)
    
    # Get contacts count
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT COUNT(*) as count FROM contacts WHERE profile_id = $1",
            profile["profile_id"]
        )
        contacts_count = row["count"] if row else 0
    
    # Get recent analytics events
    events = await get_analytics_by_profile_id(profile["profile_id"], days=30)
    
    # Aggregate by day
    daily_views = {}
    daily_clicks = {}
    
    for event in events:
        day = event["timestamp"].strftime("%Y-%m-%d")
        if event["event_type"] == "view":
            daily_views[day] = daily_views.get(day, 0) + 1
        elif event["event_type"] == "click":
            daily_clicks[day] = daily_clicks.get(day, 0) + 1
    
    return {
        "total_views": total_views,
        "total_clicks": total_clicks,
        "total_contacts": contacts_count,
        "daily_views": daily_views,
        "daily_clicks": daily_clicks,
        "links": [{"link_id": l["link_id"], "title": l["title"], "clicks": l.get("clicks", 0)} for l in links]
    }

# ==================== PUBLIC PROFILE ROUTES ====================

@api_router.get("/public/{username}")
async def get_public_profile(username: str, request: Request):
    """Get public profile by username"""
    profile = await get_profile_by_username(username.lower())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get active links
    links = await get_links_by_profile_id(profile["profile_id"], active_only=True)
    
    # Record view
    await increment_profile_views(profile["profile_id"])
    
    # Create analytics event
    await create_analytics_event(
        profile["profile_id"],
        "view",
        request.headers.get("referer")
    )
    
    profile_dict = dict(profile)
    profile_dict.pop("id", None)
    
    return {
        "profile": profile_dict,
        "links": [{"link_id": l["link_id"], "profile_id": l["profile_id"], "type": l["type"], 
                   "platform": l["platform"], "url": l["url"], "title": l["title"],
                   "clicks": l.get("clicks", 0), "position": l.get("position", 0), 
                   "is_active": l.get("is_active", True), "created_at": l["created_at"]} for l in links]
    }

@api_router.post("/public/{username}/click/{link_id}")
async def record_click(username: str, link_id: str):
    """Record link click"""
    profile = await get_profile_by_username(username.lower())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    await increment_link_clicks(link_id)
    
    # Create analytics event
    async with get_connection() as conn:
        await conn.execute("""
            INSERT INTO analytics (profile_id, event_type, referrer, timestamp)
            VALUES ($1, $2, $3, $4)
        """, profile["profile_id"], "click", link_id, datetime.now(timezone.utc))
    
    return {"message": "Click recorded"}

@api_router.post("/public/{username}/contact")
async def submit_contact(username: str, contact_data: ContactCreate):
    """Submit contact form on public profile"""
    profile = await get_profile_by_username(username.lower())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    contact_id = f"contact_{uuid.uuid4().hex[:12]}"
    
    await create_contact({
        "contact_id": contact_id,
        "profile_id": profile["profile_id"],
        "name": contact_data.name,
        "email": contact_data.email,
        "phone": contact_data.phone,
        "message": contact_data.message
    })
    
    # Create analytics event
    await create_analytics_event(profile["profile_id"], "contact_save", contact_id)
    
    return {"message": "Contact submitted", "contact_id": contact_id}

# ==================== PHYSICAL CARDS ROUTES ====================

@api_router.post("/cards/generate")
async def generate_cards(count: int = 10, batch_name: str = None, code_length: int = 5):
    """Generate new physical cards (admin endpoint)"""
    import string
    import random
    
    cards = []
    # Allow up to 300 cards at once for batch generation
    max_count = min(count, 300)
    
    # Characters for card codes (uppercase letters and digits, excluding confusing ones like 0/O, 1/I/L)
    characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    
    for _ in range(max_count):
        # Generate random card code of specified length
        card_id = ''.join(random.choices(characters, k=code_length))
        
        await create_physical_card({
            "card_id": card_id,
            "status": "unactivated",
            "batch_name": batch_name
        })
        cards.append(card_id)
    
    return {"message": f"{len(cards)} cards generated", "card_ids": cards}

@api_router.get("/cards/{card_id}")
async def get_card_status(card_id: str):
    """Get physical card status - used for QR redirect"""
    card = await get_physical_card(card_id.upper())
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card["status"] == "activated" and card.get("profile_id"):
        # Card is activated - get the profile username for redirect
        async with get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT username FROM profiles WHERE profile_id = $1",
                card["profile_id"]
            )
            if row:
                return {
                    "status": "activated",
                    "redirect_to": f"/u/{row['username']}",
                    "username": row["username"]
                }
    
    # Card not activated - needs activation
    return {
        "status": "unactivated",
        "card_id": card["card_id"],
        "redirect_to": f"/activate/{card['card_id']}"
    }

@api_router.post("/cards/{card_id}/activate")
async def activate_card(card_id: str, user: dict = Depends(get_current_user)):
    """Activate a physical card and link it to user's profile"""
    card = await get_physical_card(card_id.upper())
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card["status"] == "activated":
        raise HTTPException(status_code=400, detail="Card already activated")
    
    # Get user's profile
    profile = await get_profile_by_user_id(user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Activate the card
    await activate_physical_card(card_id.upper(), user["user_id"], profile["profile_id"])
    
    return {
        "message": "Card activated successfully",
        "card_id": card_id.upper(),
        "profile_username": profile["username"]
    }

@api_router.get("/cards/user/my-cards")
async def get_my_cards(user: dict = Depends(get_current_user)):
    """Get all cards linked to current user"""
    cards = await get_user_physical_cards(user["user_id"])
    return {"cards": [{"card_id": c["card_id"], "status": c["status"], 
                       "activated_at": c.get("activated_at"), "created_at": c["created_at"]} for c in cards]}

@api_router.delete("/cards/{card_id}/unlink")
async def unlink_card(card_id: str, user: dict = Depends(get_current_user)):
    """Unlink a card from user's account (reset to unactivated)"""
    card = await get_physical_card(card_id.upper())
    
    if not card or card.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Card not found or not yours")
    
    await unlink_physical_card(card_id.upper())
    
    return {"message": "Card unlinked successfully"}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "FlexCard API", "version": "2.0.0", "database": "Supabase"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

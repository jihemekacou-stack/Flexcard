from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

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
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture"), "updated_at": now}}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "auth_type": "google",
            "created_at": now,
            "updated_at": now
        })
        # Create default profile
        username = user_data["email"].split("@")[0].lower().replace(".", "")[:20]
        existing_profile = await db.profiles.find_one({"username": username})
        if existing_profile:
            username = f"{username}{uuid.uuid4().hex[:4]}"
        
        await db.profiles.insert_one({
            "profile_id": f"profile_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "title": None,
            "company": None,
            "bio": None,
            "avatar": user_data.get("picture"),
            "cover_image": None,
            "cover_color": "#8645D6",
            "cover_type": "color",
            "phone": None,
            "email": user_data["email"],
            "emails": [{"type": "email", "value": user_data["email"], "label": "Principal"}],
            "phones": [],
            "website": None,
            "location": None,
            "theme": "modern",
            "primary_color": "#8645D6",
            "background_style": "gradient",
            "views": 0,
            "created_at": now,
            "updated_at": now
        })
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    expires_at = now + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": now
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    """Register with email/password"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Parse name into first/last
    name_parts = user_data.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    await db.users.insert_one({
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "auth_type": "email",
        "created_at": now,
        "updated_at": now
    })
    
    # Create default profile
    username = user_data.email.split("@")[0].lower().replace(".", "")[:20]
    existing_profile = await db.profiles.find_one({"username": username})
    if existing_profile:
        username = f"{username}{uuid.uuid4().hex[:4]}"
    
    await db.profiles.insert_one({
        "profile_id": f"profile_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "username": username,
        "first_name": first_name,
        "last_name": last_name,
        "title": None,
        "company": None,
        "bio": None,
        "avatar": None,
        "cover_image": None,
        "cover_color": "#8645D6",
        "cover_type": "color",
        "phone": None,
        "email": user_data.email,
        "emails": [{"type": "email", "value": user_data.email, "label": "Principal"}],
        "phones": [],
        "website": None,
        "location": None,
        "theme": "modern",
        "primary_color": "#8645D6",
        "background_style": "gradient",
        "views": 0,
        "created_at": now,
        "updated_at": now
    })
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    expires_at = now + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": now
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("auth_type") == "google":
        raise HTTPException(status_code=400, detail="Please use Google to sign in")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": now
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    del user["password_hash"]
    return user

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user"""
    if "password_hash" in user:
        del user["password_hash"]
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== PROFILE ROUTES ====================

@api_router.get("/profile", response_model=ProfileResponse)
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.put("/profile")
async def update_my_profile(update_data: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Update current user's profile"""
    update_dict = {}
    for k, v in update_data.dict().items():
        if v is not None:
            if k == "emails" or k == "phones":
                update_dict[k] = [item.dict() if hasattr(item, 'dict') else item for item in v]
            else:
                update_dict[k] = v
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_dict}
    )
    
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return profile

@api_router.put("/profile/username")
async def update_username(request: Request, user: dict = Depends(get_current_user)):
    """Update username"""
    data = await request.json()
    new_username = data.get("username", "").lower().strip()
    
    if not new_username or len(new_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    
    if not new_username.isalnum():
        raise HTTPException(status_code=400, detail="Username must be alphanumeric")
    
    existing = await db.profiles.find_one({"username": new_username, "user_id": {"$ne": user["user_id"]}})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"username": new_username, "updated_at": datetime.now(timezone.utc)}}
    )
    
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return profile

@api_router.delete("/profile")
async def delete_profile(user: dict = Depends(get_current_user)):
    """Delete user profile and all associated data"""
    # Get profile first
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if profile:
        # Delete associated data
        await db.links.delete_many({"profile_id": profile["profile_id"]})
        await db.contacts.delete_many({"profile_id": profile["profile_id"]})
        await db.analytics.delete_many({"profile_id": profile["profile_id"]})
        
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
        
        # Unlink physical cards
        await db.physical_cards.update_many(
            {"user_id": user["user_id"]},
            {"$set": {"status": "unactivated", "user_id": None, "profile_id": None, "activated_at": None}}
        )
        
        # Delete profile
        await db.profiles.delete_one({"profile_id": profile["profile_id"]})
    
    # Delete user sessions
    await db.user_sessions.delete_many({"user_id": user["user_id"]})
    
    # Delete user
    await db.users.delete_one({"user_id": user["user_id"]})
    
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
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"avatar": image_url, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"avatar": image_url}

@api_router.delete("/upload/avatar")
async def delete_avatar(user: dict = Depends(get_current_user)):
    """Delete avatar image"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if profile and profile.get("avatar"):
        avatar_path = profile["avatar"]
        if avatar_path.startswith("/api/uploads/"):
            filename = avatar_path.replace("/api/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
        elif avatar_path.startswith("/uploads/"):
            # Legacy path support
            filename = avatar_path.replace("/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
    
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"avatar": None, "updated_at": datetime.now(timezone.utc)}}
    )
    
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
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"cover_image": image_url, "cover_type": "image", "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"cover_image": image_url}

@api_router.delete("/upload/cover")
async def delete_cover(user: dict = Depends(get_current_user)):
    """Delete cover image"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if profile and profile.get("cover_image"):
        cover_path = profile["cover_image"]
        if cover_path.startswith("/api/uploads/"):
            filename = cover_path.replace("/api/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
        elif cover_path.startswith("/uploads/"):
            # Legacy path support
            filename = cover_path.replace("/uploads/", "")
            filepath = UPLOADS_DIR / filename
            if filepath.exists():
                filepath.unlink()
    
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"cover_image": None, "cover_type": "color", "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Cover deleted"}

# ==================== LINKS ROUTES ====================

@api_router.get("/links", response_model=List[LinkResponse])
async def get_my_links(user: dict = Depends(get_current_user)):
    """Get current user's links"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    links = await db.links.find({"profile_id": profile["profile_id"]}, {"_id": 0}).sort("position", 1).to_list(100)
    return links

@api_router.post("/links", response_model=LinkResponse)
async def create_link(link_data: LinkCreate, user: dict = Depends(get_current_user)):
    """Create a new link"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get max position
    max_link = await db.links.find_one(
        {"profile_id": profile["profile_id"]},
        sort=[("position", -1)]
    )
    position = (max_link["position"] + 1) if max_link else 0
    
    link_id = f"link_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    link_doc = {
        "link_id": link_id,
        "profile_id": profile["profile_id"],
        **link_data.dict(),
        "position": position,
        "clicks": 0,
        "created_at": now
    }
    
    await db.links.insert_one(link_doc)
    
    return await db.links.find_one({"link_id": link_id}, {"_id": 0})

@api_router.put("/links/{link_id}")
async def update_link(link_id: str, update_data: LinkUpdate, user: dict = Depends(get_current_user)):
    """Update a link"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    link = await db.links.find_one({"link_id": link_id, "profile_id": profile["profile_id"]})
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    await db.links.update_one({"link_id": link_id}, {"$set": update_dict})
    
    return await db.links.find_one({"link_id": link_id}, {"_id": 0})

@api_router.delete("/links/{link_id}")
async def delete_link(link_id: str, user: dict = Depends(get_current_user)):
    """Delete a link"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    result = await db.links.delete_one({"link_id": link_id, "profile_id": profile["profile_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link not found")
    
    return {"message": "Link deleted"}

@api_router.put("/links/reorder")
async def reorder_links(reorder: LinksReorder, user: dict = Depends(get_current_user)):
    """Reorder links"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for i, link_id in enumerate(reorder.link_ids):
        await db.links.update_one(
            {"link_id": link_id, "profile_id": profile["profile_id"]},
            {"$set": {"position": i}}
        )
    
    links = await db.links.find({"profile_id": profile["profile_id"]}, {"_id": 0}).sort("position", 1).to_list(100)
    return links

# ==================== CONTACTS ROUTES ====================

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_my_contacts(user: dict = Depends(get_current_user)):
    """Get contacts collected by user's profile"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    contacts = await db.contacts.find({"profile_id": profile["profile_id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return contacts

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    """Delete a contact"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    result = await db.contacts.delete_one({"contact_id": contact_id, "profile_id": profile["profile_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return {"message": "Contact deleted"}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    """Get analytics for user's profile"""
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get total views
    total_views = profile.get("views", 0)
    
    # Get total link clicks
    links = await db.links.find({"profile_id": profile["profile_id"]}, {"_id": 0}).to_list(100)
    total_clicks = sum(link.get("clicks", 0) for link in links)
    
    # Get contacts count
    contacts_count = await db.contacts.count_documents({"profile_id": profile["profile_id"]})
    
    # Get recent analytics events
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    events = await db.analytics.find(
        {"profile_id": profile["profile_id"], "timestamp": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
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
        "links": links
    }

# ==================== PUBLIC PROFILE ROUTES ====================

@api_router.get("/public/{username}")
async def get_public_profile(username: str, request: Request):
    """Get public profile by username"""
    profile = await db.profiles.find_one({"username": username.lower()}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get active links
    links = await db.links.find(
        {"profile_id": profile["profile_id"], "is_active": True},
        {"_id": 0}
    ).sort("position", 1).to_list(100)
    
    # Record view
    await db.profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$inc": {"views": 1}}
    )
    
    await db.analytics.insert_one({
        "analytics_id": f"analytics_{uuid.uuid4().hex[:12]}",
        "profile_id": profile["profile_id"],
        "event_type": "view",
        "metadata": {
            "user_agent": request.headers.get("user-agent"),
            "referer": request.headers.get("referer")
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "profile": profile,
        "links": links
    }

@api_router.post("/public/{username}/click/{link_id}")
async def record_click(username: str, link_id: str):
    """Record link click"""
    profile = await db.profiles.find_one({"username": username.lower()}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    await db.links.update_one(
        {"link_id": link_id, "profile_id": profile["profile_id"]},
        {"$inc": {"clicks": 1}}
    )
    
    await db.analytics.insert_one({
        "analytics_id": f"analytics_{uuid.uuid4().hex[:12]}",
        "profile_id": profile["profile_id"],
        "event_type": "click",
        "metadata": {"link_id": link_id},
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"message": "Click recorded"}

@api_router.post("/public/{username}/contact")
async def submit_contact(username: str, contact_data: ContactCreate):
    """Submit contact form on public profile"""
    profile = await db.profiles.find_one({"username": username.lower()}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    contact_id = f"contact_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    contact_doc = {
        "contact_id": contact_id,
        "profile_id": profile["profile_id"],
        **contact_data.dict(),
        "created_at": now
    }
    
    await db.contacts.insert_one(contact_doc)
    
    await db.analytics.insert_one({
        "analytics_id": f"analytics_{uuid.uuid4().hex[:12]}",
        "profile_id": profile["profile_id"],
        "event_type": "contact_save",
        "metadata": {"contact_id": contact_id},
        "timestamp": now
    })
    
    return {"message": "Contact submitted", "contact_id": contact_id}

# ==================== PHYSICAL CARDS ROUTES ====================

@api_router.post("/cards/generate")
async def generate_cards(count: int = 10, batch_name: str = None):
    """Generate new physical cards (admin endpoint)"""
    cards = []
    now = datetime.now(timezone.utc)
    
    for _ in range(min(count, 100)):  # Max 100 cards at once
        card_id = f"FC{uuid.uuid4().hex[:8].upper()}"  # e.g., FC1A2B3C4D
        
        card_doc = {
            "card_id": card_id,
            "status": "unactivated",
            "user_id": None,
            "profile_id": None,
            "batch_name": batch_name,
            "activated_at": None,
            "created_at": now
        }
        
        await db.physical_cards.insert_one(card_doc)
        cards.append(card_id)
    
    return {"message": f"{len(cards)} cards generated", "card_ids": cards}

@api_router.get("/cards/{card_id}")
async def get_card_status(card_id: str):
    """Get physical card status - used for QR redirect"""
    card = await db.physical_cards.find_one({"card_id": card_id.upper()}, {"_id": 0})
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card["status"] == "activated" and card.get("profile_id"):
        # Card is activated - get the profile username for redirect
        profile = await db.profiles.find_one({"profile_id": card["profile_id"]}, {"_id": 0})
        if profile:
            return {
                "status": "activated",
                "redirect_to": f"/u/{profile['username']}",
                "username": profile["username"]
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
    card = await db.physical_cards.find_one({"card_id": card_id.upper()}, {"_id": 0})
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card["status"] == "activated":
        raise HTTPException(status_code=400, detail="Card already activated")
    
    # Get user's profile
    profile = await db.profiles.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Check if user already has an activated card
    existing_card = await db.physical_cards.find_one({
        "user_id": user["user_id"],
        "status": "activated"
    })
    
    # Activate the card
    now = datetime.now(timezone.utc)
    await db.physical_cards.update_one(
        {"card_id": card_id.upper()},
        {"$set": {
            "status": "activated",
            "user_id": user["user_id"],
            "profile_id": profile["profile_id"],
            "activated_at": now
        }}
    )
    
    return {
        "message": "Card activated successfully",
        "card_id": card_id.upper(),
        "profile_username": profile["username"]
    }

@api_router.get("/cards/user/my-cards")
async def get_my_cards(user: dict = Depends(get_current_user)):
    """Get all cards linked to current user"""
    cards = await db.physical_cards.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(100)
    
    return {"cards": cards}

@api_router.delete("/cards/{card_id}/unlink")
async def unlink_card(card_id: str, user: dict = Depends(get_current_user)):
    """Unlink a card from user's account (reset to unactivated)"""
    card = await db.physical_cards.find_one({
        "card_id": card_id.upper(),
        "user_id": user["user_id"]
    }, {"_id": 0})
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or not yours")
    
    await db.physical_cards.update_one(
        {"card_id": card_id.upper()},
        {"$set": {
            "status": "unactivated",
            "user_id": None,
            "profile_id": None,
            "activated_at": None
        }}
    )
    
    return {"message": "Card unlinked successfully"}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "FlexCard API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
